---
title: "Open Multi-Agent v1.14：修复计划，保留记录"
description: "v1.14 带来自适应计划恢复、可选的混合语义执行路由、DeepSeek V4 Flash 推理控制，以及任务图、Coordinator 计划与任务要求的 fail-closed 校验。"
pubDate: 2026-08-02
tags: ["release","orchestration","recovery","typescript"]
contentType: release
useCases: ["自适应恢复", "执行路由", "治理式编排"]
industries: []
evidence:
  kind: release-note
  note: "描述已经发布的 v1.14.0 运行时能力。尚未同步到站内 Reference 的能力，链接到按版本固定的上游文档。"
related:
  solutions: ["goal-driven-orchestration"]
  examples: ["task-pipeline", "task-retry", "plan-replay"]
  integrations: ["deepseek", "opentelemetry"]
  comparisons: []
featured: false
readingMinutes: 4
---

v1.13 把四个运行时边界变成了显式能力。v1.14 让其中两个可以在监管下移动：任务图
可以在运行中被修复，自动路由也可以请求一次语义上的第二意见。两者都需要显式开启。
另外，三条过去会静默通过、然后跑出错误行为的校验路径，现在会在一开始就失败。

```bash
npm install @open-multi-agent/core@1.14.0
npm create oma-app@latest my-oma
```

## 修复计划中尚未执行的部分

重试是把同一个任务再跑一遍，完全重新规划则会丢掉已经成功的部分。
`recovery.mode: 'repairable'` 提供了中间选项：当一个任务成功、失败或被共识校验
拒绝之后，`Replanner` 可以针对图中尚未开始的部分，提出一个只追加的 `PlanPatch`。

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

补丁落在一个结果屏障上，而不是塞进重试循环。OMA 会校验 Agent 资格、限额、任务
状态、引用关系与生成的 DAG；执行可选的 `onPlanPatch` 审批；原子地应用补丁；在开启
checkpoint 时先落盘；只有到这一步之后，触发补丁的那个任务才会完成或向下游级联。
一个下游任务不会在它的替代方案还没定下来时就先启动。

补丁可以追加任务（`addTasks`）、改派处于 pending 或 blocked 的任务
（`retargetPending`），或跳过一个（`supersedePending`）。没有任何东西被改写或删除，
引用用的是任务 ID 而不是标题。`result.tasks` 里的历史保持真实：被修复的失败仍然是
`failed`，并带上 `recoveredByRevision`；被替换的分支是 `skipped`，并带上
`supersededByRevision`。已接受的修订会回到 `result.planRevisions`，也会出现在
progress event 和可观测性 span 里。

边界和机制同样重要。修复只能向前——OMA 不会撤销任务已经产生的外部副作用。
`runFromPlan()` 是精确重放，会拒绝 repairable 恢复。触及限额时补丁会被拒绝，而不是
被悄悄截断。`onTaskOutcome` 是不想定义具名 `Replanner` 时的简写；两者只配置一个。

