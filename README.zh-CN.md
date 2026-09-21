# Open Multi-Agent 官网

[English](README.md) | [简体中文](README.zh-CN.md)

这是 [Open Multi-Agent](https://github.com/open-multi-agent/open-multi-agent) 的官方网站与文档中心。Open Multi-Agent 是一个用于构建和运行多智能体系统的自托管 TypeScript 运行时。

[访问官网](https://open-multi-agent.com/) · [中文站点](https://open-multi-agent.com/zh/) · [开发文档](https://open-multi-agent.com/zh/getting-started/) · [示例](https://open-multi-agent.com/zh/examples/) · [框架仓库](https://github.com/open-multi-agent/open-multi-agent) · [npm](https://www.npmjs.com/package/@open-multi-agent/core)

> 本仓库包含的是网站源码，不是框架运行时。框架代码及其权威 API 文档位于 [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent)。

## 仓库内容

这个静态生成的网站将产品介绍、学习路径与技术参考整合为一套完整的双语体验：

- 产品、能力、架构、解决方案、集成、框架对比与案例展示页面
- 由本仓库维护的入门教程和生产实践指南
- 从框架正式版本同步的完整 Reference 参考文档
- 基于已提交、固定到具体 commit 的源码快照生成的 TypeScript 示例浏览器
- 从 GitHub Releases 同步的版本更新记录
- 完整的英文与简体中文路由、元数据、canonical URL 和 `hreflang`
- 博客、RSS、sitemap、结构化数据、`llms.txt` 与 IndexNow 支持
- 基于真实 Open Multi-Agent 运行记录回放的首页任务 DAG

英文站点位于 `/`，简体中文站点位于 `/zh/`。

## 技术栈

- [Astro 7](https://astro.build/)：静态生成与自定义页面
- [Starlight](https://starlight.astro.build/)：文档系统
- TypeScript 与 Astro 内容集合：站点代码和内容契约
- 支持明暗主题的共享设计令牌
- GitHub Actions：CI、数据快照刷新、Reference 同步、版本记录同步与搜索索引提交
- Cloudflare Pages：生产环境托管

## 本地开发

环境要求：Node.js 22，以及 [`package.json`](package.json) 的 `packageManager` 字段固定的 pnpm 版本。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器默认运行在 [http://localhost:4321](http://localhost:4321)。提交改动前运行：

```bash
pnpm check
pnpm build
```

使用 `pnpm preview` 在本地预览生产构建。

普通本地构建不需要 GitHub Token。仓库统计、npm 下载量和示例目录都读取已提交的数据快照，因此上游 API 的短暂故障不会决定网站能否成功构建。

## 仓库结构

```text
src/
├── components/          站点、Starlight 与设计系统共享组件
├── content/
│   ├── blog/            英文文章与简体中文翻译
│   ├── changelog/       从 GitHub Releases 同步的版本记录
│   └── docs/            入门、指南和同步的 Reference 文档
├── data/                真实运行记录与已提交的外部数据快照
├── i18n/                类型安全的 UI 字典和本地化工具
├── layouts/             自定义页面的公共布局与元数据
├── lib/                 路由数据、schema、SEO 工具和内容加载器
├── pages/               本地化自定义路由、RSS 与 404 页面
└── styles/              设计令牌与页面主题
scripts/                 校验、同步、迁移和运行记录采集工具
public/                  静态资源、重定向、爬虫文件与媒体
.github/workflows/       CI 与定时同步工作流
```

## 内容归属与同步边界

- `src/content/docs/getting-started/` 和 `src/content/docs/guides/` 由本仓库直接维护。
- `src/content/docs/reference/` 从框架仓库同步。实质性错误应先在上游修复，再运行 Reference 同步工作流。
- `src/content/changelog/` 来自已发布的 GitHub Releases。应在上游修正 release 正文，而不是直接修改这里的同步文件。
- `src/data/gh-stats.json`、`src/data/examples.json` 和 `src/data/examples-source.json` 由定时自动化刷新，并以经过校验的快照形式提交。
- `src/data/hero-run.json` 和 `src/data/hero-run.zh.json` 是采集得到的真实运行记录。本地化版本必须重新采集，不能手工翻译。
- `src/i18n/en.ts` 是 UI 字典的唯一真源；`src/i18n/zh.ts` 必须逐项保持字段一致。

翻译规范见 [`TRANSLATING.md`](TRANSLATING.md)。从外部渠道新增或修改指向本站的链接前，请先查看 [`ATTRIBUTION.md`](ATTRIBUTION.md)。

## 校验与自动化

`pnpm check` 会校验多语言字段一致性、运行记录 schema 与回放、同步契约、示例信息架构、Reference 导航、页面日期、阅读时长、版本漂移和渠道归因规则。`pnpm build` 会验证完整的静态产物。

定时工作流每六小时刷新数据快照、每周同步 Reference 文档、每日同步版本记录，并在改动进入 `main` 后向 IndexNow 提交线上 sitemap。自动生成的更新会先通过 Pull Request 提交，并在进入生产分支前完成校验。

## 参与贡献

欢迎任何能够改善正确性、清晰度、无障碍体验、性能或学习路径的贡献。请保持中英文改动同步、遵守上述内容归属边界，并执行与改动文件相匹配的校验。安全问题请按照 [`SECURITY.md`](SECURITY.md) 提交。

## 相关项目

- [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent)：框架运行时与权威 API 来源
- [`@open-multi-agent/core`](https://www.npmjs.com/package/@open-multi-agent/core)：发布到 npm 的软件包
- [`open-multi-agent/oma-forge`](https://github.com/open-multi-agent/oma-forge)：生态项目

## 许可证

除下列明确标注的例外外，本仓库原创内容均采用 [Apache License 2.0](LICENSE) 开源。

- 网站代码、脚本、配置、工作流、原创文档、站点文案及原创媒体：[Apache License 2.0](LICENSE)
- `src/content/blog/**` 下的文章正文及原创非代码媒体：Copyright (c) 2026 Jack Chen，保留所有权利；代码示例及代码片段仍采用 Apache-2.0。详见 [`CONTENT-LICENSE.md`](CONTENT-LICENSE.md)。
- 从框架仓库同步的 Reference 参考文档：[MIT License](REFERENCE-LICENSE.md)

第三方材料及商标仍分别适用其自身条款。
