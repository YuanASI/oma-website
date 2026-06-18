---
title: Three Ways to Run
description: "runAgent, runTeam, and runTasks — plus plan preview, plan replay, and consensus verification."
---

| Mode | Method | When to use | Example |
|------|--------|-------------|---------|
| Single agent | `runAgent()` | One agent, one prompt | [`basics/single-agent`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/single-agent.ts) |
| Auto-orchestrated team | `runTeam()` | Give a goal, let the coordinator plan and execute | [`basics/team-collaboration`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/team-collaboration.ts) |
| Explicit pipeline | `runTasks()` | You define the task graph and assignments | [`basics/task-pipeline`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/task-pipeline.ts) |

For answers that need scrutiny, `runConsensus()` runs a proposer→judge verification loop (with an opt-in per-task `verify` hook). See [Consensus](/reference/consensus/).

## Preview and replay a plan

Preview the coordinator's task DAG without executing it, or pin that plan and replay the same graph later without another coordinator call:

```ts
// Decompose once and review the plan
const preview = await orchestrator.runTeam(team, goal, { planOnly: true })

// Turn it into a diffable, version-controllable artifact (plain JSON)
const plan = orchestrator.createPlanArtifact(preview)

// Later: replay the exact graph (same task ids, deps, assignees), no coordinator
const result = await orchestrator.runFromPlan(team, plan)
```

## Route phases to different models

Route orchestration phases to different models with an opt-in `modelRouting` policy: a flagship model plans, a cheap model runs the leaf tasks. Match by phase, agent, task role/priority, or leaf status; first match wins, and omitting it leaves model selection unchanged. See [Model routing](/reference/model-routing/).
