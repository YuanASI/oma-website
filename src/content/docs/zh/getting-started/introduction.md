---
title: 简介
description: "open-multi-agent 是什么、目标优先的编排与图优先框架有何不同，以及运行时是如何组织的。"
---

`open-multi-agent` 是面向 TypeScript 后端的多智能体编排框架。给它一个目标，协调器智能体会把目标拆解成任务 DAG、并行执行相互独立的任务，并综合出一个带类型、经 schema 校验的结果。三个运行时依赖，可嵌入任意 Node.js 后端。

:::tip[让工程师描述目标，而不是流程图。]
图优先的框架要求你预先枚举每一个节点和每一条边。`open-multi-agent` 是目标优先的：你描述想要的结果，协调器在运行时构建任务 DAG，于是编排会随目标自适应，而不是为某一个目标手工接线。
:::

想直接跑起来？去看[快速开始](/zh/getting-started/quick-start/)。

## 与其它框架有何不同？

先给一个快速选型；机制拆解在后面。

| 如果你需要 | 选择 |
|-------------|------|
| 固定的生产拓扑，外加成熟的持久化 + 时间旅行生态 | LangGraph JS |
| 全栈平台，工作流手工接线 | Mastra |
| Python 技术栈，成熟的多智能体生态 | CrewAI |
| AI 应用工具包，广泛的模型提供方支持 | Vercel AI SDK |
| **TypeScript，从目标到结果、自动拆解任务** | **open-multi-agent** |

**对比 LangGraph JS。** LangGraph 把声明式的图（节点、边、条件路由）编译成一个可调用对象；OMA 运行一个协调器，在运行时把目标拆解成任务 DAG，并自动并行相互独立的任务。终点相同，方向相反：图优先 vs 目标优先。两者都支持检查点与恢复——OMA 在任意 `MemoryStore` 上对已完成任务做快照，崩溃后用 `restore()` 恢复——但 LangGraph 的持久化生态更深，所以当「对持久状态历史做时间旅行」是决定性因素时，选它。

**对比 Mastra。** 两者都是 TypeScript 原生；区别在于谁来驱动编排。用 Mastra，你手工接线工作流。OMA 是目标驱动的：给它的协调器一个目标，它在运行时构建任务 DAG，让计划随目标自适应，而不是运行一张你一步步接好的图。一次 `runTeam(team, goal)` 调用即可。

**对比 CrewAI。** CrewAI 是 Python 里成熟的多智能体选择。OMA 面向 TypeScript 后端，三个运行时依赖、直接嵌入 Node.js。编排能力大致相当；选择取决于语言栈。

**对比 Vercel AI SDK。** AI SDK 提供 LLM 调用层——提供方抽象、流式、工具调用、结构化输出。它不负责编排目标驱动的多智能体团队。两者互补：AI SDK 用于应用界面和单智能体调用，OMA 用于你需要一个团队的时候。

## 工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenMultiAgent (Orchestrator)                                  │
│                                                                 │
│  createTeam()  runTeam()  runTasks()  runAgent()  getStatus()   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │  Team               │
            │  - AgentConfig[]    │
            │  - MessageBus       │
            │  - TaskQueue        │
            │  - SharedMemory     │
            └──────────┬──────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
┌────────▼──────────┐    ┌───────────▼───────────┐
│  AgentPool        │    │  TaskQueue             │
│  - Semaphore      │    │  - dependency graph    │
│  - runParallel()  │    │  - auto unblock        │
└────────┬──────────┘    │  - cascade failure     │
         │               └───────────────────────┘
┌────────▼──────────┐
│  Agent            │
│  - run()          │    ┌────────────────────────┐
│  - prompt()       │───►│  LLMAdapter            │
│  - stream()       │    │  - 13 built-in         │
└────────┬──────────┘    │    providers           │
         │               │  - OpenAI-compatible   │
         │               │  - AI SDK bridge       │
         │               └────────────────────────┘
┌────────▼──────────┐
│  AgentRunner      │    ┌──────────────────────┐
│  - conversation   │───►│  ToolRegistry        │
│    loop           │    │  - defineTool()      │
│  - tool dispatch  │    │  - 6 built-in tools  │
└───────────────────┘    │  + delegate (opt-in) │
                         └──────────────────────┘
```

[快速开始](/zh/getting-started/quick-start/)会把这套流程端到端跑一遍；[三种运行方式](/zh/getting-started/three-ways-to-run/)讲解何时该用 `runAgent`、`runTeam` 或 `runTasks`。
