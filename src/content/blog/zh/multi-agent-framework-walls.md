---
title: "多智能体框架会撞上的 5 堵墙：来自 Mastra 那一年从 .network() 迁到 Supervisor 的实录"
description: "Mastra 花了一年把 .network() 迁到 Supervisor 模式。撞上 5 堵工程之墙（上下文、路由、可观测性、嵌套、性能），18 个 GitHub issue 为证。这对 TypeScript 多智能体框架开发意味着什么。"
pubDate: 2026-05-21
tags: ["mastra","typescript","agents","opensource"]
readingMinutes: 13
---
在 TypeScript 里做多智能体，是工程上的硬骨头。智能体之间的上下文传递、跨提供方的路由质量、LLM 驱动决策内部的可观测性、嵌套深度、并发下的性能：过去一年，这每一条都咬过 Mastra，而且有公开的 GitHub issue 为证。

这篇文章从 Mastra 历时一年、从 `.network()` 迁到 Supervisor 模式的过程里，拎出 5 堵工程之墙。我在 Mastra 的 GitHub 仓库里搜了 `AgentNetwork`、`multi-agent`、`supervisor` 和 `network`，得到 32 个相关 issue，时间跨度从 2025 年 5 月到 2026 年 5 月，下面引用其中 18 个有代表性的。

为什么偏偏挑 Mastra？因为他们是最公开的案例。2026 年 4 月 9 日，Mastra 完成了由 Spark Capital 领投的 2200 万美元 A 轮，融资总额达到 3500 万美元。同一天，他们发布了 Mastra Platform。我把 A 轮博文、Platform 发布稿和定价页从头到尾读了一遍：「multi-agent」这个确切说法，三处加起来出现了零次。他们在 A 轮博文里还提了一次 `subagents`，所以多智能体协调并没有作为一项能力消失。但「multi-agent」作为一个*定位词*，没了。

这是一次转向。九个月前，2025 年 7 月，Mastra 发过一篇「Beyond Workflows: Introducing Agent Network」，把 LLM 驱动的多智能体自动路由定位成比工作流更进一步的东西。九个月后，A 轮叙事变成了 Studio + Server + Memory Gateway。是「agent infrastructure platform」。是「框架给你原语，平台给你大规模运行的工具」。

中间发生了什么？这 32 个 issue 比任何博文都诚实得多。它们覆盖了 Mastra 的完整弧线：每一次迭代、每一次过渡、每一次定位的转变。

五堵墙在下面。每一堵 Mastra 都撞上了，且有 issue 为证。

## 背景：当时所有人都在抢多智能体这条赛道

要理解这次转向的分量，先看看整个赛道。整个 2024 到 2025 年，LangGraph、CrewAI、AutoGen 和 Mastra 都把多智能体当作核心叙事来推。微软 AutoGen 的论文反复强调「多个智能体协作胜过单个智能体」。LangChain 把 LangGraph 提升为头牌产品。CrewAI 一年内涨到了数万 star。

在 TypeScript 世界里，Mastra 是扛旗的那个。2024 年 10 月由 Gatsby 联合创始人 Sam Bhagwat 带队创立。YC W25。2025 年 10 月宣布 1300 万美元种子轮，来自 100 多位投资人（博文标题写的是「120+ others」），包括 YC、Paul Graham、Guillermo Rauch、Amjad Masad 和 Balaji Srinivasan。三位创始人，背后是一个被数十万开发者使用过的框架。

他们占尽了优势：TS 生态、Gatsby 出身、YC、顶级 VC、明星天使、一笔 2200 万美元的 A 轮，客户里还有 Replit、Brex、Sanity、Factorial、Indeed、Marsh McLennan、MongoDB、Workday 和 Salesforce。

可他们还是把 `.network()` 从多智能体的头条里挪走了。

## Mastra 多智能体叙事的完整时间线

