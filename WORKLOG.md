# 喝酒去实施工作记录

- 记录时间：2026-10-29 17:45（本地）
- 阶段：G0 基线、G1 共同契约、G2 四站贯通样本、G3 四站界面与自动验收、G4 迁移与策展、G5 本地发布演练、G6 本地上线准备
- 执行者：Qoder agent（本地环境）
- 当前结论：G0–G6 本地实现与验收完成；内容已按策展规则收缩为 166 个来源核验页面（83 个实体，全部中英双语），553 条旧站档案停用（含全部 57 个诗词摘句），代码 MIT、内容 CC BY 4.0。远程 Pages/DNS、真实旧客户端、实体设备/读屏仍未完成。
- 本地源码提交：`e0fe09dbe270b58ec7c6770d63ac60a7d05fe62e`（166 页中英双语发布提交 + 翻译 QA；原型 `ae0eabf`、翻译 `f3e2f93`、策展 `634bdee`；早期提交见 Git 历史）

## 1. 环境与 G0

### 工作目录

- 原项目根：`C:/Users/chenhua/Desktop/hejiu`
- 实施 workspace：`C:/Users/chenhua/Desktop/hejiu/implementation`
- 旧站与原始数据保持原位，未覆盖。
- 原目录没有 Git；`gh` CLI 不可用；git 用户身份未配置。

### 版本

| 工具 | 版本 |
| --- | --- |
| Node.js | v26.8.1（要求 >=22.23.4） |
| npm | 11.19.0 |
| Astro | 7.4.4（精确锁定） |
| Pagefind | 1.5.2（精确锁定） |
| TypeScript | 5.9.3 |
| Zod | 4.6.7 |
| markdown-it | 15.0.3 |
| @astrojs/check | 0.9.12 |
| puppeteer-core | 25.16.0（本地 QA） |

### 基线检查

```text
node tools/audit-sources.mjs --check
=> passed; snapshotSha256 8c42187b1ecd66c28cf232e0ce0aca6ad0ec4b316f371749b90d73da4482d473
   china 118 / world 237 / pub 187 / poetry 60 / legacy 542 / ledger 602 / original files 135

node tools/verify-plans.mjs
=> passed; 18 Markdown / 96 local links / 28 types / 56 representative routes
```

### 旧源码备份

- 文件：`implementation/backups/hejiu-legacy-2026-10-29.tar.gz`
- SHA256：`e8518139f4333d8ad4141b0995d349ef366a8ef7b90d0aa0fa8b5c5f0295f17a`
- 内容：根旧站源码、`js/`、`zh/`、`sw.js`、`manifest.json`、`robots.txt`、`sitemap.xml`
- 未改动原始 `zh/`、根 `index.html`、`app.js`、`style.css`、`sw.js`。

### 外部状态核实

- `hejiu.org` 当前返回 200，内容仍是旧站首页（4,715 字节），经 Cloudflare。
- `guide.hejiu.org`、`culture.hejiu.org`、`atlas.hejiu.org` 当前返回 404，经 Cloudflare。
- GitHub owner 未配置于 `repositories.json`（`null`），无法核实八仓占用/权限；未猜填。
- DNS 能解析但无法核实所有权、Pages 设置或修改权限。
- 未记录任何凭据或令牌。

## 2. G1 共同契约

### 交付

- 契约副本：`site-repositories/site-alcoholic-beverages/packages/contracts/`
  - `types.json`、`repositories.json` 与 `docs/plans/` 源文件 SHA256 一致
  - `sites.json`、`relations.json`、`labels.json`、`contract-sources.json`
- 共享工具：`packages/build-tools/`（TypeScript strict + Zod）
  - schema 覆盖 28 个类型
  - ID 命名空间、slug、语言目录、来源、权利、关系、引用、legacy_refs、翻译散列与 revision
  - Markdown 渲染、TOC、ref 链接解析、未解析引用保留文字
  - registry、manifest、Pagefind、链接与页面验证
- 真实测试：`packages/build-tools/test/validation.test.mjs`，6/6 通过，覆盖重复 ID、未核实权利、译文散列漂移、引用解析、registry 计数分离与样本验收。
- 四内容仓 README、中英目录、28 个分类 README、28 个模板。
- 旧标签映射 71 个、旧分类 17 个、`huangjiu -> yellow_wine` 两条别名。
- 配料本地键 5 个，配方 ingredient_key 校验。

