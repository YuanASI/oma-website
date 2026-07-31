---
title: "2026 年最好的 TypeScript 多智能体框架：按工作流来选"
description: "基于一方资料，对六种 TypeScript 多智能体方案进行场景化比较：显式图、Agent UI、handoff、路由网络、全栈应用与目标驱动任务 DAG。"
pubDate: 2026-07-31
tags: ["typescript", "multi-agent-frameworks", "framework-selection"]
contentType: decision-guide
useCases: ["框架选型", "架构评估"]
industries: ["软件"]
evidence:
  kind: source-backed-comparison
  note: "对比截至 2026 年 7 月 31 日的官方文档，聚焦编排接口与工作流适配。热度、输出质量、延迟与成本都在对比范围之外。由 Open Multi-Agent 项目发布。"
related:
  solutions: ["goal-driven-orchestration", "vercel-ai-sdk-orchestration"]
  examples: ["team-collaboration", "task-pipeline", "plan-replay"]
  integrations: ["external-agents", "opentelemetry"]
  comparisons: ["langgraph", "mastra", "vercel-ai-sdk", "openai-agents-sdk", "inngest-agentkit"]
featured: true
readingMinutes: 10
---

在说清楚哪种工作必须经得住生产环境之前，“最好的 TypeScript 多智能体框架是什么”没有一个有用的答案。

客服 handoff、长时间运行的状态图、流式 Agent UI，以及需要拆成并行任务的开放目标，是四种不同的系统。把它们塞进同一张总榜，会遮住真正重要的决策：**哪一种运行模型，匹配你实际拥有的工作流？**

这篇文章按最清晰的适用场景，列出六种方案。它不是流行度排行榜。

## 方法与利益关系披露

本文核对的是截至 2026 年 7 月 31 日的一方文档。入选项目需要有一方 JavaScript 或 TypeScript 接口，并提供明确方式来组合多个 Agent 或多个 Agentic 步骤。

这里的“最好”，指最适合某一种运行模型，不是 Star、下载量或社交讨论最多。我们没有用同一套任务测试质量、延迟和成本，所以不做性能排名。

本文由 Open Multi-Agent 项目发布，OMA 也在比较之中。这是读者应该在看到推荐之前就知道的利益关系。

CrewAI 等 Python 优先的框架不在这份 TypeScript 短名单里。这只是范围选择，不代表它们更差。

## 先看结论

| 你的系统需要…… | 先看…… | 原因 |
| --- | --- | --- |
| 显式、长时间运行的状态图 | **LangGraph.js** | 由你编写节点、边和共享状态；持久化与人工干预是核心运行概念。 |
| 用一个 TypeScript 框架覆盖 Agent、工作流、记忆、评估和运维 | **Mastra** | 它提供完整应用层能力，不止编排原语。 |
| 流式 UI 与提供方中立的模型、工具循环 | **Vercel AI SDK** | Agent 和 UI 原语贴近产品交互层，更高层编排可在应用代码里组合。 |
| Manager Agent、专家 handoff、guardrail 与内置追踪 | **OpenAI Agents SDK for JS** | Handoff 与 agents-as-tools 都是一等组合模式。 |
| 跑在 Inngest 持久步骤上的路由式 Agent 网络 | **AgentKit** | Router 围绕共享状态选择 Agent，模型步骤使用 Inngest 的执行语义。 |
| 在同一个本地运行时里，同时使用显式任务 DAG 与运行时目标拆解 | **Open Multi-Agent** | 应用可以运行单 Agent、自己提供任务图，或让协调器生成可审查计划。 |

这张表应该帮你得到两项短名单，而不是直接生成采购结论。承诺采用之前，先做一个代表性工作流。

## 1. LangGraph.js：最适合显式、可持久化的状态图

