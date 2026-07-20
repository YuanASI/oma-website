---
title: Quick Start
description: "Scaffold a project with npm create oma-app, or install the core package and run your first auto-orchestrated team."
---

Requires Node.js >= 18.

The fastest way to see OMA schedule a multi-agent run is the interactive scaffolder:

```bash
npm create oma-app@latest
```

It asks for a project name, starter, and runtime, installs the generated project,
then runs a deterministic local demo. The demo reads no API key and makes no
model request: scripted model responses drive the real OMA scheduler,
aggregation, report writers, and offline Run Viewer. Its Markdown, JSON, and
HTML outputs explicitly identify the model responses as simulated.

Installing the generated project still downloads packages from npm. To control
what the scaffolder does after writing the files:

```bash
# Write the project only; do not install dependencies or run the demo.
npm create oma-app@latest my-oma -- --no-install

# Install dependencies, but do not run the demo.
npm create oma-app@latest my-oma -- --no-run
```

For a real cloud-model run, copy the generated `.env.example` to `.env`, add
your credentials, and run `npm run dev`. An Ollama project uses your local
Ollama service instead and needs no cloud API key.

To add the library to an existing project instead:

```bash
npm install @open-multi-agent/core
```

*Migrating from `@jackchen_me/open-multi-agent`? That package is deprecated; install `@open-multi-agent/core` instead.*

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

## Run an example locally

```bash
git clone https://github.com/open-multi-agent/open-multi-agent && cd open-multi-agent
npm install
export OPENAI_API_KEY=sk-...
npx tsx packages/core/examples/basics/team-collaboration.ts
```

Three agents collaborate on a REST API while `onProgress` streams the coordinator's task DAG:

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

Local models via Ollama need no API key. For hosted providers (`OPENAI_API_KEY`, `GEMINI_API_KEY`, etc.) and local tool-calling, see [Providers](/reference/providers/).

Next: [Three Ways to Run](/getting-started/three-ways-to-run/) covers single agents, auto-orchestrated teams, and explicit pipelines.
