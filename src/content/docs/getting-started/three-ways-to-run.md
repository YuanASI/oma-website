---
title: Choose a Run Mode
description: "Choose runAgent, runTeam, or runTasks based on who owns the plan, how predictable the graph must be, and whether you need a synthesized result."
---

:::tip[Decision shortcut]
Start with `runTeam()` when you know the goal but not the exact steps. Use `runAgent()` when one focused agent is enough. Move to `runTasks()` when the task graph must be explicit and repeatable.
:::

## `runAgent()`: one agent, one task

Choose `runAgent()` for a focused task that does not benefit from delegation or parallel specialists.

- **You provide:** one configured agent and one prompt.
- **OMA handles:** the model loop, tool calls, streaming, and optional structured output for that agent.
- **Tradeoff:** the lowest orchestration overhead, but no team planning or multi-agent collaboration.

```ts
const result = await orchestrator.runAgent(
  reviewer,
  'Review this API contract for security issues.',
)
```

See the [`basics/single-agent` example](/examples/single-agent/).

## `runTeam()`: goal-first coordination

Choose `runTeam()` when you can describe the outcome but do not want to maintain every task and dependency yourself. This is the recommended starting point for multi-agent work.

- **You provide:** a team of available agents and a goal.
- **OMA handles:** a simple goal may go directly to one agent; a non-trivial goal is decomposed into a task DAG, independent tasks run in parallel, and the coordinator synthesizes the results.
- **Tradeoff:** the plan adapts to the goal, but planning adds a model call and the generated graph can vary between runs.

```ts
const result = await orchestrator.runTeam(
  team,
  'Research the market, identify risks, and produce a launch brief.',
)
```

See the [`basics/team-collaboration` example](/examples/team-collaboration/).

## `runTasks()`: explicit task graph

Choose `runTasks()` when the workflow is known in advance and the topology needs to be reviewable, versionable, or repeatable.

- **You provide:** the tasks, assignees, and `dependsOn` relationships.
- **OMA handles:** dependency ordering, parallel execution, configured retries, and per-task results.
- **Tradeoff:** you own and maintain the graph. There is no coordinator planning call and no final coordinator synthesis; the result contains the task outputs.

```ts
const tasks = [
  { title: 'Research', description: 'Find the key facts.', assignee: 'researcher' },
  { title: 'Write', description: 'Produce the brief.', assignee: 'writer', dependsOn: ['Research'] },
]

const result = await orchestrator.runTasks(team, tasks)
```

See the [`basics/task-pipeline` example](/examples/task-pipeline/).

## Compare the tradeoffs

- **Lowest setup and runtime overhead:** `runAgent()`
- **Least graph maintenance:** `runTeam()`
- **Most predictable topology:** `runTasks()`
- **One synthesized team answer:** `runTeam()`
- **Raw per-task outputs:** `runTasks()` and `runFromPlan()`

## How a workflow usually evolves

1. Validate one role and prompt with `runAgent()`.
2. Add specialists and let `runTeam()` discover a useful decomposition.
3. Preview the coordinator plan with `planOnly` when you need review before execution.
4. Pin an approved plan with `runFromPlan()`, or encode a stable workflow directly with `runTasks()`.

`runFromPlan()` replays the approved graph without another coordinator planning call. Like `runTasks()`, it returns per-task outputs and does not run final synthesis. See [Plan preview & replay](/reference/plan-replay/).

## Controls that sit on top

These features refine a run; they do not replace the choice of who owns the task graph:

- [Consensus](/reference/consensus/) adds proposer-and-judge verification through `runConsensus()` or a per-task `verify` hook.
- [Plan preview & replay](/reference/plan-replay/) lets you inspect, version, and replay a coordinator-generated graph.
- [Model routing](/reference/model-routing/) sends planning and leaf work to different models under an opt-in policy.

Next: [Orchestration Controls](/guides/orchestration-controls/) covers cancellation, plan approval, coordinator visibility, and other runtime controls.
