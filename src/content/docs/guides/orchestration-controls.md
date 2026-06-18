---
title: Orchestration Controls
description: "Fine-grained control over a runTeam run: team context injection, approval gates, cancellation, coordinator config, and fan-out."
---

Fine-grained control over a `runTeam` run. All optional; defaults keep behavior unchanged.

## Inject team context

Prepend the goal, roster, and this worker's role to every worker prompt — helps workers stay aligned and makes multi-step runs easier to debug. Off by default; worker prompts stay byte-identical when omitted.

```ts
await orchestrator.runTeam(team, goal, { revealCoordinator: true })
```

## Approve before running

Inspect the coordinator's plan before any agent executes, and again between task rounds. These live on the orchestrator. Returning `false` aborts; remaining tasks are marked `skipped`.

```ts
const orchestrator = new OpenMultiAgent({
  onPlanReady: async (tasks) => tasks.length <= 10,        // gate the whole plan
  onApproval:  async (completed, next) => next.length > 0, // gate each round
})
```

## Cancel a run

Pass an `AbortSignal`; aborting stops the run in flight.

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

For MapReduce-style parallelism, use `AgentPool.runParallel()` directly. See [`patterns/fan-out-aggregate`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/fan-out-aggregate.ts).

## Shell & CI

Use the JSON-first `oma` binary. See the [CLI reference](/reference/cli/).
