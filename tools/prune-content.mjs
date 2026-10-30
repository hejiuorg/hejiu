import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const curation = JSON.parse(fs.readFileSync(path.join(root, 'migration', 'curation.json'), 'utf8'));
const keep = new Set(curation.keep);
const repositories = ['alcoholic-beverages', 'alcohol-atlas', 'alcohol-culture', 'alcohol-guide'];
const contentRoot = path.join(root, 'content-repositories');
const backupRoot = path.join(root, '.hejiu', 'retired-content');
const apply = process.argv.includes('--apply');
const seen = new Set();
const retired = [];

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
    const dir = path.join(contentRoot, repo, lang);
    for (const file of walk(dir)) {
      const text = fs.readFileSync(file, 'utf8');
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) throw new Error(`No frontmatter: ${file}`);
      const front = YAML.parse(match[1]);
      if (!front?.id || !front?.type || !front?.slug) throw new Error(`Missing identity fields: ${file}`);
      if (keep.has(front.id)) {
        seen.add(front.id);
        continue;
      }
      const relative = path.relative(root, file).replaceAll('\\', '/');
      const sha256 = crypto.createHash('sha256').update(text).digest('hex');
      retired.push({
        id: front.id,
        type: front.type,
        lang: front.lang ?? lang,
        slug: front.slug,
        title: front.title ?? front.slug,
        relative,
        sha256,
        legacyRefs: front.legacy_refs ?? [],
        reason: front.type === 'poem' ? 'poem-excerpt-retired' : 'not-standalone-valuable',
      });
      if (apply) {
        const backup = path.join(backupRoot, repo, lang, `${front.type}-${front.slug}.md`);
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.copyFileSync(file, backup);
        fs.rmSync(file);
      }
    }
  }
}

const missing = [...keep].filter((id) => !seen.has(id));
if (missing.length) throw new Error(`Keep IDs not found: ${missing.join(', ')}`);

const counts = {};
for (const record of retired) counts[record.type] = (counts[record.type] ?? 0) + 1;
const manifest = {
  schemaVersion: 1,
  date: '2026-10-29',
  policy: curation.policy,
  apply,
  keptRecords: keep.size,
  retiredRecords: retired.length,
  retiredByType: counts,
  retired,
};
if (apply) {
  fs.writeFileSync(path.join(root, 'migration', 'retired-records.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(JSON.stringify({ apply, kept: keep.size, retired: retired.length, counts }, null, 2));
