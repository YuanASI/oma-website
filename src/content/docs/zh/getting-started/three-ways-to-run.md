---
title: 三种运行方式
description: "runAgent、runTeam 和 runTasks——外加计划预览、计划重放与共识验证。"
---

| 模式 | 方法 | 何时使用 | 示例 |
|------|--------|-------------|---------|
| 单智能体 | `runAgent()` | 一个智能体，一个 prompt | [`basics/single-agent`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/single-agent.ts) |
| 自动编排团队 | `runTeam()` | 给一个目标，让协调器规划并执行 | [`basics/team-collaboration`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/team-collaboration.ts) |
| 显式流水线 | `runTasks()` | 你来定义任务图和分派 | [`basics/task-pipeline`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/task-pipeline.ts) |

对于需要审视的答案，`runConsensus()` 会跑一个提议者→裁判的验证循环（带一个需显式开启的、按任务粒度的 `verify` 钩子）。见[共识](/zh/reference/consensus/)。

## 预览并重放一个计划

预览协调器的任务 DAG 而不执行它，或者把那个计划固定下来、稍后重放同一张图而无需再调一次协调器：

```ts
// Decompose once and review the plan
const preview = await orchestrator.runTeam(team, goal, { planOnly: true })

// Turn it into a diffable, version-controllable artifact (plain JSON)
const plan = orchestrator.createPlanArtifact(preview)

// Later: replay the exact graph (same task ids, deps, assignees), no coordinator
const result = await orchestrator.runFromPlan(team, plan)
```

## 把不同阶段路由到不同模型

用一个需显式开启的 `modelRouting` 策略，把编排的各个阶段路由到不同模型：旗舰模型做规划，廉价模型跑叶子任务。可按阶段、智能体、任务角色/优先级或叶子状态匹配；先匹配者胜出，不设它则模型选择保持不变。见[模型路由](/zh/reference/model-routing/)。
