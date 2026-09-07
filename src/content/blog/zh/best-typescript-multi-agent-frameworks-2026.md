---
title: "2026 年最好的 TypeScript 多智能体框架：按工作流来选"
description: "LangGraph、Mastra、Vercel AI SDK、OpenAI Agents、AgentKit 与 Open Multi-Agent：哪个 TypeScript 多智能体框架匹配你手上的工作流？"
pubDate: 2026-07-31
updatedDate: 2026-09-07
tags: ["typescript", "multi-agent-frameworks", "framework-selection"]
contentType: decision-guide
useCases: ["框架选型", "架构评估"]
industries: ["软件"]
evidence:
  kind: source-backed-comparison
  note: "对比官方文档，并于 2026 年 9 月 7 日重新核对，聚焦编排接口与工作流适配。Open Multi-Agent 的相关表述以 core v1.18.0 为准。热度、输出质量、延迟与成本都在对比范围之外。由 Open Multi-Agent 项目发布。"
related:
  solutions: ["goal-driven-orchestration", "vercel-ai-sdk-orchestration"]
  examples: ["team-collaboration", "task-pipeline", "plan-replay"]
  integrations: ["external-agents", "opentelemetry"]
  comparisons: ["langgraph", "mastra", "vercel-ai-sdk", "openai-agents-sdk", "inngest-agentkit"]
featured: true
readingMinutes: 10
---

在说清楚哪种工作必须经得住生产环境之前，“最好的 TypeScript 多智能体框架是什么”没有一个有用的答案。

TypeScript 里的多智能体系统并非只有一种形态。客服 handoff、长时间运行的状态图、流式 Agent UI，以及需要拆成并行任务的开放目标，是四种不同的系统。把它们塞进同一张总榜，会遮住真正重要的决策：**哪一种运行模型，匹配你实际拥有的工作流？**

这篇文章按最清晰的适用场景，列出六种方案。它不是流行度排行榜。

## 方法与利益关系披露

本文核对的是一方文档，并于 2026 年 9 月 7 日重新核实。入选项目需要有一方 JavaScript 或 TypeScript 接口，并提供明确方式来组合多个 Agent 或多个 Agentic 步骤。Open Multi-Agent 的相关表述以 core v1.18.0 为准。

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
| 在同一个本地运行时里，同时使用显式任务 DAG 与运行时目标拆解 | **Open Multi-Agent** | 运行单 Agent、自己提供任务图，或让协调器生成可审查计划——并且事后能回读这次究竟走了哪种拓扑、为什么。 |

把它当作一份短名单。承诺采用之前，先做一个代表性工作流。

## 1. LangGraph.js：最适合显式、可持久化的状态图

