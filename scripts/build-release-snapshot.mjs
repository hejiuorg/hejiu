import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const allowDirty = process.argv.includes('--allow-dirty');
const sites = [
  ['beverages', 'site-alcoholic-beverages/apps/main'],
  ['guide', 'site-alcohol-guide/apps/site'],
  ['culture', 'site-alcohol-culture/apps/site'],
  ['atlas', 'site-alcohol-atlas/apps/site'],
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function treeHash(dir, excluded = new Set()) {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const relative = path.relative(dir, full).split(path.sep).join('/');
      if (excluded.has(relative)) continue;
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
  return { sha256: hash.digest('hex'), files: files.length };
}

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

const head = git(['rev-parse', 'HEAD']);
const status = git(['status', '--porcelain']) ?? '';
if (!allowDirty && status) {
  console.error('Working tree is dirty; commit first or pass --allow-dirty.');
  process.exit(2);
}

const siteEntries = [];
let contentTree = null;
let siteCommit = null;
let totalPublished = 0;
let totalSearch = 0;
for (const [key, relative] of sites) {
  const dist = path.join(root, 'site-repositories', relative, 'dist');
  const manifestPath = path.join(dist, 'release-manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`Missing manifest for ${key}: ${manifestPath}`);
  const manifest = readJson(manifestPath);
  if (manifest.buildMode !== 'production') throw new Error(`${key} is not a production build`);
  if (contentTree && manifest.contentTreeSha256 !== contentTree) {
    throw new Error(`${key} content tree differs from other sites`);
  }
  contentTree = manifest.contentTreeSha256;
  if (siteCommit && manifest.siteCommit !== siteCommit) {
    throw new Error(`${key} siteCommit differs from other sites`);
  }
  siteCommit = manifest.siteCommit;
  const artifact = treeHash(dist, new Set(['release-manifest.json', 'entity-registry.json']));
  if (manifest.pageCounts.preview !== 0) throw new Error(`${key} contains preview pages in production`);
  totalPublished += manifest.pageCounts.published;
  totalSearch += manifest.search.localRecords;
  siteEntries.push({
    key,
    host: manifest.host,
    buildMode: manifest.buildMode,
    siteCommit: manifest.siteCommit,
    contentTreeSha256: manifest.contentTreeSha256,
    pageCounts: manifest.pageCounts,
    searchRecords: manifest.search.localRecords,
    artifactSha256: artifact.sha256,
    artifactFiles: artifact.files,
    manifestSha256: hashFile(manifestPath),
    manifestDistTreeSha256: manifest.distTreeSha256ExcludingManifest,
  });
}

const mainDist = path.join(root, 'site-repositories', 'site-alcoholic-beverages', 'apps', 'main', 'dist');
const aggregate = readJson(path.join(mainDist, 'all-search', 'aggregate-manifest.json'));
if (aggregate.scope !== 'published-only') throw new Error('Aggregate search is not published-only');
if (aggregate.sources.length !== 4) throw new Error('Aggregate search does not cover four sites');
const aggregateSourceRecords = aggregate.sources.reduce((sum, source) => sum + source.recordCount, 0);
if (aggregateSourceRecords !== aggregate.recordCount) throw new Error('Aggregate source counts do not add up');
if (aggregate.recordCount !== totalSearch) throw new Error('Aggregate record count differs from local search totals');

const registry = readJson(path.join(mainDist, 'entity-registry.json'));
if (registry.counts.previewPages !== 0) throw new Error('Entity registry contains preview pages in production');

const review = readJson(path.join(root, 'migration', 'content-review.json'));
const lockHash = hashFile(path.join(root, 'package-lock.json'));
const snapshot = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  releaseId: `${String(siteCommit ?? head).slice(0, 7)}-${String(contentTree).slice(0, 12)}`,
  workspaceCommit: head,
  siteCommit,
  dirtyWorkingTree: Boolean(status),
  contentTreeSha256: contentTree,
  contentCommitNote:
    'Local one-workspace build. Content identity is contentTreeSha256; remote eight-repository commits are not created yet.',
  coreVersion: '0.1.0',
  schemaVersionContent: 1,
  lockSha256: lockHash,
  versions: {
    node: process.version,
    npm: process.env.npm_config_user_agent ?? null,
    astro: '7.4.4',
    pagefind: '1.5.2',
  },
  sites: siteEntries,
  aggregate: {
    scope: aggregate.scope,
    recordCount: aggregate.recordCount,
    sources: aggregate.sources,
  },
  registry: {
    counts: registry.counts,
    entities: registry.entities.length,
  },
  publishedPages: totalPublished,
  localSearchRecords: totalSearch,
  excludedContent: {
    reviewRecords: review.summary.recordsProcessed,
    reviewPass: review.summary.recordPass,
    reviewBlocked: review.summary.recordBlocked,
    draftRecords: review.summary.draftRecords,
    sourceVerifiedRecords: review.summary.sourceVerifiedRecords,
    archiveRecords: review.summary.archiveRecords,
  },
  checks: {
    fourProductionSites: siteEntries.length === 4,
    allSitesSameContentTree: new Set(siteEntries.map((site) => site.contentTreeSha256)).size === 1,
    allSitesSameCommit: new Set(siteEntries.map((site) => site.siteCommit)).size === 1,
    noPreviewPages: siteEntries.every((site) => site.pageCounts.preview === 0),
    publishedPagesMatch: totalPublished === 166,
    localSearchMatchesPublished: totalSearch === totalPublished,
    aggregatePublishedOnly: aggregate.scope === 'published-only',
    aggregateMatchesLocalSearch: aggregate.recordCount === totalSearch,
    aggregateCoversFourSites: aggregate.sources.length === 4,
    registryNoPreview: registry.counts.previewPages === 0,
    sourceVerifiedRecords: review.summary.sourceVerifiedRecords === 166,
    noArchiveRecords: review.summary.archiveRecords === 0,
    noBlockedRecords: review.summary.recordBlocked === 0,
    oneDraftTaxonomyContainer: review.summary.draftRecords === 1,
    cleanWorkingTree: !status,
  },
};

const failed = Object.entries(snapshot.checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`Release snapshot checks failed: ${failed.join(', ')}`);

fs.mkdirSync(path.join(root, 'release'), { recursive: true });
fs.writeFileSync(path.join(root, 'release', 'snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'evidence', 'G5-release-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
console.log(JSON.stringify({ releaseId: snapshot.releaseId, checks: snapshot.checks, sites: siteEntries.map((site) => ({ key: site.key, pages: site.pageCounts.published, artifact: site.artifactSha256.slice(0, 12) })), aggregate: snapshot.aggregate.recordCount }, null, 2));