详见[自适应恢复](https://github.com/open-multi-agent/open-multi-agent/blob/v1.14.0/docs/adaptive-recovery.md)。

## 给路由一次语义上的第二意见

自动 `runTeam()` 路由默认仍然是确定性的。`strategy: 'hybrid'` 最多增加一次不带工具的
模型调用，而且只在确定性路由器本来会选择 Single 时才发生：

```ts
const orchestrator = new OpenMultiAgent({
  executionRouting: {
    strategy: 'hybrid',
    confidenceThreshold: 0.7,
    failurePolicy: 'fallback',
  },
})
```

选择拓扑的不是模型。`LLMTaskProfiler` 返回一份严格的 `TaskProfile`——独立证据来源、
独立评审、目标冲突、副作用意图、权限隔离、可分解性、并行度、复杂度、置信度，以及
有边界的理由——然后由一套确定性策略结合框架自身计算出的事实来消费它。高置信度信号
可以把 Single 升级为 Team。推断出的副作用或隔离需求，如果与高影响的实际工具授权、
或调用方声明的多个 `permissionBoundary` 相交，就会在任何 Coordinator、worker 或
可用工具的 Agent 启动之前抛出 `ROUTING_DECLARATION_REQUIRED`。置信度不足时保持
Single。V1 永远不会把 Team 降为 Single。

Profiler 被当作敌意输入面来处理。目标文本是不可信数据；Profiler 拿不到 Agent 或
Coordinator 的 system prompt、凭据、工具实现或完整权限细节，也不能调用工具。Profile
永远不会创建 `requiredRoles`、批准一次副作用，或证明治理已被满足——真实执行的拓扑、
最终的工具授权与 `ExecutionReceipt` 仍然是治理事实。

有两处值得刻意配置。内置 Profiler 按这个顺序解析 adapter：单次运行与 orchestrator 级的
`executionRouting.adapter`，然后是 Coordinator adapter，最后是用 orchestrator 默认
provider 构造的 adapter——也就是说，目标文本可能通过一条以前根本不会调用 `defaultProvider`
的路径到达它。如果你有数据驻留或 provider 边界要求，请显式设置 adapter、提供
Coordinator adapter，或者继续用 `strategy: 'deterministic'`。另外，只对通过了文档中
Shadow 闸门的 provider/模型组合开启 hybrid；Shadow 评估是发布工程手段，不是运行时模式。

在默认的 `failurePolicy: 'fallback'` 下，路由失败仍然只是提示性的。设为 `'fail'` 则会
直接终止，并抛出 `RoutingProfilerFailedError` 与 `RoutingTimeoutError`；机器可读的
`status`、`requestedRouterVersion` 与 `fallbackCode` 字段让你不必再解析给人看的 reasons。
一旦跑过语义分析，`semanticRoutingAssessment` 会报告推断出的 profile、确定性决策、
语义建议、实际拓扑与用量——这部分用量计入本次运行的 token 与成本预算。

hybrid 之下的确定性策略详见[执行路由](/zh/reference/execution-routing/)，hybrid 本身详见
[v1.14 路由参考](https://github.com/open-multi-agent/open-multi-agent/blob/v1.14.0/docs/execution-routing.md#hybrid-semantic-routing)。

## 让过去静默失败的地方 fail closed

三条校验路径从宽松改为严格：

- 无效的任务依赖图会被提前拒绝，而不是先执行一个只有部分有效的计划。
- Coordinator 面对无法校验的计划会 fail closed，而不是继续往下跑。
- 任务要求被当作全局硬约束执行。没有任何 Agent 能满足其要求的任务会被拒绝，而不是
  派给一个不合格的 Agent。`validateTaskRequirements` 已导出，供需要在派发前核对
  阵容的调用方使用。

这是一次真实的行为变化：过去带着无效 DAG 或无法满足的要求"跑完"的运行，现在会在
校验阶段失败，把本来就存在的缺陷暴露出来。正确的图与阵容不受影响。这些新的失败模式
都有导出的类型化错误——`InvalidTaskRequirementsError`、`RoutingDeclarationRequiredError`、
`RoutingProfilerFailedError`、`RoutingTimeoutError` 与 `UnsupportedToolCallError`。

## 平台与兼容性

**Node.js 20 是新的下限**，`@open-multi-agent/core`、`@open-multi-agent/otel` 与
`create-oma-app` 同步提升；Node 18 已于 2025-04-30 结束生命周期。推荐运行时是 Node 22
或 24——20 只是一个迁移窗口，下一个大版本会移除它，时间不早于 2026-10-31。

内置的 `openai` 依赖从 v4 升到 v6。用户主动中止现在被归类为取消，而不是可重试的失败；
OpenAI 兼容响应里如果出现独立的 `custom` 工具调用变体，会抛出 `UnsupportedToolCallError`，
而不是塌缩成一次空的成功回合。

DeepSeek V4 Flash 获得原生推理控制：`AgentConfig.thinking.enabled` 映射到 DeepSeek 的
`thinking.type`，`thinking.effort` 接受 DeepSeek 专有的 `'max'`，并且不会把它转发给
OpenAI、Azure OpenAI 或 GitHub Copilot。

1.13.0 的所有公开导出都仍然保留，新增的结果与配置字段都是可选的，因此现有调用方和已
序列化的结果继续能通过类型检查。自适应恢复引入了携带计划修订历史的第 2 版任务队列
快照；`TaskQueue.fromSnapshot()` 仍然接受第 1 版快照，早期版本写下的 checkpoint 依然
可以恢复。

阅读完整的 [v1.14.0 Release
Notes](https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.14.0)，
或从[快速开始](/zh/getting-started/quick-start/)入手。
