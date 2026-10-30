import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PROJECT = path.dirname(ROOT);
const CONTENT = path.join(ROOT, 'content-repositories');
const MIGRATION = path.join(ROOT, 'migration');
const LEDGER_PATH = path.join(PROJECT, 'docs', 'audit', 'legacy-ledger.json');
const CORE_PATH = path.join(PROJECT, 'zh', 'index.json');
const COUNTRIES_PATH = path.join(PROJECT, 'zh', 'world', 'countries.json');
const CONTINENTS_PATH = path.join(PROJECT, 'zh', 'world', 'continents.json');
const CHINA_INDEX_PATH = path.join(PROJECT, 'zh', 'china', 'china_index.json');
const DRY_RUN = process.argv.includes('--dry-run');

const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
const core = JSON.parse(fs.readFileSync(CORE_PATH, 'utf8'));
const countries = JSON.parse(fs.readFileSync(COUNTRIES_PATH, 'utf8'));
const continents = JSON.parse(fs.readFileSync(CONTINENTS_PATH, 'utf8'));
const chinaIndex = JSON.parse(fs.readFileSync(CHINA_INDEX_PATH, 'utf8'));
const countryName = new Map(countries.map((country) => [country.id, country.name]));
const categories = core.CategoryMeta ?? [];
const categoryById = new Map(categories.map((category) => [category.id, category]));
const subcategories = new Map();
for (const category of categories) {
  for (const sub of category.subcategories ?? []) {
    subcategories.set(`${category.id}/${sub.id}`, sub);
  }
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function slugify(value) {
  const slug = String(value)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return slug || 'legacy-record';
}

function summaryOf(value, fallback) {
  const text = normalizeText(value) || fallback;
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length > 280 ? `${single.slice(0, 280)}…` : single;
}

function normalizeText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('\n\n');
  return value === undefined || value === null ? '' : String(value);
}

function sourceOfLegacy(row, sourceFile, kind) {
  return {
    key: 'legacy-record',
    title: `喝酒去旧站《${row.name ?? row.verse ?? '记录'}》记录`,
    publisher: `喝酒去旧站（${sourceFile}）`,
    note:
      kind === 'poem'
        ? '旧站诗词摘句；全文、异文、作者、出处与再分发许可待核。'
        : '旧站未附统一来源字段；正文、图片、事实与营业信息均待核对。',
  };
}

function rightsUnverified() {
  return {
    status: 'unverified',
    note: '旧站正文与图片的再分发许可尚未核实；本页仅作为 needs-review 迁移预览。',
  };
}

function parseAbv(raw) {
  if (!raw) return undefined;
  const numbers = [...String(raw).matchAll(/\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((number) => number > 0 && number <= 100);
  if (numbers.length === 0) return undefined;
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0], unit: 'percent-vol' };
  const [first, second] = numbers;
  return { min: Math.min(first, second), max: Math.max(first, second), unit: 'percent-vol' };
}

function parseYear(raw) {
  const match = /\b(1\d{3}|20\d{2})\b/.exec(String(raw ?? ''));
  return match ? Number(match[1]) : null;
}

function listLines(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => `- ${item}`).join('\n');
  return normalizeText(value);
}

function bodySection(title, value) {
  const text = normalizeText(value).trim();
  return text ? `## ${title}\n\n${text}\n\n` : '';
}

function frontmatterFile(front, body) {
  return `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n${body.trim()}\n`;
}

function writeFile(relative, content, generated) {
  const full = path.join(ROOT, relative);
  if (DRY_RUN) {
    generated.push(relative);
    return;
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  generated.push(relative);
}

function writeJson(relative, value) {
  if (DRY_RUN) return;
  const full = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function walkMarkdown(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, result);
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') result.push(full);
  }
  return result;
}

function existingContent() {
  const entries = new Map();
  for (const repo of fs.readdirSync(CONTENT)) {
    const zh = path.join(CONTENT, repo, 'zh');
    for (const file of walkMarkdown(zh)) {
      const raw = fs.readFileSync(file, 'utf8');
      const match = /^---\n([\s\S]*?)\n---/.exec(raw);
      if (!match) continue;
      let data;
      try {
        data = YAML.parse(match[1]);
      } catch {
        continue;
      }
      if (!data?.id) continue;
      entries.set(data.id, {
        id: data.id,
        type: data.type,
        slug: data.slug,
        relPath: path.relative(ROOT, file).split(path.sep).join('/'),
      });
    }
  }
  return entries;
}

