import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadContent,
  recordPublication,
} from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/content.js';
import { loadContracts } from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/contracts.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const index = loadContent(root, loadContracts(root));
const routes = JSON.parse(fs.readFileSync(path.join(root, 'migration', 'legacy-routes.json'), 'utf8'));
const publicMap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'site-repositories', 'site-alcoholic-beverages', 'apps', 'main', 'public', 'legacy-routes.json'),
    'utf8',
  ),
);
const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const hosts = {
  beverages: 'hejiu.org',
  guide: 'guide.hejiu.org',
  culture: 'culture.hejiu.org',
  atlas: 'atlas.hejiu.org',
};
const dists = {
  beverages: 'site-repositories/site-alcoholic-beverages/apps/main/dist',
  guide: 'site-repositories/site-alcohol-guide/apps/site/dist',
  culture: 'site-repositories/site-alcohol-culture/apps/site/dist',
  atlas: 'site-repositories/site-alcohol-atlas/apps/site/dist',
};
const typePaths = {
  drink: 'drinks',
  'drink-style': 'styles',
  brand: 'brands',
  producer: 'producers',
  region: 'regions',
  cocktail: 'cocktails',
  place: 'places',
  guide: 'guides',
  recipe: 'recipes',
  vessel: 'vessels',
  article: 'articles',
  poem: 'poetry',
};

const normalizeUrl = (url) => (typeof url === 'string' && url.startsWith('/') ? `https://hejiu.org${url}` : url);
const publishedUrls = new Set();
for (const entity of index.entities.values()) {
  for (const lang of ['zh', 'en']) {
    const entry = entity[lang];
    if (!entry || !recordPublication(entry, index).published) continue;
    const typePath = typePaths[entry.type];
    if (!typePath) continue;
    const prefix = lang === 'en' ? '/en' : '';
    publishedUrls.add(`https://${hosts[entity.siteKey]}${prefix}/${typePath}/${entry.slug}/`);
  }
}

function distFile(url) {
  try {
    const parsed = new URL(url);
    const siteKey = Object.entries(hosts).find(([, host]) => host === parsed.hostname)?.[0];
    if (!siteKey) return null;
    let pathname = decodeURIComponent(parsed.pathname);
    if (!pathname.endsWith('/')) pathname = `${pathname}/`;
    return path.join(root, dists[siteKey], pathname, 'index.html');
  } catch {
    return null;
  }
}

const detailRows = routes.records;
const publishedRows = detailRows.filter((row) => row.status === 'published' && row.primaryTarget);
const retiredRows = detailRows.filter((row) => row.status === 'retired' && !row.primaryTarget);
record('602 detail rows are classified', detailRows.length === 602 && publishedRows.length + retiredRows.length === 602, `${publishedRows.length}+${retiredRows.length}`);
record('48 retained detail routes have targets', publishedRows.length === 48, `${publishedRows.length}`);
record('554 retired detail routes have no target', retiredRows.length === 554, `${retiredRows.length}`);
record(
  'every retained target is a published production URL',
  publishedRows.every((row) => publishedUrls.has(row.primaryTarget.url)),
  publishedRows.filter((row) => !publishedUrls.has(row.primaryTarget.url)).map((row) => row.legacyKey).join(','),
);
record(
  'every retained target HTML file exists',
  publishedRows.every((row) => {
    const file = distFile(row.primaryTarget.url);
    return file && fs.existsSync(file);
  }),
  publishedRows.filter((row) => !distFile(row.primaryTarget.url) || !fs.existsSync(distFile(row.primaryTarget.url))).map((row) => row.legacyKey).join(','),
);
record('public detail map has 48 entries', Object.keys(publicMap.details).length === 48, `${Object.keys(publicMap.details).length}`);
record(
  'public detail map matches retained routes',
  publishedRows.every((row) => {
    const query = new URLSearchParams(row.legacyQuery.slice(1));
    const key = `${query.get('page')}:${query.get('id')}`;
    return normalizeUrl(publicMap.details[key]) === row.primaryTarget.url;
  }),
  '',
);
record(
  'no retired detail key leaks into the public map',
  retiredRows.every((row) => {
    if (!row.legacyQuery) return true;
    const query = new URLSearchParams(row.legacyQuery.slice(1));
    const key = `${query.get('page')}:${query.get('id')}`;
    return !(key in publicMap.details);
  }),
  '',
);

const categoryTargets = routes.categoryRoutes.map((route) => route.target);
record(
  'all 17 category targets are published or the style index',
  categoryTargets.length === 17 && categoryTargets.every((url) => url === 'https://hejiu.org/styles/' || publishedUrls.has(url)),
  categoryTargets.filter((url) => url !== 'https://hejiu.org/styles/' && !publishedUrls.has(url)).join(','),
);
const subcategoryTargets = routes.subcategoryRoutes.map((route) => route.target);
record(
  'all 93 subcategory targets are published or the style index',
  subcategoryTargets.length === 93 && subcategoryTargets.every((url) => url === 'https://hejiu.org/styles/' || publishedUrls.has(url)),
  subcategoryTargets.filter((url) => url !== 'https://hejiu.org/styles/' && !publishedUrls.has(url)).slice(0, 5).join(','),
);
record(
  'all 397 tag targets use the search page',
  routes.tagRoutes.length === 397 && routes.tagRoutes.every((route) => route.target.startsWith('https://hejiu.org/search/')),
  `${routes.tagRoutes.length}`,
);
record(
  'public map has 17 category and 93 subcategory branches',
  Object.keys(publicMap.categories).length === 17 && Object.keys(publicMap.subcategories).length === 93,
  `${Object.keys(publicMap.categories).length}/${Object.keys(publicMap.subcategories).length}`,
);
record(
  'public map URLs are production HTTPS',
  [...Object.values(publicMap.details), ...Object.values(publicMap.categories), ...Object.values(publicMap.subcategories)].every(
    (url) => normalizeUrl(url).startsWith('https://') && !normalizeUrl(url).includes('127.0.0.1') && !normalizeUrl(url).includes('localhost'),
  ),
  '',
);
record(
  'no public map target points at the unpublished other style',
  [...Object.values(publicMap.categories), ...Object.values(publicMap.subcategories)].every((url) => !url.includes('/styles/other/')),
  '',
);

const failures = checks.filter((check) => !check.ok);
const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  checks,
  failures,
  counts: {
    detailRows: detailRows.length,
    retained: publishedRows.length,
    retired: retiredRows.length,
    publishedUrls: publishedUrls.size,
  },
};
fs.writeFileSync(path.join(root, 'evidence', 'G7-legacy-audit.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ checks: checks.length, failures: failures.length }, null, 2));
if (failures.length > 0) process.exitCode = 1;
