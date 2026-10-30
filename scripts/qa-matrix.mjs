import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const failureShots = path.join(evidence, 'g3-matrix-failures');
fs.rmSync(failureShots, { recursive: true, force: true });
fs.mkdirSync(failureShots, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const sites = [
  {
    key: 'beverages',
    base: 'http://127.0.0.1:4401',
    pages: { home: '/', list: '/styles/', detail: '/styles/baijiu/' },
  },
  {
    key: 'guide',
    base: 'http://127.0.0.1:4402',
    pages: { home: '/', list: '/recipes/', detail: '/recipes/negroni/' },
  },
  {
    key: 'culture',
    base: 'http://127.0.0.1:4403',
    pages: { home: '/', list: '/articles/', detail: '/articles/time-in-a-cup/' },
  },
  {
    key: 'atlas',
    base: 'http://127.0.0.1:4404',
    pages: { home: '/', list: '/places/', detail: '/places/gujing-wine-culture-museum/' },
  },
];
const widths = [320, 390, 768, 1440];
const themes = ['light', 'dark', 'system'];
const langs = ['zh', 'en'];
const pageTypes = ['home', 'list', 'detail'];

const urlFor = (site, lang, pagePath) => site.base + (lang === 'en' ? `/en${pagePath}` : pagePath);
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const version = await browser.version();
const results = [];
const failures = [];

for (const site of sites) {
  for (const lang of langs) {
    for (const width of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: width <= 390 ? 844 : width === 768 ? 1024 : 900 });
      // Seed the preference on the origin before the theme loop.
      await page.goto(urlFor(site, lang, '/'), { waitUntil: 'networkidle0' });
      await page.evaluate(() => localStorage.setItem('hejiu:theme', 'light'));

      for (const theme of themes) {
        await page.evaluate((value) => localStorage.setItem('hejiu:theme', value), theme);
        await page.emulateMediaFeatures([
          { name: 'prefers-color-scheme', value: theme === 'system' ? 'dark' : 'light' },
        ]);
        for (const pageType of pageTypes) {
          const url = urlFor(site, lang, site.pages[pageType]);
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
          await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true', {
            timeout: 10000,
          });
          const audit = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            const h1Rect = h1?.getBoundingClientRect();
            const bottom = document.querySelector('.bottom-nav');
            const desktop = document.querySelector('.desktop-nav');
            return {
              innerWidth: window.innerWidth,
              docWidth: document.documentElement.scrollWidth,
              bodyWidth: document.body.scrollWidth,
              h1Count: document.querySelectorAll('h1').length,
              h1Right: h1Rect?.right ?? null,
              htmlLang: document.documentElement.lang,
              title: document.title,
              themeChoice: document.documentElement.dataset.themeChoice,
              theme: document.documentElement.dataset.theme,
              bottomNav: bottom ? getComputedStyle(bottom).display : null,
              desktopNav: desktop ? getComputedStyle(desktop).display : null,
              unresolvedRef: document.body.innerHTML.includes('href="ref:'),
              mascotLoaded: [...document.querySelectorAll('.mascot__img')].every(
                (image) => image.complete && image.naturalWidth > 0,
              ),
            };
          });
          const expectedTheme = theme === 'system' ? 'dark' : theme;
          const checks = {
            noOverflow: audit.docWidth <= width + 1 && audit.bodyWidth <= width + 1,
            h1Fits: audit.h1Right === null || audit.h1Right <= width + 1,
            singleH1: audit.h1Count === 1,
            correctLang: audit.htmlLang === lang,
            titlePresent: audit.title.length > 2,
            themeApplied: audit.themeChoice === theme && audit.theme === expectedTheme,
            navState:
              width <= 767
                ? audit.bottomNav === 'grid' && audit.desktopNav === 'none'
                : width >= 861
                  ? audit.bottomNav === 'none' && audit.desktopNav === 'flex'
                  : audit.bottomNav === 'none',
            noUnresolvedRef: !audit.unresolvedRef,
            mascotLoaded: audit.mascotLoaded,
          };
          const failed = Object.entries(checks)
            .filter(([, ok]) => !ok)
            .map(([name]) => name);
          const entry = {
            site: site.key,
            lang,
            width,
            theme,
            pageType,
            url,
            checks,
            failed,
            h1Right: audit.h1Right,
            docWidth: audit.docWidth,
          };
          results.push(entry);
          if (failed.length > 0) {
            failures.push(entry);
            const name = `${site.key}-${lang}-${theme}-${width}-${pageType}.png`;
            await page.screenshot({ path: path.join(failureShots, name), fullPage: true });
          }
        }
      }
      await page.close();
    }
  }
}

await browser.close();

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: version,
    astro: '7.4.4',
    ui: '0.1.0',
    deviceScaleFactor: 1,
    note: 'Headless Chrome layout matrix; not a physical-device visual signoff.',
  },
  matrix: {
    sites: sites.map((site) => site.key),
    pageTypes,
    langs,
    themes,
    widths,
    combinations: results.length,
  },
  summary: {
    checks: results.reduce((sum, entry) => sum + Object.keys(entry.checks).length, 0),
    failures: failures.length,
    failedChecks: failures.flatMap((entry) => entry.failed.map((name) => `${entry.site}/${entry.lang}/${entry.theme}/${entry.width}/${entry.pageType}:${name}`)),
  },
  results,
};
fs.writeFileSync(path.join(evidence, 'G3-matrix.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ combinations: results.length, failures: failures.length, failedChecks: report.summary.failedChecks.slice(0, 20) }, null, 2));
if (failures.length > 0) process.exitCode = 1;
