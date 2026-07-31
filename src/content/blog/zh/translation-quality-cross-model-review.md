---
title: "回译交给另一个模型，才抓得出语义漂移"
description: "一个提供方负责翻译，通过 Model Routing 规则把回译交给另一个提供方，再由 Reviewer 返回结构化的漂移发现——然后用版本化的 EvalSet 去衡量 Reviewer 本身。"
pubDate: 2026-07-31
tags: ["localization", "translation", "typescript"]
contentType: application
useCases: ["翻译 QA", "语义漂移审查"]
industries: ["本地化"]
evidence:
  kind: runnable-demo
  note: "跨模型 recipe 运行在随附的样例文本上。回译产出的是复核信号：把可疑处挑出来交给人工确认。文中的路由与评估 API 来自已发布的运行时能力，不由这个 recipe 演示。"
related:
  solutions: ["mixed-model-teams", "parallel-llm-calls"]
  examples: ["translation-backtranslation", "multi-model-team"]
  integrations: ["anthropic", "openai", "gemini"]
  comparisons: ["openai-agents-sdk"]
featured: false
readingMinutes: 4
---

一段译文可以读起来很自然，同时把意思改掉。一个限定词消失了。一个截止日期变软了。一句产品承诺比原文放得更宽。句子看上去没问题，直到有人把它和原意摆在一起对照。

回译给本地化团队提供了一个信号：把译文再翻回源语言，看看什么变了。而当返程不走产出译文的那套模型栈时，这个信号的价值会高得多。

## 三个角色，其中一个刻意来自别处

可运行的[翻译与回译示例](/zh/examples/translation-backtranslation/)把工作拆成翻译方、回译方和审阅方。

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Translate',
    description: '把英文原文译为目标语言。',
    assignee: 'translator',
  },
  {
    title: 'Back-translate',
    description: '把上一步的译文回译成英文。',
    assignee: 'back-translator',
    dependsOn: ['Translate'],
  },
  {
    title: 'Review',
    description: '对照原文与回译，报告语义漂移。',
    assignee: 'drift-reviewer',
    dependsOn: ['Translate', 'Back-translate'],
    dependencyPayload: 'structured',
  },
])
```

审阅方同时依赖译文和回译，所以它看到的是整个往返过程，而不只是终点。`dependencyPayload: 'structured'` 让它拿到两边校验过的 JSON，而不是两坨需要自己切分的散文。

## 换提供方是一条路由规则，不是第二套流水线

混用提供方是整件事的关键：来自同一模型家族的回译，倾向于复现这个家族偏好的表达方式，而那恰好会盖住你要找的漂移。

这不需要两套编排。一条 Model Routing 规则就能按调用指派模型：

```ts
const modelRouting: ModelRoutingPolicy = {
  rules: [
    { match: { agent: 'back-translator' }, route: { model: 'gpt-5' } },
    { match: { agent: 'drift-reviewer' }, route: { model: 'claude-opus-4-7' } },
    { match: {}, route: { model: 'claude-sonnet-4-6' } },
  ],
}

await orchestrator.runTasks(team, tasks, { modelRouting })
```

规则按数组顺序求值、第一条命中的胜出，所以具体规则打头，空的 `match: {}` 充当兜底。没命中任何规则的调用，仍用它本来会用的模型。

路由还支持有序 fallback。这一点在本地化场景比在多数工作流里更要紧：一批文案跑到一半因为某个提供方返回 503 而中断，你会拿到一个只审了一半的发布。

## 把对照变成数据

审阅方的工作不是说「看起来没问题」，而是返回结构化的发现——这才让产出能被队列消费，而不是让人再读几段文字。

这个形态能稳定暴露的变化包括：否定被丢掉、数字或单位变动、「必须」和「可选」互换、范围被放宽或收窄、术语在段落之间漂移，以及语气变化到影响了读者该采取的行动。

它在重复且结构化的内容上最有用——帮助中心更新、产品通知、发布沟通——因为人工审阅需要的是一个排好序的队列，而不是从头再读一遍。

## 回译干净，并不能证明什么

一次干净的往返，不能证明目标文本是对的。

两个模型可能共享同一个盲区。字面直译的回译会把无害的本地化处理也标出来。一句符合当地表达习惯的话，逐词翻回去就是会显得不对。领域术语需要一份模型手里没有的术语表。

所以最后一个角色叫漂移审阅方而不是自动发布器，所以它的产出进的是队列。

## 要衡量的是审阅方，不只是译文

这类工作流早晚都会碰到同一个问题：审阅方今天还能抓住它上个月能抓住的东西吗？改提示词、升级模型、更换提供方，都会悄悄挪动这个答案。

评估位于独立的 `@open-multi-agent/core/eval` 子路径下——它观察已完成的结果、从不改变业务结果，这正是它被分开的原因：

```ts
import { defineScorer } from '@open-multi-agent/core/eval'

const catchesKnownDrift = defineScorer({
  name: 'catches-known-drift',
  version: '1',
  score({ output, evalCase }) {
    const hit = output === evalCase.expected
    return { score: hit ? 1 : 0, pass: hit }
  },
})
```

用标注过的样本对建一个版本化的 EvalSet——既包含可接受的本地化改写，也包含实质性的漂移——对审阅方打分，然后用产出的 `GateVerdict` 卡住 CI，而不是靠抽查。

写 scorer 之前有一个性质值得先知道：抛异常、被拒绝或超时的 scorer，会被记为 `status: 'scorer_error'` 的 `EvalRecord`，错误被规范化，并从均值、分位数和通过率里排除。不要用 `{ score: 0 }` 去替代 scorer 失败——没有发生的测量，和测出来是零，不是一回事；把两者混为一谈，正是一个坏掉的 scorer 开始看起来像质量回退的方式。

生产工作流仍然需要一份审定过的术语表、按语言区的风格指南、对法律/医疗/金融/安全关键内容的人工审阅，以及对原文、译文、审阅发现与最终批准的版本化记录。最后这项运行时是覆盖的：稳定的运行标识、execution receipt、TraceStore 与离线 Run Viewer，都不需要任何托管服务。

## 为什么用多个 Agent 而不是一个提示词

这三项职责是真的不同。翻译要在目标语言里追求通顺。回译**不能**替上一步把粗糙的地方抹平。审阅要对照两段文本、把差异作为数据报出来。

把它们塞进一个提示词，等于要求同一个模型先翻译、再批评自己的输出、再把批评结构化——每一步都可能悄悄替上一步遮掩。拆开之后，回译方根本看不到原文，也就无从被它影响。

## 跑一遍 recipe

在框架仓库里，配好示例页面上列出的各提供方凭证：

```bash
npx tsx packages/core/examples/cookbook/translation-backtranslation.ts
```

先把随附样例和它的回译并排读一遍，再去看审阅发现。然后核对两件事：你已经能看出来的漂移，它标出来了吗；以及同样有用的——它标出了多少你本来会放过去的地方。