### 内容快照

- 28 条 Markdown 记录 / 16 个实体。
- 12 个实体有中英双语；4 个只有中文：品牌预览、产品预览、诗词、旧酒馆预览。
- 已发布记录：25（页面）。
- `contentTreeSha256`：`7850eaaa5534791d7df792154fce69138efa980ba26afa8db9436cb6730acaeb`。
- 迁移工作副本：602 行；`split` 1、`merged` 4、`migrated-needs-review` 1、`pending-classification` 596。
- 原始交接台账未修改。

### 校验输出

```text
npm run validate
=> passed; 28 records / 16 entities / 25 published records / 0 errors / 0 warnings

npm run check:catalogs
=> passed; catalog errors 0

npm run test:tools
=> 6/6 pass
```

## 3. G2 四站

### 架构

- 主站仓：`site-repositories/site-alcoholic-beverages/`
  - `apps/main/`、`packages/ui/`、`packages/build-tools/`、`packages/contracts/`
- 其余三站：各自 `apps/site/`，通过本地 workspace 引用同一 UI/工具版本。
- 每站构建后由 Astro 集成生成 Pagefind、registry、manifest；四站已发布记录写入 `.hejiu/published/`，主站生成同源总索引。
- 页面路由由 `types.json` 的 site + path 计算；中文根路径、英文 `/en/`。
- 主题（浅色/深色/系统）、移动底栏五项、头部菜单、搜索面板、目录、关系卡、来源与权利、收藏流程。

### 构建结果

```text
npm run build:preview
=> 4 sites built; preview HTML 87; aggregate search 25 records
npm run build:prod
=> 4 sites built; production HTML 82; aggregate search 25 records
```

预览模式含 noindex 迁移页面；生产模式只输出 `reviewed + rights.allowed` 页面。总搜索与各站 Pagefind 都只包含已发布记录。

### 验证

```text
HEJIU_BUILD_MODE=preview ... links
=> passed; 87 HTML / 1530 links / 0 errors / 0 warnings
HEJIU_BUILD_MODE=preview ... pages
=> passed; 25 published pages; 4 expected mode warnings
```

```text
npm run verify:links (production)
=> passed; 1446 links / 0 errors
npm run verify:pages (production)
=> passed; 25 published pages / 0 errors
```

四站 `astro check`：0 errors / 0 warnings / 0 hints。

浏览器 QA（headless Chrome，Puppeteer）：43/43 通过。覆盖 320/390/768/1440 宽度、浅色/深色/系统、中文/英文、搜索、跨站关系、收藏、noindex 预览和移动菜单。报告与截图见 `evidence/`。

### 本轮修复的问题

- Markdown ref 链接位于 inline token 子节点，最初未解析；已改为递归解析。
- `import.meta.url` 在 Astro 预渲染包中指向 dist，导致契约路径错误；改为从 workspace root 解析。
- 320px 头部溢出；在 <=359px 隐藏头部语言按钮并在移动菜单提供。
- 正文 H1 与页面标题重复；构建时移除正文首个 H1。
- 正文“参考资料”与结构化来源重复；构建时移除末尾参考资料段。
- 中文多字查询 Pagefind 无结果；增加 CJK bigram 回退。
- 搜索对话框与搜索页共用 `data-search-page` 属性，导致首页对话框搜索后 URL 被改写；已拆分属性，并加入真实点击测试。
- 已发布页不能链接 noindex 预览；发布页的 forward/reverse/ref/alternate 都只解析到已发布目标。
- 反向关系由构建生成；配方、酒器、生产者等页面自动出现反向卡片。

## 4. G3 界面与体验

### 交付

- 生产品牌资产：`packages/ui/src/assets/brand/`，含全彩 D、on-dark 版本、简化标记、16/32/48/180/192/512 PNG、品牌说明与哈希清单；四站 `public/brand/` 同步；favicon、Apple touch icon、manifest 图标更新。
- Hero 强调文字改为可换行下划线；中文短语不拆分，英文按词换行。
- 触控目标 ≥44px；收藏导入改为可键盘聚焦的按钮；列表/收藏标题层级与侧栏可访问名称补齐。
- 生产根域主题 Cookie 路径与语言偏好写入；本地预览按来源存储，URL 语言始终优先。
- QA 工具：`scripts/generate-brand-assets.mjs`、`qa-brand.mjs`、`qa-a11y.mjs`、`qa-matrix.mjs`、`qa-saved.mjs`、`qa-performance.mjs`。