| 日期 | 事件 | 「多智能体」在他们故事里的位置 |
|---|---|---|
| 2024 年 10 月 | 团队成立 | 没有。当时的口号是「面向下一个百万 AI 开发者的 TS 框架」 |
| 2025 上半年 | AgentNetwork v1（实验性） | 有，但他们后来承认 v1「pretty whack」 |
| 2025 年 10 月 8 日 | 宣布 1300 万美元种子轮 | 不是核心融资叙事 |
| **2025 年 7 月 3 日** | **博文：「Beyond Workflows: Introducing Agent Network (vNext)」** | **顶点**。原话：「intelligent AI orchestration that automatically routes and executes complex multi-agent tasks without predetermined workflows」 |
| 2025 年 8 月 26 日 | 博文：「Improved agent orchestration with AI SDK v5」 | 标题里的「orchestration」悄悄降级成了单智能体的工具编排 |
| 2025 年 10 月 10 日 | 博文：「The evolution of AgentNetwork.」`.network()` API 收敛 | 多智能体仍是亮点，但 API 在简化 |
| 2025 年 11 月 | v1 Beta | 仍为 agent network 提及 `.network()` |
| 2026 年 1 月 | v1.0 稳定版 | 多智能体不再是头牌功能 |
| **2026 年 2 月 26 日** | **Supervisor 模式作为多智能体编排的一等原语发布** | `.network()` 后来在迁移指南里被标记为 deprecated |
| **2026 年 4 月 9 日** | **Mastra Platform + A 轮 2200 万美元** | 「multi-agent」这个确切说法在 A 轮、Platform 和定价页里出现了 0 次。`subagents` 仍提到一次 |
| 2026 年 5 月 19 日 | 「Introducing A2A support」 | 跨框架互操作协议。多智能体能力仍在，但现在被框定为智能体间互操作，而非内部编排 |

多智能体作为头条主打，从 2025 年 7 月持续到 2025 年 11 月，大约 4 到 5 个月。然后是 8 月的悄然降级，2 月迁到 Supervisor 的 API 切换，以及到 4 月 A 轮时的措辞转换。

九个月的重新定位。

## 博文是写给媒体的。issue 才是真实的。

发布博文背后有公关团队。GitHub issue 没有。

Mastra 仓库目前大约有 24.1k star、2.1k fork、200 多个 open issue（2026-05-21 查）。在匹配我搜索的 32 个 issue 里，这篇引用其中 18 个有代表性的。有五个主题反复出现。它们不是功能请求。不是 typo 或文档错误。它们是在生产环境里运行多智能体系统时真正的硬问题。

Mastra 在这些问题上花了一年，最后选择迁到一个结构上更简单的设计（Supervisor 树），绕开其中一部分，但不是全部。

下面就是这五堵墙。

## 墙 1：智能体之间的内存、上下文传递与持久化

这是最深的一堵墙，也是 Mastra 撞得最久的一堵。

Issue #11468，标题简简单单就叫「Agent Network」，2025 年 12 月 29 日从他们的 Discord 提交。原文：

> "Using agent.network() I found something that when an orchestrating agent decides which secondary agent to call, the message history is not transferred to the secondary agent, making it difficult for it to understand the context for action. Please, can you help me with this? I haven't found in any documentation how to pass the memory to this flow in the final agent."

翻译成产品语言：**协调器决定调谁，但被调的那个智能体不知道自己为什么被调。**

这个问题在 Mastra 的 tracker 里至少留了六个月。Issue #5381（「Memory for Networks?」）于 2025 年 6 月 23 日提交。相邻的内存/存储/持久化 issue 在 Supervisor 迁移之后还在继续，包括 #15336（「LibSQL Storage/Memory Error with supervisor agent and sub agents」）和 #14583（「Supervisor/Subagent Persistence Duplication」）。这些和 #11468 那个「消息历史没传过去」的 bug 不算严格同一个，但它们共享一个根：协调器与其子智能体之间的状态管理很难，而且难在好几个方面。

