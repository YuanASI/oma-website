---
title: 编排控制
description: "对一次 runTeam 运行的细粒度控制：团队上下文注入、审批闸、取消、协调器配置以及扇出。"
---

对一次 `runTeam` 运行的细粒度控制。全部可选；默认行为保持不变。

## 注入团队上下文

把目标、团队名册以及该 worker 的角色前置到每个 worker 的 prompt——帮助 worker 保持对齐，也让多步运行更容易调试。默认关闭；不开启时 worker prompt 保持逐字节不变。

```ts
await orchestrator.runTeam(team, goal, { revealCoordinator: true })
```

## 运行前先审批

在任何智能体执行之前先审视协调器的计划，并在每一轮任务之间再审视一次。这些配置在编排器上。返回 `false` 即中止；剩余任务标记为 `skipped`。

```ts
const orchestrator = new OpenMultiAgent({
  onPlanReady: async (tasks) => tasks.length <= 10,        // gate the whole plan
  onApproval:  async (completed, next) => next.length > 0, // gate each round
})
```

## 取消一次运行

传入一个 `AbortSignal`；中止会让运行中途停止。

```ts
const controller = new AbortController()
const run = orchestrator.runTeam(team, goal, { abortSignal: controller.signal })
// controller.abort() from elsewhere to cancel
```

## 配置协调器

给规划器单独的模型、适配器或额外指令，不触及 worker 智能体。

```ts
await orchestrator.runTeam(team, goal, {
  coordinator: { model: 'claude-opus-4-6', instructions: 'Prefer fewer, larger tasks.' },
})
```

## 无依赖扇出

对于 MapReduce 风格的并行，直接用 `AgentPool.runParallel()`。见 [`patterns/fan-out-aggregate`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/fan-out-aggregate.ts)。

## Shell 与 CI

使用 JSON 优先的 `oma` 二进制。见 [CLI 参考](/zh/reference/cli/)。
