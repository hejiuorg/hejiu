import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const home = 'http://127.0.0.1:4401/';
const search = 'http://127.0.0.1:4401/search/';
const detail = 'http://127.0.0.1:4401/cocktails/negroni/';

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function setupPage() {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => {
    window.__perf = { lcp: 0, cls: 0, longtasks: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__perf.lcp = Math.max(window.__perf.lcp, entry.startTime);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__perf.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        window.__perf.longtasks += list.getEntries().length;
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      /* unsupported */
    }
  });
  return page;
}

async function metrics(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource').map((entry) => ({
      name: entry.name,
      type: entry.initiatorType,
      transfer: entry.transferSize || 0,
      encoded: entry.encodedBodySize || 0,
      decoded: entry.decodedBodySize || 0,
      duration: Math.round(entry.duration),
    }));
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null;
    const sum = (items) => items.reduce((total, item) => total + item.encoded, 0);
    return {
      fcp,
      lcp: window.__perf.lcp || null,
      cls: window.__perf.cls,
      longtasks: window.__perf.longtasks,
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      loadEventEnd: Math.round(nav?.loadEventEnd ?? 0),
      htmlEncoded: nav?.encodedBodySize ?? 0,
      htmlDecoded: nav?.decodedBodySize ?? 0,
      requestCount: resources.length,
      totalEncoded: (nav?.encodedBodySize ?? 0) + sum(resources),
      cssEncoded: sum(resources.filter((item) => item.name.endsWith('.css'))),
      jsEncoded: sum(resources.filter((item) => item.name.endsWith('.js'))),
      imageEncoded: sum(resources.filter((item) => /\.(?:svg|png|webp|jpg|jpeg|avif)$/.test(item.name))),
      pagefindEncoded: sum(resources.filter((item) => item.name.includes('pagefind'))),
      resources,
      domNodes: document.getElementsByTagName('*').length,
    };
  });
}

async function throttle(page, mobile = true) {
  if (!mobile) return;
  const client = await page.createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: 'cellular3g',
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

async function measure(url, viewport, mobileThrottle) {
  const page = await setupPage();
  await page.setViewport(viewport);
  await throttle(page, mobileThrottle);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const data = await metrics(page);
  await page.close();
  return data;
}

const results = {};
results.homeMobile = await measure(home, { width: 390, height: 844, deviceScaleFactor: 1 }, true);
results.homeDesktop = await measure(home, { width: 1440, height: 900, deviceScaleFactor: 1 }, false);
results.detailMobile = await measure(detail, { width: 390, height: 844, deviceScaleFactor: 1 }, true);

{
  const page = await setupPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(search, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const before = await metrics(page);
  await page.type('[data-search-page] [data-search-input]', 'Negroni');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.search-result', { timeout: 20000 });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const after = await metrics(page);
  results.search = {
    before: {
      pagefindEncoded: before.pagefindEncoded,
      jsEncoded: before.jsEncoded,
      requestCount: before.requestCount,
    },
    after: {
      pagefindEncoded: after.pagefindEncoded,
      jsEncoded: after.jsEncoded,
      requestCount: after.requestCount,
      results: await page.$$eval('.search-result', (items) => items.length),
      pagefindResources: after.resources
        .filter((item) => item.name.includes('pagefind'))
        .map((item) => ({ name: item.name, encoded: item.encoded })),
    },
  };
  await page.close();
}

{
  const page = await setupPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(home, { waitUntil: 'networkidle0' });
  const brand = await page.evaluate(async () => {
    const response = await fetch('/brand/d-mark.svg');
    const text = await response.text();
    const image = document.querySelector('.mascot__img');
    return {
      status: response.status,
      bytes: text.length,
      imageSrc: image?.getAttribute('src'),
      imageLoaded: image?.complete && image?.naturalWidth > 0,
      imageNatural: image ? `${image.naturalWidth}x${image.naturalHeight}` : null,
    };
  });
  results.brand = brand;
  await page.close();
}

await browser.close();

const budgets = {
  homeJsUnder50kb: results.homeMobile.jsEncoded < 50 * 1024,
  homeCssUnder60kb: results.homeMobile.cssEncoded < 60 * 1024,
  homeTotalUnder200kb: results.homeMobile.totalEncoded < 200 * 1024,
  homeLcpUnder2500ms: (results.homeMobile.lcp ?? 99999) < 2500,
  homeClsUnder01: results.homeMobile.cls < 0.1,
  searchNotLoadedOnHome: results.homeMobile.pagefindEncoded === 0,
  searchLoadedOnDemand: results.search.before.pagefindEncoded === 0 && results.search.after.pagefindEncoded > 0,
  brandImageLoads: results.brand.status === 200 && results.brand.imageLoaded,
};

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: 'Headless Chrome via puppeteer-core',
    server: 'Local static server, loopback, no TLS/CDN/compression',
    throttling: 'Mobile run: 1.6 Mbps down / 750 kbps up / 150 ms latency, CPU 4×; desktop unthrottled',
    note: 'Lab measurements only; not field data or Lighthouse scoring.',
  },
  metrics: results,
  budgets,
  allBudgetsPassed: Object.values(budgets).every(Boolean),
};
fs.writeFileSync(path.join(evidence, 'G3-performance.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ budgets, mobile: {
  fcp: results.homeMobile.fcp,
  lcp: results.homeMobile.lcp,
  cls: results.homeMobile.cls,
  js: results.homeMobile.jsEncoded,
  css: results.homeMobile.cssEncoded,
  total: results.homeMobile.totalEncoded,
  requests: results.homeMobile.requestCount,
}, search: results.search, brand: results.brand }, null, 2));
if (!report.allBudgetsPassed) process.exitCode = 1;
