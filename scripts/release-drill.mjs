import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mainDist = path.join(root, 'site-repositories', 'site-alcoholic-beverages', 'apps', 'main', 'dist');
const aggregatePath = path.join(mainDist, 'all-search');
const aggregateManifest = path.join(aggregatePath, 'aggregate-manifest.json');
const publishedDir = path.join(root, '.hejiu', 'published');
const cli = path.join(
  root,
  'site-repositories',
  'site-alcoholic-beverages',
  'packages',
  'build-tools',
  'dist',
  'cli.js',
);
const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function runAggregate() {
  return spawnSync(process.execPath, [cli, 'aggregate'], {
    cwd: root,
    env: { ...process.env, HEJIU_BUILD_MODE: 'production' },
    encoding: 'utf8',
  });
}

if (!fs.existsSync(aggregateManifest)) throw new Error('Build the production aggregate first');
const beforePath = `${aggregatePath}.drill-before`;
fs.rmSync(beforePath, { recursive: true, force: true });
fs.cpSync(aggregatePath, beforePath, { recursive: true });
const before = {
  manifestHash: hash(aggregateManifest),
  pagefindExists: fs.existsSync(path.join(aggregatePath, 'pagefind.js')),
  recordCount: JSON.parse(fs.readFileSync(aggregateManifest, 'utf8')).recordCount,
};

const guideSource = path.join(publishedDir, 'guide.json');
const guideBackup = `${guideSource}.drill-bak`;
fs.copyFileSync(guideSource, guideBackup);
fs.rmSync(guideSource);
const failedRun = runAggregate();
record('aggregate failure exits non-zero', failedRun.status !== 0, `status=${failedRun.status}`);
const afterFailure = {
  manifestHash: hash(aggregateManifest),
  pagefindExists: fs.existsSync(path.join(aggregatePath, 'pagefind.js')),
};
record(
  'aggregate failure preserves the previous index',
  afterFailure.manifestHash === before.manifestHash && afterFailure.pagefindExists,
  `${afterFailure.manifestHash.slice(0, 12)}/${before.manifestHash.slice(0, 12)}`,
);
fs.renameSync(guideBackup, guideSource);

const successRun = runAggregate();
record('aggregate retry succeeds', successRun.status === 0, `status=${successRun.status}`);
const residual = fs.readdirSync(mainDist).filter((name) => name.startsWith('all-search.tmp') || name.startsWith('all-search.old'));
record('atomic aggregate leaves no temporary directories', residual.length === 0, residual.join(','));
const afterSuccess = JSON.parse(fs.readFileSync(aggregateManifest, 'utf8'));
record(
  'aggregate retry keeps published-only scope and 166 records',
  afterSuccess.scope === 'published-only' && afterSuccess.recordCount === 166 && afterSuccess.sources.length === 4,
  JSON.stringify({ scope: afterSuccess.scope, records: afterSuccess.recordCount, sources: afterSuccess.sources.length }),
);

const publishedFiles = fs.readdirSync(publishedDir).filter((file) => file.endsWith('.json'));
const urls = publishedFiles.flatMap((file) =>
  JSON.parse(fs.readFileSync(path.join(publishedDir, file), 'utf8')).records.map((recordEntry) => recordEntry.url),
);
record('all published search URLs are HTTPS production URLs', urls.every((url) => url.startsWith('https://')), `${urls.length}`);
record('no localhost URLs leak into production search', urls.every((url) => !url.includes('127.0.0.1') && !url.includes('localhost')), '');

function walkHtml(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, result);
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}
const htmlFiles = walkHtml(mainDist);
const previewPages = htmlFiles.filter((file) =>
  fs.readFileSync(file, 'utf8').includes('name="hejiu-content-state" content="preview"'),
);
record('production HTML contains no preview page', previewPages.length === 0, `${previewPages.length}`);

fs.rmSync(aggregatePath, { recursive: true, force: true });
fs.cpSync(beforePath, aggregatePath, { recursive: true });
fs.rmSync(beforePath, { recursive: true, force: true });
record(
  'original aggregate artifact restored after drill',
  hash(path.join(aggregatePath, 'aggregate-manifest.json')) === before.manifestHash,
  '',
);

const snapshotPath = path.join(root, 'release', 'snapshot.json');
if (fs.existsSync(snapshotPath)) {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  record(
    'snapshot aggregate count matches current manifest',
    snapshot.aggregate.recordCount === afterSuccess.recordCount,
    `${snapshot.aggregate.recordCount}/${afterSuccess.recordCount}`,
  );
  record(
    'snapshot records 166 source-verified, 0 archive and 0 blocked',
    snapshot.excludedContent.sourceVerifiedRecords === 166 && snapshot.excludedContent.archiveRecords === 0 && snapshot.excludedContent.reviewBlocked === 0 && snapshot.excludedContent.draftRecords === 1,
    JSON.stringify(snapshot.excludedContent),
  );
} else {
  record('snapshot exists', false, 'release/snapshot.json missing');
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  checks,
  limitations: [
    'No remote GitHub Pages deployment, DNS or custom-domain test was performed.',
    'No old service-worker client upgrade was tested.',
    'Slug-change compatibility and cross-site two-phase activation are not exercised by this content batch.',
    'This drill tests aggregate failure preservation and local snapshot consistency, not a full server rollback.',
  ],
};
fs.writeFileSync(path.join(root, 'evidence', 'G5-release-drill.json'), `${JSON.stringify(output, null, 2)}\n`);
const failed = checks.filter((check) => !check.ok);
console.log(JSON.stringify({ checks: checks.length, failures: failed.length, before: before.recordCount, after: afterSuccess.recordCount }, null, 2));
if (failed.length > 0) process.exitCode = 1;
