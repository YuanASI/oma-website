---
title: 快速开始
description: "无需 API Key，大约五分钟跑通一个真实的 OMA 任务 DAG，然后把 Starter 切换到真实模型。"
---

:::tip[你将完成什么]
你会创建一个项目，用脚本化模型响应驱动真实的 OMA 调度器，并打开生成的 Markdown、JSON 和 HTML 报告。第一次运行不需要 API Key，也不会请求模型。
:::

## 开始之前

- Node.js 18 或更高版本
- 可以通过 npm 下载生成项目所需的依赖
- 大约五分钟

第一次运行**不需要**模型提供方账号或 API Key。

## 1. 创建 Starter

```bash
npm create oma-app@latest my-oma
```

交互式脚手架会询问 Starter 和运行方式。第一次体验调度流程，建议选择 **Multi-agent DAG Demo**；PR Review 和 Security Analysis Starter 则在更具体的工作流里展示同一套运行时。

## 2. 等待免 Key Demo 完成

交互式命令会自动安装依赖并运行 `npm run demo`。脚本化模型响应会驱动真实的任务调度、并行执行、结果聚合、报告生成器和离线 Run Viewer。

Demo 不会读取模型凭证，也不会发起模型请求。安装项目时仍会从 npm 下载依赖；生成的每份报告都会明确标注模型响应属于模拟数据。

以后要重新运行同一个 Demo：

```bash
cd my-oma
npm run demo
```

## 3. 确认运行结果

一次成功的运行会用三种方式展示同一条执行记录：

- **终端进度**显示任务何时开始、完成，以及依赖满足后如何解锁。
- `reports/` 下的 **Markdown 和 JSON 报告**便于阅读或交给程序处理。
- **HTML 报告**会打开离线 Run Viewer，用来检查实际执行的任务 DAG 和任务级证据。

到这里，你已经运行了真实的 OMA 编排；只有模型响应来自脚本。

## 4. 切换到真实模型

Cloud 或 OpenAI-compatible Starter：

```bash
cp .env.example .env
# 在 .env 中填写凭证和模型配置，然后：
npm run dev
```

Ollama Starter 会连接本地 Ollama 服务，不需要云端 API Key；脚手架不会替你下载模型。环境变量、兼容端点和本地工具调用说明见[模型提供方](/zh/reference/providers/)。

## 接入已有项目

如果已经有 TypeScript 后端，可以直接安装核心库：

```bash
npm install @open-multi-agent/core
```

然后定义一个小团队并给出目标：

```typescript
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'

const model = process.env.OMA_MODEL ?? 'gpt-5.4'
const agents: AgentConfig[] = [
  { name: 'researcher', model, systemPrompt: '找出重要事实。' },
  { name: 'writer', model, systemPrompt: '把事实整理成简洁简报。' },
]

const oma = new OpenMultiAgent({ defaultProvider: 'openai', defaultModel: model })
const team = oma.createTeam('brief-team', { name: 'brief-team', agents })
const result = await oma.runTeam(team, '为我们的新 API 生成一份发布简报。')

console.log(result.success)
```

内置工具默认拒绝。只授予每个智能体确实需要的工具；添加文件系统或 shell 权限前，请先阅读[工具配置](/zh/reference/tool-configuration/)。

## 控制脚手架后续动作

```bash
# 只生成文件，不安装依赖，也不运行 Demo。
npm create oma-app@latest my-oma -- --no-install

# 安装依赖，但不运行 Demo。
npm create oma-app@latest my-oma -- --no-run
```

从 `@jackchen_me/open-multi-agent` 迁移？该包已弃用，请改装 `@open-multi-agent/core`。

## 接下来去哪里

- [选择运行方式](/zh/getting-started/three-ways-to-run/)：在 `runAgent()`、`runTeam()` 和 `runTasks()` 之间做选择。
- [示例](/zh/examples/)：运行或改造完整工作流。
- [模型提供方](/zh/reference/providers/)：配置托管、OpenAI-compatible 或本地模型。
