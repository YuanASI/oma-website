---
title: "持久化审批门"
description: "在计划、轮次、派发或工具调用的关卡上挂起一次带检查点的运行，在回调之外做决定，再从完全相同的受审内容恢复。"
---

OMA 可以在某个审批边界上停下一次带检查点的任务运行，向应用返回一份持久的请求，并在
进程重启之后从完全相同的受审内容继续。既有的同步决定保持不变：`true` 与
`{ action: 'allow' }` 继续执行，`false` 与 `{ action: 'deny' }` 拒绝。只有当决定必须发生在
当前回调生命周期之外时，才返回 `{ action: 'suspend' }`。

持久化审批是一项执行状态能力，而非遥测能力。挂起的续行由检查点掌管。同一个
`MemoryStore` 中一条独立的主审批记录，掌管不可变的请求与「先到先得」的决定。trace 与
执行回执可以从中派生审批事实，但遥测丢失既不会丢失、也不会改变一个决定。

## 支持的边界

| 关卡 | 受审内容 | 恢复行为 |
|---|---|---|
| `onPlanReady` | 可由检查点恢复的协调器任务快照，以及调用方请求的是执行还是 `planOnly` | 精确运行那些快照；`planOnly` 时则返回它们 |
| `onApproval` | 旧版轮次屏障处已完成的任务与下一批待执行任务 | 开始已受审的下一轮，且不为该边界再次调用关卡 |
| `onTaskDispatch` | 派发前一刻、一份完全分配好的任务快照 | 派发那一个确切的任务，且不为该边界再次调用关卡 |
| `onToolCall` | 工具名、模型下发的输入、经 Zod 校验的输入、智能体、任务、工具调用 ID 与 `consequential` 标志 | 应用那条持久的决定，而不重新运行关卡；批准会执行已校验的那次调用，拒绝则返回一个被拒的 `ToolResult` 而不调用该工具 |

计划、轮次与派发关卡接受 `ApprovalGateDecision`。工具关卡接受 `ToolCallDecision`；两者都
包含同样的 `allow`、`deny` 与 `suspend` 对象形式。为向后兼容，三个既有的编排关卡仍支持
布尔形式。

## 挂起、决定与恢复

挂起需要配置检查点，并且检查点的 `MemoryStore` 要实现原子的 `compareAndSet`。该存储必须
对审阅者和恢复后的进程都保持可用。

```typescript
import {
  decideApproval,
  FileStore,
  OpenMultiAgent,
} from '@open-multi-agent/core'

const store = new FileStore('./.oma/release-run.json')
const orchestrator = new OpenMultiAgent({
  onTaskDispatch: async (task) => {
    if (task.priority === 'critical') {
      return { action: 'suspend', reason: 'Critical release review' }
    }
    return true
  },
})

const suspended = await orchestrator.runTasks(team, tasks, {
  checkpoint: { store },
})

if (suspended.status?.code === 'suspended') {
  for (const request of suspended.pendingApprovals ?? []) {
    // Present request.content and request.requestHash to the reviewer.
    await decideApproval(store, {
      requestId: request.id,
      requestHash: request.requestHash,
      decision: 'approve', // or 'reject'
      reviewer: { id: currentUser.id, displayName: currentUser.name },
    })
  }
}

// A fresh process rebuilds the same team/backend wiring and uses the same store.
const result = await new OpenMultiAgent({
  onTaskDispatch: applicationDispatchPolicy,
}).restore(resumedTeam, { checkpoint: { store } })
```

一个挂起的结果具有 `success: false`、`status.code === 'suspended'`，以及一个或多个
`pendingApprovals`。当一份请求尚未决定时，不要用 `restore()` 去强推进度：它会再次返回
`suspended`，且不会执行任何受审的工作。

面向审阅者的公开辅助函数为：

- `getApprovalRecord(store, requestId)`——读取主请求以及任何已有的决定；
- `decideApproval(store, input)`——针对一个确切的 `requestHash` 原子地批准或拒绝；
- `DurableApprovalLedger`——面向希望持有长期账本对象的应用的更底层等价物。

`decideApproval` 会记录审阅者必填的 `id`、可选的 `displayName`、归一化后的决定，以及
写入决定一方的当前时间。决定不可变：第一次成功的 compare-and-set 获胜；并发或重复的
决定会以 `APPROVAL_CONFLICT` 失败。

## 精确内容绑定

每份请求都有一个确定性 ID 和一个 SHA-256 的 `requestHash`。该哈希基于包含审批作用域、
边界与受审内容的规范化 JSON 计算得出。对象键的顺序无法改变它。用作说明的 `reason` 与
`requestedAt` 属于元数据，不参与受审内容的哈希。

该绑定覆盖的是序列化后的 `request.content`，而不是活动的应用装配。智能体适配器、
prompt、工具实现、schema 与回调，必须由应用重建，并留在其部署的信任边界之内。当一个
待执行任务带有 `verify` 配置时，任务级挂起会失败即关闭，因为那个对象可能包含当前检查点
schema 无法重建的活动裁判、schema 与 prompt 回调。

