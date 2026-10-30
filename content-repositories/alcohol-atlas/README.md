# alcohol-atlas

去处内容仓，是 `atlas.hejiu.org` 的正文来源。仓库保存酒馆、酒吧、酒庄/酒厂/啤酒厂参访点、博物馆、路线与活动。

- 中文目录：[zh/README.md](zh/README.md)
- English catalog：[en/README.md](en/README.md)
- 模板：[templates/](templates/)

## 目录结构

```text
{lang}/{type}/{slug}.md      正文（place / route / event）
{lang}/{type}/README.md      分类目录
templates/{type}.md          类型模板
assets/                      图片与授权记录
```

## 地点状态规则

- `operating_status` 与内容审核状态分开：`reviewed` 不等于“正在营业”。
- 未知坐标使用 `null`，不填零，不在地图上猜位置。
- 开放时间、票价与预约方式只有在有日期的官方资料下才能展示；当前样本不提供这些实时承诺。
- 已关闭但有历史价值的地点可以保留为历史地点，不自动删除。
- 生产者与参访地点分开：生产者引用 `alcoholic-beverages`，地点通过 `visitor-place-of` 关联。

## 当前样本状态

- 已审核：古井酒文化博物馆（博物馆，关联古井生产者与亳州地区）。开放状态为 `unknown`。
- 迁移预览：旧站老白酒馆（`needs-review`，noindex），保留地址、旧站故事与待核事项。
- 187 家旧酒馆已全部有迁移去向：1 个已审核博物馆样本、1 个旧酒馆迁移样本和 186 个 `needs-review` 批量地点。营业状态一律保持 `unknown`，不能声称已经核验营业。

## 校验

```text
npm run validate
npm run check:catalogs
```

路线和活动模板明确标为草稿；没有经核验路线或活动时不生成正式页面。

## 权利

项目内容（含旧站档案正文）由项目所有者声明采用 CC BY 4.0；第三方政府网页、商标与图片不在该许可内；营业信息仍需独立核验。
