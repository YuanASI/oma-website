---
title: Production Checklist
description: "The v1.13 controls to wire up before going live — routing, dispatch, budgets, timeouts, recovery, evidence, redaction, and tool grants."
---

Before going live, wire up the controls that protect token spend, recover from failure, and let you debug.

| Concern | Knob | Where it lives |
|---------|------|----------------|
| Make topology intentional | Explicit `mode`, a declared governance role DAG, or an `ExecutionRouter`; inspect `routingDecision` | `RunTeamOptions` / `OrchestratorConfig` |
| Control task dispatch | Event-driven scheduling by default; use `onTaskDispatch` for per-task approval, or `onApproval` for legacy batch rounds (not both) | `OrchestratorConfig` |
| Bound the conversation | `maxTurns` per agent + `contextStrategy` (`sliding-window` / `summarize` / `compact` / `custom`) | `AgentConfig` |
| Bound wall-clock time | `callTimeoutMs` per model call + `timeoutMs` per agent run | `AgentConfig` |
| Cap tool output | `maxToolOutputChars` (or per-tool `maxOutputChars`) + `compressToolResults: true` | `AgentConfig` and `defineTool()` |
| Recover from failure | Per-task `maxRetries`, `retryDelayMs`, `retryBackoff` (exponential multiplier) | Task config used via `runTasks()` |
| Survive a crash or restart | `checkpoint` (opt-in per-run snapshots) + `orchestrator.restore()` to resume | `OrchestratorConfig` / per-call |
| Bound model spend | `maxTokenBudget`, or `maxCostBudget` with a caller-owned `estimateCost` function | `OrchestratorConfig` |
| Catch stuck agents | `loopDetection` with `onLoopDetected: 'terminate'` (or a custom handler) | `AgentConfig` |
| Trace and audit | Persist traces in a `TraceStore`; derive `buildExecutionReceipt(result, trace)`; export an offline `renderRunViewer({ result, run })` | `OrchestratorConfig` / post-run |
| Redact telemetry | Detected credentials are removed from trace and viewer display fields on a **best-effort** basis; apply a sink policy before export | built-in + your telemetry sink |
| Redact persisted state | Checkpoints and shared-memory values are not covered by telemetry redaction; wrap the durable store in `RedactingStore` when secrets may be written | `MemoryStore` / checkpoint store |
| Prove required review | Check `governanceConclusion` after a `governanceIntent: 'required'` run; runtime `success` does not mean governance succeeded | `TeamRunResult` |
| Grant tools deliberately | Built-in tools are opt-in (default-deny): an agent gets only what it lists in `tools` / `toolPreset`; list neither and it gets none. `bash` stays unsandboxed once granted, and every tool result is sent to your model provider — so grant read/exec access on purpose. `defaultToolPreset` restores the old "all tools" behavior in one line | `AgentConfig` / `OrchestratorConfig` |
| Bound filesystem reach | `cwd` / `defaultCwd` (default `.agent-workspace` subdir; widen with `process.cwd()`, disable with `null`) | `AgentConfig` / `OrchestratorConfig` |

The deep dives cover [Execution Routing](/reference/execution-routing/),
[Task scheduling and dispatch](/reference/task-scheduling/), [cost and budget
controls](/guides/cost-budget-control/), [context
management](/reference/context-management/), [tool
configuration](/reference/tool-configuration/), [observability and execution
receipts](/reference/observability/), and [checkpoint and
resume](/reference/checkpoint/).

:::tip[Taking this to production?]
open-multi-agent is MIT-licensed and free to self-host. If you'd rather have it delivered, integrated, or supported on a timeline, [元定义科技 (YuanASI)](https://yuanasi.com/en) offers commercial delivery and support.
:::
