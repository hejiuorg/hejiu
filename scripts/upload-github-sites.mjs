import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const token = process.env.GH_TOKEN;
if (!token) throw new Error('GH_TOKEN is required');
const owner = process.env.GH_OWNER || 'hejiuorg';
const apply = process.argv.includes('--apply');
const apiBase = 'https://api.github.com';

const sites = [
  { repo: 'www', zip: 'site-alcoholic-beverages.zip', cname: 'hejiu.org', title: '喝酒去主站（www 旧仓承接）' },
  { repo: 'site-alcoholic-beverages', zip: 'site-alcoholic-beverages.zip', cname: 'hejiu.org', title: '喝酒去主站' },
  { repo: 'site-alcohol-guide', zip: 'site-alcohol-guide.zip', cname: 'guide.hejiu.org', title: '喝酒去喝法' },
  { repo: 'site-alcohol-culture', zip: 'site-alcohol-culture.zip', cname: 'culture.hejiu.org', title: '喝酒去酒文化' },
  { repo: 'site-alcohol-atlas', zip: 'site-alcohol-atlas.zip', cname: 'atlas.hejiu.org', title: '喝酒去去处' },
];

const workflow = `name: Deploy static site
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Unpack site
        run: unzip -q site.zip -d site
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site
      - id: deployment
        uses: actions/deploy-pages@v4
`;

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
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(`${method} ${url} -> ${response.status}: ${text.slice(0, 300)}`);
    error.status = response.status;
    error.json = json;
    throw error;
  }
  return json;
}

async function ensureRepo(repo, readme) {
  try {
    await request('GET', `/repos/${owner}/${repo}/contents/README.md`);
  } catch (error) {
    if (error.status !== 404) throw error;
    await request('PUT', `/repos/${owner}/${repo}/contents/README.md`, {
      message: 'Initialize repository',
      content: Buffer.from(readme).toString('base64'),
    });
    console.log(`initialized ${repo}`);
  }
}

async function ensurePages(repo, cname) {
  try {
    await request('POST', `/repos/${owner}/${repo}/pages`, { build_type: 'workflow' });
    console.log(`pages create ${repo}`);
  } catch (error) {
    if (error.status !== 409 && error.status !== 422) throw error;
    console.log(`pages exists ${repo} (${error.status})`);
  }
  try {
    await request('PUT', `/repos/${owner}/${repo}/pages`, { build_type: 'workflow', cname });
    console.log(`pages cname ${repo} -> ${cname}`);
  } catch (error) {
    console.log(`pages cname pending ${repo}: ${error.message.slice(0, 240)}`);
  }
}

for (const site of sites.filter((entry) => !process.env.ONLY_REPO || entry.repo === process.env.ONLY_REPO)) {
  const zipPath = path.join(root, '.hejiu', 'deploy', site.zip);
  if (!fs.existsSync(zipPath)) throw new Error(`Missing ${zipPath}`);
  const zipBase64 = fs.readFileSync(zipPath).toString('base64');
  const readme = `# ${site.title}\n\nStatic deployment artifact for https://${site.cname}/.\n\nSource, content and release evidence live in the Hejiu implementation repository.\n`;
  console.log(`preparing ${site.repo}: zip=${(zipBase64.length / 1024).toFixed(0)} KiB base64`);
  if (!apply) continue;

  await ensureRepo(site.repo, readme);
  const ref = await request('GET', `/repos/${owner}/${site.repo}/git/ref/heads/main`);
  const zipBlob = await request('POST', `/repos/${owner}/${site.repo}/git/blobs`, {
    content: zipBase64,
    encoding: 'base64',
  });
  const tree = await request('POST', `/repos/${owner}/${site.repo}/git/trees`, {
    tree: [
      { path: 'site.zip', mode: '100644', type: 'blob', sha: zipBlob.sha },
      { path: 'README.md', mode: '100644', type: 'blob', content: readme },
      { path: '.github/workflows/deploy.yml', mode: '100644', type: 'blob', content: workflow },
    ],
  });
  const commit = await request('POST', `/repos/${owner}/${site.repo}/git/commits`, {
    message: `Deploy ${site.cname} from audited release`,
    tree: tree.sha,
    parents: [ref.object.sha],
  });
  await request('PATCH', `/repos/${owner}/${site.repo}/git/refs/heads/main`, { sha: commit.sha, force: true });
  console.log(`pushed ${site.repo} ${commit.sha.slice(0, 12)}`);
  await ensurePages(site.repo, site.cname);
}
