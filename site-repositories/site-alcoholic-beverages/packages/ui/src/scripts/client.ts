type Labels = Record<string, string>;
type PagefindModule = {
  init?: () => Promise<void>;
  search: (query: string, options?: Record<string, unknown>) => Promise<{
    results: Array<{ data: () => Promise<SearchResultData> }>;
  }>;
};
type SearchResultData = {
  url: string;
  excerpt: string;
  content?: string;
  raw_content?: string;
  meta?: Record<string, string>;
  filters?: Record<string, string[]>;
  language?: string;
};

const body = document.body;
const labels: Labels = (() => {
  try {
    return JSON.parse(body.dataset.labels || '{}') as Labels;
  } catch {
    return {};
  }
})();

function label(key: string, fallback: string): string {
  return labels[key] || fallback;
}

/* ---------- theme ---------- */
const THEME_KEY = 'hejiu:theme';
const THEME_COOKIE = 'hejiu_theme';
const LANG_COOKIE = 'hejiu_lang';
const sharedPreferenceHost = (() => {
  const host = window.location.hostname;
  return host === 'hejiu.org' || host.endsWith('.hejiu.org');
})();

function writePreferenceCookie(name: string, value: string): void {
  if (!sharedPreferenceHost) return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Domain=.hejiu.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}
const themeButton = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const themeLabel = (choice: string): string => {
  if (choice === 'light') return label('themeLight', '浅色');
  if (choice === 'dark') return label('themeDark', '深色');
  return label('themeSystem', '跟随系统');
};
const media = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(choice: string, persist = true): void {
  const normalized = choice === 'light' || choice === 'dark' ? choice : 'system';
  const resolved = normalized === 'system' ? (media.matches ? 'dark' : 'light') : normalized;
  document.documentElement.dataset.themeChoice = normalized;
  document.documentElement.dataset.theme = resolved;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, normalized);
    } catch {
      /* storage may be blocked */
    }
    writePreferenceCookie(THEME_COOKIE, normalized);
  }
  if (themeButton) {
    const text = themeLabel(normalized);
    themeButton.setAttribute('aria-label', `外观：${text}`);
    themeButton.setAttribute('title', text);
  }
}

if (themeButton) {
  const initial = document.documentElement.dataset.themeChoice || 'system';
  applyTheme(initial, false);
  themeButton.addEventListener('click', () => {
    const current = document.documentElement.dataset.themeChoice || 'system';
    const order = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(current) + 1) % order.length] || 'system';
    applyTheme(next);
  });
}
media.addEventListener('change', () => {
  if ((document.documentElement.dataset.themeChoice || 'system') === 'system') {
    applyTheme('system', false);
  }
});

/* ---------- mobile menu ---------- */
const menu = document.querySelector<HTMLDetailsElement>('.mobile-menu');
if (menu) {
  document.addEventListener('click', (event) => {
    if (!menu.open) return;
    if (event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) menu.open = false;
  });
}

/* ---------- search ---------- */
const pagefindCache = new Map<string, Promise<PagefindModule>>();

async function loadPagefind(bundle: string): Promise<PagefindModule> {
  let cached = pagefindCache.get(bundle);
  if (!cached) {
    cached = import(/* @vite-ignore */ bundle).then(async (module: unknown) => {
      const pf = module as PagefindModule;
      if (typeof pf.init === 'function') await pf.init();
      return pf;
    });
    pagefindCache.set(bundle, cached);
  }
  return cached;
}

function searchRoots(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-search-root]'));
}

function selectedFilters(root: HTMLElement): {
  filters: Record<string, string | string[]>;
  siteValues: string[];
  langValues: string[];
} {
  const filters: Record<string, string | string[]> = {};
  const groups = root.querySelectorAll<HTMLElement>('[data-filter-group]');
  let siteValues: string[] = [];
  let langValues: string[] = [];
  for (const group of groups) {
    const name = group.dataset.filterGroup || '';
    const checked = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')).map(
      (input) => input.value,
    );
    if (checked.length === 0) continue;
    if (name === 'site') siteValues = checked;
    if (name === 'lang') langValues = checked;
    filters[name] = checked.length === 1 ? checked[0]! : checked;
  }
  return { filters, siteValues, langValues };
}

