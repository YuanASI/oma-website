---
title: "6 Best TypeScript Multi-Agent Frameworks 2026 (Trade-offs)"
description: "LangGraph, Mastra, Vercel AI SDK, OpenAI Agents, AgentKit, Open Multi-Agent: which TypeScript multi-agent framework fits the workflow you own?"
pubDate: 2026-07-31
updatedDate: 2026-09-07
tags: ["typescript", "multi-agent-frameworks", "framework-selection"]
contentType: decision-guide
useCases: ["framework selection", "architecture evaluation"]
industries: ["software"]
evidence:
  kind: source-backed-comparison
  note: "Compares official documentation, re-checked on September 7, 2026, on orchestration surface and workflow fit. Open Multi-Agent claims are checked against core v1.18.0. Popularity, output quality, latency, and cost sit outside its scope. Published by the Open Multi-Agent project."
related:
  solutions: ["goal-driven-orchestration", "vercel-ai-sdk-orchestration"]
  examples: ["team-collaboration", "task-pipeline", "plan-replay"]
  integrations: ["external-agents", "opentelemetry"]
  comparisons: ["langgraph", "mastra", "vercel-ai-sdk", "openai-agents-sdk", "inngest-agentkit"]
featured: true
readingMinutes: 10
---

There is no useful answer to “What is the best TypeScript multi-agent framework?” until you say what kind of work must survive contact with production.

Multi-agent systems in TypeScript are not one shape. A customer-support handoff, a long-running state graph, a streaming agent UI, and a goal that must be decomposed into parallel tasks are four different systems. Treating them as one leaderboard hides the decision that matters: **which runtime model matches the workflow you actually own?**

This guide names six strong options by their clearest fit. It is not a popularity ranking.

## Method and disclosure

This comparison uses official documentation, re-checked on September 7, 2026. A project qualifies when it has a first-class JavaScript or TypeScript surface and an explicit way to compose more than one agent or agentic step. Open Multi-Agent claims are checked against core v1.18.0.

“Best” means the clearest fit for a named operating model, not the most stars, downloads, or social mentions. We did not run a common quality, latency, or cost benchmark, so this guide makes no performance ranking.

This article is published by the Open Multi-Agent project. OMA is included, and that is a conflict readers should see before the recommendations.

Python-first frameworks such as CrewAI are outside this TypeScript shortlist. That is a scope decision, not a judgment that they are worse.

## The short answer

| If your system needs… | Start with… | Why |
| --- | --- | --- |
| An explicit, long-running state graph | **LangGraph.js** | You author nodes, edges, and shared state; persistence and human intervention are core runtime concepts. |
| One TypeScript framework for agents, workflows, memory, evals, and operations | **Mastra** | It bundles a broad application surface instead of stopping at orchestration primitives. |
| Streaming UI and provider-neutral model/tool loops | **Vercel AI SDK** | Its agent and UI primitives sit close to the product interface; you can compose higher-level orchestration in application code. |
| Manager agents, specialist handoffs, guardrails, and built-in tracing | **OpenAI Agents SDK for JS** | Handoffs and agents-as-tools are first-class composition patterns. |
| A router-driven agent network on durable Inngest steps | **AgentKit** | A router selects agents around shared state, while model steps use Inngest execution semantics. |
| Explicit task DAGs **and** runtime goal-to-DAG planning in one local runtime | **Open Multi-Agent** | Run one agent, supply the graph, or let a coordinator generate a reviewable plan — then read back which topology ran and why. |

Treat that as a shortlist. Build one representative workflow before committing.

## 1. LangGraph.js: best for an explicit, durable state graph

