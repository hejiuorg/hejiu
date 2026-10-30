import {
  getSiteBuildData,
  getPreviewOrigins,
  loadContracts,
  originFor,
  siteForKey,
  type ListPageData,
  type PageData,
  type SiteBuildData,
  type SiteContract,
  type SiteBuildData as SiteData,
  type TypeContract,
} from '@hejiu/build-tools';

export type UiLang = 'zh' | 'en';

export const uiText = {
  zh: {
    brand: '喝酒去',
    brandRoman: 'HEJIU',
    skipToContent: '跳到正文',
    navDiscover: '发现',
    navDrinks: '识酒',
    navGuide: '喝法',
    navCulture: '酒文化',
    navPlaces: '去处',
    navSaved: '收藏',
    search: '搜索',
    searchHint: '酒名、产区、鸡尾酒…',
    searchPlaceholder: '搜索酒、产区、喝法与地点',
    searchSubmit: '搜索',
    searchLoading: '正在准备搜索索引…',
    searchEmpty: '没有找到匹配内容。换一个词，或试试更短的词。',
    searchError: '搜索索引暂时不可用。请先完成构建或稍后重试。',
    searchPageTitle: '搜索',
    searchPageDesc: '在已审核并发布的样本中查找酒类、喝法、文化与地点。',
    searchAllSites: '全部四站',
    searchLocalOnly: '本站范围',
    searchFilters: '筛选',
    filterSite: '站点',
    filterLang: '语言',
    filterAll: '全部',
    resultsCount: '条结果',
    searchScopeNote: '搜索只包含已发布且允许分发的正文，不包含 noindex 预览。',
    language: '语言',
    switchToEn: 'English',
    switchToZh: '中文',
    missingTranslation: '英文译文尚未提供',
    missingTranslationShort: 'EN 缺译',
    needsReviewTranslation: '英文译文待复核',
    theme: '外观',
    themeSystem: '跟随系统',
    themeLight: '浅色',
    themeDark: '深色',
    themeHelp: '切换浅色、深色或跟随系统。',
    menu: '菜单',
    close: '关闭',
    back: '返回',
    home: '首页',
    toc: '本页目录',
    onThisPage: '本页目录',
    reviewed: '已审核',
    archiveRecord: '档案条目',
    archiveRecordNotice: '这是旧站档案条目：正文保留旧站档案原文；历史、产品、地址、营业信息与图片未经过独立核实。',
    archiveRecordShort: '档案',
    needsReview: '待复核',
    draft: '草稿',
    previewNotice: '待复核预览',
    readMore: '阅读全文',
    viewAll: '查看全部',
    explore: '探索',
    browse: '浏览',
    entries: '条',
    publishedSamples: '已发布样本',
    publishedPages: '已发布页面',
    previewPages: '待复核预览',
    pendingLedger: '旧记录待判型',
    homeKicker: '一杯，认识世界',
    homeTitle: '世界很大，',
    homeAccent: '一杯一杯认识。',
    homeDesc: '从酒类与产区，到怎么喝、去哪里，再到杯子之外的故事。四站共享一套身份与资料规则。',
    homeCta: '从识酒开始',
    homeSecondary: '看看喝法',
    fourSites: '四站，一条线索',
    fourSitesDesc: '识酒、喝法、酒文化与去处各自成站，内容与关系保持单一来源。',
    featured: '这一批，先读这些',
    featuredDesc: '只展示已经审核并发布的页面；预览内容单独标注。',
    typeDirectory: '按类型浏览',
    typeDirectoryDesc: '目录只列出当前构建中真实存在的页面。',
    statusPanel: '当前版本',
    statusPanelDesc: '2026-10-29 策展版：166 页、83 个实体，全部来源核验、中英双语。',
    statusNote: '553 条无法独立成页的旧站档案已停用（含 57 条诗词摘句）；公开页面均有独立来源，旧 URL 返回 404。',
    samplePreview: '预览',
    reviewedSample: '已审核',
    sources: '参考资料',
    sourcesEmpty: '本页尚未登记来源。',
    rights: '权利说明',
    rightsAllowed: '已记录分发依据',
    rightsUnverified: '分发许可待核实',
    related: '相关条目',
    relatedEmpty: '本页暂时没有可显示的关系。',
    revision: '修订',
    updated: '核对日期',
    legacyRefs: '旧记录键',
    save: '收藏',
    saved: '已收藏',
    saveHint: '收藏保存在当前浏览器的主站存储中。',
    saveToMain: '到主站收藏',
    savedTitle: '收藏',
    savedDesc: '收藏先集中在主站。子站只携带实体 ID 到主站确认，不声称跨子域自动共享。',
    savedEmpty: '还没有收藏。',
    savedEmptyDesc: '在任意站点把想读的条目送到主站收藏。',
    savedAddTitle: '确认收藏',
    savedAddDesc: '来自子站的条目需要在主站确认后才会保存。',
    savedAddConfirm: '确认收藏',
    savedRemove: '移除',
    savedExport: '导出',
    savedImport: '导入',
    savedNote: '收藏只保存在当前浏览器；导出文件包含实体 ID、标题缓存与保存时间。',
    savedUnknown: '这个 ID 不存在或尚未发布，无法收藏。',
    savedImported: '已导入',
    cancel: '取消',
    about: '关于',
    contribute: '贡献',
    footerNote: '喝酒去 · 内容样例站。审核状态以页面标注为准。',
    footerRights: '旧资料与图片的再分发许可仍待核实；未审核内容不进入正式搜索。',
    previewBuild: '预览构建',
    migrationLedger: '迁移台账记录',
    stillPending: '仍待判型',
    languageNotice: '本页暂无英文译文，因此不生成伪英文页面。',
    languageOutdated: '中文源文已更新，英文译文需要重新复核。',
    notReleased: '尚未发布',
    listEmpty: '这个分类还没有已发布页面。',
    listPreviewNote: '本列表含待复核预览，列表页不进入正式索引。',
    pageNotFound: '这一杯，还没找到。',
    pageNotFoundDesc: '地址可能已经改变，或这条内容尚未发布。',
    backToHome: '回到首页',
    previewBanner: '本页是迁移或审核中的 noindex 预览，不进入正式搜索。',
    sourceLink: '打开来源',
    sourceHash: '正文散列',
    accessed: '访问于',
    published: '已发布',
    noindex: 'noindex',
    mainSite: '主站',
    otherSites: '其他站点',
    desktopNav: '主导航',
    mobileNav: '手机导航',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
    searchDialogTitle: '搜索四站内容',
    searchPageLink: '打开搜索页',
    filtersClear: '清除筛选',
    siteSummary: '站点说明',
    sampleContent: '样本内容',
    languageSource: '中文源文',
    backToList: '返回目录',
    byline: '内容归属',
    typeLabel: '类型',
    statusLabel: '状态',
    readTime: '阅读',
    minutes: '分钟',
    allTypes: '全部类型',
    mainDiscover: '发现',
    mainDiscoverDesc: '认识酒，找到喝法，读一点故事，也去一个真实的地方。',
    cultureEntry: '酒文化在桌面导航与主站入口可达；手机底栏固定五项，不因五项限制而丢失文化站。',
    themeSaved: '外观偏好已保存',
    searchPrompt: '输入关键词，搜索已发布正文。',
  },
  en: {
    brand: 'Hejiu',
    brandRoman: 'HEJIU',
    skipToContent: 'Skip to content',
    navDiscover: 'Discover',
    navDrinks: 'Drinks',
    navGuide: 'Ways to drink',
    navCulture: 'Stories',
    navPlaces: 'Places',
    navSaved: 'Saved',
    search: 'Search',
    searchHint: 'A drink, region, cocktail…',
    searchPlaceholder: 'Search drinks, regions, guides and places',
    searchSubmit: 'Search',
    searchLoading: 'Preparing the search index…',
    searchEmpty: 'No matches. Try another word or a shorter query.',
    searchError: 'The search index is not available yet. Finish the build and try again.',
    searchPageTitle: 'Search',
    searchPageDesc: 'Search reviewed and published samples across drinks, ways to drink, stories and places.',
    searchAllSites: 'All four sites',
    searchLocalOnly: 'This site',
    searchFilters: 'Filters',
    filterSite: 'Site',
    filterLang: 'Language',
    filterAll: 'All',
    resultsCount: 'results',
    searchScopeNote: 'Search includes published text cleared for distribution only; noindex previews are excluded.',
    language: 'Language',
    switchToEn: 'English',
    switchToZh: '中文',
    missingTranslation: 'English translation not available yet',
    missingTranslationShort: 'EN missing',
    needsReviewTranslation: 'English translation needs review',
    theme: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeHelp: 'Switch between light, dark and system.',
    menu: 'Menu',
    close: 'Close',
    back: 'Back',
    home: 'Home',
    toc: 'On this page',
    onThisPage: 'On this page',
    reviewed: 'Reviewed',
    archiveRecord: 'Archive record',
    archiveRecordNotice: 'This is a legacy archive record: the original archive text is preserved; history, product, address, opening information and images were not independently verified.',
    archiveRecordShort: 'Archive',
    needsReview: 'Needs review',
    draft: 'Draft',
    previewNotice: 'Preview pending review',
    readMore: 'Read',
    viewAll: 'View all',
    explore: 'Explore',
    browse: 'Browse',
    entries: 'entries',
    publishedSamples: 'Published samples',
    publishedPages: 'Published pages',
    previewPages: 'Preview pages',
    pendingLedger: 'Legacy records pending',
    homeKicker: 'A WORLD IN EVERY GLASS',
    homeTitle: 'A whole world.',
    homeAccent: 'One glass at a time.',
    homeDesc: 'From styles and regions to ways of drinking, places to go and the stories beyond the glass. Four sites share one set of identities and evidence rules.',
    homeCta: 'Start with drinks',
    homeSecondary: 'Explore ways to drink',
    fourSites: 'Four sites, one thread',
    fourSitesDesc: 'Drinks, ways to drink, culture and places each have a site, while content and relationships keep a single source.',
    featured: 'Start with these',
    featuredDesc: 'Only reviewed and published pages are featured. Preview records are labelled separately.',
    typeDirectory: 'Browse by type',
    typeDirectoryDesc: 'Directories only list pages that actually exist in this build.',
    statusPanel: 'Current edition',
    statusPanelDesc: 'The curated edition of 29 October 2026: 166 pages and 83 entities, all source-verified and bilingual.',
    statusNote: 'The 553 legacy archive records that could not stand alone, including 57 poem excerpts, are retired; every public page has independent sources and old URLs return 404.',
    samplePreview: 'Preview',
    reviewedSample: 'Reviewed',
    sources: 'References',
    sourcesEmpty: 'No sources are recorded for this page yet.',
    rights: 'Rights',
    rightsAllowed: 'Distribution basis recorded',
    rightsUnverified: 'Rights pending',
    related: 'Related records',
    relatedEmpty: 'No available relationships for this page.',
    revision: 'Revision',
    updated: 'Checked',
    legacyRefs: 'Legacy keys',
    save: 'Save',
    saved: 'Saved',
    saveHint: 'Saved items live in the main site’s browser storage.',
    saveToMain: 'Save on the main site',
    savedTitle: 'Saved',
    savedDesc: 'Saving lives on the main site. Subdomains carry an entity ID to the main site for confirmation; browser storage is not assumed to be shared across subdomains.',
    savedEmpty: 'Nothing saved yet.',
    savedEmptyDesc: 'Send an entry from any site to the main site to confirm a save.',
    savedAddTitle: 'Confirm save',
    savedAddDesc: 'An entry arriving from a subdomain needs confirmation on the main site before it is stored.',
    savedAddConfirm: 'Confirm save',
    savedRemove: 'Remove',
    savedExport: 'Export',
    savedImport: 'Import',
    savedNote: 'Saved items stay in this browser. The export file contains entity IDs, cached titles and save times.',
    savedUnknown: 'That ID does not exist or is not published, so it cannot be saved.',
    savedImported: 'Imported',
    cancel: 'Cancel',
    about: 'About',
    contribute: 'Contribute',
    footerNote: 'Hejiu · sample content site. Check the status labels on each page.',
    footerRights: 'Legacy text and image rights are still being verified. Unreviewed content is excluded from production search.',
    previewBuild: 'Preview build',
    migrationLedger: 'Ledger rows',
    stillPending: 'Still pending',
    languageNotice: 'No English translation exists for this page, so no fake English page is generated.',
    languageOutdated: 'The Chinese source changed; the English translation needs a new review.',
    notReleased: 'Not published',
    listEmpty: 'No published pages in this category yet.',
    listPreviewNote: 'This list contains preview records and is excluded from the formal index.',
    pageNotFound: 'This glass is not here.',
    pageNotFoundDesc: 'The address may have changed, or the content is not published yet.',
    backToHome: 'Back home',
    previewBanner: 'This is a noindex migration or review preview. It is excluded from production search.',
    sourceLink: 'Open source',
    sourceHash: 'Content hash',
    accessed: 'Accessed',
    published: 'Published',
    noindex: 'noindex',
    mainSite: 'Main site',
    otherSites: 'Other sites',
    desktopNav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    searchDialogTitle: 'Search all four sites',
    searchPageLink: 'Open search page',
    filtersClear: 'Clear filters',
    siteSummary: 'Site note',
    sampleContent: 'Sample content',
    languageSource: 'Chinese source',
    backToList: 'Back to list',
    byline: 'Content owner',
    typeLabel: 'Type',
    statusLabel: 'Status',
    readTime: 'Read',
    minutes: 'min',
    allTypes: 'All types',
    mainDiscover: 'Discover',
    mainDiscoverDesc: 'Meet a drink, find a way to enjoy it, read a story, and go somewhere real.',
    cultureEntry: 'Stories remain reachable from the desktop navigation and the main site; the five-item mobile bar does not hide the culture site.',
    themeSaved: 'Appearance preference saved',
    searchPrompt: 'Enter a keyword to search published text.',
  },
} as const;

