import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publishedDir = path.join(root, '.hejiu', 'published');
const sites = [
  ['beverages', 'site-repositories/site-alcoholic-beverages/apps/main/dist'],
  ['guide', 'site-repositories/site-alcohol-guide/apps/site/dist'],
  ['culture', 'site-repositories/site-alcohol-culture/apps/site/dist'],
  ['atlas', 'site-repositories/site-alcohol-atlas/apps/site/dist'],
];

function clean(value) {
  return String(value ?? '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const all = [];
const bySite = new Map();
for (const file of fs.readdirSync(publishedDir).filter((name) => name.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(publishedDir, file), 'utf8'));
  const siteKey = file.replace(/\.json$/, '');
  const records = [];
  for (const record of data.records) {
    const compact = {
      url: record.url,
      title: clean(record.meta?.title),
      summary: clean(record.meta?.summary),
      content: clean(record.content).slice(0, 700),
      site: record.meta?.site ?? siteKey,
      lang: record.meta?.lang ?? record.language ?? 'zh',
      type: record.meta?.type ?? '',
    };
    records.push(compact);
    all.push(compact);
  }
  bySite.set(siteKey, records);
}

for (const [key, relative] of sites) {
  const dist = path.join(root, relative);
  if (!fs.existsSync(dist)) throw new Error(`Build output missing for ${key}: ${dist}`);
  const records = key === 'beverages' ? all : bySite.get(key) ?? [];
  fs.writeFileSync(path.join(dist, 'search-index.json'), `${JSON.stringify({ records })}\n`);
}
console.log(JSON.stringify({ sites: sites.length, records: all.length }, null, 2));
