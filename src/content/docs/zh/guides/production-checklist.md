---
title: 生产清单
description: "v1.13 上线前需要配置的控制：路由、派发、预算、超时、恢复、证据、脱敏与工具授权。"
---

上线之前，请先配置好各项控制：约束 token 开销、支持故障恢复，并便于调试。

| 关注点 | 配置项 | 所在位置 |
|---------|------|----------------|
| 明确执行拓扑 | 显式 `mode`、声明的治理角色 DAG 或 `ExecutionRouter`；检查 `routingDecision` | `RunTeamOptions` / `OrchestratorConfig` |
| 控制任务派发 | 默认事件驱动；逐任务审批用 `onTaskDispatch`，旧式整轮审批用 `onApproval`（两者不能同时配置） | `OrchestratorConfig` |
| 约束对话长度 | 每个智能体的 `maxTurns` + `contextStrategy`（`sliding-window` / `summarize` / `compact` / `custom`） | `AgentConfig` |
| 约束挂钟时间 | 单次模型调用的 `callTimeoutMs` + 整个 Agent 运行的 `timeoutMs` | `AgentConfig` |
| 限制工具输出上限 | `maxToolOutputChars`（或工具级的 `maxOutputChars`）+ `compressToolResults: true` | `AgentConfig` 与 `defineTool()` |
| 从故障中恢复 | 任务级的 `maxRetries`、`retryDelayMs`、`retryBackoff`（指数退避倍率） | 通过 `runTasks()` 使用的任务配置 |
| 崩溃或重启后恢复 | `checkpoint`（需显式开启、针对每次运行的快照）+ `orchestrator.restore()` 恢复 | `OrchestratorConfig` / 调用时指定 |
| 约束模型开销 | `maxTokenBudget`，或 `maxCostBudget` 搭配由调用方提供的 `estimateCost` 函数 | `OrchestratorConfig` |
| 捕获卡住的智能体 | `loopDetection` 搭配 `onLoopDetected: 'terminate'`（或自定义处理器） | `AgentConfig` |
| 追踪与审计 | 用 `TraceStore` 持久化 trace；通过 `buildExecutionReceipt(result, trace)` 生成凭证；用 `renderRunViewer({ result, run })` 导出离线页面 | `OrchestratorConfig` / 运行后 |
| 遥测脱敏 | trace 与 Viewer 展示字段会**尽力**移除识别到的凭据；导出前仍要应用自己的 sink 策略 | 内置 + 你的遥测 sink |
| 持久化状态脱敏 | checkpoint 与共享记忆不受遥测脱敏覆盖；可能写入密钥时，用 `RedactingStore` 包装持久化 store | `MemoryStore` / checkpoint store |
| 证明必要审查 | `governanceIntent: 'required'` 运行后检查 `governanceConclusion`；运行时 `success` 不代表治理成功 | `TeamRunResult` |
| 审慎授予工具 | 内置工具需显式开启（默认拒绝）：智能体仅获得其在 `tools` / `toolPreset` 中列出的工具；两者均未列出时则不授予任何工具。`bash` 一经授予即在无沙箱环境中运行，且每个工具结果都会发送至你的模型提供方，因此授予读取/执行权限时务必审慎。`defaultToolPreset` 可用一行代码恢复此前的「全部工具」行为 | `AgentConfig` / `OrchestratorConfig` |
| 约束文件系统访问范围 | `cwd` / `defaultCwd`（默认为 `.agent-workspace` 子目录；可用 `process.cwd()` 放宽，或用 `null` 禁用） | `AgentConfig` / `OrchestratorConfig` |

更深入的说明请参阅[执行路由](/zh/reference/execution-routing/)、
[任务调度与派发](/zh/reference/task-scheduling/)、
[成本与预算控制](/zh/guides/cost-budget-control/)、
[上下文管理](/zh/reference/context-management/)、
[工具配置](/zh/reference/tool-configuration/)、
[可观测性与执行凭证](/zh/reference/observability/)，以及
[检查点与恢复](/zh/reference/checkpoint/)。

:::tip[准备将其投入生产环境？]
open-multi-agent 采用 MIT 许可证，可免费自行部署。若你希望在既定期限内完成交付、集成或获得支持，[元定义科技（YuanASI）](https://yuanasi.com)提供商业交付与支持服务。
:::