export type UiText = (typeof uiText)['zh'];

export interface SiteUiContext {
  data: SiteBuildData;
  site: SiteContract;
  contracts: SiteBuildData['contracts'];
  labels: typeof uiText.zh;
  lang: UiLang;
  alternateLang: UiLang;
  origins: Record<string, string> | null;
}

export function uiFor(siteKey: string, lang: UiLang): SiteUiContext {
  const data = getSiteBuildData(siteKey);
  return {
    data,
    site: data.site,
    contracts: data.contracts,
    labels: uiText[lang],
    lang,
    alternateLang: lang === 'zh' ? 'en' : 'zh',
    origins: data.previewOrigins ?? getPreviewOrigins(),
  };
}

export function homePath(lang: UiLang): string {
  return lang === 'en' ? '/en/' : '/';
}

export function aboutPath(lang: UiLang): string {
  return lang === 'en' ? '/en/about/' : '/about/';
}

export function contributePath(lang: UiLang): string {
  return lang === 'en' ? '/en/contribute/' : '/contribute/';
}

export function searchPath(lang: UiLang): string {
  return lang === 'en' ? '/en/search/' : '/search/';
}

export function savedPath(lang: UiLang): string {
  return lang === 'en' ? '/en/saved/' : '/saved/';
}

export function listPath(typePath: string, lang: UiLang): string {
  return lang === 'en' ? `/en/${typePath}/` : `/${typePath}/`;
}

