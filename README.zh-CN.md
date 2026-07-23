# Open Multi-Agent 官网

[English](README.md) | [简体中文](README.zh-CN.md)

这是 [Open Multi-Agent](https://github.com/open-multi-agent/open-multi-agent) 的官方网站、文档中心和示例浏览器。Open Multi-Agent 是一个 TypeScript 多智能体框架，可以将目标自动拆解为任务 DAG，并行执行互不依赖的工作。

[访问官网](https://open-multi-agent.com) · [中文站点](https://open-multi-agent.com/zh/) · [开发文档](https://open-multi-agent.com/zh/getting-started/introduction/) · [框架仓库](https://github.com/open-multi-agent/open-multi-agent) · [npm](https://www.npmjs.com/package/@open-multi-agent/core)

![Open Multi-Agent 网站预览](public/github-social.png)

> 本仓库包含的是**网站源码**，不是框架运行时。如果你希望安装 Open Multi-Agent 或参与框架开发，请前往 [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent)。

## 这个项目是什么

这个网站是 Open Multi-Agent 面向公众的统一入口，帮助开发者理解框架、判断它是否适合自己的场景，并从想法快速走向可运行的代码。

网站包含：

- 围绕真实 `runTeam()` 任务 DAG 构建的产品介绍
- 入门指南和完整的框架参考文档
- 可以直接浏览 TypeScript 源码的可运行示例
- 架构说明、解决方案、集成方式和框架对比
- 社区项目、生产实践和技术文章
- 完整的英文与简体中文体验

它将项目介绍、学习资料和技术评估整合在一个静态生成的网站中，避免营销页面、文档和代码示例彼此割裂。

## 技术栈

- [Astro](https://astro.build)：网站开发与静态生成
- [Starlight](https://starlight.astro.build)：文档系统
- TypeScript：组件、内容工具和多语言字段一致性检查
- Markdown 内容集合：开发文档与博客
- GitHub Actions：持续验证和上游数据同步

## 本地开发

环境要求：**Node.js 22** 和 **pnpm 10**。

```bash
pnpm install
pnpm dev
```

开发服务器默认运行在 [http://localhost:4321](http://localhost:4321)。

提交 Pull Request 前，请运行与 CI 相同的核心检查：

```bash
pnpm check
pnpm build
```

在本地预览生产构建：

```bash
pnpm preview
```

构建网站不需要 GitHub Token。仓库统计数据和示例清单来自已提交的数据快照，因此本地构建和生产构建具有确定性，不依赖 GitHub API 的实时响应。

## 项目结构

```text
src/
├── components/        导航、页脚、CTA 和设计系统基础组件
├── content/
│   ├── docs/          基于 Starlight 的中英文开发文档
│   └── blog/          英文文章与中文翻译
├── data/              真实运行记录和同步的 GitHub 数据快照
├── i18n/              类型安全的 UI 语言字典和本地化工具
├── layouts/           页面公共布局与元数据
├── lib/               示例、集成、解决方案、框架对比和站点数据
├── pages/             本地化首页、示例、博客及文档辅助页面路由
└── styles/            设计令牌和页面主题
scripts/               内容同步、快照刷新、翻译和资源处理工具
public/                Logo、社交分享图、架构图、媒体文件和爬虫配置
```

## 内容与数据模型

网站明确区分由本仓库维护的内容，以及由框架仓库负责的内容：

- **入门指南与使用指南**直接在本仓库编写和维护。
- **参考文档**从框架仓库同步，确保 API 文档与已发布的软件包保持一致。
- **示例和仓库统计数据**来自自动化任务定期刷新的已提交快照，构建过程不依赖 GitHub API。
- **首页任务 DAG**来自一次真实的 Open Multi-Agent 运行，不是手工绘制的演示图。
- **英文是源语言。**中文 UI 字典会逐项检查字段完整性，翻译内容则与英文内容目录保持镜像结构。

翻译规范和工作流程请参阅 [TRANSLATING.md](TRANSLATING.md)。

## 参与贡献

欢迎任何能够改善内容清晰度、准确性、无障碍体验、性能或学习路径的贡献。

修改网站时，请遵循以下规则：

1. 保持英文和中文 UI 字典同步。
2. 运行 `pnpm check` 和 `pnpm build`。
3. 通过 Pull Request 提交改动，不要直接推送到 `main`。

如果参考文档存在错误，请先在[框架仓库](https://github.com/open-multi-agent/open-multi-agent)中修复，再将更新同步到本仓库，以免网站文档与软件包实现发生偏差。

## 相关项目

- [`open-multi-agent/open-multi-agent`](https://github.com/open-multi-agent/open-multi-agent)：TypeScript 框架及 API 的权威来源
- [`@open-multi-agent/core`](https://www.npmjs.com/package/@open-multi-agent/core)：发布到 npm 的软件包
- [`open-multi-agent/oma-forge`](https://github.com/open-multi-agent/oma-forge)：Open Multi-Agent 生态项目

## 许可证

除下列明确标注的例外外，本仓库原创内容均采用
[Apache License 2.0](LICENSE) 开源。

- 网站代码、脚本、配置、工作流、原创文档、站点文案及原创媒体：
  [Apache License 2.0](LICENSE)
- `src/content/blog/**` 下的文章正文及原创非代码媒体：
  Copyright (c) 2026 Jack Chen. 保留所有权利；代码示例及代码片段仍采用
  Apache-2.0。详见[内容许可边界](CONTENT-LICENSE.md)。
- 从框架仓库同步的 Reference 参考文档：
  [MIT License](REFERENCE-LICENSE.md)

第三方材料及商标仍分别适用其自身条款。
