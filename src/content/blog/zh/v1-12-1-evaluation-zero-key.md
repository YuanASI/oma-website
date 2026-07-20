---
title: "Open Multi-Agent v1.12.1：评估、离线检查与零 Key 首次运行"
description: "v1.12.1 带来版本化 EvalSet、Scorer、CI 闸门、线上采样、更完整的离线运行检查、单次运行 metadata，以及无需 API Key 的确定性 create-oma-app Demo。"
pubDate: 2026-07-20
tags: ["release","evaluation","typescript"]
readingMinutes: 5
---

Open Multi-Agent v1.12.1 在运行时外面补上了一套质量闭环。你现在可以给评估案例与 Scorer 逻辑做版本管理、比较报告、在 CI 中执行质量闸门，也可以采样已经完成的线上运行，而不改变业务结果。同一个版本还把 `create-oma-app` 的首次运行变成无需凭证的确定性 Demo，并为离线 Run Viewer 补充了更完整的任务级证据。

```bash
npm install @open-multi-agent/core@1.12.1
npm create oma-app@latest my-oma
```

这里的补丁版本很重要：v1.12.1 修复了安装后的 `oma` binary，使它能通过 npm 创建的符号链接正常启动。如果你安装过 v1.12.0，请升级到 v1.12.1。

## Evaluation 与运行时校验是两件事

OMA 已经有 `runConsensus()` 与逐任务 `verify` 等运行时控制。这些机制会在一次业务结果生成期间接受、修改或拒绝它。

Evaluation 回答的是另一个问题：一次变更是否在一组有版本的案例上改善了质量？

新的 `@open-multi-agent/core/eval` 入口包含：

- 有版本的 `EvalSet` 数据集与可复用的 `Scorer` 定义；
- 通过 `runEvalSet()` 执行离线评估，并支持 repeats、并发与标签过滤；
- JSON、Markdown 与 JUnit 报告；
- 内存与文件持久化；
- 纯逻辑 `GateVerdict`，以及用于 CI 的 `oma eval run` 与 `oma eval gate`；
- 基于规则、Trace 和模型 Judge 的 Scorer 工厂；
- 对已完成运行进行显式开启的线上采样。

一个 Scorer 抛错、拒绝或超时，意味着它没有量出质量。OMA 会把结果记录为 `scorer_error`，继续运行后续 Scorer，并把该失败排除在均值、分位数和通过率之外，而不是把它算成零分。

线上评估默认关闭。开启后，它只采样已经结束的顶层运行，异步执行评估，并把评估故障与原始结果隔离。这是一套度量机制，不是第二个运行时判决。

[评估参考](/zh/reference/evaluation/)包含五分钟离线路径、线上生命周期、持久化、载荷策略、Scorer 工厂和完整的 GitHub Actions 闸门。

## 运行结束后，拿到更完整的证据

离线 Run Viewer 现在会把后代 LLM span 汇总到触发它们的任务上。因此任务详情可以在 DAG、状态、耗时和安全证据之外，展示对应的模型、提供方、token 与成本汇总，以及工具调用次数。

整个过程不需要运行中的服务。`oma run --dashboard` 会在新运行结束后写出一个自包含 Viewer；`oma dashboard` 则能从 `FileTraceStore` 打开一条已保存的运行，不会调用模型，也不会启动 OpenTelemetry provider。

顶层运行 API 还接受有边界的 metadata，用来记录 prompt 版本、实验分组或数据集标签等事实。校验后的 metadata 会进入结果、根 Trace span、存储的运行摘要与 v2 检查点恢复路径，让评估记录能够指回准确的逻辑运行与 attempt。

具体生命周期与命令见[可观测性](/zh/reference/observability/)和 [CLI 参考](/zh/reference/cli/)。

## 无需凭证的首次运行

`create-oma-app@0.5.0` 现在会让交互式终端选择 PR Review、安全分析或教学 DAG Starter，然后自动安装并运行本地 Demo。

首次 Demo 不读取 API Key，也不会请求模型。脚本化的模型响应会驱动真实的 OMA 调度器、结果聚合、报告生成器与 Run Viewer。生成的 Markdown、JSON 和 HTML 会明确标注这些响应属于模拟数据，避免把演示产物误认为真实模型结果。

使用 `--no-install` 可以只生成文件；使用 `--no-run` 可以安装依赖但不运行 Demo。真实的云端模型运行仍然需要你的凭证；Ollama Starter 则使用本地服务。[快速开始](/zh/getting-started/quick-start/)会把两条路径明确分开。

## 兼容性

现有的 `runAgent`、`runTeam`、`runTasks`、`runFromPlan`、`runConsensus` 与恢复流程保持兼容。Evaluation 在未配置时仍然关闭。`@open-multi-agent/otel@0.1.0` 没有重新发布，并继续兼容 core 1.12.1。

这个版本还会在 process backend 的直接父进程退出后清理其后代进程。同期的 orchestrator 内部拆分保持行为不变，不构成新的公共 API。

阅读完整的 [v1.12.1 Release Notes](https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.12.1)，然后从[评估](/zh/reference/evaluation/)或[零 Key 快速开始](/zh/getting-started/quick-start/)进入。