const generated = [];
const generatedIds = new Map();

if (!DRY_RUN) {
  for (const relative of previousGeneratedFiles()) {
    const full = path.join(ROOT, relative);
    if (full.startsWith(path.join(CONTENT, ''))) {
      fs.rmSync(full, { force: true });
    }
  }
}

const existing = existingContent();
const usedIds = new Set(existing.keys());
const usedSlugs = new Set([...existing.values()].map((entry) => `${entry.type}/zh/${entry.slug}`));

function claimId(id) {
  if (usedIds.has(id)) return false;
  usedIds.add(id);
  return true;
}

function claimSlug(type, slug) {
  let candidate = slug;
  let index = 2;
  while (usedSlugs.has(`${type}/zh/${candidate}`)) {
    candidate = `${slug}-${index}`;
    index += 1;
  }
  usedSlugs.add(`${type}/zh/${candidate}`);
  return candidate;
}

function addInfo(id, type, slug) {
  generatedIds.set(id, { id, type, slug });
  existing.set(id, { id, type, slug, relPath: null });
}

function previousGeneratedFiles() {
  const file = path.join(MIGRATION, 'generated-files.json');
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


// Controlled category styles. Existing baijiu/strong-aroma styles are reused.
const styleIds = new Map();
const createdStyles = [];
for (const category of categories) {
  const slug = slugify(category.id);
  let id = `drink-style:${slug}`;
  if (category.id === 'baijiu' && existing.has('drink-style:baijiu')) {
    styleIds.set(category.id, 'drink-style:baijiu');
    continue;
  }
  if (existing.has(id)) {
    styleIds.set(category.id, id);
    continue;
  }
  const safeSlug = claimSlug('drink-style', slug);
  id = `drink-style:${safeSlug}`;
  if (!claimId(id)) throw new Error(`Style ID collision: ${id}`);
  styleIds.set(category.id, id);
  const subList = (category.subcategories ?? [])
    .map((sub) => `- ${sub.name}（${sub.nameEn}）：${sub.desc}`)
    .join('\n');
  const body = `# ${category.name}\n\n> 迁移说明：本页由旧站分类定义生成，分类归属、名称与描述待复核；不是对具体产品的质量背书。\n\n## 旧站分类说明\n\n${category.desc}\n\n## 旧站子分类\n\n${subList}\n\n## 迁移边界\n\n本页只建立风格容器，具体酒款、品牌与产品必须在 G4 审核时继续判型。旧站标签与子分类不自动成为当前受控词。\n`;
  const front = {
    schema_version: 1,
    id,
    type: 'drink-style',
    lang: 'zh',
    slug: safeSlug,
    title: category.name,
    summary: summaryOf(category.desc, category.name),
    status: 'needs-review',
    revision: 1,
    legacy_refs: [],
    aliases: category.nameEn ? [category.nameEn] : [],
    tags: ['migration-sample'],
    related: [],
    references: [],
    sources: [
      {
        key: 'legacy-category',
        title: `喝酒去旧站分类《${category.name}》`,
        publisher: '喝酒去旧站（zh/index.json CategoryMeta）',
        note: '旧站分类定义；分类边界与名称待 G4 复核。',
      },
    ],
    rights: rightsUnverified(),
  };
  const relative = `content-repositories/alcoholic-beverages/zh/drink-style/${safeSlug}.md`;
  writeFile(relative, frontmatterFile(front, body), generated);
  addInfo(id, 'drink-style', safeSlug);
  createdStyles.push({ category: category.id, id, slug: safeSlug });
}

const styleAliases = { huangjiu: 'yellow_wine' };

function categoryKey(value) {
  const key = String(value ?? 'other');
  return styleAliases[key] ?? key;
}

function styleRefsFor(row) {
  const key = categoryKey(row.category);
  const style = styleIds.get(key) ?? styleIds.get('other');
  if (!style) throw new Error(`No style for category ${row.category}`);
  const refs = [style];
  if (key === 'baijiu' && row.subcategory === 'strong_aroma') {
    if (existing.has('drink-style:strong-aroma-baijiu')) refs.push('drink-style:strong-aroma-baijiu');
  }
  return refs;
}

const sourceCache = new Map();
function readSource(file, index) {
  if (!sourceCache.has(file)) {
    sourceCache.set(file, JSON.parse(fs.readFileSync(path.join(PROJECT, file), 'utf8')));
  }
  return sourceCache.get(file)[index];
}

const SAMPLE_TARGETS = new Map([
  [
    'liquor:anhui_gujinggongjiu',
    {
      status: 'split',
      targetRefs: ['brand:gujing-gongjiu', 'drink:gujing-gongjiu-nianfen-yuanjiang-20'],
      reason: '旧记录把品牌历史与具体产品线混在同一条；品牌身份保留为 brand，产品线拆为 drink，二者保留原记录键。',
    },
  ],
  [
    'pub:lao_baijiu_guan',
    {
      status: 'migrated-needs-review',
      targetRefs: ['place:lao-baijiu-guan'],
      reason: '迁为 place/pub；地址与故事保留，坐标、营业状态和来源待复核。',
    },
  ],
  ...['poetry:1', 'poetry:2', 'poetry:3', 'poetry:4'].map((key) => [
    key,
    {
      status: 'merged',
      targetRefs: ['poem:jiang-jin-jiu-excerpt'],
      reason: '旧站四句同属李白《将进酒》节选，合并为一条诗词记录。',
    },
  ]),
]);

const targetByLegacyKey = new Map();
const fieldMap = [];
const conflicts = [];

function recordFieldMap(legacyKey, row, targetRefs, sourceFile, sourceIndex, sourceRecordSha256, disposition) {
  fieldMap.push({
    legacyKey,
    sourceFile,
    sourceIndex,
    sourceRecordSha256,
    targetRefs,
    fieldDisposition: disposition,
  });
}

function relativeFor(type, slug) {
  if (type === 'drink' || type === 'drink-style') {
    return `content-repositories/alcoholic-beverages/zh/${type}/${slug}.md`;
  }
  if (type === 'place') return `content-repositories/alcohol-atlas/zh/place/${slug}.md`;
  if (type === 'poem') return `content-repositories/alcohol-culture/zh/poem/${slug}.md`;
  throw new Error(`No path for type ${type}`);
}

function generateDrink(ledgerRow, row) {
  const baseSlug = slugify(row.id);
  const idBase = `drink:${baseSlug}`;
  if (existing.has(idBase)) {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: `Existing entity ${idBase}` });
    return null;
  }
  const slug = claimSlug('drink', baseSlug);
  const id = `drink:${slug}`;
  if (!claimId(id)) {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: `ID collision ${id}` });
    return null;
  }
  const category = categoryKey(row.category);
  const subLabel = row.subcategory
    ? subcategories.get(`${category}/${row.subcategory}`)?.name ?? row.subcategory
    : null;
  const categoryLabel = categoryById.get(category)?.name ?? category;
  const tags = Array.isArray(row.tags) ? row.tags.filter(Boolean) : [];
  const body = `# ${row.name}\n\n> 迁移说明：本页保留旧站“酒品”原文，按旧分类暂判为 drink。品牌/产品边界、来源、酒精度、历史断言与权利均未核实，不能当作已审核资料。\n\n${bodySection('旧站简介', row.description)}${bodySection('旧站特色', row.features)}${bodySection('旧站历史', row.history)}${bodySection('旧站分析', row.analysis)}## 旧站分类与产地\n\n- 旧分类：${row.category ?? '未记录'} / ${row.subcategory ?? '未记录'}\n- 分类标签：${categoryLabel}${subLabel ? ` / ${subLabel}` : ''}\n- 原产地：${row.origin ?? '未记录'}\n- 地区：${row.region ?? '未记录'}\n- 区县：${row.district ?? '未记录'}\n- 酒精度原文：${row.alcohol ?? '未记录'}\n- 旧站标签：${tags.length ? tags.join('、') : '无'}\n\n## 字段去向\n\n- 名称 → title\n- 英文名 → aliases（只作名称线索，不是英文正文）\n- 简介 → summary 与正文“旧站简介”\n- 特色、历史、分析 → 正文对应章节\n- 分类/子分类 → style_refs 与正文\n- 产地字段 → 正文保留；尚未建立对应地域实体\n- 酒精度 → 可解析时写入 abv，原文仍保留\n- 标签 → 正文保留，未直接进入受控 tags\n- 旧 ID → legacy_refs 与稳定 slug\n`;
  const front = {
    schema_version: 1,
    id,
    type: 'drink',
    lang: 'zh',
    slug,
    title: row.name,
    summary: summaryOf(row.description, row.name),
    status: 'needs-review',
    revision: 1,
    style_refs: styleRefsFor(row),
    brand_refs: [],
    producer_refs: [],
    region_refs: [],
    ingredient_refs: [],
    process_refs: [],
    legacy_refs: [ledgerRow.legacyKey],
    aliases: row.nameEn ? [row.nameEn] : [],
    tags: ['migration-sample'],
    related: [],
    references: [],
    sources: [sourceOfLegacy(row, ledgerRow.sourceFile, 'drink')],
    rights: rightsUnverified(),
  };
  const abv = parseAbv(row.alcohol);
  if (abv) front.abv = abv;
  const relative = relativeFor('drink', slug);
  writeFile(relative, frontmatterFile(front, body), generated);
  addInfo(id, 'drink', slug);
  recordFieldMap(ledgerRow.legacyKey, row, [id], ledgerRow.sourceFile, ledgerRow.sourceIndex, ledgerRow.sourceRecordSha256, {
    name: 'title',
    nameEn: 'aliases (not translation)',
    description: 'summary + body:旧站简介',
    features: 'body:旧站特色',
    history: 'body:旧站历史',
    analysis: 'body:旧站分析',
    category: 'style_refs + body:旧站分类与产地',
    subcategory: 'style_refs + body:旧站分类与产地',
    origin: 'body:旧站分类与产地',
    region: 'body:旧站分类与产地',
    district: 'body:旧站分类与产地',
    alcohol: abv ? 'abv + body:酒精度原文' : 'body:酒精度原文',
    tags: 'body:旧站标签（not controlled tags）',
    id: 'legacy_refs + slug',
  });
  return id;
}