export function typeLabel(
  contracts: SiteBuildData['contracts'],
  type: string,
  lang: UiLang,
): string {
  return contracts.labels.types[type]?.[lang] ?? type;
}

export function relationLabel(
  contracts: SiteBuildData['contracts'],
  relation: string,
  lang: UiLang,
): string {
  if (relation.startsWith('inverse:')) {
    const key = relation.slice('inverse:'.length);
    return contracts.labels.reverseRelations?.[key]?.[lang] ?? key;
  }
  return contracts.labels.relations[relation]?.[lang] ?? relation;
}

export function siteLink(
  currentSiteKey: string,
  targetSiteKey: string,
  pathName: string,
  origins: Record<string, string> | null,
): string {
  if (currentSiteKey === targetSiteKey) return pathName;
  const contracts = loadContracts();
  const site = siteForKey(contracts, targetSiteKey);
  return `${originFor(site, origins)}${pathName}`;
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  active?: boolean;
}

export function headerNav(context: SiteUiContext): NavItem[] {
  const { site, labels, lang, origins } = context;
  return [
    {
      key: 'drinks',
      label: labels.navDrinks,
      href: siteLink(site.key, 'beverages', listPath('styles', lang), origins),
      icon: 'glass',
    },
    {
      key: 'guide',
      label: labels.navGuide,
      href: siteLink(site.key, 'guide', homePath(lang), origins),
      icon: 'drop',
    },
    {
      key: 'culture',
      label: labels.navCulture,
      href: siteLink(site.key, 'culture', homePath(lang), origins),
      icon: 'book',
    },
    {
      key: 'places',
      label: labels.navPlaces,
      href: siteLink(site.key, 'atlas', homePath(lang), origins),
      icon: 'map',
    },
  ];
}

