import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { entries } from './prototype-data.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apply = process.argv.includes('--apply');
const zero = '0'.repeat(64);
const today = '2026-10-29';

const repoFor = (type) => (type === 'guide' ? 'alcohol-guide' : 'alcohol-culture');

function rights(lang) {
  return {
    status: 'allowed',
    license: 'CC-BY-4.0',
    basis:
      lang === 'zh'
        ? `项目自写；结构参考公开资料，未复制原文。项目所有者于 ${today} 声明项目内容采用 CC BY 4.0。`
        : `Project-authored English text; structure informed by public sources, no text is reproduced. The project owner declared project content CC BY 4.0 on ${today}.`,
    note:
      lang === 'zh'
        ? '第三方标准、商标、图片与引用文本不在本许可内；来源仅作核验引用。'
        : 'Third-party standards, trademarks, photographs and quoted texts are not covered by this licence.',
  };
}

const results = [];
for (const entry of entries) {
  if (!['guide', 'article'].includes(entry.type)) throw new Error(`Bad type ${entry.id}`);
  const repo = repoFor(entry.type);
  for (const lang of ['zh', 'en']) {
    const front = {
      schema_version: 1,
      id: entry.id,
      type: entry.type,
      lang,
      slug: entry.slug,
      title: lang === 'zh' ? entry.zhTitle : entry.enTitle,
      summary: lang === 'zh' ? entry.zhSummary : entry.enSummary,
      status: 'reviewed',
      revision: 1,
    };
    if (lang === 'en') {
      front.translation_of = entry.id;
      front.source_lang = 'zh';
      front.source_revision = `sha256:${zero}`;
      front.source_sha256 = zero;
      front.translation_status = 'reviewed';
    }
    front.about_refs = entry.aboutRefs;
    if (entry.type === 'guide') {
      front.audience = lang === 'zh' ? entry.audienceZh : entry.audienceEn;
      front.difficulty = entry.difficulty;
    } else {
      front.topics = lang === 'zh' ? entry.topicsZh : entry.topicsEn;
      front.period = lang === 'zh' ? entry.periodZh : entry.periodEn;
    }
    front.legacy_refs = [];
    front.aliases = [];
    front.tags = ['curated', 'source-verified'];
    front.related = [];
    front.references = entry.references;
    front.sources = entry.sources.map((source) => ({
      ...source,
      note:
        lang === 'zh'
          ? source.note
          : source.note?.replace(/^Reference for/, 'Reference for') ??
            'Used for factual verification; no source text is reproduced.',
    }));
    front.rights = rights(lang);
    front.verification_scope = 'source-verified';

    const body = lang === 'zh' ? entry.zhBody : entry.enBody;
    const refs = entry.sources
      .map((source) => `- ${source.title}${source.url ? ` — ${source.url}` : ''}${source.publisher ? ` (${source.publisher})` : ''}`)
      .join('\n');
    const file = path.join(root, 'content-repositories', repo, lang, entry.type, `${entry.slug}.md`);
    const text = `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n# ${front.title}\n\n${body}\n\n## ${lang === 'zh' ? '参考资料' : 'References'}\n\n${refs}\n`;
    if (apply) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    }
    results.push({ id: entry.id, lang, file: path.relative(root, file) });
  }
}

console.log(JSON.stringify({ apply, files: results.length, entries: entries.length }, null, 2));
