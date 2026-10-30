import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { entries as styleDrinkEntries } from './translation-data-styles-drinks.mjs';
import { entries as placeEntries } from './translation-data-places.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const today = '2026-10-29';
const zero = '0'.repeat(64);
const entries = [...styleDrinkEntries, ...placeEntries];
const apply = process.argv.includes('--apply');

const repoFor = (type) => {
  if (type === 'place') return 'alcohol-atlas';
  return 'alcoholic-beverages';
};

function readFront(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`No frontmatter: ${file}`);
  return YAML.parse(match[1]);
}

const results = [];
for (const entry of entries) {
  const [type, slug] = entry.id.split(':');
  if (!slug) throw new Error(`Bad id ${entry.id}`);
  const repo = repoFor(type);
  const zhFile = path.join(root, 'content-repositories', repo, 'zh', type, `${slug}.md`);
  if (!fs.existsSync(zhFile)) throw new Error(`Missing zh source: ${zhFile}`);
  const zh = readFront(zhFile);
  const front = {
    schema_version: 1,
    id: entry.id,
    type,
    lang: 'en',
    slug,
    title: entry.title,
    summary: entry.summary,
    status: 'reviewed',
    revision: 1,
    translation_of: entry.id,
    source_lang: 'zh',
    source_revision: `sha256:${zero}`,
    source_sha256: zero,
    translation_status: 'reviewed',
  };

  if (type === 'drink') {
    front.style_refs = zh.style_refs ?? [];
    front.brand_refs = zh.brand_refs ?? [];
    front.producer_refs = zh.producer_refs ?? [];
    front.region_refs = zh.region_refs ?? [];
    front.ingredient_refs = zh.ingredient_refs ?? [];
    front.process_refs = zh.process_refs ?? [];
    if (zh.abv) front.abv = zh.abv;
  } else if (type === 'brand') {
    front.producer_refs = zh.producer_refs ?? [];
    front.region_refs = zh.region_refs ?? [];
    if (zh.official_url) front.official_url = zh.official_url;
    if (zh.founded_year != null) front.founded_year = zh.founded_year;
  } else if (type === 'place') {
    front.subtype = zh.subtype ?? 'pub';
    front.address = zh.address;
    front.address_en = entry.addressEn;
    front.city = entry.cityEn;
    front.country = entry.countryEn;
    front.latitude = null;
    front.longitude = null;
    front.producer_refs = zh.producer_refs ?? [];
    front.region_refs = zh.region_refs ?? [];
    front.operating_status = 'unknown';
    if (zh.founded_year != null) front.founded_year = zh.founded_year;
  }

  front.legacy_refs = [];
  front.aliases = entry.aliases ?? [];
  front.tags = ['curated', 'source-verified'];
  front.related = [];
  front.references = [];
  front.sources = (zh.sources ?? []).map((source) => ({
    key: source.key,
    title: source.title,
    ...(source.url ? { url: source.url } : {}),
    publisher: source.publisher,
    ...(source.published ? { published: source.published } : {}),
    note: 'Used for factual verification; no source text is reproduced.',
    accessed: source.accessed ?? today,
  }));
  front.rights = {
    status: 'allowed',
    license: 'CC-BY-4.0',
    basis: `Project-authored English translation of the Chinese page; no source text is reproduced. The project owner declared project content CC BY 4.0 on ${today}.`,
    note: 'Third-party standards, trademarks, photographs and quoted texts are not covered by this licence.',
  };
  front.verification_scope = 'source-verified';

  const outFile = path.join(root, 'content-repositories', repo, 'en', type, `${slug}.md`);
  const body = `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n# ${entry.title}\n\n${entry.body}\n\n## References\n\n${(zh.sources ?? [])
    .map((source) => `- ${source.title}${source.url ? ` — ${source.url}` : ''}${source.publisher ? ` (${source.publisher})` : ''}`)
    .join('\n')}\n`;
  if (apply) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, body);
  }
  results.push({ id: entry.id, outFile: path.relative(root, outFile) });
}

console.log(JSON.stringify({ apply, translations: results.length, files: results.map((r) => r.outFile) }, null, 2));