export function bottomNav(context: SiteUiContext, active: string): NavItem[] {
  const { site, labels, lang, origins } = context;
  const items = [
    {
      key: 'discover',
      label: labels.navDiscover,
      href: siteLink(site.key, 'beverages', homePath(lang), origins),
      icon: 'compass',
    },
    {
      key: 'drinks',
      label: labels.navDrinks,
      href: siteLink(site.key, 'beverages', listPath('styles', lang), origins),
      icon: 'glass',
    },
    {
      key: 'guide',
      label: labels.navGuide,
      href: siteLink(site.key, 'guide', homePath(lang), origins),
      icon: 'drop',
    },
    {
      key: 'places',
      label: labels.navPlaces,
      href: siteLink(site.key, 'atlas', homePath(lang), origins),
      icon: 'map',
    },
    {
      key: 'saved',
      label: labels.navSaved,
      href: siteLink(site.key, 'beverages', savedPath(lang), origins),
      icon: 'bookmark',
    },
  ];
  return items.map((item) => ({ ...item, active: item.key === active })) as Array<
    NavItem & { active: boolean }
  >;
}

export function siteCards(context: SiteUiContext): Array<{
  key: string;
  label: string;
  tagline: string;
  description: string;
  href: string;
  accent: string;
  count: number;
}> {
  const { site, lang, origins, contracts, data } = context;
  return contracts.sites.map((entry) => {
    const siteData = getSiteBuildData(entry.key);
    const count = siteData.pages.filter((page) => page.lang === lang && page.published).length;
    return {
      key: entry.key,
      label: lang === 'zh' ? entry.labelZh : entry.labelEn,
      tagline: lang === 'zh' ? entry.taglineZh : entry.taglineEn,
      description: lang === 'zh' ? entry.descriptionZh : entry.descriptionEn,
      href: siteLink(site.key, entry.key, homePath(lang), origins),
      accent: entry.accent,
      count,
    };
  });
}

