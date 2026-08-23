---
title: "指南"
description: "围绕单个决定、串起多个运行时能力的实操文档：编排控制、成本与预算上限，以及生产清单。"
---

指南回答「怎样让一次运行按预期行事」，[参考](/zh/reference/)回答「这个选项具体做什么」。每篇围绕一个决定，把运行时的若干部分串起来。

- [编排控制](/zh/guides/orchestration-controls/) —— 执行拓扑、显式声明的治理策略、任务分发、对高后果工具的闸门、取消、协调器配置与扇出。
- [控制成本与预算](/zh/guides/cost-budget-control/) —— 用 `maxTokenBudget` 或 `maxCostBudget` 配合调用方自己的 `estimateCost` 给一次运行设上限，并决定触顶时应该发生什么。
- [生产清单](/zh/guides/production-checklist/) —— 上线前要接好的控制项：路由、分发、预算、超时、恢复、证据、脱敏与工具授权。

## 其他

- [入门指南](/zh/getting-started/) —— 安装、第一次运行，以及如何选择运行方式。
- [参考](/zh/reference/) —— 全部运行时文档，按其配置的对象分组。
