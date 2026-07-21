---
title: "共识"
description: "runConsensus 的提议者到裁判验证、逐任务的 verify 钩子，以及共享的 token 预算不变式。"
---

`runConsensus` 在单次提示之上增加了一个提议者→裁判的验证循环：一个**提议者**智能体给出答案，然后一组**裁判**智能体在至多 `maxRounds` 轮内尝试反驳它。一旦达到 `quorum` 数量的裁判接受，循环就提前退出。

```ts
const result = await orchestrator.runConsensus(team, 'Is this proof correct?', {
  proposer: { name: 'solver', model: 'claude-opus-4-6' },
  judges: [
    { name: 'judge-a', model: 'claude-opus-4-6' },
    { name: 'judge-b', model: 'claude-sonnet-4-6' },
  ],
  mode: 'refute',       // identical skeptic framing for every judge
  quorum: 2,            // default: ceil(judges.length / 2)
  maxRounds: 2,         // default: 2
  onDissent: 'revise',  // default: feed dissent back to the proposer
})

result.answer      // the (possibly revised) answer
result.verdict     // 'accepted' | 'rejected'
result.dissent     // critiques recorded across all rounds
result.rounds      // judging rounds executed
result.tokenUsage  // proposer + judges + revisions
```

## 选项

| 选项 | 默认值 | 含义 |
|--------|---------|---------|
| `proposer` | — | 一个智能体，或一个数组（N-best——所有候选都展示给裁判）。 |
| `judges` | — | 验证者名单。裁判**顺序**运行，这样 quorum 和预算能让其余裁判停止。 |
| `mode` | `'refute'` | `'refute'`：每个裁判都得到相同的怀疑者设定。`'lens'`：每个裁判得到一个不同的视角（正确性、完整性、边界情况……）。 |
| `quorum` | `ceil(judges.length / 2)` | 达成共识所需的接受裁判数。 |
| `maxRounds` | `2` | 提议者↔裁判轮数的上限。 |
| `verdictSchema` | — | 可选的 Zod schema，对每个裁判解析出的裁决做校验；校验失败计为异议。 |
| `onDissent` | `'revise'` | `'revise'`：把异议反馈给提议者再来一轮。`'reject'`：停止，裁决为 `rejected`。`'keep'`：停止但保留答案，裁决为 `accepted`。 |
| `judgePrompt` | 内置 | 覆盖验证者提示——对所有裁判用一个 `string`，或用一个 `(judge) => string` 函数做逐裁判的设定。 |

每个裁判提示都会在被提议的答案旁附上**原始问题**，这样裁判（包括 lens 模式的）会对照真正问的内容来评判答案。一个裁判以 `{"accept": boolean, "critique": string}` 回复。

## 逐任务 `verify` 钩子

`runTasks` 流水线中的任何任务都可以选择对自己的结果启用共识验证——该任务的 assignee 就是提议者，因此你提供*除* `proposer` 之外的一切：

```ts
await orchestrator.runTasks(team, [
  {
    title: 'derive-bound',
    description: 'Prove the O(n log n) bound.',
    assignee: 'mathematician',
    verify: { judges: [judgeA, judgeB], mode: 'refute', maxRounds: 2 },
  },
])
```

任务完成后，其结果被送入同一个共识循环。如果共识修订了答案，被修订的结果会替换任务输出供下游消费者使用。**没有** `verify` 的任务照常运行、不付出任何代价——这个钩子是完全需显式开启的。

## 预算不变式

共识的 token 用量像委派一样计入父预算。提议者、裁判和修订的用量全都累加进运行总量，并对照 `OrchestratorConfig.maxTokenBudget` 检查。一旦累计总量越过预算，共识就**停止发起更多的裁判调用**——没有单独的预算配置项，没有逃生口。对于逐任务的 `verify` 钩子，裁判用量并入与流水线其余部分相同的运行级预算，并触发同一道闸。成本方面同理：当配置了 `estimateCost` 和 `maxCostBudget` 时，verify 钩子的用量会被计入本次运行的累计预估成本，一旦越过上限，就在同一边界处停止更多的裁判调用。因为 `maxCostBudget` 是一个运行级上限，独立的 `runConsensus` 原语只跟踪 token。

## 可观测性

每个裁判裁决都通过 `onTrace` 作为一个 `consensus` 追踪事件发出（其中 `accepted` 设为该裁判的决定，`dissent` 在它反对时携带相应批评），这样你能审计每一轮。提出异议的批评还会被额外写入共享内存（在该裁判的命名空间下，键为 `consensus:round:N:dissent`）。
