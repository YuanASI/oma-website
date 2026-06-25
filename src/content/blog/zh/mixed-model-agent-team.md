---
title: "如何用 TypeScript 跑一支混合模型的 AI 智能体团队？"
description: "一篇实操走查：从单模型团队基线，到带实时成本与延迟监控的多供应商生产配置，用的是 open-multi-agent——TypeScript 生态里对标 CrewAI 的那个答案。"
pubDate: 2026-05-16
tags: ["typescript","agents","ai","opensource"]
readingMinutes: 16
---
> 一篇实操走查，带你从单模型团队基线走到带实时成本与延迟监控的多供应商生产配置，用的是 [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)——TypeScript 生态里对标 CrewAI 的那个答案。

如果你给一个跑在单一前沿模型上的多智能体系统估过价，你已经知道那个坑。你接好三个智能体——规划、构建、评审——在不算激进的频次下（每天 100 次运行），月账单就能冲到几百美元，到生产量级更是过四位数，因为架构师、开发者、评审员全在烧 Opus 的 token，就为了吵一个一行的 bug。

多数 TypeScript 智能体框架默认一个供应商、一个模型。你能换模型，但只能全局换。这一个旋钮把成本与质量的取舍弄得比它本该有的更难。前沿模型只在团队一小部分回合里是对的选择，其余都是浪费的开销。

这篇展示另一种做法。三个智能体、三个不同的模型档位、一次 `runTeam()` 调用。架构师上 Claude Opus 4.7，开发者上一个更便宜的托管版 OpenAI 模型，评审员上一个通过 Ollama 跑的本地模型。这套组合在 `AgentConfig` 里按智能体逐个配置，没有供应商锁定，没有胶水代码。读完你会得到：

- 一个把现有 OMA 示例（多模型团队、本地模型、成本分档执行）组合起来的具体办法。
- 一本成本台账，靠单个 `onProgress` 回调就能算出每个智能体的美元数字。
- 一张这里用到的各供应商当前价目表，快照截至 2026-05-16，让你在投入之前先做个粗略的月度估算。
- 一份关于混合模型团队代价的诚实清单（因为它们确实有代价）。

这篇连接的仓库示例有：

- [`examples/basics/multi-model-team.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/multi-model-team.ts)：每个智能体用不同的托管模型。
- [`examples/providers/ollama.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/ollama.ts)：Claude 加一个本地 Ollama 评审员，走 OpenAI 兼容的 `baseURL`。
- [`examples/patterns/cost-tiered-pipeline.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts)：跨模型档位的 token 用量与成本对比。
- [`examples/providers/gemini.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/gemini.ts)：同一供应商内部的 Pro/Flash 分档。

这篇没有单独的配套仓库。重点是这个模式本身：按智能体分配模型，本来就是 `AgentConfig` 上的一等字段。

## 这里的「混合模型」到底指什么

开始前先做几个定义，因为这个词被用滥了。

**单模型团队。** 每个智能体跑同一个供应商、同一个模型。最好推理、最好调试，当模型是前沿模型时最贵。

**多供应商团队。** 不同智能体跑不同供应商，但每个智能体的模型仍是在设计期、而非运行时选定的。这就是本文说的「混合模型」。

**动态模型路由。** 框架基于成本、延迟或质量信号，逐回合决定用哪个模型。强大，但加了一层间接、也加了一种新的失效模式。不在本文范围。静态的按智能体分配，能用 5% 的复杂度拿到 80% 的价值。

我们依赖的框架原语是 `AgentConfig`。open-multi-agent 的 `AgentConfig` 在每个智能体上携带 `provider`、`model`、`baseURL` 和 `apiKey`。编排器会惰性地实例化对应的 LLM 适配器（Anthropic、OpenAI、Gemini、Grok、Bedrock、Copilot，以及通过 `baseURL` 接入的 OpenAI 兼容本地服务），所以你只装你真正用到的 SDK。

