---
title: 生产清单
description: "上线前需要配置好的各项控制：token 与成本预算、超时、重试、工具输出上限、追踪以及工具授权。"
---

上线之前，请先配置好各项控制：约束 token 开销、支持故障恢复，并便于调试。

| 关注点 | 配置项 | 所在位置 |
|---------|------|----------------|
| 约束对话长度 | 每个智能体的 `maxTurns` + `contextStrategy`（`sliding-window` / `summarize` / `compact` / `custom`） | `AgentConfig` |
| 约束挂钟时间 | 每个智能体的 `timeoutMs`（中止发生挂起的运行，本地模型下较为常见） | `AgentConfig` |
| 限制工具输出上限 | `maxToolOutputChars`（或工具级的 `maxOutputChars`）+ `compressToolResults: true` | `AgentConfig` 与 `defineTool()` |
| 从故障中恢复 | 任务级的 `maxRetries`、`retryDelayMs`、`retryBackoff`（指数退避倍率） | 通过 `runTasks()` 使用的任务配置 |
| 崩溃或重启后恢复 | `checkpoint`（需显式开启、针对每次运行的快照）+ `orchestrator.restore()` 恢复 | `OrchestratorConfig` / 调用时指定 |
| 约束模型开销 | `maxTokenBudget`，或 `maxCostBudget` 搭配由调用方提供的 `estimateCost` 函数 | `OrchestratorConfig` |
| 捕获卡住的智能体 | `loopDetection` 搭配 `onLoopDetected: 'terminate'`（或自定义处理器） | `AgentConfig` |
| 追踪与审计 | 将 `onTrace` 接入你的追踪后端；持久化 `renderTeamRunDashboard(result)` | `OrchestratorConfig` |
| 脱敏密钥 | 自动完成：API 密钥、token 与 Authorization 请求头会从追踪、bash 输出及仪表盘载荷中剥除 | 内置（默认开启） |
| 审慎授予工具 | 内置工具需显式开启（默认拒绝）：智能体仅获得其在 `tools` / `toolPreset` 中列出的工具；两者均未列出时则不授予任何工具。`bash` 一经授予即在无沙箱环境中运行，且每个工具结果都会发送至你的模型提供方，因此授予读取/执行权限时务必审慎。`defaultToolPreset` 可用一行代码恢复此前的「全部工具」行为 | `AgentConfig` / `OrchestratorConfig` |
| 约束文件系统访问范围 | `cwd` / `defaultCwd`（默认为 `.agent-workspace` 子目录；可用 `process.cwd()` 放宽，或用 `null` 禁用） | `AgentConfig` / `OrchestratorConfig` |

更深入的说明请分别参阅[成本与预算控制](/zh/guides/cost-budget-control/)、[上下文管理](/zh/reference/context-management/)（策略与工具结果压缩）、[工具配置](/zh/reference/tool-configuration/)（授权与文件系统沙箱），以及[检查点与恢复](/zh/reference/checkpoint/)（基于 MemoryStore 的快照与恢复）。

:::tip[准备将其投入生产环境？]
open-multi-agent 采用 MIT 许可证，可免费自行部署。若你希望在既定期限内完成交付、集成或获得支持，[元定义科技（YuanASI）](https://yuanasi.com)提供商业交付与支持服务。
:::
