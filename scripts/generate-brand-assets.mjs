import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
const pngDir = path.join(uiBrand, 'png');
fs.mkdirSync(pngDir, { recursive: true });

const colors = {
  'on-light': {
    line: '#2b1a10',
    foam: '#fff4d8',
    beer: '#f5a623',
    face: '#2b1a10',
    highlight: '#fff9e8',
    highlightOpacity: '0.6',
  },
  'on-dark': {
    line: '#fff4d8',
    foam: '#fff4d8',
    beer: '#f5a623',
    face: '#2b1a10',
    highlight: '#fff9e8',
    highlightOpacity: '0.65',
  },
};

function mascotSvg(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" fill="none">
  <path d="M88 62h5c10 0 17 7 17 16s-7 16-17 16h-5" stroke="${c.line}" stroke-width="20" stroke-linecap="round"/>
  <path d="M88 62h5c10 0 17 7 17 16s-7 16-17 16h-5" stroke="${c.beer}" stroke-width="9" stroke-linecap="round"/>
  <rect x="16" y="36" width="76" height="74" rx="20" fill="${c.beer}" stroke="${c.line}" stroke-width="8"/>
  <path d="M16 44c0-13 9-22 21-22 7 0 13 3 17 8 4-5 10-8 17-8 12 0 21 9 21 22v2c0 4-3 7-7 7H23c-4 0-7-3-7-7v-2Z" fill="${c.foam}"/>
  <path d="M16 44c0-13 9-22 21-22 7 0 13 3 17 8 4-5 10-8 17-8 12 0 21 9 21 22" stroke="${c.line}" stroke-width="8" stroke-linecap="round"/>
  <rect x="30" y="62" width="8" height="30" rx="4" fill="${c.highlight}" fill-opacity="${c.highlightOpacity}"/>
  <circle cx="52" cy="70" r="5" fill="${c.face}"/>
  <circle cx="72" cy="70" r="5" fill="${c.face}"/>
  <path d="M56 84c2.5 3.5 9.5 3.5 12 0" stroke="${c.face}" stroke-width="4.5" stroke-linecap="round"/>
</svg>
`;
}

function markSvg(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <path d="M47 33h3c7 0 12 4 12 10s-5 10-12 10h-3" stroke="${c.line}" stroke-width="10" stroke-linecap="round"/>
  <path d="M47 33h3c7 0 12 4 12 10s-5 10-12 10h-3" stroke="${c.beer}" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="6" y="18" width="42" height="40" rx="10" fill="${c.beer}" stroke="${c.line}" stroke-width="4.5"/>
  <path d="M6 23c0-7 5-12 12-12 4 0 7 2 9 4 2-2 5-4 9-4 7 0 12 5 12 12v2c0 2-2 4-4 4H10c-2 0-4-2-4-4v-2Z" fill="${c.foam}"/>
  <path d="M6 23c0-7 5-12 12-12 4 0 7 2 9 4 2-2 5-4 9-4 7 0 12 5 12 12" stroke="${c.line}" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="12" y="30" width="4" height="16" rx="2" fill="${c.highlight}" fill-opacity="${c.highlightOpacity}"/>
  <circle cx="22" cy="34" r="3.6" fill="${c.face}"/>
  <circle cx="34" cy="34" r="3.6" fill="${c.face}"/>
  <path d="M24 41c1.5 2.2 5.5 2.2 7 0" stroke="${c.face}" stroke-width="2.6" stroke-linecap="round"/>
</svg>
`;
}

const files = new Map();
files.set('d-mascot.svg', mascotSvg(colors['on-light']));
files.set('d-mascot-on-dark.svg', mascotSvg(colors['on-dark']));
files.set('d-mark.svg', markSvg(colors['on-light']));
files.set('d-mark-on-dark.svg', markSvg(colors['on-dark']));

for (const [name, content] of files) {
  fs.writeFileSync(path.join(uiBrand, name), content);
}

const pngs = [
  ['d-mark.svg', 'd-mark-16.png', 16],
  ['d-mark.svg', 'd-mark-32.png', 32],
  ['d-mark.svg', 'd-mark-48.png', 48],
  ['d-mark.svg', 'd-mark-180.png', 180],
  ['d-mark.svg', 'd-mark-192.png', 192],
  ['d-mark.svg', 'd-mark-512.png', 512],
  ['d-mascot.svg', 'd-mascot-64.png', 64],
  ['d-mascot.svg', 'd-mascot-512.png', 512],
];

