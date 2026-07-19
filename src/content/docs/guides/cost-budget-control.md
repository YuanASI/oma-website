---
title: Control costs and budgets
description: "Use maxTokenBudget, maxCostBudget, and an application-owned estimateCost function to bound an OMA run."
---

OMA provides two run-level guardrails for model usage:

| Guardrail | Use it when | What it counts |
|---|---|---|
| `maxTokenBudget` | A token ceiling is enough, or pricing is unavailable | Cumulative input + output tokens |
| `maxCostBudget` + `estimateCost` | Models or providers have different prices | Caller-defined cost estimated from each LLM result |

Both belong to `OrchestratorConfig`. The run budget includes orchestrator-managed coordinator, worker, synthesis, per-task verification, and delegated-agent usage. An `AgentConfig.maxTokenBudget` can narrow an individual agent further; it cannot widen the orchestrator budget.

:::caution[This is a circuit breaker, not a billing meter]
Budgets are checked at turn and task boundaries, after a model reports usage. A run can exceed a configured ceiling by up to one model turn, so `maxCostBudget` is not a cent-exact stop. Provider invoices remain the source of truth for billed cost.
:::

## Start with a token ceiling

Use `maxTokenBudget` when one token unit is a useful proxy across the models in the run:

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

The limit covers input and output tokens together. When the cumulative total crosses it, OMA emits one `budget_exceeded` progress event, stops scheduling remaining work at the next boundary, and returns a failed result with `status.code === 'budget_exhausted'`.

## Add a caller-owned cost estimator

OMA deliberately ships no model price table. Prices vary by provider, model, contract, cache behavior, and time, so keep them in application configuration that you can update independently.

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

In this example, `estimateCost` returns US dollars, so `maxCostBudget: 2.5` means an estimated USD 2.50 ceiling. You can use another currency or internal cost unit, but every return value and the budget must use the same unit.

The estimator receives one LLM result's incremental `TokenUsage`, not cumulative usage. Its context identifies the effective model after defaults and model routing, plus `agentName`, optional `provider`, execution `phase`, and optional `taskId`. Return a finite, non-negative number. Constructing `OpenMultiAgent` with `maxCostBudget` but no estimator throws instead of silently ignoring the cap.

## Handle budget exhaustion as an expected outcome

```ts
const result = await oma.runTeam(team, goal)

if (result.status?.code === 'budget_exhausted') {
  console.log('Stopped at a budget boundary', result.totalTokenUsage)
  // Persist the partial result, ask for approval, or retry with a new policy.
}
```

Do not automatically retry with a larger budget: that turns a control into an accidental spend escalator. Decide whether partial outputs are useful, whether a human should approve more budget, or whether [model routing](/reference/model-routing/) should move eligible tasks to a cheaper configured model.

`TeamRunResult.totalTokenUsage` reports cumulative tokens. It does not claim to be a provider invoice or expose a cumulative billed-cost field; keep billing reconciliation in the application or provider account.

## Production checklist

- Keep the price table versioned and update it when provider pricing or your contract changes.
- Fail closed when an effective model has no price instead of treating unknown cost as zero.
- Set both token and estimated-cost ceilings when either one independently protects the run.
- Alert on `budget_exceeded`, and include the run identity in your application logs.
- Exercise coordinator, worker, synthesis, verification, and delegated-agent paths in budget tests.
- Treat the ceiling as approximate because the in-flight model turn completes before its usage is known.

For the other controls to wire before launch, continue with the [production checklist](/guides/production-checklist/).
