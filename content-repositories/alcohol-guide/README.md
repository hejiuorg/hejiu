# alcohol-guide

喝法内容仓，是 `guide.hejiu.org` 的正文来源。仓库保存品鉴、选择、侍饮、搭配、调酒、酒器、器具与保存知识。

- 中文目录：[zh/README.md](zh/README.md)
- English catalog：[en/README.md](en/README.md)
- 模板：[templates/](templates/)
- 本地配料键：[shared/ingredients.md](shared/ingredients.md)

## 目录结构

```text
{lang}/{type}/{slug}.md      正文（guide / technique / recipe / vessel / tool / pairing）
{lang}/{type}/README.md      分类目录
templates/{type}.md          类型模板
shared/ingredients.md        尚无全局实体的配方配料键
assets/                      图片与授权记录
```

## 当前样本状态

- 已审核：指南《第一口，先别急着下结论》、内格罗尼配方（IBA 版本）、古典杯。
- 原型样站另有 5 篇指南（温度与冰、杯型、搭配、调酒基础、酒标）保留原文与英文文本，但来源和译文尚未完成编辑审核，登记在 `migration/prototype-samples.json`，本轮不复制为正式正文。
- 配方与鸡尾酒身份分开：鸡尾酒身份在 `alcoholic-beverages`，配方版本在本仓，通过 `recipe-for` 连接。
- 配方中的配料优先使用全局 `item_ref`；尚无全局实体时使用 `shared/ingredients.md` 的本地 `ingredient_key`，两种引用互斥。

## 校验

```text
npm run validate
npm run check:catalogs
```

配方步骤必须有顺序，计量必须带单位；不可执行的用量不标为已审核。器具与配方关系会解析到真实实体。

## 权利

项目内容采用 CC BY 4.0；第三方标准、配方来源、商标与图片不在该许可内，引用仅作核验。