[LangGraph’s JavaScript documentation](https://docs.langchain.com/oss/javascript/langgraph/overview) describes a low-level orchestration runtime for long-running, stateful agents. You define a `StateGraph`, its nodes, and its edges. Deterministic code and model-driven steps can live in the same graph.

Its [persistence model](https://docs.langchain.com/oss/javascript/langgraph/persistence) separates thread-scoped checkpoints from cross-thread stores. That supports interruption recovery, human-in-the-loop state changes, time travel, and longer-lived memory.

Choose it when the graph is part of your product logic and your team wants to own every transition. The cost of that control is also the boundary: LangGraph is deliberately low-level, so you are designing the topology rather than asking the runtime to invent one from a goal. That is a property of this package rather than the whole stack — its overview positions LangGraph as the orchestration layer that higher-level agent harnesses are built on top of.

**Representative fit:** an underwriting or operations workflow with known stages, resumable state, and explicit human decision points.

## 2. Mastra: best for a batteries-included TypeScript agent application

[Mastra](https://mastra.ai/) packages agents, typed workflows, memory, a server, observability, datasets, and evaluation in one TypeScript framework. The surface keeps widening: `AgentController` hosts interactive agent applications, and Factory adds a system of agents aimed at taking software from issue to production. Its workflows compose steps sequentially, in parallel, or down conditional branches; its application surface also covers the infrastructure around those workflows.

Choose it when the team wants one opinionated stack and would rather adopt bundled memory, operations, and evaluation than assemble those parts. It is especially relevant when an agent application—not only its scheduler—is the unit you want to build and operate. The framework is Apache-2.0 and self-hostable, and Mastra Cloud is there for teams that would rather not run the server themselves.

The trade-off is surface area. You still author the workflow structure, and you should validate which storage and server components your recovery requirements depend on.

**Representative fit:** a TypeScript product team that wants agents, workflows, memory, traces, and evals under one framework boundary.

## 3. Vercel AI SDK: best for streaming agent experiences

The AI SDK’s [`ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent) is a reusable, multi-step tool loop that can generate or stream output, execute tools, return typed data, and pause for approval — `toolApproval` returns a `tool-approval-request` instead of executing the call. Its broader agent APIs connect naturally to UI message streams and multiple model providers.

Choose it when the hard part of the product is the interaction layer: token streaming, tool events, typed UI messages, and provider portability. A specialist can be exposed as a [subagent](https://ai-sdk.dev/docs/agents/subagents) the parent delegates to through a tool, and application code can coordinate several loops.

Durability arrived separately. [`WorkflowAgent`](https://ai-sdk.dev/docs/agents/workflow-agent), from the `@ai-sdk/workflow` package, makes each tool execution a durable step with automatic retries, so it survives a restart where a `ToolLoopAgent` does not; its install pulls Workflow 5, which ships under the `beta` tag today. That is durability for one agent’s loop. A shared task DAG, dependency scheduling, and recovery across a team of agents are still orchestration you build or layer above the SDK — its own [workflow patterns](https://ai-sdk.dev/docs/agents/workflows) page presents chaining, parallelism, and routing as code you write.

**Representative fit:** a Next.js research assistant whose interface must stream intermediate tool and specialist activity.

## 4. OpenAI Agents SDK for JS: best for managers and handoffs

The [OpenAI Agents SDK orchestration guide](https://openai.github.io/openai-agents-js/guides/multi-agent/) makes two patterns first-class:

- A manager keeps control and calls specialist agents as tools.
- A triage agent hands the conversation to a specialist, which becomes the active agent.

The SDK also provides [guardrails](https://openai.github.io/openai-agents-js/guides/guardrails/) and [built-in tracing](https://openai.github.io/openai-agents-js/guides/tracing/), enabled by default in server runtimes. Other providers’ models come in through an adapter rather than natively, the default tracing setup exports to OpenAI, and tracing is unavailable to organizations operating under a Zero Data Retention policy.

Choose it when conversation ownership is the key abstraction: one manager synthesizes, or one specialist takes over. Read the guardrail boundaries closely, because they are narrower than “attached to an agent” suggests. Input guardrails run only for the first agent in a chain and output guardrails only for the agent that produces the final output, so in a manager or handoff workflow the per-call checks belong in tool guardrails instead. Those cover the function tools you define with `tool()` — not the handoff call itself, not hosted tools, and `agent.asTool()` does not currently expose them.

**Representative fit:** a service desk where a triage agent routes a conversation to billing, refunds, or account support.

## 5. AgentKit: best for a routed network on Inngest

[AgentKit networks](https://agentkit.inngest.com/concepts/networks) combine agents, shared state, and a router. The router chooses the next agent or stops the loop; agents can use different models, and later agents can read results stored in network state.

Its [agent execution documentation](https://agentkit.inngest.com/concepts/agents) says inference steps run through Inngest `step.ai`, which adds automatic retries and cached results for durability.

Choose it when a router-driven network matches the problem and Inngest is already the execution substrate you want; it is still pre-1.0, and it assumes Inngest in your stack. Distinguish that loop from a dependency graph: the router selects what runs next, while an explicit task DAG can make independent branches and their prerequisites visible up front.

**Representative fit:** an event-driven enrichment workflow in an existing Inngest application, with specialists selected from shared state.

## 6. Open Multi-Agent: best for switching between explicit and generated task DAGs

Open Multi-Agent exposes three levels from one TypeScript runtime:

- `runAgent()` for one bounded agent loop.
- `runTasks()` when the application already knows the task DAG.
- [`runTeam()`](/getting-started/quick-start/) when a coordinator should turn a goal into a task DAG at runtime.

The distinguishing property is that moving between them is a decision the runtime records rather than a rewrite. An automatic `runTeam()` call resolves its topology through a documented precedence order — an explicit `mode`, then declared governance, then a per-run `ExecutionRouter`, then the orchestrator's, then the built-in `DeterministicRouter` — and reports the outcome in `result.routingDecision` with the reasons behind it, linked to trace evidence. That is [Execution Routing](/reference/execution-routing/), and it is deliberately separate from [Model Routing](/reference/model-routing/), which picks the model for calls inside whichever topology won.

Governance is declared rather than implied. [`governanceIntent`](/reference/tool-configuration/) with `requiredRoles` and `requiredOrder` states a role path the runtime checks against the executed topology, not against labels in agent prose, and reports `governanceConclusion`. An application may override a declared floor, but that returns `unsatisfied` with reason `overridden` rather than a clean success.

Approval is three hooks at distinct boundaries, not one: `onPlanReady` for the generated plan, `onTaskDispatch` for one ready task, and `onToolCall` for one tool invocation — the last running after input validation and before `execute`, so it inspects the arguments that will run. Tools that cause real side effects are marked `consequential: true`; that classification reads tool grants only and never scans goals, prompts, or model output.

A gate can also answer `{ action: 'suspend' }` rather than decide inline. The request and the first-wins decision then persist beside the checkpoint, `decideApproval()` records who decided, and a hash binds that decision to the exact content reviewed, so `restore()` either resumes on that content or fails rather than inheriting a stale approval. The reviewer does not have to be in the process that asked, or in its lifetime, which is what lets a review outlast a restart. That is [durable approvals](/reference/durable-approvals/).

[Scheduling](/reference/task-scheduling/) is event-driven: a downstream task starts as soon as its own dependencies are satisfied. `dependencyPayload: 'structured'` passes a dependency's validated JSON instead of its prose, and `taskResults` keeps every task's unmerged result addressable by stable ID. Different agents can use different providers, including local OpenAI-compatible endpoints, and model routes support ordered fallbacks. Token and estimated-cost budgets, [traces](/reference/observability/), the offline Run Viewer, versioned [EvalSets](/reference/evaluation/), and [checkpoint](/reference/checkpoint/) recovery all run without a hosted service.

Two newer controls are worth naming with their edges attached. [`egressPolicy`](/reference/egress-policy/) confines framework-owned model traffic: `offline` permits loopback only, `allowlist` permits the origins you name, and orchestrator, run, and agent scopes intersect rather than widen. It covers the built-in adapters OMA constructs itself and fails closed on the ones it cannot guard, which leaves MCP servers, process backends, the built-in shell, and custom tools holding their own network access. Separately, an opt-in append-only [run journal](/reference/run-journal/) records every adapter call and the lineage of each block the model saw, and `verifyRun()` checks a finished journal cold. It detects drift, not tampering: no hash chain, no signature, no write-once storage, so anyone who can edit the file can edit an event and the hash citing it in the same pass.

Choose OMA when the key decision is not merely “one agent or many,” but **who owns the plan for this run, and what evidence remains afterward**. Stable support tickets can use a fixed DAG; variable escalations can use a coordinator without moving to a second framework, and the run itself records which path it took.

Two boundaries are worth stating plainly. The first is what recovery covers. The built-in LLM runner resumes mid-task: snapshots land at safe turn and tool boundaries, a committed tool result is replayed by its model-issued `toolCallId` rather than executed a second time, and turn and token accounting come back with it. Three limits ride along. Process and ACP backends stay task-grained, because they own their private loops and OMA never sees the state inside them. A tool that ran but whose result never reached the store runs again, so an external side effect needs `toolCallId` — or another domain key — as an idempotency key. And the snapshot remains the recovery anchor: the opt-in run journal extends it with a replayable tail and never replaces it, and no released version ships an authoritative run store, so two processes that restore the same snapshot can both advance it. If your requirement is process-independent timers, event waits, or infrastructure-owned durable execution, evaluate a workflow runtime for that.

The second is what the tool gate decides. It is a policy decision, not a process sandbox: it decides whether a call proceeds, not what the tool can reach once it does.

**Representative fit:** research, incident investigation, or operations work where the goal changes, independent investigations should run together, and a human may inspect the plan before execution.

## A better selection test than a leaderboard

Workflow orchestration in TypeScript is easy to shortlist from documentation and hard to choose from it. Take one workflow that matters, implement the smallest end-to-end slice in two candidates, use the same input fixtures, and answer these questions:

1. **Who owns topology?** Is it code, a router, or a planning model?
2. **What is durable?** Messages, graph state, completed tasks, tool calls, timers, or the whole run?
3. **Where can a human intervene?** Before a tool, between nodes, on a generated plan, or only around the final output?
4. **What can you inspect?** State transitions, task dependencies, model calls, tool calls, costs, and retries?
5. **Can you change providers without changing orchestration?**
6. **What infrastructure must stay running for recovery to work?**

Then fail a model call, stop the process mid-run, reject one action, and change one provider. The framework that makes those four events unsurprising — and leaves a record you can read afterward — is usually the better fit.

Questions 1, 3, and 4 are where the candidates differ most, and they are worth answering with an actual run rather than a docs page. "Where can a human intervene?" has a different answer depending on whether the runtime offers one hook or several at distinct boundaries, and "what can you inspect?" has a different answer depending on whether the topology decision itself is recorded or only implied by what happened.

## Sources

- [LangGraph.js overview](https://docs.langchain.com/oss/javascript/langgraph/overview) and [persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [Mastra framework overview](https://mastra.ai/) and [documentation](https://mastra.ai/docs)
- [Vercel AI SDK `ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent), [agent documentation](https://ai-sdk.dev/docs/agents), [subagents](https://ai-sdk.dev/docs/agents/subagents), [`WorkflowAgent`](https://ai-sdk.dev/docs/agents/workflow-agent), and [workflow patterns](https://ai-sdk.dev/docs/agents/workflows)
- [OpenAI Agents SDK orchestration](https://openai.github.io/openai-agents-js/guides/multi-agent/), [guardrails](https://openai.github.io/openai-agents-js/guides/guardrails/), and [tracing](https://openai.github.io/openai-agents-js/guides/tracing/)
- [AgentKit networks](https://agentkit.inngest.com/concepts/networks) and [agents](https://agentkit.inngest.com/concepts/agents)
- [Open Multi-Agent source](https://github.com/open-multi-agent/open-multi-agent), [architecture](/architecture/), and the [checkpoint](/reference/checkpoint/), [durable approvals](/reference/durable-approvals/), [egress policy](/reference/egress-policy/), and [run journal](/reference/run-journal/) references
