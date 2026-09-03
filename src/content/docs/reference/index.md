---
title: "Reference"
description: "Every reference page in one list — model and tool configuration, orchestration control, reliability and observability, and the oma CLI."
---

Reference documents the runtime surface: the options, types, and behaviour of each subsystem. It assumes you already have a run working — if you do not, start with [Quick start](/getting-started/quick-start/).

Most of these pages are vendored from the framework repository and refreshed by a scheduled sync, so they track the shipped release rather than being rewritten here by hand.

## Configure models and tools

- [Providers](/reference/providers/) — hosted, cloud, and local models: built-in shortcuts, OpenAI-compatible endpoints, environment variables, and local tool-calling.
- [Tool configuration](/reference/tool-configuration/) — default-deny tool grants, presets and allowlists, the filesystem sandbox, custom tools, and MCP.
- [Structured input](/reference/structured-input/) — pass a complete `LLMMessage` array instead of a string: prior conversation turns, image blocks, runtime validation, and defensive copies.
- [External agents](/reference/external-agents/) — run local processes or ACP coding agents inside a task DAG, with explicit permission, usage, and lifecycle boundaries.

## Control orchestration

- [Execution routing](/reference/execution-routing/) — single-agent or team execution through explicit modes, governance policy, custom routers, and auditable decisions.
- [Task scheduling](/reference/task-scheduling/) — event-driven DAG execution, scheduling strategies, structured requirements and handoffs, priority, and approval modes.
- [Durable approval gates](/reference/durable-approvals/) — suspend a checkpointed run at a plan, round, dispatch, or tool-call gate, decide out of band, and resume from exactly the reviewed content.
- [Consensus](/reference/consensus/) — `runConsensus` proposer-to-judge verification, the per-task verify hook, and the shared token-budget invariant.
- [Model routing](/reference/model-routing/) — opt-in deterministic policy that routes orchestration phases to different models by phase, agent, task role, priority, or leaf.
- [Plan preview & replay](/reference/plan-replay/) — freeze a reviewed task DAG with `createPlanArtifact`, then execute it later with `runFromPlan` without calling the coordinator again.
- [Shared memory](/reference/shared-memory/) — a namespaced key-value store shared across a team, in-process or through a custom `MemoryStore` backend.

## Operate reliably

- [Observability](/reference/observability/) — TraceRecord v2 sinks, TraceStore implementations, optional OpenTelemetry export, and the offline post-run Run Viewer.
- [Observability migration](/reference/observability-migration/) — move from `onTrace` to sinks, stores, and OpenTelemetry in reversible stages without changing runtime results.
- [Observability performance](/reference/observability-performance/) — reproducible performance budgets, the benchmark method, and the current release snapshot.
- [Run event journal](/reference/run-journal/) — an opt-in append-only log of what entered the context, which tools ran, and how the plan and task states moved.
- [Checkpoint & resume](/reference/checkpoint/) — opt-in per-run snapshots over any `MemoryStore`: persist task progress and resume after a crash, abort, or restart.
- [Adaptive recovery](/reference/adaptive-recovery/) — revise the not-yet-executed part of a task graph after an outcome, with validated, approvable, append-only plan patches.
- [Context management](/reference/context-management/) — keep long runs under the token ceiling with context strategies, tool-result compression, and cross-provider reasoning.
- [Evaluation](/reference/evaluation/) — version EvalSets and scorers, persist results, gate CI, and sample completed production runs without changing business results.
- [Egress policy](/reference/egress-policy/) — restrict which origins the built-in LLM adapters may reach, intersected across orchestrator, run, and agent scope.

## Command line

- [CLI](/reference/cli/) — the JSON-first `oma` binary for shell and CI: commands, config files, output, and exit codes.

## Elsewhere in the docs

- [Introduction](/getting-started/introduction/), [Quick start](/getting-started/quick-start/), and [Choose a run mode](/getting-started/three-ways-to-run/) cover the first run.
- [Orchestration controls](/guides/orchestration-controls/), [Control costs & budgets](/guides/cost-budget-control/), and [Production checklist](/guides/production-checklist/) cover what to decide before a run reaches production.
