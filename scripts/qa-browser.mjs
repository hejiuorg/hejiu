import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const screenshots = path.join(evidence, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chrome)) throw new Error(`Chrome not found at ${chrome}`);

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
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});

async function newPage(width, height, theme = 'system') {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (theme === 'dark') {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  } else {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  }
  await page.evaluateOnNewDocument((choice) => {
    try {
      localStorage.setItem('hejiu:theme', choice);
    } catch {
      /* ignore */
    }
  }, theme);
  return page;
}

async function goto(page, url) {
  const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.clientReady === 'true', {
    timeout: 10000,
  });
  return response;
}

async function layoutAudit(page, label) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const h1 = document.querySelector('h1');
    const h1Rect = h1 ? h1.getBoundingClientRect() : null;
    const nav = document.querySelector('.bottom-nav');
    const desktop = document.querySelector('.desktop-nav');
    const navStyle = nav ? getComputedStyle(nav) : null;
    const desktopStyle = desktop ? getComputedStyle(desktop) : null;
    const refs = document.body.innerHTML.includes('href="ref:');
    const offenders = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || style.display === 'none') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.right > width + 1;
      })
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`);
    return {
      width,
      docWidth,
      bodyWidth,
      h1Text: h1?.textContent?.trim().slice(0, 60) ?? null,
      h1Width: h1Rect?.width ?? null,
      h1Right: h1Rect?.right ?? null,
      navDisplay: navStyle?.display ?? null,
      navTop: nav ? nav.getBoundingClientRect().top : null,
      desktopDisplay: desktopStyle?.display ?? null,
      unresolvedRefs: refs,
      offenders,
      theme: document.documentElement.dataset.theme,
      themeChoice: document.documentElement.dataset.themeChoice,
    };
  });
}

async function shot(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(screenshots, name), fullPage });
  return `evidence/screenshots/${name}`;
}

const viewports = [
  { width: 320, height: 800, label: '320' },
  { width: 390, height: 844, label: '390' },
  { width: 768, height: 1024, label: '768' },
  { width: 1440, height: 900, label: '1440' },
];

for (const viewport of viewports) {
  const page = await newPage(viewport.width, viewport.height, viewport.width === 390 ? 'dark' : 'light');
  await goto(page, bases.beverages + '/');
  const audit = await layoutAudit(page);
  record(
    `${viewport.label} home no horizontal overflow`,
    audit.docWidth <= audit.width + 1 && audit.bodyWidth <= audit.width + 1,
    `doc=${audit.docWidth} body=${audit.bodyWidth} offenders=${audit.offenders.join(',')}`,
  );
  record(`${viewport.label} hero h1 fits`, audit.h1Right !== null && audit.h1Right <= audit.width + 1, `${audit.h1Width}/${audit.h1Right}`);
  record(`${viewport.label} no unresolved ref links`, !audit.unresolvedRefs);
  if (viewport.width <= 767) {
    record(`${viewport.label} bottom nav visible`, audit.navDisplay === 'grid' || audit.navDisplay === 'flex', audit.navDisplay ?? 'none');
    record(`${viewport.label} desktop nav hidden`, audit.desktopDisplay === 'none', audit.desktopDisplay ?? 'none');
  } else {
    record(`${viewport.label} bottom nav hidden`, audit.navDisplay === 'none', audit.navDisplay ?? 'none');
  }
  if (viewport.width >= 861) {
    record(`${viewport.label} desktop nav visible`, audit.desktopDisplay === 'flex', audit.desktopDisplay ?? 'none');
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const cover = await page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav');
    const footer = document.querySelector('.site-footer');
    if (!nav || !footer) return { covered: false, gap: null };
    const navStyle = getComputedStyle(nav);
    if (navStyle.display === 'none') return { covered: false, gap: null };
    const navRect = nav.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    return { covered: footerRect.bottom > navRect.top + 1, gap: navRect.top - footerRect.bottom };
  });
  record(`${viewport.label} bottom nav does not cover footer`, !cover.covered, `gap=${cover.gap}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, `home-${viewport.label}-${viewport.width === 390 ? 'dark' : 'light'}.png`, viewport.width >= 768);
  await page.close();
}

