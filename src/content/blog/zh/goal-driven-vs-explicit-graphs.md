---
title: "目标驱动的智能体编排 vs 显式图：一份 TypeScript 框架分类法"
description: "多数多智能体框架评测比的是功能。这篇换一个轴来比：框架把拆解的成本放在哪里。目标优先的框架在运行时用 token 付，图优先的框架在设计期用代码付。"
pubDate: 2026-06-03
tags: ["typescript","ai"]
readingMinutes: 12
---
> 多数多智能体框架评测比的是功能。这篇主张你应该先比另一个轴：框架把拆解的成本放在哪里。目标优先的框架在运行时用 token 付，图优先的框架在设计期用代码付。哪个该作为默认选择，取决于你的团队真正做的是哪类活。

如果你在 2025 年花过时间评估 TypeScript 智能体框架，多半撞上过我撞过的同一堵墙。产品页在那些「真正上线后才要紧」的轴上分不出彼此。它们都承诺「多智能体」，都摆一张智能体协作图，都贴上六七个集成的链接。但没有一个告诉你：当客户报了一个回归、你凌晨两点被叫醒时，这个框架到底会逼你写什么。

页面没说的是：谁来决定拓扑。这是每个多智能体框架的核心设计选择，而且它干净地分成两派。图优先的框架要你来决定。目标优先的框架让一个协调器智能体在运行时替你决定。两者各有对方没有的成本。

我是其中一个目标优先框架的维护者（[open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)，TypeScript 生态里对标 CrewAI 的那个），所以我的立场会写在脸上。我会尽量诚实地讲目标优先要你付出什么，因为我觉得「两种范式之间怎么选」比「哪个框架赢下功能清单」有意思得多。

## 多数对比文章的双轴问题

随便翻一篇「2026 年 TypeScript 智能体框架 Top N」清单文，你都会拿到一张功能表格：哪个框架支持流式、结构化输出、重试、可观测性、MCP、Zod schema、生命周期钩子、智能体交接，等等。每个框架都拿到一个勾或半个勾。

这张表不是没用，但它遮住了那个真正决定「半年后你在这框架上还顺不顺手」的设计选择。那个选择是：

> **谁来决定下一个跑哪个智能体，以及什么时候跑？**

两个答案：

1. **你来决定，在设计期。** 框架给你节点、边、条件这些原语，你来接线。执行路径就是你代码写成什么样。
2. **协调器来决定，在运行时。** 你声明智能体和目标，框架跑一次 LLM 调用规划出一张任务 DAG，然后执行它。

分别叫它们**图优先**和**目标优先**。它们不是功能集，而是范式——成本形态不同、失效模式不同、各自的最佳适用场景也不同。

这篇就是那份分类法。下面会内联出现同一个双智能体任务，分别用四个 TypeScript 框架（LangGraph.js、Mastra workflows、KaibanJS、open-multi-agent）实现，让你能逐个读它们的 API 表面、自己判断。

## 「图优先」和「目标优先」到底指什么

### 图优先

你自己声明拓扑。节点是智能体（或步骤）。边声明执行顺序或条件。编译出来的对象是一个确定性的状态机。框架执行它，不改它。

代表例子：

- **LangGraph.js**：`StateGraph` 配上显式的 `Annotation.Root` schema，每个智能体一个 `addNode`，转移用 `addEdge`，路由用 `addConditionalEdges`。你编译这张图再调用它。
- **Mastra workflows**：`createWorkflow` 带类型化的 `inputSchema` 和 `outputSchema`，每个阶段一个 `createStep`，用 `.then()` 串起来。一个架在类型化步骤之上的线性图 DSL。

### 目标优先

你声明智能体（角色、模型、系统提示）。你交给编排器一句话级别的目标。运行时，一个协调器智能体（一次你不必写的 LLM 调用）把目标拆解成任务 DAG，把任务分派给各智能体，按依赖顺序跑它们，再综合出最终答案。

代表例子：

