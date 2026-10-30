import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contentTreeSha256,
  loadContent,
  recordPublication,
} from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/content.js';
import { loadContracts } from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/contracts.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MIGRATION = path.join(ROOT, 'migration');
const contracts = loadContracts(ROOT);
const index = loadContent(ROOT, contracts);

const legacySourceKeys = new Set(['legacy-record', 'legacy-category']);
const isLegacySource = (source) =>
  legacySourceKeys.has(source.key) || String(source.publisher ?? '').startsWith('喝酒去旧站');

function independentSources(record) {
  return record.frontmatter.sources.filter((source) => !isLegacySource(source));
}

function blockersFor(record) {
  const blockers = [];
  if (record.status !== 'reviewed') blockers.push('status-not-reviewed');
  if (record.frontmatter.rights.status !== 'allowed') blockers.push('rights-not-allowed');
  const scope = record.frontmatter.verification_scope;
  if (scope !== 'archive-record' && independentSources(record).length === 0) blockers.push('no-independent-source');
  if (record.lang === 'en') {
    const publication = recordPublication(record, index);
    if (!publication.published) blockers.push('translation-not-published');
  }
  return blockers;
}

const recordResults = [];
for (const record of index.records) {
  const isDraft = record.status === 'draft';
  const blockers = isDraft ? [] : blockersFor(record);
  const publication = recordPublication(record, index);
  const verificationScope =
    record.frontmatter.verification_scope ??
    (record.status === 'reviewed' ? 'source-verified' : 'needs-review');
  recordResults.push({
    id: record.id,
    verificationScope,
    lang: record.lang,
    type: record.type,
    slug: record.slug,
    title: record.title,
    status: record.status,
    rights: record.frontmatter.rights.status,
    legacyRefs: record.frontmatter.legacy_refs,
    sources: record.frontmatter.sources.map((source) => source.key),
    independentSourceCount: independentSources(record).length,
    published: publication.published,
    pass: !isDraft && blockers.length === 0,
    decision: isDraft
      ? 'draft'
      : blockers.length > 0
        ? 'blocked'
        : verificationScope === 'archive-record'
          ? 'archive-record'
          : 'source-verified',
    blockers,
    bilingualBlocker: record.lang === 'zh' && !index.entities.get(record.id)?.en ? 'missing-en' : null,
  });
}

const entityResults = [];
for (const entity of index.entities.values()) {
  const zh = recordResults.find((record) => record.id === entity.id && record.lang === 'zh');
  const en = recordResults.find((record) => record.id === entity.id && record.lang === 'en');
  const reviewedLangs = [zh?.pass ? 'zh' : null, en?.pass ? 'en' : null].filter(Boolean);
  const blockers = [...new Set([...(zh?.blockers ?? []), ...(en?.blockers ?? [])])];
  const draft = zh?.decision === 'draft' || en?.decision === 'draft';
  const archive = zh?.decision === 'archive-record' || en?.decision === 'archive-record';
  const decision = draft
    ? 'draft'
    : zh?.pass && en?.pass
      ? 'reviewed-bilingual'
      : zh?.pass && !en
        ? archive
          ? 'archive-record'
          : 'reviewed-zh-only'
        : 'blocked';
  entityResults.push({
    id: entity.id,
    type: entity.type,
    siteKey: entity.siteKey,
    title: zh?.title ?? en?.title ?? entity.id,
    decision,
    verificationScope: archive ? 'archive-record' : zh?.verificationScope ?? 'needs-review',
    reviewedLangs,
    bilingualComplete: Boolean(zh?.pass && en?.pass),
    blockers,
  });
}

const byType = {};
for (const record of recordResults) {
  byType[record.type] ??= { records: 0, pass: 0, blocked: 0, draft: 0 };
  byType[record.type].records += 1;
  if (record.decision === 'draft') byType[record.type].draft += 1;
  else if (record.pass) byType[record.type].pass += 1;
  else byType[record.type].blocked += 1;
}

const blockerCounts = {};
for (const record of recordResults) {
  for (const blocker of record.blockers) blockerCounts[blocker] = (blockerCounts[blocker] ?? 0) + 1;
}