真正的工程硬度在于：你不能把整段对话历史一股脑塞进每个子智能体（token 爆炸、隐私、信噪比），但你也不能让它们两眼一抹黑（它们需要任务上下文）。这个权衡是一个开放问题，不是一个几个月就能了结的问题。

## 墙 2：路由质量与提示脆性

LLM 驱动的自动路由，依赖于提示在各个模型上的鲁棒性。跨提供方时，同一条路由提示的表现会差很多。

为证：

- **#9873**（2025-11-07）「Network Agents does not forward the request to sub agents inside the network.」路由根本不工作
- **#12468**（2026-01-29）「Agent Network Routing Latency.」慢
- **#12955**（2026-02-11）「The sub agents are returning empty output inside network.」子智能体返回空
- **#13621**（2026-02-28）「Agent Network routing prompt has trailing whitespace, causing failures with Bedrock-backed Claude models.」**路由提示里一个行尾空格，就让整条路由链在 Bedrock Claude 上挂掉。**

最后这个最能说明问题。一个行尾空格，跨提供方无法调试。这不是用户的错。这是 LLM 驱动路由这个范式本身的脆弱。换个提供方，你的路由行为可能就得整个重新调一遍。

## 墙 3：AgentNetwork 路由可观测性的缺口

在 AgentNetwork 内部做路由的是 LLM。用户看不到它为什么这么选。

Issue **#12277**（2026-01-24）「Missing Observability for Routing and Validation LLM Calls in Agent Networks」直接点出了这一点。它的范围很窄：specifically 是关于 AgentNetwork 内部路由与校验 LLM 调用的 trace，而不是框架级的可观测性。到那个日期，`.network()` 已经上线大约三个月。在这整段时间里，`.network()` 的生产用户在路由层上都是盲飞。

AgentNetwork 路由与校验的可观测性，本该是第一天就要做的设计决策。几个月后才补上，意味着这几个月里用户一直撞上「协调器为什么挑了这个智能体」却得不到答案。

## 墙 4：三层嵌套就已经崩了

Issue **#15013**（2026-04-03）「3-level sub-agent delegation: no progressive streaming to client.」

三层子智能体委派，就足以让流式崩掉。

这一点之所以要紧，是因为那些立志当「agent OS」或「agent operating system」的多智能体框架，需要支持很深的组织结构。Mastra 在三层子智能体委派上就裂开了。我没有找到任何框架在四层智能体委派上的公开基准，Mastra 也没有披露过他们客户负载（Brex、Indeed、Marsh McLennan）的拓扑深度，所以关于那个上限我没法下任何结论。我能说的是：对 Mastra 至少一个用户来说，三层流式崩了；而「深层智能体组织」这套说辞，配得上一个比通常更高的证据门槛。

## 墙 5：性能崩塌

Issue **#15478**（2026-04-17 提，2026-05-20 关闭），「[RFC] Agent Performance Optimization (Slow Responses).」

这是一份 RFC，不是 bug。Mastra 开了一份公开 RFC，承认智能体响应慢已经到了系统性问题的程度。这份 RFC 于 2026 年 5 月 20 日关闭，就在这篇文章的前一天，此前一位维护者评论说问题已经处理掉了。

诊断来自 #15677（2026-04-23）：

> "ObservationalMemoryProcessor.processInputStep blocks every agentic loop step with DB reads and token counting even when far below thresholds."

翻译过来：**每一轮智能体循环迭代都会触发一次数据库读取和 token 计数。** 在单个智能体上还能忍。一旦被放大到一个带多个并发子智能体的 supervisor 上，就是灾难。

多智能体的隐藏成本一直被低估。每个智能体是一次 LLM 调用。每次调用都需要上下文处理，再加上可观测性、trace、token 计数、内存 I/O。Mastra 正在暴露的，是这些「轻量」操作一旦叠到多智能体拓扑上之后的真实成本。

## 迁到 Supervisor 之后发生了什么