## 四块拼图，按顺序

OMA 仓库已经备好了这些积木。按这个顺序读；每一块都隔离出混合模型模式里的不同部分。

### 第一步：全 Opus 基线（成本天花板）

```ts
import { OpenMultiAgent } from '@open-multi-agent/core'
import type { AgentConfig } from '@open-multi-agent/core'

const architect: AgentConfig = {
  name: 'architect',
  provider: 'anthropic',
  model: 'claude-opus-4-7',
  systemPrompt: 'You are a senior software architect...',
  temperature: 0.2,
}
const developer: AgentConfig = { ...architect, name: 'developer', systemPrompt: '...' }
const reviewer:  AgentConfig = { ...architect, name: 'reviewer',  systemPrompt: '...' }

const orchestrator = new OpenMultiAgent({
  defaultModel: 'claude-opus-4-7',
  defaultProvider: 'anthropic',
})

const team = orchestrator.createTeam('design-build-review', {
  name: 'design-build-review',
  agents: [architect, developer, reviewer],
  sharedMemory: true,
})

const result = await orchestrator.runTeam(team, 'Implement retryWithBackoff<T>...')
console.log(result.totalTokenUsage)
```

这就是整支团队。三个智能体、一个模型、一个编排器。`runTeam()` 启动的那个协调器会把目标拆解成任务、把每个任务分派给某个智能体、用感知依赖的并行来跑它们，并返回一个 `TeamRunResult`——`agentResults` 里有每个智能体的 token 用量，`totalTokenUsage` 里有总量。

我们拿它当成本天花板。后面的一切都拿这条基线来衡量。

### 第二步：双模型（Opus 做规划，OpenAI 做执行）

架构师的活，是把目标看一遍，决定做什么、跳过什么，再排出一套 API 形状。它被调用得很少，但每次调用都是高杠杆。Opus 适合干这个。

开发者和评审员在更小的提示上反复触发很多次。评审员尤其大多在跑简短的检查清单。在这些上花 Opus 的 token 是浪费。一个 mini 档的 OpenAI 模型——比如截至 2026-05-16 输入 $0.75、输出 $4.50 每百万 token 的 GPT-5.4 mini——在输出侧大约比 Opus 便宜 5.5 倍。简单回合上的那点质量差你扛得住。

```ts
const architect: AgentConfig = {
  name: 'architect',
  provider: 'anthropic',
  model: 'claude-opus-4-7',
  systemPrompt: '...',
}
const developer: AgentConfig = {
  name: 'developer',
  provider: 'openai',
  model: 'gpt-5.4-mini',
  systemPrompt: '...',
}
const reviewer: AgentConfig = {
  name: 'reviewer',
  provider: 'openai',
  model: 'gpt-5.4-mini',
  systemPrompt: '...',
}
```

一样的 `createTeam()`、一样的 `runTeam()`。变的只是三个智能体里两个的 `provider` 和 `model`。适配器切换由编排器内部处理；你在团队配置里一行供应商相关的代码都不用写。

### 第三步：三模型，配一个本地评审员

现在我们把评审员推到一个本地模型上。理由和第二步一样，只是推得更狠：评审员做风格检查、边界情形提示、短平快的 QA。一个本地 Ollama 模型对这些往往已经够用，而边际云成本是零。

诀窍在于 Ollama 暴露了一个 OpenAI 兼容端点，所以你复用 `openai` 适配器，在智能体上覆盖 `baseURL` 和 `apiKey`：

```ts
const reviewer: AgentConfig = {
  name: 'reviewer',
  provider: 'openai',
  model: 'llama3.1',
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  systemPrompt: '...',
}
```

一个会绊到人的坑：即便本地服务忽略这个 key，OpenAI SDK 仍会校验它非空。随便传个占位符就行，`'ollama'` 能用。

