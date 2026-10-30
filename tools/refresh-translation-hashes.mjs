import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CONTENT = path.join(ROOT, 'content-repositories');

function walk(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') result.push(full);
  }
  return result;
}

function hash(raw) {
  return crypto
    .createHash('sha256')
    .update(raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'))
    .digest('hex');
}

let updated = 0;
for (const repo of fs.readdirSync(CONTENT)) {
  const root = path.join(CONTENT, repo);
  if (!fs.statSync(root).isDirectory()) continue;
  for (const file of walk(path.join(root, 'en'))) {
    const raw = fs.readFileSync(file, 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
    if (!match) continue;
    const front = YAML.parse(match[1]);
    if (!front.translation_of) continue;
    const zhFile = path.join(root, 'zh', front.type, `${front.slug}.md`);
    if (!fs.existsSync(zhFile)) throw new Error(`Missing Chinese source for ${file}`);
    const sourceHash = hash(fs.readFileSync(zhFile, 'utf8'));
    front.source_sha256 = sourceHash;
    front.source_revision = `sha256:${sourceHash}`;
    fs.writeFileSync(
      file,
      `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n${match[2].trim()}\n`,
      'utf8',
    );
    updated += 1;
  }
}
console.log(`Refreshed ${updated} translation source hashes.`);
