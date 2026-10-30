import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentRoot = path.join(root, 'content-repositories');
const repositories = ['alcoholic-beverages', 'alcohol-atlas', 'alcohol-culture', 'alcohol-guide'];
const apply = process.argv.includes('--apply');
const ids = new Set();

function walk(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') result.push(full);
  }
  return result;
}

for (const repo of repositories) {
  for (const lang of ['zh', 'en']) {
    for (const file of walk(path.join(contentRoot, repo, lang))) {
      const text = fs.readFileSync(file, 'utf8');
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) continue;
      const front = YAML.parse(match[1]);
      if (front?.id) ids.add(front.id);
    }
  }
}

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const writeJson = (relative, value) => {
  fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
};

const entityMapPath = 'migration/entity-map.json';
const entityMap = readJson(entityMapPath);
let retiredRows = 0;
let partialRows = 0;
for (const entry of entityMap.records) {
  const keptTargets = (entry.targetRefs ?? []).filter((id) => ids.has(id));
  if (keptTargets.length === 0) {
    if (entry.status !== 'retired') {
      entry.status = 'retired';
      entry.targetRefs = [];
      entry.reason = '按 2026-10-29 策展决定停用：不独立成页，也不再把旧文合并进新页面。';
      retiredRows += 1;
    }
  } else if (keptTargets.length !== entry.targetRefs.length) {
    entry.targetRefs = keptTargets;
    if (entry.status === 'migrated-needs-review') entry.status = 'split';
    entry.reason = `${entry.reason ?? ''} 部分目标已按策展规则停用。`.trim();
    partialRows += 1;
  }
}
entityMap.status = 'G4 import retained as a ledger; 2026-10-29 curation retired non-standalone targets';
if (apply) writeJson(entityMapPath, entityMap);

const routesPath = 'migration/legacy-routes.json';
const routes = readJson(routesPath);
let retiredRoutes = 0;
let keptRoutes = 0;
for (const route of routes.records) {
  const targets = (route.targets ?? []).filter((target) => ids.has(target.id));
  if (targets.length === 0) {
    route.targets = [];
    route.primaryTarget = null;
    route.status = 'retired';
    retiredRoutes += 1;
  } else {
    route.targets = targets;
    route.primaryTarget = targets[0];
    route.status = 'published';
    keptRoutes += 1;
  }
}
const draftStyleIds = new Set(['drink-style:other']);
for (const route of routes.categoryRoutes ?? []) {
  const targetId = [...ids].find((id) => route.target?.includes(`/styles/${id.split(':')[1]}/`));
  if (!targetId || draftStyleIds.has(targetId)) {
    route.target = 'https://hejiu.org/styles/';
    route.status = 'fallback-style-index';
  }
}
routes.note = 'Legacy routing for the curated edition. Retired records have no detail target and fall through to 404; they are not redirected to unrelated content.';
if (apply) writeJson(routesPath, routes);

const fieldMapPath = 'migration/legacy-field-map.json';
const fieldMap = readJson(fieldMapPath);
let retiredFieldRows = 0;
for (const entry of fieldMap.records) {
  if (entry.targetRefs?.length && !entry.targetRefs.some((id) => ids.has(id))) {
    entry.targetRefs = [];
    entry.fieldDisposition = { ...entry.fieldDisposition, _curation: 'retired 2026-10-29' };
    retiredFieldRows += 1;
  }
}
if (apply) writeJson(fieldMapPath, fieldMap);

console.log(
  JSON.stringify(
    {
      apply,
      contentIds: ids.size,
      retiredRows,
      partialRows,
      retiredRoutes,
      keptRoutes,
      retiredFieldRows,
    },
    null,
    2,
  ),
);
