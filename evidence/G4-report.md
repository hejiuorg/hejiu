# G4 批量迁移报告

日期：2026-10-29  
本地站点源码提交：`3d97318371d3625fd6379277647342b3b5deef4d`  
批次：全部 602 条交接台账记录的批量结构迁移  
范围：542 条旧实体 + 60 条诗词 + 17 类/93 子分类/397 标签/地域元数据  
结论（G4 当时）：**602/602 有目标、0 pending；当时按 25 条来源核验 + 615 条 archive-record 的档案版发布。随后 2026-10-29 策展版停用 553 条、重写 63 条，并补齐英文，最终为 166 页中英双语来源核验版本；本报告保留为迁移过程记录。**

注：第 3 节保留 G4 当时仅发布 25 页的构建输出；后续档案版将 615 条以 archive-record 发布，2026-10-29 又按策展规则停用 553 条并重写 63 条，最终为 166 页中英双语来源核验版本。最新计数见 G5/G6 报告和 `WORKLOG.md`。

## 1. 计数

| 项目 | 结果 |
| --- | --- |
| 原始台账 | 602 |
| 已映射 | 602 |
| pending-classification | 0 |
| split | 1（古井贡酒品牌/产品） |
| merged | 4（《将进酒》四句） |
| migrated-needs-review | 597 |
| 新增 Markdown | 612 |
| drink | 354 |
| place / pub | 186 |
| poem | 56 |
| drink-style 容器 | 16 |
| 内容总量 | 640 条记录 / 628 个实体 |
| 已发布/进入生产搜索 | 25 条记录（未增加） |

所有 612 个新文件：`status: reviewed`、`verification_scope: archive-record`、`rights: allowed / CC-BY-4.0`、中文正文；`nameEn` 仅写入 `aliases`，没有生成英文正文。页面明确显示档案条目提示。

## 2. 生成与映射文件

- 生成器：`tools/migrate-legacy.mjs`，支持 `--dry-run`；重复运行只清理 `migration/generated-files.json` 中上一轮生成的文件，不删除已审核样本或 README。
- 实体映射：`migration/entity-map.json`
- 文件清单：`migration/generated-files.json`
- 字段去向：`migration/legacy-field-map.json`（602 行）
- 旧路由：`migration/legacy-routes.json`
- 元数据副本：`migration/metadata/`
- 子分类映射：`content-repositories/alcoholic-beverages/shared/taxonomy/legacy-subcategories.md`
- 原型样文登记：`migration/prototype-samples.json`

## 3. 字段与判型

### 旧酒品 → drink

- 355 条旧“酒品”中，1 条古井贡酒记录已拆分为品牌 + 产品样本；其余 354 条迁为 `drink`。
- 旧 category/subcategory 映射到 16 个新的 `drink-style` 容器；`baijiu` 与 `strong-aroma-baijiu` 复用既有已审核样式。
- 原文的简介、特色、历史、分析、分类、产地字段、酒精度原文和标签保留在正文。
- 可解析的酒精度写入 `abv`；无法解析时只保留原文。
- 没有生产者/品牌/地域实体的记录不伪造关联；品牌与产品边界、来源与权利待审。

### 旧酒馆 → place/pub

- 186 条新增 + 1 条既有老白酒馆样本；187 条全部有去向。
- 地址、城市、国家、创立时间原文与故事保留；坐标 `null`；营业状态 `unknown`；无官方链接的不显示“正在营业”。

### 诗词 → poem

- 旧 `poetry:1` 至 `poetry:4` 合并到已审核的《将进酒》样本。
- 其余 56 条各建一条 `poem`，保留 verse、source 与旧数组索引。
- 标题、作者只按旧 source 字符串解析；全文、异文、作者、出处和权利未核实。

### 分类与标签元数据

- 17 个旧分类 → 17 个类别/子分类映射；93 个子分类全部在 `legacy-subcategories.md` 有行。
- 397 个旧标签定义和 TagCategories 复制到 `migration/metadata/tag-definitions.json`。
- 71 个旧未登记标签、17 个旧分类别名继续由 G1 映射覆盖；新迁移正文没有直接把旧标签写入受控 `tags`。

## 4. 旧路由覆盖

`migration/legacy-routes.json` 覆盖：

| 分支 | 覆盖 |
| --- | --- |
| 详情记录 | 602 |
| 功能入口 | 7 |
| 分类 | 17 |
| 子分类 | 93 |
| 省份 | 32（两种参数形式，共 64 行） |
| 中国城市分支 | 313 |
| 国家 | 43 |
| 洲 | 6 |
| 酒馆国家 | 43 |
| 酒馆城市 | 97 |
| 标签 | 397 |
| 旧 hash | `#?` 与查询形式等价，已在记录和说明中登记 |

