# G5 本地发布演练报告（策展版）

日期：2026-10-29  
本地站点/内容提交：`e0fe09dbe270b58ec7c6770d63ac60a7d05fe62e`  
范围：生产快照、四站产物散列、总搜索、失败保留和本地回滚演练  
结论：**本地快照与失败保留演练通过；9 个 GitHub 仓库与 Pages 已上传，主站/文化/去处已上线；向导站证书、Cloudflare DNS 与真实回滚仍未完成。**

## 1. 发布快照

`release/snapshot.json`，生成于 `release:snapshot`：

- 四站均为 production 构建，siteCommit 一致。
- 四站内容树一致：`d00d83ce80b6a6ba752cf3c97093fc394f59e310447154766725d715473dff95`。
- 生产页面 166：主站 108、喝法 16、文化 8、去处 34；83 个实体全部中英双语。
- 本地搜索记录 166；总索引 166，`published-only`，四个来源站；全部为来源核验内容，0 archive-record。
- 每站记录 artifact SHA256、manifest SHA256、页面数和搜索记录数。
- 167 条记录中 166 条发布、1 条 `drink-style:other` 草稿仅用于旧子分类映射；生产 HTML 中无 preview 页面。
- 工作树干净，releaseId `e0fe09d-d00d83ce80b6`。

快照检查结果：`evidence/G5-release-snapshot.json`，15/15 通过。

## 2. 失败与回滚演练

`scripts/release-drill.mjs`，结果 `evidence/G5-release-drill.json`，11/11 通过：

- 临时移除 `guide` 的已发布搜索来源后，总索引命令非零退出。
- 失败后旧 `all-search` manifest 散列和 `pagefind.js` 保持不变。
- 恢复来源后重试成功，仍为 166 条、四来源、published-only。
- 原子写入未留下 `.tmp`/`.old` 目录。
- 166 条生产搜索 URL 全部为 HTTPS，没有 localhost 泄漏。
- 主站生产 HTML 没有 preview 页面，snapshot 与当前总索引计数一致。

限制：没有执行完整站点构建失败、真实 Pages 部署失败、跨站循环两阶段、slug 变更承接、删除承接或旧 SW 客户端升级演练。这些需要 G6/远程环境或额外测试夹具。

## 3. 远程步骤

- 9 个 `github.com/hejiuorg` 仓库已创建并上传；四个站点仓库的 Actions/Pages 工作流已成功运行。
- `hejiu.org`、`culture.hejiu.org`、`atlas.hejiu.org` 已服务新站；`guide.hejiu.org` 证书/DNS 仍未完成。
- 内容仓跨仓触发、专用 GitHub App/最小权限凭据未配置。
- 旧根域 SW 的有旧缓存客户端升级与退出未执行。
- 真实设备、屏幕阅读器和完整线上回滚未执行。

## 4. G5 清单状态

| 验收项 | 状态 |
| --- | --- |
| 内容/站点 commit、核心包、锁文件和产物散列可复现 | 本地快照通过；8 个内容/站点仓已上传，主站/文化/去处已上线 |
| 内容 PR 校验、受信合并触发、跨仓凭据、手动构建 | 未执行 |
| 四个 Pages 分别部署成功、域名与 HTTPS 核验 | 主站/文化/去处 HTTPS 通过；向导站证书待完成 |
| 目标先发布、循环依赖两阶段、总搜索不含未上线内容 | 总搜索 published-only；两阶段未演练 |
| 构建/部署失败保留旧版本、索引降级、slug 兼容、删除承接、跨站回滚 | 索引失败保留与本地重试通过；其余未执行 |
| 旧根 SW 升级退出 | 未执行 |

## 5. 结论

本报告证明 **166 个本地来源核验页面（83 个中英双语实体）的生产快照、总索引和索引失败保留可复现**；主站、文化与去处已上线，向导站证书/DNS 仍待完成。