function makeResult(data: SearchResultData): HTMLElement {
  const link = document.createElement('a');
  link.className = 'search-result';
  link.href = data.url;
  const meta = document.createElement('span');
  meta.className = 'search-result__meta';
  const metaParts = [
    data.meta?.siteLabel || data.meta?.site,
    data.meta?.typeLabel || data.meta?.type,
    data.meta?.verification === 'archive-record' ? label('archiveRecordShort', '档案') : null,
    (data.meta?.lang || data.language || '').toUpperCase(),
  ].filter(Boolean);
  meta.textContent = metaParts.join(' · ');
  const title = document.createElement('span');
  title.className = 'search-result__title';
  title.textContent = data.meta?.title || data.url;
  const excerpt = document.createElement('span');
  excerpt.className = 'search-result__excerpt';
  excerpt.innerHTML = data.excerpt || '';
  link.append(meta, title, excerpt);
  return link;
}

function cjkBigrams(query: string): string[] {
  const chars = [...query].filter((char) => /[㐀-鿿]/.test(char));
  if (chars.length < 2) return [];
  const grams = new Set<string>();
  for (let index = 0; index < chars.length - 1; index += 1) {
    grams.add(`${chars[index]}${chars[index + 1]}`);
  }
  return [...grams].slice(0, 8);
}

type LocalSearchRecord = {
  url: string;
  title: string;
  summary: string;
  content: string;
  site: string;
  lang: string;
  type: string;
};

let cjkIndexPromise: Promise<LocalSearchRecord[]> | null = null;

function loadCjkIndex(root: HTMLElement): Promise<LocalSearchRecord[]> {
  if (!cjkIndexPromise) {
    const url = root.dataset.cjkIndex || '/search-index.json';
    cjkIndexPromise = fetch(url)
      .then((response) => (response.ok ? response.json() : { records: [] }))
      .then((data: { records?: LocalSearchRecord[] }) => data.records ?? [])
      .catch(() => []);
  }
  return cjkIndexPromise;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] ?? char;
  });
}

