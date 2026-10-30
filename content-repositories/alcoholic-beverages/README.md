# alcoholic-beverages

识酒内容仓，是 `hejiu.org` 的正文来源。仓库保存酒类风格、产品、品牌、生产者、原料、品种、产区、工艺、术语、标准与鸡尾酒身份，并通过稳定的全局 ID 与其他三个内容仓关联。

- 中文目录：[zh/README.md](zh/README.md)
- English catalog：[en/README.md](en/README.md)
- 模板：[templates/](templates/)
- 受控词与地区表：[shared/regions.md](shared/regions.md)、[shared/taxonomy/](shared/taxonomy/)

## 目录结构

```text
{lang}/{type}/{slug}.md      正文（type 必须与 types.json 一致）
{lang}/{type}/README.md      分类目录，链接本目录全部正文
templates/{type}.md          28 个类型模板，均为草稿占位
shared/                      地区键、受控标签、旧分类与旧标签映射
assets/                      图片与授权记录（当前无正式图片）
```

每个正文文件包含 YAML front matter 与标准 Markdown。中文是源语言；英文通过 `translation_of`、`source_lang`、`source_revision`、`source_sha256` 与 `translation_status` 绑定到具体中文文件版本，不以 `nameEn` 冒充译文。

## 当前样本状态

已审核并进入生产搜索的样本：白酒、浓香型白酒、中国/安徽/亳州地区、安徽古井贡酒股份有限公司、内格罗尼鸡尾酒身份。

G4 批量迁移预览（`needs-review`，noindex，不进入正式搜索）：354 条旧酒品记录迁为 `drink`，16 个旧分类容器迁为 `drink-style`；古井贡酒品牌/产品拆分和旧站古井贡酒记录继续作为代表样本。所有迁移正文保留旧站原文，`nameEn` 只作别名，不伪造英文正文，权利仍为 `unverified`。

## 边界

- 生产者是主体；酒庄/博物馆参访地点归 `alcohol-atlas`。
- 鸡尾酒身份归本仓，配方版本归 `alcohol-guide`。
- 生产端熟成与工艺在本仓；消费端保存与侍饮在 `alcohol-guide`。
- 品牌与产品分别建档，不把旧站“酒品”批量假定为同一类型。

## 校验

在 `implementation/` 工作区运行：

```text
npm run validate
npm run check:catalogs
```

校验器会检查 ID 命名空间、slug、双语源文件散列、关系目标与类型、来源与权利、旧记录映射、目录断链和受控词覆盖。

## 权利

项目内容（含迁移档案正文）由项目所有者于 2026-10-29 声明采用 CC BY 4.0；第三方标准、商标、图片与引用文本不在该许可内。旧站档案中的事实/营业断言仍需独立核验。
