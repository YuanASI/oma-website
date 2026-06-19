---
title: "Adding Multi-Agent Orchestration to a Vercel AI SDK App"
description: "I hit a wall recently. I had a working AI SDK app -- streamText, useChat, the whole thing -- and then..."
pubDate: 2026-04-15
tags: ["ai","nextjs","webdev","typescript"]
devtoUrl: "https://dev.to/jackchenme/adding-multi-agent-orchestration-to-a-vercel-ai-sdk-app-4536"
readingMinutes: 7
---
I hit a wall recently. I had a working AI SDK app -- `streamText`, `useChat`, the whole thing -- and then I needed it to do something that a single agent can't: research a topic with one agent, then hand that research to a second agent for writing.

You can do this manually. Glue two `generateText` calls together, pass context around, handle the error cases. But once you want a coordinator that figures out which tasks to run in what order, or three agents sharing state, you're writing orchestration infrastructure. I didn't want to write orchestration infrastructure.

So I wired [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) (OMA) into a Next.js API route next to the AI SDK, and the two libraries turned out to work well together. This is how.

## Where each library sits

AI SDK and OMA do different jobs. They don't overlap much.

| | Vercel AI SDK | open-multi-agent |
|---|---|---|
| **What it is** | LLM call layer + streaming UI | Multi-agent orchestration framework |
| **Core strength** | Unified API for 60+ providers, `useChat`, `streamText`, structured outputs | `runTeam()` -- auto task decomposition, parallel execution, shared memory |
| **Agent model** | Single agent with tool loop (`ToolLoopAgent`) | Team of agents with coordinator pattern |
| **Streaming** | First-class (`toUIMessageStreamResponse`) | Not streaming-native (batch results) |
| **Ecosystem** | 23,400+ GitHub stars, 10M+ weekly downloads | 5,700+ GitHub stars, 3 runtime deps |

AI SDK talks to models and streams tokens. OMA sits above that: given a goal and a roster of agents, it breaks the goal into tasks, runs them in dependency order, and collects the results. The two can share the same API route.

## What we're building

A Next.js chat app. User types a topic, two agents collaborate on a researched article, the result streams back through `useChat`.

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

Phase 1: OMA runs the team. A coordinator agent (created automatically by `runTeam`) analyzes the goal, produces a task plan, and executes it. The researcher's output lands in shared memory so the writer can reference it.

Phase 2: the coordinator's final output gets piped into AI SDK's `streamText`, which streams it to the browser through `useChat`. This is the bridge between OMA's batch output and AI SDK's streaming protocol.

## Step 1: Project setup

```bash
mkdir with-vercel-ai-sdk && cd with-vercel-ai-sdk
```

**package.json**:

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

We're using `@ai-sdk/openai-compatible` here because the demo points at DeepSeek. If you use Anthropic or OpenAI directly, swap in their provider package instead.

```bash
npm install
```

## Step 2: The backend

One API route, two phases. The interesting part is how little glue code the integration needs.

**app/api/chat/route.ts**:

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

OMA's `provider: 'openai'` means "use the OpenAI-compatible chat completions API." It works with DeepSeek, Ollama, Together, or anything that speaks that protocol.

Now the request handler:

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

What `runTeam()` does internally:

1. A **coordinator** agent receives the goal plus the agent roster
2. It produces a JSON task plan -- tasks, assignments, dependency edges
3. OMA's `TaskQueue` topologically sorts the plan. Independent tasks run in parallel; dependent tasks wait.
4. Each agent writes its output to `SharedMemory`, so the writer can see what the researcher found
5. The coordinator synthesizes everything into a final output

You define agents and a goal. The coordinator decides the task graph.

## Step 3: The frontend

AI SDK v6's `useChat` handles streaming. A few things changed from v3 that tripped me up: there's no built-in `handleSubmit` or `input` state anymore, and messages use `parts` instead of a `content` string. The `isLoading` boolean is gone too -- replaced by a `status` field with four states (`'ready'`, `'submitted'`, `'streaming'`, `'error'`).

**app/page.tsx**:

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

## Step 4: Run it

```bash
export DEEPSEEK_API_KEY=sk-...
npm run dev
```

Open `http://localhost:3000` and try a topic. 

![Entering a topic in the chat UI -- agents are collaborating](/blog/vercel-ai-sdk-1.png)

The OMA orchestration phase takes 30-60 seconds (coordinator planning + two agents running sequentially), then the streaming phase kicks in and you get the article token by token.



![The streamed article output produced by the researcher and writer agents](/blog/vercel-ai-sdk-2.png)
![The streamed article output produced by the researcher and writer agents](/blog/vercel-ai-sdk-3.png)


One gotcha: `@ai-sdk/openai` v2 defaults to OpenAI's new Responses API (`/responses` endpoint). If your provider doesn't support it (most don't yet), use `@ai-sdk/openai-compatible` instead, or call `provider.chat('model-name')` explicitly rather than `provider('model-name')`. Burned about 20 minutes on this.

## Under the hood

The full request lifecycle:

1. `useChat` POSTs to `/api/chat` with the message history
2. `runTeam()` starts. Coordinator agent receives the goal.
3. Coordinator produces a task plan via LLM call (JSON with tasks, assignments, dependencies)
4. `TaskQueue` topologically sorts the tasks
5. Researcher agent runs, output goes to `SharedMemory`
6. Writer agent runs (reads researcher's output from shared memory), produces the article
7. Coordinator synthesizes the final output
8. `streamText()` takes that output and streams it through AI SDK's wire protocol
9. `useChat` renders the tokens in the browser

Steps 3-7 happen inside `runTeam()`. That's where OMA earns its keep -- you declare agents and a goal, it handles decomposition, ordering, and state passing.

## When to use what

**AI SDK alone** handles most single-agent work: chatbots, RAG, tool-calling agents, structured extraction. If one agent can finish the job in a single conversation loop, adding OMA would just be extra complexity.

**Add OMA when** you need agents collaborating -- research + writing teams, multi-perspective code review, fan-out data collection, anything where one agent's output feeds into another and the dependency graph isn't something you want to hardcode.

Trade-offs, since every library has them:

| | AI SDK | OMA |
|---|---|---|
| Provider support | 60+ (official + community) | Anthropic, OpenAI-compatible, Gemini, Grok |
| DevTools | Built-in DevTools, Telemetry integration | `onProgress` / `onTrace` callbacks |
| Community | Massive (10M+ weekly downloads) | Smaller (5,700+ stars) |
| Maturity | Years of production use | Newer, iterating fast |

OMA's strengths are orchestration-specific: automatic task decomposition, dependency DAGs, shared memory, concurrency control with semaphores. Its provider coverage and tooling ecosystem are thinner. Whether that matters depends on your project.

## Full example

The working code is in the open-multi-agent repo:


[github.com/open-multi-agent/open-multi-agent/tree/main/examples/with-vercel-ai-sdk](https://github.com/open-multi-agent/open-multi-agent/tree/main/examples/with-vercel-ai-sdk)

Clone it, set your API key, `npm install && npm run dev`.

If multi-agent orchestration is new to you, the [single-agent example](https://github.com/open-multi-agent/open-multi-agent/blob/main/examples/01-single-agent.ts) might be a better starting point.
