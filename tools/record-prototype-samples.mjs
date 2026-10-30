import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PROJECT = path.dirname(ROOT);
const prototype = await import(
  new URL(`file:///${path.join(PROJECT, 'prototype', 'content.js').replace(/\\/g, '/')}`)
);
const sourceFile = path.join(PROJECT, 'prototype', 'content.js');
const sourceText = fs.readFileSync(sourceFile, 'utf8');
const sourceSha256 = crypto
  .createHash('sha256')
  .update(sourceText.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'))
  .digest('hex');

const textOf = (part) => (part?.sections ?? []).map(([, text]) => text).join('\n\n');
const entries = [
  ...prototype.guides.map((guide) => ({
    kind: 'guide',
    prototypeId: guide.id,
    titleZh: guide.zh?.title ?? guide.id,
    titleEn: guide.en?.title ?? null,
    source: guide.source ?? null,
    zhSections: guide.zh?.sections?.length ?? 0,
    enSections: guide.en?.sections?.length ?? 0,
    zhCharacters: textOf(guide.zh).length,
    enCharacters: textOf(guide.en).length,
    status: guide.id === 'first-tasting' ? 'migrated-reviewed-sample' : 'pending-editorial-review',
    target: guide.id === 'first-tasting' ? 'guide:first-tasting' : null,
    note:
      guide.id === 'first-tasting'
        ? '已迁为 guides/first-tasting，中英双语并完成来源与文字审核。'
        : '样站有中英文文本，但来源、事实与译文尚未完成 editorial review；本轮不复制为正式正文。',
  })),
  ...prototype.stories.map((story) => ({
    kind: 'article',
    prototypeId: story.id,
    titleZh: story.zh?.title ?? story.id,
    titleEn: story.en?.title ?? null,
    source: story.source ?? null,
    zhSections: story.zh?.sections?.length ?? 0,
    enSections: story.en?.sections?.length ?? 0,
    zhCharacters: textOf(story.zh).length,
    enCharacters: textOf(story.en).length,
    status: 'pending-editorial-review',
    target: null,
    note: '样站三篇文化文章尚未迁为正式正文；保留原文件并登记去向，待 G4 内容审核。',
  })),
];

const payload = {
  schemaVersion: 1,
  date: '2026-10-29',
  sourceFile: 'prototype/content.js',
  sourceSha256,
  counts: {
    guides: prototype.guides.length,
    stories: prototype.stories.length,
    migrated: entries.filter((entry) => entry.status === 'migrated-reviewed-sample').length,
    pending: entries.filter((entry) => entry.status === 'pending-editorial-review').length,
  },
  entries,
};
fs.writeFileSync(
  path.join(ROOT, 'migration', 'prototype-samples.json'),
  `${JSON.stringify(payload, null, 2)}\n`,
  'utf8',
);
console.log(JSON.stringify(payload.counts, null, 2));
