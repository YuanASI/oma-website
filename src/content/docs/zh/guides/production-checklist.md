---
title: 生产清单
description: "上线前要接好的那些控制项——token 与成本预算、超时、重试、工具输出上限、追踪以及工具授权。"
---

上线之前，接好那些保护 token 开销、从失败中恢复、并让你能调试的控制项。

| 关注点 | 旋钮 | 它在哪 |
|---------|------|----------------|
| 限定对话长度 | 每个智能体的 `maxTurns` + `contextStrategy`（`sliding-window` / `summarize` / `compact` / `custom`） | `AgentConfig` |
| 限定挂钟时间 | 每个智能体的 `timeoutMs`（中止挂死的运行，本地模型常见） | `AgentConfig` |
| 给工具输出封顶 | `maxToolOutputChars`（或按工具的 `maxOutputChars`）+ `compressToolResults: true` | `AgentConfig` 与 `defineTool()` |
| 从失败中恢复 | 按任务的 `maxRetries`、`retryDelayMs`、`retryBackoff`（指数倍率） | 经 `runTasks()` 使用的任务配置 |
| 挺过崩溃或重启 | `checkpoint`（需显式开启的按运行快照）+ `orchestrator.restore()` 来恢复 | `OrchestratorConfig` / 按调用 |
| 限定模型开销 | `maxTokenBudget`，或 `maxCostBudget` 配合调用方维护的 `estimateCost` 函数 | `OrchestratorConfig` |
| 抓住卡住的智能体 | `loopDetection` 配 `onLoopDetected: 'terminate'`（或自定义处理器） | `AgentConfig` |
| 追踪与审计 | `onTrace` 接到你的追踪后端；持久化 `renderTeamRunDashboard(result)` | `OrchestratorConfig` |
| 脱敏密钥 | 自动——API 密钥、token 和 Authorization 头会从追踪、bash 输出和仪表盘载荷中剥除 | 内置（默认开启） |
| 刻意授予工具 | 内置工具需显式开启（默认拒绝）：智能体只拿到它在 `tools` / `toolPreset` 里列出的；两者都不列就一个都没有。`bash` 一旦授予便保持无沙箱，且每个工具结果都会发给你的模型提供方——所以授予读/执行权限要有意为之。`defaultToolPreset` 一行恢复旧的「全部工具」行为 | `AgentConfig` / `OrchestratorConfig` |
| 限定文件系统触达范围 | `cwd` / `defaultCwd`（默认 `.agent-workspace` 子目录；用 `process.cwd()` 放宽，用 `null` 禁用） | `AgentConfig` / `OrchestratorConfig` |

深入讲解包括[成本与预算控制](/zh/guides/cost-budget-control/)、[上下文管理](/zh/reference/context-management/)中的策略与工具结果压缩、[工具配置](/zh/reference/tool-configuration/)中的授权与文件系统沙箱，以及[检查点与恢复](/zh/reference/checkpoint/)中的 MemoryStore 快照/恢复。

:::tip[要把它用到生产环境？]
open-multi-agent 采用 MIT 许可、可自行免费部署。如果你更希望在期限内交付、集成或获得支持，[元定义科技（YuanASI）](https://yuanasi.com)提供商业交付与支持。
:::
