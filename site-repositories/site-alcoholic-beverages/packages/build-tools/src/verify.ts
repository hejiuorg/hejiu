import fs from 'node:fs';
import path from 'node:path';
import { getBuildMode, getPreviewOrigins, loadContracts, siteForKey } from './contracts.js';
import { getSiteBuildData } from './pages.js';
import type { Contracts, SiteContract } from './types.js';

export interface VerifyResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: Record<string, string | number | boolean | null>;
}

function distDir(workspaceRoot: string, site: SiteContract): string {
  return path.join(workspaceRoot, 'site-repositories', site.siteRepository, site.appDirectory, 'dist');
}

function walkFiles(dir: string, extension: string): string[] {
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(extension)) {
        files.push(full);
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return files.sort();
}

function getAttr(tag: string, name: string): string | null {
  const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return match?.[1] ?? null;
}

function contentState(html: string): string | null {
  for (const match of html.matchAll(/<meta[^>]*>/gi)) {
    const tag = match[0];
    if (getAttr(tag, 'name') === 'hejiu-content-state') return getAttr(tag, 'content');
  }
  return null;
}

function isNoindex(html: string): boolean {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (getAttr(tag, 'name') === 'robots' && (getAttr(tag, 'content') ?? '').includes('noindex')) {
      return true;
    }
  }
  return false;
}

function htmlLang(html: string): string | null {
  return /<html[^>]*\blang="([^"]+)"/i.exec(html)?.[1] ?? null;
}

function canonicalOf(html: string): string | null {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (getAttr(tag, 'rel') === 'canonical') return getAttr(tag, 'href');
  }
  return null;
}

function alternatesOf(html: string): Array<{ lang: string; href: string }> {
  const result: Array<{ lang: string; href: string }> = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (getAttr(tag, 'rel') !== 'alternate') continue;
    const lang = getAttr(tag, 'hreflang');
    const href = getAttr(tag, 'href');
    if (lang && href) result.push({ lang, href });
  }
  return result;
}

function hrefsOf(html: string): string[] {
  const links = new Set<string>();
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
    if (match[1]) links.add(match[1]);
  }
  return [...links];
}

interface SiteOrigin {
  site: SiteContract;
  origin: string;
}

function origins(contracts: Contracts): SiteOrigin[] {
  const preview = getPreviewOrigins();
  return contracts.sites.map((site) => ({
    site,
    origin: preview?.[site.key] ?? `https://${site.host}`,
  }));
}

function resolveTarget(
  link: string,
  sourceSite: SiteContract,
  contracts: Contracts,
  sourceFile: string,
): { site: SiteContract; file: string; external: boolean } | null {
  if (/^(?:mailto:|tel:|data:|javascript:)/i.test(link) || link.startsWith('#')) return null;
  let targetSite = sourceSite;
  let pathName = link;
  const originList = origins(contracts);
  if (/^https?:\/\//i.test(link)) {
    const url = new URL(link);
    const match = originList.find((entry) => entry.origin === url.origin);
    if (!match) return { site: sourceSite, file: '', external: true };
    targetSite = match.site;
    pathName = decodeURIComponent(url.pathname);
  } else if (link.startsWith('//')) {
    const url = new URL(`https:${link}`);
    const match = originList.find((entry) => new URL(entry.origin).host === url.host);
    if (!match) return { site: sourceSite, file: '', external: true };
    targetSite = match.site;
    pathName = decodeURIComponent(url.pathname);
  } else if (!link.startsWith('/')) {
    const sourceUrl = new URL(`https://local${sourceFile}`);
    pathName = decodeURIComponent(new URL(link, sourceUrl).pathname);
  }
  pathName = pathName.split('?')[0]?.split('#')[0] ?? pathName;
  const dist = distDir(getWorkspaceRootFromSource(sourceFile), targetSite);
  let candidate = path.join(dist, ...pathName.split('/').filter(Boolean));
  if (pathName.endsWith('/') || !path.extname(candidate)) {
    candidate = path.join(candidate, 'index.html');
  }
  return { site: targetSite, file: candidate, external: false };
}

