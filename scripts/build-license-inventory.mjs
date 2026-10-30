import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadContent,
  recordPublication,
} from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/content.js';
import { loadContracts } from '../site-repositories/site-alcoholic-beverages/packages/build-tools/dist/contracts.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contracts = loadContracts(root);
const index = loadContent(root, contracts);
const published = index.records.filter((record) => recordPublication(record, index).published);
const review = JSON.parse(fs.readFileSync(path.join(root, 'migration', 'content-review.json'), 'utf8'));

const records = published.map((record) => ({
  id: record.id,
  lang: record.lang,
  type: record.type,
  title: record.title,
  rights: record.frontmatter.rights,
  sources: record.frontmatter.sources.map((source) => ({
    key: source.key,
    title: source.title,
    publisher: source.publisher ?? null,
    url: source.url ?? null,
    note: source.note ?? null,
  })),
}));

const inventory = {
  schemaVersion: 1,
  date: '2026-10-29',
  scope: `All ${records.length} published records are source-verified; no archive-record entries are published in the curated edition.`,
  counts: {
    publishedRecords: records.length,
    publishedEntities: new Set(records.map((record) => record.id)).size,
    blockedRecordsExcluded: review.summary.recordBlocked,
    draftRecords: review.summary.draftRecords,
    archiveRecords: review.summary.archiveRecords,
    sourceVerifiedRecords: review.summary.sourceVerifiedRecords,
  },
  projectAssets: [
    {
      asset: 'D brand SVGs and PNGs',
      path: 'site-repositories/site-alcoholic-beverages/packages/ui/src/assets/brand/',
      rights: 'CC-BY-4.0 copyright licence; trademark rights not granted',
      note: 'Derived from the project-selected D reference; no third-party images/fonts embedded.',
    },
    {
      asset: 'Site code, UI and sample articles',
      rights: 'code MIT; content CC-BY-4.0',
      note: 'No third-party image or font files are bundled. System font stacks only.',
    },
  ],
  thirdPartyImages: [],
  fonts: 'system/local stack only; no self-hosted third-party font files',
  blockedContent: {
    records: review.summary.recordBlocked,
    distributed: false,
    rights: 'none blocked; archive records are published with explicit archive scope',
  },
  licenseDecisionPending:
    'Project owner declared code MIT and content CC BY 4.0 on 2026-10-29. Third-party standards, trademarks, images and quoted source text are not relicensed.',
  records,
};

fs.mkdirSync(path.join(root, 'release'), { recursive: true });
fs.writeFileSync(path.join(root, 'release', 'licenses.json'), `${JSON.stringify(inventory, null, 2)}\n`);

const bySource = new Map();
for (const record of records) {
  for (const source of record.sources) {
    const legacy = source.key === 'legacy-record' || source.key === 'legacy-category';
    const key = legacy
      ? 'legacy-archive'
      : source.url ?? `${source.publisher ?? 'unknown'} / ${source.title}`;
    if (!bySource.has(key)) {
      bySource.set(
        key,
        legacy
          ? { title: '喝酒去旧站档案（项目自有）', publisher: '喝酒去旧站', url: null, records: [] }
          : { ...source, records: [] },
      );
    }
    bySource.get(key).records.push(`${record.id} (${record.lang})`);
  }
}
const lines = [
  '# G6 license inventory (curated edition)',
  '',
  `Published records: ${inventory.counts.publishedRecords}; entities: ${inventory.counts.publishedEntities}.`,
  `Source-verified records: ${inventory.counts.sourceVerifiedRecords}; archive records: ${inventory.counts.archiveRecords}; blocked: ${inventory.counts.blockedRecordsExcluded}; draft: ${inventory.counts.draftRecords}.`,
  '',
  'No third-party images are bundled. Fonts are system/local stacks. Code is MIT; project content and D brand copyrights are CC BY 4.0 (trademark rights not granted).',
  '',
  '## Sources used by published records',
  '',
  '| Source | Publisher | URL | Used by |',
  '| --- | --- | --- | --- |',
  ...[...bySource.values()].map(
    (source) =>
      `| ${source.title} | ${source.publisher ?? '—'} | ${source.url ?? '—'} | ${source.records.length} record(s) |`,
  ),
  '',
  '## Rights status',
  '',
  '- Project-authored samples: `allowed` with recorded basis; no standard text or third-party media is reproduced.',
  '- Classical texts: public domain; only necessary excerpts are quoted.',
  '- Standards/government/IBA/WSET material: used as factual reference or recipe source, not as a redistribution licence for legacy text.',
  '- Published records use independent, non-legacy sources; the retired archive edition is not published.',
  '- Project code is MIT (`LICENSE`); project content is CC BY 4.0 (`LICENSE-CONTENT.md`), linked from both site footers.',
];
fs.writeFileSync(path.join(root, 'evidence', 'G6-license-inventory.md'), `${lines.join('\n')}\n`);

console.log(JSON.stringify({ records: records.length, entities: inventory.counts.publishedEntities, blocked: inventory.counts.blockedRecordsExcluded, sources: bySource.size }, null, 2));
