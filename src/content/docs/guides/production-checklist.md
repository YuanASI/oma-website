---
title: Production Checklist
description: "The controls to wire up before going live — token budget, timeouts, retries, tool-output limits, loop detection, tracing, and tool grants."
---

Before going live, wire up the controls that protect token spend, recover from failure, and let you debug.

| Concern | Knob | Where it lives |
|---------|------|----------------|
| Bound the conversation | `maxTurns` per agent + `contextStrategy` (`sliding-window` / `summarize` / `compact` / `custom`) | `AgentConfig` |
| Bound wall-clock time | `timeoutMs` per agent (aborts a run that hangs, common with local models) | `AgentConfig` |
| Cap tool output | `maxToolOutputChars` (or per-tool `maxOutputChars`) + `compressToolResults: true` | `AgentConfig` and `defineTool()` |
| Recover from failure | Per-task `maxRetries`, `retryDelayMs`, `retryBackoff` (exponential multiplier) | Task config used via `runTasks()` |
| Survive a crash or restart | `checkpoint` (opt-in per-run snapshots) + `orchestrator.restore()` to resume | `OrchestratorConfig` / per-call |
| Hard-cap spend | `maxTokenBudget` on the orchestrator | `OrchestratorConfig` |
| Catch stuck agents | `loopDetection` with `onLoopDetected: 'terminate'` (or a custom handler) | `AgentConfig` |
| Trace and audit | `onTrace` to your tracing backend; persist `renderTeamRunDashboard(result)` | `OrchestratorConfig` |
| Redact secrets | Automatic — API keys, tokens, and Authorization headers stripped from traces, bash output, and dashboard payloads | built-in (on by default) |
| Grant tools deliberately | Built-in tools are opt-in (default-deny): an agent gets only what it lists in `tools` / `toolPreset`; list neither and it gets none. `bash` stays unsandboxed once granted, and every tool result is sent to your model provider — so grant read/exec access on purpose. `defaultToolPreset` restores the old "all tools" behavior in one line | `AgentConfig` / `OrchestratorConfig` |
| Bound filesystem reach | `cwd` / `defaultCwd` (default `.agent-workspace` subdir; widen with `process.cwd()`, disable with `null`) | `AgentConfig` / `OrchestratorConfig` |

The deep dives live in the reference: [Context management](/reference/context-management/) for the strategies and tool-result compression, [Tool configuration](/reference/tool-configuration/) for grants and the filesystem sandbox, and [Checkpoint & resume](/reference/checkpoint/) for snapshot/resume over a MemoryStore.