审阅者必须同时提交 `requestId` 与它所检视的那个哈希。哈希发生变化会以
`APPROVAL_STALE_DECISION` 失败。恢复期间，OMA 会独立地把请求与已检查点化的计划、任务
状态或待执行工具调用做比对；它还会把检查点中的决定历史与主账本做比对。任何不一致都会
在被批准的任务或工具执行之前失败。

对工具调用而言，恢复会用当前的 Zod schema 重新校验原始输入，并把得到的已校验值与受审
内容做比对。这可以防止一个被改动的输入、或被改动的校验结果，继承一份旧的批准。受审
内容必须是 JSON 兼容的：只能是有限数值、字符串、布尔值、null、数组与普通对象。

这是跨 OMA 多份独立记录的完整性校验，不是针对存储管理员的密码学签名。一个既能改写
检查点、又能改写主账本的主体，仍处在信任边界之内。请据此保护并审计该存储。

## 拒绝与恢复语义

- 拒绝一个计划、轮次或任务派发，会产生一个顶层的 `rejected` 结果，并跳过剩余工作。
  这一终态拒绝在反复恢复之后依然成立。
- 拒绝一次工具调用，会产生与内联关卡拒绝相同的那类错误 `ToolResult`。该工具不会被调用；
  模型可以在下一轮里自行调整。
- 批准一次工具调用会执行它一次，随后任务中途的检查点会在模型继续之前记录它返回的结果。
  如果进程在外部系统提交之后、工具返回之前死掉，通常的
  [外部副作用幂等窗口](/zh/reference/checkpoint/#任务中途的工具恢复)依然适用。
- 一次普通的检查点写入仍是尽力而为的。而让一份待决审批变得可恢复的那次写入是严格的：
  除非确切的续行已被保存、且主请求已被创建，否则 OMA 不会报出挂起。
- 缺失检查点、缺失 CAS 能力、记录格式错误或内容陈旧，都会失败即关闭。受保护的任务或
  工具不会被执行。

最终结果上的 `approvalDecisions` 包含本次逻辑运行所消费的决定。`buildExecutionReceipt()`
会从该结果中复制一份有界的审批摘要。回执是派生证据；`__oma_approval__/<requestId>` 下的
主记录才具权威性。

## 存储要求

`InMemoryStore` 提供进程内的 CAS，适合测试。`FileStore` 为共享同一个 `FileStore` 实例的
并发调用方提供 CAS。它仍然是一个没有跨进程锁的单写者文件存储：进程外的审阅者应在挂起的
写入方退出之后再做决定，或者改用一个 `compareAndSet` 对所有写入方都原子的数据库存储。

审批请求可能包含完整的任务描述，以及原始 / 已校验的工具参数。它们会被原样持久化，以便
被批准的操作保持精确。请对这类数据采用相应的访问控制与加密。`RedactingStore` 对持久化
审批是刻意不支持的，因为它有损、且会改变内容哈希；它在普通的检查点与共享内存脱敏中
仍然可用。

## 明确的限制

- 工具调用的挂起，仅在经由 `runTeam`、`runTasks` 或 `runFromPlan` 抵达的、带检查点的内置
  LLM 工作智能体内部受支持。独立的 `runAgent`、`runTeam` 的自动简单目标短路、进程后端与
  ACP 后端都不暴露可恢复的私有工具循环状态；在那些位置，一个 `suspend` 工具决定会失败
  即关闭。编排层的计划、轮次与派发关卡，对符合条件的外部后端任务依然生效。
- 一次审批绑定的是序列化后的请求数据，而不是已部署的代码或活动的智能体配置。更换
  适配器、prompt、工具实现或 schema，属于应用的部署边界。当这一区别重要时，请在运行
  挂起期间钉住某个部署版本，或把一个应用自有的版本号纳入受审的任务 / 工具数据。
- 带 `verify` 的任务仍可使用既有的内联布尔审批，但它的计划 / 轮次 / 派发关卡不能返回
  `suspend`。当验证必须成为持久审批边界的一部分时，请把它建模为一个显式任务。
- 自适应恢复的 `onPlanPatch` 回调在本约定中不可挂起。它仍是一个内联的布尔决定。
- 没有内置的过期、改派、撤销、法定人数，也没有对已记录决定的替换。当策略要求一份新的
  请求时，应用可以选择不恢复，而是开启一次新的逻辑运行。
- 检查点仍是「最新快照」式的状态。仅追加的事件溯源与状态转换回放是单独的工作，追踪于
  [#313](https://github.com/open-multi-agent/open-multi-agent/issues/313)。

完整的「挂起 / 决定 / 全新编排器」流程，见无需密钥即可运行的
[`durable-approval`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.17.0/packages/core/examples/patterns/durable-approval.ts)
示例。
