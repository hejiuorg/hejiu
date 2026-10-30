import MarkdownIt, { type MarkdownIt as MarkdownItType, type Token } from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import type { Heading } from './types.js';

export interface RenderResult {
  html: string;
  headings: Heading[];
  unresolvedRefs: string[];
}

function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

function makeMarkdown(): MarkdownItType {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    breaks: false,
  });
  md.use(markdownItAnchor, {
    level: [1, 2, 3],
    slugify: slugifyHeading,
    uniqueSlugStartIndex: 2,
  });
  return md;
}

function processRefTokens(
  tokens: Token[],
  resolveRef: (key: string) => string | null,
  unresolved: string[],
): void {
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    if (token.children && token.children.length > 0) {
      processRefTokens(token.children, resolveRef, unresolved);
    }
    if (token.type !== 'link_open') continue;
    const href = token.attrGet('href');
    if (typeof href !== 'string' || !href.startsWith('ref:')) continue;
    const key = href.slice(4);
    const url = resolveRef(key);
    if (!url) {
      unresolved.push(key);
      token.type = 'text';
      token.tag = '';
      token.nesting = 0;
      token.content = '';
      token.attrs = null;
      for (let closeIndex = index + 1; closeIndex < tokens.length; closeIndex += 1) {
        const close = tokens[closeIndex];
        if (close && close.type === 'link_close') {
          close.type = 'text';
          close.tag = '';
          close.nesting = 0;
          close.content = '';
          close.attrs = null;
          break;
        }
      }
      continue;
    }
    token.attrSet('href', url);
    token.attrSet('data-entity-ref', key);
    token.attrJoin('class', 'entity-link');
  }
}

function stripLeadingH1(tokens: Token[]): void {
  const first = tokens[0];
  if (!first || first.type !== 'heading_open' || first.tag !== 'h1') return;
  let index = 1;
  while (index < tokens.length && tokens[index]?.type !== 'heading_close') index += 1;
  if (index < tokens.length) tokens.splice(0, index + 1);
}

function stripTrailingReferences(tokens: Token[]): void {
  let referenceIndex = -1;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token || token.type !== 'heading_open' || token.tag !== 'h2') continue;
    const next = tokens[index + 1];
    const text = next?.content?.trim() ?? '';
    if (/^(参考资料|参考文献|References)$/i.test(text)) referenceIndex = index;
  }
  if (referenceIndex === -1) return;
  const laterHeading = tokens
    .slice(referenceIndex + 1)
    .some((token) => token?.type === 'heading_open');
  if (!laterHeading) tokens.splice(referenceIndex);
}

function collectHeadings(tokens: Token[]): Heading[] {
  const headings: Heading[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token || token.type !== 'heading_open') continue;
    const next = tokens[index + 1];
    const id = token.attrGet('id');
    if (typeof id !== 'string' || !id || !next) continue;
    headings.push({
      depth: Number(token.tag.slice(1)),
      text: next.content.trim(),
      id,
    });
  }
  return headings;
}

export function renderMarkdown(
  body: string,
  resolveRef: (key: string) => string | null = () => null,
): RenderResult {
  const md = makeMarkdown();
  const tokens = md.parse(body, {});
  stripLeadingH1(tokens);
  stripTrailingReferences(tokens);
  const unresolvedRefs: string[] = [];
  processRefTokens(tokens, resolveRef, unresolvedRefs);
  const headings = collectHeadings(tokens);
  const html = md.renderer.render(tokens, md.options, {});
  return { html, headings, unresolvedRefs };
}

export function markdownToText(body: string): string {
  const md = makeMarkdown();
  const tokens = md.parse(body, {});
  const parts: string[] = [];
  for (const token of tokens) {
    if (
      token.type === 'inline' ||
      token.type === 'fence' ||
      token.type === 'code_block' ||
      token.type === 'html_block'
    ) {
      parts.push(token.content);
    }
  }
  return parts
    .join(' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function collectRefKeys(body: string): string[] {
  const keys = new Set<string>();
  for (const match of body.matchAll(/\]\(ref:([a-z0-9-]+)\)/g)) {
    if (match[1]) keys.add(match[1]);
  }
  return [...keys];
}
