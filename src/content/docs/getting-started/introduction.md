---
title: Introduction
description: "What open-multi-agent is, how goal-first orchestration differs from graph-first frameworks, and how the runtime is structured."
---

`open-multi-agent` is a multi-agent orchestration framework for TypeScript backends. Give it a goal; a coordinator agent decomposes it into a task DAG, parallelizes independents, and synthesizes a typed, schema-validated result. Three runtime dependencies, drops into any Node.js backend.

:::tip[Your engineers describe the goal, not the graph.]
Graph-first frameworks make you enumerate every node and edge up front. `open-multi-agent` is goal-first: you describe the outcome and the coordinator builds the task DAG at runtime, so the orchestration adapts to the goal instead of being hand-wired for one.
:::

Ready to run something? Jump to the [Quick Start](/getting-started/quick-start/).

## How is this different from X?

A quick router; the mechanism breakdown follows.

| If you need | Pick |
|-------------|------|
| Fixed production topology with a mature persistence + time-travel ecosystem | LangGraph JS |
| Full-stack platform, workflows wired by hand | Mastra |
| Python stack with mature multi-agent ecosystem | CrewAI |
| AI app toolkit with broad model-provider support | Vercel AI SDK |
| **TypeScript, goal to result with auto task decomposition** | **open-multi-agent** |

**vs. LangGraph JS.** LangGraph compiles a declarative graph (nodes, edges, conditional routing) into an invokable; OMA runs a Coordinator that decomposes the goal into a task DAG at runtime and auto-parallelizes independents. Same end, opposite directions: graph-first vs goal-first. Both checkpoint and resume — OMA snapshots completed tasks over any `MemoryStore` and resumes after a crash with `restore()` — but LangGraph's persistence ecosystem is deeper, so reach for it when time-travel over durable state history is the deciding factor.

**vs. Mastra.** Both are TypeScript-native; the difference is who drives the orchestration. With Mastra you wire the workflow by hand. OMA is goal-driven: give its Coordinator a goal and it builds the task DAG at runtime, adapting the plan to the goal instead of running a graph you wired step by step. `runTeam(team, goal)` in one call.

**vs. CrewAI.** CrewAI is the mature multi-agent option in Python. OMA targets TypeScript backends with three runtime dependencies and direct Node.js embedding. Roughly comparable orchestration surface; the choice is the language stack.

**vs. Vercel AI SDK.** AI SDK provides the LLM-call layer — provider abstraction, streaming, tool calls, and structured outputs. It does not orchestrate goal-driven multi-agent teams. The two are complementary: AI SDK for app surfaces and single-agent calls, OMA when you need a team.

For a dimension-by-dimension breakdown of a single framework — language, orchestration model, dependencies, budget control, and observability — see the dedicated comparison pages: [vs LangGraph](/compare/langgraph/), [vs CrewAI](/compare/crewai/), [vs AutoGen](/compare/autogen/), and [vs the OpenAI Agents SDK](/compare/openai-agents-sdk/).

## How it works

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenMultiAgent (Orchestrator)                                  │
│                                                                 │
│  createTeam()  runTeam()  runTasks()  runAgent()  getStatus()   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │  Team               │
            │  - AgentConfig[]    │
            │  - MessageBus       │
            │  - TaskQueue        │
            │  - SharedMemory     │
            └──────────┬──────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
┌────────▼──────────┐    ┌───────────▼───────────┐
│  AgentPool        │    │  TaskQueue             │
│  - Semaphore      │    │  - dependency graph    │
│  - runParallel()  │    │  - auto unblock        │
└────────┬──────────┘    │  - cascade failure     │
         │               └───────────────────────┘
┌────────▼──────────┐
│  Agent            │
│  - run()          │    ┌────────────────────────┐
│  - prompt()       │───►│  LLMAdapter            │
│  - stream()       │    │  - 13 built-in         │
└────────┬──────────┘    │    providers           │
         │               │  - OpenAI-compatible   │
         │               │  - AI SDK bridge       │
         │               └────────────────────────┘
┌────────▼──────────┐
│  AgentRunner      │    ┌──────────────────────┐
│  - conversation   │───►│  ToolRegistry        │
│    loop           │    │  - defineTool()      │
│  - tool dispatch  │    │  - 6 built-in tools  │
└───────────────────┘    │  + delegate (opt-in) │
                         └──────────────────────┘
```

The [Quick Start](/getting-started/quick-start/) runs this end to end; [Three Ways to Run](/getting-started/three-ways-to-run/) covers when to reach for `runAgent`, `runTeam`, or `runTasks`.