### 结果

```text
node scripts/qa-brand.mjs
=> 7/7 checks; 16/32/48/180/192/512 PNG present, transparent corners, 16px min

node scripts/qa-matrix.mjs
=> 288/288 combinations pass
   4 sites × home/list/detail × zh/en × 320/390/768/1440 × light/dark/system

node scripts/qa-a11y.mjs
=> 39/39 checks; axe-core 4.14.0 WCAG 2.1/2.2 A/AA + best-practice: 0 violations
   keyboard, focus restore, reduced motion, contrast, 44px targets, 640px reflow, landscape

node scripts/qa-saved.mjs
=> 8/8 saved-flow checks: unknown ID, import, persistence, export schema, remove, detail toggle

node scripts/qa-performance.mjs
=> 8/8 budgets pass
   mobile: FCP/LCP 1208ms, CLS 0, total 74345 B, JS 10621 B, CSS 27490 B, 7 requests
   Pagefind 0 B on home; 86810 B loaded on demand
```

生产构建：82 HTML / 1618 links / 0 errors；25 published pages / 0 errors；`siteCommit` 指向 `7907ec8`。

### G3 修复的问题

- 320/390 英文 Hero 被 `white-space: nowrap` 撑出横向溢出；改为可换行。
- 中文强调短语曾在首字后换行，产生孤立“一”和错误下划线碎片；中文短语改 `nowrap`，英文按词换行。
- `.lang-switch` 的 aria-label 未包含可见 “EN” 文本；改为包含可见标签。
- 品牌链接 aria-label 在文化站包含错误站名；移除冗余 aria-label。
- 徽章在 accent-soft 背景上对比度 4.28–4.33；背景改为 surface。
- 搜索对话框淡入透明度使按钮对比度短暂降至 3.79；移除透明度动画。
- 收藏导入 label 不可聚焦；改为按钮触发文件选择，并给 input 加 aria-label。
- 列表页 h1→h3 缺 h2；收藏动态 h3 缺 h2；补充隐藏标题。
- 搜索对话框与搜索页共用 `data-search-page` 导致 URL 改写；拆分属性并加入点击测试。
- 品牌全彩主图轮廓畸形；重绘 mug/foam/handle 结构。
- 深色背景单色剪影不可读；改为奶油轮廓 on-dark 全彩版本。

### 仍未签收

- 实体手机/平板视觉、触控、横屏；
- VoiceOver/TalkBack/NVDA 实际读屏；
- 生产根域 Cookie 的真实 HTTPS 域验证；
- Lighthouse/线上真实网络性能。

## 5. G4 批量迁移

### 交付

- 602/602 旧记录有目标，**0 pending**：split 1、merged 4、migrated-needs-review 597。
- 新增 612 个中文 Markdown 文件：354 个 drink、186 个 place/pub、56 个 poem、16 个 drink-style。
- 内容总量 640 条记录 / 628 个实体；本地发布 640 条：25 条来源核验 + 615 条 archive-record。
- 迁移初次导入为 `needs-review` + `rights.unverified`；许可证确定后统一为 `reviewed`，按证据范围分为 `source-verified`（25）和 `archive-record`（615）。archive 条目保留旧站原文，页面和搜索明确标注“档案条目、事实断言未独立核验”，没有伪称来源核验。
- `nameEn` 只作别名；615 条档案条目无英文正文；12 个实体有英文翻译。
- 字段去向：`migration/legacy-field-map.json`，602 行逐条映射原字段到 frontmatter/正文。
- 旧路由：`migration/legacy-routes.json`，覆盖 602 详情、17 分类、93 子分类、32 省（两种参数）、313 城市、43 国家、6 洲、43 酒馆国家、97 酒馆城市、397 标签和 `#?` hash 形式。
- 元数据：`migration/metadata/` 保存分类、子分类、标签、城市、国家、洲、中国省份副本及散列；`legacy-subcategories.md` 覆盖 93 子分类。
- 原型样文：`migration/prototype-samples.json`，6 篇指南 + 3 篇文化文章；1 篇指南已迁为已审核样本，8 篇待编辑审核。
- 生成器：`tools/migrate-legacy.mjs`（支持 `--dry-run`、可重复生成、冲突即失败）、`tools/record-prototype-samples.mjs`。