function cjkLocalResults(records: LocalSearchRecord[], query: string): SearchResultData[] {
  const needle = query.toLocaleLowerCase();
  const chars = [...query].filter((char) => /[㐀-鿿]/.test(char));
  const cjkOnly = chars.join('').toLocaleLowerCase();
  const scored = records
    .map((record) => {
      const title = record.title.toLocaleLowerCase();
      const content = record.content.toLocaleLowerCase();
      const summary = record.summary.toLocaleLowerCase();
      const haystack = `${title} ${summary} ${content}`;
      const direct = haystack.includes(needle) || (cjkOnly && haystack.includes(cjkOnly));
      if (!direct) return null;
      const titleExact = title.includes(needle) || (cjkOnly && title.includes(cjkOnly)) ? 1 : 0;
      const titleHits = chars.filter((char) => title.includes(char)).length;
      return {
        record,
        score: titleExact * 10000 + titleHits * 100 + chars.filter((char) => content.includes(char)).length,
      };
    })
    .filter((entry): entry is { record: LocalSearchRecord; score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  return scored.map(({ record }) => ({
    url: record.url,
    excerpt: escapeHtml((record.summary || record.content).slice(0, 160)),
    content: record.content,
    meta: {
      title: record.title,
      site: record.site,
      lang: record.lang,
      type: record.type,
    },
    language: record.lang,
  }));
}

async function fetchSearchData(
  pf: PagefindModule,
  query: string,
  filters: Record<string, string | string[]>,
): Promise<SearchResultData[]> {
  const hasFilters = Object.keys(filters).length > 0;
  let response;
  try {
    response = await pf.search(query, hasFilters ? { filters } : undefined);
  } catch {
    response = await pf.search(query);
  }
  return Promise.all(response.results.slice(0, 40).map((result) => result.data()));
}

async function runSearch(root: HTMLElement, query: string): Promise<void> {
  const results = root.querySelector<HTMLElement>('[data-search-results]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  if (!results || !status) return;
  const trimmed = query.trim();
  if (!trimmed) {
    results.replaceChildren();
    status.textContent = '';
    return;
  }
  const bundle = root.dataset.bundle || '/pagefind/pagefind.js';
  status.textContent = label('searchLoading', '正在准备搜索索引…');
  results.replaceChildren();
  try {
    const pf = await loadPagefind(bundle);
    const { filters, siteValues, langValues } = selectedFilters(root);
    const chars = [...trimmed].filter((char) => /[㐀-鿿]/.test(char));
    let data: SearchResultData[];
    if (chars.length >= 2) {
      data = cjkLocalResults(await loadCjkIndex(root), trimmed);
      if (data.length === 0) {
        const grams = cjkBigrams(trimmed);
        const groups = await Promise.all(grams.map((gram) => fetchSearchData(pf, gram, filters)));
        const merged = new Map<string, SearchResultData>();
        for (const group of groups) {
          for (const entry of group) if (!merged.has(entry.url)) merged.set(entry.url, entry);
        }
        const minimum = Math.max(2, Math.ceil(chars.length * 0.6));
        data = [...merged.values()]
          .map((entry) => {
            const raw = entry.raw_content || entry.content || '';
            const title = entry.meta?.title || '';
            const rawHits = chars.filter((char) => raw.includes(char)).length;
            const titleHits = chars.filter((char) => title.includes(char)).length;
            const exactTitle = title.includes(trimmed) ? 1 : 0;
            return { entry, rawHits, score: exactTitle * 10000 + titleHits * 100 + rawHits };
          })
          .filter((item) => item.rawHits >= minimum)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.entry);
      }
    } else {
      data = await fetchSearchData(pf, trimmed, filters);
    }
    const filtered = data.filter((entry) => {
      if (siteValues.length > 0) {
        const site = entry.meta?.site || '';
        if (!siteValues.includes(site)) return false;
      }
      if (langValues.length > 0) {
        const lang = entry.meta?.lang || entry.language || '';
        if (!langValues.includes(lang)) return false;
      }
      return true;
    });
    const shown = filtered.slice(0, 20);
    status.textContent = shown.length
      ? `${shown.length} ${label('resultsCount', '条结果')}`
      : label('searchEmpty', '没有找到匹配内容。');
    for (const entry of shown) results.append(makeResult(entry));
  } catch (error) {
    console.error(error);
    status.textContent = label('searchError', '搜索索引暂时不可用。');
  }
}

function bindSearchForm(root: HTMLElement, onSearch?: (query: string) => void): void {
  const form = root.querySelector<HTMLFormElement>('[data-search-form]');
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  if (!form || !input) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value;
    root.dataset.lastQuery = query;
    if (onSearch) onSearch(query);
    else void runSearch(root, query);
  });
  input.addEventListener('search', () => {
    if (!input.value.trim()) void runSearch(root, '');
  });
}

const dialog = document.querySelector<HTMLDialogElement>('#hejiu-search-dialog');
const searchPage = document.querySelector<HTMLElement>('[data-search-page]');
const searchButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-open-search]'));

if (dialog) {
  bindSearchForm(dialog);
  const close = (): void => {
    dialog.close();
  };
  dialog.querySelector('[data-close-search]')?.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  searchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      const input = dialog.querySelector<HTMLInputElement>('[data-search-input]');
      window.setTimeout(() => input?.focus(), 30);
    });
  });
  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement | null;
    const typing =
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (event.key === '/' && !typing && !dialog.open) {
      event.preventDefault();
      searchButtons[0]?.click();
    }
  });
}

