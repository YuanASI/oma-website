// Use-case ("solutions") page data — the source for /solutions/<slug> and the
// /solutions hub. One dynamic template (src/pages/[...locale]/solutions/[slug].astro)
// renders every entry, mirroring the /compare pair.
//
// HONESTY DISCIPLINE (red-line §1). Every page describes a real open-multi-agent
// capability and anchors to a published walkthrough (the `blogSlug`) that carries
// the actual, runnable code — the page itself stays prose so it can't drift from
// the API. API identifiers named here (runTeam, the coordinator, the task DAG,
// maxTokenBudget, MemoryStore, per-agent model, Zod-typed output) are the same
// ones used across the docs, the blog posts, and src/lib/compare.ts. No code is
// invented; the "read the full walkthrough" link points at the verified source.
//
// Bilingual copy (en/zh) is co-located here; page chrome (section titles, CTAs)
// lives in the type-checked i18n dict. zh follows TRANSLATING.md: 协调器 /
// 任务 DAG / 目标优先 / 编排 / 智能体 / 模型提供方 / 运行时; API identifiers and
// product names stay verbatim.

import type { Loc } from './compare';

export type Solution = {
  slug: string;
  /** Target search terms — English, invariant. */
  keywords: string[];
  /** Per-page meta description. */
  seoDescription: Loc;
  /** Short label for the Use Cases nav dropdown (the `title` is a full sentence). */
  navLabel: Loc;
  /** Hero H1 — the use case. */
  title: Loc;
  /** Hero sub-line. */
  lede: Loc;
  /** The problem this use case runs into. Rendered set:html. */
  problem: Loc;
  /** How open-multi-agent does it — references real API. Rendered set:html. */
  approach: Loc;
  /** When this shape is the right call. Rendered set:html. */
  whenFits: Loc;
  /** Anchor walkthrough (blog slug) with the runnable code. */
  blogSlug: string;
  /** Related /compare/<slug> pages for internal linking. */
  related: string[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: 'parallel-llm-calls',
    keywords: ['parallel llm calls typescript', 'run agents in parallel node', 'parallel llm requests', 'fan-out llm typescript'],
    seoDescription: {
      en: 'Run LLM calls in parallel in TypeScript: specialist agents work at once, return typed output, and an aggregator merges them.',
      zh: '在 TypeScript 里并行跑 LLM 调用：多个专职智能体同时工作、返回带类型的结果，再由聚合器合并。',
    },
    navLabel: { en: 'Parallel LLM calls', zh: '并行 LLM 调用' },
    title: {
      en: 'Run LLM calls in parallel — with typed output',
      zh: '并行跑 LLM 调用——还带类型化结果',
    },
    lede: {
      en: 'Independent LLM work shouldn’t run one call after another. open-multi-agent runs the independent agents at once and merges their typed results.',
      zh: '相互独立的 LLM 工作不该一个接一个地跑。open-multi-agent 让相互独立的智能体同时开跑，再合并它们带类型的结果。',
    },
    problem: {
      en: 'The naive shape crams summary, extraction, and classification into one giant prompt — or fires the calls sequentially, so latency is the sum of every step. Both waste the fact that the sub-tasks don’t depend on each other.',
      zh: '朴素的写法把摘要、抽取、分类塞进一个巨型 prompt——或者顺序发起调用，于是延迟等于每一步之和。两种都浪费了「这些子任务彼此不依赖」这个事实。',
    },
    approach: {
      en: 'You hand <code>runTeam()</code> a goal; the coordinator decomposes it into a task DAG and runs the independent nodes <em>in parallel</em>, so wall-clock time is the slowest branch, not the sum. Each specialist can return <code>Zod</code>-typed, schema-validated output, and an aggregator merges them into one typed result — no manual <code>Promise.all</code> plumbing, no untyped string-stitching.',
      zh: '你把一个目标交给 <code>runTeam()</code>；协调器把它拆解成任务 DAG，并把相互独立的节点<em>并行</em>跑，于是墙钟时间取决于最慢的分支，而非总和。每个专职智能体可以返回 <code>Zod</code> 校验、带类型的结果，再由聚合器合并成一个带类型的整体结果——无需手写 <code>Promise.all</code> 管道，也没有无类型的字符串拼接。',
    },
    whenFits: {
      en: 'This fits when your task splits into independent sub-tasks that each want their own prompt (and often their own model), and you want typed output rather than one prompt’s best guess. If the steps are strictly sequential and dependent, a single agent is simpler.',
      zh: '当你的任务能拆成若干相互独立、各自想要自己 prompt（往往还想要自己模型）的子任务，且你想要带类型的结果、而非一个 prompt 的最佳猜测时，这种形态很合适。如果步骤严格顺序且相互依赖，单个智能体更简单。',
    },
    blogSlug: 'meeting-summarizer-parallel-agents',
    related: ['langgraph', 'openai-agents-sdk'],
  },
  {
    slug: 'goal-driven-orchestration',
    keywords: ['goal driven agent orchestration', 'task dag agents typescript', 'goal to dag', 'runtime agent planning'],
    seoDescription: {
      en: 'Describe the goal instead of wiring the graph: the coordinator decomposes it into a task DAG at runtime and parallelizes it.',
      zh: '描述目标，而非接线图：协调器在运行时把目标拆解成任务 DAG 并自动并行。',
    },
    navLabel: { en: 'Goal-driven orchestration', zh: '目标驱动编排' },
    title: {
      en: 'Turn a goal into a task DAG — at runtime',
      zh: '把目标变成任务 DAG——在运行时',
    },
    lede: {
      en: 'In most agent frameworks you draw the task graph by hand. open-multi-agent builds it for you from a goal.',
      zh: '在多数智能体框架里，任务图是你手画的。open-multi-agent 从一个目标替你把它建出来。',
    },
    problem: {
      en: 'Hand-wiring nodes and edges works until the shape of the work changes — a new sub-task, a different order, another dependency — and then you’re editing the graph, not the goal. The orchestration is built for one problem instead of adapting to each.',
      zh: '手工接线节点与边，在工作形态不变时行得通——一旦多出一个子任务、换个顺序、加一条依赖，你改的就是图、而非目标。那套编排是为某一个问题搭的，而不是随每个问题自适应。',
    },
    approach: {
      en: 'You pass a goal to <code>runTeam()</code>. A coordinator agent decomposes it into a task DAG <em>at runtime</em>, runs the independent nodes in parallel, and synthesizes a typed result. The plan adapts to each goal instead of being drawn once; explicit routing, plan/task/tool approval gates, and a run-level <code>maxTokenBudget</code> checked between calls keep the execution bounded.',
      zh: '你把一个目标传给 <code>runTeam()</code>。一个协调器智能体<em>在运行时</em>把它拆解成任务 DAG，并行跑相互独立的节点，并综合出一个带类型的结果。计划随每个目标自适应，而非一次画定；显式路由、计划 / 任务 / 工具审批，以及在调用之间检查的运行级 <code>maxTokenBudget</code> 共同约束执行。',
    },
    whenFits: {
      en: 'This fits when the orchestration topology isn’t fixed — you’d rather describe the outcome than maintain a graph. If the topology is known and you want to lay it out explicitly, an explicit-graph framework is the more natural fit.',
      zh: '当编排拓扑并不固定、你更愿意描述结果、而非维护一张图时，这种形态很合适。如果拓扑已知、你想把它显式铺开，那么显式图框架更自然。',
    },
    blogSlug: 'goal-to-task-dag-coordinator',
    related: ['langgraph', 'crewai'],
  },
  {
    slug: 'mixed-model-teams',
    keywords: ['mixed model agent team', 'multi provider llm typescript', 'mix claude gpt gemini', 'per-agent model'],
    seoDescription: {
      en: 'Mix models in one agent team: each agent names its own provider — Claude, GPT, Gemini, or a local model — in a single run.',
      zh: '在一个智能体团队里混编模型：每个智能体各自指定提供方——Claude、GPT、Gemini 或本地模型——在同一次运行里协作。',
    },
    navLabel: { en: 'Mixed-model teams', zh: '混编模型团队' },
    title: {
      en: 'Mix any model in one agent team',
      zh: '在一个团队里混用任意模型',
    },
    lede: {
      en: 'Use a strong model where it earns its cost and a cheap one everywhere else — in the same team, in one run.',
      zh: '在该花钱的地方用强模型、其余地方用便宜模型——在同一个团队、同一次运行里。',
    },
    problem: {
      en: 'One model for the whole pipeline is either overpaying on the easy steps or underpowered on the hard one. Splitting providers usually means standing up separate clients and gluing their outputs together by hand.',
      zh: '整条流水线用一个模型，要么在简单步骤上多花钱，要么在难的那步上力不从心。而拆分提供方通常意味着各立一套客户端、再手工把它们的输出粘起来。',
    },
    approach: {
      en: 'Each agent names its own model, and they cooperate inside one team — Anthropic, OpenAI, Gemini, a local Ollama, or any OpenAI-compatible endpoint, mixed freely. One <code>thinking</code> config maps across providers, <code>modelRouting</code> sends work to the right tier, and <code>onTrace</code> spans let you watch per-agent cost and latency instead of guessing.',
      zh: '每个智能体各自指定模型，它们在一个团队里协作——Anthropic、OpenAI、Gemini、本地 Ollama，或任意兼容 OpenAI 的端点，自由混编。一份 <code>thinking</code> 配置跨提供方映射，<code>modelRouting</code> 把工作送到合适的档位，<code>onTrace</code> span 让你看清每个智能体的成本与延迟，而非靠猜。',
    },
    whenFits: {
      en: 'This fits when different steps have genuinely different difficulty and cost profiles, and you want one team rather than a Python service beside your Node app. If a single model comfortably covers the whole job, you don’t need the mixing.',
      zh: '当不同步骤的难度与成本画像确实不同、你想要一个团队而非在 Node 应用旁再立一个 Python 服务时，这种形态很合适。如果单个模型就能从容覆盖整件事，你不需要混编。',
    },
    blogSlug: 'mixed-model-agent-team',
    related: ['crewai', 'openai-agents-sdk'],
  },
  {
    slug: 'local-agents-ollama',
    keywords: ['local multi-agent typescript', 'ollama agents', 'private llm agents', 'self-hosted agent team'],
    seoDescription: {
      en: 'Run a full multi-agent team on your own machine in TypeScript, coordinator included, on a local Ollama model at $0 API cost.',
      zh: '在自己的机器上用 TypeScript 跑完整的多智能体团队——连协调器都在本地 Ollama 模型上，$0 API 成本。',
    },
    navLabel: { en: 'Local & private agents', zh: '本地私有智能体' },
    title: {
      en: 'Run a local, private multi-agent team',
      zh: '跑一个本地、私有的多智能体团队',
    },
    lede: {
      en: 'Keep the data on your machine: open-multi-agent runs against a local Ollama endpoint just like a cloud provider.',
      zh: '把数据留在你的机器上：open-multi-agent 对接本地 Ollama 端点，用法和云提供方一样。',
    },
    problem: {
      en: 'Sending every prompt to a hosted API is a non-starter when the data is sensitive or the budget is zero — but most agent frameworks assume a cloud key and make “fully local” an afterthought.',
      zh: '当数据敏感、或预算为零时，把每个 prompt 都发往托管 API 根本行不通——但多数智能体框架默认你有一把云端 key，把「完全本地」当成事后补丁。',
    },
    approach: {
      en: 'Because any agent can point at an OpenAI-compatible endpoint, a local Ollama server is just another provider — you can run the whole team, coordinator included, on a small local model at zero API cost. When you need more, a hybrid keeps sensitive agents local and routes only the heavy reasoning to the cloud, all in one team.',
      zh: '因为任何智能体都能指向一个兼容 OpenAI 的端点，本地 Ollama 服务就只是又一个提供方——你可以把整个团队、连协调器一起，跑在一个小的本地模型上，API 成本为零。需要更多算力时，混合模式把敏感智能体留在本地、只把重推理路由到云端，全在一个团队里。',
    },
    whenFits: {
      en: 'This fits when privacy, offline operation, or a $0 budget rules out a hosted API — or when you want a cheap local baseline and cloud only for the hard parts. If latency and top-tier quality dominate, a cloud-only team is simpler.',
      zh: '当隐私、离线运行或 $0 预算排除了托管 API——或者你想要一个便宜的本地基线、只在难处才上云时，这种形态很合适。如果延迟与顶级质量是主导，全云团队更简单。',
    },
    blogSlug: 'local-multi-agent-team-ollama-gemma',
    related: ['crewai', 'langgraph'],
  },
  {
    slug: 'agent-memory',
    keywords: ['agent long-term memory typescript', 'agent memory store', 'cross-run agent memory', 'persistent agent state'],
    seoDescription: {
      en: 'Persist namespaced shared state across a TypeScript agent team with MemoryStore, and add semantic recall across sessions.',
      zh: '用 MemoryStore 为 TypeScript 智能体团队持久化带命名空间的共享状态，并按需接入跨会话的语义召回。',
    },
    navLabel: { en: 'Durable shared memory', zh: '持久共享内存' },
    title: {
      en: 'Persist shared state across runs',
      zh: '跨运行持久化共享状态',
    },
    lede: {
      en: 'MemoryStore is a namespaced key-value persistence primitive. Use it for durable shared state; add a retrieval layer when you need semantic long-term memory.',
      zh: 'MemoryStore 是带命名空间的键值持久化原语。它适合持久共享状态；需要语义长期记忆时，还要增加召回层。',
    },
    problem: {
      en: 'In-memory coordination disappears with the process. Some workflows only need durable keys and checkpoints; assistants that recall facts or user context need a separate semantic extraction and retrieval system.',
      zh: '进程结束后，内存中的协作状态随之消失。有些工作流只需要持久键值与检查点；要让助手召回事实或用户上下文，则需要独立的语义抽取与检索系统。',
    },
    approach: {
      en: 'open-multi-agent exposes a <code>MemoryStore</code> interface whose keys are namespaced by agent. Use <code>FileStore</code> or a custom Redis/Postgres adapter for durable state. The same interface underpins checkpoint restore at completed task boundaries. For semantic recall, connect a system such as TencentDB Agent Memory or your own retrieval layer; OMA does not infer, embed, rank, or govern memories for you.',
      zh: 'open-multi-agent 暴露一个 <code>MemoryStore</code> 接口，键按智能体命名空间隔离。用 <code>FileStore</code> 或自定义 Redis / Postgres 适配器持久化状态；同一个接口也支撑从已完成任务边界恢复检查点。需要语义召回时，请接入 TencentDB Agent Memory 等系统或你自己的检索层；OMA 不会替你推断、向量化、排序或治理记忆。',
    },
    whenFits: {
      en: 'Use MemoryStore directly for durable workflow state, checkpoints, caches, and caller-defined records. Add semantic memory only when the product must extract and retrieve meaning across sessions. If every run is independent, in-run shared context is enough.',
      zh: '持久工作流状态、检查点、缓存与调用方自定义记录可直接使用 MemoryStore。只有产品必须跨会话抽取并召回语义时，才增加语义记忆系统。如果每次运行彼此独立，运行内共享上下文已经足够。',
    },
    blogSlug: 'agent-long-term-memory-tencentdb',
    related: ['langgraph', 'autogen'],
  },
  {
    slug: 'vercel-ai-sdk-orchestration',
    keywords: ['vercel ai sdk multi-agent', 'add orchestration to vercel ai sdk', 'ai sdk agent orchestration', 'next.js multi-agent'],
    seoDescription: {
      en: 'Add multi-agent orchestration to a Vercel AI SDK app: the SDK streams tokens, runTeam() decomposes the goal and coordinates.',
      zh: '给现有 Vercel AI SDK 应用加上多智能体编排：SDK 负责流式与对接模型，runTeam() 负责拆解目标、协调智能体。',
    },
    navLabel: { en: 'Vercel AI SDK', zh: 'Vercel AI SDK 编排' },
    title: {
      en: 'Add multi-agent orchestration to a Vercel AI SDK app',
      zh: '给 Vercel AI SDK 应用加多智能体编排',
    },
    lede: {
      en: 'Keep the AI SDK for streaming and model calls; add open-multi-agent for the coordination layer above it.',
      zh: '流式与模型调用继续交给 AI SDK；在其之上加一层 open-multi-agent 做协调。',
    },
    problem: {
      en: 'The Vercel AI SDK is excellent at the single-agent loop — streaming, tools, model calls — but multi-agent coordination is something you assemble yourself. Rebuilding on a different framework to get it is a heavy move.',
      zh: 'Vercel AI SDK 在单智能体循环上很出色——流式、工具、模型调用——但多智能体协作是你要自己拼的。为了得到它而换一个框架重建，代价太重。',
    },
    approach: {
      en: 'They sit at different layers, so they compose. The AI SDK keeps streaming tokens and talking to models; open-multi-agent’s <code>runTeam()</code> decomposes the goal into a task DAG and coordinates the agents on top — the two share a single Next.js API route. You add orchestration without leaving the AI SDK behind.',
      zh: '它们处在不同的层，所以能组合。AI SDK 继续流式吐 token、对接模型；open-multi-agent 的 <code>runTeam()</code> 在其上把目标拆解成任务 DAG、协调智能体——两者共用一条 Next.js API 路由。你加上了编排，又没丢下 AI SDK。',
    },
    whenFits: {
      en: 'This fits when you’ve already built on the Vercel AI SDK and want multi-agent orchestration without a rewrite. If you’re starting fresh and want orchestration from the first line, you can build directly on open-multi-agent.',
      zh: '当你已经构建在 Vercel AI SDK 上、想要多智能体编排又不想重写时，这种形态很合适。如果你从零起步、想从第一行就有编排，可以直接构建在 open-multi-agent 上。',
    },
    blogSlug: 'multi-agent-vercel-ai-sdk',
    related: ['vercel-ai-sdk', 'langgraph'],
  },
];

export const SOLUTION_SLUGS: readonly string[] = SOLUTIONS.map((s) => s.slug);

export function getSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}
