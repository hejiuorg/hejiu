import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contentTreeSha256,
  loadContent,
  recordKey,
  recordPublication,
} from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/content.js';
import { loadContracts } from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/contracts.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contracts = loadContracts(root);
const index = loadContent(root, contracts);
const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const zh = [...index.entities.values()].map((entity) => entity.zh).filter(Boolean);
const en = [...index.entities.values()].map((entity) => entity.en).filter(Boolean);
const publishedZh = zh.filter((entry) => recordPublication(entry, index).published);
const publishedEn = en.filter((entry) => recordPublication(entry, index).published);
const publishedZhIds = new Set(publishedZh.map((entry) => entry.id));
const publishedEnIds = new Set(publishedEn.map((entry) => entry.id));

record(
  'every published Chinese entity has an English translation',
  publishedZhIds.size === publishedEnIds.size && [...publishedZhIds].every((id) => publishedEnIds.has(id)),
  `${publishedZhIds.size}/${publishedEnIds.size}`,
);
record(
  'published pairs are 83 / 83',
  publishedZh.length === 83 && publishedEn.length === 83,
  `${publishedZh.length}/${publishedEn.length}`,
);

const enMissingFields = publishedEn.filter(
  (entry) =>
    entry.frontmatter.translation_of !== entry.id ||
    entry.frontmatter.source_lang !== 'zh' ||
    entry.frontmatter.translation_status !== 'reviewed' ||
    !entry.frontmatter.source_sha256,
);
record('English pages declare reviewed translation provenance', enMissingFields.length === 0, `${enMissingFields.length}`);

const hashMismatch = publishedEn.filter((entry) => {
  const source = index.byIdLang.get(recordKey(entry.id, 'zh'));
  return !source || entry.frontmatter.source_sha256 !== source.sourceSha256;
});
record('English source hashes match the current Chinese source', hashMismatch.length === 0, `${hashMismatch.length}`);

const missingSources = publishedEn.filter((entry) => entry.frontmatter.sources.length === 0);
record('every English page has at least one source', missingSources.length === 0, `${missingSources.length}`);

const numericMismatches = [];
const headingMismatches = [];
const lengthOutliers = [];
for (const entry of publishedEn) {
  const source = index.byIdLang.get(recordKey(entry.id, 'zh'));
  if (!source) continue;
  const numberPattern = /\d+(?:\.\d+)?%|\b(?:1[0-9]{3}|20[0-9]{2})s?\b/g;
  const numberTokens = (body) => [...new Set((body.match(numberPattern) ?? []).map((token) => token.replace(/s$/, '')))];
  const zhNumbers = numberTokens(source.body);
  const enNumbers = new Set(numberTokens(entry.body));
  const missingNumbers = zhNumbers.filter((number) => !enNumbers.has(number));
  if (missingNumbers.length > 0) numericMismatches.push({ id: entry.id, missingNumbers });
  const headingCount = (body) => (body.split(/\r?\n## (?:References|参考资料)/)[0].match(/^## /gm) ?? []).length;
  const zhHeadings = headingCount(source.body);
  const enHeadings = headingCount(entry.body);
  if (zhHeadings !== enHeadings) headingMismatches.push({ id: entry.id, zhHeadings, enHeadings });
  const ratio = entry.body.length / Math.max(source.body.length, 1);
  if (ratio < 0.35 || ratio > 4.0) lengthOutliers.push({ id: entry.id, ratio: Number(ratio.toFixed(2)) });
}
record('English bodies preserve Chinese numeric tokens', numericMismatches.length === 0, JSON.stringify(numericMismatches.slice(0, 6)));
record('English headings match the Chinese structure', headingMismatches.length === 0, JSON.stringify(headingMismatches.slice(0, 6)));
record('English body length is within the review band', lengthOutliers.length === 0, JSON.stringify(lengthOutliers.slice(0, 6)));

const places = publishedEn.filter((entry) => entry.type === 'place');
const missingAddress = places.filter((entry) => !entry.frontmatter.address_en);
record('every English place has an English address', missingAddress.length === 0, `${places.length}`);

const archiveEn = publishedEn.filter((entry) => entry.frontmatter.verification_scope === 'archive-record');
record('no English page is published as archive-record', archiveEn.length === 0, `${archiveEn.length}`);

const bodyCjk = [];
for (const entry of publishedEn) {
  const text = fs.readFileSync(path.join(root, 'content-repositories', entry.repo, entry.relPath), 'utf8');
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').split(/\r?\n## (References|参考资料)/)[0];
  const count = (body.match(/[\u3400-\u9fff]/g) ?? []).length;
  if (count > 5) bodyCjk.push({ id: entry.id, count });
}
record('English body text has no untranslated Chinese paragraphs', bodyCjk.length === 0, JSON.stringify(bodyCjk));

const legacyCopy = publishedEn.filter((entry) => {
  const text = fs.readFileSync(
    path.join(root, 'content-repositories', entry.repo, entry.relPath),
    'utf8',
  );
  const body = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .split(/\r?\n## References/)[0];
  return /旧站|迁移说明|档案条目/.test(body);
});
record('English body text contains no legacy archive copy', legacyCopy.length === 0, legacyCopy.map((entry) => entry.id).join(','));

const publishedDir = path.join(root, '.hejiu', 'published');
const searchLanguages = new Map();
for (const file of fs.readdirSync(publishedDir).filter((name) => name.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(publishedDir, file), 'utf8'));
  for (const entry of data.records) {
    const lang = entry.meta?.lang ?? entry.language ?? 'zh';
    searchLanguages.set(lang, (searchLanguages.get(lang) ?? 0) + 1);
  }
}
record(
  'search index contains 83 Chinese and 83 English records',
  searchLanguages.get('zh') === 83 && searchLanguages.get('en') === 83,
  JSON.stringify(Object.fromEntries(searchLanguages)),
);

record(
  'content tree hash is present',
  /^[a-f0-9]{64}$/.test(contentTreeSha256(index)),
  contentTreeSha256(index),
);

const failures = checks.filter((check) => !check.ok);
const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  checks,
  failures,
  counts: {
    entities: index.entities.size,
    publishedZh: publishedZh.length,
    publishedEn: publishedEn.length,
  },
};
fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(root, 'evidence', 'G7-translation-qa.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ checks: checks.length, failures: failures.length }, null, 2));
if (failures.length > 0) process.exitCode = 1;
