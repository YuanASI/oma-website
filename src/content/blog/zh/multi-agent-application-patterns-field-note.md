---
title: "一线观察：多智能体工作流到底从哪里开始有用"
description: "在 OMA 的可运行场景 recipe 里，几条边界反复出现：并行阅读、来源隔离、显式交接、运行时规划，以及为硬规则设置独立否决。"
pubDate: 2026-07-31
tags: ["field-notes", "workflow-design", "agents"]
contentType: field-note
useCases: ["多智能体适用性", "工作流拆解"]
industries: ["应用设计"]
evidence:
  kind: field-observation
  note: "这篇总结来自 OMA 当前的可运行场景 recipes；它们是应用原型，不代表客户部署或行业的代表性样本。"
related:
  solutions: ["parallel-llm-calls", "goal-driven-orchestration"]
  examples: ["meeting-summarizer", "competitive-monitoring", "contract-review-dag", "adaptive-customer-support"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 6
---

我们连续做了不少多智能体示例，然后在完全不同的领域里，反复撞见同一个错误。

大家总是从“需要哪些 Agent”开始。

Researcher。Writer。Reviewer。Planner。

顺序反了。

真正有用的起点，是工作边界：哪些部分可以独立运行，哪些证据必须保持分离，哪次交接需要类型契约，哪个决定不能交给模型。

这篇总结 Open Multi-Agent 可运行场景 recipes 里反复出现的模式。它不是客户调研。Recipes 是带 fixtures 和明确边界的原型。但它们依旧有价值，因为工作流形态会重复。

## 模式一：同一份输入，需要几种独立阅读

[会议纪要示例](/zh/examples/meeting-summarizer/)把同一份转录交给三个专职 Agent：摘要、待办项和情绪。

多个 Agent 有帮助，是因为三种输出契约不同。摘要是文字。待办项需要负责人。情绪需要受限标签和证据。

这套模式是：

> 一份来源 → 多种独立解读 → 一次聚合。

这是最干净的 fan-out 场景。多视角代码审查和文档分析里，也会出现同样结构。

如果每个分支都只返回同一种泛泛总结，多个 Agent 很可能只是在放大成本。

## 模式二：来源要先保持分歧，才能被调和

[竞品监控 recipe](/zh/examples/competitive-monitoring/)隔离社交、社区和新闻 fixtures。[论文复现分流](/zh/examples/paper-replication-triage/)则隔离论文论断、代码工件、数据集证据与后续讨论。

重点不在于多个 Agent 知道得更多，而在于每份结果仍然可以追溯。

这套模式是：

> 来源分离 → 结构化审查 → 显式处理矛盾。

在第一个 prompt 就混合所有来源，会让顺滑答案更容易，让证据审计更困难。

当来源与分歧本身就是交付物的一部分时，才使用来源专属 Agent。不要用多个 Agent 掩盖来源质量问题。

## 模式三：固定依赖，就该用固定图

[合同审查 DAG](/zh/examples/contract-review-dag/)在运行前就知道拓扑：

- 先抽取条款。
- 抽取完成后，并行做合规审查与摘要。
- 两个分支都结束，才生成最终通知。

[事故复盘 DAG](/zh/examples/incident-postmortem-dag/)也是同一性质。调查并行扇出，分析等待，写作排在最后。

这套模式是：

> 已知交接 → 显式依赖 → 只并行真正独立的节点。

没有必要花一次协调器调用，重新发现一张稳定任务图。`runTasks()` 让它保留在可审阅代码里，也能把重试策略放到真正可能失败的步骤上。

## 模式四：会变化的工作，才可能值得运行时规划

[自适应客服 recipe](/zh/examples/adaptive-customer-support/)不同。物流升级事件和账单争议，可能需要不同专家与依赖关系。

这套模式是：

> 请求会变化 → 协调器提出任务 DAG → 应用检查并约束运行。

目标驱动规划的额外调用，在这里才开始值得。也正因为拓扑不固定，计划检查、预算和链路会更重要。

动态规划应该解决真实的变化问题。“我不想写图”还不够。

## 模式五：硬规则应该放在生成闭环外

有些 recipes 带仲裁或最终安全判断。叙事谜题示例让几个专家提出提示，再让独立 Reviewer 对受保护信息拥有二元否决权。

这套模式是：

> 在工作流内部生成和协商，在协商之外执行硬边界。

一句“请注意安全”的 prompt 只是偏好。一个独立的允许、审查或拒绝决定，才可以被检查和测试。

这不会让分类器永远正确。它只是把权限边界变得明确。

## 一个更小的判断题

增加第二个 Agent 之前，先问五个问题：

1. 是否真的有不同工作成果？
2. 其中一部分能否独立运行？
3. 证据是否必须保持可追溯？
4. 拓扑是固定的，还是随请求变化？
5. 是否有模型不能独自做出的决定？

如果大部分答案是否，就用一个 Agent，或者普通代码。

如果答案暴露出并行工作、冲突证据、类型化交接或硬权限边界，多个 Agent 才可能让应用结构更干净。

这些 recipes 反复告诉我们的就是这件事：价值不从 Agent 数量开始。价值从工作流里真实存在的缝隙开始。
