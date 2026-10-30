import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const screenshots = path.join(evidence, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const axePath = path.join(root, 'node_modules', 'axe-core', 'axe.min.js');
const axeSource = fs.readFileSync(axePath, 'utf8');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const bases = {
  beverages: 'http://127.0.0.1:4401',
  guide: 'http://127.0.0.1:4402',
  culture: 'http://127.0.0.1:4403',
  atlas: 'http://127.0.0.1:4404',
};

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

async function newPage(width = 390, height = 844, theme = 'light') {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme === 'dark' ? 'dark' : 'light' },
  ]);
  await page.evaluateOnNewDocument((value) => {
    try {
      localStorage.setItem('hejiu:theme', value);
    } catch {
      /* ignore */
    }
  }, theme);
  return page;
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true', {
    timeout: 10000,
  });
}

async function axeScan(page, label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    const report = await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
      },
    });
    return {
      violations: report.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        help: item.help,
        nodes: item.nodes.slice(0, 8).map((node) => ({
          target: node.target,
          html: node.html,
          summary: node.failureSummary,
        })),
      })),
      incomplete: report.incomplete.map((item) => ({
        id: item.id,
        impact: item.impact,
        help: item.help,
        count: item.nodes.length,
      })),
    };
  });
  const serious = result.violations.filter(
    (item) => item.impact === 'serious' || item.impact === 'critical',
  );
  record(`${label} axe has no violations`, result.violations.length === 0, result.violations.map((v) => v.id).join(','));
  record(`${label} axe has no serious/critical`, serious.length === 0, serious.map((v) => v.id).join(','));
  return result;
}

const scans = [];
for (const item of [
  { label: 'main home zh light', url: bases.beverages + '/', theme: 'light', width: 390, height: 844 },
  { label: 'main home en dark', url: bases.beverages + '/en/', theme: 'dark', width: 390, height: 844 },
  { label: 'guide recipe zh', url: bases.guide + '/recipes/negroni/', theme: 'light', width: 390, height: 844 },
  { label: 'culture article en', url: bases.culture + '/en/articles/time-in-a-cup/', theme: 'dark', width: 1440, height: 900 },
  { label: 'atlas museum', url: bases.atlas + '/places/gujing-wine-culture-museum/', theme: 'light', width: 390, height: 844 },
  { label: 'atlas curated place', url: bases.atlas + '/places/american-bar-savoy/', theme: 'light', width: 390, height: 844 },
  { label: 'search page empty', url: bases.beverages + '/search/', theme: 'light', width: 390, height: 844 },
]) {
  const page = await newPage(item.width, item.height, item.theme);
  await goto(page, item.url);
  const report = await axeScan(page, item.label);
  scans.push({ ...item, ...report });
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/search/?q=' + encodeURIComponent('内格罗尼'));
  await page.waitForSelector('.search-result', { timeout: 15000 });
  const report = await axeScan(page, 'search page with results');
  scans.push({ label: 'search page with results', url: page.url(), ...report });
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/saved/');
  await page.evaluate(() => {
    localStorage.setItem(
      'hejiu:saved:v1',
      JSON.stringify([
        {
          id: 'recipe:negroni',
          title: '内格罗尼配方（IBA 版本）',
          site: 'guide',
          type: 'recipe',
          savedAt: '2026-10-29T00:00:00.000Z',
        },
      ]),
    );
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true');
  const report = await axeScan(page, 'saved page with item');
  scans.push({ label: 'saved page with item', url: page.url(), ...report });
  const importControl = await page.evaluate(() => {
    const button = document.querySelector('[data-saved-import-trigger]');
    const input = document.querySelector('[data-saved-import]');
    return {
      tag: button?.tagName,
      tabIndex: button?.tabIndex,
      inputHiddenAttribute: input?.hasAttribute('hidden'),
      inputClass: input?.className,
    };
  });
  record('saved import has a keyboard button', importControl.tag === 'BUTTON' && importControl.tabIndex >= 0, JSON.stringify(importControl));
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  await page.click('[data-open-search]');
  await page.waitForFunction(() => document.querySelector('#hejiu-search-dialog')?.open);
  const report = await axeScan(page, 'search dialog open');
  scans.push({ label: 'search dialog open', url: page.url(), ...report });
  await page.screenshot({ path: path.join(screenshots, 'a11y-search-dialog.png') });
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  await page.click('.mobile-menu > summary');
  await page.waitForFunction(() => document.querySelector('.mobile-menu')?.hasAttribute('open'));
  const report = await axeScan(page, 'mobile menu open');
  scans.push({ label: 'mobile menu open', url: page.url(), ...report });
  await page.screenshot({ path: path.join(screenshots, 'a11y-mobile-menu.png') });
  await page.close();
}

// Keyboard and focus behavior.
{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => ({
    text: document.activeElement?.textContent?.trim(),
    className: document.activeElement?.className,
  }));
  record('first Tab reaches skip link', skip.className?.includes('skip-link'), JSON.stringify(skip));
  await page.keyboard.press('Enter');
  await new Promise((resolve) => setTimeout(resolve, 200));
  const skipResult = await page.evaluate(() => ({
    hash: window.location.hash,
    active: document.activeElement?.id,
    mainTop: document.querySelector('#main')?.getBoundingClientRect().top,
  }));
  record('skip link focuses main', skipResult.hash === '#main' && skipResult.active === 'main', JSON.stringify(skipResult));

  await page.focus('[data-open-search]');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#hejiu-search-dialog')?.open);
  await new Promise((resolve) => setTimeout(resolve, 100));
  const dialogFocus = await page.evaluate(() => document.activeElement?.id);
  record('search dialog moves focus to input', dialogFocus === 'search-dialog-input', dialogFocus ?? '');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#hejiu-search-dialog')?.open);
  await new Promise((resolve) => setTimeout(resolve, 100));
  const restored = await page.evaluate(() => document.activeElement?.hasAttribute('data-open-search'));
  record('search dialog restores focus to trigger', restored, String(restored));

  await page.focus('[data-theme-toggle]');
  await page.keyboard.press('Enter');
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.themeChoice);
  record('theme button works with keyboard', ['light', 'dark', 'system'].includes(themeAfter), themeAfter ?? '');

  await page.focus('.mobile-menu > summary');
  await page.keyboard.press('Enter');
  const menuOpen = await page.evaluate(() => document.querySelector('.mobile-menu')?.hasAttribute('open'));
  await page.keyboard.press('Escape');
  const menuClosed = await page.evaluate(() => !document.querySelector('.mobile-menu')?.hasAttribute('open'));
  record('mobile menu keyboard open and Escape close', menuOpen && menuClosed, `${menuOpen}/${menuClosed}`);
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/search/');
  await page.focus('[data-search-page] [data-search-input]');
  await page.keyboard.type('Negroni');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.search-result', { timeout: 15000 });
  const keyboardSearch = await page.evaluate(() => ({
    results: document.querySelectorAll('.search-result').length,
    url: window.location.href,
  }));
  record('search page submits with Enter', keyboardSearch.results >= 1, `${keyboardSearch.results} ${keyboardSearch.url}`);
  await page.close();
}

