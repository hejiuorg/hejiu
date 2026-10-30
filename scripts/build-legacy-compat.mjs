import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const routes = JSON.parse(fs.readFileSync(path.join(root, 'migration', 'legacy-routes.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(root, 'migration', 'content-review.json'), 'utf8'));
const publicDir = path.join(
  root,
  'site-repositories',
  'site-alcoholic-beverages',
  'apps',
  'main',
  'public',
);
fs.mkdirSync(publicDir, { recursive: true });

const blocked = new Set(
  review.entities.filter((entity) => entity.decision === 'blocked').map((entity) => entity.id),
);
const recordBySlug = new Map();
for (const record of review.records) {
  if (record.lang === 'zh') recordBySlug.set(`${record.type}/${record.slug}`, record.id);
}
const reviewUrl = (id) => `/review/?id=${encodeURIComponent(id)}`;
const siteHosts = {
  beverages: 'hejiu.org',
  guide: 'guide.hejiu.org',
  culture: 'culture.hejiu.org',
  atlas: 'atlas.hejiu.org',
};
const previewOrigins = (() => {
  try {
    return JSON.parse(process.env.HEJIU_PREVIEW_ORIGINS || '{}');
  } catch {
    return {};
  }
})();
const localize = (url) => {
  if (typeof url !== 'string') return url;
  for (const [key, host] of Object.entries(siteHosts)) {
    const origin = `https://${host}`;
    if (url === origin || url.startsWith(`${origin}/`)) {
      return previewOrigins[key]
        ? `${previewOrigins[key]}${url.slice(origin.length)}`
        : key === 'beverages'
          ? url.slice(origin.length) || '/'
          : url;
    }
  }
  return url;
};
const decide = (id, fallback) =>
  !id ? localize(fallback) : blocked.has(id) ? reviewUrl(id) : localize(fallback);

const details = {};
for (const route of routes.records) {
  if (!route.legacyQuery) continue;
  const query = new URLSearchParams(route.legacyQuery.slice(1));
  const page = query.get('page');
  const id = query.get('id');
  if (!page || !id) continue;
  const target = route.primaryTarget;
  if (target) details[`${page}:${id}`] = decide(target.id, target.url);
}

function targetIdFromUrl(url) {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    const typePath = parts[0];
    const slug = parts[1];
    const type =
      typePath === 'styles'
        ? 'drink-style'
        : typePath === 'places'
          ? 'place'
          : typePath === 'poetry'
            ? 'poem'
            : typePath === 'drinks'
              ? 'drink'
              : typePath === 'brands'
                ? 'brand'
                : null;
    return type && slug ? recordBySlug.get(`${type}/${slug}`) ?? null : null;
  } catch {
    return null;
  }
}

const categories = {};
for (const route of routes.categoryRoutes) {
  const query = new URLSearchParams(route.legacyQuery.slice(1));
  const id = query.get('id');
  const targetId = targetIdFromUrl(route.target);
  if (id) categories[id] = decide(targetId, route.target);
}

const subcategories = {};
for (const route of routes.subcategoryRoutes) {
  const query = new URLSearchParams(route.legacyQuery.slice(1));
  const category = query.get('category');
  const id = query.get('id');
  const targetId = targetIdFromUrl(route.target);
  if (category && id) subcategories[`${category}/${id}`] = decide(targetId, route.target);
}

const tags = {};
for (const route of routes.tagRoutes) {
  const query = new URLSearchParams(route.legacyQuery.slice(1));
  const id = query.get('id');
  if (id) tags[id] = route.target;
}

const map = {
  schemaVersion: 1,
  generatedAt: '2026-10-29',
  note: 'Legacy query compatibility map. Blocked targets point to the noindex review page, not to unpublished content.',
  details,
  categories,
  subcategories,
  tags,
};
fs.writeFileSync(path.join(publicDir, 'legacy-routes.json'), `${JSON.stringify(map)}\n`);

const registry = {};
for (const entity of [...review.entities].sort((a, b) => a.id.localeCompare(b.id))) {
  if (entity.decision !== 'blocked') continue;
  registry[entity.id] = {
    id: entity.id,
    title: entity.title,
    type: entity.type,
    siteKey: entity.siteKey,
    blockers: entity.blockers,
  };
}
fs.writeFileSync(
  path.join(publicDir, 'review-registry.json'),
  `${JSON.stringify({
    schemaVersion: 1,
    generatedAt: '2026-10-29',
    status: 'needs-review',
    note: 'Only metadata is exposed here; unpublished body and restricted text are not included.',
    entities: registry,
  })}\n`,
);

console.log(
  JSON.stringify(
    {
      details: Object.keys(details).length,
      categories: Object.keys(categories).length,
      subcategories: Object.keys(subcategories).length,
      tags: Object.keys(tags).length,
      blockedEntities: Object.keys(registry).length,
    },
    null,
    2,
  ),
);
