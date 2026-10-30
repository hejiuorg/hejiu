import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const token = process.env.GH_TOKEN;
if (!token) throw new Error('GH_TOKEN is required');
const owner = process.env.GH_OWNER || 'hejiuorg';
const repo = 'hejiu';
const apply = process.argv.includes('--apply');
const apiBase = 'https://api.github.com';

async function request(method, url, body) {
  const response = await fetch(`${apiBase}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!response.ok) {
    const error = new Error(`${method} ${url} -> ${response.status}: ${text.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }
  return json;
}

const files = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);
console.log(`preparing ${repo}: ${files.length} tracked files`);
if (!apply) process.exit(0);

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
try {
  await request('GET', `/repos/${owner}/${repo}/contents/README.md`);
} catch (error) {
  if (error.status !== 404) throw error;
  await request('PUT', `/repos/${owner}/${repo}/contents/README.md`, {
    message: 'Initialize repository',
    content: Buffer.from(readme).toString('base64'),
  });
}
const ref = await request('GET', `/repos/${owner}/${repo}/git/ref/heads/main`);
const treeEntries = [];
for (const relative of files) {
  const full = path.join(root, relative);
  const content = fs.readFileSync(full);
  if (/\.(png|jpe?g|gif|webp|woff2?|ttf|otf|ico|zip|pdf)$/i.test(relative)) {
    const blob = await request('POST', `/repos/${owner}/${repo}/git/blobs`, {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    treeEntries.push({ path: relative, mode: '100644', type: 'blob', sha: blob.sha });
  } else {
    treeEntries.push({ path: relative, mode: '100644', type: 'blob', content: content.toString('utf8') });
  }
}
const tree = await request('POST', `/repos/${owner}/${repo}/git/trees`, { tree: treeEntries });
const commit = await request('POST', `/repos/${owner}/${repo}/git/commits`, {
  message: 'Import Hejiu implementation source and evidence',
  tree: tree.sha,
  parents: [ref.object.sha],
});
await request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/main`, { sha: commit.sha, force: true });
console.log(JSON.stringify({ repo, commit: commit.sha, files: files.length }, null, 2));
