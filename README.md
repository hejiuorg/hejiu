# 喝酒去实施工作区（G0–G6 本地上线准备）

本目录是按已确认的四内容仓、四网站仓方案建立的本地 workspace。它包含可运行的共同 schema、真实校验器、四内容仓、共享 UI/构建工具、生产品牌资产和四个 Astro 静态站。G0–G6 的本地实现与验收已完成。2026-10-29 按策展规则收缩为 **166 个来源核验页面（83 个实体，全部中英双语）**：停用 553 条无法独立成页的旧站档案（含全部 57 个诗词摘句），保留并重写 63 条旧站实体（15 个酒类风格、31 个酒款、1 个品牌、16 个地点），加上 12 个原有核心实体（24 页）和 8 篇原型样文（16 页），合计 166 页；另有 1 个草稿分类容器不发布。代码 MIT、内容 CC BY 4.0。9 个 GitHub 仓库已上传；`hejiu.org`、`culture.hejiu.org`、`atlas.hejiu.org` 已上线新站，`guide.hejiu.org` 待证书/DNS 修正；真实旧客户端与实体设备/读屏仍未完成。

## 八仓路径

| 内容仓 | 本地路径 | 网站仓 | 本地路径 |
| --- | --- | --- | --- |
| alcoholic-beverages | `content-repositories/alcoholic-beverages/` | site-alcoholic-beverages | `site-repositories/site-alcoholic-beverages/` |
| alcohol-guide | `content-repositories/alcohol-guide/` | site-alcohol-guide | `site-repositories/site-alcohol-guide/` |
| alcohol-culture | `content-repositories/alcohol-culture/` | site-alcohol-culture | `site-repositories/site-alcohol-culture/` |
| alcohol-atlas | `content-repositories/alcohol-atlas/` | site-alcohol-atlas | `site-repositories/site-alcohol-atlas/` |

主站仓包含 `apps/main/`、`packages/ui/`、`packages/build-tools/` 与 `packages/contracts/`。其余三站通过 npm workspace 引用同一份共享包，只保留自己的 Astro 应用与配置。

## 版本锁定

- Node.js 实际环境：`v26.8.1`；要求 `>=22.23.4`
- npm `11.19.0`
- Astro `7.4.4`
- Pagefind `1.5.2`
- TypeScript `5.9.3`
- Zod `4.6.7`
- markdown-it `15.0.3`
- `@astrojs/check` `0.9.12`
- `puppeteer-core` `25.16.0`（仅用于本地 QA）

所有版本写入 `package.json` 与根 `package-lock.json`，不使用 `latest`。

## 命令

```text
npm run validate        # schema、ID、关系、来源、权利、翻译散列、旧记录映射
npm run check:catalogs  # 中英目录与分类目录链接
npm run test:tools      # 六条校验器测试（含临时坏样本）
node tools/migrate-legacy.mjs          # G4 批量迁移与映射（dry-run 可先预览）
python tools/generate-content-catalogs.py
node tools/record-prototype-samples.mjs
npm run review:content   # 全部记录复核判定
npm run verify:migration # 迁移/复核完整性
npm run release:snapshot # 本地发布快照（工作树必须干净）
npm run release:drill    # 总索引失败保留与重试演练
npm run release:licenses # 已发布子集许可清单
node scripts/qa-legacy-compat.mjs
node scripts/qa-sw-retirement.mjs
npm run build:preview   # 四站预览构建：含 needs-review noindex 页面 + 本地端口互链
npm run build:prod      # 四站生产构建：仅 reviewed + rights allowed 页面
npm run verify:links    # 四站 HTML 链接、预览链接、Pagefind、sitemap 检查
npm run verify:pages    # canonical、hreflang、robots、sitemap、静态页检查
npm run serve:preview   # 4401 主站 / 4402 喝法 / 4403 文化 / 4404 去处
node scripts/qa-browser.mjs      # G2 四站响应式/搜索/收藏/预览
node scripts/qa-brand.mjs        # D 资产与 16/32/48 图标
node scripts/qa-matrix.mjs       # 288 组合布局矩阵
node scripts/qa-a11y.mjs         # axe、键盘、焦点、减少动画、触控目标
node scripts/qa-saved.mjs        # 收藏导入/导出/未知 ID/持久化
node scripts/qa-performance.mjs  # 传输量、LCP/CLS、搜索按需加载
```

