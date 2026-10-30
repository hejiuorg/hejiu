# G2 四站贯通样本验收报告

日期：2026-10-29  
本地站点源码提交：`95392183f7853c365f6090ead1f932374698b230`  
范围：G0 基线、G1 共同契约、G2 四站贯通样本  
模式：本地 workspace + 本地构建；不是远程 Pages 发布或全量内容迁移

## 1. 可运行产物

四站生产构建输出（`npm run build:prod`）：

- 主站：`site-repositories/site-alcoholic-beverages/apps/main/dist/`
- 喝法：`site-repositories/site-alcohol-guide/apps/site/dist/`
- 酒文化：`site-repositories/site-alcohol-culture/apps/site/dist/`
- 去处：`site-repositories/site-alcohol-atlas/apps/site/dist/`

每站包含静态 HTML、`pagefind/`、`entity-registry.json`、`release-manifest.json`、`sitemap.xml`、`robots.txt`、`404.html`。主站另有 `all-search/` 总索引，只由四站已发布记录生成。

预览构建（`npm run build:preview`）额外输出 needs-review 的 noindex 页面，用于验证迁移预览和缺译状态；预览页面不进入 Pagefind 或总索引。

## 2. G2 验收项对应

| 验收要求 | 证据 |
| --- | --- |
| 四站样本提供独立 HTML 地址 | 四个 Astro 应用分别生成 21、15、13、33 个路由页（含列表/详情/搜索/关于/404/sitemap）；生产构建共 82 个 HTML |
| 无脚本可读正文，直接请求和刷新不 404 | 正文由 Astro 静态输出；`curl` 与浏览器直接访问 `/recipes/negroni/`、`/cocktails/negroni/`、`/places/gujing-wine-culture-museum/` 均返回 200 |
| 样本跨越酒类、产品判型、生产者、产区、配方与鸡尾酒、器具、指南、文化文章、地点关联 | 白酒、浓香型白酒、古井贡酒品牌/产品拆分、安徽古井贡酒股份有限公司、中国/安徽/亳州、内格罗尼鸡尾酒与配方、古典杯、品鉴指南、文化文章与诗词、古井酒文化博物馆及旧酒馆预览 |
| 中英切换去同一实体；缺译、过期译文、noindex 预览处理正确 | 已发布样本 12 个实体有 zh/en；《将进酒》与三条迁移记录只有中文，语言按钮显示缺译；译文散列由校验器检查；预览详情有 noindex 与提示 |
| 每站本地搜索可搜正文 | 各站 Pagefind 自定义记录：主站 14、喝法 6、文化 3、去处 2；中文查询 `内格罗尼` 经 CJK bigram 回退返回 3 条 |
| 主站总搜索只指向已发布目标 | `all-search/aggregate-manifest.json`：`scope: published-only`、25 条记录、四个来源站；不含品牌/产品/旧酒馆预览 |
| mandatory 关系全部可解析，未上线可选关系不生成悬空链接 | 校验器与构建器检查 required relations；发布页的关系目标必须已发布；反向关系由构建生成，不手写两份 |

## 3. 命令与结果

```text
npm run validate
=> passed: 28 records / 16 entities / 25 published records / 0 errors / 0 warnings
   contentTreeSha256: 7850eaaa5534791d7df792154fce69138efa980ba26afa8db9436cb6730acaeb

npm run check:catalogs
=> passed: 0 catalog errors

npm run test:tools
=> 6/6 tests passed (duplicate id, unverified rights, translation drift, ref resolution, registry counts, committed sample)

astro check (four apps)
=> 0 errors / 0 warnings / 0 hints each

npm run build:preview
=> 4 sites + aggregate 25 records; preview HTML 87

HEJIU_BUILD_MODE=preview ... cli.js links
=> passed: 87 HTML / 1530 links / 0 errors

npm run verify:links (production)
=> passed: 82 HTML / 1446 links / 0 errors
npm run verify:pages (production)
=> passed: 25 published pages / 0 errors

HEJIU_BUILD_MODE=preview ... cli.js pages
=> passed: 25 published pages checked; 4 expected mode warnings

node scripts/qa-browser.mjs
=> 43/43 checks passed
```

Browser QA environment: headless Chrome (Puppeteer core 25.16.0), viewports 320×800、390×844、768×1024、1440×900, light/dark/system. Not a physical-device test.

Checked:

- no horizontal overflow at all four widths;
- mobile bottom bar and desktop navigation visibility;
- bottom bar does not cover footer;
- system/light/dark theme switching;
- Chinese and English detail pages, hreflang;
- cross-site relation from guide to main;
- Chinese search results;
- culture article, poem relation, atlas museum, noindex legacy preview;
- mobile menu exposes the culture site;
- dialog search keeps the current URL and returns results.

Raw report: `evidence/G2-browser-qa.json`  
Screenshots: `evidence/screenshots/`

## 4. 内容与迁移证据

- 原始交接台账未修改：602 行仍全部 `pending-classification`。
- 工作副本 `migration/entity-map.json`：6 行已有去向，596 行 pending。
- 71 个旧未登记标签全部有映射行；17 个旧分类全部登记；两条 `huangjiu` 别名映射到 `yellow_wine`。
- 已迁移样本保留 `legacy_refs`，正文保留旧站原文并明确待复核。
- 迁移正文 rights 为 `unverified`，不进入生产搜索。

## 5. 明确未通过或未执行

- G3 最终 D 矢量、完整无障碍与真实设备验收：未完成。
- 542 条实体与 60 条诗词全量迁移：未完成（596 行仍 pending）。
- GitHub 远程八仓、Pages、DNS/HTTPS、Actions、Release 包、总索引线上发布、旧 SW 退役：未执行。
- GitHub owner、域名权限、内容与图片许可：未核实。
- 当前浏览器验收是 headless Chrome，不是实体手机；跨子域主题/语言 Cookie 尚未实现。

## 6. 证据文件

- `WORKLOG.md`
- `README.md`
- `.hejiu/entity-registry.json`（生产模式 registry）
- 各站 `dist/release-manifest.json`
- `evidence/G2-browser-qa.json`
- `evidence/screenshots/`
- `migration/entity-map.json`
- `content-repositories/alcoholic-beverages/shared/taxonomy/legacy-tags.md`
- `content-repositories/alcoholic-beverages/shared/taxonomy/legacy-categories.md`