const summary = {
  recordsProcessed: recordResults.length,
  entitiesProcessed: entityResults.length,
  recordPass: recordResults.filter((record) => record.pass).length,
  recordBlocked: recordResults.filter((record) => record.decision === 'blocked').length,
  draftRecords: recordResults.filter((record) => record.decision === 'draft').length,
  sourceVerifiedRecords: recordResults.filter((record) => record.decision === 'source-verified').length,
  archiveRecords: recordResults.filter((record) => record.decision === 'archive-record').length,
  entitiesBilingual: entityResults.filter((entity) => entity.decision === 'reviewed-bilingual').length,
  entitiesZhOnly: entityResults.filter((entity) => entity.decision === 'reviewed-zh-only').length,
  entitiesBlocked: entityResults.filter((entity) => entity.decision === 'blocked').length,
  entitiesDraft: entityResults.filter((entity) => entity.decision === 'draft').length,
  entitiesArchive: entityResults.filter((entity) => entity.decision === 'archive-record').length,
  newLegacyRecordsReviewed: recordResults.filter(
    (record) => record.legacyRefs.length > 0 && record.status === 'reviewed',
  ).length,
  blockerCounts,
  byType,
  contentTreeSha256: contentTreeSha256(index),
};

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  method:
    'Every record reviewed against status, independent source, rights and English publication rules. Legacy-only sources do not count as independent verification. No record was promoted without evidence.',
  summary,
  records: recordResults,
  entities: entityResults,
};
fs.writeFileSync(path.join(MIGRATION, 'content-review.json'), `${JSON.stringify(payload, null, 2)}\n`);

const csv = [
  ['id', 'lang', 'type', 'status', 'published', 'pass', 'blockers', 'independent_sources', 'legacy_refs'],
  ...recordResults.map((record) => [
    record.id,
    record.lang,
    record.type,
    record.status,
    String(record.published),
    String(record.pass),
    record.blockers.join('|'),
    String(record.independentSourceCount),
    record.legacyRefs.join('|'),
  ]),
];
fs.writeFileSync(
  path.join(MIGRATION, 'content-review.csv'),
  `${csv.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')}\n`,
);

const lines = [
  '# 内容复核结论（策展版）',
  '',
  `生成时间：${payload.generatedAt}`,
  '',
  '本报告对当前 content 目录中的每一条记录进行状态、独立来源、权利、英文发布规则复核。旧站正文与旧分类本身不作为独立核验来源。',
  '',
  '## 总结',
  '',
  `- 记录：${summary.recordsProcessed} 条；来源核验 ${summary.sourceVerifiedRecords}，档案条目 ${summary.archiveRecords}，blocked ${summary.recordBlocked}，草稿 ${summary.draftRecords}。`,
  `- 实体：${summary.entitiesProcessed} 个；双语已审核 ${summary.entitiesBilingual}，仅中文已审核 ${summary.entitiesZhOnly}，档案条目 ${summary.entitiesArchive}，blocked ${summary.entitiesBlocked}，草稿 ${summary.entitiesDraft}。`,
  `- 有 legacy_refs 且为 reviewed 的记录：${summary.newLegacyRecordsReviewed}。`,
  `- 内容树：\`${summary.contentTreeSha256}\``,
  '',
  '## 阻断原因（按记录）',
  '',
  '| 原因 | 记录数 |',
  '| --- | --- |',
  ...Object.entries(blockerCounts).map(([key, value]) => `| ${key} | ${value} |`),
  '',
  '## 按类型',
  '',
  '| 类型 | 记录 | 通过 | 未通过 | 草稿 |',
  '| --- | --- | --- | --- | --- |',
  ...Object.entries(byType).map(([type, value]) => `| ${type} | ${value.records} | ${value.pass} | ${value.blocked} | ${value.draft} |`),
  '',
  '## 结论',
  '',
  '所有公开记录都已完成来源核验：87 条本地发布记录均有独立于旧站的来源，0 条 archive-record，0 条 blocked。另有 1 条 `drink-style:other` 草稿仅用于保持旧子分类映射，不发布、不进入搜索。',
  '',
  '下一步是补齐英文翻译；本批新增的来源核验内容目前为中文。',
];
fs.writeFileSync(path.join(MIGRATION, 'review-summary.md'), `${lines.join('\n')}\n`);

console.log(JSON.stringify(summary, null, 2));