function generatePlace(ledgerRow, row) {
  const baseSlug = slugify(row.id);
  const idBase = `place:${baseSlug}`;
  if (existing.has(idBase)) {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: `Existing entity ${idBase}` });
    return null;
  }
  const slug = claimSlug('place', baseSlug);
  const id = `place:${slug}`;
  if (!claimId(id)) {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: `ID collision ${id}` });
    return null;
  }
  const country = countryName.get(row.country) ?? row.country ?? '未记录';
  const specialties = Array.isArray(row.specialties) ? row.specialties.filter(Boolean) : [];
  const body = `# ${row.name}\n\n> 迁移说明：本页保留旧站酒馆原文，迁为 place/pub。地址、营业状态、人物轶事与来源均未核实；不能显示为“正在营业”。\n\n${bodySection('旧站简介', row.description)}${bodySection('旧站历史', row.history)}## 旧站信息\n\n- 城市：${row.city ?? '未记录'}\n- 国家/地区：${country}\n- 旧站地址：${row.address ?? '未记录'}\n- 创立时间原文：${row.founded ?? '未记录'}\n- 特色：${specialties.length ? specialties.join('、') : '未记录'}\n- 旧站人物叙事：${row.famousPatrons ?? '未记录'}\n- 旧站标签：${Array.isArray(row.tags) && row.tags.length ? row.tags.join('、') : '无'}\n\n## 状态\n\n- 内容状态：needs-review\n- 营业状态：unknown（旧站没有核验日期或官方链接）\n- 坐标：未记录，不填零\n\n## 字段去向\n\n- 名称 → title\n- 英文名 → aliases（不是英文正文）\n- 地址、城市、国家 → frontmatter 与正文\n- 创立时间 → founded_year（可解析时）与正文\n- 简介、历史、特色、人物叙事 → 正文\n- 营业状态 → unknown\n- 旧 ID → legacy_refs 与稳定 slug\n`;
  const front = {
    schema_version: 1,
    id,
    type: 'place',
    lang: 'zh',
    slug,
    title: row.name,
    summary: summaryOf(row.description, row.name),
    status: 'needs-review',
    revision: 1,
    subtype: 'pub',
    address: row.address || '旧站未记录地址',
    country,
    latitude: null,
    longitude: null,
    producer_refs: [],
    region_refs: [],
    operating_status: 'unknown',
    legacy_refs: [ledgerRow.legacyKey],
    aliases: row.nameEn ? [row.nameEn] : [],
    tags: ['migration-sample'],
    related: [],
    references: [],
    sources: [sourceOfLegacy(row, ledgerRow.sourceFile, 'place')],
    rights: rightsUnverified(),
  };
  if (row.city) front.city = row.city;
  const foundedYear = parseYear(row.founded);
  if (foundedYear) front.founded_year = foundedYear;
  const relative = relativeFor('place', slug);
  writeFile(relative, frontmatterFile(front, body), generated);
  addInfo(id, 'place', slug);
  recordFieldMap(ledgerRow.legacyKey, row, [id], ledgerRow.sourceFile, ledgerRow.sourceIndex, ledgerRow.sourceRecordSha256, {
    name: 'title',
    nameEn: 'aliases (not translation)',
    country: 'frontmatter.country + body',
    city: 'frontmatter.city + body',
    address: 'frontmatter.address + body',
    founded: foundedYear ? 'frontmatter.founded_year + body' : 'body',
    description: 'summary + body:旧站简介',
    history: 'body:旧站历史',
    specialties: 'body:旧站信息',
    famousPatrons: 'body:旧站信息',
    tags: 'body:旧站信息',
    id: 'legacy_refs + slug',
  });
  return id;
}

