---
title: 选择运行方式
description: "根据由谁负责规划、任务图需要多高的可预测性，以及是否需要汇总结果，在 runAgent、runTeam 和 runTasks 之间做选择。"
---

:::tip[快速判断]
知道目标，但还不知道具体步骤：从 `runTeam()` 开始。一个明确的智能体就能完成：使用 `runAgent()`。任务图必须显式且可重复：改用 `runTasks()`。
:::

## `runAgent()`：一个智能体，一项任务

当任务很明确，不需要委派或多个专业角色并行协作时，选择 `runAgent()`。

- **你提供**：一个配置好的智能体和一个 prompt。
- **OMA 负责**：该智能体的模型循环、工具调用、流式输出，以及可选的结构化输出。
- **取舍**：编排开销最低，但没有团队规划和多智能体协作。

```ts
const result = await orchestrator.runAgent(
  reviewer,
  '检查这份 API 契约中的安全问题。',
)
```

查看 [`basics/single-agent` 示例](/zh/examples/single-agent/)。

## `runTeam()`：目标驱动的团队协作

当你能描述期望结果，但不想亲自维护每项任务和依赖关系时，选择 `runTeam()`。这是多智能体工作的推荐起点。

- **你提供**：一组可用智能体和一个目标。
- **OMA 负责**：简单目标可能直接交给一个智能体；非简单目标会被拆成任务 DAG，相互独立的任务并行执行，最后由协调器汇总结果。
- **取舍**：计划能随目标变化，但规划会增加一次模型调用，生成的任务图也可能在不同运行之间变化。

```ts
const result = await orchestrator.runTeam(
  team,
  '研究市场、识别风险，并生成一份发布简报。',
)
```

查看 [`basics/team-collaboration` 示例](/zh/examples/team-collaboration/)。

## `runTasks()`：显式任务图

当工作流已经确定，而且任务拓扑需要可审查、可版本化或可重复时，选择 `runTasks()`。

- **你提供**：任务、负责人和 `dependsOn` 依赖关系。
- **OMA 负责**：按依赖排序、并行执行、按配置重试，并返回逐任务结果。
- **取舍**：任务图由你维护。它没有协调器规划调用，也不会执行最终的协调器汇总；结果中保存各任务输出。

```ts
const tasks = [
  { title: '调研', description: '找出关键事实。', assignee: 'researcher' },
  { title: '写作', description: '生成简报。', assignee: 'writer', dependsOn: ['调研'] },
]

const result = await orchestrator.runTasks(team, tasks)
```

查看 [`basics/task-pipeline` 示例](/zh/examples/task-pipeline/)。

## 对比核心取舍

- **配置和运行开销最低：**`runAgent()`
- **维护任务图最少：**`runTeam()`
- **任务拓扑最可预测：**`runTasks()`
- **得到一份团队汇总答案：**`runTeam()`
- **得到各任务原始输出：**`runTasks()` 和 `runFromPlan()`

## 工作流通常如何演进

1. 先用 `runAgent()` 验证一个角色和 prompt。
2. 增加专业角色，让 `runTeam()` 找出有用的任务拆分。
3. 需要执行前审查时，通过 `planOnly` 预览协调器计划。
4. 用 `runFromPlan()` 固定已经批准的计划，或者直接用 `runTasks()` 编写稳定工作流。

`runFromPlan()` 会重放已经批准的任务图，不再调用协调器规划。和 `runTasks()` 一样，它返回逐任务输出，不执行最终汇总。详见[计划预览与重放](/zh/reference/plan-replay/)。

## 叠加在运行方式之上的控制

以下能力用于调整一次运行，但不会代替“由谁维护任务图”这个选择：

- [共识](/zh/reference/consensus/)通过 `runConsensus()` 或逐任务 `verify` 钩子增加提议者与裁判验证。
- [计划预览与重放](/zh/reference/plan-replay/)用来检查、版本化和重放协调器生成的任务图。
- [模型路由](/zh/reference/model-routing/)通过显式开启的策略，把规划和叶子任务交给不同模型。

下一步：[编排控制](/zh/guides/orchestration-controls/)讲解取消运行、计划审批、协调器可见性和其他运行时控制。
