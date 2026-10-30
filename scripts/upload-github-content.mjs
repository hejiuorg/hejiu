import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const token = process.env.GH_TOKEN;
if (!token) throw new Error('GH_TOKEN is required');
const owner = process.env.GH_OWNER || 'hejiuorg';
const apply = process.argv.includes('--apply');
const only = process.env.ONLY_REPO;
const apiBase = 'https://api.github.com';
const repos = ['alcoholic-beverages', 'alcohol-guide', 'alcohol-culture', 'alcohol-atlas'];

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
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

function isBinary(file) {
  return /\.(png|jpe?g|gif|webp|woff2?|ttf|otf|ico|zip|pdf)$/i.test(file);
}

for (const repo of repos.filter((name) => !only || name === only)) {
  const source = path.join(root, 'content-repositories', repo);
  if (!fs.existsSync(source)) throw new Error(`Missing ${source}`);
  const files = walk(source).sort();
  const readme = fs.readFileSync(path.join(source, 'README.md'), 'utf8');
  console.log(`preparing ${repo}: ${files.length} files`);
  if (!apply) continue;

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
  for (const file of files) {
    const relative = path.relative(source, file).replaceAll('\\', '/');
    const content = fs.readFileSync(file);
    if (isBinary(file)) {
      const blob = await request('POST', `/repos/${owner}/${repo}/git/blobs`, {
        content: content.toString('base64'),
        encoding: 'base64',
      });
      treeEntries.push({ path: relative, mode: '100644', type: 'blob', sha: blob.sha });
    } else {
      treeEntries.push({
        path: relative,
        mode: '100644',
        type: 'blob',
        content: content.toString('utf8'),
      });
    }
  }
  const tree = await request('POST', `/repos/${owner}/${repo}/git/trees`, { tree: treeEntries });
  const commit = await request('POST', `/repos/${owner}/${repo}/git/commits`, {
    message: `Import ${repo} content from audited release`,
    tree: tree.sha,
    parents: [ref.object.sha],
  });
  await request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/main`, { sha: commit.sha, force: true });
  console.log(`pushed ${repo} ${commit.sha.slice(0, 12)}`);
}