function generatePoem(ledgerRow, poem, index) {
  const number = String(ledgerRow.legacyKey.split(':')[1]).padStart(3, '0');
  const baseSlug = `poetry-${number}`;
  const idBase = `poem:${baseSlug}`;
  if (existing.has(idBase)) {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: `Existing entity ${idBase}` });
    return null;
  }
  const slug = claimSlug('poem', baseSlug);
  const id = `poem:${slug}`;
  if (!claimId(id)) {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: `ID collision ${id}` });
    return null;
  }
  const match = /^(.*?)《(.+?)》/.exec(poem.source ?? '');
  const author = match?.[1]?.trim() || undefined;
  const work = match?.[2]?.trim() || undefined;
  const title = work ? `${work}（旧站摘句 ${number}）` : `旧站诗句 ${number}`;
  const body = `# ${title}\n\n> ${poem.verse}\n\n## 旧站摘句说明\n\n- 旧站来源：${poem.source ?? '未记录'}\n- 旧站索引：WinePoetry[${index}]\n- 说明：这是旧站摘句，不是完整诗篇；作者、题名、异文、出处与再分发许可待核。\n\n## 字段去向\n\n- verse → summary 与正文引文\n- source → author_name / source_title / 正文\n- 旧站数组索引 → legacy_refs 与稳定 slug\n`;
  const front = {
    schema_version: 1,
    id,
    type: 'poem',
    lang: 'zh',
    slug,
    title,
    summary: summaryOf(poem.verse, title),
    status: 'needs-review',
    revision: 1,
    text_variant: '旧站摘句，待核校',
    legacy_refs: [ledgerRow.legacyKey],
    aliases: [],
    tags: ['migration-sample'],
    related: [],
    references: [],
    sources: [
      {
        key: 'legacy-record',
        title: `喝酒去旧站 WinePoetry 第 ${number} 条`,
        publisher: '喝酒去旧站（zh/index.json WinePoetry）',
        note: '旧站摘句；全文、异文、作者与出处待核。',
      },
    ],
    rights: rightsUnverified(),
  };
  if (author) front.author_name = author;
  if (work) front.source_title = work;
  const relative = relativeFor('poem', slug);
  writeFile(relative, frontmatterFile(front, body), generated);
  addInfo(id, 'poem', slug);
  recordFieldMap(ledgerRow.legacyKey, poem, [id], ledgerRow.sourceFile, ledgerRow.sourceIndex, ledgerRow.sourceRecordSha256, {
    verse: 'summary + body:quote',
    source: 'author_name/source_title/body',
    index: 'legacy_refs + slug',
  });
  return id;
}

