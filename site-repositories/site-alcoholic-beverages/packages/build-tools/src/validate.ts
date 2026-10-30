import fs from 'node:fs';
import path from 'node:path';
import { checkCatalogs } from './catalogs.js';
import { loadContracts } from './contracts.js';
import { loadContent, sha256 } from './content.js';
import type { ContentIndex, Contracts, ValidationIssue } from './types.js';

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function markdownTableFirstCells(file: string): string[] {
  if (!fs.existsSync(file)) return [];
  const cells: string[] = [];
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    if (/^\|\s*-+/.test(line)) continue;
    const first = line.split('|')[1]?.trim() ?? '';
    const match = /^`([^`]+)`$/.exec(first);
    if (match?.[1]) cells.push(match[1]);
  }
  return cells;
}

function checkContractSources(
  workspaceRoot: string,
  contracts: Contracts,
  addIssue: (issue: ValidationIssue) => void,
): void {
  const sourceFile = path.join(contracts.contractDir, 'contract-sources.json');
  if (!fs.existsSync(sourceFile)) {
    addIssue({
      level: 'error',
      code: 'contract-sources-missing',
      file: 'packages/contracts/contract-sources.json',
      message: 'contract source manifest is missing',
    });
    return;
  }
  const manifest = readJson<{
    sourceFiles: Array<{ file: string; origin: string; sha256: string }>;
  }>(sourceFile);
  for (const entry of manifest.sourceFiles) {
    const local = path.join(contracts.contractDir, entry.file);
    if (!fs.existsSync(local)) {
      addIssue({
        level: 'error',
        code: 'contract-copy-missing',
        file: local,
        message: `contract copy ${entry.file} is missing`,
      });
      continue;
    }
    const localHash = sha256(fs.readFileSync(local));
    if (localHash !== entry.sha256) {
      addIssue({
        level: 'error',
        code: 'contract-copy-hash',
        file: local,
        message: `${entry.file} does not match the recorded contract hash`,
      });
    }
    const origin = path.join(workspaceRoot, '..', entry.origin);
    if (fs.existsSync(origin)) {
      const originHash = sha256(fs.readFileSync(origin));
      if (originHash !== entry.sha256) {
        addIssue({
          level: 'error',
          code: 'contract-origin-hash',
          file: origin,
          message: `${entry.origin} changed since the contract copy; review and version the change`,
        });
      }
    }
  }
}

function checkTaxonomy(
  workspaceRoot: string,
  index: ContentIndex,
  addIssue: (issue: ValidationIssue) => void,
): void {
  const repo = path.join(workspaceRoot, 'content-repositories', 'alcoholic-beverages');
  const tagsFile = path.join(repo, 'shared', 'taxonomy', 'legacy-tags.md');
  const categoriesFile = path.join(repo, 'shared', 'taxonomy', 'legacy-categories.md');
  const baselinePath = path.join(workspaceRoot, '..', 'docs', 'audit', 'source-baseline.json');

  if (!fs.existsSync(tagsFile)) {
    addIssue({
      level: 'error',
      code: 'taxonomy-tags-missing',
      file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-tags.md',
      message: 'legacy tag mapping is missing',
    });
  }
  if (!fs.existsSync(categoriesFile)) {
    addIssue({
      level: 'error',
      code: 'taxonomy-categories-missing',
      file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-categories.md',
      message: 'legacy category mapping is missing',
    });
  }

  if (fs.existsSync(baselinePath)) {
    const baseline = readJson<{
      diagnostics: {
        unregisteredTagReferences: Array<{ tag: string }>;
        unregisteredCategories: Array<{ legacyKey: string; category: string }>;
      };
    }>(baselinePath);
    const expectedTags = new Set(
      baseline.diagnostics.unregisteredTagReferences.map((entry) => entry.tag),
    );
    const mappedTags = new Set(markdownTableFirstCells(tagsFile));
    for (const tag of expectedTags) {
      if (!mappedTags.has(tag)) {
        addIssue({
          level: 'error',
          code: 'taxonomy-tag-unmapped',
          file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-tags.md',
          message: `unregistered legacy tag ${tag} has no mapping row`,
        });
      }
    }
    const categoriesText = fs.existsSync(categoriesFile)
      ? fs.readFileSync(categoriesFile, 'utf8')
      : '';
    for (const entry of baseline.diagnostics.unregisteredCategories) {
      if (!categoriesText.includes(entry.legacyKey)) {
        addIssue({
          level: 'error',
          code: 'taxonomy-category-unmapped',
          file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-categories.md',
          message: `legacy category issue for ${entry.legacyKey} is missing`,
        });
      }
    }
    if (categoriesText && !categoriesText.includes('yellow_wine')) {
      addIssue({
        level: 'error',
        code: 'taxonomy-huangjiu-target',
        file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-categories.md',
        message: 'huangjiu alias must map explicitly to yellow_wine',
      });
    }
  }

  const subcategoriesFile = path.join(repo, 'shared', 'taxonomy', 'legacy-subcategories.md');
  const metadataCategoriesFile = path.join(
    workspaceRoot,
    'migration',
    'metadata',
    'categories.json',
  );
  if (!fs.existsSync(subcategoriesFile)) {
    addIssue({
      level: 'error',
      code: 'taxonomy-subcategories-missing',
      file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-subcategories.md',
      message: 'legacy subcategory mapping is missing',
    });
  } else if (fs.existsSync(metadataCategoriesFile)) {
    const metadataCategories = readJson<Array<{ id: string; subcategories?: Array<{ id: string }> }>>(
      metadataCategoriesFile,
    );
    const expected = new Set<string>();
    for (const category of metadataCategories) {
      for (const sub of category.subcategories ?? []) expected.add(`${category.id}/${sub.id}`);
    }
    const mapped = new Set(markdownTableFirstCells(subcategoriesFile));
    for (const key of expected) {
      if (!mapped.has(key)) {
        addIssue({
          level: 'error',
          code: 'taxonomy-subcategory-unmapped',
          file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-subcategories.md',
          message: `legacy subcategory ${key} has no mapping row`,
        });
      }
    }
    for (const line of fs.readFileSync(subcategoriesFile, 'utf8').split(/\r?\n/)) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line.split('|').map((cell) => cell.trim());
      const targetCell = cells[4] ?? '';
      const target = /^`([^`]+)`$/.exec(targetCell)?.[1];
      if (target && !index.entities.has(target)) {
        addIssue({
          level: 'error',
          code: 'taxonomy-subcategory-target',
          file: 'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-subcategories.md',
          message: `subcategory mapping points to missing entity ${target}`,
        });
      }
    }
  }

  const ingredientsFile = path.join(
    workspaceRoot,
    'content-repositories',
    'alcohol-guide',
    'shared',
    'ingredients.md',
  );
  const ingredientKeys = new Set(markdownTableFirstCells(ingredientsFile));
  for (const record of index.records) {
    if (record.type !== 'recipe') continue;
    const ingredients = (record.frontmatter.ingredients ?? []) as Array<{
      ingredient_key?: string;
    }>;
    for (const ingredient of ingredients) {
      if (ingredient.ingredient_key && !ingredientKeys.has(ingredient.ingredient_key)) {
        addIssue({
          level: 'error',
          code: 'ingredient-key',
          file: `${record.repo}/${record.relPath}`,
          message: `ingredient_key ${ingredient.ingredient_key} is not in alcohol-guide/shared/ingredients.md`,
        });
      }
    }
  }
}

