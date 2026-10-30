export type Lang = 'zh' | 'en';
export type ReviewStatus = 'draft' | 'needs-review' | 'reviewed';
export type TranslationStatus = 'draft' | 'needs-review' | 'reviewed' | 'outdated';
export type BuildMode = 'preview' | 'production';

export interface SiteContract {
  key: string;
  labelZh: string;
  labelEn: string;
  contentRepository: string;
  siteRepository: string;
  appDirectory: string;
  host: string;
  accent: string;
  taglineZh: string;
  taglineEn: string;
  descriptionZh: string;
  descriptionEn: string;
  main: boolean;
}

export interface TypeContract {
  type: string;
  namespace: string;
  site: string;
  path: string;
}

export interface RelationContract {
  key: string;
  from: string[];
  to: string[];
}

export interface LabelSet {
  zh: string;
  en: string;
}

export interface Labels {
  schemaVersion: number;
  types: Record<string, LabelSet>;
  relations: Record<string, LabelSet>;
  reverseRelations: Record<string, LabelSet>;
  status: Record<string, LabelSet>;
}

export interface RelationRuleSet {
  schemaVersion: number;
  relations: RelationContract[];
  required: Record<string, string[]>;
  typedReferenceRelations: Record<string, Record<string, string>>;
}

export interface Contracts {
  sites: SiteContract[];
  types: TypeContract[];
  relations: RelationRuleSet;
  labels: Labels;
  repositories: {
    schemaVersion: number;
    githubOwner: string | null;
    remoteRepositoriesCreated: boolean;
    languages: Lang[];
    deploymentTarget: string;
    sharedPackagesHost: string;
    sites: Array<Record<string, unknown>>;
  };
  contractDir: string;
  workspaceRoot: string;
}

export interface Relation {
  relation: string;
  target_id: string;
}

export interface Source {
  key: string;
  title: string;
  url?: string;
  publisher?: string;
  published?: string;
  accessed?: string;
  note?: string;
}

export interface Rights {
  status: 'unverified' | 'allowed' | 'restricted';
  basis?: string;
  license?: string;
  note?: string;
}

export interface Reference {
  key: string;
  target_id: string;
  note?: string;
}

export interface Frontmatter {
  schema_version: number;
  id: string;
  type: string;
  lang: Lang;
  slug: string;
  title: string;
  summary: string;
  status: ReviewStatus;
  revision: number;
  legacy_refs: string[];
  aliases: string[];
  tags: string[];
  related: Relation[];
  references: Reference[];
  sources: Source[];
  rights: Rights;
  translation_of?: string;
  source_lang?: Lang;
  source_revision?: string;
  source_sha256?: string;
  translation_status?: TranslationStatus;
  [key: string]: unknown;
}

export interface ContentRecord {
  id: string;
  type: string;
  lang: Lang;
  slug: string;
  title: string;
  summary: string;
  status: ReviewStatus;
  revision: number;
  frontmatter: Frontmatter;
  body: string;
  filePath: string;
  relPath: string;
  repo: string;
  sourceSha256: string;
}

export interface Entity {
  id: string;
  type: string;
  namespace: string;
  siteKey: string;
  typePath: string;
  zh: ContentRecord | null;
  en: ContentRecord | null;
}

export interface RelationTarget {
  relation: string;
  targetId: string;
  target: Entity | null;
  targetRecord: ContentRecord | null;
  targetLang: Lang | null;
  path: string | null;
  url: string | null;
  label: string | null;
  available: boolean;
  reason?: string;
}

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export interface Fact {
  label: string;
  value: string;
  href?: string;
}

export interface PageData {
  id: string;
  type: string;
  typePath: string;
  siteKey: string;
  lang: Lang;
  slug: string;
  title: string;
  summary: string;
  status: ReviewStatus;
  published: boolean;
  noindex: boolean;
  path: string;
  url: string;
  canonical: string;
  alternates: Array<{ lang: Lang; url: string; path: string; published: boolean }>;
  missingTranslation: boolean;
  translationOutdated: boolean;
  translationState: 'published' | 'needs-review' | 'outdated' | 'missing' | 'not-applicable';
  verificationScope: 'source-verified' | 'archive-record' | 'needs-review';
  archiveNotice: string | null;
  html: string;
  headings: Heading[];
  facts: Fact[];
  relations: RelationTarget[];
  sources: Source[];
  rights: Rights;
  revision: number;
  legacyRefs: string[];
  tags: string[];
  aliases: string[];
  previewNotice: string | null;
  sourceSha256: string;
}

export interface ListPageData {
  type: string;
  typePath: string;
  lang: Lang;
  title: string;
  description: string;
  pages: PageData[];
  noindex: boolean;
}

export interface SiteBuildData {
  contracts: Contracts;
  site: SiteContract;
  mode: BuildMode;
  previewOrigins: Record<string, string> | null;
  index: ContentIndex;
  pages: PageData[];
  publishedPages: PageData[];
  lists: ListPageData[];
  allPages: PageData[];
  publishedAllPages: PageData[];
  registry: EntityRegistry;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  code: string;
  file: string;
  message: string;
}

export interface ContentIndex {
  contracts: Contracts;
  records: ContentRecord[];
  entities: Map<string, Entity>;
  byIdLang: Map<string, ContentRecord>;
  issues: ValidationIssue[];
  workspaceRoot: string;
}

export interface EntityRegistryTranslation {
  lang: Lang;
  slug: string;
  path: string;
  url: string;
  title: string;
  summary: string;
  status: ReviewStatus;
  published: boolean;
  translationStatus: TranslationStatus | null;
}

export interface EntityRegistryEntry {
  id: string;
  type: string;
  siteKey: string;
  typePath: string;
  translations: Partial<Record<Lang, EntityRegistryTranslation>>;
}

export interface EntityRegistry {
  schemaVersion: number;
  generatedAt: string;
  contentTreeSha256: string;
  counts: {
    records: number;
    entities: number;
    publishedPages: number;
    previewPages: number;
    sourceRecords?: number;
    sourceEntities?: number;
  };
  entities: EntityRegistryEntry[];
}
