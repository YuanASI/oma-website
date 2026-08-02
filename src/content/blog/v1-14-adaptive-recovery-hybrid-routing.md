---
title: "Open Multi-Agent v1.14: Repair the Plan, Keep the Record"
description: "v1.14 adds adaptive plan recovery, opt-in hybrid semantic execution routing, DeepSeek V4 Flash reasoning controls, and fail-closed validation for task graphs, coordinator plans, and task requirements."
pubDate: 2026-08-02
tags: ["release","orchestration","recovery","typescript"]
contentType: release
useCases: ["adaptive recovery", "execution routing", "governed orchestration"]
industries: []
evidence:
  kind: release-note
  note: "Describes the published v1.14.0 runtime surface and links to version-pinned reference documentation."
related:
  solutions: ["goal-driven-orchestration"]
  examples: ["task-pipeline", "task-retry", "plan-replay"]
  integrations: ["deepseek", "opentelemetry"]
  comparisons: []
featured: false
readingMinutes: 4
---

v1.13 made four runtime boundaries explicit. v1.14 lets two of them move under
supervision: a task graph can be repaired mid-run, and automatic routing can ask
for one semantic second opinion. Both are opt-in. Separately, three validation
paths that used to pass quietly and then behave wrongly now fail up front.

```bash
npm install @open-multi-agent/core@1.14.0
npm create oma-app@latest my-oma
```

## Repair the part of the plan that hasn't run

A retry re-runs the same task. A full re-plan discards what already succeeded.
`recovery.mode: 'repairable'` adds the option in between: after a task succeeds,
fails, or is rejected by consensus verification, a `Replanner` may propose an
append-only `PlanPatch` over the part of the graph that has not started.

```ts
import { type Replanner } from '@open-multi-agent/core'

const replanner: Replanner = {
  name: 'fallback-search',
  replan(outcome) {
    if (outcome.kind !== 'failure' || outcome.task.title !== 'Search') return undefined
    const analysis = outcome.tasks.find((task) => task.title === 'Analysis')
    if (!analysis) return undefined

    return {
      reason: 'Primary search failed; use the fallback source.',
      supersedePending: [analysis.id],
      addTasks: [
        { key: 'fallback-search', title: 'Fallback Search', description: '…', assignee: 'researcher-b' },
        { key: 'replacement-analysis', title: 'Replacement Analysis', description: '…', assignee: 'analyst', dependsOn: ['fallback-search'] },
      ],
    }
  },
}

const result = await orchestrator.runTasks(team, tasks, {
  recovery: { mode: 'repairable', replanner, maxPlanRevisions: 3, maxAddedTasks: 20 },
})
```

The patch lands on an outcome barrier rather than in a retry loop. OMA validates
agent eligibility, limits, task states, references, and the resulting DAG; runs
the optional `onPlanPatch` approval; applies the patch atomically; persists a
checkpoint when checkpointing is enabled; and only then lets the triggering task
complete or cascade. A downstream task cannot start while its replacement is
still being decided.

A patch appends work (`addTasks`), reassigns a pending or blocked task
(`retargetPending`), or skips one (`supersedePending`). Nothing is rewritten or
deleted, and references use task IDs rather than titles. History stays truthful
in `result.tasks`: a repaired failure is still `failed`, carrying
`recoveredByRevision`; a replaced branch is `skipped`, carrying
`supersededByRevision`. Accepted revisions come back in `result.planRevisions`
and show up in progress events and observability spans.

The boundaries matter as much as the mechanism. A repair is forward-only — OMA
does not undo side effects a task already performed. `runFromPlan()` is exact
replay and rejects repairable recovery. Limits reject a further patch instead of
silently truncating one. `onTaskOutcome` is the shorthand for applications that
don't want a named `Replanner`; configure one or the other, not both.

