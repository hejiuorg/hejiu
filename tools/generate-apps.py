import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = [
    {
        "key": "beverages",
        "app_package": "site-main",
        "repo": "site-alcoholic-beverages",
        "app": "apps/main",
        "host": "hejiu.org",
        "label_zh": "识酒",
        "label_en": "Drinks",
        "accent": "#c2410c",
        "content_repo": "alcoholic-beverages",
        "has_saved": True,
    },
    {
        "key": "guide",
        "app_package": "site-guide",
        "repo": "site-alcohol-guide",
        "app": "apps/site",
        "host": "guide.hejiu.org",
        "label_zh": "喝法",
        "label_en": "Ways to drink",
        "accent": "#0f766e",
        "content_repo": "alcohol-guide",
        "has_saved": False,
    },
    {
        "key": "culture",
        "app_package": "site-culture",
        "repo": "site-alcohol-culture",
        "app": "apps/site",
        "host": "culture.hejiu.org",
        "label_zh": "酒文化",
        "label_en": "Stories",
        "accent": "#7c3aed",
        "content_repo": "alcohol-culture",
        "has_saved": False,
    },
    {
        "key": "atlas",
        "app_package": "site-atlas",
        "repo": "site-alcohol-atlas",
        "app": "apps/site",
        "host": "atlas.hejiu.org",
        "label_zh": "去处",
        "label_en": "Places",
        "accent": "#2563eb",
        "content_repo": "alcohol-atlas",
        "has_saved": False,
    },
]

FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M7 20c0-7 6-13 13-13 4 0 7 1 10 4 3-3 6-4 10-4 7 0 13 6 13 13v4c4 2 7 6 7 11v3c0 6-4 10-10 11v5c0 5-4 8-8 8H19c-5 0-9-4-9-9V20Z" fill="#2b1a10"/>
  <path d="M12 23c0-5 4-9 9-9 3 0 6 1 8 4 2-3 5-4 8-4 5 0 9 4 9 9v3H12v-3Z" fill="#fff4d8"/>
  <path d="M12 27h34v18c0 4-3 7-7 7H19c-4 0-7-3-7-7V27Z" fill="#f5a623"/>
  <path d="M46 32h2c5 0 8 3 8 8s-3 8-8 8h-2" stroke="#2b1a10" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="24" cy="37" r="2.8" fill="#2b1a10"/>
  <circle cx="35" cy="37" r="2.8" fill="#2b1a10"/>
  <path d="M26 43c1.5 2 6 2 7.5 0" stroke="#2b1a10" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M17 30v10" stroke="#fff" stroke-opacity=".55" stroke-width="4.5" stroke-linecap="round"/>
</svg>
"""


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(content)


def package_json(site):
    return json.dumps(
        {
            "name": f"@hejiu/{site['app_package']}",
            "version": "0.1.0",
            "private": True,
            "type": "module",
            "scripts": {
                "dev": "astro dev",
                "build": "astro build",
                "preview": "astro preview",
                "check": "astro check",
            },
            "dependencies": {
                "@hejiu/build-tools": "0.1.0",
                "@hejiu/contracts": "0.1.0",
                "@hejiu/ui": "0.1.0",
                "astro": "7.4.4",
            },
            "devDependencies": {"typescript": "5.9.3"},
        },
        indent=2,
        ensure_ascii=False,
    ) + "\n"


ASTRO_CONFIG = """import {{ defineConfig }} from 'astro/config';
import {{ hejiu }} from '@hejiu/build-tools/astro';

