---
title: "计划预览与重放"
description: "将一个目标分解成任务 DAG 而不运行它，把计划冻结为一份可序列化的制品，之后无需再次调用协调器就能重放完全相同的图。"
---

`runTeam` 通常在一次调用中就把一个目标分解并执行。你可以把它拆成两步：让协调器把目标分解成一个任务 DAG **而不执行它**，把该计划冻结为一份可序列化的制品，然后**之后无需再次调用协调器就重放完全相同的图**。

这带来三样好处：协调器那一趟（每次 `runTeam` 都有的一次额外 LLM 往返）只运行一次，而不是每次执行都跑；任务图是固定的，而不是每次都由 LLM 重新推导，因此各次运行在结构上可复现；而且计划是朴素、可审查、可做版本控制的数据。它覆盖 `runTeam(planOnly)` → `createPlanArtifact` → `runFromPlan`。`restore()` 也接受一份计划制品——见 [检查点与恢复](/zh/reference/checkpoint/)。

## 预览计划

给 `runTeam` 传入 `planOnly: true`。协调器会分解目标，但没有任务智能体运行：

```typescript
import { OpenMultiAgent, Team } from '@open-multi-agent/core'

const orchestrator = new OpenMultiAgent()
const team = new Team({ name: 'research', agents: [researcher, writer] })

const preview = await orchestrator.runTeam(team, goal, { planOnly: true })
// preview.planOnly === true
// preview.tasks        — the decomposed DAG, every task 'pending', no metrics
// preview.totalTokenUsage — the coordinator decomposition only
```

返回的 `TeamRunResult` 具有 `planOnly: true`、`success: true`，且 `tasks` 已填充（全部为 `pending`）；`agentResults` 只保存协调器的分解调用。有两点要知道：

- **`planOnly` 绕过简单目标的短路。** 一个正常 `runTeam` 会直接交给单个智能体的琐碎目标，在这里仍会走协调器，因此你总能得到一份可供检视的真实计划。
- **`onPlanReady` 仍会把关。** 如果你接好了 `OrchestratorConfig.onPlanReady` 且它返回 `false`，计划会被拒绝：结果为 `success: false`，且 `planOnly` 未被设置。

## 冻结它

把一个仅计划（plan-only）的结果变成一份 `PlanArtifact`——朴素的 JSON，你可以对它做 diff、提交、并交给另一个进程：

```typescript
const plan = orchestrator.createPlanArtifact(preview)

// It's just data — persist it however you like.
import { writeFileSync } from 'node:fs'
writeFileSync('plan.json', JSON.stringify(plan, null, 2))
```

`createPlanArtifact` 只接受**仅计划**的结果；一次已执行的运行会被拒绝，因为它的任务记录不是一份重放契约。每个任务都必须带有描述。

## 重放前编辑

`PlanArtifact` 是朴素数据，因此你可以在重放前手工编辑它——改换某个 `assignee`、重新措辞某个 `description`、增删任务，或者重连 `dependsOn`：

```typescript
import { readFileSync } from 'node:fs'
const plan = JSON.parse(readFileSync('plan.json', 'utf8'))
plan.tasks[0].assignee = 'writer' // e.g. reassign the first task
```

`runFromPlan` 在运行任何东西之前会校验依赖图。如果某处编辑引用了一个不存在的任务 id，或者引入了环，它会抛错，而不是去运行一份坏掉的计划。

## 重放

运行被冻结的计划。协调器**不会**被调用——任务 id、依赖和 assignee 都完全按存储的样子使用：

```typescript
const result = await orchestrator.runFromPlan(team, plan)
```

`runFromPlan` 复用与 `runTasks` 相同的执行路径（按依赖排序，互不依赖的并行），并且和 `runTasks` 一样，它接受需显式开启的 `checkpoint` 选项以做持久的快照/恢复。它是仅执行的：它**不会**综合出一个协调器的最终答案，因此 `result` 携带的是逐任务的输出，而不是一个合并后的 `'coordinator'` 结果。当你需要综合时，用 `runTeam`。

## 制品包含什么

```typescript
interface PlanArtifact {
  version: 1
  goal?: string
  tasks: PlanTaskArtifact[]
}

interface PlanTaskArtifact {
  id: string
  title: string
  description: string
  assignee?: string
  dependsOn?: string[]
  memoryScope?: 'dependencies' | 'all'
  maxRetries?: number
  retryDelayMs?: number
  retryBackoff?: number
}
```

制品是带版本的；`runFromPlan` 遇到不受支持的 `version` 会抛错。只有那些塑造任务图及其执行的字段会被存储——不含任何运行的结果、状态或指标。

## 局限

- **它冻结的是结构，不是输出。** 计划钉住的是任务图——谁做什么、以什么顺序。每个任务在重放时仍是一次实时的 LLM 调用，因此同一份计划运行两次可能产生不同的任务内容。钉住图，而不是答案。
- **重放时不综合。** `runFromPlan` 返回原始的逐任务输出；它不运行协调器的最终综合步骤。当你需要一个综合出的答案时，用 `runTeam`（或 `restore` 一个 `runTeam` 的检查点）。
- **你是提前钉住，而不是事后追溯。** `createPlanArtifact` 接受一份仅计划的预览，而不是一次已执行的运行。要捕获一份计划，先运行 `planOnly`——你无法从一次已经执行过的运行里冻结出 DAG。
- **一个简单目标的预览与它实际运行的方式不同。** 因为 `planOnly` 绕过了单智能体短路，一个琐碎目标的计划可能与正常 `runTeam` 会做的事不匹配（后者会完全跳过协调器）。
```