2026 年 2 月 26 日，Mastra 正式发布了 Supervisor 模式。changelog 把它描述为「a first-class supervisor pattern, exposed through the same primitives you already use, `stream()` and `generate()`」。`.network()` 后来在迁移指南里被标记为 deprecated：「will be removed in a future release. While existing code will continue to work until then, no new features will be added to it.」

这次迁移的逻辑：从 LLM 驱动的路由，转向在一棵树里手工配置的子智能体。结构更简单、决策更可预测、bug 面更少。

issue 数据讲了一个不一样的故事。

从 2026 年 3 月到 5 月，跟 Supervisor 相关的 issue 扎堆出现：

- **#14723**（2026-03-26）Supervisor 与子智能体的交互被存成了 Supervisor 与用户的交互（历史污染）
- **#14820**（2026-03-29）supervisor 模式下没法中止子智能体的执行
- **#14583**（2026-03-23）Supervisor/子智能体持久化重复
- **#15013**（2026-04-03）三层子智能体委派的流式坏掉
- **#15336**（2026-04-14）LibSQL 存储 + 子智能体抛错
- **#15436**（2026-04-16）无法控制子智能体的工具结果
- **#15734**（2026-04-24）当子智能体拥有一个工作流时，suspend/resume 失效
- **#15887**（2026-04-28）审批模式下子智能体调用被串行化（并发死掉）
- **#16422**（2026-05-11）`transformAgent` 丢掉子智能体的工具输入流式分片
- **#15478**（性能 RFC，2026-05-20 关闭）

Supervisor 不是终点。它简化了一些问题（不再有 LLM 自动路由），但多智能体的核心挑战（上下文传递、持久化一致性、嵌套深度、并发控制、流式）并没有消失。它们换了一批 issue 编号，又冒了出来。

「简化后的设计」是讲给社区和投资人听的故事。工程上的现实是，他们还在打补丁。

## 这意味着什么

从 Mastra 一年的公开行为里，我得出三条结论。

**一、这次迁移不是概念失败。是工程硬度。**

多智能体作为一个概念，在研究和产品里都被验证过。LangChain、AutoGen、CrewAI 都在做。差距在「概念跑得通」和「生产稳定」之间。跨过它，Mastra 用了一年、几十个 issue、一次大的 API 重写，以及 A 轮里的一次措辞转换。这不是一个「拿起来就能发」的方向。它是一个真·工程领域。

**二、超过两层的多智能体深度，仍是一个尚未被解好的硬问题。**

Mastra 的三层流式 bug（#15013）暗示这不是 Mastra 独有的天花板，但我不能替我没测过的框架说话。我能从这些为证里说的是：提示鲁棒性、上下文传递、流式、token 计数、错误恢复，在 Mastra 的案例里，到两层都勉强撑住，到三层就发抖，而到四层，我没有为任何框架找到公开可靠的演示。如果你有反例，我是真心想看。

**三、把「Agent OS」当 buzzword，对不上工程现实。**

一个操作系统意味着稳定、可预测，以及很深的进程嵌套。一个在三层委派就让流式崩掉、需要为性能开 RFC、花了六个月才搞明白上下文传递的系统，顶多算个框架。把它叫 OS，是开一张当前技术兑不了现的支票。

Mastra 显然清楚这一点。他们的融资公告不用「OS」。他们用「Platform」。他们用「framework」。他们用「infrastructure」。这些都是有边界的词。

## 我站在哪里

我从 2026 年 4 月开始做一个开源的 TypeScript 多智能体框架。我们管它叫 open-multi-agent。仓库在 github.com/open-multi-agent/open-multi-agent。

过去一年看着 Mastra 的迁移，并没有让我相信这条路是死的。它让我相信了另一件事：**Mastra 选择把 `.network()` 迁进 Supervisor、并切换头条措辞。我们选择直直地走进这五堵墙，并把它们一一点名。**

我们今天走到哪了：