for (const ledgerRow of ledger.records) {
  const sample = SAMPLE_TARGETS.get(ledgerRow.legacyKey);
  if (sample) {
    targetByLegacyKey.set(ledgerRow.legacyKey, sample);
    const sourceRow = readSource(ledgerRow.sourceFile, ledgerRow.sourceIndex);
    recordFieldMap(
      ledgerRow.legacyKey,
      sourceRow,
      sample.targetRefs,
      ledgerRow.sourceFile,
      ledgerRow.sourceIndex,
      ledgerRow.sourceRecordSha256,
      ledgerRow.legacyKey.startsWith('poetry:')
        ? { verse: 'sample poem body', source: 'sample poem author/source', index: 'merged to sample poem' }
        : ledgerRow.legacyKey.startsWith('pub:')
          ? { note: 'sample place mapping; see source sample page' }
          : { note: 'sample split mapping; brand and product sample pages' },
    );
    continue;
  }
  const sourceRow = readSource(ledgerRow.sourceFile, ledgerRow.sourceIndex);
  let id = null;
  if (ledgerRow.legacyKey.startsWith('liquor:')) id = generateDrink(ledgerRow, sourceRow);
  else if (ledgerRow.legacyKey.startsWith('pub:')) id = generatePlace(ledgerRow, sourceRow);
  else if (ledgerRow.legacyKey.startsWith('poetry:')) {
    const index = Number(ledgerRow.legacyKey.split(':')[1]) - 1;
    const poem = core.WinePoetry[index];
    id = generatePoem(ledgerRow, poem, index);
  } else {
    conflicts.push({ legacyKey: ledgerRow.legacyKey, reason: 'Unknown legacy family' });
  }
  if (id) {
    targetByLegacyKey.set(ledgerRow.legacyKey, {
      status: 'migrated-needs-review',
      targetRefs: [id],
      reason: '批量迁为 needs-review：原正文与字段已保留，分类、来源、权利与翻译待审。',
    });
  }
}