### 结果

```text
npm run validate
=> passed; 640 records / 628 entities / 640 published
   602 mapped / 0 pending / 0 errors / 0 warnings

npm run check:catalogs
=> passed; 0 errors

npm run test:tools
=> 6/6 pass

npm run build:preview
=> 700 HTML; 15703 links / 0 errors（档案版构建）
   386 beverages / 6 guide / 59 culture / 189 atlas detail pages
   Pagefind local records 386/6/59/189; aggregate 640 published-only

npm run build:prod
=> 700 HTML; 15703 links / 0 errors; 640 published pages / 0 errors（档案版）

node scripts/verify-migration.mjs
=> 18/18 checks; 602 detail routes, 17 categories, 93 subcategories,
   64 province branches, 313 China cities, 43 countries, 6 continents,
   43 pub countries, 97 pub cities, 397 tags; 0 failures
```

迁移限制：640 条均已进入生产、sitemap 与搜索；其中 615 条是明确标注的 archive-record，不是来源核验。16 个新样式页正常发布，反向关系由生成器去重。

### 全量复核（640 条）

```text
npm run review:content
=> 640 records reviewed / 628 entities
   25 source-verified, 615 archive-record, 0 blocked
   0 needs-review, 0 rights-blocked, 0 missing-license
   12 entities have English translations; archive records are Chinese-only
```

复核规则：独立来源、rights allowed、状态 reviewed、英文译文发布规则。旧的“喝酒去旧站”记录和旧分类不作为独立来源。结果文件：`migration/content-review.json`、`content-review.csv`、`review-summary.md`；迁移完整性检查 18/18。

许可证决定（2026-10-29）：代码 MIT、内容 CC BY 4.0。`tools/apply-content-license.mjs` 为 640 条记录写入 `license: CC-BY-4.0` 和 `rights.status: allowed`；`tools/apply-archive-edition.mjs` 将 615 条缺少独立来源的记录标为 `verification_scope: archive-record` 并以“档案条目”发布，25 条已有证据的记录标为 `source-verified`。页面、搜索元数据和复核清单均保留该区分。

### 仍需完成

- 615 条 archive-record 逐条补独立来源、修正历史/宣传断言、完成英文翻译；
- 56 条诗词全文/异文/作者/出处核校；
- 397 个旧标签、93 个子分类和地域键的逐条受控词处置；
- 8 篇原型样文编辑审核与文化文章登记；
- 真实英文翻译与译文审核。

## 6. G5 本地发布演练

### 交付

- `scripts/build-release-snapshot.mjs` 生成 `release/snapshot.json`：四站 production manifest、内容树、锁文件、artifact SHA256、页面/搜索计数、来源核验与档案计数。
- `scripts/release-drill.mjs`：移除一个已发布搜索来源，验证总索引失败保留旧索引，再恢复并重试；同时校验快照的 640 页计数与 615 条档案记录。
- `search.ts` 总索引写入改为临时目录 + 原子替换，失败不覆盖旧索引。
- 命令：`npm run release:snapshot`、`npm run release:drill`。
- 报告：`evidence/G5-report.md`、`evidence/G5-release-snapshot.json`、`evidence/G5-release-drill.json`。

### 结果

```text
npm run build:prod
=> 700 HTML / 15703 links / 0 errors; 640 published pages / 0 errors
siteCommit 564ba3aa52661f6450d91e88b2b5c73b1f2a2434; contentTree c9f1497f8a4a

npm run release:snapshot
=> 13/13 checks; releaseId 564ba3a-c9f1497f8a4a
   pages: 386 beverages / 6 guide / 59 culture / 189 atlas
   aggregate: 640 published-only records, 4 sources
   25 source-verified + 615 archive-record; no preview in production

npm run release:drill
=> 11/11 checks
   aggregate failure exits non-zero and preserves old index
   retry succeeds with 640 records; no temp dirs; HTTPS URLs only
   production HTML has no preview page; snapshot archive counts match
```

