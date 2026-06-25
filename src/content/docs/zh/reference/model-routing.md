---
title: "模型路由"
description: "需显式开启的确定性策略，把编排各阶段路由到不同模型——按阶段、智能体、任务角色、优先级或叶子节点匹配。"
---

`modelRouting` 是一个需显式开启的确定性策略，它在不改动你的团队或智能体配置的前提下，把不同的编排调用发往不同的模型。常见形态是「旗舰模型做规划，廉价模型跑叶子工作」：

```ts
import type { ModelRoutingPolicy } from '@open-multi-agent/core'

const modelRouting: ModelRoutingPolicy = {
  rules: [
    // Flagship model decomposes the goal and synthesizes the final answer.
    { match: { phase: 'coordinator' }, route: { model: 'claude-opus-4-7' } },
    { match: { phase: 'synthesis' },   route: { model: 'claude-opus-4-7' } },
    // Everything that has no dependents runs on a cheap model.
    { match: { leaf: true }, route: { model: 'claude-haiku-4-5' } },
  ],
}

const result = await orchestrator.runTeam(team, goal, { modelRouting })
```

`runTasks` 接受相同的选项：

```ts
const result = await orchestrator.runTasks(team, tasks, { modelRouting })
```

一条规则是 `{ match, route }`。**规则按数组顺序求值，第一个命中者胜出**，所以把最具体的规则放在前面。没有命中任何规则的调用，会保持它本来就会用的模型。

## 匹配维度

只有当 `match` 里设置的**每一个**字段都与该调用相符时，规则才命中。空的 `match: {}` 匹配一切（适合作为最终的兜底项）。

| Field | 命中条件 | 可用于 |
|-------|--------------|--------------|
| `phase` | 该调用属于这个编排阶段（`coordinator`、`synthesis`、`short-circuit`、`worker`、`delegated`） | 每次调用 |
| `agent` | 正在运行的智能体名称与此相等 | 每次调用 |
| `taskRole` | 任务的 `role` 与此相等 | worker / delegated 调用（role 来自显式任务或协调器的 JSON） |
| `taskPriority` | 任务的 `priority` 与此相等（`low` \| `normal` \| `high` \| `critical`） | worker / delegated 调用 |
| `leaf` | 该任务在执行图中没有下游依赖者 | worker / delegated 调用 |
| `hasDependencies` | 任务的 `dependsOn` 非空 | worker / delegated 调用 |

`taskRole`、`taskPriority`、`leaf` 和 `hasDependencies` 是任务作用域的，所以它们只会命中 `worker` 和 `delegated` 调用。`coordinator`、`synthesis` 和 `short-circuit` 阶段没有挂载任务，设置了任务字段的规则永远不会命中它们。

## 路由配置

`route` 是规则命中时施加的覆盖。只有 `model` 是必填的；其余项依次回退到智能体的配置、再到编排器默认值。

| Field | 含义 |
|-------|---------|
| `model` | 命中调用所用的模型。必填。 |
| `provider` | 提供方覆盖（`anthropic`、`openai`、`gemini`……）。默认取智能体的或默认提供方。 |
| `baseURL` | OpenAI 兼容或自托管端点的 Base URL。 |
| `apiKey` | 命中调用所用的 API 密钥。 |
| `region` | AWS region，用于 Bedrock 路由。 |

## 哪些调用会被路由

单一策略覆盖全部五个编排阶段：

- **`coordinator`** —— `runTeam` 中的目标拆解调用。
- **`synthesis`** —— `runTeam` 中的最终答案组装调用。
- **`worker`** —— 运行已分派任务的任务智能体（`runTeam` 与 `runTasks`）。
- **`delegated`** —— 经 `delegate_to_agent` 触达的智能体。
- **`short-circuit`** —— 当目标足够简单、可跳过拆解时，`runTeam` 走的单智能体路径。

## 需显式开启与不可变

两项保证让路由配置上去也很安全：

- **需显式开启。** 省略 `modelRouting`，模型选择与之前逐字节相同，`runTeam` 和 `runTasks` 皆然。
- **不可变。** 一条命中的路由只为那一次调用构建一份临时生效配置。你的 `Team`、其中的 `AgentConfig`、以及编排器默认值都不会被修改，所以同一个团队可以在不同调用间以不同策略运行。

## 成本分层示例

[`examples/patterns/cost-tiered-pipeline.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts) 把同一条四阶段流水线跑两遍（全旗舰 vs. 分层混搭），并打印按模型分的 token 与美元开销明细，让你在采用某条路由策略之前就能看清它能省下多少。