- **墙 1（上下文传递）**：用 `SharedMemory` 做一个带命名空间的键值存储，以 markdown 摘要的形式注入到提示里，再加 `MessageBus` 做智能体间的点对点和广播消息。和 Mastra「传消息历史」是不同的机制。我们是绕开这个问题，而不是直接解它
- **墙 2（路由）**：协调器的决策被 Zod schema 约束，校验失败时自动重试一次。本地模型回退会解析裸 JSON 和 markdown 围栏包起来的 JSON 输出格式
- **墙 3（可观测性）**：内置一个运行后的任务 DAG 仪表盘（纯 HTML 渲染，无 I/O 依赖）。每次团队运行都会渲染出任务 DAG、每个任务的负责人、状态、耗时和 token 用量。第一天就有的设计
- **墙 4（嵌套）**：`maxDelegationDepth` 上限，再加环检测（目标已在 `delegationChain` 里就拒绝）和智能体池死锁检测（`availableRunSlots < 1` 时拒绝）。三道保护从第一天就在
- **墙 5（性能）**：只有三个运行时依赖（`@anthropic-ai/sdk`、`openai`、`zod`）。`SharedMemory` 默认在进程内，没有每步的数据库 I/O。三层 Semaphore 并发控制（智能体池、单智能体、工具执行）

## 我们没解决的

这五堵墙没有一堵是「我们靠一个聪明的设计搞定了」。这是行业级的硬。不是一个单团队的智力问题。

我应该明说我们在哪里还差着：

- **嵌套深度**：`maxDelegationDepth` 默认是 3。**这正是 Mastra 裂开的那个深度。** 我们没有做过超过四层的严肃工程测试。对我们也是开放问题
- **性能**：我们没有系统性地压测过 100 任务 × 10 智能体。Mastra 是在客户生产环境里撞上性能墙的，而我们的样本量还没法比
- **上下文传递**：`SharedMemory` + `MessageBus` 方向是对的，但「一个子智能体默认看到什么」这条策略还在迭代。我们没有复现 Mastra 的每一个失败案例
- **跨提供方鲁棒性**：我们跑了跨提供方的基础路由一致性测试。像「行尾空格让 Bedrock Claude 挂掉」这类边角情况，还没有系统性地扫过

这篇文章不是在宣布我们解决了 Mastra 没解决的事。

它是一份邀请。多智能体是一个真实的方向，有真实的工程价值，也有真实的工程难度。我们还在往前推。如果你也相信这件事值得做，来搭把手。

## 怎么参与

仓库：[github.com/open-multi-agent/open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)

欢迎提 PR。欢迎在 issue 里提反对意见。尤其欢迎那些能打破我们结论的失败案例。

---

## 常见问题

**Mastra 放弃多智能体了吗？**

没有。Mastra 仍通过 Supervisor 模式（2026 年 2 月 26 日发布）、`subagents` 原语，以及 A2A 跨框架互操作协议（2026 年 5 月 19 日）继续支持多智能体协调。变的是头条措辞：他们的 A 轮和 Platform 公告（2026 年 4 月 9 日）不再用「multi-agent」当定位词。能力还在；API 和营销两边都变了。

**如果我今天要在 TypeScript 里起一个多智能体项目，该用什么？**

取决于你需要什么。Mastra 的 Supervisor 模式背后是一家资金充足、有企业客户（Replit、Brex、MongoDB、Workday、Salesforce、Indeed）的公司，当你想要手工配置、执行可预测的子智能体时，它很合适。如果你想要 LLM 驱动的「目标到 DAG」拆解（一个目标进去，自动生成一张任务 DAG，按依赖顺序跨多个智能体执行，而不是手工配置一棵 supervisor 树），[open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) 走的就是这条路，三个运行时依赖加一个协调器模式。如果你不介意用 Python，LangGraph 也值得看看。

**open-multi-agent 是什么，它和 Mastra 有何不同？**

