---
title: 编排控制
description: "控制 v1.13 的执行拓扑、治理、任务派发、审批、取消、协调器行为与扇出。"
---

精细控制一次 OMA 运行。所有控制项都是可选的；省略时保持 `runTeam()` 的自动行为。

## 选择执行拓扑

如果应用已经知道该由单个 Agent 还是协调器规划的 Team 来执行，请显式指定模式：

```ts
await orchestrator.runTeam(team, goal, { mode: 'single' })
await orchestrator.runTeam(team, goal, { mode: 'team' })
```

需要自动选择时，配置 `ExecutionRouter`。每次选择都会出现在
`result.routingDecision` 和路由 trace 证据中。执行路由与模型路由相互独立：
前者选择**单智能体还是团队**，后者选择一次调用使用哪个模型。详见
[执行路由](/zh/reference/execution-routing/)。

## 声明治理角色

当指定角色必须按顺序真实执行时，请声明结构，不要依赖目标中的文字暗示：

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

OMA 会在执行前校验 roster 与顺序、构建声明的角色 DAG，再检查实际执行拓扑。
显式 `mode` 可以覆盖这个下限，但结果会标为 `unsatisfied`，不会被误报为治理成功。
详见[工具配置与治理](/zh/reference/tool-configuration/#在-runteam-中声明治理角色)。

## 注入团队上下文

把目标、团队名册以及该 worker 的角色前置到每个 worker 的 prompt——帮助 worker 保持对齐，也让多步运行更容易调试。默认关闭；不开启时 worker prompt 保持逐字节不变。

```ts
await orchestrator.runTeam(team, goal, { revealCoordinator: true })
```

## 运行前先审批

在任何智能体执行之前检查协调器计划：

```ts
const orchestrator = new OpenMultiAgent({
  onPlanReady: async (tasks) => tasks.length <= 10,
})
```

事件驱动调度下，`onTaskDispatch` 会在一个就绪任务即将派发时单独设闸。
只有明确需要旧的“整轮审批”契约时才使用 `onApproval`；配置它会选择旧的批次调度，
两种任务审批模式不能同时使用。

```ts
const orchestrator = new OpenMultiAgent({
  onTaskDispatch: async ({ task, completed }) =>
    task.priority !== 'critical' || completed.length > 0,
})
```

调度器、优先级、metadata、结构化依赖载荷和审批语义见
[任务调度与派发](/zh/reference/task-scheduling/)。

## 为高影响工具设闸

自定义工具用 `consequential: true` 标记，再通过
`requireConsequentialConfirmation` 与 `onToolCall` 开启确认。内置
`bash`、`file_write` 和 `file_edit` 已标为 consequential。

```ts
const orchestrator = new OpenMultiAgent({
  requireConsequentialConfirmation: true,
  onToolCall: async (ctx) =>
    ctx.consequential && !(await app.confirm(ctx))
      ? { action: 'deny', reason: 'User rejected the action.' }
      : { action: 'allow' },
})
```

这是策略闸门，不是进程级隔离。运行不可信代码时仍应使用容器或虚拟机。

## 取消一次运行

传入一个 `AbortSignal`；中止会让运行中途停止。`callTimeoutMs`
限制单次模型调用，Agent 的 `timeoutMs` 则限制整个 Agent 运行。

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

对于 MapReduce 风格的并行，直接用 `AgentPool.runParallel()`。见 [`patterns/fan-out-aggregate`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.13.0/packages/core/examples/patterns/fan-out-aggregate.ts)。

## Shell 与 CI

使用 JSON 优先的 `oma` 二进制。见 [CLI 参考](/zh/reference/cli/)。
