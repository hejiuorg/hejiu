# 本地发布快照与演练

本目录保存本地生产构建的快照，不代表已经部署到 GitHub Pages。

## 文件

- `snapshot.json`：由 `scripts/build-release-snapshot.mjs` 生成，记录站点 commit、内容树散列、锁文件散列、四站产物散列、搜索记录数、发布页数、1 条草稿和停用记录计数。

## 重新生成

在 `implementation/` 工作区：

```text
npm run build:prod
npm run verify:links
npm run verify:pages
npm run release:snapshot
npm run release:drill
```

`release:snapshot` 要求工作树干净；如果工作树有未提交变更会失败。`release:drill` 会暂时移除一个已发布搜索来源，验证总索引失败时保留旧索引，再恢复来源并重试。

## 当前范围

- 生产包含 166 个来源核验页面：主站 108、喝法 16、文化 8、去处 34；83 个实体全部中英双语。
- 总索引为 published-only，166 条记录，四个来源站。
- 553 条停用内容不进入生产、sitemap、Pagefind 或总索引；1 条草稿分类容器同样不发布。
- 这是本地静态产物与回滚演练，不是 GitHub Pages、DNS、HTTPS、旧 SW 或真实设备验收。
