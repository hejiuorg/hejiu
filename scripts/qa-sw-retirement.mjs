import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const evidence = path.join(root, 'evidence');
const transitionWorker = fs.readFileSync(
  path.join(
    root,
    'site-repositories',
    'site-alcoholic-beverages',
    'apps',
    'main',
    'public',
    'sw.js',
  ),
  'utf8',
);
const oldWorker = `
const CACHE = 'hejiu-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.put('/old-cache.txt', new Response('old'))));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  // Intentionally no-op: simulate the old cache-first worker without blocking the test origin.
});
`;
let version = 'old';
const server = http.createServer((req, res) => {
  if (req.url === '/sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
    res.end(version === 'old' ? oldWorker : transitionWorker);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end('<!doctype html><html><body><h1>legacy site</h1></body></html>');
});
await new Promise((resolve) => server.listen(4525, '127.0.0.1', resolve));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const checks = [];
const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
  await page.goto('http://127.0.0.1:4525/', { waitUntil: 'networkidle0' });
  const initial = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const cache = await caches.open('hejiu-v1');
    await cache.put('/old-cache.txt', new Response('old'));
    return {
      registrations: (await navigator.serviceWorker.getRegistrations()).length,
      caches: await caches.keys(),
      active: Boolean(registration.active),
    };
  });
  record('old worker and hejiu-v1 cache are present', initial.registrations === 1 && initial.caches.includes('hejiu-v1'), JSON.stringify(initial));

  version = 'transition';
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.update();
  });
  await page.waitForFunction(
    async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const keys = await caches.keys();
      return registrations.length === 0 && !keys.includes('hejiu-v1');
    },
    { timeout: 20000 },
  );
  const after = await page.evaluate(async () => ({
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
    caches: await caches.keys(),
  }));
  record('transition worker removes old registration and cache', after.registrations === 0 && !after.caches.includes('hejiu-v1'), JSON.stringify(after));
} finally {
  await browser.close();
  server.close();
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: {
    browser: 'Headless Chrome via puppeteer-core',
    origin: 'http://127.0.0.1:4525',
    note: 'Simulated old hejiu-v1 cache and registration; transition worker served at the same /sw.js URL and scope.',
  },
  checks,
};
fs.writeFileSync(path.join(evidence, 'G6-sw-retirement.json'), `${JSON.stringify(output, null, 2)}\n`);
const failures = checks.filter((check) => !check.ok);
console.log(`\n${checks.length - failures.length}/${checks.length} checks passed.`);
if (failures.length > 0) process.exitCode = 1;
