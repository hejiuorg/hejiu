import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { loadContracts, typeForName, findWorkspaceRoot } from './contracts.js';
import { collectRefKeys } from './markdown.js';
import { contentSchema } from './schema.js';
import type {
  ContentIndex,
  ContentRecord,
  Contracts,
  Entity,
  Frontmatter,
  Lang,
  Relation,
  ValidationIssue,
} from './types.js';

export function sha256(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function normalizedTextSha256(raw: string): string {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  return sha256(normalized);
}

export function recordKey(id: string, lang: Lang): string {
  return `${id}\u0000${lang}`;
}

function walkMarkdownFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(full);
      }
    }
  };
  walk(root);
  return files;
}

function parseFile(raw: string, file: string): { data: unknown; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) throw new Error('missing YAML front matter delimited by ---');
  const data = YAML.parse(match[1] ?? '');
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('YAML front matter must be an object');
  }
  return { data, body: (match[2] ?? '').trim() };
}

function issue(
  issues: ValidationIssue[],
  level: 'error' | 'warning',
  code: string,
  file: string,
  message: string,
): void {
  issues.push({ level, code, file, message });
}

export function effectiveRelations(contracts: Contracts, record: ContentRecord): Relation[] {
  const relations: Relation[] = [...record.frontmatter.related];
  const rules = contracts.relations.typedReferenceRelations[record.type] ?? {};
  for (const [field, relation] of Object.entries(rules)) {
    const value = record.frontmatter[field];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          relations.push({ relation, target_id: item });
        } else if (item && typeof item === 'object' && 'place_id' in item) {
          const placeId = (item as { place_id?: unknown }).place_id;
          if (typeof placeId === 'string') relations.push({ relation, target_id: placeId });
        }
      }
    } else if (typeof value === 'string') {
      relations.push({ relation, target_id: value });
    }
  }
  const seen = new Set<string>();
  return relations.filter((relation) => {
    const key = `${relation.relation}\u0000${relation.target_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function loadLegacyLedger(workspaceRoot: string): Set<string> | null {
  const ledgerPath = path.join(workspaceRoot, '..', 'docs', 'audit', 'legacy-ledger.json');
  const candidate = fs.existsSync(ledgerPath)
    ? ledgerPath
    : path.join(workspaceRoot, 'docs', 'audit', 'legacy-ledger.json');
  if (!fs.existsSync(candidate)) return null;
  const ledger = JSON.parse(fs.readFileSync(candidate, 'utf8')) as {
    records?: Array<{ legacyKey?: string }>;
  };
  return new Set(
    (ledger.records ?? [])
      .map((record) => record.legacyKey)
      .filter((key): key is string => typeof key === 'string'),
  );
}

export function loadMigrationMap(
  workspaceRoot: string,
): Map<string, { status: string; targetRefs: string[] }> | null {
  const file = path.join(workspaceRoot, 'migration', 'entity-map.json');
  if (!fs.existsSync(file)) return null;
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    records?: Array<{ legacyKey: string; status: string; targetRefs: string[] }>;
  };
  return new Map((parsed.records ?? []).map((record) => [record.legacyKey, record]));
}

export function loadContent(
  workspaceRoot = findWorkspaceRoot(),
  contracts = loadContracts(workspaceRoot),
): ContentIndex {
  const issues: ValidationIssue[] = [];
  const records: ContentRecord[] = [];
  const byIdLang = new Map<string, ContentRecord>();

  for (const site of contracts.sites) {
    const repoDir = path.join(workspaceRoot, 'content-repositories', site.contentRepository);
    if (!fs.existsSync(repoDir)) {
      issue(issues, 'error', 'repo-missing', site.contentRepository, 'content repository directory is missing');
      continue;
    }
    for (const lang of ['zh', 'en'] as const) {
      const langDir = path.join(repoDir, lang);
      for (const file of walkMarkdownFiles(langDir)) {
        const relPath = path.relative(repoDir, file).split(path.sep).join('/');
        if (path.basename(file) === 'README.md') continue;
        if (relPath.includes('/templates/')) continue;
        const segments = relPath.split('/');
        if (segments.length !== 3 || segments[0] !== lang) {
          issue(
            issues,
            'error',
            'path-shape',
            `${site.contentRepository}/${relPath}`,
            'content must live at {lang}/{type}/{slug}.md',
          );
          continue;
        }
        const raw = fs.readFileSync(file, 'utf8');
        let parsed: { data: unknown; body: string };
        try {
          parsed = parseFile(raw, file);
        } catch (error) {
          issue(
            issues,
            'error',
            'frontmatter-parse',
            `${site.contentRepository}/${relPath}`,
            (error as Error).message,
          );
          continue;
        }
        if (!parsed.body) {
          issue(
            issues,
            'error',
            'body-empty',
            `${site.contentRepository}/${relPath}`,
            'content body is empty',
          );
        }
        const result = contentSchema.safeParse(parsed.data);
        if (!result.success) {
          for (const problem of result.error.issues) {
            issue(
              issues,
              'error',
              'schema',
              `${site.contentRepository}/${relPath}`,
              `${problem.path.join('.') || '(root)'}: ${problem.message}`,
            );
          }
          continue;
        }
        const frontmatter = result.data as unknown as Frontmatter;
        if (frontmatter.lang !== lang) {
          issue(
            issues,
            'error',
            'lang-directory',
            `${site.contentRepository}/${relPath}`,
            `front matter lang ${frontmatter.lang} does not match directory ${lang}`,
          );
        }
        const type = contracts.types.find((entry) => entry.type === frontmatter.type);
        if (!type) {
          issue(
            issues,
            'error',
            'unknown-type',
            `${site.contentRepository}/${relPath}`,
            `unknown content type ${frontmatter.type}`,
          );
          continue;
        }
        if (frontmatter.id.split(':')[0] !== type.namespace) {
          issue(
            issues,
            'error',
            'namespace',
            `${site.contentRepository}/${relPath}`,
            `id namespace must be ${type.namespace} for type ${type.type}`,
          );
        }
        if (type.site !== site.key) {
          issue(
            issues,
            'error',
            'site-ownership',
            `${site.contentRepository}/${relPath}`,
            `type ${type.type} belongs to ${type.site}, not ${site.key}`,
          );
        }
        if (segments[1] !== frontmatter.type) {
          issue(
            issues,
            'warning',
            'directory-type',
            `${site.contentRepository}/${relPath}`,
            `directory ${segments[1]} differs from type ${frontmatter.type}`,
          );
        }
        if (segments[2] !== `${frontmatter.slug}.md`) {
          issue(
            issues,
            'error',
            'slug-file',
            `${site.contentRepository}/${relPath}`,
            'file name must be {slug}.md',
          );
        }
        const key = recordKey(frontmatter.id, frontmatter.lang);
        if (byIdLang.has(key)) {
          issue(
            issues,
            'error',
            'duplicate-id-lang',
            `${site.contentRepository}/${relPath}`,
            `duplicate record for ${frontmatter.id} (${frontmatter.lang})`,
          );
          continue;
        }
        const record: ContentRecord = {
          id: frontmatter.id,
          type: frontmatter.type,
          lang: frontmatter.lang,
          slug: frontmatter.slug,
          title: frontmatter.title,
          summary: frontmatter.summary,
          status: frontmatter.status,
          revision: frontmatter.revision,
          frontmatter,
          body: parsed.body,
          filePath: file,
          relPath,
          repo: site.contentRepository,
          sourceSha256: normalizedTextSha256(raw),
        };
        records.push(record);
        byIdLang.set(key, record);
      }
    }
  }

  const slugKeys = new Map<string, string>();
  const entities = new Map<string, Entity>();
  for (const record of records) {
    const type = typeForName(contracts, record.type);
    const slugKey = `${type.site}\u0000${record.type}\u0000${record.lang}\u0000${record.slug}`;
    const existingSlug = slugKeys.get(slugKey);
    if (existingSlug) {
      issue(
        issues,
        'error',
        'duplicate-slug',
        `${record.repo}/${record.relPath}`,
        `slug ${record.slug} is also used by ${existingSlug}`,
      );
    } else {
      slugKeys.set(slugKey, `${record.repo}/${record.relPath}`);
    }

    let entity = entities.get(record.id);
    if (!entity) {
      entity = {
        id: record.id,
        type: record.type,
        namespace: type.namespace,
        siteKey: type.site,
        typePath: type.path,
        zh: null,
        en: null,
      };
      entities.set(record.id, entity);
    }
    entity[record.lang] = record;
  }

  for (const entity of entities.values()) {
    if (!entity.zh) {
      issue(
        issues,
        'error',
        'missing-zh',
        entity.en ? `${entity.en.repo}/${entity.en.relPath}` : entity.id,
        `entity ${entity.id} has no Chinese source record`,
      );
    }
    if (entity.zh && entity.en) {
      if (entity.zh.type !== entity.en.type) {
        issue(
          issues,
          'error',
          'translation-type',
          `${entity.en.repo}/${entity.en.relPath}`,
          'translation type differs from the Chinese source',
        );
      }
      if (entity.zh.slug !== entity.en.slug) {
        issue(
          issues,
          'warning',
          'translation-slug',
          `${entity.en.repo}/${entity.en.relPath}`,
          'translation slug differs from the Chinese source',
        );
      }
      const expectedHash = entity.zh.sourceSha256;
      const declaredHash = entity.en.frontmatter.source_sha256;
      const revision = entity.en.frontmatter.source_revision ?? '';
      if (declaredHash !== expectedHash) {
        issue(
          issues,
          entity.en.frontmatter.translation_status === 'reviewed' ? 'error' : 'warning',
          'translation-hash',
          `${entity.en.repo}/${entity.en.relPath}`,
          'source_sha256 does not match the current Chinese source file',
        );
      }
      if (revision.startsWith('sha256:')) {
        if (revision.slice('sha256:'.length) !== expectedHash) {
          issue(
            issues,
            'error',
            'translation-revision',
            `${entity.en.repo}/${entity.en.relPath}`,
            'source_revision hash does not match the current Chinese source file',
          );
        }
      } else {
        issue(
          issues,
          'warning',
          'translation-revision-unverified',
          `${entity.en.repo}/${entity.en.relPath}`,
          'source_revision is not a local sha256: revision and cannot be verified in this workspace',
        );
      }
      if (entity.en.status === 'reviewed' && entity.zh.status !== 'reviewed') {
        issue(
          issues,
          'error',
          'translation-source-status',
          `${entity.en.repo}/${entity.en.relPath}`,
          'a reviewed translation requires a reviewed Chinese source',
        );
      }
    }
  }

  const ledger = loadLegacyLedger(workspaceRoot);
  const migrationMap = loadMigrationMap(workspaceRoot);

  for (const record of records) {
    const file = `${record.repo}/${record.relPath}`;
    const relations = effectiveRelations(contracts, record);
    const required = contracts.relations.required[record.type] ?? [];
    for (const relation of relations) {
      const rule = contracts.relations.relations.find((entry) => entry.key === relation.relation);
      if (!rule) {
        issue(issues, 'error', 'relation-key', file, `unknown relation ${relation.relation}`);
        continue;
      }
      if (!rule.from.includes(record.type)) {
        issue(
          issues,
          'error',
          'relation-source',
          file,
          `relation ${relation.relation} cannot start from type ${record.type}`,
        );
      }
      if (relation.target_id === record.id) {
        issue(issues, 'error', 'relation-self', file, 'an entity cannot relate to itself');
      }
      const target = entities.get(relation.target_id);
      if (!target) {
        issue(
          issues,
          required.includes(relation.relation) ? 'error' : 'warning',
          'relation-target-missing',
          file,
          `relation ${relation.relation} points to missing entity ${relation.target_id}`,
        );
        continue;
      }
      if (!rule.to.includes('*') && !rule.to.includes(target.type)) {
        issue(
          issues,
          'error',
          'relation-target-type',
          file,
          `relation ${relation.relation} cannot target type ${target.type}`,
        );
      }
    }
    for (const key of required) {
      const found = relations.some((relation) => {
        if (relation.relation !== key) return false;
        return entities.has(relation.target_id);
      });
      if (!found) {
        issue(
          issues,
          'error',
          'required-relation',
          file,
          `type ${record.type} requires at least one ${key} relation`,
        );
      }
    }

    const referenceKeys = new Set<string>();
    for (const reference of record.frontmatter.references) {
      if (referenceKeys.has(reference.key)) {
        issue(issues, 'error', 'reference-duplicate', file, `duplicate reference key ${reference.key}`);
      }
      referenceKeys.add(reference.key);
      if (!entities.has(reference.target_id)) {
        issue(
          issues,
          'error',
          'reference-target',
          file,
          `reference ${reference.key} points to missing entity ${reference.target_id}`,
        );
      }
    }
    for (const key of collectRefKeys(record.body)) {
      if (!referenceKeys.has(key)) {
        issue(
          issues,
          'error',
          'reference-undeclared',
          file,
          `body uses ref:${key} but it is not declared in references`,
        );
      }
    }
    for (const key of referenceKeys) {
      if (!collectRefKeys(record.body).includes(key)) {
        issue(issues, 'warning', 'reference-unused', file, `reference ${key} is not used in the body`);
      }
    }

    for (const legacyRef of record.frontmatter.legacy_refs) {
      if (ledger && !ledger.has(legacyRef)) {
        issue(issues, 'error', 'legacy-ref', file, `legacy_refs contains unknown key ${legacyRef}`);
      }
      if (migrationMap) {
        const mapping = migrationMap.get(legacyRef);
        if (!mapping) {
          issue(
            issues,
            'warning',
            'legacy-map-missing',
            file,
            `legacy record ${legacyRef} is not registered in migration/entity-map.json`,
          );
        } else {
          if (mapping.status === 'pending-classification') {
            issue(
              issues,
              'error',
              'legacy-map-pending',
              file,
              `legacy record ${legacyRef} is still pending classification`,
            );
          }
          if (!mapping.targetRefs.includes(record.id)) {
            issue(
              issues,
              'error',
              'legacy-map-target',
              file,
              `migration map for ${legacyRef} does not include target ${record.id}`,
            );
          }
        }
      }
    }
  }

  return { contracts, records, entities, byIdLang, issues, workspaceRoot };
}

export function contentTreeSha256(index: ContentIndex): string {
  const lines = [...index.records]
    .sort((a, b) => `${a.repo}/${a.relPath}`.localeCompare(`${b.repo}/${b.relPath}`))
    .map((record) => `${record.repo}/${record.relPath}:${record.sourceSha256}`)
    .join('\n');
  return sha256(lines);
}

export function recordPublication(
  record: ContentRecord,
  index: ContentIndex,
): { published: boolean; outdated: boolean; reason: string | null } {
  if (record.status !== 'reviewed') {
    return { published: false, outdated: false, reason: 'status-not-reviewed' };
  }
  if (record.frontmatter.rights.status !== 'allowed') {
    return { published: false, outdated: false, reason: 'rights-not-allowed' };
  }
  if (record.lang === 'zh') return { published: true, outdated: false, reason: null };
  const zh = index.byIdLang.get(recordKey(record.id, 'zh'));
  if (!zh) return { published: false, outdated: false, reason: 'source-missing' };
  if (record.frontmatter.translation_status !== 'reviewed') {
    return {
      published: false,
      outdated: record.frontmatter.translation_status === 'outdated',
      reason: 'translation-not-reviewed',
    };
  }
  if (record.frontmatter.source_sha256 !== zh.sourceSha256) {
    return { published: false, outdated: true, reason: 'translation-source-changed' };
  }
  if (zh.status !== 'reviewed') {
    return { published: false, outdated: false, reason: 'source-not-reviewed' };
  }
  return { published: true, outdated: false, reason: null };
}

export function entityLabel(entity: Entity, lang: Lang): string {
  return entity[lang]?.title ?? entity.zh?.title ?? entity.en?.title ?? entity.id;
}

export function errorsOnly(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((entry) => entry.level === 'error');
}