`scripts/generate-brand-assets.mjs` 生成 D 品牌 SVG/PNG、四站 public 副本、favicon 与 manifest 图标；品牌源与权利说明位于 `site-repositories/site-alcoholic-beverages/packages/ui/src/assets/brand/`。

品牌与界面验收证据见 `evidence/G3-report.md`、`evidence/G3-brand.json`、`evidence/G3-a11y.json`、`evidence/G3-matrix.json`、`evidence/G3-saved.json` 和 `evidence/G3-performance.json`。

`qa-browser.mjs` 使用本机 Chrome headless，在 320、390、768、1440 宽度检查溢出、底栏、主题、搜索、语言切换、跨站关系和 noindex 预览，并把报告与截图写入 `evidence/`。

## 当前内容样本

- 167 条 Markdown 记录，84 个实体；166 条本地发布（83 个实体 × 中英双语），1 条 `drink-style:other` 草稿仅用于旧子分类映射，不发布。
- 本地发布 166 个详情页：主站 108、喝法 16、文化 8、去处 34；83 个公开实体全部有中英双语。
- 迁移台账 602 行：48 行保留并重写，554 行明确停用；0 pending。
- 停用记录保留在 `migration/retired-records.json` 与 `.hejiu/retired-content/` 备份中；旧站原始数据未修改，也不再作为公开页面或合并素材。
- 所有公开记录都有独立于旧站的来源；0 archive-record、0 blocked。
- G5 本地快照：四站 production、166 页、166 条总索引；快照 15/15、索引失败保留与重试 11/11，releaseId `e0fe09d-d00d83ce80b6`。
- G6 本地：旧地址兼容 17/17、全量旧路由审计 14/14、过渡 SW 2/2、许可清单 166 条/83 实体、翻译 QA 14/14；全量复核见 `evidence/G7-final-audit.md`。真实旧客户端与 DNS/Pages 未执行。
- 旧标签 397 个、旧分类 17 个、旧子分类 93 个仍保留映射；公开样式页只保留 17 个。
- 旧站 542 条实体和 60 条诗词的原始数据未修改；57 个诗词摘句页全部停用。

## 未完成

- G3 签收：实体设备/实际读屏软件、生产 HTTPS 根域 Cookie、实际 200% 缩放与线上性能。
- 内容：83 个公开实体均已完成中英双语，英文由项目 AI 自写并自检（结构、数字、术语、正文语言）；实体设备验收仍未完成。
- G5/G6：远程八仓、内容快照与 Release、GitHub Actions、四站 Pages、DNS/HTTPS、总索引发布、旧 SW 退役和正式上线。
- GitHub owner、域名权限与远程 Pages 权限仍未核实；代码 MIT、内容 CC BY 4.0 已由项目所有者确定。

详细过程与证据见 [WORKLOG.md](WORKLOG.md)、[evidence/G2-report.md](evidence/G2-report.md)、[evidence/G3-report.md](evidence/G3-report.md)、[migration/README.md](migration/README.md)、[migration/review-summary.md](migration/review-summary.md)、[evidence/G4-report.md](evidence/G4-report.md)、[evidence/G5-report.md](evidence/G5-report.md) 和 [evidence/G6-report.md](evidence/G6-report.md)。

## 许可

- 代码：MIT，见 [LICENSE](LICENSE)。
- 内容：CC BY 4.0，见 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)；第三方标准、商标、图片与引用文本不在该许可内。
- 166 个公开页面（83 个实体）均为项目自写并标注来源；停用的旧站档案不再公开，其原文仅保留在内部迁移记录与备份中。
- D 品牌著作权采用 CC BY 4.0；商标权不随许可证授予。
