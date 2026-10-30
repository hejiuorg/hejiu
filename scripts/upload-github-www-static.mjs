import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const token = process.env.GH_TOKEN;
if (!token) throw new Error('GH_TOKEN is required');
const owner = process.env.GH_OWNER || 'hejiuorg';
const repo = 'www';
const dist = path.join(root, 'site-repositories', 'site-alcoholic-beverages', 'apps', 'main', 'dist');
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

function walk(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

const files = walk(dist).sort();
console.log(`preparing ${repo}: ${files.length} static files`);
const ref = await request('GET', `/repos/${owner}/${repo}/git/ref/heads/main`);
const treeEntries = [];
for (const file of files) {
  const relative = path.relative(dist, file).replaceAll('\\', '/');
  const content = fs.readFileSync(file);
  const isText = /\.(html|css|js|mjs|json|xml|txt|svg|webmanifest)$/i.test(relative) || relative === 'CNAME';
  if (isText) {
    treeEntries.push({ path: relative, mode: '100644', type: 'blob', content: content.toString('utf8') });
  } else {
    const blob = await request('POST', `/repos/${owner}/${repo}/git/blobs`, {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    treeEntries.push({ path: relative, mode: '100644', type: 'blob', sha: blob.sha });
  }
}
treeEntries.push({ path: '.nojekyll', mode: '100644', type: 'blob', content: '' });
treeEntries.push({ path: 'CNAME', mode: '100644', type: 'blob', content: 'hejiu.org\n' });
const tree = await request('POST', `/repos/${owner}/${repo}/git/trees`, { tree: treeEntries });
const commit = await request('POST', `/repos/${owner}/${repo}/git/commits`, {
  message: 'Deploy audited main site as static branch',
  tree: tree.sha,
  parents: [ref.object.sha],
});
await request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/main`, { sha: commit.sha, force: true });
console.log(JSON.stringify({ commit: commit.sha, files: treeEntries.length }, null, 2));