const entityMap = {
  schemaVersion: 1,
  date: '2026-10-29',
  sourceSnapshotSha256: ledger.sourceSnapshotSha256,
  status: 'G4 bulk import complete as needs-review; review and translation still pending',
  records: ledger.records.map((row) => {
    const mapped = targetByLegacyKey.get(row.legacyKey);
    return {
      legacyKey: row.legacyKey,
      sourceFile: row.sourceFile,
      sourceIndex: row.sourceIndex,
      title: row.title,
      expectedContentRepository: row.expectedContentRepository,
      status: mapped?.status ?? 'pending-classification',
      targetRefs: mapped?.targetRefs ?? [],
      reason: mapped?.reason ?? null,
    };
  }),
};

const statusCounts = {};
for (const row of entityMap.records) statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
const typeCounts = { drink: 0, place: 0, poem: 0, 'drink-style': createdStyles.length };
for (const entry of generatedIds.values()) typeCounts[entry.type] = (typeCounts[entry.type] ?? 0) + 1;
typeCounts['drink-style'] = createdStyles.length;
const report = {
  schemaVersion: 1,
  date: '2026-10-29',
  sourceSnapshotSha256: ledger.sourceSnapshotSha256,
  mode: DRY_RUN ? 'dry-run' : 'write',
  counts: {
    ledgerRows: ledger.records.length,
    mappedRows: entityMap.records.filter((row) => row.targetRefs.length > 0).length,
    pendingRows: entityMap.records.filter((row) => row.status === 'pending-classification').length,
    statuses: statusCounts,
    generatedContentFiles: generated.length,
    generatedByType: typeCounts,
    createdStyles: createdStyles.length,
  },
  reviewState: {
    newRecordsStatus: 'needs-review',
    newRecordsRights: 'unverified',
    newRecordsLanguage: 'zh only; nameEn preserved as alias, not translation',
    reviewedNewRecords: 0,
  },
  conflicts,
};
if (!DRY_RUN) {
  writeJson('migration/entity-map.json', entityMap);
  writeJson('migration/legacy-field-map.json', { schemaVersion: 1, records: fieldMap });
  writeJson('migration/report.json', report);
  writeJson('migration/generated-files.json', generated.sort());
  // Preserve source metadata as a separate migration input.
  const metadataDir = path.join(MIGRATION, 'metadata');
  fs.mkdirSync(metadataDir, { recursive: true });
  const metadataFiles = [
    ['categories.json', core.CategoryMeta],
    ['tag-definitions.json', { TagDefinitions: core.TagDefinitions, TagCategories: core.TagCategories }],
    ['city-names.json', core.CityNameMap],
    ['countries.json', countries],
    ['continents.json', continents],
    ['china-index.json', chinaIndex],
  ];
  const manifest = [];
  for (const [name, value] of metadataFiles) {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    fs.writeFileSync(path.join(metadataDir, name), content);
    manifest.push({ file: name, sha256: hash(content), bytes: Buffer.byteLength(content) });
  }
  writeJson('migration/metadata/manifest.json', {
    schemaVersion: 1,
    source: 'zh/index.json, zh/world/countries.json, zh/world/continents.json, zh/china/china_index.json',
    files: manifest,
  });
  // Legacy route map: one primary detail route per ledger row plus functional branches.
  const routes = [];
  for (const row of ledger.records) {
    const mapped = targetByLegacyKey.get(row.legacyKey);
    if (!mapped) continue;
    const targets = mapped.targetRefs.map((id) => {
      const info = existing.get(id);
      if (!info) return { id, url: null };
      const typePath = {
        drink: 'drinks',
        'drink-style': 'styles',
        place: 'places',
        poem: 'poetry',
        brand: 'brands',
      }[info.type];
      const host = { place: 'atlas.hejiu.org', poem: 'culture.hejiu.org' }[info.type] ?? 'hejiu.org';
      return { id, type: info.type, url: `https://${host}/${typePath}/${info.slug}/`, status: 'needs-review-preview' };
    });
    const query = row.legacyKey.startsWith('liquor:')
      ? `?page=liquor&id=${encodeURIComponent(sourceId(row.legacyKey))}`
      : row.legacyKey.startsWith('pub:')
        ? `?page=pub&id=${encodeURIComponent(sourceId(row.legacyKey))}`
        : null;
    routes.push({
      legacyKey: row.legacyKey,
      legacyQuery: query,
      legacyHashQuery: query ? `#${query}` : null,
      oldSurface: query ? 'query' : 'home-poetry-widget',
      targets,
      primaryTarget: targets[0] ?? null,
      status: mapped.status,
    });
  }
  const styleUrl = (categoryId) =>
    `https://hejiu.org/styles/${styleIds.get(categoryId)?.split(':')[1] ?? slugify(categoryId)}/`;
  const categoryRoutes = categories.map((category) => ({
    legacyQuery: `?page=category&id=${encodeURIComponent(category.id)}`,
    target: styleUrl(category.id),
    status: 'needs-review-preview',
  }));
  const subcategoryRoutes = [...subcategories.entries()].map(([key, sub]) => {
    const [category] = key.split('/');
    const target =
      category === 'baijiu' && sub.id === 'strong_aroma'
        ? 'https://hejiu.org/styles/strong-aroma-baijiu/'
        : styleUrl(category);
    return {
      legacyQuery: `?page=subcategory&category=${encodeURIComponent(category)}&id=${encodeURIComponent(sub.id)}`,
      target,
      status: 'fallback-category-style',
    };
  });
  const provinceRoutes = chinaIndex.flatMap((province) => {
    const target = province.id === 'anhui' ? 'https://hejiu.org/regions/anhui/' : 'https://hejiu.org/regions/';
    return [
      { legacyQuery: `?page=china&id=${encodeURIComponent(province.id)}`, target, status: province.id === 'anhui' ? 'mapped' : 'fallback-region-index' },
      { legacyQuery: `?page=province&id=${encodeURIComponent(province.id)}`, target, status: province.id === 'anhui' ? 'mapped' : 'fallback-region-index' },
    ];
  });
  const chinaCityRoutes = (() => {
    const seen = new Set();
    const result = [];
    for (const row of ledger.records.filter((entry) => entry.legacyKey.startsWith('liquor:'))) {
      const source = readSource(row.sourceFile, row.sourceIndex);
      if (!source.district) continue;
      const key = `${source.region ?? ''}/${source.district}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const target = String(source.district).includes('亳州')
        ? 'https://hejiu.org/regions/bozhou/'
        : 'https://hejiu.org/regions/';
      result.push({
        legacyQuery: `?page=city&id=${encodeURIComponent(source.district)}&parent=${encodeURIComponent(source.region ?? '')}`,
        target,
        status: target.includes('/bozhou/') ? 'mapped' : 'fallback-region-index',
      });
    }
    return result;
  })();
  const countryRoutes = countries.map((country) => ({
    legacyQuery: `?page=country&id=${encodeURIComponent(country.id)}`,
    target: country.id === 'china' ? 'https://hejiu.org/regions/china/' : 'https://hejiu.org/regions/',
    status: country.id === 'china' ? 'mapped' : 'fallback-region-index',
  }));
  const continentRoutes = continents.map((continent) => ({
    legacyQuery: `?page=continent&id=${encodeURIComponent(continent.id)}`,
    target: 'https://hejiu.org/regions/',
    status: 'fallback-region-index',
  }));
  const pubRows = ledger.records
    .filter((entry) => entry.legacyKey.startsWith('pub:'))
    .map((entry) => readSource(entry.sourceFile, entry.sourceIndex));
  const pubCountryRoutes = [...new Set(pubRows.map((row) => row.country).filter(Boolean))].map((country) => ({
    legacyQuery: `?page=pub&country=${encodeURIComponent(country)}`,
    target: 'https://atlas.hejiu.org/places/',
    status: 'fallback-filter-pending',
  }));
  const pubCityRoutes = (() => {
    const seen = new Set();
    const result = [];
    for (const row of pubRows) {
      if (!row.country || !row.city) continue;
      const key = `${row.country}/${row.city}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        legacyQuery: `?page=pub&country=${encodeURIComponent(row.country)}&city=${encodeURIComponent(row.city)}`,
        target: 'https://atlas.hejiu.org/places/',
        status: 'fallback-filter-pending',
      });
    }
    return result;
  })();
  const pubContinentRoutes = continents.map((continent) => ({
    legacyQuery: `?page=pub&continent=${encodeURIComponent(continent.id)}`,
    target: 'https://atlas.hejiu.org/places/',
    status: 'fallback-filter-pending',
  }));
  const tagRoutes = Object.entries(core.TagDefinitions ?? {}).map(([key, name]) => ({
    legacyQuery: `?page=tag&id=${encodeURIComponent(key)}`,
    target: `https://hejiu.org/search/?q=${encodeURIComponent(String(name))}`,
    status: 'fallback-search',
  }));
  writeJson('migration/legacy-routes.json', {
    schemaVersion: 1,
    date: '2026-10-29',
    note: 'Descriptive mapping only; compatibility script and redirects are G5/G6 work. Old hash form #? is equivalent to the query form.',
    coverage: {
      detailRows: routes.length,
      detailRowsWithTargets: routes.filter((route) => route.primaryTarget).length,
      functionalBranches: 7,
      categories: categoryRoutes.length,
      subcategories: subcategoryRoutes.length,
      provinces: provinceRoutes.length,
      chinaCities: chinaCityRoutes.length,
      countries: countryRoutes.length,
      continents: continentRoutes.length,
      pubCountries: pubCountryRoutes.length,
      pubCities: pubCityRoutes.length,
      tags: tagRoutes.length,
    },
    records: routes,
    functional: [
      { legacyQuery: '?page=home', target: 'https://hejiu.org/', status: 'functional' },
      { legacyQuery: '?page=china', target: 'https://hejiu.org/regions/', status: 'fallback' },
      { legacyQuery: '?page=world', target: 'https://hejiu.org/regions/', status: 'fallback' },
      { legacyQuery: '?page=categories', target: 'https://hejiu.org/styles/', status: 'functional' },
      { legacyQuery: '?page=pub', target: 'https://atlas.hejiu.org/places/', status: 'fallback' },
      { legacyQuery: '?page=tags', target: 'https://hejiu.org/search/', status: 'fallback' },
      { legacyQuery: '?page=search&q=...', target: 'https://hejiu.org/search/?q=...', status: 'functional' },
    ],
    categoryRoutes,
    subcategoryRoutes,
    provinceRoutes,
    chinaCityRoutes,
    countryRoutes,
    continentRoutes,
    pubCountryRoutes,
    pubCityRoutes,
    pubContinentRoutes,
    tagRoutes,
  });
  // Controlled legacy subcategory map.
  const lines = [
    '# 旧站子分类映射',
    '',
    '本表覆盖旧站 17 个分类下的 93 个子分类，只建立迁移映射与样式目标，不表示已经审核。',
    '',
    '| 分类/子分类 | 中文 | English | 迁移样式目标 | 状态 |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const category of categories) {
    for (const sub of category.subcategories ?? []) {
      const styleId =
        category.id === 'baijiu' && sub.id === 'strong_aroma'
          ? 'drink-style:strong-aroma-baijiu'
          : styleIds.get(category.id) ?? `drink-style:${slugify(category.id)}`;
      lines.push(`| \`${category.id}/${sub.id}\` | ${sub.name} | ${sub.nameEn} | \`${styleId}\` | pending-review |`);
    }
  }
  lines.push('', '`pending-review` 表示子分类的含义与维度仍需 G4 逐条确认；当前仅用于把旧记录连接到类别样式，不把旧子分类自动当作新受控词。');
  writeFile(
    'content-repositories/alcoholic-beverages/shared/taxonomy/legacy-subcategories.md',
    `${lines.join('\n')}\n`,
    generated,
  );
  writeJson('migration/generated-files.json', generated.sort());
}

function sourceId(legacyKey) {
  return legacyKey.slice(legacyKey.indexOf(':') + 1);
}

console.log(
  JSON.stringify(
    {
      mode: DRY_RUN ? 'dry-run' : 'write',
      counts: report.counts,
      conflicts: conflicts.length,
      generatedFiles: generated.length,
    },
    null,
    2,
  ),
);
if (conflicts.length > 0) {
  console.error(JSON.stringify(conflicts.slice(0, 20), null, 2));
  process.exitCode = 1;
}
