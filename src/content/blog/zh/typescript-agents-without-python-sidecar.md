---
title: "在 TypeScript 服务里做多智能体，不必再挂一个 Python 边车"
description: "三个 Agent 挂在一条 Express 路由后面，跑在你本来就要部署的 Node 进程里：逐 Agent 选模型档位、经校验的 JSON 交接、运行级 token 上限，以及真正能取消的取消。"
pubDate: 2026-08-02
tags: ["typescript", "nodejs", "multi-agent", "express"]
contentType: decision-guide
useCases: ["ticket triage", "backend orchestration"]
industries: ["software"]
evidence:
  kind: runnable-demo
  note: "流水线取自仓库中的 Express 客服示例，运行时控制项均为 v1.14 已公开的 API。模型选择、提示词与提供方由本文自行设定；生产量级下的吞吐未在此验证。"
related:
  solutions: ["mixed-model-teams", "goal-driven-orchestration"]
  examples: ["express-customer-support", "task-pipeline"]
  integrations: ["anthropic", "openai-compatible"]
  comparisons: ["langgraph", "vercel-ai-sdk", "crewai"]
featured: false
readingMinutes: 8
---

你刚开完排期会。需求是：给 API 加上 AI 工单处理。三个 Agent——一个给工单分类，一个起草回复，一个做 QA 复核。它们按顺序执行、共享上下文，并把结构化 JSON 返回给一条 Express 路由。

你的技术栈是 TypeScript、Node.js、PostgreSQL。路由、鉴权、数据库迁移，这些你闭着眼都能写。唯一让你停下来的是编排：三次互相依赖的模型调用，每一次用不同的模型档位，每一次的输出都要先通过校验，下游才能读。

于是你开始搜。你首先会发现的事实是：那个老答案——*Agent 生态在 Python，去起一个边车服务吧*——已经不成立了。

## 2026 年搜出来的真实结果

**LangGraph** 已经不再是"只有 Python"的论据。它提供了官方的 TypeScript 包 `@langchain/langgraph`，并且已经 GA。你在 `StateGraph` 之上定义节点、边与共享状态，换来线程级检查点、人工介入以及围绕这张图的时间回溯。你要承担的是自己编写拓扑——它刻意做得很底层，这是设计取向。

**Vercel AI SDK** 是 TypeScript 原生，也是这组里最精简的。它的 Agent 原语把单个工具调用循环跑得很好。多智能体协作——依赖排序、并行分支、贯穿整次运行的共享预算——是你要在其上自己写的应用代码。这是一个设计选择，不是疏漏；只有当协作本身就是那个功能时，它才会成为问题。

**CrewAI** 只有 Python，没有官方 TypeScript 移植。**AutoGen** 同样没有 TypeScript 能力面，而且还有第二件事要掂量：微软已经把 AutoGen 与 Semantic Kernel 合并进新的 Microsoft Agent Framework，AutoGen 仍在收修复，但实际上进入了维护模式。这两者才是"再加一个 Python 服务"仍然构成真实成本的地方。

**自己手搓**是排期会上看起来最便宜的选项。先写一条 promise 链，再加重试，再加 schema 校验，再加并发上限，再加链路追踪。两周后你手上多了一个自制 Agent 框架，而不是那个功能。

所以问题已经不是 *Python 还是 TypeScript*，而是：**编排里有多少你想自己持有，以及要让它扛住生产，哪些前提必须成立？** 如果你想要一份按工作形态划分的完整候选清单，我们写过：[2026 年最佳 TypeScript 多智能体框架](/zh/blog/best-typescript-multi-agent-frameworks-2026/)。

## 一条 API 端点的清单

1. **在 Node 进程内运行。** 一次 `npm install`。同一个容器、同一套 CI、同一条部署链路、同一份日志。没有第二个运行时需要你在某个周二打补丁。
2. **Agent 之间的依赖。** 分类先跑，起草等它，QA 等前两个。框架负责解析 DAG 并把互不依赖的部分并行跑起来；你只负责声明这些边。
3. **被强制执行、而非只是请求的结构化输出。** 每个 Agent 返回带类型的 JSON，并对 schema 做校验。不是在 `try` 块里 `JSON.parse` 然后祈祷。
4. **逐 Agent 选择模型。** 分类用便宜模型，起草用中档，复核用顶配——一条流水线、一次运行、一份账单。
5. **真正兜得住的护栏。** 一道 token 上限，让失控的循环不会悄悄烧掉 50 美元。循环检测。一个接到 `AbortSignal` 的超时，并且它真的能取消在途的模型调用。

不是"50 个集成"，不是可视化图形编辑器。就是横在你与上线之间的那些东西。

## 三个 Agent，一条 Express 路由