这一步的前置条件：先 `ollama pull llama3.1` 一次，再在另一个终端里 `ollama serve`。把 `llama3.1` 换成 Gemma、Qwen，或你真正在用的任何本地模型。同样的配置在 vLLM、LM Studio、llama-server 或任何 OpenAI 兼容推理服务上都成立。

### 第四步：实时成本与延迟监控

混合模型团队现在功能上已经完整。问题是你还不知道它要花多少钱。在生产里，当某个智能体在 Opus 上热循环、一个下午烧掉 $50 时，你想尽快发现。

open-multi-agent 的 `OrchestratorConfig` 接受一个 `onProgress` 回调，它会在 `agent_start`、`agent_complete`、`task_start`、`task_complete`、`error` 以及另外几种事件上触发。我们用 start 和 complete 事件来搭一本按智能体记的台账。

```ts
const ledger = new Map<string, { startedAt: number; finishedAt?: number; model: string }>()
const modelForAgent = (agent: string) =>
  [architect, developer, reviewer].find(a => a.name === agent)?.model ??
  (agent === 'coordinator' ? 'claude-opus-4-7' : 'unknown')

const orchestrator = new OpenMultiAgent({
  defaultModel: 'claude-opus-4-7',
  defaultProvider: 'anthropic',
  onProgress: (event) => {
    if (event.type === 'agent_start' && event.agent) {
      ledger.set(event.agent, { startedAt: Date.now(), model: modelForAgent(event.agent) })
    }
    if (event.type === 'agent_complete' && event.agent) {
      const entry = ledger.get(event.agent)
      if (entry) entry.finishedAt = Date.now()
    }
  },
})
```

`runTeam()` 跑完后，你遍历 `result.agentResults`，取出每个智能体的 `tokenUsage`，查它那个模型的每百万定价，算出一个美元数字。成本分档示例用的同一套台账模式，会产出类似这样的输出（这是有代表性的形态；想看带实测数字的真实记录运行，见本文末尾附近的 **Update 2026-05-22** 一节）：

```plaintext
agent       | model              | latency  | tokens in/out  | cost
------------+--------------------+----------+----------------+--------
coordinator | claude-opus-4-7    |    3.4s  |   1102/   612  | $0.0208
architect   | claude-opus-4-7    |    6.1s  |   1580/  1140  | $0.0364
developer   | gpt-5.4-mini       |    8.7s  |   2240/  2106  | $0.0112
reviewer    | llama3.1           |   12.0s  |   2680/   480  | $0.0000

Grand total: $0.0684 USD
```

评审员是表里最慢的智能体，因为消费级机器上的本地模型通常比托管的前沿模型慢。这就是本地成本取舍的具体写照：边际云开销是零，墙钟时间更多。这一笔划不划算，取决于你的团队是阻塞着等评审员，还是异步地跑它。

## 价目快照（2026-05-16）

这些是本文示例与估算用到的数字。它们也是你在把一支混合模型团队推上生产之前，做任何成本粗算时想要的数字。投入到某个估算之前，先去官方页面核对一遍。

