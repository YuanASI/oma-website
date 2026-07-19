---
title: 控制成本与预算
description: "使用 maxTokenBudget、maxCostBudget 和应用自行维护的 estimateCost 函数，限定一次 OMA 运行的开销。"
---

OMA 提供两种运行级模型用量护栏：

| 护栏 | 适用场景 | 计量内容 |
|---|---|---|
| `maxTokenBudget` | token 上限已经够用，或拿不到价格 | 累计输入 + 输出 token |
| `maxCostBudget` + `estimateCost` | 不同模型或提供方的价格不同 | 根据每次 LLM 结果估算的、由调用方定义的成本 |

两者都属于 `OrchestratorConfig`。运行预算包含由编排器管理的协调器、工作者、综合、逐任务验证和委派智能体用量。`AgentConfig.maxTokenBudget` 可以进一步收紧单个智能体，但不能放宽编排器预算。

:::caution[这是熔断器，不是计费表]
预算会在模型报告用量后，于 turn 与任务边界接受检查。一次运行最多可能比设定上限多用一个模型 turn，因此 `maxCostBudget` 不是精确到分的硬停。提供方账单仍是实际计费的事实来源。
:::

## 先设 token 上限

当一次运行中的不同模型可以共用 token 作为有效开销代理时，使用 `maxTokenBudget`：

```ts
import { OpenMultiAgent } from '@open-multi-agent/core'

const oma = new OpenMultiAgent({
  maxTokenBudget: 100_000,
  onProgress(event) {
    if (event.type === 'budget_exceeded') {
      console.warn('OMA budget exhausted', event.data)
    }
  },
})
```

上限把输入和输出 token 合并计算。累计总量越界后，OMA 会发出一次 `budget_exceeded` 进度事件，在下一个边界停止调度剩余工作，并返回 `status.code === 'budget_exhausted'` 的失败结果。

## 增加调用方维护的成本估算器

OMA 刻意不提供模型价格表。价格会随提供方、模型、合同、缓存方式和时间变化，因此应把价格放在可独立更新的应用配置中。

```ts
import {
  OpenMultiAgent,
  type CostEstimateContext,
  type TokenUsage,
} from '@open-multi-agent/core'

type ModelPrice = {
  inputPerMillion: number
  outputPerMillion: number
}

const prices: Readonly<Record<string, ModelPrice>> = JSON.parse(
  process.env.OMA_MODEL_PRICES_JSON ?? '{}',
)

function estimateCost(
  usage: TokenUsage,
  context: CostEstimateContext,
): number {
  const price = prices[context.model]
  if (!price) throw new Error(`Missing price for model: ${context.model}`)

  return (
    usage.input_tokens * price.inputPerMillion
    + usage.output_tokens * price.outputPerMillion
  ) / 1_000_000
}

const oma = new OpenMultiAgent({
  maxTokenBudget: 100_000,
  maxCostBudget: 2.5,
  estimateCost,
})
```

本例的 `estimateCost` 返回美元，因此 `maxCostBudget: 2.5` 表示预计 2.50 美元的上限。也可以使用其他货币或内部成本单位，但所有返回值和预算必须使用同一单位。

估算器每次收到的是单个 LLM 结果的增量 `TokenUsage`，不是累计用量。context 会标出应用默认值与模型路由生效后的实际模型，以及 `agentName`、可选的 `provider`、执行 `phase` 和可选的 `taskId`。返回值必须是非负有限数。配置 `maxCostBudget` 却不提供估算器时，`OpenMultiAgent` 构造函数会直接抛错，不会静默忽略上限。

## 把预算耗尽当作预期结果处理

```ts
const result = await oma.runTeam(team, goal)

if (result.status?.code === 'budget_exhausted') {
  console.log('Stopped at a budget boundary', result.totalTokenUsage)
  // Persist the partial result, ask for approval, or retry with a new policy.
}
```

不要自动用更大的预算重试，否则控制项会变成意外的开销放大器。应明确决定部分输出是否可用、是否需要人工批准更多预算，或让[模型路由](/zh/reference/model-routing/)把符合条件的任务交给已配置的低成本模型。

`TeamRunResult.totalTokenUsage` 报告累计 token，但不声称等同于提供方账单，也不暴露累计实付成本字段；账单核对应留在应用或提供方账户中。

## 生产检查清单

- 对价格表做版本管理，并在提供方定价或合同变化时更新。
- 实际模型没有价格时应直接失败，不要把未知成本当成零。
- 当 token 与预估成本任一项都能独立保护运行时，同时设置两种上限。
- 对 `budget_exceeded` 告警，并在应用日志中带上运行标识。
- 在预算测试中覆盖协调器、工作者、综合、验证和委派智能体路径。
- 上限是近似值：正在执行的模型 turn 必须完成后才能得知其用量。

其他上线前应接好的控制项见[生产清单](/zh/guides/production-checklist/)。