下面这条流水线改编自 [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) 仓库里的 [Express 客服示例](/zh/examples/express-customer-support/)：

```typescript
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'
import { z } from 'zod'

// Each agent's output is a contract, enforced at runtime.
const ClassifierOutput = z.object({
  category: z.enum(['billing', 'technical', 'shipping', 'returns', 'general']),
  urgency:  z.enum(['low', 'medium', 'high', 'critical']),
})
const DrafterOutput = z.object({ draft_reply: z.string() })
const QAOutput = z.object({ qa_notes: z.string() })

// Three agents, three model tiers, one team.
const classifier: AgentConfig = {
  name: 'classifier',
  model: 'claude-haiku-4-5',
  outputSchema: ClassifierOutput,
  systemPrompt: 'Classify the support ticket by category and urgency. Respond ONLY with valid JSON.',
}
const drafter: AgentConfig = {
  name: 'drafter',
  model: 'claude-sonnet-5',
  outputSchema: DrafterOutput,
  systemPrompt: 'Write an empathetic customer-facing reply. Respond ONLY with valid JSON.',
}
const qaReviewer: AgentConfig = {
  name: 'qa-reviewer',
  model: 'claude-opus-5',
  outputSchema: QAOutput,
  systemPrompt: 'Review the draft for tone and factual consistency. Respond ONLY with valid JSON.',
}

const orchestrator = new OpenMultiAgent({ maxTokenBudget: 100_000 })
const team = orchestrator.createTeam('support', {
  name: 'support',
  agents: [classifier, drafter, qaReviewer],
  maxConcurrency: 3,
})
```

然后是你真正要写的那部分——处理函数：

```typescript
app.post('/tickets', async (req, res) => {
  const { subject, body } = req.body ?? {}
  if (typeof subject !== 'string' || typeof body !== 'string' || !subject || !body) {
    res.status(400).json({ error: 'subject and body are required strings' })
    return
  }

  const ticket = `Subject: "${subject}"\nBody: "${body}"`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60_000)

  try {
    const result = await orchestrator.runTasks(team, [
      {
        title: 'Classify ticket',
        assignee: 'classifier',
        description: `Classify this support ticket.\n\n${ticket}`,
      },
      {
        title: 'Draft reply',
        assignee: 'drafter',
        description: `Write a customer-facing reply.\n\n${ticket}`,
        dependsOn: ['Classify ticket'],
        dependencyPayload: 'structured',
      },
      {
        title: 'QA review',
        assignee: 'qa-reviewer',
        description: `Review the draft for tone, empathy, and accuracy.\n\n${ticket}`,
        dependsOn: ['Classify ticket', 'Draft reply'],
        dependencyPayload: 'structured',
      },
    ], { abortSignal: controller.signal })

    if (!result.success) {
      res.status(controller.signal.aborted ? 504 : 502).json({ error: 'Pipeline did not complete' })
      return
    }

    // `structured` is typed `unknown` on purpose. Parse once at the boundary
    // and everything downstream is typed.
    const classified = ClassifierOutput.parse(result.agentResults.get('classifier')?.structured)
    const drafted    = DrafterOutput.parse(result.agentResults.get('drafter')?.structured)
    const reviewed   = QAOutput.parse(result.agentResults.get('qa-reviewer')?.structured)

    res.json({ ...classified, ...drafted, ...reviewed })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) })
  } finally {
    clearTimeout(timer)
  }
})
```

这就是全部。依赖关系是数据——`dependsOn: ['Classify ticket']`——运行时据此解析 DAG，一旦某个任务自己的前置条件满足就立刻启动它，并对每一份输出按 schema 校验。你没有写状态机，也没有写任务队列。

有两个细节值得停一下，因为它们正是最容易被写错的地方：

**`dependencyPayload: 'structured'` 改变了下一个 Agent 读到的东西。** 默认情况下，依赖交给下游任务的是上一个 Agent 的原始叙述性输出。设为 `'structured'` 后，起草 Agent 收到的是分类 Agent *经过校验的 JSON*——类别与紧急程度都是字段；而如果该结构化值缺失或无法序列化，依赖它的任务会以一个机器可读的校验错误失败，而不是悄悄拿着叙述性文本继续跑。以散文形态交接，正是那种只在生产环境、只在措辞不寻常的那张工单上才暴露的失败模式。

**在边界处做一次解析。** `AgentRunResult.structured` 在类型系统里是 `unknown`——运行时已经校验过它，但 TypeScript 无从知道它出自哪个 schema。每个结果调用一次 `Schema.parse()`，就把类型拿了回来，同时给了你一个明确的位置，让契约被违反时能在那里暴露。

