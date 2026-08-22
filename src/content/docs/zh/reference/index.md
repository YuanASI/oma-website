---
title: "参考"
description: "参考文档索引——模型与工具配置、编排控制、可靠性与可观测性，以及 oma 命令行。"
---

参考文档描述运行时的接口面：各子系统的选项、类型与行为。它默认你已经跑通了一次运行——如果还没有，请先看[快速开始](/zh/getting-started/quick-start/)。

其中大部分页面从框架仓库同步而来，由定期同步刷新，因此它们跟随已发布的版本，而不是在本站手工重写。

## 配置模型与工具

- [模型提供方](/zh/reference/providers/) —— 托管、云端与本地模型：内置快捷方式、OpenAI 兼容端点、环境变量，以及本地工具调用。
- [工具配置](/zh/reference/tool-configuration/) —— 默认拒绝的工具授权、预设与允许列表、文件系统沙箱、自定义工具与 MCP。
- [外部智能体](/zh/reference/external-agents/) —— 在任务 DAG 中运行本地进程或 ACP 编码智能体，并明确权限、用量与生命周期边界。

## 控制编排

- [执行路由](/zh/reference/execution-routing/) —— 通过显式模式、治理策略、自定义路由器与可审计的决策，在单智能体与团队执行之间选择。
- [任务调度](/zh/reference/task-scheduling/) —— 事件驱动的 DAG 执行、调度策略、结构化的需求与交接、优先级与审批模式。
- [共识](/zh/reference/consensus/) —— `runConsensus` 的提议者到裁判验证、按任务的 verify 钩子，以及共享 token 预算的不变量。
- [模型路由](/zh/reference/model-routing/) —— 可选的确定性策略，按阶段、智能体、任务角色、优先级或叶子节点把编排阶段路由到不同模型。
- [计划预览与重放](/zh/reference/plan-replay/) —— 用 `createPlanArtifact` 冻结已审阅的任务 DAG，之后用 `runFromPlan` 执行，无需再次调用协调器。
- [共享内存](/zh/reference/shared-memory/) —— 团队共享的带命名空间键值存储，可在进程内运行，也可接自定义 `MemoryStore` 后端。

## 可靠运行

- [可观测性](/zh/reference/observability/) —— TraceRecord v2 sink、TraceStore 实现、可选的 OpenTelemetry 导出，以及离线的运行后 Run Viewer。
- [可观测性迁移](/zh/reference/observability-migration/) —— 分阶段、可回退地从 `onTrace` 迁移到 sink、store 与 OpenTelemetry，且不改变运行结果。
- [可观测性性能](/zh/reference/observability-performance/) —— 可复现的性能预算、基准测试方法，以及当前版本的实测快照。
- [检查点与恢复](/zh/reference/checkpoint/) —— 基于任意 `MemoryStore` 的可选按运行快照：持久化任务进度，并在崩溃、中止或重启后恢复。
- [自适应恢复](/zh/reference/adaptive-recovery/) —— 在某个结果产生后，修订任务图中尚未执行的部分，采用经校验、可审批、仅追加的计划补丁。
- [上下文管理](/zh/reference/context-management/) —— 用上下文策略、工具结果压缩与跨提供方推理，把长时间运行控制在 token 上限之内。
- [评估](/zh/reference/evaluation/) —— 为 EvalSet 与打分器做版本管理、持久化结果、在 CI 设质量闸，并对已完成的生产运行采样，且不改变业务结果。

## 命令行

- [CLI](/zh/reference/cli/) —— JSON 优先的 `oma` 二进制命令，面向 shell 与 CI：命令、配置文件、输出与退出码。

## 文档的其他部分

- [简介](/zh/getting-started/introduction/)、[快速开始](/zh/getting-started/quick-start/)与[选择运行方式](/zh/getting-started/three-ways-to-run/)覆盖第一次运行。
- [编排控制](/zh/guides/orchestration-controls/)、[控制成本与预算](/zh/guides/cost-budget-control/)与[生产清单](/zh/guides/production-checklist/)覆盖运行进入生产前需要做的决定。
