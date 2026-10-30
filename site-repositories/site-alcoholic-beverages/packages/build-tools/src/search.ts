import fs from 'node:fs';
import path from 'node:path';
import * as pagefind from 'pagefind';
import { siteForKey, loadContracts } from './contracts.js';
import { publishedSearchRecords, type SearchRecord } from './pages.js';
import type { ContentIndex } from './types.js';

export interface PublishedSiteFile {
  schemaVersion: number;
  siteKey: string;
  generatedAt: string;
  contentTreeSha256: string;
  records: SearchRecord[];
}

async function writeBundle(records: SearchRecord[], outputPath: string): Promise<void> {
  fs.mkdirSync(outputPath, { recursive: true });
  const created = await pagefind.createIndex();
  if (!created.index) {
    throw new Error(`Pagefind could not create an index: ${created.errors.join('; ')}`);
  }
  for (const record of records) {
    const added = await created.index.addCustomRecord({
      url: record.url,
      content: record.content,
      language: record.language,
      meta: record.meta,
      filters: record.filters,
    });
    if (added.errors.length > 0) {
      throw new Error(`Pagefind record error for ${record.url}: ${added.errors.join('; ')}`);
    }
  }
  const written = await created.index.writeFiles({ outputPath });
  if (written.errors.length > 0) {
    throw new Error(`Pagefind write error: ${written.errors.join('; ')}`);
  }
  await pagefind.close();
}

export async function writeSiteSearch(index: ContentIndex, siteKey: string, distDir: string): Promise<number> {
  const records = publishedSearchRecords(index, { siteKey });
  await writeBundle(records, path.join(distDir, 'pagefind'));
  return records.length;
}

export function writePublishedRecordFile(
  workspaceRoot: string,
  siteKey: string,
  contentTreeHash: string,
  records: SearchRecord[],
): string {
  const dir = path.join(workspaceRoot, '.hejiu', 'published');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${siteKey}.json`);
  const payload: PublishedSiteFile = {
    schemaVersion: 1,
    siteKey,
    generatedAt: new Date().toISOString(),
    contentTreeSha256: contentTreeHash,
    records,
  };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  return file;
}

export interface AggregateSearchResult {
  records: number;
  sites: string[];
  outputPath: string;
}

export async function writeAggregateSearch(workspaceRoot: string): Promise<AggregateSearchResult> {
  const contracts = loadContracts(workspaceRoot);
  const main = siteForKey(contracts, 'beverages');
  const mainDist = path.join(
    workspaceRoot,
    'site-repositories',
    main.siteRepository,
    main.appDirectory,
    'dist',
  );
  if (!fs.existsSync(mainDist)) {
    throw new Error(`Main site dist does not exist: ${mainDist}. Build main first.`);
  }
  const publishedDir = path.join(workspaceRoot, '.hejiu', 'published');
  const sources: Array<{
    siteKey: string;
    generatedAt: string;
    contentTreeSha256: string;
    recordCount: number;
  }> = [];
  const records: SearchRecord[] = [];
  for (const site of contracts.sites) {
    const file = path.join(publishedDir, `${site.key}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Published search source for ${site.key} is missing: ${file}`);
    }
    const payload = JSON.parse(fs.readFileSync(file, 'utf8')) as PublishedSiteFile;
    if (payload.siteKey !== site.key) {
      throw new Error(`Published search source ${file} has the wrong site key`);
    }
    sources.push({
      siteKey: payload.siteKey,
      generatedAt: payload.generatedAt,
      contentTreeSha256: payload.contentTreeSha256,
      recordCount: payload.records.length,
    });
    records.push(...payload.records);
  }
  const deduped = [...new Map(records.map((record) => [record.url, record])).values()].sort((a, b) =>
    a.url.localeCompare(b.url),
  );
  const outputPath = path.join(mainDist, 'all-search');
  const tempPath = `${outputPath}.tmp-${process.pid}`;
  const backupPath = `${outputPath}.old-${process.pid}`;
  fs.rmSync(tempPath, { recursive: true, force: true });
  fs.rmSync(backupPath, { recursive: true, force: true });
  try {
    await writeBundle(deduped, tempPath);
    fs.writeFileSync(
      path.join(tempPath, 'aggregate-manifest.json'),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          scope: 'published-only',
          sources,
          recordCount: deduped.length,
        },
        null,
        2,
      )}\n`,
    );
    if (fs.existsSync(outputPath)) fs.renameSync(outputPath, backupPath);
    fs.renameSync(tempPath, outputPath);
    fs.rmSync(backupPath, { recursive: true, force: true });
  } catch (error) {
    fs.rmSync(tempPath, { recursive: true, force: true });
    if (fs.existsSync(backupPath) && !fs.existsSync(outputPath)) {
      fs.renameSync(backupPath, outputPath);
    }
    throw error;
  }
  return { records: deduped.length, sites: sources.map((source) => source.siteKey), outputPath };
}