See [Adaptive
recovery](https://github.com/open-multi-agent/open-multi-agent/blob/v1.14.0/docs/adaptive-recovery.md).

## One semantic second opinion on routing

Automatic `runTeam()` routing stays deterministic by default. `strategy:
'hybrid'` adds at most one no-tool model call, and only when the deterministic
router would otherwise choose Single:

```ts
const orchestrator = new OpenMultiAgent({
  executionRouting: {
    strategy: 'hybrid',
    confidenceThreshold: 0.7,
    failurePolicy: 'fallback',
  },
})
```

The model does not choose the topology. `LLMTaskProfiler` returns a strict
`TaskProfile` — independent evidence sources, independent review, conflicting
objectives, side-effect intent, permission isolation, decomposability,
parallelism, complexity, confidence, and bounded reasons — and a deterministic
policy consumes it alongside framework-computed facts. High-confidence signals
can upgrade Single to Team. Inferred side-effect or isolation needs that
intersect consequential effective grants, or multiple caller-declared
`permissionBoundary` values, raise `ROUTING_DECLARATION_REQUIRED` before any
coordinator, worker, or tool-capable agent starts. Low confidence keeps Single.
V1 never turns Team into Single.

The profiler is treated as a hostile-input surface. The goal is untrusted data;
the profiler receives no agent or coordinator system prompts, credentials, tool
implementations, or complete permission details, and cannot call tools. A
profile never creates `requiredRoles`, approves a side effect, or proves
governance was satisfied — the executed topology, the final tool grants, and the
`ExecutionReceipt` remain governance truth.

Two things are worth configuring deliberately. The built-in profiler resolves
its adapter through the per-run and orchestrator `executionRouting.adapter`, then
the coordinator adapter, then one built from the orchestrator's default provider
— so a goal can reach `defaultProvider` on a path that previously made no call
there. Set the adapter explicitly, supply a coordinator adapter, or stay on
`strategy: 'deterministic'` when you have data-residency or provider-boundary
requirements. And enable hybrid only for provider/model pairs that have passed
the documented shadow gate; shadow evaluation is a release-engineering
technique, not a runtime mode.

Routing failure stays advisory under the default `failurePolicy: 'fallback'`.
Set `'fail'` to terminate instead, with `RoutingProfilerFailedError` and
`RoutingTimeoutError`; machine-readable `status`, `requestedRouterVersion`, and
`fallbackCode` fields remove the need to parse human-readable reasons. When
profiling ran, `semanticRoutingAssessment` reports the inferred profile, the
deterministic decision, the semantic recommendation, the actual topology, and
usage — charged to the run's token and cost budget.

See [Execution Routing](/reference/execution-routing/) for the deterministic
policy this builds on, and the [v1.14 routing
reference](https://github.com/open-multi-agent/open-multi-agent/blob/v1.14.0/docs/execution-routing.md#hybrid-semantic-routing)
for hybrid.

## Fail closed where it used to fail quietly

Three validation paths moved from permissive to strict:

- An invalid task dependency graph is rejected up front instead of executing a
  partially valid plan.
- The coordinator fails closed on a plan it could not validate instead of
  continuing with it.
- Task requirements are enforced as global hard constraints. A task whose
  requirements no agent satisfies is rejected rather than assigned to an
  ineligible agent. `validateTaskRequirements` is exported for callers that want
  to check a roster before dispatch.

This is a real behavior change: a run that previously finished with an invalid
DAG or an unsatisfiable requirement now fails at validation time, surfacing a
defect that was already present. Correct graphs and rosters are unaffected. The
new failure modes are typed and exported — `InvalidTaskRequirementsError`,
`RoutingDeclarationRequiredError`, `RoutingProfilerFailedError`,
`RoutingTimeoutError`, and `UnsupportedToolCallError`.

## Platform and compatibility

**Node.js 20 is the new floor** across `@open-multi-agent/core`,
`@open-multi-agent/otel`, and `create-oma-app`; Node 18 reached end of life on
2025-04-30. Node 22 or 24 is the recommended runtime — 20 is a migration window
that the next major release will remove, no earlier than 2026-10-31.

The bundled `openai` dependency moved from v4 to v6. User aborts are now
classified as cancellation rather than as a retryable failure, and an
OpenAI-compatible response containing the separate `custom` tool-call variant
raises `UnsupportedToolCallError` instead of collapsing into an empty successful
turn.

DeepSeek V4 Flash gains native reasoning controls: `AgentConfig.thinking.enabled`
maps to DeepSeek's `thinking.type`, and `thinking.effort` accepts the
DeepSeek-only value `'max'` without forwarding it to OpenAI, Azure OpenAI, or
GitHub Copilot.

Every public export from 1.13.0 is still exported, and new result and
configuration fields are optional, so existing callers and serialized results
keep type-checking. Adaptive recovery adds a version 2 task-queue snapshot
carrying plan-revision history; `TaskQueue.fromSnapshot()` still accepts version
1 snapshots, so checkpoints written by earlier releases remain restorable.

Read the complete [v1.14.0 release
notes](https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.14.0),
or start from the [Quick Start](/getting-started/quick-start/).
