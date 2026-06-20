# oma-website — 项目层 CLAUDE.md

> 继承全局 `/Users/jack/CLAUDE.md` + DEV 层 `/Users/jack/DEV/CLAUDE.md`。这里只放**本项目独有**的架构上下文与覆盖，不重复上层规则。

## 这是什么

open-multi-agent 的官网 + 文档站，部署在 **open-multi-agent.com**。Astro 6 + Starlight：Starlight 渲染**文档**，自定义 Astro 页面渲染 **landing / blog / `/examples` / `/showcase`**。

**这不是框架本体** —— 框架在 `open-multi-agent/open-multi-agent` 仓库，发布为 `@open-multi-agent/core`。本仓库只是站点，别把框架代码改动塞这里。

## 技术栈 / 命令

- **Node 22 + pnpm 10**（CI 锁定版本，本地对齐；无 `.nvmrc`/`engines`，靠这条记着）。
- `pnpm dev` → `localhost:4321` 热重载｜`pnpm build` → 产物 `./dist`｜`pnpm preview`。
- **唯一 CI 闸是 `pnpm build`**：跑构建期 GitHub 抓取，并 catch TS / import / ESM / content-collection 错误。没有单独的 lint/test。

## 关键文件 / 入口

- `astro.config.mjs` — 站点配置、侧边栏 IA、`redirects`（`/github`→repo）、`sitemap`、Expressive Code 主题。
- `src/pages/index.astro` — landing；hero 渲染**真实 OMA run**（`src/data/hero-run.json`，硬约束：不是 mockup）。
- `src/lib/site.ts` — 站点常量（REPO/FORGE/NPM）+ `ghStats()` 构建期抓 GitHub 数据。
- `src/lib/examples.ts` / `showcase.ts` — `/examples`、`/showcase` 的构建期数据源。
- `src/content/docs/` — Starlight 文档；`src/content/blog/` — 从 dev.to 迁移的博客。
- `src/styles/tokens.css` — 设计 token 唯一真源（→ `starlight-theme.css`，dark-first）。
- `scripts/` — `capture-hero-dag` / `migrate-devto-blog` / `sync-reference-docs`，按需或 CI 跑，不进 `pnpm build`。

## 本项目特有纪律（覆盖/补充 DEV 层）

- **数字一律不写死**：stars/forks/contributors、examples 清单、showcase 全部构建期实时抓取 + magnitude fallback。永远不手填精确数字当声明（红线 §7）。
- **Reference 是 vendored，别在本仓库直接改正文**：`src/content/docs/reference/` 从框架 `main` 自动同步（`.github/workflows/sync-reference.yml` 周一 06:17 UTC 开 PR）。要改 Reference 先改上游框架仓库再 re-vendor，否则下次同步覆盖你的改动、且造成 drift。**Getting Started + Guides 才是本仓库直接维护的。**
- **本地 build 设 `GITHUB_TOKEN`**：否则 `/examples` + landing 数字走 fallback（GitHub 未认证 IP 限流）。`GITHUB_TOKEN=… pnpm build`。详见 memory `project_oma_website_build_github_token`。
- **改 code-block 配色先清缓存**：`rm -rf node_modules/.astro .astro`（Astro 渲染缓存按源内容 key，不按 `astro.config.mjs`，否则发旧样式 / 404）。
- **发布过 guard 的细节**见 memory `reference_oma_website_publish_guard`（本仓库 commit/push/PR 的 grant 与 footgun）。
