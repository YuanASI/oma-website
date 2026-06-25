---
title: "给 Vercel AI SDK 应用加上多智能体编排"
description: "给现有的 Vercel AI SDK 应用加上多智能体编排：AI SDK 负责流式输出 token、对接模型，open-multi-agent 的 runTeam() 负责拆解目标、协调各个智能体——两者共用同一个 Next.js API 路由。"
pubDate: 2026-04-15
tags: ["ai","nextjs","webdev","typescript"]
readingMinutes: 7
---
我最近撞了堵墙。手上有个能跑的 AI SDK 应用——`streamText`、`useChat`，一整套都在——然后我需要它做一件单个智能体做不到的事：让一个智能体研究某个主题，再把研究结果交给第二个智能体来写作。

这事你可以手动做。把两次 `generateText` 调用粘起来，把上下文传来传去，再处理好出错的情况。但一旦你想要一个协调器来决定哪些任务按什么顺序跑，或者要三个智能体共享状态，你就开始在写编排基础设施了。我不想写编排基础设施。

于是我把 [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)（OMA）接进了一个 Next.js API 路由、放在 AI SDK 旁边，结果两个库配合得挺好。下面是怎么做的。

## 两个库各自的位置

AI SDK 和 OMA 干的是不同的活，重叠不多。

| | Vercel AI SDK | open-multi-agent |
|---|---|---|
| **它是什么** | LLM 调用层 + 流式 UI | 多智能体编排框架 |
| **核心强项** | 60+ 提供方的统一 API、`useChat`、`streamText`、结构化输出 | `runTeam()`——自动拆解任务、并行执行、共享内存 |
| **智能体模型** | 带工具循环的单智能体（`ToolLoopAgent`） | 协调器模式下的一组智能体 |
| **流式** | 一等公民（`toUIMessageStreamResponse`） | 非流式原生（批量出结果） |
| **生态** | 23,400+ GitHub stars、10M+ 周下载 | 5,700+ GitHub stars、3 个运行时依赖 |

AI SDK 对接模型、流式输出 token。OMA 坐在它上面一层：给定一个目标和一组智能体，它把目标拆成任务、按依赖顺序跑、再收集结果。两者可以共用同一个 API 路由。

## 我们要搭什么

一个 Next.js 聊天应用。用户输入一个主题，两个智能体协作产出一篇有研究支撑的文章，结果通过 `useChat` 流式回传。

```plaintext
Browser (useChat)
    |
    v
POST /api/chat
    |
    +-- Phase 1: OMA runTeam()
    |     coordinator decomposes goal
    |     -> researcher agent gathers info
    |     -> writer agent drafts article
    |     (shared memory passes context between agents)
    |
    +-- Phase 2: AI SDK streamText()
    |     streams the team's output to the browser
    |
    v
useChat renders streamed response
```

阶段一：OMA 跑这个团队。一个协调器智能体（由 `runTeam` 自动创建）分析目标、产出一份任务计划、再执行它。researcher 的产出落进共享内存，于是 writer 能引用它。

阶段二：协调器的最终产出被接进 AI SDK 的 `streamText`，再通过 `useChat` 流式送到浏览器。这就是 OMA 的批量产出和 AI SDK 流式协议之间的桥。

## 第 1 步：项目搭建

```bash
mkdir with-vercel-ai-sdk && cd with-vercel-ai-sdk
```

**package.json**：

```json
{
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "@ai-sdk/openai-compatible": "^2.0.0",
    "@ai-sdk/react": "^3.0.0",
    "@open-multi-agent/open-multi-agent": "^1.1.0",
    "ai": "^6.0.0",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

这里用 `@ai-sdk/openai-compatible`，是因为这个 demo 指向 DeepSeek。如果你直接用 Anthropic 或 OpenAI，把它换成它们各自的提供方包就行。

```bash
npm install
```

## 第 2 步：后端

一个 API 路由，两个阶段。有意思的地方在于这套集成需要的胶水代码有多少。

**app/api/chat/route.ts**：

```typescript
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { OpenMultiAgent } from '@open-multi-agent/open-multi-agent'
import type { AgentConfig } from '@open-multi-agent/open-multi-agent'

