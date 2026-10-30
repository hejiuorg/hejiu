import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = 'http://127.0.0.1:4401';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hejiu-saved-'));
const downloads = path.join(tmp, 'downloads');
fs.mkdirSync(downloads, { recursive: true });

const results = [];
const failures = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  if (!ok) failures.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const client = await page.createCDPSession();
try {
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloads,
    eventsEnabled: true,
  });
} catch (error) {
  console.log('download behavior unavailable:', String(error));
}

async function goto(url) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true');
}

await goto(base + '/saved/');
await page.evaluate(() => localStorage.removeItem('hejiu:saved:v1'));
await goto(base + '/saved/?add=unknown%3Amissing');
const unknown = await page.evaluate(() => ({
  confirm: document.querySelector('[data-saved-confirm]')?.textContent?.trim(),
  hasAddButton: Boolean(document.querySelector('[data-saved-confirm] button')),
}));
record(
  'unknown saved ID shows an explanation',
  Boolean(unknown.confirm?.includes('不存在') || unknown.confirm?.includes('not exist')),
  unknown.confirm ?? '',
);
record('unknown saved ID cannot be added', !unknown.hasAddButton, String(unknown.hasAddButton));

const importFile = path.join(tmp, 'import.json');
fs.writeFileSync(
  importFile,
  JSON.stringify([
    { id: 'recipe:negroni', title: 'Imported Negroni', savedAt: '2026-10-29T00:00:00.000Z' },
  ]),
);
await goto(base + '/saved/');
const chooserPromise = page.waitForFileChooser({ timeout: 10000 });
await page.click('[data-saved-import-trigger]');
const chooser = await chooserPromise;
await chooser.accept([importFile]);
await page.waitForSelector('.saved-item', { timeout: 10000 });
const imported = await page.evaluate(() => ({
  entries: JSON.parse(localStorage.getItem('hejiu:saved:v1') || '[]'),
  items: [...document.querySelectorAll('.saved-item')].map((item) => item.textContent?.trim()),
}));
record('import adds a saved entity', imported.entries.length === 1 && imported.entries[0].id === 'recipe:negroni', JSON.stringify(imported.entries));

await goto(base + '/saved/');
const persisted = await page.evaluate(() => document.querySelectorAll('.saved-item').length);
record('saved item persists after reload', persisted === 1, String(persisted));

await page.click('[data-saved-export]');
let exported = null;
for (let attempt = 0; attempt < 30; attempt += 1) {
  const found = fs.readdirSync(downloads).filter((name) => name.endsWith('.json'));
  if (found.length > 0) {
    exported = JSON.parse(fs.readFileSync(path.join(downloads, found[0]), 'utf8'));
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
}
if (exported) {
  const keys = Object.keys(exported[0] ?? {}).sort();
  record(
    'export contains only id, title and savedAt',
    keys.join(',') === 'id,savedAt,title' && exported[0].id === 'recipe:negroni',
    JSON.stringify(exported),
  );
} else {
  record('export contains only id, title and savedAt', false, 'download was not observed');
}

await page.click('.saved-item button');
await page.waitForFunction(() => document.querySelectorAll('.saved-item').length === 0);
const removed = await page.evaluate(() => JSON.parse(localStorage.getItem('hejiu:saved:v1') || '[]').length);
record('remove clears saved item', removed === 0, String(removed));

await goto(base + '/cocktails/negroni/');
await page.click('[data-save-toggle]');
await page.waitForFunction(() => JSON.parse(localStorage.getItem('hejiu:saved:v1') || '[]').length === 1);
const detailSaved = await page.evaluate(() => ({
  label: document.querySelector('[data-save-toggle] [data-save-label]')?.textContent,
  pressed: document.querySelector('[data-save-toggle]')?.getAttribute('aria-pressed'),
}));
record('main detail save button stores item', detailSaved.pressed === 'true', JSON.stringify(detailSaved));
await page.click('[data-save-toggle]');
await page.waitForFunction(() => JSON.parse(localStorage.getItem('hejiu:saved:v1') || '[]').length === 0);
const detailRemoved = await page.evaluate(() => document.querySelector('[data-save-toggle]')?.getAttribute('aria-pressed'));
record('main detail save button toggles off', detailRemoved === 'false', String(detailRemoved));

await page.close();
await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: 'Headless Chrome via puppeteer-core',
    origin: base,
    note: 'Local preview origin; production-domain Cookie behavior is not exercised.',
  },
  results,
  failures,
};
fs.writeFileSync(path.join(evidence, 'G3-saved.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${results.length - failures.length}/${results.length} saved-flow checks passed.`);
if (failures.length > 0) process.exitCode = 1;