export default defineConfig({{
  site: 'https://{host}',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: {{ format: 'directory' }},
  integrations: [hejiu({{ siteKey: '{key}' }})],
  devToolbar: {{ enabled: false }},
}});
"""

TSCONFIG = """{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
"""

ROBOTS = """User-agent: *
Allow: /

Disallow: /search/
Disallow: /en/search/
Sitemap: https://{host}/sitemap.xml
"""

MANIFEST = {
    "name": "喝酒去 · {label_zh}",
    "short_name": "喝酒去",
    "description": "{label_zh} · 喝酒去",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#fbf7f0",
    "theme_color": "{accent}",
    "lang": "zh",
    "icons": [{"src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml"}],
}

for site in SITES:
    app_dir = os.path.join(ROOT, "site-repositories", site["repo"], site["app"])
    pages = os.path.join(app_dir, "src", "pages")
    write(os.path.join(app_dir, "package.json"), package_json(site))
    write(
        os.path.join(app_dir, "astro.config.mjs"),
        ASTRO_CONFIG.format(host=site["host"], key=site["key"]),
    )
    write(os.path.join(app_dir, "tsconfig.json"), TSCONFIG)
    write(
        os.path.join(app_dir, "public", "robots.txt"),
        ROBOTS.format(host=site["host"]),
    )
    write(os.path.join(app_dir, "public", "favicon.svg"), FAVICON)
    manifest = {
        key: value.format(**site) if isinstance(value, str) else value
        for key, value in MANIFEST.items()
    }
    write(
        os.path.join(app_dir, "public", "site.webmanifest"),
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    )

    key = site["key"]
    write(
        os.path.join(pages, "index.astro"),
        f"""---
import HomePage from '@hejiu/ui/components/HomePage.astro';
---
<HomePage siteKey="{key}" lang="zh" />
""",
    )
    write(
        os.path.join(pages, "en", "index.astro"),
        f"""---
import HomePage from '@hejiu/ui/components/HomePage.astro';
---
<HomePage siteKey="{key}" lang="en" />
""",
    )
    for name, component in [
        ("about", "AboutPage"),
        ("contribute", "ContributePage"),
        ("search", "SearchPage"),
    ]:
        write(
            os.path.join(pages, f"{name}.astro"),
            f"""---
import {component} from '@hejiu/ui/components/{component}.astro';
---
<{component} siteKey="{key}" lang="zh" />
""",
        )
        write(
            os.path.join(pages, "en", f"{name}.astro"),
            f"""---
import {component} from '@hejiu/ui/components/{component}.astro';
---
<{component} siteKey="{key}" lang="en" />
""",
        )
    if site["has_saved"]:
        write(
            os.path.join(pages, "saved.astro"),
            f"""---
import SavedPage from '@hejiu/ui/components/SavedPage.astro';
---
<SavedPage siteKey="{key}" lang="zh" />
""",
        )
        write(
            os.path.join(pages, "en", "saved.astro"),
            f"""---
import SavedPage from '@hejiu/ui/components/SavedPage.astro';
---
<SavedPage siteKey="{key}" lang="en" />
""",
        )
    write(
        os.path.join(pages, "[typePath]", "index.astro"),
        f"""---
import ListPage from '@hejiu/ui/components/ListPage.astro';
import {{ getStaticListPaths }} from '@hejiu/build-tools';

export const getStaticPaths = () => getStaticListPaths('{key}', 'zh');
const {{ list }} = Astro.props;
---
<ListPage siteKey="{key}" list={{list}} />
""",
    )
    write(
        os.path.join(pages, "[typePath]", "[slug].astro"),
        f"""---
import DetailPage from '@hejiu/ui/components/DetailPage.astro';
import {{ getStaticDetailPaths }} from '@hejiu/build-tools';

export const getStaticPaths = () => getStaticDetailPaths('{key}', 'zh');
const {{ page }} = Astro.props;
---
<DetailPage page={{page}} />
""",
    )
    write(
        os.path.join(pages, "en", "[typePath]", "index.astro"),
        f"""---
import ListPage from '@hejiu/ui/components/ListPage.astro';
import {{ getStaticListPaths }} from '@hejiu/build-tools';

export const getStaticPaths = () => getStaticListPaths('{key}', 'en');
const {{ list }} = Astro.props;
---
<ListPage siteKey="{key}" list={{list}} />
""",
    )
    write(
        os.path.join(pages, "en", "[typePath]", "[slug].astro"),
        f"""---
import DetailPage from '@hejiu/ui/components/DetailPage.astro';
import {{ getStaticDetailPaths }} from '@hejiu/build-tools';

export const getStaticPaths = () => getStaticDetailPaths('{key}', 'en');
const {{ page }} = Astro.props;
---
<DetailPage page={{page}} />
""",
    )
    write(
        os.path.join(pages, "sitemap.xml.ts"),
        f"""import type {{ APIRoute }} from 'astro';
import {{ getSitemap }} from '@hejiu/build-tools';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(getSitemap('{key}'), {{
    headers: {{ 'Content-Type': 'application/xml; charset=utf-8' }},
  }});
""",
    )
    write(
        os.path.join(pages, "404.astro"),
        f"""---
import NotFoundPage from '@hejiu/ui/components/NotFoundPage.astro';
---
<NotFoundPage siteKey="{key}" lang="zh" />
""",
    )
print(f"Generated {len(SITES)} Astro apps.")