function getWorkspaceRootFromSource(file: string): string {
  const marker = `${path.sep}site-repositories${path.sep}`;
  const index = file.indexOf(marker);
  return index === -1 ? process.cwd() : file.slice(0, index);
}

export function verifyLinks(workspaceRoot: string): VerifyResult {
  const contracts = loadContracts(workspaceRoot);
  const errors: string[] = [];
  const warnings: string[] = [];
  let htmlFiles = 0;
  let links = 0;
  for (const site of contracts.sites) {
    const dist = distDir(workspaceRoot, site);
    if (!fs.existsSync(dist)) {
      errors.push(`${site.key}: dist directory is missing (${dist})`);
      continue;
    }
    for (const file of walkFiles(dist, '.html')) {
      htmlFiles += 1;
      const html = fs.readFileSync(file, 'utf8');
      const sourceNoindex = isNoindex(html);
      for (const link of hrefsOf(html)) {
        if (link === '#' || link.startsWith('#')) continue;
        const target = resolveTarget(link, site, contracts, file);
        if (!target) continue;
        links += 1;
        if (target.external) continue;
        if (!fs.existsSync(target.file)) {
          errors.push(
            `${path.relative(dist, file)} -> ${link}: target missing (${path.relative(workspaceRoot, target.file)})`,
          );
          continue;
        }
        if (target.file.endsWith('.html') && !sourceNoindex) {
          const targetHtml = fs.readFileSync(target.file, 'utf8');
          if (contentState(targetHtml) === 'preview') {
            errors.push(
              `${path.relative(dist, file)} -> ${link}: an indexable page links to a noindex content preview`,
            );
          }
        }
      }
    }
    if (!fs.existsSync(path.join(dist, 'pagefind', 'pagefind.js'))) {
      errors.push(`${site.key}: Pagefind bundle is missing`);
    }
    if (!fs.existsSync(path.join(dist, 'sitemap.xml'))) {
      errors.push(`${site.key}: sitemap.xml is missing`);
    }
    if (!fs.existsSync(path.join(dist, 'robots.txt'))) {
      errors.push(`${site.key}: robots.txt is missing`);
    }
    if (!fs.existsSync(path.join(dist, '404.html'))) {
      errors.push(`${site.key}: 404.html is missing`);
    }
  }
  const main = siteForKey(contracts, 'beverages');
  const mainDist = distDir(workspaceRoot, main);
  const aggregateManifest = path.join(mainDist, 'all-search', 'aggregate-manifest.json');
  if (!fs.existsSync(path.join(mainDist, 'all-search', 'pagefind.js'))) {
    errors.push('main: aggregate Pagefind bundle is missing');
  }
  if (!fs.existsSync(aggregateManifest)) {
    errors.push('main: aggregate search manifest is missing');
  } else {
    const manifest = JSON.parse(fs.readFileSync(aggregateManifest, 'utf8')) as {
      scope: string;
      sources: Array<{ siteKey: string }>;
      recordCount: number;
    };
    if (manifest.scope !== 'published-only') {
      errors.push('main: aggregate search is not marked published-only');
    }
    if (manifest.sources.length !== 4) {
      errors.push(`main: aggregate search covers ${manifest.sources.length} sites, expected 4`);
    }
    if (manifest.recordCount <= 0) {
      errors.push('main: aggregate search has no records');
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      mode: getBuildMode(),
      htmlFiles,
      links,
      errors: errors.length,
      warnings: warnings.length,
    },
  };
}

function expectedStaticPages(siteKey: string): string[] {
  const base = ['', 'about/', 'contribute/', 'search/'];
  if (siteKey === 'beverages') base.push('saved/');
  return base;
}

