import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const uiBrand = path.join(
  root,
  'site-repositories',
  'site-alcoholic-beverages',
  'packages',
  'ui',
  'src',
  'assets',
  'brand',
);
const evidence = path.join(root, 'evidence');
const screenshots = path.join(evidence, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });

const svg = (name) => fs.readFileSync(path.join(uiBrand, name));
const dataUri = (name) => `data:image/svg+xml;base64,${svg(name).toString('base64')}`;
const files = [
  'd-mascot.svg',
  'd-mark.svg',
  'd-mascot-on-dark.svg',
  'd-mark-on-dark.svg',
];
const pngs = [
  'd-mark-16.png',
  'd-mark-32.png',
  'd-mark-48.png',
  'd-mark-180.png',
  'd-mark-192.png',
  'd-mark-512.png',
  'd-mascot-64.png',
  'd-mascot-512.png',
];

const metadata = [];
for (const png of pngs) {
  const file = path.join(uiBrand, 'png', png);
  const meta = await sharp(file).metadata();
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cornerAlpha = info.channels === 4 ? data[3] : 255;
  metadata.push({
    file: `png/${png}`,
    width: meta.width,
    height: meta.height,
    hasAlpha: meta.hasAlpha,
    cornerAlpha,
    bytes: fs.statSync(file).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  });
}

const html = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 32px; background: #f6f0e7; color: #241a13; font-family: "Segoe UI", "Microsoft YaHei", sans-serif; }
  h1 { font: 700 28px/1.2 Georgia, serif; margin: 0 0 6px; }
  p { margin: 0 0 22px; color: #6f6257; }
  .panel { display: grid; grid-template-columns: 180px 1fr; gap: 18px; padding: 20px; border-radius: 18px; margin-bottom: 16px; align-items: center; }
  .light { background: #fffdf8; border: 1px solid #e7dbcb; }
  .dark { background: #17120d; color: #f6eee3; border: 1px solid #3a2d22; }
  .panel h2 { font: 700 18px/1.3 Georgia, serif; margin: 0; }
  .panel small { display: block; margin-top: 6px; opacity: .7; }
  .row { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
  .actual { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; }
  .actual img { image-rendering: auto; }
  .zoom { display: flex; align-items: end; gap: 20px; padding-top: 8px; }
  .zoom figure { margin: 0; text-align: center; font-size: 11px; }
  .zoom img { display: block; margin: 0 auto 4px; }
  .mono { display: flex; gap: 18px; align-items: center; }
  .swatches { display: flex; gap: 10px; margin-top: 14px; }
  .swatch { width: 34px; height: 34px; border-radius: 9px; border: 1px solid rgba(0,0,0,.2); }
</style>
</head>
<body>
  <h1>D 品牌资产 · 小尺寸与深浅背景检查</h1>
  <p>实际尺寸 16 / 32 / 48 px，下方为 4× 放大检查；右侧为主品牌与深浅背景版本。</p>

  <section class="panel light">
    <div><h2>浅色背景</h2><small>#fffdf8 · 全彩标记</small></div>
    <div class="row">
      <div class="actual"><img src="${dataUri('d-mark.svg')}" width="16" height="16"><span>16</span></div>
      <div class="actual"><img src="${dataUri('d-mark.svg')}" width="32" height="32"><span>32</span></div>
      <div class="actual"><img src="${dataUri('d-mark.svg')}" width="48" height="48"><span>48</span></div>
      <div class="actual"><img src="${dataUri('d-mascot.svg')}" width="64" height="64"><span>64 mascot</span></div>
      <div class="zoom">
        <figure><img src="${dataUri('d-mark.svg')}" width="64" height="64"><figcaption>16 → 4×</figcaption></figure>
        <figure><img src="${dataUri('d-mark.svg')}" width="128" height="128"><figcaption>32 → 4×</figcaption></figure>
        <figure><img src="${dataUri('d-mark.svg')}" width="192" height="192"><figcaption>48 → 4×</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="panel dark">
    <div><h2>深色背景</h2><small>#17120d · on-dark 版本</small></div>
    <div class="row">
      <div class="actual"><img src="${dataUri('d-mark-on-dark.svg')}" width="16" height="16"><span>16</span></div>
      <div class="actual"><img src="${dataUri('d-mark-on-dark.svg')}" width="32" height="32"><span>32</span></div>
      <div class="actual"><img src="${dataUri('d-mark-on-dark.svg')}" width="48" height="48"><span>48</span></div>
      <div class="actual"><img src="${dataUri('d-mascot-on-dark.svg')}" width="64" height="64"><span>64 mascot</span></div>
      <div class="zoom">
        <figure><img src="${dataUri('d-mark-on-dark.svg')}" width="64" height="64"><figcaption>16 → 4×</figcaption></figure>
        <figure><img src="${dataUri('d-mark-on-dark.svg')}" width="128" height="128"><figcaption>32 → 4×</figcaption></figure>
        <figure><img src="${dataUri('d-mark-on-dark.svg')}" width="192" height="192"><figcaption>48 → 4×</figcaption></figure>
      </div>
    </div>
  </section>

  <section class="panel light">
    <div><h2>深色背景版本</h2><small>奶油色外轮廓保持 D 轮廓与杯柄</small></div>
    <div class="mono">
      <div class="actual" style="background:#17120d;padding:16px;border-radius:12px"><img src="${dataUri('d-mascot-on-dark.svg')}" width="80" height="80"><span>mascot on dark</span></div>
      <div class="actual" style="background:#17120d;padding:12px;border-radius:12px"><img src="${dataUri('d-mark-on-dark.svg')}" width="48" height="48"><span>mark on dark 48</span></div>
      <div class="actual" style="background:#17120d;padding:10px;border-radius:12px"><img src="${dataUri('d-mark-on-dark.svg')}" width="16" height="16"><span>mark on dark 16</span></div>
    </div>
  </section>

  <section class="panel light">
    <div><h2>颜色</h2><small>固定品牌色</small></div>
    <div class="swatches">
      <span class="swatch" style="background:#f5a623" title="#f5a623"></span>
      <span class="swatch" style="background:#fff4d8" title="#fff4d8"></span>
      <span class="swatch" style="background:#2b1a10" title="#2b1a10"></span>
    </div>
  </section>
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.screenshot({ path: path.join(screenshots, 'brand-sheet.png'), fullPage: true });
const rendered = await page.evaluate(() =>
  [...document.images].map((image) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
    loaded: image.complete && image.naturalWidth > 0,
  })),
);
await browser.close();

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  rights: 'project-owned brand assets; not an open licence',
  sourceDirectory: 'site-repositories/site-alcoholic-beverages/packages/ui/src/assets/brand/',
  svgFiles: files.map((name) => ({
    file: name,
    bytes: fs.statSync(path.join(uiBrand, name)).size,
    sha256: crypto.createHash('sha256').update(svg(name)).digest('hex'),
  })),
  png: metadata,
  checks: {
    allSvgPresent: files.every((name) => fs.existsSync(path.join(uiBrand, name))),
    allPngPresent: pngs.every((name) => fs.existsSync(path.join(uiBrand, 'png', name))),
    allRenderedInSheet: rendered.every((image) => image.loaded),
    pngDimensionsCorrect: metadata.every((item) => item.width === item.height),
    transparentCorners: metadata.every((item) => item.cornerAlpha === 0),
    minIconSize: Math.min(...metadata.map((item) => item.width)),
    rightsRecorded: true,
  },
  screenshot: 'evidence/screenshots/brand-sheet.png',
};
fs.writeFileSync(path.join(evidence, 'G3-brand.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.checks, null, 2));
