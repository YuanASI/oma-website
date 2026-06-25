---
title: 快速开始
description: "用 npm create oma-app 脚手架一个项目，或安装核心包，跑通你的第一个自动编排团队。"
---

要求 Node.js >= 18。

看一次多智能体运行最快的办法——脚手架一个项目，用一条命令启动：

```bash
npm create oma-app@latest
```

第一次运行会展示协调器把一个目标拆解成多智能体 DAG，然后打开这次运行的仪表盘。如果你想把库加进现有项目：

```bash
npm install @open-multi-agent/core
```

*从 `@jackchen_me/open-multi-agent` 迁移？那个包已弃用；改装 `@open-multi-agent/core`。*

```typescript
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'

// Works with any OpenAI-compatible provider. Set OPENAI_API_KEY for OpenAI, or
// set OPENAI_BASE_URL + OMA_MODEL for Groq, DeepSeek, Ollama, etc.
const model = process.env.OMA_MODEL ?? 'gpt-5.4'

// Built-in tools are opt-in (default-deny): each agent gets only the tools it
// lists in `tools` (or a `toolPreset`). List neither and the agent gets none.
const agents: AgentConfig[] = [
  { name: 'architect', model, systemPrompt: 'Design clean API contracts.', tools: ['file_write'] },
  { name: 'developer', model, systemPrompt: 'Implement runnable TypeScript.', tools: ['bash', 'file_read', 'file_write', 'file_edit'] },
  { name: 'reviewer', model, systemPrompt: 'Review correctness and security.', tools: ['file_read', 'grep'] },
]

const orchestrator = new OpenMultiAgent({
  defaultProvider: 'openai',
  defaultModel: model,
  defaultBaseURL: process.env.OPENAI_BASE_URL, // unset = OpenAI
  onProgress: (event) => console.log(event.type, event.task ?? event.agent ?? ''),
})

const team = orchestrator.createTeam('api-team', { name: 'api-team', agents, sharedMemory: true })

// Built-in filesystem tools default to a `<cwd>/.agent-workspace` sandbox.
const result = await orchestrator.runTeam(
  team,
  `Create a REST API for a todo list in ${process.cwd()}/.agent-workspace/todo-api/`,
)

console.log(result.success, result.totalTokenUsage.output_tokens)
```

## 在本地跑一个示例

```bash
git clone https://github.com/open-multi-agent/open-multi-agent && cd open-multi-agent
npm install
export OPENAI_API_KEY=sk-...
npx tsx packages/core/examples/basics/team-collaboration.ts
```

三个智能体协作构建一个 REST API，与此同时 `onProgress` 流式打印协调器的任务 DAG：

```
agent_start coordinator
task_start design-api
task_complete design-api
task_start implement-handlers
task_start scaffold-tests         // independent tasks run in parallel
task_complete scaffold-tests
task_complete implement-handlers
task_start review-code            // unblocked after implementation
task_complete review-code
agent_complete coordinator        // synthesizes final result
Success: true
Tokens: 12847 output tokens
```

通过 Ollama 运行的本地模型无需 API 密钥。托管的提供方（`OPENAI_API_KEY`、`GEMINI_API_KEY` 等）以及本地工具调用，见[模型提供方](/zh/reference/providers/)。

下一步：[三种运行方式](/zh/getting-started/three-ways-to-run/)讲解单智能体、自动编排团队和显式流水线。