### 未执行

- 远程八仓、Actions、Pages artifact 上传/deploy、域名/DNS/HTTPS、github.io base 预览。
- 跨仓触发、内容 PR 权限工作流、专用凭据。
- 旧 SW 有旧缓存客户端升级；旧路由跳转脚本/复核页/404 演练。
- 完整站点构建失败、跨站循环两阶段、slug 变更与删除承接、跨站回滚。
- 真实设备、读屏和线上性能。

## 7. G6 本地上线准备

### 交付

- 旧地址兼容：主站 `compat.js`、`legacy-routes.json`、`review-registry.json`、`/review/` noindex 复核说明页；覆盖 542 详情、17 分类、93 子分类、397 标签、地区/搜索分支和 `#?` hash。
- 旧 SW 过渡：主站 `public/sw.js` 删除 `hejiu-v1`/`hejiu-*` 缓存、无 fetch 拦截、注销自身；新站不注册 SW。
- 许可清单：`release/licenses.json`、`evidence/G6-license-inventory.md`；640 条/628 实体/24 来源；25 来源核验 + 615 档案；代码 MIT、内容 CC BY 4.0；无第三方图片，系统字体。
- G6 报告：`evidence/G6-report.md`。

### 结果

```text
node scripts/qa-legacy-compat.mjs
=> 16/16 pass: archive liquor/pub pages; #? hash; reviewed/archive category;
   search; tags; unknown -> 404; province; unknown review id

node scripts/qa-sw-retirement.mjs
=> 2/2 pass: simulated old hejiu-v1 cache + registration removed by transition worker

node scripts/build-license-inventory.mjs
=> 640 records / 628 entities / 24 sources; 25 source-verified + 615 archive
```

### 未执行

- 远程八仓、GitHub Actions、Pages 部署、DNS/HTTPS、github.io base 预览。
- 在真实旧站部署过渡 SW，并用真实旧缓存客户端升级。
- 真实旧链接在线上 Pages 的跳转、canonical/sitemap/状态码。
- 实体设备、实际读屏、真实 200% 缩放。
- 615 条 archive-record 的来源/事实/翻译升级与 8 篇原型样文编辑。

## 8. 策展版（2026-10-29）

### 决定

用户确认：旧站档案中无法独立成页的内容不再保留为公开页面；所有诗词摘句页删除；只保留能独立成页、有长期价值的实体，重新搜源写作；其他地方性、品牌性内容不再依赖旧文合并，未来直接独立撰写。

### 执行

- 新增 `migration/curation.json` 与 `tools/prune-content.mjs`，逐个读取 frontmatter，停用 553 条记录：57 首诗词摘句、324 个酒款、171 个地点、1 个无价值的“其他”风格页。
- 停用前把原文件复制到 `.hejiu/retired-content/`，并把 ID、类型、标题、旧 refs、文件 SHA256 和原因写入 `migration/retired-records.json`；旧站原始数据与迁移台账未删除。
- 保留并重写 63 条旧站实体：15 个酒类风格、31 个酒款、1 个品牌、16 个地点；加上原有 12 个核心实体（24 页），共 75 个实体、150 个中英双语页面。
- 所有重写页面均为项目自写，`status: reviewed`、`verification_scope: source-verified`，每个页面至少有独立于旧站的来源（生产者官网、产区协会、国家标准、工具书等）；63 个新增页面已补英文译文，不再使用旧站原文作为公开正文。
- 8 篇原型样文（5 篇指南 + 3 篇文化文章）已重写为中英双语正式页面，`prototype-samples.json` 处置为 9/9 migrated。
- 15 个风格页独立成篇：开胃酒、保健酒、啤酒、白兰地、果酒、金酒、利口酒、朗姆酒、清酒、烧酒、龙舌兰、伏特加、威士忌、葡萄酒、黄酒；旧“其他”只保留为不发布的草稿容器，供 93 个子分类映射使用。
- 旧地址映射同步收缩：48 条保留详情有目标；554 条停用记录的旧 URL 不再跳到无关页面，直接落到 404；分类、子分类、标签和地区分支保留。
- 中文搜索改用构建期生成的 `search-index.json` 做本地子串检索与标题优先排序，解决 Pagefind 对多字中文查询召回不稳定的问题；拉丁查询仍走 Pagefind。

