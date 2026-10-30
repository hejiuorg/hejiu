import { getBuildMode, getPreviewOrigins, loadContracts, siteForKey, typeForName } from './contracts.js';
import {
  contentTreeSha256,
  effectiveRelations,
  entityLabel,
  loadContent,
  recordKey,
  recordPublication,
} from './content.js';
import { markdownToText, renderMarkdown } from './markdown.js';
import type {
  BuildMode,
  Fact,
  ContentIndex,
  ContentRecord,
  Entity,
  EntityRegistry,
  EntityRegistryTranslation,
  Lang,
  ListPageData,
  PageData,
  RelationTarget,
  SiteBuildData,
  SiteContract,
  TypeContract,
  ValidationIssue,
} from './types.js';

export function pagePath(typePath: string, slug: string, lang: Lang): string {
  return lang === 'en' ? `/en/${typePath}/${slug}/` : `/${typePath}/${slug}/`;
}

export function originFor(site: SiteContract, previewOrigins: Record<string, string> | null): string {
  return previewOrigins?.[site.key] ?? `https://${site.host}`;
}

export function absoluteUrl(
  site: SiteContract,
  pathName: string,
  previewOrigins: Record<string, string> | null,
): string {
  return `${originFor(site, previewOrigins)}${pathName}`;
}

function sortByTitle<T extends { title: string }>(items: T[], lang: Lang): T[] {
  return [...items].sort((a, b) => a.title.localeCompare(b.title, lang === 'zh' ? 'zh-Hans' : 'en'));
}

function includedInMode(record: ContentRecord, index: ContentIndex, mode: BuildMode): boolean {
  if (record.status === 'draft') return false;
  if (mode === 'preview') return true;
  return recordPublication(record, index).published;
}

function findType(contracts: ReturnType<typeof loadContracts>, type: string): TypeContract {
  return typeForName(contracts, type);
}

function recordUrl(
  record: ContentRecord,
  contracts: ReturnType<typeof loadContracts>,
  previewOrigins: Record<string, string> | null,
): { path: string; url: string } {
  const type = findType(contracts, record.type);
  const site = siteForKey(contracts, type.site);
  const pathName = pagePath(type.path, record.slug, record.lang);
  return { path: pathName, url: absoluteUrl(site, pathName, previewOrigins) };
}

function availableRecord(
  entity: Entity,
  lang: Lang,
  index: ContentIndex,
  mode: BuildMode,
): ContentRecord | null {
  const sameLang = entity[lang];
  if (sameLang && includedInMode(sameLang, index, mode)) return sameLang;
  const zh = entity.zh;
  if (zh && includedInMode(zh, index, mode)) return zh;
  return null;
}

function relationTarget(
  relation: string,
  targetId: string,
  currentSiteKey: string,
  lang: Lang,
  index: ContentIndex,
  contracts: ReturnType<typeof loadContracts>,
  previewOrigins: Record<string, string> | null,
  mode: BuildMode,
  onlyPublished = false,
): RelationTarget | null {
  const entity = index.entities.get(targetId);
  if (!entity) return null;
  const record = availableRecord(entity, lang, index, mode);
  if (!record) return null;
  if (onlyPublished && !recordPublication(record, index).published) return null;
  const type = findType(contracts, record.type);
  const site = siteForKey(contracts, type.site);
  const pathName = pagePath(type.path, record.slug, record.lang);
  const sameSite = site.key === currentSiteKey;
  return {
    relation,
    targetId,
    target: entity,
    targetRecord: record,
    targetLang: record.lang,
    path: pathName,
    url: sameSite ? pathName : absoluteUrl(site, pathName, previewOrigins),
    label: record.title,
    available: true,
  };
}