const metadata = [];
for (const [source, target, size] of pngs) {
  const svg = files.get(source);
  const output = path.join(pngDir, target);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(output);
  const meta = await sharp(output).metadata();
  metadata.push({
    file: `png/${target}`,
    width: meta.width,
    height: meta.height,
    alpha: meta.hasAlpha,
    bytes: fs.statSync(output).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),
  });
}

const stale = [
  'd-mascot-mono-light.svg',
  'd-mascot-mono-dark.svg',
  'd-mark-mono-light.svg',
  'd-mark-mono-dark.svg',
];
for (const name of stale) fs.rmSync(path.join(uiBrand, name), { force: true });

const appDirs = [
  'site-alcoholic-beverages/apps/main',
  'site-alcohol-guide/apps/site',
  'site-alcohol-culture/apps/site',
  'site-alcohol-atlas/apps/site',
].map((relative) => path.join(root, 'site-repositories', relative));

for (const app of appDirs) {
  const publicBrand = path.join(app, 'public', 'brand');
  fs.mkdirSync(publicBrand, { recursive: true });
  for (const name of [...files.keys(), ...stale]) fs.rmSync(path.join(publicBrand, name), { force: true });
  for (const name of files.keys()) {
    fs.copyFileSync(path.join(uiBrand, name), path.join(publicBrand, name));
  }
  for (const [, target] of pngs) {
    fs.copyFileSync(path.join(pngDir, target), path.join(publicBrand, target));
  }
  fs.copyFileSync(path.join(uiBrand, 'd-mark.svg'), path.join(app, 'public', 'favicon.svg'));

  const manifestFile = path.join(app, 'public', 'site.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.icons = [
    {
      src: 'brand/d-mark-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'brand/d-mark-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: 'brand/d-mark-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
  ];
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
}

const readme = `# D 品牌资产

本目录是喝酒去 D 泡沫酒杯的品牌资产源文件。D 轮廓来自项目已选定的参考形象，由本项目重新绘制为可编辑矢量。没有嵌入第三方图片、字体或图标。

## 文件

- \`d-mascot.svg\`：主品牌全彩矢量，透明背景，用于 64px 以上品牌展示。
- \`d-mark.svg\`：简化小尺寸标记，用于 favicon、16/32/48px 图标。
- \`d-mascot-on-dark.svg\`：深色背景版本，奶油色外轮廓保持 D 轮廓清楚。
- \`d-mark-on-dark.svg\`：深色背景的小尺寸标记。
- 浅色背景使用 \`d-mascot.svg\` / \`d-mark.svg\` 的深棕轮廓版本。
- \`png/\`：透明 PNG，包含 16、32、48、180、192、512px 图标与 64/512px 主品牌图。

## 颜色

- 主琥珀：\`#f5a623\`
- 泡沫奶油：\`#fff4d8\`
- 轮廓深棕：\`#2b1a10\`
- 小尺寸标记保持同一轮廓、眼口比例与线宽；16px 时优先使用 \`d-mark.svg\`，不要把全彩主图直接缩到 16px。

## 使用

- 透明背景，保持比例，不拉伸、不旋转、不改眼口比例。
- 浅色背景使用深棕轮廓版本；深色背景使用 -on-dark 版本，保持杯柄与泡沫轮廓清楚。
- 16px 最小使用 \`d-mark\`，推荐 32/48px；主品牌图推荐 64px 以上。
- 页面内使用 \`/brand/\` 下的公开副本；源文件在本目录维护。

## 权利

项目品牌资产的著作权采用 CC BY 4.0（与项目内容一致）；商标权不随 CC BY 4.0 授予。原始参考图与生成记录保留在项目交接资料中。署名：喝酒去 / Hejiu。
`;

fs.writeFileSync(path.join(uiBrand, 'README.md'), readme);
fs.writeFileSync(
  path.join(uiBrand, 'brand-manifest.json'),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      rights: 'project-owned brand assets; not an open licence',
      colors: {
        amber: '#f5a623',
        foam: '#fff4d8',
        outline: '#2b1a10',
      },
      sourceFiles: [...files.keys()].map((name) => ({
        file: name,
        sha256: crypto.createHash('sha256').update(files.get(name)).digest('hex'),
      })),
      png: metadata,
    },
    null,
    2,
  )}\n`,
);

console.log(`Generated ${files.size} SVGs and ${pngs.length} PNGs for ${appDirs.length} apps.`);
