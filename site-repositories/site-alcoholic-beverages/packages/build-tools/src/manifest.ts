import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { contentTreeSha256 } from './content.js';
import { getSiteBuildData } from './pages.js';
import { publishedSearchRecords } from './pages.js';
import { writePublishedRecordFile, writeSiteSearch } from './search.js';

const CORE_VERSION = '0.1.0';
const SCHEMA_VERSION = 1;
const ASTRO_VERSION = '7.4.4';
const PAGEFIND_VERSION = '1.5.2';

function gitHead(workspaceRoot: string): string | null {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: workspaceRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function hashDirectoryTree(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  walk(dir);
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) {
    hash.update(path.relative(dir, file).split(path.sep).join('/'));
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export interface SiteArtifactSummary {
  siteKey: string;
  distDir: string;
  pageCount: number;
  publishedPages: number;
  previewPages: number;
  searchRecords: number;
  manifestPath: string;
  registryPath: string;
}

export async function writeSiteArtifacts(
  workspaceRoot: string,
  siteKey: string,
  distDir: string,
): Promise<SiteArtifactSummary> {
  const data = getSiteBuildData(siteKey, { workspaceRoot });
  const treeHash = contentTreeSha256(data.index);
  const searchRecords = await writeSiteSearch(data.index, siteKey, distDir);
  const absoluteRecords = publishedSearchRecords(data.index, {
    siteKey,
    absolute: true,
  });
  writePublishedRecordFile(workspaceRoot, siteKey, treeHash, absoluteRecords);

  fs.writeFileSync(
    path.join(distDir, 'entity-registry.json'),
    `${JSON.stringify(data.registry, null, 2)}\n`,
  );

  const contentFiles = [...data.index.records]
    .map((record) => ({
      repository: record.repo,
      path: record.relPath,
      sha256: record.sourceSha256,
      id: record.id,
      lang: record.lang,
      status: record.status,
    }))
    .sort((a, b) => `${a.repository}/${a.path}`.localeCompare(`${b.repository}/${b.path}`));

  const pages = data.pages.map((page) => ({
    path: page.path,
    canonical: page.canonical,
    id: page.id,
    lang: page.lang,
    status: page.status,
    published: page.published,
    noindex: page.noindex,
  }));

  const manifest: Record<string, unknown> = {
    manifestSchemaVersion: 1,
    siteKey,
    siteRepository: data.site.siteRepository,
    siteCommit: gitHead(workspaceRoot),
    host: data.site.host,
    siteUrl: `https://${data.site.host}`,
    buildMode: data.mode,
    generatedAt: new Date().toISOString(),
    coreVersion: CORE_VERSION,
    contentSchemaVersion: SCHEMA_VERSION,
    contractHashes: {
      types: hashFile(path.join(data.contracts.contractDir, 'types.json')),
      repositories: hashFile(path.join(data.contracts.contractDir, 'repositories.json')),
      relations: hashFile(path.join(data.contracts.contractDir, 'relations.json')),
    },
    toolVersions: {
      astro: ASTRO_VERSION,
      pagefind: PAGEFIND_VERSION,
      node: process.version,
    },
    contentCommits: null,
    contentCommitNote:
      'G2 local workspace has no remote commits yet; content identity is the file SHA256 tree below.',
    contentTreeSha256: treeHash,
    contentFiles,
    languages: ['zh', 'en'],
    pages,
    pageCounts: {
      total: pages.length,
      published: pages.filter((page) => page.published).length,
      preview: pages.filter((page) => !page.published).length,
    },
    search: {
      localBundle: 'pagefind/',
      localRecords: searchRecords,
      aggregateSource: '.hejiu/published/' + `${siteKey}.json`,
      includesPreview: false,
    },
    distTreeSha256ExcludingManifest: null as string | null,
    status: 'local-build',
    notes: [
      'No tokens or credentials are written into this manifest.',
      'distTreeSha256ExcludingManifest is filled by the release drill, not by this local build.',
    ],
  };

  const manifestPath = path.join(distDir, 'release-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const computed = hashDirectoryTreeExcluding(distDir, [
    'release-manifest.json',
    'entity-registry.json',
  ]);
  manifest.distTreeSha256ExcludingManifest = computed;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return {
    siteKey,
    distDir,
    pageCount: pages.length,
    publishedPages: pages.filter((page) => page.published).length,
    previewPages: pages.filter((page) => !page.published).length,
    searchRecords,
    manifestPath,
    registryPath: path.join(distDir, 'entity-registry.json'),
  };
}

function hashFile(file: string): string | null {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function hashDirectoryTreeExcluding(dir: string, excluded: string[]): string {
  const excludedSet = new Set(excluded);
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).split(path.sep).join('/');
      if (excludedSet.has(rel)) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  walk(dir);
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) {
    hash.update(path.relative(dir, file).split(path.sep).join('/'));
    hash.update('\0');
    hash.update(fs.readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}