function checkMigration(
  workspaceRoot: string,
  index: ContentIndex,
  addIssue: (issue: ValidationIssue) => void,
): void {
  const ledgerPath = path.join(workspaceRoot, '..', 'docs', 'audit', 'legacy-ledger.json');
  const mapPath = path.join(workspaceRoot, 'migration', 'entity-map.json');
  if (!fs.existsSync(ledgerPath)) return;
  const ledger = readJson<{ records: Array<{ legacyKey: string; expectedContentRepository: string }> }>(
    ledgerPath,
  );
  const ledgerKeys = new Set(ledger.records.map((record) => record.legacyKey));
  if (!fs.existsSync(mapPath)) {
    addIssue({
      level: 'error',
      code: 'migration-map-missing',
      file: 'migration/entity-map.json',
      message: 'migration map is missing',
    });
    return;
  }
  const map = readJson<{
    records: Array<{
      legacyKey: string;
      status: string;
      targetRefs: string[];
      reason?: string;
    }>;
  }>(mapPath);
  const validStatuses = new Set([
    'pending-classification',
    'migrated-needs-review',
    'reviewed',
    'merged',
    'split',
    'retired',
  ]);
  const mappedKeys = new Set(map.records.map((entry) => entry.legacyKey));
  for (const row of ledger.records) {
    if (!mappedKeys.has(row.legacyKey)) {
      addIssue({
        level: 'error',
        code: 'migration-row-missing',
        file: 'migration/entity-map.json',
        message: `${row.legacyKey} has no migration-map row`,
      });
    }
  }
  for (const entry of map.records) {
    if (!['pending-classification', 'retired'].includes(entry.status) && entry.targetRefs.length === 0) {
      addIssue({
        level: 'error',
        code: 'migration-target-empty',
        file: 'migration/entity-map.json',
        message: `${entry.legacyKey} is marked ${entry.status} without a target`,
      });
    }
    if (!ledgerKeys.has(entry.legacyKey)) {
      addIssue({
        level: 'error',
        code: 'migration-key',
        file: 'migration/entity-map.json',
        message: `${entry.legacyKey} is not in the handoff ledger`,
      });
    }
    if (!validStatuses.has(entry.status)) {
      addIssue({
        level: 'error',
        code: 'migration-status',
        file: 'migration/entity-map.json',
        message: `${entry.legacyKey} has invalid status ${entry.status}`,
      });
    }
    for (const target of entry.targetRefs) {
      if (!index.entities.has(target)) {
        addIssue({
          level: 'error',
          code: 'migration-target',
          file: 'migration/entity-map.json',
          message: `${entry.legacyKey} points to unknown entity ${target}`,
        });
      }
    }
    if (['merged', 'split', 'retired'].includes(entry.status) && !entry.reason) {
      addIssue({
        level: 'error',
        code: 'migration-reason',
        file: 'migration/entity-map.json',
        message: `${entry.legacyKey} status ${entry.status} needs a reason`,
      });
    }
  }
}