if (searchPage) {
  const input = searchPage.querySelector<HTMLInputElement>('[data-search-input]');
  const initial = new URLSearchParams(window.location.search).get('q') || '';
  if (input && initial) {
    input.value = initial;
    void runSearch(searchPage, initial);
  }
  bindSearchForm(searchPage, (query) => {
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
    void runSearch(searchPage, query);
  });
  searchPage.querySelectorAll<HTMLInputElement>('[data-filter-group] input').forEach((inputEl) => {
    inputEl.addEventListener('change', () => {
      const query = searchPage.dataset.lastQuery || searchPage.querySelector<HTMLInputElement>('[data-search-input]')?.value || '';
      if (query.trim()) void runSearch(searchPage, query);
    });
  });
  searchPage.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
    searchPage.querySelectorAll<HTMLInputElement>('[data-filter-group] input').forEach((inputEl) => {
      inputEl.checked = false;
    });
    const query = searchPage.querySelector<HTMLInputElement>('[data-search-input]')?.value || '';
    if (query.trim()) void runSearch(searchPage, query);
  });
}

/* ---------- saved ---------- */
const SAVED_KEY = 'hejiu:saved:v1';
type SavedEntry = { id: string; title: string; site?: string; type?: string; savedAt: string };

function readSaved(): SavedEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is SavedEntry =>
          Boolean(entry && typeof entry === 'object' && 'id' in entry && 'title' in entry),
      )
      .map((entry) => ({
        id: String(entry.id),
        title: String(entry.title),
        site: entry.site ? String(entry.site) : undefined,
        type: entry.type ? String(entry.type) : undefined,
        savedAt: entry.savedAt ? String(entry.savedAt) : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function writeSaved(entries: SavedEntry[]): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(entries));
  } catch {
    /* storage may be blocked */
  }
}

function toggleSaved(entry: SavedEntry): boolean {
  const entries = readSaved();
  const index = entries.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    entries.splice(index, 1);
    writeSaved(entries);
    return false;
  }
  entries.unshift(entry);
  writeSaved(entries);
  return true;
}

document.querySelectorAll<HTMLElement>('[data-save-toggle]').forEach((button) => {
  const id = button.dataset.saveToggle || '';
  const entry: SavedEntry = {
    id,
    title: button.dataset.saveTitle || id,
    site: button.dataset.saveSite,
    type: button.dataset.saveType,
    savedAt: new Date().toISOString(),
  };
  const setState = (saved: boolean): void => {
    button.setAttribute('aria-pressed', saved ? 'true' : 'false');
    const span = button.querySelector<HTMLElement>('[data-save-label]');
    if (span) span.textContent = saved ? label('saved', '已收藏') : label('save', '收藏');
    button.classList.toggle('is-saved', saved);
  };
  setState(readSaved().some((item) => item.id === id));
  button.addEventListener('click', () => {
    const saved = toggleSaved({ ...entry, savedAt: new Date().toISOString() });
    setState(saved);
  });
});

