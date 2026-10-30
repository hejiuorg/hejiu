import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const base = 'http://127.0.0.1:4401';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function goOld(url, expectedPath) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(
    (expected) => window.location.pathname === expected || window.location.pathname.startsWith(expected),
    { timeout: 12000 },
    expectedPath,
  );
  return page.evaluate(() => ({
    href: window.location.href,
    title: document.title,
    robots: document.querySelector('meta[name=robots]')?.content ?? null,
    bodyText: document.body.textContent?.replace(/\s+/g, ' ').trim().slice(0, 220),
    hasProse: Boolean(document.querySelector('.prose')),
  }));
}

let result = await goOld(`${base}/?page=liquor&id=anhui_gujinggongjiu`, '/brands/gujing-gongjiu/');
record('old liquor URL reaches curated brand page', result.href.includes('/brands/gujing-gongjiu/'), result.href);
record('curated brand page is indexable', !result.robots?.includes('noindex'), result.robots ?? '');
record('curated brand page shows title and no archive notice', result.bodyText.includes('古井贡酒') && !result.bodyText.includes('档案条目'), result.bodyText);

result = await goOld(`${base}/?page=pub&id=bar_el_federal`, '/404.html');
record('retired pub URL reaches 404 instead of unrelated content', result.href.endsWith('/404.html'), result.href);

result = await goOld(`${base}/?page=pub&id=american_bar_savoy`, '/places/american-bar-savoy/');
record('old pub URL reaches curated place page', result.href.includes('/places/american-bar-savoy/'), result.href);
record('curated place page shows title and no archive notice', result.bodyText.includes('萨沃伊') && !result.bodyText.includes('档案条目'), result.bodyText);

result = await goOld(`${base}/#?page=liquor&id=beijing_erguotou`, '/drinks/beijing-erguotou/');
record('old hash URL is converted and redirected', result.href.includes('/drinks/beijing-erguotou/'), result.href);

result = await goOld(`${base}/?page=category&id=baijiu`, '/styles/baijiu/');
record('reviewed category URL reaches style page', result.href.includes('/styles/baijiu/') && result.robots?.includes('index'), result.href);

result = await goOld(`${base}/?page=category&id=wine`, '/styles/wine/');
record('curated category URL reaches indexable style page', result.href.includes('/styles/wine/') && result.robots?.includes('index') && !result.bodyText.includes('旧站分类'), result.href);

result = await goOld(`${base}/?page=search&q=Negroni`, '/search/');
record('old search URL preserves query', result.href.includes('/search/?q=Negroni'), result.href);

result = await goOld(`${base}/?page=tags`, '/search/');
record('old tag list URL reaches search', result.href.endsWith('/search/'), result.href);

result = await goOld(`${base}/?page=unknown`, '/404.html');
record('unknown legacy page reached 404', result.href.endsWith('/404.html'), result.href);

result = await goOld(`${base}/?page=province&id=anhui`, '/regions/anhui/');
record('old province URL reaches reviewed region', result.href.includes('/regions/anhui/'), result.href);

await page.goto(`${base}/review/?id=missing%3Aid`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.location.pathname === '/404.html', { timeout: 12000 });
record('unknown review id reaches 404', page.url().endsWith('/404.html'), page.url());

const sw = await page.evaluate(async () => {
  const response = await fetch('/sw.js');
  return { status: response.status, text: await response.text() };
});
record('transition SW is served', sw.status === 200 && sw.text.includes('hejiu-v1'), String(sw.status));
record('transition SW has no fetch handler', !sw.text.includes("addEventListener('fetch'") && !sw.text.includes('addEventListener("fetch"'), '');
record('transition SW deletes old cache and unregisters', sw.text.includes('caches.delete') && sw.text.includes('registration.unregister'), '');

await page.close();
await browser.close();

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: { browser: await Promise.resolve('Headless Chrome'), base },
  checks,
};
fs.writeFileSync(path.join(evidence, 'G6-legacy-compat.json'), `${JSON.stringify(output, null, 2)}\n`);
const failures = checks.filter((check) => !check.ok);
console.log(`\n${checks.length - failures.length}/${checks.length} checks passed.`);
if (failures.length > 0) process.exitCode = 1;