export function pageListUrl(context: SiteUiContext, page: PageData): string {
  return siteLink(context.site.key, page.siteKey, page.path, context.origins);
}

export function detailRelationUrl(context: SiteUiContext, targetUrl: string): string {
  return targetUrl;
}

export function staticAlternatePath(pathName: string, lang: UiLang): string {
  if (lang === 'zh') {
    return pathName === '/' ? '/en/' : `/en${pathName}`;
  }
  const stripped = pathName.replace(/^\/en(?=\/|$)/, '');
  return stripped || '/';
}

export function pageAlternateHref(page: PageData): string | null {
  const alternate = page.alternates[0];
  return alternate?.path ?? null;
}

export function pageAlternateState(page: PageData): 'available' | 'missing' | 'needs-review' | 'outdated' {
  if (page.lang === 'en') return 'available';
  if (page.translationState === 'published') return 'available';
  if (page.translationState === 'outdated') return 'outdated';
  if (page.translationState === 'needs-review') return 'needs-review';
  return 'missing';
}

export function statusLabel(labels: UiText, status: string): string {
  if (status === 'reviewed') return labels.reviewed;
  if (status === 'needs-review') return labels.needsReview;
  return labels.draft;
}

export function typeCount(data: SiteData, type: TypeContract, lang: UiLang): number {
  return data.pages.filter(
    (page) => page.lang === lang && page.type === type.type && page.published,
  ).length;
}

export function previewCount(data: SiteData, type: TypeContract, lang: UiLang): number {
  return data.pages.filter(
    (page) => page.lang === lang && page.type === type.type && !page.published,
  ).length;
}

export function featuredPages(data: SiteData, lang: UiLang, limit = 6): PageData[] {
  const published = data.pages.filter((page) => page.lang === lang && page.published);
  const verified = published.filter((page) => page.verificationScope === 'source-verified');
  const archive = published.filter((page) => page.verificationScope === 'archive-record');
  const sort = (items: PageData[]) =>
    [...items].sort((a, b) => a.title.localeCompare(b.title, lang === 'zh' ? 'zh-Hans' : 'en'));
  return [...sort(verified), ...sort(archive)].slice(0, limit);
}

export function listForType(
  data: SiteData,
  typePath: string,
  lang: UiLang,
): ListPageData | undefined {
  return data.lists.find((list) => list.typePath === typePath && list.lang === lang);
}

export function searchBundle(siteKey: string): string {
  return siteKey === 'beverages' ? '/all-search/pagefind.js' : '/pagefind/pagefind.js';
}
