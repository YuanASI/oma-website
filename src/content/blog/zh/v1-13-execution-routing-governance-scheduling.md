---
title: "Open Multi-Agent v1.13：路由、治理、调度与运行证据"
description: "v1.13 带来执行路由、声明式治理、高影响工具确认、事件驱动任务调度、任务级结果、结构化交接与可重试的模型 fallback。"
pubDate: 2026-07-24
tags: ["release","orchestration","governance","typescript"]
contentType: release
useCases: ["执行路由", "治理式编排", "任务调度"]
industries: []
evidence:
  kind: release-note
  note: "描述已经发布的 v1.13.0 运行时能力，并链接到与版本一致的 Reference 文档。"
related:
  solutions: ["goal-driven-orchestration"]
  examples: ["team-collaboration", "task-pipeline", "plan-replay"]
  integrations: ["opentelemetry"]
  comparisons: []
featured: false
readingMinutes: 2
---

Open Multi-Agent v1.13 把四个运行时边界变成显式能力：选择哪种执行拓扑、
一个就绪任务何时派发、哪些动作需要审批，以及运行结束后保留什么证据。

```bash
npm install @open-multi-agent/core@1.13.0
npm create oma-app@latest my-oma
```

这些能力都运行在你自己的 Node.js 后端里。v1.13 没有新增托管的租户、项目、
Thread、席位或 RBAC 控制面。

## 路由单智能体或团队执行

`runTeam()` 现在可以接收显式 `mode`、自定义 `ExecutionRouter`，或使用内置的
确定性路由器。选择出的拓扑会进入 `result.routingDecision`，并与 trace 证据关联。

```ts
const result = await orchestrator.runTeam(team, goal, {
  mode: 'team',
})
```

执行路由选择的是**单智能体还是团队**。它与模型路由刻意分离：模型路由负责在
已选拓扑内部，为一次调用选择模型。自动路由器也会通过 script-aware 的信息长度，
识别结构化的中文、日文与韩文目标。

详见[执行路由](/zh/reference/execution-routing/)。

## 声明治理，而不是靠文字暗示

如果工作流必须按顺序经过指定角色，应用可以直接声明角色 DAG：

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

OMA 检查真实执行拓扑，而不是 Agent 文本里的标签。显式模式、治理下限与单次运行
预算遵循一套公开的优先级；覆盖或预算降级都会写进结果字段。

工具作者还可以用 `consequential: true` 标记会产生真实副作用的工具。未声明治理的
运行会暴露机器可读的提示标记，应用也可以通过 `onToolCall` 强制确认。这是策略闸门，
不是进程沙箱。

详见[工具配置](/zh/reference/tool-configuration/)与
[编排控制](/zh/guides/orchestration-controls/)。

## 以事件方式派发 DAG

任务 DAG 现在默认采用事件驱动执行。一个下游任务只要依赖完成就会变为可派发，
不再等待同一逻辑层里与它无关的工作。

应用可以选择 dependency-first、round-robin、least-busy、capability-match 或
加权 composite 调度。`onTaskDispatch` 为单个就绪任务提供原生审批边界；已有
`onApproval` 集成继续保留按轮调度与原有回调语义。

任务现在可以声明硬性能力要求、优先级、逻辑角色和有边界的来源 metadata。
交接可以传原始输出、已校验的结构化数据，或同时传两者。
`TeamRunResult.taskResults` 会按稳定任务 ID 保留每个未合并结果。

详见[任务调度与派发](/zh/reference/task-scheduling/)。

## 让证据与实际执行连接

`buildExecutionReceipt(result, trace?)` 会推导一份紧凑、保护隐私的实际执行记录：
模式、worker 实例、逻辑任务角色、跨角色依赖边、执行顺序、用量、耗时、路由关联，
以及记录是否不完整。

Receipt 补充完整 trace 与离线 Run Viewer；它不是托管审计服务。Checkpoint 也会保留
更完整的任务级结果与交接 metadata，让恢复后的运行能够重建 `taskResults`。

详见[可观测性](/zh/reference/observability/)与
[检查点和恢复](/zh/reference/checkpoint/)。

## 可靠性与兼容性

模型路由规则可以声明一组有顺序的 fallback，用于可重试的 worker provider 故障。
Fallback 链复用任务现有的重试预算；校验、认证、Hook 与其他非 provider 错误不会
推进到下一个模型。

原始依赖输出仍是默认值。结构化交接、治理声明、高影响操作确认与自定义执行路由都
需要显式开启。独立 DAG 分支的 progress event 现在可能交错出现，因此消费者应按
任务 ID 关联，而不要假设整轮事件相邻。

阅读完整的 [v1.13.0 Release
Notes](https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.13.0)，
或从 [v1.13 能力地图](/zh/capabilities/)开始。
