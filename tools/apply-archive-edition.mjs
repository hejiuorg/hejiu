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

let archived = 0;
let verified = 0;
for (const repo of fs.readdirSync(CONTENT)) {
  const repoDir = path.join(CONTENT, repo);
  if (!fs.statSync(repoDir).isDirectory()) continue;
  for (const lang of ['zh', 'en']) {
    for (const file of walk(path.join(repoDir, lang))) {
      const raw = fs.readFileSync(file, 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
      if (!match) throw new Error(`No frontmatter: ${file}`);
      const front = YAML.parse(match[1]);
      if (front.status === 'needs-review') {
        front.status = 'reviewed';
        front.verification_scope = 'archive-record';
        if (front.rights) {
          front.rights.status = 'allowed';
          front.rights.license = 'CC-BY-4.0';
          if (!front.rights.basis) {
            front.rights.basis =
              '项目所有者于 2026-10-29 声明项目内容采用 CC BY 4.0；旧站档案原文作为项目档案内容保留。';
          }
          front.rights.note =
            '第三方标准、商标、图片与引用文本不在本许可内；来源仅作核验引用。旧站档案中的事实与营业断言仍需独立核验。';
        }
        archived += 1;
      } else if (front.status === 'reviewed' && front.verification_scope !== 'archive-record') {
        front.verification_scope = 'source-verified';
        verified += 1;
      }
      fs.writeFileSync(
        file,
        `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n${match[2].trim()}\n`,
        'utf8',
      );
    }
  }
}
console.log(JSON.stringify({ archived, verified }, null, 2));
