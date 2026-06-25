---
title: "可观测性"
description: "三个遥测层：onProgress 事件、onTrace span，以及运行后的静态仪表盘。"
---

`open-multi-agent` 暴露三个遥测层：实时进度事件、结构化的 trace span，以及运行后的静态仪表盘。

## 进度事件

当你需要给日志、终端输出或实时 UI 提供轻量级的生命周期事件时，用 `onProgress`。

```typescript
const orchestrator = new OpenMultiAgent({
  onProgress: (event) => {
    console.log(event.type, event.task ?? event.agent ?? '')
  },
})
```

常见的事件类型包括 `task_start`、`task_complete`、`task_retry`、`task_skipped`、`agent_start`、`agent_complete`、`budget_exceeded` 和 `error`。

## Trace Span

当你需要为 LLM 调用、工具执行和任务提供结构化的 span 时，用 `onTrace`。每个 span 携带父 ID、时长、token 计数，以及尽力脱敏后的工具 I/O。

```typescript
const orchestrator = new OpenMultiAgent({
  onTrace: async (span) => {
    await traceSink.write(span)
  },
})
```

把 trace span 转发给 OpenTelemetry、Datadog、Honeycomb、Langfuse，或你自己的运行数据库——但要先判断哪些数据进那个 sink 是安全的。可运行的示例见 [`integrations/trace-observability`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/trace-observability.ts)。

## 运行后仪表盘

`renderTeamRunDashboard(result)` 返回一个静态 HTML 页面，把执行过的任务 DAG 可视化，含计时、token 用量、每任务状态和任务详情。

```typescript
import { writeFileSync } from 'node:fs'
import { renderTeamRunDashboard } from '@open-multi-agent/core'

const result = await orchestrator.runTeam(team, goal)
writeFileSync('run.html', renderTeamRunDashboard(result))
```

库本身不写文件。CLI 可以用 `oma run --dashboard` 替你写仪表盘 HTML；见 [docs/cli.md](/zh/reference/cli/)。

生成的仪表盘是自包含的，不加载远程脚本、样式表或字体。嵌入的运行载荷中看起来敏感的值会在渲染前被脱敏。

## 该持久化什么

对于生产环境的运行，持久化足够的数据，让你不必重放整个作业就能重建一次失败：

- `TeamRunResult.tasks`——执行过的 DAG 和任务状态。
- `TeamRunResult.totalTokenUsage`——用于成本归因。
- `onTrace` span——LLM 调用和工具执行。
- 渲染好的仪表盘 HTML——当你需要一个可分享的事后复盘产物时。
