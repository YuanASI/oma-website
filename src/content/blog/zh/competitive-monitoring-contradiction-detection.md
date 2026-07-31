---
title: "竞品监控：先隔离来源，再交给一个 Agent 比对"
description: "每个来源一个 Agent，各自产出结构化论断，聚合方读到的是校验过的记录而不是散文——这样厂商公告、社区帖和新闻报道之间的矛盾，才能活着抵达报告。"
pubDate: 2026-07-31
tags: ["competitive-intelligence", "research", "typescript"]
contentType: application
useCases: ["竞品监控", "矛盾检测"]
industries: ["产品情报"]
evidence:
  kind: runnable-demo
  note: "该 recipe 使用刻意制造矛盾的本地 Twitter、Reddit 与新闻 fixtures；实时采集、来源授权与生产准确率不在演示范围内。文中的交接与调度行为来自已发布的运行时 API。"
related:
  solutions: ["parallel-llm-calls", "mixed-model-teams"]
  examples: ["competitive-monitoring", "research-aggregation"]
  integrations: ["anthropic", "openai-compatible"]
  comparisons: ["langgraph"]
featured: false
readingMinutes: 4
---

竞品发布了一次产品更新。官方公告给了一个日期，社区帖子给了另一个日期，新闻报道复述了一个性能数字、但上下文比原文少了一截。

把三份材料一起丢给一个摘要 Agent，你会得到一段顺滑的文字。它很好读，同时悄悄毁掉了输入里最有价值的东西：分歧本身。

解法是结构性的。每个来源独立抽取，论断保持带类型，比对作为一个单独的工作、读记录而不是读散文。

## 一个来源边界，一个读取方

可运行的[竞品监控示例](/zh/examples/competitive-monitoring/)给每个来源分析方一份 fixture——Twitter 流、社区流、新闻流——再让聚合方去比对回来的结果。

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Twitter',
    description: '从 Twitter 流中抽取论断。',
    assignee: 'twitter-analyst',
  },
  {
    title: 'Reddit',
    description: '从社区流中抽取论断。',
    assignee: 'reddit-analyst',
  },
  {
    title: 'News',
    description: '从新闻流中抽取论断。',
    assignee: 'news-analyst',
  },
  {
    title: 'Compare',
    description: '归并重复论断，比对日期与数字，标出矛盾。',
    assignee: 'aggregator',
    dependsOn: ['Twitter', 'Reddit', 'News'],
    dependencyPayload: 'structured',
  },
])
```

三个读取方互相没有依赖，所以同时开跑。这只是较小的那部分收益。

更大的收益是隔离。一个 Agent 在同一个提示词里读完所有流，可能把「重复」当成「互相印证」——哪怕三个渠道抄的是同一份原始声明；也可能顺手丢掉「两个来源对不上」这个碍事的细节。分开成多个 Agent 并不会让任何一个来源更准确，但会让边界更难丢。

## 比对读的是记录，不是段落

`dependencyPayload: 'structured'` 在这里是承重的那一项。不设它，直接依赖注入的是上游任务的原始 `output`——聚合方就得重读三段叙述、把已经抽过的论断再抽一遍、再去猜每条来自哪个流。

设了它，抵达聚合方的只有从各分析方成功的 `AgentRunResult.structured` 派生出的规范 JSON，叙述文本被排除。每条论断带着分析方校验过的形态到达：论断内容、日期、来源 URL、置信度。

这改变了聚合方能被要求做什么。不是「写一份更好的摘要」，而是一件更窄、可检查的活：归并重复论断、比对日期与数字、标出矛盾、保留来源链接与置信度、产出一份报告。

最终产物于是可以写「这两个来源对不上」，而不是硬给一个证据支撑不了的结论。

## 每个来源的抽取结果，事后都单独可查

值得留下的不只是那份报告。当某条论断三周后被证明是错的，你要问的是它来自哪个流、当时分析方到底返回了什么。

`taskResults` 为每个任务保留未经合并的结果、以稳定任务 ID 为键，与按 Agent 合并的 `agentResults` 索引并存：

```ts
const result = await orchestrator.runTasks(team, tasks)

const newsTask = result.tasks?.find(task => task.title === 'News')
const newsClaims = newsTask
  ? result.taskResults?.get(newsTask.id)?.structured
  : undefined
```

两套索引指向同一批执行，暴露 `taskResults` 不会把用量重复计算。

## 只在需要判断的地方付深度成本

对随附数据流做三次抽取，和在互相冲突的论断之间做一次比对，不是同一种调用。Model Routing 把它们分开：

```ts
const modelRouting: ModelRoutingPolicy = {
  rules: [
    { match: { agent: 'aggregator' }, route: { model: 'claude-opus-4-7' } },
    { match: { phase: 'worker' }, route: { model: 'claude-haiku-4-5' } },
  ],
}

await orchestrator.runTasks(team, tasks, { modelRouting })
```

规则按顺序求值、第一条命中的胜出，所以更具体的规则打头。没命中任何规则的调用，仍用它本来会用的模型。

## 这个示例没有做的事

recipe 读的是本地 fixture。它不会去认证任何实时社交或新闻 API，不会替你判断这样使用是否符合来源的条款，也不会衡量对你团队真正关注的那些渠道的召回率。这些才是生产工作，而且前两项在成为工程问题之前，先是政策问题。

真实部署需要的是一份来源政策，而不是更多 Agent：允许哪些渠道、存什么（原始 URL、抓取时间、相关摘录）、如何区分一手声明与二手评论、哪些矛盾必须走人工。

运行时能帮上忙的是这份清单的最后一段。抽取与矛盾检测恰恰是那种会悄悄漂移的能力，而 `@open-multi-agent/core/eval` 子路径就是用来量它的：对一组版本化的标注数据流打分，用报告卡住 CI，看趋势而不是单次运行。评估观察的是已完成的结果、从不改变业务结果，这正是它被放在独立子路径而非运行时钩子里的原因。抛异常的 scorer 会被记为 `scorer_error` 并排除在均值之外——一次失败的测量不等于零分。

如果采集最终要往什么地方写——CRM、简报文档、告警频道——那个工具就是 `consequential: true`，`onToolCall` 会在输入校验之后、`execute` 之前逐次拦截。

## 什么时候多个 Agent 值回成本

当来源边界确实重要、且每个来源可以独立处理时，用这个形态。不要只因为「有好几个 URL」就用它：量不大、下游决策也不依赖来源归属时，一次抽取就够了。

多 Agent 形态回本的条件是：多个数据流可以并发处理、同一条论断以不同形式出现、分歧本身就是信号、以及最终产物必须能说清每个结论从哪来。

## 先跑 fixture

在框架仓库里，配好 `ANTHROPIC_API_KEY`：

```bash
npx tsx packages/core/examples/cookbook/competitive-monitoring.ts
```

先自己读一遍 fixture 里的论断，再去读生成的报告，然后核对：你肉眼能看到的那些矛盾，输出里还在不在。确认之后，再一次替换一个来源接入实时数据。一套监控系统应该越接越广，而不是越接越说不清出处。
