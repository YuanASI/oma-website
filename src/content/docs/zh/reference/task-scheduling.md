---
title: 任务调度与派发
description: "用分配策略、能力要求、结构化交接、逐任务审批和任务级结果运行事件驱动任务 DAG。"
---

`runTeam()`、`runTasks()`、`runFromPlan()` 与 `restore()` 通过同一套调度器和
队列执行任务 DAG。默认执行器是事件驱动的：一个下游任务只要依赖满足就会启动，
不会等待同一时刻变为就绪的其他无关任务。

## 事件驱动执行

执行器维护就绪集合与运行中映射：

1. 当任务没有未解决依赖时，`TaskQueue` 发出 `task:ready`；
2. 调度器根据当前 DAG 快照为这一个就绪任务分配 Agent；
3. 派发闸检查取消、预算、审批状态与 AgentPool 容量；
4. 任务通过 `AgentPool` 派发；
5. 完成后立即解除下游依赖，并唤醒执行器。

`AgentPool` 的 semaphore 继续是并发权威，包括临时的 `delegate_to_agent`
运行。派发闸只是集成接口，不会增加资源锁或第二套并发系统。

任务失败与跳过传播仍由 `TaskQueue` 负责。失败或跳过会立即级联到依赖任务，
无关分支则继续执行。

## 任务结果与依赖载荷

`TeamRunResult.agentResults` 继续以 Agent 名称为键，并在一个 Agent 执行多个任务时
保持既有合并行为。任务运行还会填充以稳定任务 ID 为键的
`TeamRunResult.taskResults`，因此每个任务未合并的 `AgentRunResult` 都可读取：

```ts
const result = await orchestrator.runTasks(team, tasks)
const extractTask = result.tasks?.find(task => task.title === 'Extract')
const extracted = extractTask
  ? result.taskResults?.get(extractTask.id)?.structured
  : undefined
```

两个索引指向同一批底层执行。运行级 token 用量与指标只从内部结果计算一次，
暴露 `taskResults` 不会重复计数。

直接依赖默认仍注入原始 `output`。显式任务可以选择已校验的结构化交接：

```ts
{
  title: 'Review',
  description: 'Review validated extraction records.',
  dependsOn: ['Extract'],
  dependencyPayload: 'structured', // 'output' (default) | 'structured' | 'both'
}
```

`structured` 只注入由依赖任务成功的 `AgentRunResult.structured` 生成的规范 JSON，
排除 `output` 中的叙述文本。`both` 会注入带标签的原始与结构化区段。结构化值缺失
或不可序列化时，下游任务会以机器可读校验错误失败；OMA 不会静默回退到原始输出。
每个显式开启的依赖载荷在消费者 Agent 调用前限制为 64 KiB。为兼容 1.x，
默认 `output` 路径保持不变。

## 任务角色与来源 metadata

`assignee` 标识具体 worker 实例；`role` 可以单独标识逻辑业务职能；有边界的
`metadata` 可携带 `sourceFile`、`supplierId` 或 `documentId` 等引用：

```ts
{
  title: 'Read supplier reply 01',
  description: 'Extract the simulated quote.',
  assignee: 'supplier-reader-01',
  role: 'supplier-extraction',
  metadata: {
    sourceFile: 'fixtures/supplier-01.json',
    supplierId: 'supplier-01',
  },
}
```

任务 metadata 最多 16 项。键长 1–64 字符，必须以字母开头，其余字符只能是字母、
数字、`.`、`_` 或 `-`；每个字符串最长 1024 字符；同类型标量数组最多 16 个值。
类似凭据的键和保留前缀 `oma.` 会被拒绝。允许的字符串值中若出现类似凭据的文本，
在 metadata 进入结果、任务 trace 属性、checkpoint 快照或计划产物前会先脱敏。

`TaskExecutionRecord` 保留 `role` 与 `metadata`。任务 span 暴露
`oma.task.role` 与 `oma.task.meta.<key>`，旧任务 trace event 则暴露
`taskRole` 和 `taskMetadata`。Execution receipt 保持旧的 `rolesExecuted`
assignee 语义，并增加 `workerInstancesExecuted` 与 `taskRolesExecuted`，避免把
worker 副本与业务角色混淆。

## 分配策略

