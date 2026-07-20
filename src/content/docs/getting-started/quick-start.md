---
title: Quick Start
description: "Run a real OMA task DAG in about five minutes with no API key, then switch the starter to a real model."
---

:::tip[What you will finish]
You will scaffold a project, exercise the real OMA scheduler with scripted model responses, and open the generated Markdown, JSON, and HTML reports. The first run needs no API key and makes no model request.
:::

## Before you start

- Node.js 18 or newer
- npm access to download the generated project's dependencies
- About five minutes

You do **not** need a provider account or API key for the first run.

## 1. Create a starter

```bash
npm create oma-app@latest my-oma
```

The interactive scaffolder asks for a starter and runtime. For the clearest introduction to scheduling, choose **Multi-agent DAG Demo**. The PR Review and Security Analysis starters show the same runtime in more opinionated workflows.

## 2. Let the no-key demo run

The interactive command installs dependencies and runs `npm run demo` automatically. Scripted model responses drive the real task scheduler, parallel execution, aggregation, report writers, and offline Run Viewer.

The demo does not read a provider credential or make a model request. Installing the project still downloads packages from npm, and every generated report identifies the model responses as simulated.

To run the same demo again:

```bash
cd my-oma
npm run demo
```

## 3. Check the result

A successful run gives you three views of the same execution:

- **Terminal progress** shows tasks starting, completing, and unblocking after their dependencies.
- **Markdown and JSON reports** under `reports/` make the result easy to read or process.
- **The HTML report** opens the offline Run Viewer, where you can inspect the executed task DAG and task-level evidence.

At this point you have exercised real OMA orchestration. Only the model responses were scripted.

## 4. Switch to a real model

For a cloud or OpenAI-compatible starter:

```bash
cp .env.example .env
# Add your credential and model configuration to .env, then:
npm run dev
```

An Ollama starter uses your local Ollama service instead and needs no cloud API key. The scaffolder never downloads a model for you. See [Providers](/reference/providers/) for environment variables, compatible endpoints, and local tool-calling guidance.

## Add OMA to an existing project

If you already have a TypeScript backend, install the library directly:

```bash
npm install @open-multi-agent/core
```

Then define a small team and give it a goal:

```typescript
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'

const model = process.env.OMA_MODEL ?? 'gpt-5.4'
const agents: AgentConfig[] = [
  { name: 'researcher', model, systemPrompt: 'Find the important facts.' },
  { name: 'writer', model, systemPrompt: 'Turn the facts into a concise brief.' },
]

const oma = new OpenMultiAgent({ defaultProvider: 'openai', defaultModel: model })
const team = oma.createTeam('brief-team', { name: 'brief-team', agents })
const result = await oma.runTeam(team, 'Produce a launch brief for our new API.')

console.log(result.success)
```

Built-in tools are default-deny. Grant only the tools each agent needs; see [Tool configuration](/reference/tool-configuration/) before adding filesystem or shell access.

## Control what the scaffolder runs

```bash
# Write files only; do not install dependencies or run the demo.
npm create oma-app@latest my-oma -- --no-install

# Install dependencies, but do not run the demo.
npm create oma-app@latest my-oma -- --no-run
```

Migrating from `@jackchen_me/open-multi-agent`? That package is deprecated; install `@open-multi-agent/core` instead.

## Where next

- [Choose a Run Mode](/getting-started/three-ways-to-run/) to decide between `runAgent()`, `runTeam()`, and `runTasks()`.
- [Examples](/examples/) for complete workflows you can run or adapt.
- [Providers](/reference/providers/) to configure hosted, OpenAI-compatible, or local models.