open-multi-agent 是一个开源的 TypeScript 多智能体编排框架，2026 年 4 月发布（[github.com/open-multi-agent/open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)）。核心区别：open-multi-agent 用一个协调器，通过 LLM 把目标拆解成任务 DAG，再按依赖顺序跨多个智能体并行执行任务；而 Mastra 当前的 Supervisor 模式用的是手工配置的子智能体，由 supervisor 在运行时委派。其它设计选择还包括三个运行时依赖（`@anthropic-ai/sdk`、`openai`、`zod`）、默认在进程内、没有每步数据库 I/O 的 `SharedMemory`，以及内置的委派深度上限加环检测。

**open-multi-agent 解决了 Mastra 撞上的 5 堵墙吗？**

说实话，部分解决了。我们对每一堵墙都有明确的设计选择（用 SharedMemory + MessageBus 做上下文，用 Zod 约束的协调器决策做路由，用运行后的任务 DAG 仪表盘做可观测性，用深度上限 + 环检测做嵌套，用进程内状态做性能）。但我们没有在 100 任务 × 10 智能体上压测过，我们的 `maxDelegationDepth` 默认是 3（正是 Mastra 裂开的地方），而像「行尾空格让 Bedrock Claude 挂掉」这类跨提供方路由边角情况，也还没有系统性地扫过。这是一份开放的邀请，不是一个已解决的问题。

---

## 来源

**Mastra 的博文与公告：**

- [Mastra Series A (2026-04-09)](https://mastra.ai/blog/series-a)
- [Announcing Mastra Platform (2026-04-09)](https://mastra.ai/blog/announcing-mastra-platform)
- [Beyond Workflows: Introducing Agent Network vNext (2025-07-03)](https://mastra.ai/blog/vnext-agent-network)
- [Announcing improved agent orchestration with AI SDK v5 (2025-08-26)](https://mastra.ai/blog/announcing-mastra-improved-agent-orchestration-ai-sdk-v5-support)
- [The evolution of AgentNetwork (2025-10-10)](https://mastra.ai/blog/agent-network)
- [Mastra Changelog (Supervisor pattern launch, 2026-02-26)](https://mastra.ai/blog/changelog-2026-02-26)
- [Network to Supervisor migration guide](https://mastra.ai/guides/migrations/network-to-supervisor)
- [Introducing A2A support (2026-05-19)](https://mastra.ai/blog/introducing-agent-to-agent-support)
- [Seed round announcement (2025-10-08)](https://mastra.ai/blog/seed-round)
- [Mastra pricing](https://mastra.ai/pricing)

**GitHub issues（按出现顺序）：**

- 上下文传递：[#11468](https://github.com/mastra-ai/mastra/issues/11468) [#5381](https://github.com/mastra-ai/mastra/issues/5381) [#15336](https://github.com/mastra-ai/mastra/issues/15336) [#14583](https://github.com/mastra-ai/mastra/issues/14583)
- 路由质量：[#9873](https://github.com/mastra-ai/mastra/issues/9873) [#12468](https://github.com/mastra-ai/mastra/issues/12468) [#12955](https://github.com/mastra-ai/mastra/issues/12955) [#13621](https://github.com/mastra-ai/mastra/issues/13621)
- 可观测性：[#12277](https://github.com/mastra-ai/mastra/issues/12277)
- 嵌套：[#15013](https://github.com/mastra-ai/mastra/issues/15013)
- 性能：[#15478](https://github.com/mastra-ai/mastra/issues/15478) [#15677](https://github.com/mastra-ai/mastra/issues/15677)
- Supervisor 时代：[#14723](https://github.com/mastra-ai/mastra/issues/14723) [#14820](https://github.com/mastra-ai/mastra/issues/14820) [#15436](https://github.com/mastra-ai/mastra/issues/15436) [#15734](https://github.com/mastra-ai/mastra/issues/15734) [#15887](https://github.com/mastra-ai/mastra/issues/15887) [#16422](https://github.com/mastra-ai/mastra/issues/16422)

---

*我在做 open-multi-agent，一个开源的 TypeScript 多智能体框架。欢迎在仓库里提评论、反对意见和失败案例。*