const savedPage = document.querySelector<HTMLElement>('[data-saved-page]');
if (savedPage) {
  const registryScript = document.querySelector<HTMLScriptElement>('#hejiu-saved-registry');
  let registry: Array<{
    id: string;
    title: string;
    site?: string;
    type?: string;
    path?: string;
    published?: boolean;
  }> = [];
  try {
    registry = JSON.parse(registryScript?.textContent || '[]');
  } catch {
    registry = [];
  }
  const byId = new Map(registry.map((entry) => [entry.id, entry]));
  const list = savedPage.querySelector<HTMLElement>('[data-saved-list]');
  const status = savedPage.querySelector<HTMLElement>('[data-saved-status]');
  const confirm = savedPage.querySelector<HTMLElement>('[data-saved-confirm]');

  const render = (): void => {
    if (!list) return;
    const entries = readSaved();
    list.replaceChildren();
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = label('savedEmpty', '还没有收藏。');
      list.append(empty);
      return;
    }
    for (const entry of entries) {
      const known = byId.get(entry.id);
      const item = document.createElement('article');
      item.className = 'saved-item';
      const main = document.createElement('div');
      const title = document.createElement('h3');
      if (known) {
        const link = document.createElement('a');
        link.href = known.path || '#';
        link.textContent = known.title;
        title.append(link);
      } else {
        title.textContent = entry.title || entry.id;
      }
      const meta = document.createElement('p');
      meta.className = 'saved-item__meta';
      meta.textContent = known
        ? `${known.site || ''} · ${known.type || ''} · ${entry.savedAt.slice(0, 10)}`
        : label('savedUnknown', '这个 ID 不存在或尚未发布，无法收藏。');
      main.append(title, meta);
      const remove = document.createElement('button');
      remove.className = 'button button--ghost';
      remove.type = 'button';
      remove.textContent = label('remove', '移除');
      remove.addEventListener('click', () => {
        writeSaved(readSaved().filter((item) => item.id !== entry.id));
        render();
      });
      item.append(main, remove);
      list.append(item);
    }
  };

  const addFromQuery = (): void => {
    const id = new URLSearchParams(window.location.search).get('add');
    if (!id || !confirm) return;
    const known = byId.get(id);
    confirm.replaceChildren();
    const card = document.createElement('div');
    card.className = 'confirm-card';
    const title = document.createElement('h2');
    title.textContent = label('savedAddTitle', '确认收藏');
    const desc = document.createElement('p');
    desc.textContent = known ? known.title : label('savedUnknown', '这个 ID 不存在或尚未发布，无法收藏。');
    card.append(title, desc);
    if (known) {
      const actions = document.createElement('div');
      actions.className = 'saved-actions';
      const add = document.createElement('button');
      add.className = 'button button--primary';
      add.type = 'button';
      add.textContent = label('savedAddConfirm', '确认收藏');
      add.addEventListener('click', () => {
        toggleSaved({
          id: known.id,
          title: known.title,
          site: known.site,
          type: known.type,
          savedAt: new Date().toISOString(),
        });
        const url = new URL(window.location.href);
        url.searchParams.delete('add');
        window.history.replaceState({}, '', url);
        confirm.replaceChildren();
        render();
      });
      const cancel = document.createElement('button');
      cancel.className = 'button button--ghost';
      cancel.type = 'button';
      cancel.textContent = label('cancel', '取消');
      cancel.addEventListener('click', () => confirm.replaceChildren());
      actions.append(add, cancel);
      card.append(actions);
    }
    confirm.append(card);
    confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  savedPage.querySelector('[data-saved-import-trigger]')?.addEventListener('click', () => {
    savedPage.querySelector<HTMLInputElement>('[data-saved-import]')?.click();
  });

  savedPage.querySelector('[data-saved-export]')?.addEventListener('click', () => {
    const payload = readSaved().map(({ id, title, savedAt }) => ({ id, title, savedAt }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hejiu-saved.json';
    anchor.click();
    URL.revokeObjectURL(url);
  });

  savedPage.querySelector<HTMLInputElement>('[data-saved-import]')?.addEventListener('change', async (event) => {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text()) as SavedEntry[];
      if (!Array.isArray(imported)) throw new Error('invalid file');
      const current = readSaved();
      const ids = new Set(current.map((entry) => entry.id));
      for (const entry of imported) {
        if (!entry || typeof entry.id !== 'string' || typeof entry.title !== 'string') continue;
        if (ids.has(entry.id)) continue;
        current.push({
          id: entry.id,
          title: entry.title,
          site: entry.site,
          type: entry.type,
          savedAt: entry.savedAt || new Date().toISOString(),
        });
        ids.add(entry.id);
      }
      writeSaved(current);
      if (status) status.textContent = label('savedImported', '已导入');
      render();
    } catch {
      if (status) status.textContent = label('savedUnknown', '导入文件无法读取。');
    } finally {
      inputEl.value = '';
    }
  });

  render();
  addFromQuery();
}

document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = new URL(link.href, window.location.href);
    const lang = target.pathname.startsWith('/en/') || target.pathname === '/en' ? 'en' : 'zh';
    try {
      localStorage.setItem('hejiu:lang', lang);
    } catch {
      /* storage may be blocked */
    }
    writePreferenceCookie(LANG_COOKIE, lang);
  });
});

document.documentElement.dataset.clientReady = 'true';
