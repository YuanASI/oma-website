---
title: 自适应恢复
description: "在任务产生结果后，用经过校验、可审批、只追加的计划补丁修订任务图中尚未执行的部分。"
---

OMA 默认保持任务图固定。当应用需要在一个任务成功、失败或被共识校验拒绝之后，修订
本次运行中尚未执行的部分时，显式开启 `recovery.mode: 'repairable'`。

自适应恢复是一道结果屏障，而不是又一次重试：

1. 一个任务产生结果。
2. 配置的 `Replanner`（或 `onTaskOutcome` 回调）可以提出一个 `PlanPatch`。
3. OMA 校验 Agent 资格、限额、任务状态、引用关系与生成的 DAG。
4. 可选的 `onPlanPatch` 闸门批准或拒绝该提案。
5. OMA 原子地应用补丁，在开启 checkpoint 时落盘，然后发布新就绪的工作。
6. 只有在这道屏障之后，触发它的那个任务才会完成或失败，并释放或级联它原有的下游任务。

这个顺序可以防止一个原有的下游任务，在它的替代方案还没决定时就开始执行。

## 配置 replanner

```ts
import {
  OpenMultiAgent,
  type Replanner,
  type TaskOutcome,
} from '@open-multi-agent/core'

const replanner: Replanner = {
  name: 'fallback-search',
  replan(outcome: TaskOutcome) {
    if (outcome.kind !== 'failure' || outcome.task.title !== 'Search') {
      return undefined
    }

    const oldAnalysis = outcome.tasks.find((task) => task.title === 'Analysis')
    if (!oldAnalysis) return undefined

    return {
      reason: 'Primary search failed; use the fallback source.',
      supersedePending: [oldAnalysis.id],
      addTasks: [
        {
          key: 'fallback-search',
          title: 'Fallback Search',
          description: 'Fetch the source through the fallback path.',
          assignee: 'researcher-b',
        },
        {
          key: 'replacement-analysis',
          title: 'Replacement Analysis',
          description: 'Analyze the fallback result.',
          assignee: 'analyst',
          dependsOn: ['fallback-search'],
        },
      ],
    }
  },
}

const result = await oma.runTasks(team, tasks, {
  recovery: {
    mode: 'repairable',
    replanner,
    maxPlanRevisions: 3,
    maxAddedTasks: 20,
    onPlanPatch: async (patch, outcome) => {
      return await applicationPolicyApproves(patch, outcome)
    },
  },
})
```

`onTaskOutcome` 是给不需要具名 `Replanner` 对象的应用准备的简写。两者只配置一个。
自定义 replanner 可以调用 LLM 或别的服务，但那部分外部 I/O 及其用量核算仍由应用
自己拥有。

## 补丁操作

- `addTasks` 追加任务。每个追加的任务都有一个补丁内局部的 `key`。依赖可以指向同一
  补丁里的另一个 key，或指向一个已存在的任务 ID。
- `retargetPending` 在新 Agent 通过调度所用的同一套资格检查之后，改变一个 `pending`
  或 `blocked` 任务的 assignee。
- `supersedePending` 把一个 `pending` 或 `blocked` 任务标记为 `skipped`。替代任务是
  追加进来的，而不是改写或删除历史。

已开始或已终结的任务不能被改派或取代。只有当被接受的补丁至少追加了一个替代任务时，
一次失败或校验拒绝才会被归类为已恢复。成功的任务可以追加或重塑下游工作，而不会被
标记为已恢复。

补丁引用使用任务 ID，而不是标题。这样在多个运行时任务同名时不会产生歧义。

## 失败、持久化与恢复

在没有被接受的补丁时，既有行为保持不变：失败任务会把失败级联给它的下游任务，而独立
分支可以继续执行。

被接受的修订存放在队列快照第 2 版中。第 1 版仍然是固定 DAG 格式，并且依然可读。开启
checkpoint 时，OMA 会在派发追加的工作之前先保存打过补丁的图。如果这次保存失败，尚未
发布的补丁会被回滚，原有的失败路径继续。

Restore 会把一个被中断的任务重置为可执行，同时保留持久化的计划修订历史。崩溃之后，
触发任务与结果都相同的修订不会被追加两次。

`result.tasks` 中的历史任务保持真实：被修复的失败仍然是 `failed` 并带
`recoveredByRevision`，被替换的分支是 `skipped` 并带 `supersededByRevision`。当打过
补丁的活动图最终成功完成时，这些历史记录不会让整次运行判定为失败。被接受的修订通过
`result.planRevisions` 返回。

## 边界

- 恢复需要显式开启。既有调用方仍然是固定 DAG。
- `runFromPlan()` 是精确重放，会拒绝 repairable 恢复。
- Repairable 恢复与旧的按轮 `onApproval` 不兼容。请使用 `onTaskDispatch` 和 / 或
  `onPlanPatch` 闸门。
- 限额会拒绝后续补丁；它们绝不会静默截断一个补丁。
- 策略、校验、审批、修订与 checkpoint 决策都会通过 progress event 与可观测性 span
  暴露出来。
- 修复只能向前。OMA 不会撤销一个任务已经产生的外部副作用。