- **CrewAI**（Python）：原型。对一组智能体加任务调 `Crew.kickoff()`。CrewAI 用 role/goal/backstory 的隐喻来给智能体行为定调。
- **open-multi-agent**：`OpenMultiAgent` 编排器加上 `runTeam(team, goal)`。协调器模式落在 [`src/orchestrator/orchestrator.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/src/orchestrator/orchestrator.ts)（`runTeam` 方法）里，并在 JSDoc 里内联描述，分六步：拆解、入队、调度、并行执行、持久化结果、综合。

### KaibanJS 怎么算

KaibanJS 处在两者之间。你定义带显式依赖的 `Agent` 和 `Task` 对象（按约定，writer 的任务描述会引用 researcher 的输出），然后框架的看板把任务在各列之间挪动。拓扑大体上在你的任务清单里是显式的，但驱动执行的那个状态机藏在看板抽象内部。把它叫**混合**。实践中更靠近图优先而非目标优先。

## 四向并排：同一个任务在四个框架里

这个任务故意做得很小：一个 `researcher` 智能体就某个主题汇集一份简报，一个 `writer` 智能体把简报变成一段 400 词的摘要。writer 依赖 researcher。下面的片段是每份实现里相关的核心部分，写出来是为了把 API 表面并排展示，而不是一个打包好可直接跑的项目。

### LangGraph.js

```ts
const State = Annotation.Root({
  topic:   Annotation<string>,
  brief:   Annotation<string>,
  summary: Annotation<string>,
})

async function researcher(state: typeof State.State) {
  const res = await model.invoke([
    { role: 'system', content: '...' },
    { role: 'user',   content: `Topic: ${state.topic}` },
  ])
  return { brief: String(res.content) }
}

async function writer(state: typeof State.State) {
  const res = await model.invoke([
    { role: 'system', content: '...' },
    { role: 'user',   content: `Brief:\n${state.brief}` },
  ])
  return { summary: String(res.content) }
}

const graph = new StateGraph(State)
  .addNode('researcher', researcher)
  .addNode('writer',     writer)
  .addEdge('__start__',  'researcher')
  .addEdge('researcher', 'writer')
  .addEdge('writer',     '__end__')
  .compile()

const result = await graph.invoke({ topic: '...' })
```

代码里你看到的：一个状态 schema、两个节点函数、三条边、一次编译加调用。researcher 和 writer 之间的依赖就是那条边 `addEdge('researcher', 'writer')`。writer 读 `state.brief`，是因为 researcher 写了它。

### Mastra workflows

```ts
const researchStep = createStep({
  id: 'research',
  inputSchema:  z.object({ topic: z.string() }),
  outputSchema: z.object({ brief: z.string() }),
  execute: async ({ inputData }) => ({ brief: await callLLM(inputData.topic) }),
})

const writeStep = createStep({
  id: 'write',
  inputSchema:  z.object({ brief: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ inputData }) => ({ summary: await callLLM(inputData.brief) }),
})

const wf = createWorkflow({ id: 'r+w', inputSchema: ..., outputSchema: ... })
  .then(researchStep)
  .then(writeStep)
  .commit()
```

你看到的：Zod 类型化的步骤，一条 `.then()` 链。research 和 write 之间的依赖靠的是链里的位置。在这个复杂度上，Mastra workflows 暴露的类型比 LangGraph 多，用图的通用性换来线性 DSL 的清晰。

### KaibanJS

```ts
const researchTask = new Task({
  description: 'Research the topic {topic} and produce a brief.',
  agent: researcher,
})
const writeTask = new Task({
  description: 'Using the brief produced previously, write a 400-word summary.',
  agent: writer,
})

const team = new Team({
  name: 'Research and Write',
  agents: [researcher, writer],
  tasks: [researchTask, writeTask],
  inputs: { topic: '...' },
})

await team.start()
```

你看到的：智能体和任务被声明出来，依赖隐含在任务顺序和散文式引用里。看板状态机在幕后驱动执行。

### open-multi-agent

```ts
const orchestrator = new OpenMultiAgent({ defaultModel: 'claude-sonnet-4-6', defaultProvider: 'anthropic' })

const team = orchestrator.createTeam('research-and-write', {
  name: 'research-and-write',
  agents: [researcher, writer],   // researcher + writer AgentConfig
  sharedMemory: true,
})

const goal = 'Research "Multi-agent orchestration tradeoffs in TypeScript" and write a 400-word summary.'
const result = await orchestrator.runTeam(team, goal)
```

你看到的：智能体被声明出来，一句目标，一次调用。在一个复杂到确实需要它的目标上，`runTeam()` 能替你做的，是一趟协调器规划：把目标拆解成一张 DAG（这里是一个 `researcher → writer` 依赖），按顺序跑这些任务，再综合出最终摘要。一个诚实的提醒，下面成本一节会展开：这个具体目标简单到 OMA 会走短路、完全跳过协调器，直接派给单个智能体。

## 成本到底落在哪里

这四个片段看起来像一场「行数越少越好」的比拼。它们不是。

**图优先的框架让你在代码里、在设计期、在你的文件里付拆解的成本。** 你写状态 schema，你写边，你决定路由。这成本是可见的、纳入版本控制的、可 diff 的、稳定的：这张图周二的行为和周一一样，因为它没有任何东西变过。

**目标优先的框架让你在运行时、用 token、在一次协调器 LLM 调用里付拆解的成本。** 这成本在你的源码里不可见，但在你的账单和 trace 里可见。一次非平凡的 `runTeam()` 调用，会先花一个协调器回合规划 DAG，再花一个综合回合合并结果，然后你的智能体才开始干真正的活。多出来的这两个回合就是开销：在一个小活上占比很重，随着真正的工作变大而缩到接近噪声。简单目标会通过下面讲的短路完全跳过它。

图优先的模型更可预测。目标优先的模型更压缩：行数更少，是因为工作被挪到了一个你看不见的地方。两者都不免费。

这正是多数对比略过的部分。选框架不是选一个功能集。是选你想让拓扑成本落在哪里：落在你的仓库里，还是落在你的 API 账单里。

## 哪种范式配你的活

**当工作的形状是固定的，选图优先。** 一条对每条记录都跑同样五步的流水线，值得当成一张显式图写一次；目标优先只会每次运行都重新发现那张 DAG，再为它向你收一个协调器回合的钱。同理，当你需要审计轨迹时（合规、法务、医疗、金融）——「协调器这次运行决定跳过第 4 步」不是个能交代过去的答案，而一条从节点 3 到节点 5 的显式边才是。再同理，而且加倍，当问题本就是个真正的状态机时：循环、会改状态的重试、跨长暂停的中断与恢复；LangGraph.js 在这块是最成熟的选项。还有一个最常见、技术性最低的理由：如果你的资深工程师还不信任一个 LLM 来做路由决策，那就先用图优先把它建出来，挣到那份信任，再把决策权交出去。

**当工作的形状会变，选目标优先。** 「总结这份 3 页合同」和「总结这份 80 页的主服务协议」想要的是不同的子任务；硬编出一张最大的图、再用条件分支去管它，做得到但很丑，而一个协调器能自然地处理。在你还在摸索怎么拆解的阶段，它也是更快的范式，因为改一句话级别的目标，胜过在每次用户对话后重画一张图。一旦你手上有了好几个能力相近的智能体，让协调器在它们之间路由，胜过把一个软性的「谁干什么」决策硬编成一条条边。而且，如果你产品的价值在于它能随用户的目标自适应、而非跑一个固定的自动化，那你会想要那个规划表面是可见的，而不是埋进一套图 DSL 里。

## 协调器：目标优先里框架替你写的那部分

从外面描述时，目标优先听着像魔法。从里面看，戏法很平淡：它就是一次提示写得好的 LLM 调用。

在 open-multi-agent 里调 `runTeam(team, goal)` 时，编排器在 `runTeam` 方法里做这些事（完整源码在 [`src/orchestrator/orchestrator.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/src/orchestrator/orchestrator.ts)，见该方法上的 JSDoc）：