未指定 assignee 的任务会在就绪时分配。`dependency-first` 与 `composite` 按下游
关键度排序当前就绪集合，再逐个分配选中的任务。`round-robin` 保留游标，
`least-busy` 读取当前 `in_progress` 负载，`capability-match` 则保留硬性资格过滤。

Agent 可以声明 `description`、`capabilities`、`costTier` 与 `latencyClass`；
省略时不会推断。显式 `runTasks()` 规格和 Coordinator 生成的任务可以通过
`requires` 声明 `requiredTools`、`requiredCapabilities`、`requiredBackend`
与 `requiredProvider`。工具要求会在 preset、allowlist、denylist 与框架安全限制
全部解析后，针对最终授权集合检查。

任务 `requires` 无法满足时，`capability-match` 与 `composite` 的行为不同：

| 策略 | 没有符合条件的 Agent |
|---|---|
| `capability-match` | 以 `NO_ELIGIBLE_AGENT` 终止调度。 |
| `composite` | 发出结构化 `NO_ELIGIBLE_AGENT` 警告，再以零匹配度和当前负载回退。 |

`composite` 最大化
`fitWeight * fit + loadWeight * (1 - normalizedCurrentLoad)`。
`schedulingWeights.fit` 与 `schedulingWeights.load` 默认分别为 `0.7` 和 `0.3`；
当前负载是调度时该 Agent 的 `in_progress` 任务数，并在 roster 内归一化。
Composite 负载是传入 DAG 状态的快照；同一次调度器调用内较早的分配不会折回该快照。
事件驱动执行的下一次就绪任务调用可以观察已经标为 `in_progress` 的任务。

Coordinator 计划若指定 roster 外的 Agent，会发出 `INVALID_ASSIGNEE` 警告、清除该
分配，并默认使用配置的调度器。设 `strictAssignees: true` 可在任务执行前以结构化
校验错误停止。

## 审批模式

提供两种互斥的审批模式：

```ts
const pipeline = new OpenMultiAgent({
  onTaskDispatch: async (task) => approveTask(task),
})
```

`onTaskDispatch` 在就绪任务已有 assignee、即将派发前运行。返回 `false` 或抛错会
停止新派发。运行中的任务会先结束，再把所有剩余任务标为 `skipped`。

```ts
const rounds = new OpenMultiAgent({
  onApproval: async (completedRound, nextRound) =>
    approveRound(completedRound, nextRound),
})
```

配置既有 `onApproval` 回调会自动选择旧的整轮语义。参数、回调时机、分配时机与
批次 barrier 均保持不变。同时配置两个回调会抛出配置错误。

没有单独的 `legacyBatchScheduling` 选项。对于依赖轮次边界的调用方，
`onApproval` 本身就是兼容开关；一个始终返回 `true` 的空操作回调可以保留批次调度，
无需再引入重叠的模式标记。

## 中断、预算与 checkpoint

Abort、预算耗尽与审批拒绝共享一条 **drain-then-skip** 路径：

1. 停止接纳新任务；
2. 等待所有运行中任务结束；
3. 把所有剩余 pending 或 blocked 任务标为 `skipped`。

这样可避免任务已被报告为 skipped、其 Agent 却仍在运行。派发前与每次完成后都会
检查预算。越过预算会停止新任务；已经启动的工作仍会结束。

Checkpoint 仍在每个任务完成时写入。写操作通过现有 save chain 串行化；
restore 不会重跑已经记录为 completed 的任务。

## Progress event 迁移

`task_start`、`agent_start`、任务终态 event 与对应 trace span 继续成对出现，但顺序
不再按轮分组：独立分支的 event 可能交错；一个下游 `task_start` 也可能早于某个
无关任务的终态 event。

自定义 UI 应按任务 ID 关联 event，并从任务状态与 `dependsOn` 推导分支状态；
不要从相邻 event 推断轮次边界。如果迁移期间 UI 必须保留轮次分组，请配置
`onApproval` 并返回 `true`。

无需 Key 的 deferred-promise 演示见
[`examples/patterns/event-driven-dag.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.13.0/packages/core/examples/patterns/event-driven-dag.ts)。
它只展示受支持的结论：一个下游任务会在自己的依赖满足后启动，不等待同一就绪集合中
与它无关的任务。
