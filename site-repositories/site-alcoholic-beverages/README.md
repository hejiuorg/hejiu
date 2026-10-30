# site-alcoholic-beverages

喝酒去主站仓，部署地址 `hejiu.org`。它同时承担四站共享核心、主站应用、总搜索与收藏。

## 本仓内容

```text
apps/main/                Astro 主站应用（hejiu.org）
packages/contracts/       类型、仓库、站点、关系与标签契约副本
packages/build-tools/     内容读取、schema、校验、路由、Pagefind、manifest
packages/ui/              四站共享布局、组件、样式与客户端交互
```

主站正文来自 `alcoholic-beverages` 内容仓。其他三站通过本地 workspace 引用同一套 `@hejiu/ui` 与 `@hejiu/build-tools`；首次贯通后再打包固定 Release，其他仓不复制修改组件。

## 命令

在 `implementation/` 工作区运行：

```text
npm run build:tools                构建共享工具
npm run build -w @hejiu/site-main  构建主站
npm run build:preview              四站预览构建（含待复核 noindex 页面）
npm run build:prod                 四站生产构建（仅已发布页面）
```

站点构建完成后，构建钩子生成：

- `dist/pagefind/`：本站 Pagefind 索引（只含已发布正文）
- `dist/entity-registry.json`：实体与翻译 registry
- `dist/release-manifest.json`：构建输入、内容散列、页面与版本
- `dist/all-search/`：主站总搜索索引，由四站已发布记录生成

## 共享规则

- 共享契约的源文件是 `docs/plans/types.json` 与 `repositories.json`；仓内副本记录来源散列，校验器会检查漂移。
- 其他站的应用只通过配置区分站点 key、host 与强调色，底栏顺序和语言行为由共享 UI 决定。
- 共享包版本当前为 `0.1.0`，以本地 workspace 引用；固定 Release 与 SHA256 核验在 G5 完成。

## 当前状态

这是 G2 贯通样本。主站已包含四站总首页、类型目录、详情、搜索、收藏和关于/贡献页；不等于 542 条旧资料迁移完成。
