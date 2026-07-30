---
title: Orchestration Controls
description: "Control v1.13 execution topology, governance, task dispatch, approvals, cancellation, coordinator behavior, and fan-out."
---

Fine-grained control over an OMA run. All controls are optional; omitting them
preserves the automatic `runTeam()` behavior.

## Choose the execution topology

Use an explicit mode when your application already knows whether one Agent or a
coordinator-planned Team should run:

```ts
await orchestrator.runTeam(team, goal, { mode: 'single' })
await orchestrator.runTeam(team, goal, { mode: 'team' })
```

For automatic selection, configure an `ExecutionRouter`. Every choice is exposed
as `result.routingDecision` and in routing trace evidence. Execution Routing is
separate from Model Routing: one chooses **single vs team**, the other chooses
which model handles a call. See [Execution Routing](/reference/execution-routing/).

## Declare governance roles

When named roles must actually execute in a required order, declare that
structure instead of relying on wording in the goal:

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

OMA validates the roster and order before execution, builds the declared role
DAG, then checks the executed topology. An explicit `mode` can override the
floor, but the result is marked `unsatisfied`; it is never reported as a clean
governance success. See [tool configuration and governance](/reference/tool-configuration/#declared-governance-roles-in-runteam).

## Inject team context

Prepend the goal, roster, and this worker's role to every worker prompt — helps workers stay aligned and makes multi-step runs easier to debug. Off by default; worker prompts stay byte-identical when omitted.

```ts
await orchestrator.runTeam(team, goal, { revealCoordinator: true })
```

## Approve before running

Inspect the coordinator's plan before any agent executes:

```ts
const orchestrator = new OpenMultiAgent({
  onPlanReady: async (tasks) => tasks.length <= 10,
})
```

For event-driven scheduling, `onTaskDispatch` gates one ready task immediately
before dispatch. Use `onApproval` only when you intentionally need the legacy
round-based approval contract; configuring it selects legacy batch scheduling,
and the two task approval modes are mutually exclusive.

```ts
const orchestrator = new OpenMultiAgent({
  onTaskDispatch: async ({ task, completed }) =>
    task.priority !== 'critical' || completed.length > 0,
})
```

See [Task scheduling and dispatch](/reference/task-scheduling/) for scheduler,
priority, metadata, structured dependency payload, and approval semantics.

## Gate consequential tools

Mark custom tools with `consequential: true`, then opt into confirmation with
`requireConsequentialConfirmation` and `onToolCall`. The built-in `bash`,
`file_write`, and `file_edit` tools are already marked consequential.

```ts
const orchestrator = new OpenMultiAgent({
  requireConsequentialConfirmation: true,
  onToolCall: async (ctx) =>
    ctx.consequential && !(await app.confirm(ctx))
      ? { action: 'deny', reason: 'User rejected the action.' }
      : { action: 'allow' },
})
```

This is a policy gate, not process containment. Isolate untrusted execution in a
container or VM.

## Cancel a run

Pass an `AbortSignal`; aborting stops the run in flight. `callTimeoutMs` adds a
per-model-call boundary, while agent `timeoutMs` bounds the whole agent run.

```ts
const controller = new AbortController()
const run = orchestrator.runTeam(team, goal, { abortSignal: controller.signal })
// controller.abort() from elsewhere to cancel
```

## Configure the coordinator

Give the planner its own model, adapter, or extra instructions without touching the worker agents.

```ts
await orchestrator.runTeam(team, goal, {
  coordinator: { model: 'claude-opus-4-6', instructions: 'Prefer fewer, larger tasks.' },
})
```

## Fan-out without dependencies

For MapReduce-style parallelism, use `AgentPool.runParallel()` directly. See [`patterns/fan-out-aggregate`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.13.0/packages/core/examples/patterns/fan-out-aggregate.ts).

## Shell & CI

Use the JSON-first `oma` binary. See the [CLI reference](/reference/cli/).