| Model | Input ($/1M) | Output ($/1M) | Source |
|-------|--------------|---------------|--------|
| Claude Opus 4.7 | $5.00 | $25.00 | [platform.claude.com](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Sonnet 4.6 | $3.00 | $15.00 | same |
| Claude Haiku 4.5 | $1.00 | $5.00 | same |
| GPT-5.5 | $5.00 | $30.00 | [openai.com/api/pricing](https://openai.com/api/pricing/) |
| GPT-5.4 | $2.50 | $15.00 | same |
| GPT-5.4 mini | $0.75 | $4.50 | same |
| Gemini 2.5 Flash | $0.30 | $2.50 | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Local model via Ollama | $0 marginal | $0 marginal | electricity + amortized hardware |

对这张表一个合理的初步读法：云上的前沿模型在输出侧的收费，是输入侧的 4 到 8 倍。这正是你该照着去设计的那个倒挂。把输入重的智能体（研究、摘要、检索落地）推到更便宜的模型上，把贵的模型留给那些产出大量高风险输出的智能体。

## 一个周期性负载上的成本对比实算

假设你的团队把同一个三智能体任务每天跑 100 次（对一个由入站 webhook 触发、定时批处理、或按客户跑的流水线来说，这是现实中的频次）。一次有代表性的运行大致用：

- 协调器（Coordinator）：1.1K 输入、0.6K 输出 token（所有变体里都是 Opus 4.7）
- 架构师（Architect）：1.6K 输入、1.1K 输出
- 开发者（Developer）：2.2K 输入、2.1K 输出
- 评审员（Reviewer）：2.7K 输入、0.5K 输出

把这当成一个有代表性的形态，不是一个基准。你的数字会不一样；下面的算法展示怎么算。想测你自己的负载，从 [`examples/patterns/cost-tiered-pipeline.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts) 起步。

**全 Opus 运行（第一步基线）** 在上面那个 token 形态下，每次执行大约 $0.15。按每天 100 次算，大约 $450/月。

**双模型（第二步）：协调器 + 架构师用 Opus，开发者 + 评审员用 GPT-5.4 mini。** 每次运行约 $0.073，大约 $219/月。

**三模型（第三步）：协调器 + 架构师用 Opus，开发者用 GPT-5.4 mini，评审员用本地 Ollama 模型。** 云侧每次运行约 $0.068，大约 $205/月，外加这个本地模型在一台你本就拥有的机器上的墙钟开销。

在这个 token 形态下，对全 Opus 基线大约能省下五成出头的月成本，而质量下降被控制在低风险的角色上。这个省钱形态会随负载变：研究重、摘要重或检索落地型的团队，把输入重的角色推到便宜模型上能省得更多；推理重的团队省得更少，甚至根本不该混。

## 什么时候混合模型是错的选择

如果这篇只会叫你「永远要混」，那它就没用了。这里是一份关于「什么时候别混」的诚实清单。

**单智能体任务。** 如果你的目标小到一个智能体就能搞定，别为了混模型而拆成一支团队。协调器开销和智能体间的上下文倒腾，会把那点省下的钱吃个精光。

**高一致性任务。** 不同供应商的模型在边界情形上各执一词。如果你的输出要对着一套严格的评分标准来打分（法务评审、医疗分诊、任何带有面向监管者审计轨迹的东西），混供应商带来的方差会咬你一口。老老实实待在一个模型上，把这份钱付了。

**和人类评审员的紧反馈循环。** 当你还在迭代提示、团队行为还不稳定时，混模型会加进一个你并不想要的自由度。先让团队在单个模型上收敛，等每个角色的提示稳定了，再把一块块推到更便宜的模型上。

**便宜模型配便宜输出。** 如果你团队里每个智能体本来就能塞进一次 Haiku 或 GPT-5.4 mini 运行，那混模型省下的绝对金额是几分钱，而运维复杂度是实打实的。混合模型只有在至少一个角色的月成本大到足以抵掉那份方差时，才划得来。

**还没就位的供应商失败处理。** 一支混合模型团队比单模型团队有更多失败面。三个供应商意味着三道限流上限、三套鉴权流程、三种延迟画像，以及三种你的流水线会卡在 503 上的方式。在上线之前，先把你的重试、回退和熔断策略定下来。

## 那个 cookbook 示例在混合模型形态下长什么样

open-multi-agent 自带一个 [个性化面试模拟器 cookbook](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/cookbook/personalized-interview-simulator.ts)，它在 Claude Sonnet 4.6 上跑三个智能体：一个面试官、一个观察员、一个报告员。它和混合模型模式是一对好搭档。

面试官跨很多回合做深入的、针对候选人的提问生成。这个角色配得上 Opus。

观察员在每一回合后读一遍记录，写 3 到 6 条简短的标记。这个角色输出短、可重复、结构上简单。把它推到一个更便宜的托管模型、甚至一个本地模型上。

报告员在会话结束时跑一次，对着一个严格的 Zod schema（`recommendation: 'strong-hire' | 'hire' | ...`，外加结构化数组）。结构化输出型的智能体，对底层模型的 JSON 遵循度很敏感。把它留在一个前沿模型上。

这次迁移就是两处 `provider` 和 `model` 的改动、两个 `AgentConfig` 块。你不碰编排逻辑，不重构提示。你读一遍 schema，决定一致性要求实际上落在哪里。

## 为什么这件事发生在 TypeScript 生态里

关于定位说一句，因为这是我被问得最多的问题。

CrewAI 立起了本文所依赖的那种「智能体团队」形态：一个智能体有一个角色，智能体组成团队（crew），一个团队有一个目标，框架把目标编排成工作。CrewAI 只支持 Python，而同一模式的 TypeScript 选项直到最近都很单薄。open-multi-agent 把 TypeScript 生态当成一等目标：100% TypeScript 运行时，三个运行时依赖（`@anthropic-ai/sdk`、`openai`、`zod`），以及你从 CrewAI 的 `Crew.kickoff()` 那里能得到的同一套「目标 → 结果」一次调用表面（`runTeam`）。混合模型团队在设计上就是一个一等模式，而不是一个你自己写的定制适配器。

如果你从 CrewAI 过来，想在 TypeScript 里找那套「角色团队」模型，上面的示例就是你的迁移目标。

## Update 2026-05-22：真实运行数据 + 思考模式成本

原文（2026-05-16）用 Anthropic + OpenAI 当标准示例，因为那是多数 TypeScript 读者会认得的配置。发布之后，我用 **DeepSeek + 一个本地 Qwen 模型** 在一台 M1 16GB 的 MacBook 上跑了同一条 `runTeam` 形态的流水线，因为那是我手头有的 API 凭证。同一条代码路径，不同的供应商/模型字符串。这正是本文「模型无关」那一点，诚实地套用到我自己的约束上。

这一节补上（1）实际记录的台账，让任何想复现的人能从实测数据出发；（2）一个用两个 Qwen 3.5 9B 变体做的思考模式成本旁支实验；以及（3）OMA + OpenAI 兼容这条路径对思考模式模型的一个已知局限。

### 真实运行的配置

- coordinator / 默认：DeepSeek `deepseek-chat`（非思考，$0.14 / $0.28 每 MTok）
- architect：DeepSeek `deepseek-reasoner`（思考模式，同样定价）
- developer：DeepSeek `deepseek-chat`
- reviewer：Ollama `qwen3:8b`（本地，经 Ollama 的 OpenAI 兼容端点接入）
- DAG：`runTasks(team, tasks)`，带显式的逐任务 `assignee`（见下文「为什么用 `runTasks`」）
- 硬件：MacBook M1，16GB 统一内存，Ollama 0.20.2

### 台账 1：真实运行

```plaintext
agent       | model              | latency  | tokens in/out  | cost
------------+--------------------+----------+----------------+--------
architect   | deepseek-reasoner  |    25.3s |   1612/  2450  | $0.0009
developer   | deepseek-chat      |    68.1s | 108219/ 10408  | $0.0181
reviewer    | qwen3:8b           |   208.5s |   1432/   696  | $0 (local)

Grand total: $0.0190 USD
Wall total : 5:03
```

每次运行成本是 $0.0190。按每天 100 次算，大约 $57/月，对的是原文里全 Opus 基线的 $450/月。这个形态和文里那个「省 40-70%」的说法不一样，因为 DeepSeek 的价格地板远低于原例用的 OpenAI mini 档。用哪套定价，看哪套对得上你的技术栈。

### 混合云 + 本地时，为什么选 `runTasks` 而非 `runTeam(goal)`

我在切换之前试了三次 `runTeam(goal)`。两个值得记下的失败，因为任何想把某个角色钉到本地推理上的人都会撞上：

1. **短目标（不到 200 字符，没有复杂度关键词）。** OMA v1.1.0 引入了「Skip Coordinator for Simple Goals」——当 `isSimpleGoal(goal)` 返回 true 时，协调器完全跳过 DAG 拆解，把整个目标路由给最匹配的那个智能体。评审员从没被调用过。

2. **确实触发了协调器的多步目标。** 协调器生成了一张 DAG，但把评审工作折进了开发者的任务里，而没有派给评审员智能体。哪怕往目标文本里加上「评审员智能体必须独立审计」，也没能撬动这个分派——协调器的路由决策压过了目标文本里的提示。

对于混合云 + 本地的流水线，当你有意把一个角色钉到本地推理上时，这一点很要紧：一个把你的本地智能体优化掉的协调器，会同时让你赔上架构意图和那笔省下的成本。`runTasks(team, tasks)` 才是那条能保证按智能体分派、带编译期 `assignee` 类型的路：

```ts
await orchestrator.runTasks(team, [
  { title: 'design-api', assignee: 'architect', description: '...' },
  { title: 'implement',  assignee: 'developer', description: '...', dependsOn: ['design-api'] },
  { title: 'review',     assignee: 'reviewer',  description: '...', dependsOn: ['implement'] },
])
```

对于你真心想让协调器来决定的目标驱动负载，`runTeam(goal)` 仍然是对的选择。这两个 API 是互补的；按「分派决策是你的、还是框架的」来挑。

### 思考模式成本：同一个模型，估计 4-5 倍延迟

旁支实验。我把同一张 DAG 又跑了两遍，只换评审员模型。先用 `qwen3.5:9b-mlx`（Qwen 3.5 9B，为 Apple Silicon 做了 MLX 优化，磁盘上 8.9GB），思考模式取其默认。然后用同一个模型，在评审员任务描述末尾加上 `/no_think`（Qwen 3 系列自带的提示层变通办法）。

| Ledger | reviewer config | reviewer latency | reviewer in / out tokens | wall total |
|---|---|---:|---:|---:|
| 1 | `qwen3:8b` (no thinking by design) | 208s | 1432 / 696 | 5:03 |
| 2 | `qwen3.5:9b-mlx` (thinking default ON) | **1347s** | 21014 / 1566 | 24:30 |
| 3 | `qwen3.5:9b-mlx` (`/no_think` workaround) | 554s | 38342 / 568 | 10:44 |

台账 2 对台账 3 是最干净的对照：同一个模型、同一套硬件，只有思考模式在变。加了 `/no_think` 后，输出 token 掉了 63%（1566 → 568），评审员延迟掉了 59%（1347s → 554s）——尽管台账 3 的评审员收到的输入多了 82%（38K 对 21K），因为那次运行里开发者恰好吐得更多。把输入差异归一化之后，这台 M1 16GB 上纯思考模式的代价，估计是 4-5 倍的评审员延迟。

对于短小的、代码评审形态的任务（输出约 200 词），思考模式是杀鸡用牛刀。让本地模型 + 思考设置去配那个角色，而不是配「我能拉到的最大那个」。

### 注意：OMA + OpenAI 兼容这条路没法彻底关掉 Qwen 3.5 的思考

我从 OMA 这一侧试了三种关掉思考的办法。两种失败，一种部分有效：

1. **经由 OpenAI 兼容端点用 Ollama 原生的 `think: false` 字段。** 不奏效。往发给 `localhost:11434/v1/chat/completions` 的请求体里加 `"think": false`，模型照样思考了 60 多秒，`reasoning` 长度仍有 758 字符。OpenAI 的 Chat Completions schema 没定义这个字段，Ollama 的兼容层会静默丢弃它。

2. **OMA 的 `AgentConfig.extraBody`** 正是为传递供应商特有参数而设计的，比如 GPT-5.5 的 `reasoning_effort: 'xhigh'`。它打的是同一个 OpenAI 兼容端点，所以最可能是同样的结果（我没单独再测；如果你测了，请反馈）。

3. **把 `/no_think` 干净地放在用户消息 / 任务描述的末尾。** 部分有效。`reasoning` 长度下降，输出 token 下降，延迟下降（上面的台账 3）。把 `/no_think` 放进 `systemPrompt` 里再额外强化（「完全跳过 <think> 块」）反而严格地更糟——模型往 `reasoning` 里塞了 1337 字符，产出的 `content` 是空的，因为 `max_tokens` 预算被推理阶段吃光了。

那条彻底关掉的路，走的是 Ollama 原生的 `/api/chat` 端点配 `"think": false`。在同一个评审提示上，那个端点 **6.7 秒** 就完成了。这就是这个模型 + 硬件在这个提示上的理论天花板。OMA 的 OpenAI 兼容路径，对思考模式模型留下了可测的性能空间。如果你找到了一种不绕过框架、就能让 Ollama 的 `think` 字段穿过一个 OpenAI 兼容客户端的办法，请在 OMA 仓库开一个 issue。我很乐意在这个局限上被证明是错的。

### 这些对上文有什么改动

架构论点一点没变——通过 `AgentConfig` 按智能体分配模型仍是那根杠杆，`runTasks` 对 `runTeam(goal)` 仍是那个分派选择，成本分档的框架仍是那个设计模式。原文实算例里的成本数字，用的是一个有代表性的 Anthropic + OpenAI 形态；这里真实运行的台账，是一个有不同成本地板的不同供应商组合。两者都是有效的参照点，而能在它们之间互换却不必重写编排代码，正是本文所主张的。

## 收尾：从这里该带走什么

混合模型智能体团队不是什么巧妙把戏。一旦你的团队长到两个智能体以上、负载开始按真实频次运行，它们就是对的默认选择。省下的钱可以很可观，依 token 形态而定，常常对全前沿基线省 40-70%；运维成本是实打实的（更多失效模式、更多方差）；而最要紧的那个设计选择，是哪个智能体拿到那个贵模型。

三点收获：

1. **按智能体分配模型是一根设计杠杆，不是一项优化。** 在你定团队的时候就把它定了。事后再补，意味着去重写那些已经漂移到匹配错误模型的提示。
2. **从两个供应商起步，再加本地。** 第二步用两个 API key、零基础设施就拿下了大部分省钱。第三步是增量的，取决于你是否扛得住本地模型的延迟。
3. **`onProgress` 是你能买到的最便宜的保险。** 二十行 TypeScript，就把 token 计数变成每次运行的美元数字。没有它，混合模型团队会悄悄退化，而你是从账单上才知道的。

从现有的仓库示例起步：[`multi-model-team`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/multi-model-team.ts)、[`providers/ollama`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/ollama.ts) 和 [`cost-tiered-pipeline`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts)。跑那个最贴你负载的，再在放大之前加上按智能体的台账。如果你把这个模式推上了生产，我很想听听你真实的成本形态长什么样。合理的模型切分大概和示例里不一样，而对的答案是因负载而异的。

---

**关于 open-multi-agent。** TypeScript 原生的多智能体编排框架，MIT 许可。一次 `runTeam()` 调用，目标 → 结果。三个运行时依赖。仓库：<https://github.com/open-multi-agent/open-multi-agent>。这个框架把 TypeScript 生态当成一等目标，而不是从 Python 二次移植过来的次要版本。

**编辑与勘误。** 如果某个价格在 2026-05-16 之后变了，或某个模型被改了名，请在 OMA 仓库开一个 issue，我会刷新示例里的那些常量。