### 结果

```text
npm run validate
=> passed; 167 records / 84 entities / 166 published; 0 errors / 0 warnings

npm run build:prod
=> 227 HTML / 5,520 links / 0 errors; 166 pages / 0 errors
   beverages 108 / guide 16 / culture 8 / atlas 34
   aggregate 166 published-only records, 4 sources

node scripts/qa-browser.mjs        => 43/43
node scripts/qa-a11y.mjs           => 39/39; 0 axe violations
node scripts/qa-matrix.mjs         => 288/288
node scripts/qa-performance.mjs    => 8/8 budgets
node scripts/qa-legacy-compat.mjs  => 17/17
node scripts/qa-sw-retirement.mjs  => 2/2

npm run release:snapshot           => 15/15 checks; releaseId e0fe09d-d00d83ce80b6
npm run release:drill              => 11/11 checks; 166 records restored after failure
```

### 边界

- 83 个公开实体全部有中英双语；167 条记录中 166 条发布，1 条草稿分类容器不发布。
- 停用的 553 条记录不再公开，但其数据仍可用于未来独立选题；不把旧文合并进新页面。
- 实体设备/读屏、真实旧客户端、译文人工复核和远程 Pages 仍未完成。

## 9. 验收状态

- G0：完成本地部分；外部 GitHub/DNS 权限未核实。
- G1：样本范围完成并通过实际校验器。
- G2：本地四站贯通完成并通过构建、链接、页面与浏览器检查。
- G3：本地自动化验收完成（品牌资产、288 组合矩阵、axe 0 violations、收藏 8/8、性能预算 8/8）；实体设备、读屏软件、生产域 Cookie 未签收。
- G4：602 行台账全部有处置：48 行保留重写、554 行明确停用、0 pending；166 页全部来源核验且中英双语、0 archive、0 blocked；代码 MIT、内容 CC BY 4.0。
- G5：本地生产快照 15/15、索引失败保留演练 11/11 通过；releaseId `e0fe09d-d00d83ce80b6`；远程 Actions/Pages/DNS/HTTPS、跨仓触发、旧 SW 和其余失败演练未执行。
- G6：本地旧地址/复核页、过渡 SW、许可清单和测试完成；远程 Pages/DNS/HTTPS、真实旧客户端、实体设备/读屏和正式切换未完成。

## 10. 未解决问题

1. GitHub owner、八个远程仓、Pages 权限未核实；未创建远程仓，尚未上传。
2. 四域 DNS/HTTPS/Pages 绑定未执行；当前主域仍是旧站，子域 404。
3. 83 个公开实体均已完成中英双语，英文由项目 AI 自写并自检。
4. 旧标签/子分类的受控词处置仍可继续。
5. G3 的自动检查已完成；仍需实体设备、实际读屏软件与生产根域 Cookie 的签收。
6. 浏览器 QA 为 headless Chrome，不是实体手机；未执行真实设备或读屏软件验收。
7. `astro check`、axe 与 headless QA 通过不等于 Pages 线上、DNS、真实设备或资料真实性验收。

## 11. 下一步

1. 译文复核：75 个实体已有中英双语，仍建议人工编辑复核译文与来源表述。
2. G3/G6 签收：在实体设备与实际读屏环境复核；在生产 HTTPS 域验证根域主题/语言 Cookie；补做实际 200% 缩放与线上性能。
3. 上传：核实 GitHub owner 与仓名占用；建立八仓；固定共享包 Release；配置 Actions、Pages、DNS/HTTPS 和跨仓触发。
4. 剩余演练：完整构建失败、循环依赖两阶段、slug 变更/删除承接、跨站回滚、旧 SW 有旧缓存客户端。
5. 正式切换：在真实 Pages/DNS 上部署旧地址承接与过渡 SW；验证真实旧缓存客户端和线上 canonical/sitemap/状态码。

## 12. 提交记录