1. 一个临时的协调器智能体收到目标，以及团队里各智能体的清单——含它们的名字、模型和系统提示。
2. 协调器被要求输出一个 JSON 任务数组。每个任务有标题、描述、负责人（智能体名字之一），以及一个可选的 `dependsOn` 字段，列出哪些更早的任务必须先完成。
3. 基于标题的依赖标记被解析成任务 ID，整个数组被装进一个 `TaskQueue`。
4. 一个调度器把就绪的任务分给指定的智能体。队列的拓扑依赖求解（`src/task/queue.ts`）算出哪些任务是没被阻塞的。
5. 相互独立的任务并行跑，上限是 `maxConcurrency`。每个任务完成后结果被写进共享内存，于是下游任务能读到它们。
6. 所有任务完成后，协调器再跑一次，从收集到的输出里综合出最终答案。
7. 返回一个 `TeamRunResult`，带每个智能体的 token 用量和一个总量。

这里有一个短路：如果目标很短、且不含任何多步信号，编排器就跳过协调器，把目标直接派给最匹配的智能体。这能让琐碎的目标不必交那笔规划税。

这成本是真金白银的，而且这里的例子有一个值得知道的锋利边角。上面 OMA 例子里那个双智能体目标简单到会触发短路：协调器从不运行，目标被直接派给单个智能体，对这个目标来说税是零。只有当一个目标真的是多步的，你才付那笔规划加综合的开销；而一旦你付了，它在小活上占比很重、在大活上无足轻重。别信任何一个通用的数字：从 `result.totalTokenUsage` 测你自己的负载，因为这个比例完全取决于你真正的智能体工作相对那两个协调器回合有多大。

## 目标优先输在哪

现在上诚实的反砝码：目标优先在哪些地方是更弱的选择。