function buildFacts(
  record: ContentRecord,
  lang: Lang,
): Fact[] {
  const data = record.frontmatter as Record<string, unknown>;
  const facts: Fact[] = [];
  const zh = lang === 'zh';
  const text = (labelZh: string, labelEn: string, value: unknown): void => {
    if (value === undefined || value === null || value === '') return;
    facts.push({ label: zh ? labelZh : labelEn, value: String(value) });
  };
  const list = (value: unknown): string =>
    Array.isArray(value) ? value.filter(Boolean).join(zh ? '、' : ', ') : '';
  const link = (labelZh: string, labelEn: string, value: unknown): void => {
    if (typeof value !== 'string' || !value) return;
    facts.push({ label: zh ? labelZh : labelEn, value, href: value });
  };
  const abv = data.abv as { min?: number; max?: number } | undefined;
  if (abv?.min !== undefined && abv.max !== undefined) {
    text('酒精度', 'ABV', abv.min === abv.max ? `${abv.min}% vol` : `${abv.min}–${abv.max}% vol`);
  }
  if (record.type === 'recipe') {
    const methodMap: Record<string, [string, string]> = {
      stir: ['搅拌', 'Stirred'],
      shake: ['摇和', 'Shaken'],
      build: ['直调', 'Built'],
      blend: ['搅拌机', 'Blended'],
      muddle: ['捣压', 'Muddled'],
      other: ['其他', 'Other'],
    };
    const method = methodMap[String(data.method)];
    if (method) text('调制方法', 'Method', zh ? method[0] : method[1]);
    const yieldValue = data.yield as { amount?: number; unit?: string; serves?: number } | undefined;
    if (yieldValue?.amount) {
      const serves = yieldValue.serves ? ` · ${yieldValue.serves} ${zh ? '份' : 'serving(s)'}` : '';
      text('份量', 'Yield', `${yieldValue.amount} ${yieldValue.unit ?? ''}${serves}`);
    }
    text('装饰', 'Garnish', data.garnish);
  }
  if (record.type === 'place') {
    const subtypeMap: Record<string, [string, string]> = {
      pub: ['酒馆', 'Pub'],
      bar: ['酒吧', 'Bar'],
      'winery-visitor': ['酒庄参访', 'Winery visit'],
      'distillery-visitor': ['酒厂参访', 'Distillery visit'],
      'brewery-visitor': ['啤酒厂参访', 'Brewery visit'],
      museum: ['博物馆', 'Museum'],
    };
    const subtype = subtypeMap[String(data.subtype)];
    if (subtype) text('地点类型', 'Place type', zh ? subtype[0] : subtype[1]);
    text('地址', 'Address', lang === 'en' ? data.address_en ?? data.address : data.address);
    const statusMap: Record<string, [string, string]> = {
      unknown: ['未核实', 'Not verified'],
      verified: ['已核实', 'Verified'],
      closed: ['已关闭', 'Closed'],
    };
    const status = statusMap[String(data.operating_status)];
    if (status) text('营业信息', 'Operating information', zh ? status[0] : status[1]);
    if (data.verified_at) text('信息核对', 'Information checked', data.verified_at);
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      text('坐标', 'Coordinates', `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
    } else if (data.latitude === null || data.longitude === null) {
      text('坐标', 'Coordinates', zh ? '未记录' : 'Not recorded');
    }
    link('官方网址', 'Official site', data.official_url);
  }
  if (record.type === 'region') {
    const levelMap: Record<string, [string, string]> = {
      country: ['国家', 'Country'],
      province: ['省级', 'Province'],
      city: ['城市', 'City'],
      other: ['其他', 'Other'],
    };
    const level = levelMap[String(data.level)];
    if (level) text('地区层级', 'Region level', zh ? level[0] : level[1]);
  }
  if (record.type === 'producer' || record.type === 'brand') {
    text('成立 / 建成年份', 'Founded', data.founded_year);
    text('组织类型', 'Organisation type', data.organization_type);
    link('官方网址', 'Official site', data.official_url);
  }
  if (record.type === 'poem') {
    text('作者', 'Author', data.author_name);
    text('朝代', 'Period', data.dynasty);
    text('出处', 'Source title', data.source_title);
    text('版本', 'Text version', data.text_variant);
  }
  if (record.type === 'article') {
    text('时期', 'Period', data.period);
    text('主题', 'Topics', list(data.topics));
  }
  if (record.type === 'guide') {
    text('适合读者', 'Audience', data.audience);
    const difficultyMap: Record<string, [string, string]> = {
      beginner: ['入门', 'Beginner'],
      intermediate: ['进阶', 'Intermediate'],
      advanced: ['高级', 'Advanced'],
    };
    const difficulty = difficultyMap[String(data.difficulty)];
    if (difficulty) text('难度', 'Difficulty', zh ? difficulty[0] : difficulty[1]);
  }
  if (record.type === 'cocktail') {
    text('风格', 'Style', data.style);
    text('起源说法', 'Origin account', data.origin_place);
  }
  if (record.type === 'vessel') {
    text('材质', 'Materials', list(data.materials));
    text('用途', 'Uses', data.uses_for);
    text('容量', 'Capacity', data.capacity_ml ? `${data.capacity_ml} ml` : null);
  }
  if (record.type === 'standard') {
    text('发布主体', 'Issuer', data.issuer);
    text('标准号', 'Standard code', data.standard_code);
    text('适用范围', 'Scope', data.scope);
  }
  return facts;
}

function buildPage(
  entity: Entity,
  record: ContentRecord,
  lang: Lang,
  index: ContentIndex,
  contracts: ReturnType<typeof loadContracts>,
  previewOrigins: Record<string, string> | null,
  mode: BuildMode,
  reverseIndex: Map<string, Array<{ relation: string; sourceId: string }>>,
): PageData {
  const type = findType(contracts, record.type);
  const site = siteForKey(contracts, type.site);
  const publication = recordPublication(record, index);
  const verificationScope =
    (record.frontmatter.verification_scope as 'source-verified' | 'archive-record' | undefined) ??
    (record.status === 'reviewed' ? 'source-verified' : 'needs-review');
  const isArchive = verificationScope === 'archive-record';
  const pathName = pagePath(type.path, record.slug, record.lang);
  const url = absoluteUrl(site, pathName, previewOrigins);
  const canonical = `https://${site.host}${pathName}`;

  const alternates: PageData['alternates'] = [];
  const otherLang: Lang = lang === 'zh' ? 'en' : 'zh';
  const other = entity[otherLang];
  if (other && includedInMode(other, index, mode)) {
    const otherPath = pagePath(findType(contracts, other.type).path, other.slug, other.lang);
    const otherPublication = recordPublication(other, index);
    if (!publication.published || otherPublication.published) {
      alternates.push({
        lang: otherLang,
        path: otherPath,
        url: absoluteUrl(site, otherPath, previewOrigins),
        published: otherPublication.published,
      });
    }
  }

  let translationState: PageData['translationState'] = 'not-applicable';
  let translationOutdated = false;
  if (lang === 'zh') {
    if (!entity.en) {
      translationState = 'missing';
    } else {
      const enPublication = recordPublication(entity.en, index);
      translationOutdated = enPublication.outdated;
      if (enPublication.outdated) translationState = 'outdated';
      else if (enPublication.published) translationState = 'published';
      else translationState = 'needs-review';
    }
  } else {
    translationOutdated = publication.outdated;
  }

  const relations: RelationTarget[] = [];
  for (const reverse of reverseIndex.get(entity.id) ?? []) {
    if (reverse.sourceId === entity.id) continue;
    const target = relationTarget(
      reverse.relation,
      reverse.sourceId,
      site.key,
      lang,
      index,
      contracts,
      previewOrigins,
      mode,
      publication.published,
    );
    if (target) relations.push(target);
  }
  const required = contracts.relations.required[record.type] ?? [];
  for (const relation of effectiveRelations(contracts, record)) {
    const target = relationTarget(
      relation.relation,
      relation.target_id,
      site.key,
      lang,
      index,
      contracts,
      previewOrigins,
      mode,
      publication.published,
    );
    if (!target) {
      if (publication.published && required.includes(relation.relation)) {
        throw new Error(
          `${record.id} (${lang}) is published but required relation ${relation.relation} -> ${relation.target_id} has no published target page`,
        );
      }
      continue;
    }
    relations.push(target);
  }
  const seenRelations = new Set<string>();
  const uniqueRelations = relations.filter((relation) => {
    const key = `${relation.relation}\u0000${relation.targetId}`;
    if (seenRelations.has(key)) return false;
    seenRelations.add(key);
    return true;
  });

  const refUrls = new Map<string, string>();
  for (const reference of record.frontmatter.references) {
    const target = relationTarget(
      'reference',
      reference.target_id,
      site.key,
      lang,
      index,
      contracts,
      previewOrigins,
      mode,
      publication.published,
    );
    const targetUrl = target?.url ?? target?.path;
    if (targetUrl) refUrls.set(reference.key, targetUrl);
  }

  const rendered = renderMarkdown(record.body, (key) => refUrls.get(key) ?? null);
  if (rendered.unresolvedRefs.length > 0) {
    const problems: ValidationIssue[] = rendered.unresolvedRefs.map((key) => ({
      level: 'warning',
      code: 'unresolved-reference-at-build',
      file: `${record.repo}/${record.relPath}`,
      message: `ref:${key} stays as plain text because its target is not available in this build`,
    }));
    index.issues.push(...problems);
  }

  let previewNotice: string | null = null;
  if (!publication.published) {
    if (record.frontmatter.status === 'needs-review') {
      previewNotice =
        lang === 'zh'
          ? '这是迁移中的待复核样本，仅作 noindex 预览，不进入正式搜索。'
          : 'This is a migration sample pending review. It is a noindex preview and is excluded from production search.';
    } else {
      previewNotice =
        lang === 'zh'
          ? `此页暂不进入正式发布：${publication.reason ?? 'publication requirements not met'}。`
          : `This page is not in production yet: ${publication.reason ?? 'publication requirements not met'}.`;
    }
    if (translationOutdated && lang === 'en') {
      previewNotice =
        'The Chinese source changed after this translation. This preview needs a fresh translation review.';
    }
  }

  return {
    id: record.id,
    type: record.type,
    typePath: type.path,
    siteKey: site.key,
    lang,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    status: record.status,
    published: publication.published,
    noindex: !publication.published,
    path: pathName,
    url,
    canonical,
    alternates,
    missingTranslation: lang === 'zh' && !entity.en,
    translationOutdated,
    translationState,
    verificationScope,
    archiveNotice: isArchive
      ? '这是旧站档案条目：正文保留旧站档案原文；其中历史、产品、地址、营业信息与图片未经过独立核实。'
      : null,
    html: rendered.html,
    headings: rendered.headings,
    facts: buildFacts(record, lang),
    relations: uniqueRelations,
    sources: record.frontmatter.sources,
    rights: record.frontmatter.rights,
    revision: record.revision,
    legacyRefs: record.frontmatter.legacy_refs,
    tags: record.frontmatter.tags,
    aliases: record.frontmatter.aliases,
    previewNotice,
    sourceSha256: record.sourceSha256,
  };
}

export function buildRegistry(
  index: ContentIndex,
  mode: BuildMode,
  previewOrigins: Record<string, string> | null,
): EntityRegistry {
  const entities = [];
  let publishedPages = 0;
  let previewPages = 0;
  let includedRecords = 0;
  for (const entity of index.entities.values()) {
    const translations: Partial<Record<Lang, EntityRegistryTranslation>> = {};
    for (const lang of ['zh', 'en'] as const) {
      const record = entity[lang];
      if (!record || !includedInMode(record, index, mode)) continue;
      const publication = recordPublication(record, index);
      const { path: pathName, url } = recordUrl(record, index.contracts, previewOrigins);
      translations[lang] = {
        lang,
        slug: record.slug,
        path: pathName,
        url,
        title: record.title,
        summary: record.summary,
        status: record.status,
        published: publication.published,
        translationStatus: record.frontmatter.translation_status ?? null,
      };
      includedRecords += 1;
      if (publication.published) publishedPages += 1;
      else previewPages += 1;
    }
    if (Object.keys(translations).length === 0) continue;
    entities.push({
      id: entity.id,
      type: entity.type,
      siteKey: entity.siteKey,
      typePath: entity.typePath,
      translations,
    });
  }
  entities.sort((a, b) => a.id.localeCompare(b.id));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    contentTreeSha256: contentTreeSha256(index),
    counts: {
      records: includedRecords,
      entities: entities.length,
      publishedPages,
      previewPages,
      sourceRecords: index.records.length,
      sourceEntities: index.entities.size,
    },
    entities,
  };
}

function buildLists(
  sitePages: PageData[],
  site: SiteContract,
  contracts: ReturnType<typeof loadContracts>,
  lang: Lang,
): ListPageData[] {
  const types = contracts.types.filter((type) => type.site === site.key);
  const lists: ListPageData[] = [];
  for (const type of types) {
    const pages = sortByTitle(
      sitePages.filter((page) => page.type === type.type && page.lang === lang),
      lang,
    );
    if (pages.length === 0) continue;
    const label = contracts.labels.types[type.type]?.[lang] ?? type.type;
    lists.push({
      type: type.type,
      typePath: type.path,
      lang,
      title: label,
      description:
        lang === 'zh'
          ? `${site.labelZh} · ${label}。只列出当前构建中真实存在的内容页面。`
          : `${site.labelEn} · ${label}. Only pages that really exist in this build are listed.`,
      pages,
      noindex: pages.some((page) => !page.published),
    });
  }
  return lists;
}

function reverseRelationIndex(
  index: ContentIndex,
  contracts: ReturnType<typeof loadContracts>,
): Map<string, Array<{ relation: string; sourceId: string }>> {
  const reverse = new Map<string, Array<{ relation: string; sourceId: string }>>();
  for (const record of index.records) {
    for (const relation of effectiveRelations(contracts, record)) {
      if (!index.entities.has(relation.target_id)) continue;
      const entries = reverse.get(relation.target_id) ?? [];
      entries.push({ relation: `inverse:${relation.relation}`, sourceId: record.id });
      reverse.set(relation.target_id, entries);
    }
  }
  return reverse;
}

const siteCache = new Map<string, SiteBuildData>();

export function getSiteBuildData(
  siteKey: string,
  options: {
    workspaceRoot?: string;
    mode?: BuildMode;
    previewOrigins?: Record<string, string> | null;
  } = {},
): SiteBuildData {
  const mode = options.mode ?? getBuildMode();
  const previewOrigins =
    options.previewOrigins === undefined ? getPreviewOrigins() : options.previewOrigins;
  const cacheKey = `${siteKey}:${mode}:${JSON.stringify(previewOrigins)}:${options.workspaceRoot ?? ''}`;
  const cached = siteCache.get(cacheKey);
  if (cached) return cached;

  const contracts = loadContracts(options.workspaceRoot);
  const index = loadContent(options.workspaceRoot, contracts);
  const site = siteForKey(contracts, siteKey);
  const reverseIndex = reverseRelationIndex(index, contracts);
  const pages: PageData[] = [];
  for (const entity of index.entities.values()) {
    if (entity.siteKey !== siteKey) continue;
    for (const lang of ['zh', 'en'] as const) {
      const record = entity[lang];
      if (!record || !includedInMode(record, index, mode)) continue;
      pages.push(
        buildPage(entity, record, lang, index, contracts, previewOrigins, mode, reverseIndex),
      );
    }
  }
  pages.sort((a, b) => a.path.localeCompare(b.path));
  const publishedPages = pages.filter((page) => page.published);
  const lists = [
    ...buildLists(pages, site, contracts, 'zh'),
    ...buildLists(pages, site, contracts, 'en'),
  ];
  const registry = buildRegistry(index, mode, previewOrigins);
  const data: SiteBuildData = {
    contracts,
    site,
    mode,
    previewOrigins,
    index,
    pages,
    publishedPages,
    lists,
    allPages: pages,
    publishedAllPages: publishedPages,
    registry,
  };
  siteCache.set(cacheKey, data);
  return data;
}

export function getStaticDetailPaths(siteKey: string, lang: Lang) {
  const data = getSiteBuildData(siteKey);
  return data.pages
    .filter((page) => page.lang === lang)
    .map((page) => ({
      params: { typePath: page.typePath, slug: page.slug },
      props: { page },
    }));
}

export function getStaticListPaths(siteKey: string, lang: Lang) {
  const data = getSiteBuildData(siteKey);
  return data.lists
    .filter((list) => list.lang === lang)
    .map((list) => ({
      params: { typePath: list.typePath },
      props: { list },
    }));
}

export function getHomePages(siteKey: string, lang: Lang): PageData[] {
  const data = getSiteBuildData(siteKey);
  const published = data.pages.filter((page) => page.lang === lang && page.published);
  return sortByTitle(published, lang);
}

export function getTypeCounts(siteKey: string, lang: Lang): Array<{ type: TypeContract; count: number }> {
  const data = getSiteBuildData(siteKey);
  return data.contracts.types
    .filter((type) => type.site === siteKey)
    .map((type) => ({
      type,
      count: data.publishedPages.filter((page) => page.lang === lang && page.type === type.type).length,
    }))
    .filter((entry) => entry.count > 0);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getSitemap(siteKey: string): string {
  const data = getSiteBuildData(siteKey);
  const site = data.site;
  const urls = new Set<string>([`https://${site.host}/`, `https://${site.host}/about/`]);
  for (const page of data.publishedPages) {
    urls.add(page.canonical);
  }
  for (const list of data.lists) {
    if (!list.noindex && list.pages.some((page) => page.published)) {
      urls.add(
        `https://${site.host}${list.lang === 'en' ? `/en/${list.typePath}/` : `/${list.typePath}/`}`,
      );
    }
  }
  if (data.pages.some((page) => page.lang === 'en' && page.published)) {
    urls.add(`https://${site.host}/en/`);
    urls.add(`https://${site.host}/en/about/`);
  }
  const entries = [...urls]
    .sort()
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export interface SearchRecord {
  url: string;
  content: string;
  language: Lang;
  meta: Record<string, string>;
  filters: Record<string, string[]>;
}

export function publishedSearchRecords(
  index: ContentIndex,
  options: { siteKey?: string; absolute?: boolean } = {},
): SearchRecord[] {
  const { siteKey, absolute = false } = options;
  const records: SearchRecord[] = [];
  for (const entity of index.entities.values()) {
    for (const lang of ['zh', 'en'] as const) {
      const record = entity[lang];
      if (!record) continue;
      if (siteKey && entity.siteKey !== siteKey) continue;
      const publication = recordPublication(record, index);
      if (!publication.published) continue;
      const type = typeForName(index.contracts, record.type);
      const site = siteForKey(index.contracts, type.site);
      const { url, path } = recordUrl(record, index.contracts, getPreviewOrigins());
      const typeLabel = index.contracts.labels.types[record.type]?.[lang] ?? record.type;
      const siteLabel = lang === 'zh' ? site.labelZh : site.labelEn;
      records.push({
        url: absolute ? url : path,
        content: `${record.title} ${record.summary} ${markdownToText(record.body)}`,
        language: lang,
        meta: {
          title: record.title,
          site: site.key,
          siteLabel,
          type: record.type,
          typeLabel,
          lang,
          verification: String(
            (record.frontmatter.verification_scope as string | undefined) ??
              (record.status === 'reviewed' ? 'source-verified' : 'needs-review'),
          ),
        },
        filters: {
          site: [site.key],
          lang: [lang],
          type: [record.type],
        },
      });
    }
  }
  records.sort((a, b) => a.url.localeCompare(b.url));
  return records;
}

export function entitySummary(index: ContentIndex, id: string): {
  id: string;
  title: string;
  type: string;
  siteKey: string;
  path: string | null;
  published: boolean;
} | null {
  const entity = index.entities.get(id);
  if (!entity) return null;
  const record = entity.zh ?? entity.en;
  if (!record) return null;
  const translation = availableRecord(entity, 'zh', index, 'production');
  const published = Boolean(translation);
  const pathName = translation
    ? recordUrl(translation, index.contracts, getPreviewOrigins()).path
    : null;
  return {
    id,
    title: entityLabel(entity, 'zh'),
    type: entity.type,
    siteKey: entity.siteKey,
    path: pathName,
    published,
  };
}