// Detail, culture, atlas and search at mobile width.
{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.guide + '/recipes/negroni/');
  const detail = await page.evaluate(() => ({
    title: document.title,
    relations: [...document.querySelectorAll('.relation-card')].map((a) => a.getAttribute('href')),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    refs: document.body.innerHTML.includes('href="ref:'),
  }));
  record('recipe detail has no overflow', !detail.overflow);
  record('recipe detail has resolved relations', detail.relations.length >= 2, detail.relations.join(','));
  record('recipe detail has no unresolved refs', !detail.refs);
  await shot(page, 'recipe-390-light.png');
  const relationHref = detail.relations.find((href) => href && (href.includes('4401') || href.includes('hejiu.org')));
  if (relationHref) {
    const localRelation = relationHref.replace(/^https:\/\/hejiu\.org/, bases.beverages);
    await page.goto(localRelation, { waitUntil: 'networkidle0' });
    record('cross-site relation opens main site', page.url().startsWith(bases.beverages + '/'), page.url());
  } else {
    record('cross-site relation opens main site', false, 'no main-site relation found');
  }
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.guide + '/recipes/negroni/');
  const langHref = await page.$eval('.lang-switch', (element) => element.getAttribute('href'));
  await page.goto(new URL(langHref, page.url()).href, { waitUntil: 'networkidle0' });
  record('language switch reaches English entity', page.url().endsWith('/en/recipes/negroni/'), page.url());
  const hreflang = await page.$$eval('link[rel=alternate]', (links) => links.map((link) => link.getAttribute('hreflang')));
  record('English detail has zh/en hreflang', hreflang.includes('zh') && hreflang.includes('en'), hreflang.join(','));
  await shot(page, 'recipe-en-390-light.png');
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/search/?q=' + encodeURIComponent('内格罗尼'));
  await page.waitForSelector('.search-result', { timeout: 15000 });
  const search = await page.evaluate(() => ({
    count: document.querySelectorAll('.search-result').length,
    first: document.querySelector('.search-result')?.getAttribute('href'),
    status: document.querySelector('[data-search-status]')?.textContent,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  record('Chinese search returns results', search.count >= 1, `${search.count} ${search.status}`);
  record('search result links to a real target', Boolean(search.first), search.first ?? '');
  record('search page has no overflow', !search.overflow);
  await shot(page, 'search-zh-390-light.png', true);
  await page.close();
}

{
  const page = await newPage(1440, 900, 'dark');
  await goto(page, bases.culture + '/articles/time-in-a-cup/');
  const culture = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent,
    relations: [...document.querySelectorAll('.relation-card')].map((a) => a.getAttribute('href')),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    proseWidth: document.querySelector('.prose')?.getBoundingClientRect().width,
  }));
  record('culture long-form page has no overflow', !culture.overflow, `prose=${culture.proseWidth}`);
  record('culture article links to related style', culture.relations.some((href) => href?.includes('/styles/')), culture.relations.join(','));
  await shot(page, 'culture-1440-dark.png', true);
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.atlas + '/places/gujing-wine-culture-museum/');
  const atlas = await page.evaluate(() => ({
    title: document.title,
    relations: [...document.querySelectorAll('.relation-card')].map((a) => a.getAttribute('href')),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  record('atlas museum page has no overflow', !atlas.overflow);
  record('atlas museum links to producer', atlas.relations.some((href) => href?.includes('/producers/')), atlas.relations.join(','));
  await shot(page, 'atlas-museum-390-light.png');
  await goto(page, bases.atlas + '/places/american-bar-savoy/');
  const curatedPlace = await page.evaluate(() => ({
    robots: document.querySelector('meta[name=robots]')?.content,
    state: document.querySelector('meta[name=hejiu-content-state]')?.content,
    banner: Boolean(document.querySelector('.archive-banner')),
    badge: document.querySelector('.detail-meta')?.textContent,
  }));
  record(
    'curated place is published, indexable and has no archive banner',
    curatedPlace.robots?.includes('index') && curatedPlace.state === 'published' && !curatedPlace.banner,
    JSON.stringify(curatedPlace),
  );
  await shot(page, 'atlas-place-390-light.png');
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  await page.click('[data-open-search]');
  await page.type('#hejiu-search-dialog [data-search-input]', '内格罗尼');
  await page.click('#hejiu-search-dialog button[type=submit]');
  await page.waitForSelector('#hejiu-search-dialog .search-result', { timeout: 15000 });
  const dialogSearch = await page.evaluate(() => ({
    href: window.location.href,
    open: document.querySelector('#hejiu-search-dialog')?.open,
    results: document.querySelectorAll('#hejiu-search-dialog .search-result').length,
    status: document.querySelector('#hejiu-search-dialog [data-search-status]')?.textContent,
  }));
  record('dialog search stays on the current page URL', dialogSearch.href === bases.beverages + '/', dialogSearch.href);
  record('dialog search returns results', dialogSearch.open && dialogSearch.results >= 1, `${dialogSearch.results} ${dialogSearch.status}`);
  await page.screenshot({ path: path.join(screenshots, 'search-dialog-390-light.png') });
  await page.close();
}

{
  const page = await newPage(390, 844, 'system');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await goto(page, bases.beverages + '/');
  const initial = await page.evaluate(() => ({
    choice: document.documentElement.dataset.themeChoice,
    theme: document.documentElement.dataset.theme,
    icon: getComputedStyle(document.querySelector('.theme-icon--system')).display,
  }));
  record('system theme resolves dark', initial.choice === 'system' && initial.theme === 'dark', JSON.stringify(initial));
  await page.click('[data-theme-toggle]');
  const light = await page.evaluate(() => ({ choice: document.documentElement.dataset.themeChoice, theme: document.documentElement.dataset.theme }));
  record('theme toggle switches to light', light.choice === 'light' && light.theme === 'light', JSON.stringify(light));
  await page.click('[data-theme-toggle]');
  const dark = await page.evaluate(() => ({ choice: document.documentElement.dataset.themeChoice, theme: document.documentElement.dataset.theme }));
  record('theme toggle switches to dark', dark.choice === 'dark' && dark.theme === 'dark', JSON.stringify(dark));
  await page.close();
}

{
  const page = await newPage(390, 844, 'light');
  await goto(page, bases.beverages + '/');
  await page.click('.mobile-menu > summary');
  const menu = await page.evaluate(() => {
    const panel = document.querySelector('.mobile-menu__panel');
    return {
      open: document.querySelector('.mobile-menu')?.hasAttribute('open'),
      culture: [...panel.querySelectorAll('a')].find((a) => a.textContent.includes('酒文化'))?.href,
      visible: panel ? getComputedStyle(panel).display !== 'none' : false,
    };
  });
  record('mobile menu exposes culture site', menu.open && menu.visible && Boolean(menu.culture), menu.culture ?? '');
  await shot(page, 'mobile-menu-390-light.png');
  await page.close();
}

await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  environment: {
    browser: 'Headless Chrome via puppeteer-core',
    executable: chrome,
    note: 'Desktop headless browser at four viewport widths; not a physical-device test.',
  },
  viewports: viewports.map((viewport) => `${viewport.width}x${viewport.height}`),
  results,
  failures,
  screenshots: fs.readdirSync(screenshots).sort().map((name) => `evidence/screenshots/${name}`),
};
fs.writeFileSync(path.join(evidence, 'G2-browser-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${results.length - failures.length}/${results.length} checks passed.`);
if (failures.length > 0) process.exitCode = 1;