{
  const page = await newPage(1440, 900, 'light');
  await goto(page, bases.guide + '/recipes/negroni/');
  const target = await page.$eval('.detail-aside .toc a', (link) => link.getAttribute('href'));
  await page.focus('.detail-aside .toc a');
  await page.keyboard.press('Enter');
  await new Promise((resolve) => setTimeout(resolve, 200));
  const hash = await page.evaluate(() => decodeURIComponent(window.location.hash));
  record('TOC link navigates to section', hash === target, `${hash} / ${target}`);
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await goto(page, bases.beverages + '/');
  const motion = await page.evaluate(() => {
    const hero = document.querySelector('.hero__mascot-card');
    const button = document.querySelector('.button');
    const heroBefore = hero ? getComputedStyle(hero, '::before') : null;
    return {
      animation: heroBefore?.animationDuration,
      transition: button ? getComputedStyle(button).transitionDuration : null,
    };
  });
  const durations = `${motion.animation},${motion.transition}`;
  record(
    'reduced motion shortens animations',
    durations.split(',').every((value) => parseFloat(value || '1') <= 0.01),
    durations,
  );
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  const targets = await page.evaluate(() => {
    const selectors = ['.icon-button', '.button', '.bottom-nav__item', '.type-chip', '.lang-switch'];
    const rows = [];
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        rows.push({ selector, width: rect.width, height: rect.height, text: element.textContent?.trim().slice(0, 30) });
      }
    }
    return rows;
  });
  const small = targets.filter((target) => target.width < 44 || target.height < 44);
  record('touch targets at least 44px', small.length === 0, JSON.stringify(small));

  await page.click('[data-open-search]');
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/search/');
  const filterTargets = await page.evaluate(() =>
    [...document.querySelectorAll('.filter-pill')].map((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  record(
    'search filter pills at least 44px',
    filterTargets.every((target) => target.width >= 44 && target.height >= 44),
    JSON.stringify(filterTargets),
  );
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  await page.click('[data-theme-toggle]');
  const cookie = await page.evaluate(() => document.cookie);
  record('local preview does not write shared-domain theme cookie', !cookie.includes('hejiu_theme'), cookie || '(none)');
  await page.close();
}

// Landscape and long English title reflow.
for (const viewport of [
  { width: 844, height: 390, label: 'landscape 844x390' },
  { width: 768, height: 390, label: 'landscape 768x390' },
  { width: 320, height: 800, label: '320 English long title' },
  { width: 640, height: 900, label: '640 reflow (200% of 1280)' },
]) {
  const page = await newPage(viewport.width, viewport.height, 'light');
  const url = viewport.label.includes('English')
    ? bases.beverages + '/en/producers/gujing-distillery/'
    : bases.guide + '/recipes/negroni/';
  await goto(page, url);
  const layout = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const rect = h1?.getBoundingClientRect();
    return {
      docWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      h1Right: rect?.right,
      h1Width: rect?.width,
      bottomNav: getComputedStyle(document.querySelector('.bottom-nav')).display,
    };
  });
  record(
    `${viewport.label} no horizontal overflow`,
    layout.docWidth <= layout.innerWidth + 1 && (layout.h1Right ?? 0) <= layout.innerWidth + 1,
    JSON.stringify(layout),
  );
  await page.close();
}

await browser.close();

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: 'Headless Chrome via puppeteer-core',
    axe: '4.14.0',
    note: 'Automated WCAG 2.1/2.2 A/AA and best-practice scan, keyboard checks, reduced motion and reflow; not a screen-reader or physical-device test.',
  },
  results,
  failures,
  scans,
  screenshots: ['evidence/screenshots/a11y-search-dialog.png', 'evidence/screenshots/a11y-mobile-menu.png'],
};
fs.writeFileSync(path.join(evidence, 'G3-a11y.json'), `${JSON.stringify(report, null, 2)}\n`);
const violationCount = scans.reduce((sum, scan) => sum + scan.violations.length, 0);
console.log(`\n${results.length - failures.length}/${results.length} checks passed; ${violationCount} axe violations.`);
if (failures.length > 0 || violationCount > 0) process.exitCode = 1;