- 本地 Git 初始化：`implementation/`（`main` 分支）
- 策展内容提交：`634bdee`（停用 553 条、重写 63 条旧站实体）
- 全量复核：`e0fe09d`（内容、译文、来源、旧路由、安全与构建复核；修复参考文献、来源 URL、保存页 JSON 转义）
- 风格译文补全：`2295fab`（15 个风格页按中文结构重写；译文 QA 14/14）
- 旧路由审计：`873a119`（14/14 检查；修复 5 条指向未发布 other 风格页的子分类映射）
- 翻译 QA：`226531a`（11/11 检查；英文正文去残留中文）
- 公开文案修订：`c67e796`（about/status 文案改为策展版）、`4a652a7`（详情页去“样本”字样）
- 原型样文提交：`ae0eabf`（5 指南 + 3 文章，166 页）
- 翻译提交：`f3e2f93`（63 个英文页面、150 页 QA）
- 搜索与 QA 提交：`d98584b`（中文搜索索引、兼容映射、QA 证据）
- 更早提交：`564ba3a` 档案版 640 页、`ada6053` 档案版报告、`debbeb7` 发布演练、`65db072` 生产兼容映射；G5 工具 `55308f2`、G4 内容 `3d97318`、G6 旧地址/许可 `47b927e`、早期 `f3f43d1`/`06fc93f`/`07c7117`/`1052d3d`/`2c03222`/`9539218`/`7907ec8`
- 最终生产构建：227 HTML / 5,520 links / 0 errors；166 页 / 0 errors；四站 + 166 条总索引记录
- 最终生产校验：`verify:links` 227 HTML / 5,520 links / 0 errors；`verify:pages` 166 published pages / 0 errors
- G2 浏览器 QA：43/43；G3 矩阵：288/288；G3 无障碍：39/39 + 0 axe violations；G3 收藏：8/8；G3 性能预算：8/8
- G4 策展：602 行 → 48 保留 / 554 停用；166 页中英双语来源核验；0 archive / 0 blocked
- G5 本地快照：15/15 checks；失败/回滚演练 11/11；releaseId `e0fe09d-d00d83ce80b6`
- G6 本地：compat 17/17、SW 2/2、license 166 条/83 实体；代码 MIT、内容 CC BY 4.0
- 未提交产物：`node_modules/`、各站 `dist/`、`.hejiu/`、备份 tar.gz（由 `.gitignore` 排除）
- 远程仓库、Pages、DNS 未创建/未修改；没有记录任何凭据。

策展版完成了本地高质量内容闭环；英文翻译、实体设备签收和远程上传仍未完成，不能把本次提交当作正式上线。

## 13. GitHub 上传与域名

### 仓库

已在 `github.com/hejiuorg` 创建并上传 9 个公开仓库：

- 站点：`site-alcoholic-beverages`、`site-alcohol-guide`、`site-alcohol-culture`、`site-alcohol-atlas`
- 内容：`alcoholic-beverages`、`alcohol-guide`、`alcohol-culture`、`alcohol-atlas`
- 源码与证据：`hejiu`

站点仓库使用“压缩产物 + GitHub Actions 部署 Pages”的方式上传；`www` 仓库继续承接 `hejiu.org`，原有旧站已打标签 `legacy-site-2026-10-29` 后替换为新主站静态产物。

### 线上检查

- `https://hejiu.org/`、`/styles/`、`/en/`：新主站，200。
- `https://culture.hejiu.org/`、`https://atlas.hejiu.org/`：新站，200。
- `https://guide.hejiu.org/`：新站内容已上线，但证书仍是 `*.github.io`，浏览器会报证书不匹配；需要 DNS 调整或等待 GitHub 证书签发。
- 旧 URL 承接和停用 URL 404 已在线上浏览器验证。
- `search-index.json`、Pagefind、`legacy-routes.json`、`sw.js`、sitemap、许可证文件均可访问。

### DNS 边界

`hejiu.org`、`culture.hejiu.org`、`atlas.hejiu.org` 已能通过现有 Cloudflare/GitHub 路由访问新站；`guide.hejiu.org` 需要把 DNS 记录改为指向 `hejiuorg.github.io` 的 DNS-only CNAME（或在 Cloudflare 中保持代理并等待 GitHub 证书）。没有 Cloudflare API 权限，未修改 DNS。

### 凭据

GitHub token 仅在本次上传中临时使用，未写入仓库、远程 URL 或文件。该 token 已在对话中暴露，使用后应立即撤销/轮换。
