# G7 本地全量复核报告

日期：2026-10-29  
范围：全部本地内容、双语译文、旧路由、构建产物、代码与发布演练  
结论：**本地静态站点与内容已完成全量复核；未发现阻断发布的构建、链接、双语、路由或无障碍问题。9 个 GitHub 仓库已上传，主站、文化与去处已上线；向导站证书/DNS 与真实旧客户端、实体设备/读屏仍未完成。**

## 1. 内容与双语

- 167 条记录 / 84 个实体；166 条发布，1 条 `drink-style:other` 草稿仅用于旧子分类映射，不发布。
- 83 个公开实体全部中英双语；译文由项目 AI 自写并自检，保留 `translation_of`、源文件散列和 `translation_status: reviewed`。
- `npm run validate`：0 errors / 0 warnings；`npm run check:catalogs`：0 errors。
- `qa:translations`：14/14，覆盖 83/83 配对、来源散列、独立来源、英文地址、正文语言、旧站文案、章节结构、数字令牌、正文长度和搜索覆盖。
- 复核中修复：15 个英文风格页压缩合并章节、古井贡酒缺少 `40%–52% ABV`、金巴利/古越龙山百分比写法不一致，以及 15 个风格页在重写时丢失参考文献列表。

## 2. 路由与构建

- 602 条详情：48 条保留目标、554 条停用无目标；17 分类、93 子分类、397 标签。
- `qa:legacy-audit`：14/14；发现并修复 5 条仍指向未发布 `other` 风格页的子分类映射。
- 生产构建：227 HTML / 5,520 links / 0 errors；166 页 / 0 errors；总索引 166 条。
- sitemap 只包含可索引页面；`404`、`search`、`saved`、`review` 等 15 个页面为预期 noindex。
- 无已停用页面残留在 `dist` 或 sitemap；旧 URL 由 `compat.js` 处理，停用记录落到 404。

## 3. 代码与安全

- 四个 Astro 应用 `astro check`：全部 0 errors / 0 warnings / 0 hints。
- `npm audit --audit-level=high`：0 vulnerabilities。
- 未在受版本控制的文件中发现凭据或私钥；没有远程仓库、DNS 或 Pages 凭据被写入。
- Markdown 渲染关闭原始 HTML；保存页的 JSON 脚本已转义 `<`，避免 `</script>` 注入。
- 外部链接未发现缺失 `rel` 的 `target="_blank"`；未发现 `ref:` 字面量、`undefined`、`NaN` 或 `[object Object]` 泄漏到生产 HTML。
- 所有图片均带 `alt` 属性（站点品牌图为空 alt 的装饰图）。

## 4. QA 汇总

| 项目 | 结果 |
| --- | --- |
| 浏览器 | 43/43 |
| 无障碍 | 39/39，0 axe violations |
| 布局矩阵 | 288/288 |
| 性能预算 | 8/8 |
| 收藏流程 | 8/8 |
| 旧地址浏览器测试 | 17/17 |
| 全量旧路由审计 | 14/14 |
| 翻译 QA | 14/14 |
| 旧 SW 退役 | 2/2 |
| 发布快照 | 15/15 |
| 发布演练 | 11/11 |

## 5. 来源链接抽查

- 审计时 64 个唯一来源 URL：大部分返回 2xx；8 个返回 403（站点反爬），5 个在本次网络环境不可达。
- 已替换/移除 4 个不可达或已失效的 URL（萨沃伊、U Fleků、JSSM、McSorley's），古井贡酒官网经 `curl` 复核为 200；当前为 62 个唯一来源 URL。
- 来源 URL 可达性受网络、地区与反爬策略影响，不能作为事实核验的唯一依据；页面仍以来源条目、发布者和访问日期记录为依据。

## 6. 发布标识

- releaseId：`e0fe09d-d00d83ce80b6`
- 站点/内容提交：`e0fe09dbe270b58ec7c6770d63ac60a7d05fe62e`
- 内容树：`d00d83ce80b6a6ba752cf3c97093fc394f59e310447154766725d715473dff95`
- 本地 Git 工作树干净。

## 7. 边界

- 已创建并上传 9 个 `github.com/hejiuorg` 仓库；`hejiu.org`、`culture.hejiu.org`、`atlas.hejiu.org` 已服务新站。
- `guide.hejiu.org` 内容已上线，但证书仍为 `*.github.io`；需要 Cloudflare DNS 调整或等待 GitHub 证书签发。
- 没有 Cloudflare API 权限，未修改 DNS；没有实体手机/平板、真实读屏软件或真实旧缓存客户端测试。
- 来源可达性抽查不等于逐条事实核验；如未来引入外部编辑，可按 `qa:translations` 和 `qa:legacy-audit` 继续扩展。
