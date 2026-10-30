import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findWorkspaceRoot } from '../dist/contracts.js';
import { loadContent } from '../dist/content.js';
import { buildRegistry } from '../dist/pages.js';
import { renderMarkdown } from '../dist/markdown.js';
import { validateAll } from '../dist/validate.js';

const workspaceRoot = findWorkspaceRoot();

function tempWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hejiu-test-'));
  fs.cpSync(path.join(workspaceRoot, 'content-repositories'), path.join(root, 'content-repositories'), {
    recursive: true,
  });
  const contractsSource = path.join(
    workspaceRoot,
    'site-repositories',
    'site-alcoholic-beverages',
    'packages',
    'contracts',
  );
  const contractsTarget = path.join(
    root,
    'site-repositories',
    'site-alcoholic-beverages',
    'packages',
    'contracts',
  );
  fs.mkdirSync(path.dirname(contractsTarget), { recursive: true });
  fs.cpSync(contractsSource, contractsTarget, { recursive: true });
  fs.mkdirSync(path.join(root, 'migration'), { recursive: true });
  fs.copyFileSync(
    path.join(workspaceRoot, 'migration', 'entity-map.json'),
    path.join(root, 'migration', 'entity-map.json'),
  );
  return root;
}

test('accepts the current full legacy batch', () => {
  const report = validateAll(workspaceRoot);
  assert.deepEqual(report.errors, []);
  assert.equal(report.summary.records, 167);
  assert.equal(report.summary.entities, 84);
  assert.equal(report.summary.publishedRecords, 166);
  assert.equal(report.summary.migrationMapped, 602);
  assert.equal(report.summary.migrationPending, 0);
});

test('registry separates produced pages from source records', () => {
  const index = loadContent(workspaceRoot);
  const registry = buildRegistry(index, 'production', null);
  assert.equal(registry.counts.records, 166);
  assert.equal(registry.counts.entities, 83);
  assert.equal(registry.counts.sourceRecords, 167);
  assert.equal(registry.counts.sourceEntities, 84);
  assert.equal(registry.entities.length, 83);
});

test('rejects a duplicate id and language pair', () => {
  const root = tempWorkspace();
  const source = path.join(root, 'content-repositories', 'alcoholic-beverages', 'zh', 'region', 'china.md');
  const duplicate = path.join(root, 'content-repositories', 'alcoholic-beverages', 'zh', 'region', 'china-copy.md');
  fs.copyFileSync(source, duplicate);
  const index = loadContent(root);
  assert.ok(index.issues.some((issue) => issue.code === 'duplicate-id-lang' && issue.level === 'error'));
});

test('rejects reviewed content with unverified rights', () => {
  const root = tempWorkspace();
  const file = path.join(root, 'content-repositories', 'alcoholic-beverages', 'zh', 'region', 'bozhou.md');
  const text = fs.readFileSync(file, 'utf8').replace('  status: allowed', '  status: unverified');
  fs.writeFileSync(file, text);
  const index = loadContent(root);
  assert.ok(
    index.issues.some(
      (issue) => issue.code === 'schema' && issue.message.includes('reviewed content requires rights.status allowed'),
    ),
  );
});

test('detects an English translation whose source hash drifted', () => {
  const root = tempWorkspace();
  const file = path.join(root, 'content-repositories', 'alcoholic-beverages', 'en', 'region', 'china.md');
  const zero = 'deadbeef'.repeat(8);
  const text = fs
    .readFileSync(file, 'utf8')
    .replace(/source_revision: "?sha256:[a-f0-9]+"?/, `source_revision: sha256:${zero}`)
    .replace(/source_sha256: "?[a-f0-9]+"?/, `source_sha256: ${zero}`);
  fs.writeFileSync(file, text);
  const index = loadContent(root);
  assert.ok(index.issues.some((issue) => issue.code === 'translation-hash' && issue.level === 'error'));
});

test('resolves ref links and leaves unknown refs as plain text', () => {
  const resolved = renderMarkdown('[浓香型](ref:strong-aroma)', (key) =>
    key === 'strong-aroma' ? '/styles/strong-aroma-baijiu/' : null,
  );
  assert.match(resolved.html, /href="\/styles\/strong-aroma-baijiu\/"/);
  assert.deepEqual(resolved.unresolvedRefs, []);

  const unresolved = renderMarkdown('[未知](ref:missing)', () => null);
  assert.doesNotMatch(unresolved.html, /href="ref:/);
  assert.match(unresolved.html, /未知/);
  assert.deepEqual(unresolved.unresolvedRefs, ['missing']);
});