export function verifyPages(workspaceRoot: string): VerifyResult {
  const contracts = loadContracts(workspaceRoot);
  const errors: string[] = [];
  const warnings: string[] = [];
  let checkedPages = 0;
  for (const site of contracts.sites) {
    const dist = distDir(workspaceRoot, site);
    if (!fs.existsSync(dist)) {
      errors.push(`${site.key}: dist directory is missing`);
      continue;
    }
    const data = getSiteBuildData(site.key, { workspaceRoot });
    if (data.mode !== 'production') {
      warnings.push(`${site.key}: page verification ran in ${data.mode} mode`);
    }
    for (const page of data.pages) {
      if (!page.published) continue;
      const file = path.join(dist, ...page.path.split('/').filter(Boolean), 'index.html');
      if (!fs.existsSync(file)) {
        errors.push(`${site.key}: published page is missing ${page.path}`);
        continue;
      }
      checkedPages += 1;
      const html = fs.readFileSync(file, 'utf8');
      if (isNoindex(html)) errors.push(`${site.key}: published page ${page.path} is noindex`);
      const lang = htmlLang(html);
      if (lang !== page.lang) {
        errors.push(`${site.key}: ${page.path} html lang is ${lang}, expected ${page.lang}`);
      }
      const canonical = canonicalOf(html);
      if (canonical !== page.canonical) {
        errors.push(`${site.key}: ${page.path} canonical is ${canonical}, expected ${page.canonical}`);
      }
      if (!/<meta\b[^>]*name="description"[^>]*content="[^"]+"/i.test(html)) {
        errors.push(`${site.key}: ${page.path} has no meta description`);
      }
      const expectedAlternates = page.alternates.filter((alternate) => alternate.published);
      const actualAlternates = alternatesOf(html);
      const expectedCount = expectedAlternates.length + 1;
      if (actualAlternates.length !== expectedCount) {
        errors.push(
          `${site.key}: ${page.path} has ${actualAlternates.length} hreflang links, expected ${expectedCount} (self + alternates)`,
        );
      }
      if (!actualAlternates.some((alternate) => alternate.lang === page.lang)) {
        errors.push(`${site.key}: ${page.path} is missing its self-referencing hreflang`);
      }
      for (const alternate of actualAlternates) {
        if (!/^https:\/\//.test(alternate.href)) {
          errors.push(`${site.key}: ${page.path} hreflang is not absolute`);
        }
      }
    }
    for (const lang of ['zh', 'en'] as const) {
      const prefix = lang === 'en' ? 'en/' : '';
      for (const staticPage of expectedStaticPages(site.key)) {
        const file = path.join(dist, ...`${prefix}${staticPage}`.split('/').filter(Boolean), 'index.html');
        if (!fs.existsSync(file)) {
          errors.push(`${site.key}: static page missing ${prefix}${staticPage}`);
        }
      }
      if (lang === 'en' && !fs.existsSync(path.join(dist, 'en', 'index.html'))) {
        errors.push(`${site.key}: English home is missing`);
      }
    }
    const sitemapPath = path.join(dist, 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      const sitemap = fs.readFileSync(sitemapPath, 'utf8');
      for (const page of data.publishedPages) {
        if (!sitemap.includes(page.canonical)) {
          errors.push(`${site.key}: sitemap is missing ${page.canonical}`);
        }
      }
      for (const loc of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const url = loc[1];
        if (!url) continue;
        const pathName = new URL(url).pathname;
        const file = path.join(dist, ...pathName.split('/').filter(Boolean), 'index.html');
        if (!fs.existsSync(file)) {
          errors.push(`${site.key}: sitemap URL has no HTML file ${url}`);
        }
      }
    }
    const robots = path.join(dist, 'robots.txt');
    if (fs.existsSync(robots) && !fs.readFileSync(robots, 'utf8').includes('Sitemap:')) {
      errors.push(`${site.key}: robots.txt has no Sitemap declaration`);
    }
    const notFound = path.join(dist, '404.html');
    if (fs.existsSync(notFound) && !isNoindex(fs.readFileSync(notFound, 'utf8'))) {
      errors.push(`${site.key}: 404.html is not noindex`);
    }
    const searchPage = path.join(dist, 'search', 'index.html');
    if (fs.existsSync(searchPage) && !isNoindex(fs.readFileSync(searchPage, 'utf8'))) {
      errors.push(`${site.key}: search page should be noindex`);
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      checkedPages,
      errors: errors.length,
      warnings: warnings.length,
    },
  };
}
