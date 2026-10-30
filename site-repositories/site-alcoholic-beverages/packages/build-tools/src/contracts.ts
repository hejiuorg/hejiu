import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  BuildMode,
  Contracts,
  Labels,
  Lang,
  RelationRuleSet,
  SiteContract,
  TypeContract,
} from './types.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function findWorkspaceRoot(start = process.cwd()): string {
  let dir = path.resolve(start);
  for (;;) {
    if (
      fs.existsSync(path.join(dir, 'content-repositories')) &&
      fs.existsSync(path.join(dir, 'site-repositories'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not find the implementation workspace (content-repositories + site-repositories) from ${start}`,
      );
    }
    dir = parent;
  }
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function contractDirectory(workspaceRoot?: string): string {
  const root = workspaceRoot ?? findWorkspaceRoot();
  const workspaceContracts = path.join(
    root,
    'site-repositories',
    'site-alcoholic-beverages',
    'packages',
    'contracts',
  );
  if (fs.existsSync(workspaceContracts)) return workspaceContracts;
  return path.resolve(here, '../../contracts');
}

export function getBuildMode(): BuildMode {
  return process.env.HEJIU_BUILD_MODE === 'preview' ? 'preview' : 'production';
}

export function getPreviewOrigins(): Record<string, string> | null {
  const raw = process.env.HEJIU_PREVIEW_ORIGINS;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Record<string, string>;
  for (const [key, origin] of Object.entries(parsed)) {
    if (!/^https?:\/\/[^/]+$/.test(origin)) {
      throw new Error(`Invalid preview origin for ${key}: ${origin}`);
    }
  }
  return parsed;
}

export function loadContracts(workspaceRoot = findWorkspaceRoot()): Contracts {
  const dir = contractDirectory(workspaceRoot);
  const sites = readJson<{ schemaVersion: number; sites: SiteContract[] }>(
    path.join(dir, 'sites.json'),
  ).sites;
  const types = readJson<{ schemaVersion: number; types: TypeContract[] }>(
    path.join(dir, 'types.json'),
  ).types;
  const relations = readJson<RelationRuleSet>(path.join(dir, 'relations.json'));
  const labels = readJson<Labels>(path.join(dir, 'labels.json'));
  const repositories = readJson<Contracts['repositories']>(
    path.join(dir, 'repositories.json'),
  );

  if (sites.length !== 4) throw new Error(`Expected four sites, found ${sites.length}`);
  if (types.length !== 28) throw new Error(`Expected 28 content types, found ${types.length}`);

  const siteKeys = new Set(sites.map((site) => site.key));
  const typeNames = new Set<string>();
  const routeKeys = new Set<string>();
  const namespaces = new Set<string>();

  for (const type of types) {
    if (typeNames.has(type.type)) throw new Error(`Duplicate type: ${type.type}`);
    typeNames.add(type.type);
    if (namespaces.has(type.namespace)) throw new Error(`Duplicate namespace: ${type.namespace}`);
    namespaces.add(type.namespace);
    if (!siteKeys.has(type.site)) throw new Error(`Type ${type.type} has unknown site ${type.site}`);
    if (!/^[a-z0-9-]+$/.test(type.path)) throw new Error(`Invalid route path: ${type.path}`);
    const routeKey = `${type.site}:${type.path}`;
    if (routeKeys.has(routeKey)) throw new Error(`Duplicate route: ${routeKey}`);
    routeKeys.add(routeKey);
  }

  for (const site of sites) {
    const fromRepositories = repositories.sites.find(
      (entry) => entry.key === site.key,
    ) as { contentRepository?: string; siteRepository?: string; host?: string } | undefined;
    if (!fromRepositories) throw new Error(`Site ${site.key} missing from repositories.json`);
    if (fromRepositories.contentRepository !== site.contentRepository) {
      throw new Error(`Content repository mismatch for ${site.key}`);
    }
    if (fromRepositories.siteRepository !== site.siteRepository) {
      throw new Error(`Site repository mismatch for ${site.key}`);
    }
    if (fromRepositories.host !== site.host) throw new Error(`Host mismatch for ${site.key}`);
    if (!types.some((type) => type.site === site.key)) {
      throw new Error(`Site ${site.key} has no content types`);
    }
  }

  return {
    sites,
    types,
    relations,
    labels,
    repositories,
    contractDir: dir,
    workspaceRoot,
  };
}

export function siteForKey(contracts: Contracts, key: string): SiteContract {
  const site = contracts.sites.find((entry) => entry.key === key);
  if (!site) throw new Error(`Unknown site key: ${key}`);
  return site;
}

export function typesForSite(contracts: Contracts, siteKey: string): TypeContract[] {
  return contracts.types.filter((type) => type.site === siteKey);
}

export function typeForName(contracts: Contracts, typeName: string): TypeContract {
  const type = contracts.types.find((entry) => entry.type === typeName);
  if (!type) throw new Error(`Unknown content type: ${typeName}`);
  return type;
}

export function isLang(value: string): value is Lang {
  return value === 'zh' || value === 'en';
}