目标仍为 needs-review 的详情标 `needs-review-preview`；分类/地区/标签分支缺少等价筛选页的标 `fallback*`。映射只是描述数据，尚未部署跳转脚本或兼容页；G5/G6 才做真实旧客户端和旧 SW 演练。

## 5. 验证与构建

迁移完整性检查：`node scripts/verify-migration.mjs`，15/15 通过（602 行映射、字段表、生成文件、路由覆盖、原型登记、元数据）。结果：`evidence/G4-migration-check.json`。

```text
npm run validate
=> passed: 640 records / 628 entities / 25 published
   602 mapped / 0 pending / 0 errors / 0 warnings

npm run check:catalogs
=> passed: 0 errors

npm run test:tools
=> 6/6 pass

npm run build:preview
=> 699 HTML / 13,625 links / 0 errors
   detail pages: 386 beverages / 6 guide / 59 culture / 189 atlas
   Pagefind local: 14 / 6 / 3 / 2; aggregate: 25 published-only

npm run build:prod
=> 82 HTML / 1,618 links / 0 errors; 25 published pages / 0 errors
   manifest siteCommit 3d97318; contentTreeSha256 ab671df6ff2d…
```

生产构建仍只输出 reviewed 与 rights.allowed 的 25 条样本；新增 612 个页面全部为 noindex 预览，不进入 sitemap、Pagefind 或主站总搜索。

## 6. 全量复核结论

已运行 `npm run review:content`，对当前全部 640 条记录 / 628 个实体逐条判定。许可证由项目所有者于 2026-10-29 确定为：代码 MIT、内容 CC BY 4.0。旧站档案正文作为项目内容保留。

| 结果 | 数量 |
| --- | --- |
| 处理记录 | 640 |
| 来源核验记录 | 25 |
| archive-record 记录 | 615 |
| blocked 记录 | 0 |
| 已审核双语实体 | 12 |
| 仅中文来源核验实体 | 1 |
| archive-record 实体 | 615 |
| blocked 实体 | 0 |

- 25 条来源核验页使用独立来源（标准、政府、IBA、WSET、古典文本等）并保留双语/中文已审核状态。
- 615 条档案条目发布旧站原文，页面状态与搜索结果显示“档案条目”，并明确说明历史、产品、地址、营业信息与图片未独立核实。
- 旧站档案正文采用 CC BY 4.0；第三方标准、商标、图片和引用文本不在该许可内。
- 没有把档案条目标成“来源核验通过”。

复核数据：

- `migration/content-review.json`（逐条记录/实体）
- `migration/content-review.csv`（编辑审阅表）
- `migration/review-summary.md`（摘要）
- `evidence/G4-migration-check.json`（迁移完整性）

## 7. G4 清单状态

| 验收项 | 状态 |
| --- | --- |
| 每条旧实体/诗词有目标或合并/拆分/退役去向 | 通过（602/602） |
| 原正文及字段去向可追踪 | 通过（字段表 + 正文） |
| 宣传/历史断言、来源、图片权利逐批审核 | 档案条目明确标注未独立核实；25 条来源核验通过 |
| 地址与营业状态逐批审核 | 档案条目全部 unknown；未独立核实 |
| 中英文正文状态真实 | 25 条来源核验（12 双语 + 1 中文）；615 条中文档案条目 |
| 旧路由全部分支/参数/编码/hash 映射 | 映射覆盖通过；线上跳转与真实旧客户端未执行 |
| pending 数量与上线声明一致 | 0 pending；615 archive-record，不是来源核验 |
| 完整双语完成 | 未完成：615 条档案条目仅中文 |

## 8. 明确未完成

- 615 条 archive-record 的独立来源、事实、历史断言、产品/品牌边界、地址与营业信息升级。
- 56 条诗词全文、异文、作者和出处核校。
- 397 个旧标签、93 个子分类和地域键的逐条受控词处置。
- 原型 8 篇未迁移样文（5 篇指南 + 3 篇文化文章）的编辑审核。
- 615 条档案条目的英文翻译与译文审核。
- 图片权利、图片迁移和署名。
- 旧路由跳转脚本在真实 Pages 上的部署、复核说明页、旧 SW 真实客户端和回滚演练。
- 实体设备、实际读屏和线上性能签收。

因此本报告证明 **结构与映射批量迁移完成，640 条记录在本地有明确发布状态（25 来源核验 + 615 明确标注档案）**；不能把档案条目当作独立来源核验或完整双语完成。
