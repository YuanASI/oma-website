---
title: "并行调查一次事故，但不要把证据搅在一起"
description: "日志、部署与影响面是三条互不依赖的证据流。runTasks() 的任务图让它们同时开跑，taskResults 保留每条未经合并的结果，交到分析方手里的是校验过的结构化载荷而非散文。"
pubDate: 2026-07-31
tags: ["sre", "incident-response", "typescript"]
contentType: application
useCases: ["事故复盘", "根因分析"]
industries: ["软件运维"]
evidence:
  kind: runnable-demo
  note: "仓库示例运行在随附的事故情境上。演示的是编排与证据交接；接入真实可观测性系统需要读者自行完成。文中的调度与交接行为来自已发布的运行时 API。"
related:
  solutions: ["parallel-llm-calls"]
  examples: ["incident-postmortem-dag", "trace-observability"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph", "inngest-agentkit"]
featured: false
readingMinutes: 4
---

事故复盘常常从排队开始。一个人看日志，然后另一个人查部署记录，接着团队估算客户影响。全都做完之后，才有人开始解释到底发生了什么。

这里的等待大部分是白等的。日志、部署和影响面是三条独立的证据流，本来就可以同时查。真正必须串行的是判断——而这是调度问题，不是靠自觉能解决的问题。

## 这张图

可运行的[事故复盘 DAG 示例](/zh/examples/incident-postmortem-dag/)用了五个任务：三路调查、一个分析、一个撰写。

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Logs',
    description: '从事故日志中提取故障模式。',
    assignee: 'log-investigator',
  },
  {
    title: 'Deployments',
    description: '把事故时间窗与近期变更做关联。',
    assignee: 'deployment-investigator',
  },
  {
    title: 'Impact',
    description: '分析影响面。',
    assignee: 'impact-investigator',
  },
  {
    title: 'Root cause',
    description: '综合三路调查，形成有依据的假设。',
    assignee: 'analyst',
    dependsOn: ['Logs', 'Deployments', 'Impact'],
    dependencyPayload: 'structured',
  },
  {
    title: 'Postmortem',
    description: '把证据与假设写成最终文档。',
    assignee: 'writer',
    dependsOn: ['Root cause'],
  },
])
```

前三个没有声明依赖，所以同时启动。分析任务要等三路都完成。撰写任务要等分析落地。

执行器是事件驱动的：下游任务在**自己的**依赖被满足时立刻启动，而不是等一整批做完。`TaskQueue` 发出 `task:ready`，调度器指派这一个任务，派发闸门检查取消状态、预算状态、审批状态与 AgentPool 容量，任务完成后立即解锁其下游。某条分支先跑完，不会被另一条与它无关的分支拖住。

## 让证据始终可归属

复盘是一条证据链，不是一段漂亮的说明。如果三路调查的结论最后是以一段混合好的文字送到分析方手里，那拆成三路的意义就没了。

`dependencyPayload: 'structured'` 就是防这个的。默认情况下，直接依赖注入的是上游任务的原始 `output`——一段叙述文本，分析方得自己重读、自己归属。设成 `'structured'` 之后，注入的只有从该依赖成功的 `AgentRunResult.structured` 派生出的规范 JSON，叙述文本被排除在外。如果叙述本身也有价值，用 `'both'` 会注入带标签的原始与结构化两段。

于是分析方不需要事后猜某句话来自哪一路。它拿到的是三条校验过的记录，每条都能追回产出它的调查方。

这样分歧才有用。日志可能指向一种故障模式，而部署时间线指向另一处。调和这种张力正是分析方的工作——前提是这份张力在交接中活了下来。

## 每条分支事后都还查得到

当一个 Agent 执行了多个任务时，`agentResults` 会把它们合并。对复盘来说这是错误的索引：你要的是日志调查方那一条独立的记录，而不是它做过的所有事情揉在一起。

`taskResults` 为每个任务保留未经合并的结果，以稳定的任务 ID 为键：

```ts
const result = await orchestrator.runTasks(team, tasks)

const logTask = result.tasks?.find(task => task.title === 'Logs')
const logFindings = logTask
  ? result.taskResults?.get(logTask.id)?.structured
  : undefined
```

两套索引指向同一批执行，暴露 `taskResults` 不会把 token 用量重复计算。对一次事故复盘而言，这是「模型说了 X」和「日志调查方在任务 1 里报告了 X」之间的区别——三周后再起争议时，能站住的是后者。

## 把贵的模型用在判断上

三路调查读的是随附证据，而分析方要形成假设，这两类调用的难度并不相同。Model Routing 让它们分开计价：

```ts
const modelRouting: ModelRoutingPolicy = {
  rules: [
    { match: { agent: 'analyst' }, route: { model: 'claude-opus-4-7' } },
    { match: { phase: 'worker' }, route: { model: 'claude-haiku-4-5' } },
  ],
}

await orchestrator.runTasks(team, tasks, { modelRouting })
```

规则按数组顺序求值，第一条命中的胜出，所以更具体的规则要放在前面。没有命中任何规则的调用，仍然用它本来会用的模型。除了 `agent` 和 `phase`，规则还能匹配 `taskRole`、`taskPriority`、`leaf` 和 `hasDependencies`——后三个只会命中 worker 与 delegated 调用。

这是 Model Routing，决定的是某次调用用哪个模型。Execution Routing 是另一个决定：这个目标究竟以单 Agent 还是团队的形态运行。

## 产出物，以及它的边界

示例产出三份调查结果、一个基于它们的根因假设、一份最终复盘文档，以及运行级的耗时与用量。

它不查询任何真实的日志服务、部署平台、状态页或工单系统。情境数据随 recipe 一起提供。这让编排本身保持可检查，也把证据边界老实划了出来。

接真实系统是应用层的工作，而运行时给这些决定准备好了位置：

- 只读集成从构造上就是只读的：内置工具默认拒绝授权，一个既没声明 `tools` 也没声明 `toolPreset` 的 Agent 拿到零个内置工具。
- 呼叫 on-call、关闭事故这类工具标 `consequential: true`，`onToolCall` 会在输入校验之后、`execute` 之前逐次拦截。
- `onPlanReady` 与 `onTaskDispatch` 守着另外两条边界：在调查动到生产之前，审批整体形态，或者审批其中一个单元。
- 链路数据以尽力而为的方式脱敏检测到的敏感信息。事故日志恰恰是这个限定词最要紧的地方——字段级脱敏该在源头做，那是你的工作，不是运行时的承诺。

运行时不会做的事情是猜。高影响判定**只看工具授权**，不看目标、提示词、工具参数或模型输出。一次措辞骇人但只授权了无害工具的事故，不会被标记。

## 为什么用显式图而不是协调器

这条工作流不需要谁去发明它的拓扑。五个角色和它们的依赖关系，在事故发生之前就已经定了，所以 `runTasks()` 是更好的默认：每次都跑同样的证据分支，依赖关系在代码里可审阅，缺失的分支会阻塞综合而不是悄悄消失，互不依赖的分支照样并行。

协调器变得有意思，是在调查计划本身会随事故类型剧烈变化的时候。即便如此，`onPlanReady` 的存在意义就是让你在它拿到任何权限之前，先把提议的计划读一遍。

## 跑一遍 recipe

在框架仓库里，配好 `ANTHROPIC_API_KEY`：

```bash
npx tsx packages/core/examples/cookbook/incident-postmortem-dag.ts
```

对着随附情境检查任务记录和最终产物。然后一次只替换一条证据分支，接入你自己系统的只读集成：先 fixture，再只读源，再人工审阅产出，最后才谈更大的权限。