[LangGraph 的 JavaScript 文档](https://docs.langchain.com/oss/javascript/langgraph/overview)把它定义为面向长时间运行、有状态 Agent 的底层编排运行时。你定义 `StateGraph`、节点与边，可以把确定性代码和模型驱动步骤放进同一张图。

它的[持久化模型](https://docs.langchain.com/oss/javascript/langgraph/persistence)把线程内 checkpoint 与跨线程 store 分开，可用于中断恢复、人在回路中修改状态、时间回溯和长期记忆。

如果图本身就是产品逻辑的一部分，团队也想掌控每次状态转移，选它。控制力的代价也正是边界：LangGraph 刻意保持底层，你要设计拓扑，而不是只给一个目标、让运行时替你生成拓扑。这是这个包本身的属性，而非整个技术栈的属性——它的概览把 LangGraph 定位成更上层 Agent harness 所依托的编排层。

**代表性场景：** 阶段已知、状态可恢复，而且有明确人工决策点的承保或运营流程。

## 2. Mastra：最适合开箱较全的 TypeScript Agent 应用

[Mastra](https://mastra.ai/) 在一个 TypeScript 框架里提供 Agent、带类型工作流、记忆、server、可观测性、数据集与评估。这个能力面仍在扩张：`AgentController` 承载交互式 Agent 应用，Factory 则提供一套面向「从 issue 到上线」的 Agent 体系。它的工作流可以让步骤顺序执行、并行执行，或走条件分支，应用层能力也覆盖了工作流周边基础设施。

如果团队希望采用一套有明确主张的完整技术栈，宁愿使用内置的记忆、运维和评估，也不想自己拼装，选它。尤其当你要构建和运营的单位是完整 Agent 应用，而不只是调度器时，它值得优先看。该框架采用 Apache-2.0、可自托管；若不愿自己运行 server，也有 Mastra Cloud。

代价是更大的能力面。工作流结构仍由你编写，也应该单独确认恢复要求依赖哪些存储与 server 组件。

**代表性场景：** 希望把 Agent、工作流、记忆、链路与评估都放在同一个框架边界内的 TypeScript 产品团队。

## 3. Vercel AI SDK：最适合流式 Agent 体验

AI SDK 的 [`ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent) 是可复用的多步工具循环，可以生成或流式返回内容、执行工具、输出带类型数据，并为审批暂停——`toolApproval` 会返回一个 `tool-approval-request`，而不是直接执行该次调用。它更广泛的 Agent API 能自然连接 UI 消息流与多个模型提供方。

如果产品最难的部分在交互层——token 流式返回、工具事件、带类型 UI 消息和提供方可移植性——选它。你可以把专家暴露成父 Agent 通过工具委派的 [subagent](https://ai-sdk.dev/docs/agents/subagents)，也可以在应用代码里协调多个循环。

持久性是后来单独补上的。来自 `@ai-sdk/workflow` 包的 [`WorkflowAgent`](https://ai-sdk.dev/docs/agents/workflow-agent) 把每次工具执行都变成带自动重试的持久步骤，因此它能扛过 `ToolLoopAgent` 扛不过的重启；安装它会一并拉入 Workflow 5，后者目前发布在 `beta` 标签下。那是单个 Agent 循环的持久性。共享任务 DAG、依赖调度，以及跨一组 Agent 的运行级恢复，仍然要你自己搭建，或在 SDK 之上再叠一层——它自己的[工作流模式](https://ai-sdk.dev/docs/agents/workflows)页面就把串联、并行与路由呈现为需要你编写的代码。

**代表性场景：** 一个 Next.js 研究助手，需要在界面里持续展示工具和专家的中间活动。

## 4. OpenAI Agents SDK for JS：最适合 Manager 与 Handoff

[OpenAI Agents SDK 编排指南](https://openai.github.io/openai-agents-js/guides/multi-agent/)把两种模式设为一等能力：

- Manager 保持控制，把专家 Agent 当作工具调用。
- 分流 Agent 把对话 handoff 给专家，由专家成为当前 Agent。

SDK 还提供 [guardrail](https://openai.github.io/openai-agents-js/guides/guardrails/) 与[内置追踪](https://openai.github.io/openai-agents-js/guides/tracing/)，后者在服务端运行时默认开启。其他提供方的模型需要经适配器接入，而非原生支持；默认追踪配置导出到 OpenAI，并且在执行零数据留存（Zero Data Retention）策略的组织中不可用。

如果最关键的抽象是“谁拥有当前对话”——由一个 Manager 综合，或让一个专家接管——选它。要仔细读 guardrail 的作用边界，它比“挂在 Agent 上”这个说法更窄：输入 guardrail 只对链条中的第一个 Agent 运行，输出 guardrail 只对产出最终输出的那个 Agent 运行，因此在 Manager 或 handoff 工作流里，逐次调用的检查应当交给工具 guardrail。而工具 guardrail 覆盖的是你用 `tool()` 定义的函数工具——不覆盖 handoff 调用本身，不覆盖托管工具，`agent.asTool()` 目前也没有暴露这些选项。

**代表性场景：** 服务台先识别问题，再把对话交给账单、退款或账户支持专家。

## 5. AgentKit：最适合跑在 Inngest 上的路由网络

[AgentKit Network](https://agentkit.inngest.com/concepts/networks)组合 Agent、共享状态与 Router。Router 选择下一个 Agent或结束循环；不同 Agent 可以使用不同模型，后续 Agent 也能读取网络状态里的结果。

它的 [Agent 执行文档](https://agentkit.inngest.com/concepts/agents)说明，推理步骤通过 Inngest `step.ai` 运行，由此获得自动重试与结果缓存。

如果路由式网络符合问题形态，而且你本来就想用 Inngest 作为执行底座，选它；它仍处于 pre-1.0，并且默认你的技术栈里有 Inngest。要把这种循环与依赖图区分开：Router 选择下一位 Agent；显式任务 DAG 则能预先展示独立分支及其前置依赖。

**代表性场景：** 已有 Inngest 应用中的事件驱动数据补全流程，根据共享状态选择不同专家。

## 6. Open Multi-Agent：最适合在显式与生成式任务 DAG 之间切换

Open Multi-Agent 在同一个 TypeScript 运行时里提供三个层级：

- `runAgent()`：运行一个有边界的 Agent 循环。
- `runTasks()`：应用已经知道任务 DAG。
- `runTeam()`：让协调器在运行时把目标变成任务 DAG。

真正的区别在于：在这三个层级之间移动，是一个被运行时记录下来的决定，而不是一次重写。一次自动的 `runTeam()` 调用按已文档化的优先级解析拓扑——显式 `mode`、已声明的治理、per-run 的 `ExecutionRouter`、orchestrator 级的 router，最后是内置的 `DeterministicRouter`——并把结果连同理由写进 `result.routingDecision`，关联到链路证据。这就是 Execution Routing，它与 Model Routing 是刻意分开的：后者决定在选定拓扑内部、每次调用用哪个模型。

治理是声明出来的，不是暗示出来的。`governanceIntent` 配合 `requiredRoles` 与 `requiredOrder` 声明一条角色路径，运行时据此检查**实际执行的拓扑**，而不是 Agent 话术里的标签，并给出 `governanceConclusion`。应用可以覆盖已声明的下限，但那会返回 `unsatisfied` 和 `overridden`，而不是一次干净的成功。

审批是位于不同边界的三个 hook，而不是一条：`onPlanReady` 管生成的计划，`onTaskDispatch` 管一个就绪任务，`onToolCall` 管一次工具调用——最后这条运行在输入校验之后、`execute` 之前，所以它看到的是真正会被执行的参数。会产生真实副作用的工具标记 `consequential: true`；这套判定只看工具授权，不扫描目标、提示词或模型输出。

关卡也可以返回 `{ action: 'suspend' }`，而不是就地作答。此时请求与「先到先得」的决定会与检查点一同持久化，`decideApproval()` 记录由谁作出决定，并用一个哈希把该决定绑定到受审内容本身；于是 `restore()` 要么在完全相同的内容上恢复，要么直接失败，而不会继承一个已经过期的审批。审阅者不必处在发起请求的那个进程里，也不必处在它的生命周期内，因而一次审阅可以跨过重启。这就是[持久化审批门](/zh/reference/durable-approvals/)。

调度是事件驱动的：下游任务在自己的依赖被满足时立刻启动。`dependencyPayload: 'structured'` 传递依赖校验过的 JSON 而非其散文，`taskResults` 让每个任务未经合并的结果按稳定 ID 可寻址。不同 Agent 可以使用不同提供方，包括本地 OpenAI 兼容端点，模型路由支持有序 fallback。token 与估算成本预算、链路、离线 Run Viewer、版本化 EvalSet 以及 checkpoint 恢复，全部无需托管服务。

还有两项较新的控制，值得连同它们的边界一起说清楚。[`egressPolicy`](/zh/reference/egress-policy/) 约束框架自有的模型流量：`offline` 只允许回环地址，`allowlist` 只允许你列出的源，而 orchestrator、run 与 agent 三个作用域取交集，不会相互放宽。它覆盖 OMA 自己构造的内置适配器，对无法保护的适配器则直接失败关闭；于是 MCP server、进程后端、内置 shell 与自定义工具，仍各自持有自己的网络访问能力。另外，可选开启的仅追加[运行事件日志](/zh/reference/run-journal/)会记录每一次适配器调用，以及模型看到的每个块的来源，`verifyRun()` 可以在运行结束后对它做冷校验。它检测的是漂移，不是篡改：没有哈希链、没有签名、没有一次写入存储，因此任何能改写这个文件的人，都可以在同一次操作里改掉某个事件、连同引用它的哈希一起改掉。

当关键问题不只是「一个 Agent 还是多个」，而是**本次运行的计划由谁拥有、事后留下什么证据**时，选 OMA。稳定的客服工单可以走固定 DAG；变化更大的升级事件交给协调器，不必切换到另一个框架，而这次运行自己会记下它走了哪条路。

有两条边界要说清楚。第一条是恢复究竟覆盖了什么。内置 LLM 运行器可以在任务中途恢复：快照写在安全的回合与工具边界上，已提交的工具结果按模型下发的 `toolCallId` 回放，而不是再执行一次，回合计数与 token 统计也随之恢复。随之而来的有三条限制。进程后端与 ACP 后端仍是任务粒度，因为它们持有自己的私有循环，OMA 看不到其中的状态。一个已经执行、但结果从未写入存储的工具会被再跑一次，所以外部副作用需要用 `toolCallId`（或另一个领域内的键）作为幂等键。以及，快照仍然是恢复的锚点：可选开启的运行事件日志只是为它补上一段可回放的尾巴，而不会取代它；并且没有任何已发布版本提供权威运行存储，因此两个进程从同一份快照恢复时，可能同时推进它。如果你的核心要求是跨进程计时器、事件等待，或由基础设施持有的持久执行，就该为此单独评估工作流运行时。

第二条是工具闸门决定了什么。它是策略决策，而非进程沙箱：它决定一次调用能不能继续，不决定工具真跑起来之后能碰到什么。

**代表性场景：** 研究、事故调查或运营任务；目标会变化，独立调查需要并行，人也可能在执行前检查计划。

## 比排行榜更有效的选型测试

TypeScript 的工作流编排，很容易靠文档列出候选，却很难只靠文档做出选择。挑一个真正重要的工作流，在两个候选方案里各做一条最小端到端链路，使用同一组输入 fixture，并回答：

1. **谁拥有拓扑？** 代码、Router，还是规划模型？
2. **什么会被持久化？** 消息、图状态、已完成任务、工具调用、计时器，还是整个运行？
3. **人可以在哪里干预？** 工具之前、节点之间、生成计划之后，还是只能检查最终输出？
4. **你能看到什么？** 状态变化、任务依赖、模型调用、工具调用、成本和重试？
5. **替换提供方时，编排是否也要改？**
6. **恢复要依赖哪些常驻基础设施？**

然后让一次模型调用失败、在运行中途停掉进程、拒绝一个动作，再替换一个提供方。哪套框架能让这四件事变得不意外——并且留下一份事后读得懂的记录——哪套通常就更适合。

第 1、3、4 个问题是候选之间差异最大的地方，也最该用一次真实运行来回答，而不是翻文档。「人能在哪里介入」的答案，取决于运行时给的是一个钩子还是分处不同边界的几个；「你能检查什么」的答案，则取决于拓扑决策本身是被记录下来了，还是只能从结果反推。

## 资料来源

- [LangGraph.js 概览](https://docs.langchain.com/oss/javascript/langgraph/overview)与[持久化](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [Mastra 框架概览](https://mastra.ai/)与[文档](https://mastra.ai/docs)
- [Vercel AI SDK `ToolLoopAgent`](https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent)、[Agent 文档](https://ai-sdk.dev/docs/agents)、[subagents](https://ai-sdk.dev/docs/agents/subagents)、[`WorkflowAgent`](https://ai-sdk.dev/docs/agents/workflow-agent)与[工作流模式](https://ai-sdk.dev/docs/agents/workflows)
- [OpenAI Agents SDK 编排](https://openai.github.io/openai-agents-js/guides/multi-agent/)、[guardrail](https://openai.github.io/openai-agents-js/guides/guardrails/)与[追踪](https://openai.github.io/openai-agents-js/guides/tracing/)
- [AgentKit Network](https://agentkit.inngest.com/concepts/networks)与 [Agent](https://agentkit.inngest.com/concepts/agents)
- [Open Multi-Agent 源码](https://github.com/open-multi-agent/open-multi-agent)、[架构](/zh/architecture/)，以及[检查点与恢复](/zh/reference/checkpoint/)、[持久化审批门](/zh/reference/durable-approvals/)、[出网策略](/zh/reference/egress-policy/)与[运行事件日志](/zh/reference/run-journal/)等参考文档