export interface ValidationReport {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    records: number;
    entities: number;
    publishedRecords: number;
    contentTreeSha256: string;
    migrationMapped: number;
    migrationPending: number;
  };
}

export function validateAll(workspaceRoot: string): ValidationReport {
  const contracts = loadContracts(workspaceRoot);
  const index = loadContent(workspaceRoot, contracts);
  const issues: ValidationIssue[] = [...index.issues];
  const addIssue = (issue: ValidationIssue): void => {
    issues.push(issue);
  };
  checkContractSources(workspaceRoot, contracts, addIssue);
  checkTaxonomy(workspaceRoot, index, addIssue);
  checkCatalogs(workspaceRoot, contracts, addIssue);
  checkMigration(workspaceRoot, index, addIssue);

  const mapPath = path.join(workspaceRoot, 'migration', 'entity-map.json');
  let migrationMapped = 0;
  let migrationPending = 0;
  if (fs.existsSync(mapPath)) {
    const map = readJson<{ records: Array<{ status: string }> }>(mapPath);
    migrationMapped = map.records.filter((entry) => entry.status !== 'pending-classification').length;
    migrationPending = map.records.filter((entry) => entry.status === 'pending-classification').length;
  }

  const publishedRecords = [...index.byIdLang.values()].filter((record) => {
    if (record.status !== 'reviewed' || record.frontmatter.rights.status !== 'allowed') return false;
    if (record.lang === 'zh') return true;
    const zh = index.byIdLang.get(`${record.id}\u0000zh`);
    return Boolean(
      zh &&
        zh.status === 'reviewed' &&
        record.frontmatter.translation_status === 'reviewed' &&
        record.frontmatter.source_sha256 === zh.sourceSha256,
    );
  }).length;

  return {
    errors: issues.filter((issue) => issue.level === 'error'),
    warnings: issues.filter((issue) => issue.level === 'warning'),
    summary: {
      records: index.records.length,
      entities: index.entities.size,
      publishedRecords,
      contentTreeSha256: sha256(
        [...index.records]
          .sort((a, b) => `${a.repo}/${a.relPath}`.localeCompare(`${b.repo}/${b.relPath}`))
          .map((record) => `${record.repo}/${record.relPath}:${record.sourceSha256}`)
          .join('\n'),
      ),
      migrationMapped,
      migrationPending,
    },
  };
}
