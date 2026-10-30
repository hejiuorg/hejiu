import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const ledger = read('../docs/audit/legacy-ledger.json');
const map = read('migration/entity-map.json');
const fields = read('migration/legacy-field-map.json');
const routes = read('migration/legacy-routes.json');
const report = read('migration/report.json');
const prototype = read('migration/prototype-samples.json');
const review = read('migration/content-review.json');
const generated = read('migration/generated-files.json');
const retiredManifest = read('migration/retired-records.json');
const retiredPaths = new Set(retiredManifest.retired.map((entry) => entry.relative));
const categories = read('migration/metadata/categories.json');

const failures = [];
const checks = {};
const record = (name, ok, detail = '') => {
  checks[name] = { ok, detail };
  if (!ok) failures.push({ name, detail });
};

const mapped = map.records.filter((row) => row.targetRefs.length > 0);
const retired = map.records.filter((row) => row.status === 'retired');
const pending = map.records.filter((row) => row.status === 'pending-classification');
record('all 602 ledger rows have a migration row', map.records.length === ledger.records.length && map.records.length === 602, `${map.records.length}`);
record('all ledger rows are mapped or explicitly retired', mapped.length + retired.length === 602, `${mapped.length}+${retired.length}`);
record('no pending classification', pending.length === 0, `${pending.length}`);
record('field map covers every row', fields.records.length === 602, `${fields.records.length}`);
record('generated file list is present', generated.length >= 600, `${generated.length}`);
record(
  'generated content files exist or are in the retirement manifest',
  generated.every((relative) => fs.existsSync(path.join(root, relative)) || retiredPaths.has(relative)),
  '',
);
record('detail route coverage is 602', routes.coverage.detailRows === 602 && routes.coverage.detailRowsWithTargets === 48 && routes.coverage.detailRowsRetired === 554, JSON.stringify(routes.coverage));
record('category route coverage is 17', routes.coverage.categories === categories.length && categories.length === 17, String(routes.coverage.categories));
record('subcategory route coverage is 93', routes.coverage.subcategories === 93, String(routes.coverage.subcategories));
record('region/country/continent/tag coverage present', routes.coverage.provinces >= 64 && routes.coverage.countries === 43 && routes.coverage.continents === 6 && routes.coverage.tags === 397, JSON.stringify(routes.coverage));
record('every retained detail route has a primary target', routes.records.filter((entry) => entry.status === 'published').every((entry) => entry.primaryTarget) && routes.records.filter((entry) => entry.status === 'published').length === 48, '');
record('no migration conflicts', report.conflicts.length === 0, String(report.conflicts.length));
record('prototype samples accounted for', prototype.counts.guides === 6 && prototype.counts.stories === 3 && prototype.counts.migrated + prototype.counts.pending === 9, JSON.stringify(prototype.counts));
record('metadata categories preserved', categories.length === 17, String(categories.length));
record('all 167 records have review decisions', review.summary.recordsProcessed === 167 && review.records.length === 167, `${review.summary.recordsProcessed}`);
record('166 source-verified / 0 archive / 0 blocked / 1 draft', review.summary.sourceVerifiedRecords === 166 && review.summary.archiveRecords === 0 && review.summary.recordBlocked === 0 && review.summary.draftRecords === 1, JSON.stringify({ verified: review.summary.sourceVerifiedRecords, archive: review.summary.archiveRecords, blocked: review.summary.recordBlocked, draft: review.summary.draftRecords }));
record('every published record has an independent source', review.records.filter((entry) => entry.published).every((entry) => entry.independentSourceCount > 0 && entry.decision === 'source-verified'), '');

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  checks,
  failures,
  coverage: routes.coverage,
  report: report.counts,
  prototype: prototype.counts,
  contentTreeSha256: null,
};
fs.writeFileSync(
  path.join(root, 'evidence/G4-migration-check.json'),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify({ checks: Object.keys(checks).length, failures: failures.length, coverage: routes.coverage }, null, 2));
if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