最清楚的成本是 token。只要一个目标复杂到协调器要跑，你就得在真正的智能体工作之上，再为那个规划回合加一个综合回合付钱。把协调器放到一个便宜的模型上能缓和它，但消不掉。还有一个随团队规模增长的、更微妙的成本：每个有依赖的任务都把上游结果作为上下文往下带，于是智能体要花 token 反复读它们没产出过的状态。Ken W Alger 给它起了个贴切的名字，叫[「散文税」（Prose Tax）](https://dev.to/kenwalger/comment/38e55)；它正是「在智能体之间传显式、类型化的结果，而非自由格式的散文」这一主张的论据。

接着是控制流。一张扁平的 DAG 是天然的单位，所以任何真正算状态机的东西（循环、改状态的重试、跨长暂停的中断与恢复、深层嵌套的条件）都能掰着塞进去，但不该这么做。如果你的问题是个状态机，别假装它是张 DAG。

调试也更不可预测。协调器在两次运行之间可能挑一个略有不同的拆解，从而改变输出的形状。低温、钉死的提示，以及通过 `onPlanReady` 钩子审一遍计划，都有帮助，但没有一个能像读一张你自己写的图文件那样确定。

还有社会证明。图优先的框架已经在 LinkedIn、Klarna 和摩根大通上线；目标优先在那个量级的生产环境里更年轻，所以在今天的董事会级评审里更难推。要看一个 LLM 驱动的路由系统撞上这些墙、以及工程上如何回应的有据案例，见 [Mastra 从 network 到 supervisor 的那一年](/zh/blog/multi-agent-framework-walls/)，全程顺着它自己的 issue tracker 追下来。

## Human-in-the-loop：通往生产的桥，已经造好

从「把目标优先当快速原型范式」到「把目标优先当生产范式」，这条路要穿过 human-in-the-loop，而在 open-multi-agent 里这条路已经铺好。两个原语，都已交付，让你能在计划和它的执行之间塞进一个人：`onPlanReady` 钩子（一个回调，收到协调器的任务清单，在任何东西运行之前返回批准或拒绝），以及 PlanOnly 模式（`runTeam(team, goal, { planOnly: true })`，返回计划但不执行，让你先检视或编辑它）。

这一步把目标优先带进了图优先从第一天起就有的那套审计叙事：规划仍是 LLM 驱动的，但被执行的计划是人批准过的。你既拿到目标优先的好处（拓扑不是你自己写的），又拿到图优先的保证（有个人签了字）。

正是这块把目标优先从一个原型期的便利，变成一个你能在生产评审里站得住脚的东西。人体工学还会继续改进，但承重的那些原语今天就能用。

## 决策量表

把这当起点，别当圣旨：

| 信号 | 偏图优先 | 偏目标优先 |
|--------|------------------|-----------------|
| 流水线形状随输入而变 | 弱 | 强 |
| 需要审计轨迹 | 强 | 弱 |
| 在给一个新产品做原型 | 弱 | 强 |
| 团队不熟悉 LLM 规划 | 强 | 弱 |
| 3 个以上技能重叠的智能体 | 弱 | 强 |
| 需要循环或中断 | 强 | 弱 |
| 目标用用户语言表达 | 弱 | 强 |
| 每次运行的 token 成本是瓶颈 | 强 | 弱 |

如果你的信号分裂了，第一版用图优先建。当你说不准钟摆往哪边晃时，图优先是更安全的起点。等你学到足够多、信得过那套规划了，随时可以换成目标优先。反向迁移更难，因为你得把那套你从没写下来过的显式拓扑给重新发明出来。

## 我会先建什么

如果你今天要起一个新的 TypeScript 智能体项目、还没选框架，我会建议这个顺序：

1. 头三周用 **Mastra workflows** 走图优先建。它现在是最干净的 TypeScript 图 DSL，用最小的表面积就能让你跑起来。
2. 当你发现自己大部分时间花在改图、而不是改智能体提示上时，那就是「你的任务形状在变」的信号。把同一个任务用一句目标在 **open-multi-agent** 里试一遍，看看协调器规划出的计划，和你本会手写的那张是否吻合。
3. 如果协调器的计划一直很好，把你的原型切到目标优先。如果它一直跑偏，那你就在图优先的地界里，而你刚给自己省下了一段六个月的弯路。

这些没一个是可证明为对的；它是我会跟朋友说的话。这些框架不是敌人，而「哪种范式配你的活」比「哪个赢下功能清单」更要紧。先选范式，框架的选择大体就跟着定了。

---

**关于 open-multi-agent。** TypeScript 原生的多智能体编排框架，MIT 许可。设计上目标优先，带一个协调器模式，在运行时把一句话级别的目标拆解成一张并行任务 DAG。三个运行时依赖（`@anthropic-ai/sdk`、`openai`、`zod`）。TypeScript 生态里对标 CrewAI 的 role/goal/crew 模式的那个答案。

仓库：<https://github.com/open-multi-agent/open-multi-agent>。协调器实现：[`src/orchestrator/orchestrator.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/src/orchestrator/orchestrator.ts)。

**相关文章。**

- [多智能体框架会撞上的 5 堵墙](/zh/blog/multi-agent-framework-walls/)：这份分类法的实证伴篇。一个 TypeScript 框架历时一年、从 LLM 驱动的路由迁到 supervisor 树，全程顺着它的 issue tracker 追下来，就是目标优先 / 图优先这道分野背后的生产证据。
