# alcohol-culture

酒文化内容仓，是 `culture.hejiu.org` 的正文来源。仓库保存文章、人物、典籍、礼俗、历史事件、艺术作品、诗词与组织。

- 中文目录：[zh/README.md](zh/README.md)
- English catalog：[en/README.md](en/README.md)
- 模板：[templates/](templates/)

## 目录结构

```text
{lang}/{type}/{slug}.md      正文（article 使用 culture-article 命名空间）
{lang}/{type}/README.md      分类目录
templates/{type}.md          类型模板
assets/                      图片与授权记录
```

## 当前样本状态

- 已审核中文文章：《一杯酒里的时间》，引用《诗经》《齐民要术》《全唐诗》，并关联诗词实体。
- 已审核中文诗词：《将进酒（节选）》，由旧站 `poetry:1` 至 `poetry:4` 四句合并；目前没有英文译文，因此不生成英文正文页。
- G4 批量迁移：另外 56 条旧诗词摘句已迁为 `poem`，全部 `needs-review`、无英文正文；来源、作者、全文与异文待核。
- 诗词只保存可核对文本、作者、题名、出处与版本说明，不冒充全文。
- 传说、轶事与史料分开书写；不因名人故事制造未经证实的推荐。

## 与旧资料的关系

60 条 WinePoetry 已全部有迁移去向（4 条合并到既有样本，56 条独立 needs-review）。旧站三篇文化样文登记在 `migration/prototype-samples.json`，目前保持待编辑审核，不标为 reviewed。

## 校验

```text
npm run validate
npm run check:catalogs
```

英文缺失是允许状态；不会生成伪英文页，语言切换会提示缺译。已审核英文必须绑定当前中文源文件散列。

## 权利

项目内容采用 CC BY 4.0；古籍文本属于公共领域，引用保持必要范围；第三方图片/文本不在该许可内。
