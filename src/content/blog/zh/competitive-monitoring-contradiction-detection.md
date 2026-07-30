---
title: "竞品监控真正缺的，不是另一份顺滑摘要"
description: "并行处理社交、社区和新闻论断，保留每条论断的来源，再由独立 Agent 比较矛盾；不要把分歧压平为一段自信的总结。"
pubDate: 2026-07-31
tags: ["competitive-intelligence", "research", "typescript"]
contentType: application
useCases: ["竞品监控", "矛盾检测"]
industries: ["产品情报"]
evidence:
  kind: runnable-demo
  note: "该 recipe 使用刻意制造矛盾的本地 Twitter、Reddit 与新闻 fixtures；实时采集、来源授权与生产准确率不在演示范围内。"
related:
  solutions: ["parallel-llm-calls", "mixed-model-teams"]
  examples: ["competitive-monitoring", "research-aggregation"]
  integrations: ["anthropic", "openai-compatible"]
  comparisons: ["langgraph"]
featured: false
readingMinutes: 5
---

竞品发布了一次产品更新。

公司帖子给出一个日期。社区讨论给出另一个日期。新闻文章又重复了一个缺少上下文的性能数字。普通摘要工具会把这些分歧压成一段很顺的文字。

很好读。

也很难信。

竞品监控需要另一种形态：

> 每个来源独立抽取，保留原始论断。只有来源清楚以后，才开始比较。

可运行的[竞品监控示例](/zh/examples/competitive-monitoring/)用三份刻意制造矛盾的本地 fixtures，演示了这套结构。

## 三个读者，三条来源边界

Recipe 把一份 fixture 交给一个来源分析 Agent：

- Twitter 分析 Agent 读取 Twitter feed。
- Reddit 分析 Agent 读取社区 feed。
- 新闻分析 Agent 读取新闻 feed。

每个 Agent 都返回结构化论断，包括 claim、日期、source URL 和 confidence。三路分析互不依赖，所以同时运行。

这不只是延迟优化。

来源隔离可以避免过早混合。

如果一个 Agent 在同一个 prompt 里读取所有 feed，它可能默默把重复当成佐证。即使所有渠道都只是复制了同一份原始声明，也会出现这个问题。它也可能直接丢掉两条来源彼此冲突的尴尬细节。

独立 Agent 不会让来源自动变准。它只是让边界更难消失。

## 比较是另一份工作

三路来源审查完成以后，情报聚合 Agent 才拿到它们的结构化结果。

它的任务不是“写一份更好的总结”，而是做几件更窄的事：

- 合并重复论断。
- 比较日期和数字。
- 标记矛盾。
- 保留来源链接与置信度。
- 生成一份 Markdown 情报报告。

这次交接把抽取和判断分开，也给下游代码留下一份真正可用的比较记录。

最终报告可以诚实地写出“这两个来源不一致”，而不是被迫给出证据不支持的唯一答案。

## 这套架构解决不了什么

示例使用本地 fixtures。它不会：

- 登录真实社交或新闻 API。
- 判断你的使用方式是否符合来源条款。
- 因为多个渠道重复，就证明一条论断为真。
- 代替人类分析师判断什么信息重要。
- 衡量它对你真正关注来源的召回率。

这些不是脚注，而是生产工作本身。

真正部署之前，团队先需要来源政策，然后才需要更多 Agent：

1. 明确允许采集哪些渠道。
2. 保存原始 URL、获取时间和相关摘录。
3. 区分一方声明、评论和转述。
4. 决定哪些矛盾必须人工处理。
5. 在带标注的数据集上评估抽取与矛盾检测。

## 多个 Agent 什么时候值得

当来源边界很重要，而且每个来源可以独立处理时，这套模式才合适。

不要因为有几个 URL，就自动使用多个 Agent。数据量很小、下游决策也不依赖来源时，一次抽取可能已经够用。

这些情况下，多智能体形态才开始值得：

- 多个 feed 可以并发处理。
- 同一个论断会以不同形式出现。
- 分歧本身就是有用信息。
- 最终交付物必须说明每个结论从哪里来。

如果输出是一份每周情报简报，它首先应该是可审阅的证据产品，而不是更漂亮的自动补全。

## 先运行 fixture

设置 `ANTHROPIC_API_KEY` 后，在框架仓库根目录执行：

```bash
npx tsx packages/core/examples/cookbook/competitive-monitoring.ts
```

先读 fixture 里的论断，再看生成报告。检查输出有没有保留那些你肉眼就能看见的矛盾。

确认以后，再一次接入一个真实来源。监控系统可以越来越连接，但不该越来越难以追溯。