另外注意配置里*没有*的东西：`temperature`。Anthropic 当前的顶配模型（Opus 5、Sonnet 5）直接拒收采样参数，所以这里的档位来自模型选择与提示词，而不是旋钮。对仍然接受它的提供方，`temperature` 依旧是逐 Agent 的字段——而每个 Agent 都可以指向不同的提供方，包括本地的 OpenAI 兼容端点。

## 不顺利的时候会发生什么

顺利路径大约 60 行。不顺利的路径才是框架存在的理由。

**模型返回的东西不符合你的 schema。** Agent 会做校验，并在第一次失败时带着校验错误反馈重试一次。如果重试仍然失败，这次运行报告的是校验失败，而不是把一个解析了一半的对象交给你。只重试一次——不是一个为乐观情绪持续付费的无界循环。

**工单是 8000 字的长篇抱怨。** 编排器上的 `maxTokenBudget` 是运行级上限，在模型调用之间与任务派发处检查。越过上限会停止投放新工作；已经开始的工作先结算，剩余任务随后被标记为跳过。边界要说准确：单个在途的模型回合可能带你越过上限，因为检查发生在调用之间，而不是生成途中。

**起草 Agent 反复生成同一份回复。** Agent 上的 `loopDetection` 会捕捉这种重复模式。默认动作是注入一条"你似乎卡住了"的消息，再给模型一次机会；`onLoopDetected: 'terminate'` 则直接立刻停止本次运行。

**流水线跑得太久。** `AbortSignal` 会取消在途的模型调用。有一点要知道：`runTasks` 在中止时并不抛异常——它会排空、把剩余任务标记为跳过，然后以 `success: false` 正常 resolve；这正是上面那个处理函数用 `signal.aborted` 来区分超时与一般失败的原因。如果你需要在计时器触发的那一刻就回应客户端、而不是等在途调用结算完，就像仓库示例那样，把这次运行与一个超时 promise 做 race。

**你需要知道到底发生了什么。** `onProgress` 给出逐 Agent 的事件；`onTrace` 给出可以持久化到 `TraceStore` 并在离线运行查看器里渲染的 span。链路上没有托管服务。

这些都不新奇。它们只是"周二在预发布环境能跑"和"周五在生产环境还在跑"之间的差别。

## 留在进程内到底换来什么

编排是一次库调用，发生在本来就持有这个请求的进程里。任务载荷不必跨网络跳转做序列化。链路数据和你的应用日志在同一个地方，由同一个请求 ID 串起来。部署方式不变：同一个镜像、同一套 CI、同一条回滚路径。依赖足迹也保持很小——内核只有三个运行时依赖（`@anthropic-ai/sdk`、`openai`、`zod`），额外的提供方与 MCP 只在你按需启用时才加载。

诚实的代价是：你的 Node 进程现在持有 LLM 延迟与 token 开销，于是并发和预算成了这个服务自己要管的事，而不是别人那个服务的事。`maxConcurrency` 与 `maxTokenBudget` 就是为此存在的；比起再运维一个运行时，很多团队愿意做这笔交换。

## 什么时候它不是正确的选择

如果编排拓扑固定、长期运行，并且是产品的核心——而且你需要围绕它的状态历史与时间回溯调试——那就用 **LangGraph.js** 显式地编写这张图。那份掌控正是它的价值所在。

如果你只有一个 Agent，难点在界面——token 流式、工具事件、带类型的 UI 消息——那么 **Vercel AI SDK** 很出色，多半就够了。只有一个 Agent 时，多智能体编排是额外负担。（两者并不互斥：OMA 可以跑在 AI SDK 的提供方层*之上*。）

如果你想要 Agent、工作流、记忆、服务端与评测都收在同一个框架边界内，那么在自己拼装这些部件之前，先看看 **Mastra**。

还有两条属于这套方案本身的边界。检查点恢复是任务粒度的：已完成的任务在重启后可以复用，但被中断的任务会重新开始——如果你需要独立于进程的定时器与由基础设施托管的持久化执行，那就明确地去评估一个工作流运行时。以及，这是一个库，不是平台：没有可视化编辑器，没有托管控制台，也没有什么可以登录的地方。

但如果你是一支 TypeScript 团队，要给一个正在交付的产品加上协同工作的 Agent，并且希望自己的技术栈保持为一套技术栈——它就是为这种情况准备的。

---

[open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) 采用 MIT 许可、TypeScript 原生。`@open-multi-agent/core` v1.14.0 运行在 Node 20+ 上，只有三个运行时依赖：

```bash
npm install @open-multi-agent/core
```

从[快速开始](/zh/getting-started/quick-start/)入手，或者阅读[生产清单](/zh/guides/production-checklist/)了解全部控制项。
