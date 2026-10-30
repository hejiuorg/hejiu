import fs from 'node:fs';
import path from 'node:path';
import type { Contracts, ValidationIssue } from './types.js';

function readIfExists(file: string): string | null {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function markdownLinks(content: string): string[] {
  const links: string[] = [];
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (!target) continue;
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    links.push(decodeURIComponent(target.split('#')[0] ?? ''));
  }
  return links;
}

function listContentFiles(dir: string, lang: string): string[] {
  const langDir = path.join(dir, lang);
  if (!fs.existsSync(langDir)) return [];
  const files: string[] = [];
  for (const typeEntry of fs.readdirSync(langDir, { withFileTypes: true })) {
    if (typeEntry.isDirectory()) {
      const typeDir = path.join(langDir, typeEntry.name);
      for (const entry of fs.readdirSync(typeDir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
          files.push(`${lang}/${typeEntry.name}/${entry.name}`);
        }
      }
    }
  }
  return files.sort();
}

function resolveLink(readmeDir: string, link: string): string {
  return path.resolve(readmeDir, link);
}

export function checkCatalogs(
  workspaceRoot: string,
  contracts: Contracts,
  addIssue: (issue: ValidationIssue) => void,
): void {
  for (const site of contracts.sites) {
    const repo = site.contentRepository;
    const repoDir = path.join(workspaceRoot, 'content-repositories', repo);
    const rootReadme = path.join(repoDir, 'README.md');
    const rootText = readIfExists(rootReadme);
    if (!rootText) {
      addIssue({
        level: 'error',
        code: 'catalog-root-readme',
        file: `${repo}/README.md`,
        message: 'content repository needs a root README.md',
      });
    } else {
      for (const lang of ['zh', 'en'] as const) {
        const expected = `${lang}/README.md`;
        const links = markdownLinks(rootText).map((link) => resolveLink(repoDir, link));
        if (!links.includes(path.join(repoDir, expected))) {
          addIssue({
            level: 'error',
            code: 'catalog-lang-link',
            file: `${repo}/README.md`,
            message: `root README must link ${expected}`,
          });
        }
      }
    }

    for (const lang of ['zh', 'en'] as const) {
      const langReadme = path.join(repoDir, lang, 'README.md');
      const text = readIfExists(langReadme);
      if (!text) {
        addIssue({
          level: 'error',
          code: 'catalog-lang-readme',
          file: `${repo}/${lang}/README.md`,
          message: 'each language needs a README.md catalog',
        });
        continue;
      }
      const links = markdownLinks(text);
      const linked = new Set(links.map((link) => resolveLink(path.dirname(langReadme), link)));
      for (const link of links) {
        const resolved = resolveLink(path.dirname(langReadme), link);
        if (!fs.existsSync(resolved)) {
          addIssue({
            level: 'error',
            code: 'catalog-dead-link',
            file: `${repo}/${lang}/README.md`,
            message: `link target does not exist: ${link}`,
          });
        }
      }
      const files = listContentFiles(repoDir, lang);
      for (const relative of files) {
        const absolute = path.join(repoDir, relative);
        if (!linked.has(absolute)) {
          addIssue({
            level: 'error',
            code: 'catalog-missing-entry',
            file: `${repo}/${lang}/README.md`,
            message: `catalog is missing ${relative}`,
          });
        }
        const typeName = relative.split('/')[1] ?? '';
        const typeReadme = path.join(repoDir, lang, typeName, 'README.md');
        const typeText = readIfExists(typeReadme);
        if (!typeText) {
          addIssue({
            level: 'error',
            code: 'catalog-type-readme',
            file: `${repo}/${lang}/${typeName}/README.md`,
            message: 'a content directory needs its own README.md',
          });
          continue;
        }
        const typeLinks = new Set(
          markdownLinks(typeText).map((link) => resolveLink(path.dirname(typeReadme), link)),
        );
        if (!typeLinks.has(absolute)) {
          addIssue({
            level: 'error',
            code: 'catalog-type-entry',
            file: `${repo}/${lang}/${typeName}/README.md`,
            message: `type README is missing ${relative.split('/')[2] ?? relative}`,
          });
        }
      }
      for (const link of links) {
        const resolved = resolveLink(path.dirname(langReadme), link);
        if (fs.existsSync(resolved) && resolved.endsWith('.md')) {
          const relative = path.relative(repoDir, resolved).split(path.sep).join('/');
          const isContent = /^(zh|en)\/[^/]+\/[^/]+\.md$/.test(relative);
          if (isContent && !files.includes(relative)) {
            addIssue({
              level: 'warning',
              code: 'catalog-extra-link',
              file: `${repo}/${lang}/README.md`,
              message: `catalog links a file outside the normal content grid: ${relative}`,
            });
          }
        }
      }
    }
  }
}