export const maxDuration = 120

// --- Provider setup (swap this for your preferred LLM) ---
const BASE_URL = 'https://api.deepseek.com'
const MODEL = 'deepseek-chat'

const provider = createOpenAICompatible({
  name: 'deepseek',
  baseURL: `${BASE_URL}/v1`,
  apiKey: process.env.DEEPSEEK_API_KEY,
})

// --- Agent definitions ---
const researcher: AgentConfig = {
  name: 'researcher',
  model: MODEL,
  provider: 'openai',
  baseURL: BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
  systemPrompt: `You are a research specialist. Given a topic, provide thorough,
factual research with key findings, relevant data points, and important context.
Be concise but comprehensive. Output structured notes, not prose.`,
  maxTurns: 3,
  temperature: 0.2,
}

const writer: AgentConfig = {
  name: 'writer',
  model: MODEL,
  provider: 'openai',
  baseURL: BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
  systemPrompt: `You are an expert writer. Using research from team members
(available in shared memory), write a well-structured, engaging article
with clear headings and concise paragraphs.`,
  maxTurns: 3,
  temperature: 0.4,
}
```

OMA 里的 `provider: 'openai'` 意思是「用 OpenAI 兼容的 chat completions API」。它能配 DeepSeek、Ollama、Together，或任何说这套协议的服务。

接着是请求处理器：

```typescript
function extractText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const lastText = extractText(messages.at(-1)!)

  // --- Phase 1: OMA multi-agent orchestration ---
  const orchestrator = new OpenMultiAgent({
    defaultModel: MODEL,
    defaultProvider: 'openai',
    defaultBaseURL: BASE_URL,
    defaultApiKey: process.env.DEEPSEEK_API_KEY,
  })

  const team = orchestrator.createTeam('research-writing', {
    name: 'research-writing',
    agents: [researcher, writer],
    sharedMemory: true,
  })

  const teamResult = await orchestrator.runTeam(
    team,
    `Research and write an article about: ${lastText}`,
  )

  const teamOutput =
    teamResult.agentResults.get('coordinator')?.output ?? ''

  // --- Phase 2: Stream result via Vercel AI SDK ---
  const result = streamText({
    model: provider(MODEL),
    system: `You are presenting research from a multi-agent team.
The team has already done the work. Relay their output faithfully
in a well-formatted way.

## Team Output
${teamOutput}`,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
```

`runTeam()` 内部干的事：

1. 一个**协调器**智能体收到目标，外加智能体清单
2. 它产出一份 JSON 任务计划——任务、分派、依赖边
3. OMA 的 `TaskQueue` 对计划做拓扑排序。相互独立的任务并行跑；有依赖的任务等着。
4. 每个智能体把自己的产出写进 `SharedMemory`，于是 writer 能看到 researcher 找到了什么
5. 协调器把所有东西综合成一份最终产出

你定义智能体和一个目标。协调器决定任务图。

## 第 3 步：前端

AI SDK v6 的 `useChat` 负责流式。有几处从 v3 改过的地方把我绊了一下：不再有内置的 `handleSubmit` 或 `input` 状态了，消息用 `parts` 而不是一个 `content` 字符串。`isLoading` 布尔值也没了——换成了一个 `status` 字段，带四种状态（`'ready'`、`'submitted'`、`'streaming'`、`'error'`）。

**app/page.tsx**：

```tsx
'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'

export default function Home() {
  const { messages, sendMessage, status, error } = useChat()
  const [input, setInput] = useState('')

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input
    setInput('')
    await sendMessage({ text })
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      <h1>Research Team</h1>

      {messages.map((m) => (
        <div key={m.id} style={{ marginBottom: 24 }}>
          <strong>{m.role === 'user' ? 'You' : 'Research Team'}</strong>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {m.parts
              .filter(
                (p): p is { type: 'text'; text: string } =>
                  p.type === 'text',
              )
              .map((p) => p.text)
              .join('')}
          </div>
        </div>
      ))}

      {isLoading && status === 'submitted' && (
        <p>Agents are collaborating -- this may take a minute...</p>
      )}

      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a topic to research..."
          disabled={isLoading}
          style={{ flex: 1, padding: '10px 14px' }}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </main>
  )
}
```

## 第 4 步：跑起来

```bash
export DEEPSEEK_API_KEY=sk-...
npm run dev
```

打开 `http://localhost:3000` 试一个主题。

![Entering a topic in the chat UI -- agents are collaborating](/blog/vercel-ai-sdk-1.png)

OMA 的编排阶段要花 30-60 秒（协调器规划 + 两个智能体顺序跑），然后流式阶段启动，文章会一个 token 一个 token 地出来。



![The streamed article output produced by the researcher and writer agents](/blog/vercel-ai-sdk-2.png)
![The streamed article output produced by the researcher and writer agents](/blog/vercel-ai-sdk-3.png)


有个坑：`@ai-sdk/openai` v2 默认走 OpenAI 新的 Responses API（`/responses` 端点）。如果你的提供方不支持它（多数现在还不支持），就改用 `@ai-sdk/openai-compatible`，或者显式调 `provider.chat('model-name')` 而不是 `provider('model-name')`。我在这上面烧掉了大概 20 分钟。

## 底层发生了什么

完整的请求生命周期：

1. `useChat` 带着消息历史 POST 到 `/api/chat`
2. `runTeam()` 启动。协调器智能体收到目标。
3. 协调器通过一次 LLM 调用产出一份任务计划（带任务、分派、依赖的 JSON）
4. `TaskQueue` 对任务做拓扑排序
5. researcher 智能体跑起来，产出进 `SharedMemory`
6. writer 智能体跑起来（从共享内存读 researcher 的产出），产出文章
7. 协调器综合出最终产出
8. `streamText()` 接过那份产出，通过 AI SDK 的线缆协议流式发出
9. `useChat` 在浏览器里渲染这些 token

第 3-7 步发生在 `runTeam()` 内部。那正是 OMA 体现价值的地方——你声明智能体和一个目标，它来处理拆解、排序和状态传递。

## 什么时候用哪个

**单用 AI SDK** 能搞定大多数单智能体的活：聊天机器人、RAG、工具调用智能体、结构化抽取。如果一个智能体在一轮对话循环里就能把活干完，那加 OMA 只是平添复杂度。

**该加 OMA 的时候**是你需要多个智能体协作——研究 + 写作的团队、多视角代码评审、扇出式数据采集，任何一个智能体的产出要喂给另一个、而且那张依赖图你又不想写死的场景。

权衡总归是有的，每个库都有：

| | AI SDK | OMA |
|---|---|---|
| 提供方支持 | 60+（官方 + 社区） | Anthropic、OpenAI 兼容、Gemini、Grok |
| 开发者工具 | 内置 DevTools、Telemetry 集成 | `onProgress` / `onTrace` 回调 |
| 社区 | 庞大（10M+ 周下载） | 较小（5,700+ stars） |
| 成熟度 | 多年生产使用 | 更新，迭代快 |

OMA 的强项是编排专属的：自动拆解任务、依赖 DAG、共享内存、用信号量做并发控制。它的提供方覆盖和工具生态更薄。这要不要紧，取决于你的项目。

## 完整示例

可运行的代码在 open-multi-agent 仓库里：


[github.com/open-multi-agent/open-multi-agent/tree/main/packages/core/examples/integrations/with-vercel-ai-sdk](https://github.com/open-multi-agent/open-multi-agent/tree/main/packages/core/examples/integrations/with-vercel-ai-sdk)

克隆下来，设好你的 API key，`npm install && npm run dev`。

如果多智能体编排对你还很新，[单智能体示例](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/single-agent.ts)可能是个更好的起点。
