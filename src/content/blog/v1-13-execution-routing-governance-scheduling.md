---
title: "Open Multi-Agent v1.13: Route, Govern, Schedule, and Prove the Run"
description: "v1.13 adds execution routing, declared governance, consequential-tool confirmation, event-driven task scheduling, task-scoped results, structured handoffs, and retryable model fallbacks."
pubDate: 2026-07-24
tags: ["release","orchestration","governance","typescript"]
contentType: release
useCases: ["execution routing", "governed orchestration", "task scheduling"]
industries: []
evidence:
  kind: release-note
  note: "Describes the published v1.13.0 runtime surface and links to version-aligned reference documentation."
related:
  solutions: ["goal-driven-orchestration"]
  examples: ["team-collaboration", "task-pipeline", "plan-replay"]
  integrations: ["opentelemetry"]
  comparisons: []
featured: false
readingMinutes: 6
---

Open Multi-Agent v1.13 makes four runtime boundaries explicit: which topology
runs, when a ready task is dispatched, which actions need approval, and what
evidence remains afterward.

```bash
npm install @open-multi-agent/core@1.13.0
npm create oma-app@latest my-oma
```

These are library capabilities inside your own Node.js backend. v1.13 does not
add a hosted tenant, project, thread, seat, or RBAC control plane.

## Route single-agent or team execution

`runTeam()` can now take an explicit `mode`, a custom `ExecutionRouter`, or the
built-in deterministic router. The selected topology is exposed through
`result.routingDecision` and linked to trace evidence.

```ts
const result = await orchestrator.runTeam(team, goal, {
  mode: 'team',
})
```

Execution Routing chooses **single vs team**. It is deliberately separate from
Model Routing, which chooses the model for a call inside the selected topology.
The automatic router also recognizes structured Chinese, Japanese, and Korean
goals with script-aware information length.

See [Execution Routing](/reference/execution-routing/).

## Declare governance instead of implying it

If a workflow must pass through named roles in order, the application can
declare the role DAG:

```ts
const result = await orchestrator.runTeam(team, goal, {
  governanceIntent: 'required',
  requiredRoles: ['reviewer', 'security'],
  requiredOrder: ['reviewer', 'security'],
})

if (result.governanceConclusion !== 'satisfied') {
  throw new Error(`Governance failed: ${result.governanceReason}`)
}
```

OMA checks the executed topology, not labels in agent prose. Explicit modes,
governance floors, and per-run budgets follow a documented precedence order;
overrides and budget-aware degradation are disclosed in result fields.

Tool authors can also mark real-side-effect tools with `consequential: true`.
Undeclared runs expose a machine-readable disclosure flag, and applications can
require confirmation through `onToolCall`. This is a policy gate, not a process
sandbox.

See [Tool Configuration](/reference/tool-configuration/) and
[Orchestration Controls](/guides/orchestration-controls/).

## Dispatch the DAG as events

Task DAG execution is event-driven by default. A dependent task becomes
eligible as soon as its prerequisites finish; it no longer waits for unrelated
work from the same logical layer.

Applications can choose dependency-first, round-robin, least-busy,
capability-match, or weighted composite scheduling. `onTaskDispatch` provides a
native approval boundary for one ready task. Existing `onApproval` integrations
retain their round-based scheduling and callback semantics.

Tasks can now carry hard capability requirements, priority, a logical role, and
bounded provenance metadata. Handoffs can pass raw output, validated structured
data, or both. `TeamRunResult.taskResults` preserves each unmerged result by
stable task ID.

See [Task Scheduling and Dispatch](/reference/task-scheduling/).

## Keep evidence connected to execution

`buildExecutionReceipt(result, trace?)` derives a compact, privacy-preserving
record of the topology that actually ran: mode, worker instances, logical task
roles, cross-role dependency edges, execution order, usage, duration, routing
linkage, and whether the record is partial.

The receipt complements the full trace and offline Run Viewer; it is not a
hosted audit service. Checkpoints also preserve richer task-scoped results and
handoff metadata so a restored run can rebuild `taskResults`.

See [Observability](/reference/observability/) and [Checkpoint and
Resume](/reference/checkpoint/).

## Reliability and compatibility

Model-routing rules can declare ordered fallbacks for retryable worker-provider
failures. The fallback chain uses the task's existing retry budget; validation,
authentication, hooks, and other non-provider errors do not advance it.

Raw dependency output remains the default. Structured handoffs, governance
declarations, consequential confirmation, and custom execution routing are all
opt-in. Progress events from independent DAG branches may now interleave, so
consumers should correlate them by task ID instead of assuming round adjacency.

Read the complete [v1.13.0 release
notes](https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.13.0),
or start from the [v1.13 capability map](/capabilities/).