[LangGraph 的 JavaScript 文档](https://docs.langchain.com/oss/javascript/langgraph/overview)把它定义为面向长时间运行、有状态 Agent 的底层编排运行时。你定义 `StateGraph`、节点与边，可以把确定性代码和模型驱动步骤放进同一张图。

它的[持久化模型](https://docs.langchain.com/oss/javascript/langgraph/persistence)把线程内 checkpoint 与跨线程 store 分开，可用于中断恢复、人在回路中修改状态、时间回溯和长期记忆。

如果图本身就是产品逻辑的一部分，团队也想掌控每次状态转移，选它。控制力的代价也正是边界：LangGraph 刻意保持底层，你要设计拓扑，而不是只给一个目标、让运行时替你生成拓扑。

**代表性场景：** 阶段已知、状态可恢复，而且有明确人工决策点的承保或运营流程。

## 2. Mastra：最适合开箱较全的 TypeScript Agent 应用

[Mastra](https://mastra.ai/) 在一个 TypeScript 框架里提供 Agent、带类型工作流、记忆、server、可观测性、数据集与评估。它的工作流可以组合步骤和分支，应用层能力也覆盖了工作流周边基础设施。

如果团队希望采用一套有明确主张的完整技术栈，宁愿使用内置的记忆、运维和评估，也不想自己拼装，选它。尤其当你要构建和运营的单位是完整 Agent 应用，而不只是调度器时，它值得优先看。

代价是更大的能力面。工作流结构仍由你编写，也应该单独确认恢复要求依赖哪些存储与 server 组件。

**代表性场景：** 希望把 Agent、工作流、记忆、链路与评估都放在同一个框架边界内的 TypeScript 产品团队。

## 3. Vercel AI SDK：最适合流式 Agent 体验

AI SDK 的 [`ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent) 是可复用的多步工具循环，可以生成或流式返回内容、执行工具、输出带类型数据，并为审批暂停。它更广泛的 Agent API 能自然连接 UI 消息流与多个模型提供方。

如果产品最难的部分在交互层——token 流式返回、工具事件、带类型 UI 消息和提供方可移植性——选它。你可以把专家作为工具暴露，也可以在应用代码里协调多个循环。

但灵活的原语不会自动变成多智能体调度器。若系统需要共享任务 DAG、依赖调度，或跨多个 Agent 的运行级恢复，你需要自己搭编排，或在 AI SDK 之上增加一层。

**代表性场景：** 一个 Next.js 研究助手，需要在界面里持续展示工具和专家的中间活动。

## 4. OpenAI Agents SDK for JS：最适合 Manager 与 Handoff

[OpenAI Agents SDK 编排指南](https://openai.github.io/openai-agents-js/guides/multi-agent/)把两种模式设为一等能力：

- Manager 保持控制，把专家 Agent 当作工具调用。
- 分流 Agent 把对话 handoff 给专家，由专家成为当前 Agent。

SDK 还提供 [guardrail](https://openai.github.io/openai-agents-js/guides/guardrails/) 与[内置追踪](https://openai.github.io/openai-agents-js/guides/tracing/)。它的 JavaScript 仓库把 SDK 描述为提供方中立，不过默认追踪体验和若干平台集成自然与 OpenAI 更贴近。

如果最关键的抽象是“谁拥有当前对话”——由一个 Manager 综合，或让一个专家接管——选它。要仔细核对 guardrail 的作用边界：Agent 级输入与输出 guardrail 作用在链条两端，自定义函数工具调用则由工具级 guardrail 覆盖。

**代表性场景：** 服务台先识别问题，再把对话交给账单、退款或账户支持专家。

## 5. AgentKit：最适合跑在 Inngest 上的路由网络

[AgentKit Network](https://agentkit.inngest.com/concepts/networks)组合 Agent、共享状态与 Router。Router 选择下一个 Agent或结束循环；不同 Agent 可以使用不同模型，后续 Agent 也能读取网络状态里的结果。

它的 [Agent 执行文档](https://agentkit.inngest.com/concepts/agents)说明，推理步骤通过 Inngest `step.ai` 运行，由此获得自动重试与结果缓存。

如果路由式网络符合问题形态，而且你本来就想用 Inngest 作为执行底座，选它。要把这种循环与依赖图区分开：Router 选择下一位 Agent；显式任务 DAG 则能预先展示独立分支及其前置依赖。

**代表性场景：** 已有 Inngest 应用中的事件驱动数据补全流程，根据共享状态选择不同专家。

## 6. Open Multi-Agent：最适合在显式与生成式任务 DAG 之间切换

Open Multi-Agent 在同一个 TypeScript 运行时里提供三个层级：

- `runAgent()`：运行一个有边界的 Agent 循环。
- `runTasks()`：应用已经知道任务 DAG。
- `runTeam()`：让协调器在运行时把目标变成任务 DAG。

生成的计划可以先检查和审批，也可以保存成 artifact 后重放。不同 Agent 可以使用不同提供方，包括本地 OpenAI 兼容端点。运行时还提供 token 与估算成本预算、链路、评估原语和任务粒度的 checkpoint 恢复。

当关键问题不只是“一个 Agent 还是多个”，而是**本次运行的计划由谁拥有**时，选 OMA。稳定的客服工单可以走固定 DAG；变化更大的升级事件则交给协调器，不必切换到另一个框架。

不要把任务粒度 checkpoint 当成持久化工作流服务。恢复时可以复用已经完成的任务，但中断中的任务会重新开始。如果核心要求是跨进程计时器、事件等待，或由基础设施持有的持久执行，应明确评估工作流运行时。

**代表性场景：** 研究、事故调查或运营任务；目标会变化，独立调查需要并行，人也可能在执行前检查计划。

## 比排行榜更有效的选型测试

挑一个真正重要的工作流，在两个候选方案里各做一条最小端到端链路。使用同一组输入 fixture，并回答：

1. **谁拥有拓扑？** 代码、Router，还是规划模型？
2. **什么会被持久化？** 消息、图状态、已完成任务、工具调用、计时器，还是整个运行？
3. **人可以在哪里干预？** 工具之前、节点之间、生成计划之后，还是只能检查最终输出？
4. **你能看到什么？** 状态变化、任务依赖、模型调用、工具调用、成本和重试？
5. **替换提供方时，编排是否也要改？**
6. **恢复要依赖哪些常驻基础设施？**

然后让一次模型调用失败、在运行中途停掉进程、拒绝一个动作，再替换一个提供方。哪套框架能让这些事件变得不意外，哪套通常就更适合。

## 资料来源

- [LangGraph.js 概览](https://docs.langchain.com/oss/javascript/langgraph/overview)与[持久化](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [Mastra 框架概览](https://mastra.ai/)
- [Vercel AI SDK `ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent)与 [Agent 文档](https://ai-sdk.dev/docs/agents)
- [OpenAI Agents SDK 编排](https://openai.github.io/openai-agents-js/guides/multi-agent/)、[guardrail](https://openai.github.io/openai-agents-js/guides/guardrails/)与[追踪](https://openai.github.io/openai-agents-js/guides/tracing/)
- [AgentKit Network](https://agentkit.inngest.com/concepts/networks)与 [Agent](https://agentkit.inngest.com/concepts/agents)
- [Open Multi-Agent 源码](https://github.com/open-multi-agent/open-multi-agent)、[架构](/zh/architecture/)以及下方关联的框架比较页面
