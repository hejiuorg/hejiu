#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { findWorkspaceRoot, getBuildMode, getPreviewOrigins, loadContracts } from './contracts.js';
import { loadContent } from './content.js';
import { buildRegistry, getSiteBuildData } from './pages.js';
import { writeAggregateSearch } from './search.js';
import { validateAll } from './validate.js';
import { verifyLinks, verifyPages } from './verify.js';

interface ParsedArgs {
  command: string;
  root: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const rest = [...argv];
  let root = process.env.HEJIU_ROOT ?? '';
  let command = '';
  while (rest.length > 0) {
    const value = rest.shift() as string;
    if (value.startsWith('--root=')) {
      root = value.slice('--root='.length);
    } else if (!command && !value.startsWith('-')) {
      command = value;
    }
  }
  return {
    command: command || 'validate',
    root: findWorkspaceRoot(root || process.cwd()),
  };
}

function printIssues(
  title: string,
  issues: Array<{ level: string; code: string; file: string; message: string }>,
  limit = 40,
): void {
  if (issues.length === 0) return;
  console.log(`\n${title} (${issues.length}):`);
  for (const issue of issues.slice(0, limit)) {
    console.log(`  [${issue.level}] ${issue.code} ${issue.file}: ${issue.message}`);
  }
  if (issues.length > limit) console.log(`  ... ${issues.length - limit} more`);
}

function main(): void {
  const { command, root } = parseArgs(process.argv.slice(2));
  if (command === 'validate') {
    const report = validateAll(root);
    printIssues('Errors', report.errors);
    printIssues('Warnings', report.warnings, 20);
    console.log(
      JSON.stringify(
        {
          command,
          mode: getBuildMode(),
          status: report.errors.length === 0 ? 'passed' : 'failed',
          ...report.summary,
          errorCount: report.errors.length,
          warningCount: report.warnings.length,
        },
        null,
        2,
      ),
    );
    if (report.errors.length > 0) process.exitCode = 1;
    return;
  }
  if (command === 'catalogs') {
    const report = validateAll(root);
    const catalogErrors = report.errors.filter((issue) => issue.code.startsWith('catalog-'));
    const catalogWarnings = report.warnings.filter((issue) => issue.code.startsWith('catalog-'));
    printIssues('Catalog errors', catalogErrors);
    printIssues('Catalog warnings', catalogWarnings);
    console.log(
      JSON.stringify(
        {
          command,
          status: catalogErrors.length === 0 ? 'passed' : 'failed',
          catalogErrorCount: catalogErrors.length,
          catalogWarningCount: catalogWarnings.length,
          contentErrorCount: report.errors.length - catalogErrors.length,
        },
        null,
        2,
      ),
    );
    if (catalogErrors.length > 0) process.exitCode = 1;
    return;
  }
  if (command === 'registry') {
    const contracts = loadContracts(root);
    const index = loadContent(root, contracts);
    const registry = buildRegistry(index, getBuildMode(), getPreviewOrigins());
    const dir = path.join(root, '.hejiu');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'entity-registry.json');
    fs.writeFileSync(out, `${JSON.stringify(registry, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          command,
          status: 'passed',
          output: path.relative(root, out).split(path.sep).join('/'),
          ...registry.counts,
          contentTreeSha256: registry.contentTreeSha256,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (command === 'aggregate') {
    writeAggregateSearch(root)
      .then((result) => {
        console.log(JSON.stringify({ command, status: 'passed', ...result }, null, 2));
      })
      .catch((error: unknown) => {
        console.error(JSON.stringify({ command, status: 'failed', error: String(error) }, null, 2));
        process.exitCode = 1;
      });
    return;
  }
  if (command === 'links') {
    const result = verifyLinks(root);
    printIssues('Link errors', result.errors.map((message) => ({
      level: 'error',
      code: 'link',
      file: '',
      message,
    })), 100);
    console.log(JSON.stringify({ command, status: result.ok ? 'passed' : 'failed', ...result.summary }, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === 'pages') {
    const result = verifyPages(root);
    printIssues('Page errors', result.errors.map((message) => ({
      level: 'error',
      code: 'page',
      file: '',
      message,
    })), 100);
    console.log(JSON.stringify({ command, status: result.ok ? 'passed' : 'failed', ...result.summary }, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === 'context') {
    const contracts = loadContracts(root);
    const siteKey = process.env.HEJIU_SITE ?? 'beverages';
    const data = getSiteBuildData(siteKey, { workspaceRoot: root });
    console.log(
      JSON.stringify(
        {
          command,
          siteKey,
          mode: data.mode,
          pages: data.pages.length,
          publishedPages: data.publishedPages.length,
          lists: data.lists.map((list) => ({
            type: list.type,
            lang: list.lang,
            pages: list.pages.length,
            noindex: list.noindex,
          })),
          registry: data.registry.counts,
        },
        null,
        2,
      ),
    );
    return;
  }
  console.error(`Unknown command: ${command}`);
  process.exitCode = 2;
}

main();
