// Comparison-page data (§7.2); the source for /compare/<slug> and the /compare
// hub. One dynamic template (src/pages/[...locale]/compare/[competitor].astro)
// renders every entry, so adding a framework is a data edit, not a new page.
//
// HONESTY DISCIPLINE (red-line §1). Every competitor cell below was verified in
// July 2026 against a PRIMARY source; the framework's own pyproject.toml /
// package.json (dependency counts), its docs (paradigm, budget, tracing), and
// the PyPI/npm registry (latest version, license); not from memory. OMA's
// column was verified against open-multi-agent core v1.12.1 source + docs and
// the compatible first-party optional @open-multi-agent/otel v0.1.0 package. The
// whole point of these pages is the fair "when the other tool is the better
// choice" paragraph, so the competitor gets genuine credit and nothing is
// rounded up. Where a value would be a guess, it is stated qualitatively, never
// invented. Bilingual copy (en/zh) is co-located here; page chrome (headers,
// section titles, CTA) lives in the type-checked i18n dict instead.
//
// zh translations follow TRANSLATING.md + the live docs glossary: 协调器 /
// 任务 DAG / 目标优先 / 编排 / 智能体 / 模型提供方 / 运行时. API identifiers,
// package names, and product terms (crew, handoff) are kept verbatim.

export type Loc = { en: string; zh: string };

// The six comparison dimensions from G-102 §7.2 (language / paradigm /
// dependencies / mixed-model / budget / observability). The axis label and OMA's
// value are identical in every comparison, so they are defined once here and the
// per-competitor entries only supply their own column (`them`).
export type AxisKey = 'language' | 'paradigm' | 'deps' | 'mixedModel' | 'budget' | 'observability';

export type Axis = { key: AxisKey; label: Loc; oma: Loc };

export const AXES: Axis[] = [
  {
    key: 'language',
    label: { en: 'Language / runtime', zh: '语言 / 运行时' },
    oma: { en: 'TypeScript-native; embeds in any Node.js 18+ backend', zh: 'TypeScript 原生，可嵌入任意 Node.js 18+ 后端' },
  },
  {
    key: 'paradigm',
    label: { en: 'Orchestration model', zh: '编排范式' },
    oma: { en: 'Three modes: one agent, an explicit task DAG, or a goal decomposed by the coordinator at runtime', zh: '三种模式：单智能体、显式任务 DAG，或由协调器在运行时拆解目标' },
  },
  {
    key: 'deps',
    label: { en: 'Runtime dependencies', zh: '运行时依赖' },
    oma: { en: '3 direct (Anthropic SDK, OpenAI SDK, Zod); extra providers and MCP are opt-in peers', zh: '3 个直接依赖（Anthropic SDK、OpenAI SDK、Zod），额外提供方与 MCP 为按需 peer 依赖' },
  },
  {
    key: 'mixedModel',
    label: { en: 'Mixed-model teams', zh: '模型混编' },
    oma: { en: 'Yes; each agent can use its own cloud or local model in one team', zh: '支持，同一个团队里的每个智能体都可使用各自的云端或本地模型' },
  },
  {
    key: 'budget',
    label: { en: 'Run-budget control', zh: '运行预算控制' },
    oma: { en: 'Token and estimated-USD ceilings through maxTokenBudget, or maxCostBudget with your estimateCost price table', zh: '通过 maxTokenBudget 设置 token 上限，或通过 maxCostBudget 与应用自有的 estimateCost 价格表设置估算美元上限' },
  },
  {
    key: 'observability',
    label: { en: 'Observability', zh: '可观测性' },
    oma: { en: 'TraceRecord v2 + TraceStore, an optional first-party OTel adapter, and an offline post-run Run Viewer', zh: 'TraceRecord v2 + TraceStore、可选的一方 OTel 适配器，以及离线的运行后 Run Viewer' },
  },
];

export type OmaCapability = { title: Loc; body: Loc };

// Shared OMA capability baseline, verified against the framework README and
// packages/core/README.md. Every comparison page renders this list so OMA is
// represented by its actual runtime surface, not only by the six matrix axes.
export const OMA_CAPABILITIES: OmaCapability[] = [
  {
    title: { en: 'Dynamic and explicit orchestration', zh: '动态编排与显式编排' },
    body: {
      en: '<code>runTeam()</code> builds a task DAG from a goal. <code>runTasks()</code> runs a graph you define, and <code>runAgent()</code> covers the single-agent case.',
      zh: '<code>runTeam()</code> 从目标生成任务 DAG，<code>runTasks()</code> 运行你定义的任务图，<code>runAgent()</code> 则覆盖单智能体场景。',
    },
  },
  {
    title: { en: 'Deterministic control around agents', zh: '围绕智能体的确定性控制' },
    body: {
      en: 'Inspect and approve plans, freeze and replay them as data, validate outputs with Zod, stream per agent, cancel runs, or add a proposer and judge consensus loop.',
      zh: '计划可检查、可审批，也可冻结为数据后重放。结果可用 Zod 校验，还支持按智能体流式输出、取消运行，以及提议者与裁判组成的共识校验。',
    },
  },
  {
    title: { en: 'Dependency scheduling and recovery', zh: '依赖调度与恢复' },
    body: {
      en: 'The scheduler runs independent branches in parallel. Retries and checkpoints let an interrupted run resume without repeating completed tasks.',
      zh: '调度器并行运行互不依赖的分支。任务重试与检查点让中断的运行恢复时不重复已完成任务。',
    },
  },
  {
    title: { en: 'Production controls', zh: '生产控制' },
    body: {
      en: 'Bound work with turn, token, estimated-cost, timeout, context, and loop controls. Tools are default-deny, and trace payloads redact secrets by default.',
      zh: '通过轮次、token、估算成本、超时、上下文与循环控制限制工作量。工具默认拒绝授权，链路数据默认脱敏敏感信息。',
    },
  },
  {
    title: { en: 'Your environment and your models', zh: '你的环境与模型' },
    body: {
      en: 'Run in your Node.js backend, locally, offline, or air-gapped. Mix cloud and local models, connect MCP tools, and bring external agents through ACP or process backends.',
      zh: '运行在你自己的 Node.js 后端、本地、离线或气隙环境中。同一团队可混用云端与本地模型，并可接入 MCP 工具及 ACP 或进程后端的外部智能体。',
    },
  },
  {
    title: { en: 'Inspect, trace, and evaluate', zh: '检查、追踪与评估' },
    body: {
      en: 'Stable run identity, TraceStore, and the offline DAG and Waterfall Viewer work without a hosted service. An optional OTel adapter and EvalSets connect runs to production telemetry and CI gates.',
      zh: '稳定运行标识、TraceStore，以及离线 DAG 与 Waterfall Viewer 均不依赖托管服务。可选 OTel 适配器与 EvalSet 可把运行接入生产遥测和 CI 门禁。',
    },
  },
];

export type Comparison = {
  slug: string;
  /** Display name, kept verbatim in every locale. */
  name: string;
  /**
   * Hub placement. 'primary' pins the comparison in the featured tier on
   * /compare (the frameworks people most often weigh us against); absent = the
   * compact "more comparisons" tier. Full comparison pages are identical either
   * way.
   */
  tier?: 'primary';
  /** Official repository, linked from the page. */
  repo: string;
  /** Per-page meta description (title is templated from the name in the dict). */
  seoDescription: Loc;
  /** Target search terms; English, invariant (what people actually type). */
  keywords: string[];
  /** Hero sub-line. */
  lede: Loc;
  /** One-liner for the hub + hero router: when the competitor is the better call. */
  chooseThem: Loc;
  /** One-liner: when open-multi-agent is the better call. */
  chooseUs: Loc;
  /** The competitor's cell for each axis (OMA's cell comes from AXES). */
  them: Record<AxisKey, Loc>;
  /** Mechanism paragraph: how the two approaches actually differ. */
  howDiffer: Loc;
  /** The fair "when {name} is the better choice" paragraph (§7.2's key section). */
  whenThem: Loc;
  /** "Where open-multi-agent fits" paragraph. */
  whenUs: Loc;
  /** Optional up-front caveat (e.g. a framework in maintenance mode). */
  note?: Loc;
};

export const COMPARISONS: Comparison[] = [
  {
    slug: 'langgraph',
    name: 'LangGraph',
    tier: 'primary',
    repo: 'https://github.com/langchain-ai/langgraph',
    keywords: ['open-multi-agent vs langgraph', 'langgraph alternative typescript', 'langgraph vs open multi agent', 'goal-driven vs graph agents'],
    seoDescription: {
      en: 'open-multi-agent vs LangGraph: goal-first task-DAG decomposition versus a declarative state graph. An honest, sourced comparison of language, orchestration model, dependencies, budget control, and observability; and when to pick each.',
      zh: 'open-multi-agent 对比 LangGraph：目标优先的任务 DAG 拆解，对上声明式状态图。就语言、编排范式、依赖、预算控制与可观测性做一份诚实、可溯源的对比，以及各自何时更合适。',
    },
    lede: {
      en: 'LangGraph and open-multi-agent approach multi-agent orchestration from opposite ends: LangGraph runs a graph you define; open-multi-agent decomposes a goal you describe.',
      zh: 'LangGraph 与 open-multi-agent 从两端切入多智能体编排：LangGraph 运行你定义好的图，open-multi-agent 拆解你描述的目标。',
    },
    chooseThem: {
      en: 'You want a fixed graph you control node-by-node, with state history and time-travel tools built around that graph.',
      zh: '你需要逐节点掌控固定图，并围绕这张图使用状态历史与时间回溯工具。',
    },
    chooseUs: {
      en: 'You want a TypeScript runtime that can generate a plan from a goal, then let you inspect, approve, freeze, replay, checkpoint, and trace it.',
      zh: '你需要一个 TypeScript 运行时，从目标生成计划，并允许你检查、审批、冻结、重放、恢复和追踪它。',
    },
    them: {
      language: { en: 'Python-first; first-party TypeScript port (@langchain/langgraph) is GA', zh: 'Python 优先；官方 TypeScript 移植（@langchain/langgraph）已 GA' },
      paradigm: { en: 'Graph-first; you define nodes and edges over shared state (StateGraph)', zh: '图优先，你在共享状态之上定义节点与边（StateGraph）' },
      deps: { en: '6 direct (Python) / 4 direct + 2 peers (JS)', zh: '6 个直接依赖（Python）/ 4 直接 + 2 peer（JS）' },
      mixedModel: { en: 'Yes; bind a distinct model inside each node', zh: '支持，在每个节点内绑定不同的模型' },
      budget: { en: 'No token cap; recursion_limit counts steps, not tokens', zh: '无 token 上限，recursion_limit 计的是步数，不是 token' },
      observability: { en: 'First-party LangSmith tracing (near-zero-config) + OpenTelemetry export', zh: '一方 LangSmith 链路追踪（近乎零配置）+ OpenTelemetry 导出' },
    },
    howDiffer: {
      en: 'LangGraph compiles the nodes, edges, and conditional routing of a declarative graph into an invokable you run. open-multi-agent runs a coordinator that decomposes the goal into a task DAG <em>at runtime</em> and auto-parallelizes independent nodes. Both checkpoint and resume. OMA snapshots completed tasks over any <code>MemoryStore</code> and resumes with <code>restore()</code>, though recovery is task-grained, so an interrupted task starts again. LangGraph additionally exposes state history and time travel over its graph.',
      zh: 'LangGraph 把声明式图中的节点、边与条件路由编译成一个可调用对象。open-multi-agent 则运行协调器，<em>在运行时</em>把目标拆解成任务 DAG，并自动并行相互独立的节点。两者都支持检查点与恢复。OMA 在任意 <code>MemoryStore</code> 上保存已完成任务，并通过 <code>restore()</code> 恢复，不过恢复以任务为粒度，被中断的任务会重新开始。LangGraph 还提供围绕图的状态历史与时间回溯。',
    },
    whenThem: {
      en: 'LangGraph fits when the orchestration topology is known and should be authored explicitly, or when state history and time-travel debugging over that graph are requirements. Its TypeScript package is GA and it integrates with the wider LangChain stack.',
      zh: '当编排拓扑已经确定并需要显式编写，或项目要求围绕图使用状态历史与时间回溯调试时，LangGraph 合适。它的 TypeScript 包已 GA，并可接入 LangChain 技术栈。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you’d rather describe the outcome than wire the graph; the coordinator plans the task DAG at runtime, so the orchestration adapts to each goal instead of being hand-built for one. It’s TypeScript-native with three runtime dependencies, and it ships a hard <code>maxTokenBudget</code> cap that aborts a run before it overspends; a guardrail LangGraph doesn’t offer at the token level.',
      zh: 'open-multi-agent 适合你更愿意描述结果、而非接线图的场景，协调器在运行时规划任务 DAG，于是编排随每个目标自适应，而不是为某一个手工搭好。它 TypeScript 原生、只有三个运行时依赖，并自带一道硬性 <code>maxTokenBudget</code> 上限，会在超支前中止运行，这是 LangGraph 在 token 层面没有提供的护栏。',
    },
  },
  {
    slug: 'crewai',
    name: 'CrewAI',
    repo: 'https://github.com/crewAIInc/crewAI',
    keywords: ['crewai alternative', 'crewai vs open multi agent', 'crewai typescript alternative', 'crewai alternative nodejs'],
    seoDescription: {
      en: 'open-multi-agent vs CrewAI: a lean 3-dependency TypeScript runtime versus a batteries-included Python framework of role-based crews. An honest, sourced comparison; and when each is the right call.',
      zh: 'open-multi-agent 对比 CrewAI：精简到 3 个依赖的 TypeScript 运行时，对上开箱即全、基于角色 crew 的 Python 框架。一份诚实、可溯源的对比，以及各自何时更合适。',
    },
    lede: {
      en: 'CrewAI organizes Python agents by roles and processes; open-multi-agent supports dynamic and explicit task DAGs in TypeScript. Language and orchestration model are the main differences.',
      zh: 'CrewAI 在 Python 中按角色与流程组织智能体；open-multi-agent 在 TypeScript 中支持动态与显式任务 DAG。主要差别是语言与编排模型。',
    },
    chooseThem: {
      en: 'You’re in Python and want a batteries-included toolkit; role-based crews, built-in memory and RAG, a large ecosystem.',
      zh: '你在 Python 中，需要基于角色的 crew、内置记忆与 RAG，以及 CrewAI 的现有集成。',
    },
    chooseUs: {
      en: 'Your backend is TypeScript and you want a lean core (three dependencies) with goal-driven decomposition and a hard token budget.',
      zh: '你的后端是 TypeScript，想要一个精简内核（三个依赖）、目标驱动的拆解，以及硬性 token 预算。',
    },
    them: {
      language: { en: 'Python only (3.10+); no official TypeScript port', zh: '仅 Python（3.10+）；无官方 TypeScript 移植' },
      paradigm: { en: 'Role-based crews under a sequential or hierarchical process', zh: '基于角色的 crew，在顺序或分层 process 下运行' },
      deps: { en: '~30 direct dependencies, plus many optional extras', zh: '约 30 个直接依赖，另有大量可选 extras' },
      mixedModel: { en: 'Yes; per-agent llm= (native SDKs, LiteLLM for the rest)', zh: '支持，按智能体设 llm=（原生 SDK，其余走 LiteLLM）' },
      budget: { en: 'No hard cap; max_rpm / max_iter limits + post-hoc usage metrics', zh: '无硬上限，max_rpm / max_iter 限制 + 事后用量统计' },
      observability: { en: 'Native event bus; forward to Langfuse / OpenLIT / MLflow / others', zh: '原生事件总线；转发到 Langfuse / OpenLIT / MLflow 等' },
    },
    howDiffer: {
      en: 'CrewAI organizes work around role-playing agents grouped into a <em>crew</em> that runs sequentially or hierarchically, with memory and RAG built in. open-multi-agent hands a coordinator a goal and lets it decompose that goal into a task DAG at runtime, running independent tasks in parallel. The orchestration surface is roughly comparable; the decision is mostly the language stack; Python versus TypeScript; and how lean you want the dependency footprint (CrewAI pulls in ~30 direct dependencies; OMA, three).',
      zh: 'CrewAI 围绕扮演角色的智能体来组织工作，把它们编成一个顺序或分层运行的 <em>crew</em>，并内置记忆与 RAG。open-multi-agent 则把目标交给协调器，让它在运行时把目标拆解成任务 DAG，并行运行相互独立的任务。两者的编排能力面大致相当；决策主要在语言栈，Python 还是 TypeScript，以及你想要多精简的依赖足迹（CrewAI 拉入约 30 个直接依赖，OMA 是三个）。',
    },
    whenThem: {
      en: 'CrewAI fits Python projects that want role-based crews, sequential or hierarchical processes, built-in memory and RAG, and its existing integrations in one framework. That bundled surface also brings a larger dependency footprint.',
      zh: '当 Python 项目需要基于角色的 crew、顺序或分层流程、内置记忆与 RAG，以及现有集成时，CrewAI 合适。这些内置能力也会带来更大的依赖规模。',
    },
    whenUs: {
      en: 'open-multi-agent fits when your backend is TypeScript and you want to stay there; no Python service to stand up beside your Node app. The core is deliberately small (three runtime dependencies; extra providers and MCP load only when you opt in), the coordinator plans the work from a goal, and <code>maxTokenBudget</code> gives you a hard spend ceiling that aborts the run.',
      zh: 'open-multi-agent 适合你的后端是 TypeScript、且想一直待在这里的场景，无需在 Node 应用旁再立一个 Python 服务。内核刻意做得很小（三个运行时依赖；额外提供方与 MCP 仅在你按需启用时才加载），协调器从目标出发规划工作，<code>maxTokenBudget</code> 则给你一道会中止运行的硬性花费上限。',
    },
  },
  {
    slug: 'autogen',
    name: 'AutoGen',
    repo: 'https://github.com/microsoft/autogen',
    keywords: ['autogen alternative', 'autogen typescript alternative', 'autogen vs open multi agent', 'conversation-driven vs goal-driven agents'],
    seoDescription: {
      en: 'open-multi-agent vs Microsoft AutoGen: goal-driven TypeScript orchestration versus conversation-driven Python agents. An honest, sourced comparison; including AutoGen’s shift to maintenance mode; and when each is the right call.',
      zh: 'open-multi-agent 对比微软 AutoGen：目标驱动的 TypeScript 编排，对上对话驱动的 Python 智能体。一份诚实、可溯源的对比，含 AutoGen 转入维护模式这一事实，以及各自何时更合适。',
    },
    lede: {
      en: 'AutoGen models multi-agent work as conversations over a Python runtime; open-multi-agent uses task DAGs in a TypeScript runtime.',
      zh: 'AutoGen 在 Python 运行时中把多智能体工作建模为对话；open-multi-agent 则在 TypeScript 运行时中使用任务 DAG。',
    },
    chooseThem: {
      en: 'You’re in Python, prefer a conversational or actor-model mental model, and want native OpenTelemetry; and you’ve accounted for AutoGen’s maintenance status.',
      zh: '你在 Python 里，偏好对话式或 actor 模型的思维方式，想要原生 OpenTelemetry，并且已把 AutoGen 的维护状态纳入考量。',
    },
    chooseUs: {
      en: 'You want an actively-developed, TypeScript-native runtime with goal-driven decomposition, token + estimated-cost ceilings, and an optional first-party OTel adapter.',
      zh: '你想要一个仍在积极开发、TypeScript 原生、目标驱动拆解、带 token + 估算成本上限和可选一方 OTel 适配器的运行时。',
    },
    them: {
      language: { en: 'Python (autogen-core / autogen-agentchat); .NET in preview; no TypeScript', zh: 'Python（autogen-core / autogen-agentchat）；.NET 尚在 preview；无 TypeScript' },
      paradigm: { en: 'Conversation / group-chat (v0.2) over an event-driven actor runtime (v0.4)', zh: '对话 / group-chat（v0.2），底层是事件驱动的 actor 运行时（v0.4）' },
      deps: { en: '6 direct (autogen-core)', zh: '6 个直接依赖（autogen-core）' },
      mixedModel: { en: 'Yes; per-agent model_client via autogen-ext', zh: '支持，通过 autogen-ext 按智能体设 model_client' },
      budget: { en: 'No hard cap; soft, self-reported TokenUsageTermination between turns', zh: '无硬上限，软性的、依赖自报用量的 TokenUsageTermination，在轮次之间生效' },
      observability: { en: 'Native OpenTelemetry; runtimes auto-emit spans', zh: '原生 OpenTelemetry，运行时自动发出 span' },
    },
    note: {
      en: 'Heads-up: in 2026 Microsoft merged AutoGen and Semantic Kernel into the new <strong>Microsoft Agent Framework</strong>, its supported successor. AutoGen still gets fixes but is effectively in maintenance mode (latest release 0.7.5, September 2025). Worth weighing if you’re choosing a framework for a new, long-lived project.',
      zh: '提醒：2026 年微软把 AutoGen 与 Semantic Kernel 合并进了新的 <strong>Microsoft Agent Framework</strong>，作为其受支持的继任者。AutoGen 仍在收修复，但实际上已进入维护模式（最新版本 0.7.5，2025 年 9 月）。如果你在为一个全新、长期的项目选框架，这点值得掂量。',
    },
    howDiffer: {
      en: 'AutoGen models multi-agent work as a <em>conversation</em>: agents exchange messages in a group chat and coordination emerges from that dialogue (its v0.4 core adds an event-driven, actor-model runtime underneath). open-multi-agent is goal-driven: you hand the coordinator an outcome and it decomposes it into a task DAG with explicit dependencies, running independents in parallel. Both now have a first-party OpenTelemetry path. AutoGen auto-emits OTel spans; OMA keeps OTel out of its three-dependency core and maps TraceRecord v2 through the optional <code>@open-multi-agent/otel</code> adapter to a provider your application owns, alongside TraceStore and the offline Run Viewer.',
      zh: 'AutoGen 把多智能体工作建模为一场<em>对话</em>：智能体在 group chat 里交换消息，协作从这场对话中涌现（它的 v0.4 内核在底层加了一个事件驱动的 actor 模型运行时）。open-multi-agent 则目标驱动：你把一个结果交给协调器，它拆解成一张带显式依赖的任务 DAG，并行运行相互独立的部分。两者现在都有一方 OpenTelemetry 路径。AutoGen 自动发出 OTel span；OMA 不把 OTel 拉进只有三个依赖的 core，而是通过可选的 <code>@open-multi-agent/otel</code> 适配器，把 TraceRecord v2 映射到由应用持有的 provider，另有 TraceStore 与离线 Run Viewer。',
    },
    whenThem: {
      en: 'AutoGen fits Python systems built around conversation or actor-model coordination and native OpenTelemetry. Microsoft now directs new multi-agent work to the Agent Framework, so AutoGen is primarily relevant to existing systems that already use it.',
      zh: '当 Python 系统采用对话式或 actor 模型协作并需要原生 OpenTelemetry 时，AutoGen 合适。微软目前把新的多智能体工作导向 Agent Framework，因此 AutoGen 主要适用于已经采用它的既有系统。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want a TypeScript-native runtime under active development, a goal-first model instead of a conversation you have to steer, and run-level ceilings through <code>maxTokenBudget</code> or <code>maxCostBudget</code> + <code>estimateCost</code>. Its optional OTel adapter preserves the lean core while the offline Run Viewer gives each completed run a local inspection path. Starting fresh in Node.js, OMA avoids both a Python dependency and a framework in transition.',
      zh: 'open-multi-agent 适合你想要一个 TypeScript 原生、仍在积极开发的运行时，想要目标优先的模型、而不是一场需要你去引导的对话，并通过 <code>maxTokenBudget</code> 或 <code>maxCostBudget</code> + <code>estimateCost</code> 给整次运行设上限的场景。可选 OTel 适配器让 core 保持精简，离线 Run Viewer 则给每次已完成运行一条本地检查路径。若从零起步于 Node.js，OMA 既省去 Python 依赖，也避开一个正在过渡期的框架。',
    },
  },
  {
    slug: 'openai-agents-sdk',
    name: 'OpenAI Agents SDK',
    repo: 'https://github.com/openai/openai-agents-python',
    keywords: ['openai agents sdk alternative', 'openai agents sdk typescript', 'multi provider agent framework', 'openai agents sdk vs open multi agent'],
    seoDescription: {
      en: 'open-multi-agent vs the OpenAI Agents SDK: provider-neutral task-DAG orchestration versus a lightweight, handoffs-based SDK with built-in tracing. A sourced comparison of mechanisms, controls, and fit.',
      zh: 'open-multi-agent 对比 OpenAI Agents SDK：提供方中立的任务 DAG 编排，对上轻量、基于 handoff、内置追踪的 SDK。对机制、控制与适用场景做可溯源的对比。',
    },
    lede: {
      en: 'The OpenAI Agents SDK is a lightweight, handoffs-based framework with tracing enabled by default; open-multi-agent uses task DAGs and is provider-neutral. The main differences are orchestration model and provider coupling.',
      zh: 'OpenAI Agents SDK 是一个轻量、基于 handoff、默认开启追踪的框架；open-multi-agent 使用任务 DAG，并保持提供方中立。主要差别是编排模型与提供方耦合。',
    },
    chooseThem: {
      en: 'You’re centered on OpenAI’s platform, prefer the handoffs model, and want tracing enabled by default.',
      zh: '你以 OpenAI 平台为中心，偏好 handoff 模型，并希望追踪默认开启。',
    },
    chooseUs: {
      en: 'You want provider-neutral, goal-driven orchestration in TypeScript, with a hard token budget and a lean footprint.',
      zh: '你想要提供方中立、目标驱动的 TypeScript 编排，带硬性 token 预算和精简的足迹。',
    },
    them: {
      language: { en: 'Python-first; official TypeScript port (@openai/agents); both pre-1.0', zh: 'Python 优先；官方 TypeScript 移植（@openai/agents），两者均为 pre-1.0' },
      paradigm: { en: 'Handoffs; an agent delegates to another; agents can also be tools', zh: 'Handoff，一个智能体委派给另一个；智能体也可作为工具' },
      deps: { en: '7 direct (Python) / 2 direct + peer (JS)', zh: '7 个直接依赖（Python）/ 2 直接 + peer（JS）' },
      mixedModel: { en: 'Yes; per-agent model= (OpenAI-compatible endpoints, LiteLLM)', zh: '支持，按智能体设 model=（兼容 OpenAI 的端点、LiteLLM）' },
      budget: { en: 'No hard cap; max_turns counts steps; usage reported only', zh: '无硬上限，max_turns 计的是步数；用量仅作报告' },
      observability: { en: 'Built-in tracing on by default (OpenAI dashboard) + 25+ external processors', zh: '内置追踪默认开启（OpenAI 仪表盘）+ 25 个以上外部 processor' },
    },
    howDiffer: {
      en: 'The Agents SDK orchestrates through <em>handoffs</em>: an agent delegates to another and control passes along that chain. Agents can also be exposed as tools. open-multi-agent orchestrates through <em>decomposition</em>: a coordinator builds a task DAG and runs independent tasks in parallel. The SDK enables tracing by default and supports external processors. OMA exposes TraceRecord v2, TraceStore, an optional first-party OTel adapter for an application-owned provider, and an offline Run Viewer. The SDK centers OpenAI, while OMA is provider-neutral by design.',
      zh: 'Agents SDK 通过 <em>handoff</em> 编排：一个智能体委派给另一个，控制权沿链条传递。智能体也可作为工具暴露。open-multi-agent 则通过<em>拆解</em>编排：协调器构建任务 DAG，并行运行相互独立的任务。SDK 默认开启追踪，并支持外部 processor。OMA 提供 TraceRecord v2、TraceStore、面向应用自有 provider 的可选一方 OTel 适配器，以及离线 Run Viewer。SDK 以 OpenAI 为中心，OMA 则保持提供方中立。',
    },
    whenThem: {
      en: 'Pick the OpenAI Agents SDK if your world is OpenAI-centric, you like the handoffs model, and you want tracing that just works out of the box. It’s minimal and well-instrumented. Its TypeScript port is official, though both it and the Python package are still pre-1.0, so expect some churn.',
      zh: '如果你的世界以 OpenAI 为中心、喜欢 handoff 模型、想要开箱即用的追踪，就选 OpenAI Agents SDK。它精简、埋点到位。它的 TypeScript 移植是官方的，不过它和 Python 包都还在 pre-1.0，所以要预期一些变动。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want to stay provider-neutral; mix Anthropic, Gemini, OpenAI, local models, or any OpenAI-compatible endpoint in one team; and prefer decomposing a goal to wiring handoffs. It’s TypeScript-native, three dependencies, and its <code>maxTokenBudget</code> gives a hard spend ceiling the Agents SDK doesn’t have.',
      zh: 'open-multi-agent 适合你想保持提供方中立，在同一个团队里混用 Anthropic、Gemini、OpenAI、本地模型，或任何兼容 OpenAI 的端点，并且更愿意拆解目标、而非接线 handoff。它 TypeScript 原生、三个依赖，其 <code>maxTokenBudget</code> 给出一道 Agents SDK 所没有的硬性花费上限。',
    },
  },
  {
    slug: 'mastra',
    name: 'Mastra',
    tier: 'primary',
    repo: 'https://github.com/mastra-ai/mastra',
    keywords: ['mastra alternative', 'mastra vs open multi agent', 'mastra typescript agent framework', 'lean mastra alternative'],
    seoDescription: {
      en: 'open-multi-agent vs Mastra: a lean, 3-dependency, goal-driven runtime versus a batteries-included TypeScript framework whose workflows you wire by hand. An honest, sourced comparison of dependency weight, orchestration model, and run-budget control; and when each is the right call.',
      zh: 'open-multi-agent 对比 Mastra：精简、3 个依赖、目标驱动的运行时，对上一个开箱即全、workflow 需你手工接线的 TypeScript 框架。就依赖体量、编排范式与运行预算控制做一份诚实、可溯源的对比，以及各自何时更合适。',
    },
    lede: {
      en: 'Both are TypeScript-native and actively developed; the real difference is surface area. Mastra is a batteries-included framework; open-multi-agent is a lean, goal-driven core.',
      zh: '两者都是 TypeScript 原生、都在积极开发，真正的差别在覆盖面。Mastra 是开箱即全的框架，open-multi-agent 是一个精简、目标驱动的内核。',
    },
    chooseThem: {
      en: 'You want an all-in-one framework and will author the workflow graph yourself and carry a larger dependency surface to get memory, RAG, evals, and a studio bundled in.',
      zh: '你想要一个 all-in-one 框架，并愿意自己编写 workflow 图、背上更大的依赖面，以换取内置的记忆、RAG、evals 与调试台。',
    },
    chooseUs: {
      en: 'You want a small core (three dependencies) that runs in your own environment — offline or air-gapped, on your own credentials — with goal-driven decomposition instead of hand-built workflow graphs and a hard spend cap.',
      zh: '你想要一个小内核（三个依赖），跑在你自己的环境里——离线或气隙、用你自己的凭证——用目标驱动的拆解代替手搭 workflow 图，并带一道硬性花费上限。',
    },
    them: {
      language: { en: 'TypeScript-native; requires Node.js 22.13+', zh: 'TypeScript 原生；要求 Node.js 22.13+' },
      paradigm: { en: 'Agents plus graph-based workflows you author by hand (.then / .branch / suspend); memory, RAG, and evals bundled; a separate beta Harness (AgentController) for interactive apps', zh: '智能体，加上需你手工编写的图式 workflow（.then / .branch / suspend）；内置记忆、RAG 与 evals；另有一个独立的 beta Harness（AgentController）用于交互应用' },
      deps: { en: '~32 direct in @mastra/core; built on the Vercel AI SDK provider layer', zh: '@mastra/core 约 32 个直接依赖；构建于 Vercel AI SDK 的提供方层之上' },
      mixedModel: { en: 'Yes; per-agent model via its "provider/model" router, layered on the Vercel AI SDK provider set', zh: '支持，按智能体经其 "provider/model" 路由设模型，叠在 Vercel AI SDK 提供方层之上' },
      budget: { en: 'No hard token cap; maxSteps limits agent steps', zh: '无硬性 token 上限，maxSteps 限制智能体步数' },
      observability: { en: 'OpenTelemetry-based tracing with auto-derived metrics and the Mastra Studio dashboard', zh: '基于 OpenTelemetry 的链路追踪，自动提取指标，配 Mastra Studio 仪表盘' },
    },
    howDiffer: {
      en: 'Mastra bundles the whole surface; <em>agents</em>, graph-based <em>workflows</em> you wire by hand with <code>.then()</code>/<code>.branch()</code>, memory, RAG, and evals; into one framework, with a separate beta <em>Harness</em> (AgentController) for interactive apps. That breadth is the cost: ~32 direct dependencies in the core (atop the Vercel AI SDK provider layer), Node 22.13+, and workflow durability that leans on a storage backend and a running server to resume. open-multi-agent keeps the core to three dependencies and hands a coordinator a goal, which it decomposes into a task DAG <em>at runtime</em> and auto-parallelizes — so the plan is generated, reviewable data you can freeze and replay, not a graph you wire by hand. Its checkpoints resume completed tasks over any <code>MemoryStore</code> with no durable-execution backend, and its evaluation, tracing, and offline Run Viewer need no hosted service.',
      zh: 'Mastra 把整个面都打包进一个框架；<em>智能体</em>、需你用 <code>.then()</code>/<code>.branch()</code> 手工接线的图式 <em>workflow</em>、记忆、RAG 与 evals；另有一个独立的 beta <em>Harness</em>（AgentController）用于交互应用。这份“全”是有代价的：内核约 32 个直接依赖（叠在 Vercel AI SDK 提供方层之上）、要求 Node 22.13+，且 workflow 的持久性要靠一个存储后端与一个常驻 server 才能恢复。open-multi-agent 把内核控制在三个依赖，把目标交给协调器，由它<em>在运行时</em>拆解成任务 DAG 并自动并行——于是计划是生成出来、可审阅可重放的数据，而非你手工接线的图。它的检查点在任意 <code>MemoryStore</code> 上恢复已完成任务、无需持久化执行后端，而 evaluation、链路追踪与离线 Run Viewer 也都无需一个托管服务。',
    },
    whenThem: {
      en: 'Mastra fits when you want a batteries-included stack and are willing to author the workflow graph yourself: bundled memory, RAG, evals, and a studio, with suspend/resume durability if you run the storage and server it needs. Its dedicated Harness (still beta) targets interactive, multi-mode agent apps rather than task orchestration.',
      zh: '当你想要一套开箱即全的技术栈、并愿意自己编写 workflow 图时，Mastra 合适：内置记忆、RAG、evals 与调试台，若你愿意运行它所需的存储与 server，还能获得挂起/恢复的持久性。它专门的 Harness（仍是 beta）面向的是交互式、多模式的智能体应用，而非任务编排。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want the plan built for you and the whole run kept in your environment. The coordinator turns a goal into a task DAG at runtime, and that plan is inspectable, replayable data (<code>planOnly</code> → <code>createPlanArtifact</code> → <code>runFromPlan</code>), not a workflow graph you hand-author. It stays three dependencies on Node.js 18+, hard-caps spend with <code>maxTokenBudget</code> (or <code>maxCostBudget</code>) where Mastra has no token-level cap, and can route planning to a flagship model and leaf work to a cheap one. Evaluation, tracing, and an offline Run Viewer need no hosted service, so it runs fully offline or air-gapped, on your own credentials.',
      zh: 'open-multi-agent 适合你想要计划替你生成、且整个运行留在你自己环境里的场景。协调器在运行时把目标拆成任务 DAG，而这份计划是可检查、可重放的数据（<code>planOnly</code> → <code>createPlanArtifact</code> → <code>runFromPlan</code>），而非你手工编写的 workflow 图。它保持三个依赖、跑在 Node.js 18+ 上，用 <code>maxTokenBudget</code>（或 <code>maxCostBudget</code>）在超支前硬性中止运行——这是 Mastra 在 token 层面没有的护栏，并且可以把规划交给旗舰模型、把叶子任务交给廉价模型。evaluation、链路追踪与离线 Run Viewer 全都无需托管服务，于是它能完全离线或气隙运行，用你自己的凭证。',
    },
  },
  {
    slug: 'vercel-ai-sdk',
    name: 'Vercel AI SDK',
    tier: 'primary',
    repo: 'https://github.com/vercel/ai',
    keywords: ['vercel ai sdk alternative', 'vercel ai sdk multi-agent', 'ai sdk vs open multi agent', 'multi-agent on top of vercel ai sdk'],
    seoDescription: {
      en: 'open-multi-agent vs the Vercel AI SDK: goal-driven multi-agent orchestration versus a lower-level provider-neutral toolkit. They sit at different layers; and open-multi-agent can run on top of the AI SDK. An honest, sourced comparison.',
      zh: 'open-multi-agent 对比 Vercel AI SDK：目标驱动的多智能体编排，对上更底层、提供方中立的工具包。两者处在不同层，open-multi-agent 甚至可以跑在 AI SDK 之上。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'These sit at different layers. The Vercel AI SDK is a lightweight toolkit for talking to models; one agent, tools, streaming. open-multi-agent is the orchestration layer above it: describe a goal, get a multi-agent task DAG. You can even run OMA on top of the AI SDK.',
      zh: '这两者处在不同的层。Vercel AI SDK 是一个轻量工具包，用来和模型对话，单个智能体、工具、流式。open-multi-agent 是它之上的编排层：描述一个目标，得到一张多智能体的任务 DAG。你甚至可以把 OMA 跑在 AI SDK 之上。',
    },
    chooseThem: {
      en: 'You want a lightweight, provider-neutral toolkit for a single agent; model calls, tool use, streaming; and you’ll handle any orchestration yourself.',
      zh: '你想要一个轻量、提供方中立的工具包，服务单个智能体，模型调用、工具使用、流式，编排部分你自己来。',
    },
    chooseUs: {
      en: 'You need orchestration above model calls, including dynamic or explicit task DAGs, dependency scheduling, approvals, recovery, budgets, and multi-agent traces.',
      zh: '你需要模型调用之上的编排，包括动态或显式任务 DAG、依赖调度、审批、恢复、预算和多智能体链路。',
    },
    them: {
      language: { en: 'TypeScript-native; the leanest of the group', zh: 'TypeScript 原生；本组里最精简' },
      paradigm: { en: 'A single-agent tool-calling loop (generateText / streamText / Agent, stopWhen); multi-agent is manual composition you build', zh: '单智能体的工具调用循环（generateText / streamText / Agent，stopWhen）；多智能体是你自己搭的手工组合' },
      deps: { en: '3 direct (@ai-sdk/gateway, provider, provider-utils)', zh: '3 个直接依赖（@ai-sdk/gateway、provider、provider-utils）' },
      mixedModel: { en: 'Yes; provider-neutral by design, one model per agent loop', zh: '支持，设计上提供方中立，每个智能体循环一个模型' },
      budget: { en: 'No hard token cap; stopWhen / stepCountIs are step conditions', zh: '无硬性 token 上限，stopWhen / stepCountIs 是步数条件' },
      observability: { en: 'experimental_telemetry emits OpenTelemetry spans', zh: 'experimental_telemetry 发出 OpenTelemetry span' },
    },
    howDiffer: {
      en: 'The Vercel AI SDK is <em>primitives</em>: a provider-neutral interface for model calls, tool use, and streaming, plus an <code>Agent</code> abstraction that runs a single tool-calling loop until <code>stopWhen</code>. Multi-agent coordination is something you compose yourself on top. open-multi-agent is that coordination layer; a coordinator decomposes a goal into a task DAG at runtime, runs independent tasks in parallel, and hands you a typed result. They’re complementary as much as competing: OMA ships an AI SDK bridge, so the SDK can be the model layer under an OMA team.',
      zh: 'Vercel AI SDK 是<em>原语</em>：一套提供方中立的接口，负责模型调用、工具使用与流式，外加一个 <code>Agent</code> 抽象，跑单个工具调用循环直到 <code>stopWhen</code>。多智能体协作是你自己在其上组合出来的。open-multi-agent 就是那一层协作，协调器在运行时把目标拆解成任务 DAG，并行运行相互独立的任务，交给你一个带类型的结果。二者与其说竞争，不如说互补：OMA 自带一个 AI SDK bridge，于是 SDK 可以作为 OMA 团队之下的模型层。',
    },
    whenThem: {
      en: 'The Vercel AI SDK fits when you want provider-neutral model, tool, and streaming primitives and intend to own the control flow. Its Agent abstraction handles one tool-calling loop, while multi-agent coordination remains application code.',
      zh: '当你需要提供方中立的模型、工具与流式原语，并打算自己掌控控制流时，Vercel AI SDK 合适。它的 Agent 抽象处理单个工具调用循环，多智能体协作则保留在应用代码中。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want the orchestration handed to you rather than hand-built: a coordinator that plans the task DAG from a goal, mixed-model teams in one run, and a hard <code>maxTokenBudget</code> ceiling. And you don’t have to choose; run OMA over the AI SDK and keep the SDK’s provider layer underneath.',
      zh: 'open-multi-agent 适合你想要现成的编排、而非手工搭建：一个从目标出发规划任务 DAG 的协调器、一次运行里混编模型的团队，以及一道硬性 <code>maxTokenBudget</code> 上限。而且你不必二选一，把 OMA 跑在 AI SDK 之上，底下继续用 SDK 的提供方层。',
    },
  },
  {
    slug: 'voltagent',
    name: 'VoltAgent',
    repo: 'https://github.com/VoltAgent/voltagent',
    keywords: ['voltagent alternative', 'voltagent vs open multi agent', 'typescript agent observability framework', 'voltagent alternative nodejs'],
    seoDescription: {
      en: 'open-multi-agent vs VoltAgent: a lean 3-dependency goal-driven core versus an observability-first TypeScript framework with a bundled OpenTelemetry stack and supervisor/sub-agent networks. An honest, sourced comparison.',
      zh: 'open-multi-agent 对比 VoltAgent：精简到 3 个依赖、目标驱动的内核，对上一个可观测性优先、内置整套 OpenTelemetry、带 supervisor/子智能体网络的 TypeScript 框架。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'Both are TypeScript-native agent frameworks. VoltAgent leads with built-in observability and a supervisor/sub-agent structure; open-multi-agent leads with a lean core and goal-driven decomposition.',
      zh: '两者都是 TypeScript 原生的智能体框架。VoltAgent 以内置可观测性与 supervisor/子智能体结构为先；open-multi-agent 以精简内核与目标驱动的拆解为先。',
    },
    chooseThem: {
      en: 'You want tracing that works out of the box; a bundled OpenTelemetry stack; and a supervisor coordinating sub-agents, with workflows, memory, and RAG included.',
      zh: '你想要开箱即用的追踪，内置的整套 OpenTelemetry，以及一个协调子智能体的 supervisor，附带 workflow、记忆与 RAG。',
    },
    chooseUs: {
      en: 'You want a much smaller core (three dependencies vs ~44), goal-driven decomposition, token + estimated-cost ceilings, and an optional OTel adapter instead of a bundled OTel stack.',
      zh: '你想要小得多的 core（三个依赖 vs 约 44 个）、目标驱动的拆解、token + 估算成本上限，以及可选 OTel 适配器，而非一整套内置 OTel。',
    },
    them: {
      language: { en: 'TypeScript-native; runs on Node.js', zh: 'TypeScript 原生；运行于 Node.js' },
      paradigm: { en: 'Agents plus supervisor / sub-agent networks and workflows, with memory and RAG', zh: '智能体，加上 supervisor / 子智能体网络与 workflow，带记忆与 RAG' },
      deps: { en: '~44 direct in @voltagent/core; bundles the @ai-sdk provider set and a full OpenTelemetry stack', zh: '@voltagent/core 约 44 个直接依赖，内置整套 @ai-sdk 提供方与完整的 OpenTelemetry 栈' },
      mixedModel: { en: 'Yes; per-agent model via the AI SDK providers', zh: '支持，通过 AI SDK 提供方按智能体设模型' },
      budget: { en: 'No hard token cap; maxSteps limits agent steps', zh: '无硬性 token 上限，maxSteps 限制智能体步数' },
      observability: { en: 'Native OpenTelemetry; the core bundles the OTel SDK and auto-instruments agents', zh: '原生 OpenTelemetry，内核内置 OTel SDK 并自动为智能体埋点' },
    },
    howDiffer: {
      en: 'VoltAgent puts <em>observability first</em>: its core bundles a full OpenTelemetry stack and auto-instruments agents, and it structures work as a <em>supervisor</em> coordinating sub-agents, with memory, RAG, and workflows included. open-multi-agent keeps the core to three dependencies and puts its OTel mapping in the optional <code>@open-multi-agent/otel</code> package, which writes to an application-owned provider; TraceStore and the offline Run Viewer cover local persistence and inspection. Instead of a supervisor topology, OMA hands a coordinator a goal to decompose into a task DAG at runtime. The trade-off is still bundled batteries versus a smaller, composable core.',
      zh: 'VoltAgent 把<em>可观测性放在第一位</em>：内核内置整套 OpenTelemetry 栈、自动为智能体埋点，并把工作组织成一个 <em>supervisor</em> 协调子智能体，附带记忆、RAG 与 workflow。open-multi-agent 把 core 控制在三个依赖，并把 OTel 映射放进可选的 <code>@open-multi-agent/otel</code> 包，由它写入应用持有的 provider；TraceStore 与离线 Run Viewer 覆盖本地持久化和检查。OMA 不用 supervisor 拓扑，而是把目标交给协调器、在运行时拆解成任务 DAG。取舍仍是内置电池，对上更小、可组合的 core。',
    },
    whenThem: {
      en: 'VoltAgent fits when you want its bundled OpenTelemetry stack, supervisor and sub-agent model, memory, RAG, and workflows in one framework. That bundled surface comes with a larger dependency footprint.',
      zh: '当你需要框架内置的 OpenTelemetry 栈、supervisor 与子智能体模型、记忆、RAG 和 workflow 时，VoltAgent 合适。这些内置能力会带来更大的依赖规模。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want a lean core and goal-driven orchestration: three dependencies instead of ~44, a coordinator that plans the task DAG from a goal, token or estimated-cost ceilings, and OpenTelemetry through an optional first-party adapter rather than a bundled SDK. TraceStore and the offline Run Viewer provide local query and inspection paths.',
      zh: 'open-multi-agent 适合你想要精简 core 与目标驱动编排的场景：三个依赖而非约 44 个、一个从目标规划任务 DAG 的协调器、token 或估算成本上限，以及经可选一方适配器而非内置 SDK 接入的 OpenTelemetry。TraceStore 与离线 Run Viewer 提供本地查询和检查路径。',
    },
  },
  {
    slug: 'inngest-agentkit',
    name: 'Inngest AgentKit',
    repo: 'https://github.com/inngest/agent-kit',
    keywords: ['inngest agentkit alternative', 'agentkit vs open multi agent', 'deterministic agent routing typescript', 'inngest agentkit alternative nodejs'],
    seoDescription: {
      en: 'open-multi-agent vs Inngest AgentKit: runtime goal decomposition versus deterministic, state-based routing over agent networks running on Inngest. An honest, sourced comparison; and when each is the right call.',
      zh: 'open-multi-agent 对比 Inngest AgentKit：运行时的目标拆解，对上跑在 Inngest 之上、对智能体网络做确定性状态路由。一份诚实、可溯源的对比，以及各自何时更合适。',
    },
    lede: {
      en: 'Both build multi-agent systems in TypeScript. AgentKit routes a network of agents with deterministic, state-based logic on top of Inngest; open-multi-agent decomposes a goal into a task DAG at runtime.',
      zh: '两者都用 TypeScript 搭建多智能体系统。AgentKit 在 Inngest 之上，用确定性的状态路由来调度一张智能体网络；open-multi-agent 则在运行时把目标拆解成任务 DAG。',
    },
    chooseThem: {
      en: 'You want deterministic, inspectable routing you control, and durable, replayable execution; and you’re happy to run on Inngest.',
      zh: '你想要能自己掌控、确定且可审视的路由，以及可持久、可重放的执行，并且乐意跑在 Inngest 上。',
    },
    chooseUs: {
      en: 'You want the plan built at runtime instead of hand-authored routing, no Inngest dependency, and a hard token budget.',
      zh: '你想要计划在运行时自动生成、而非手写路由，不想引入 Inngest 依赖，还要一道硬性 token 预算。',
    },
    them: {
      language: { en: 'TypeScript-native; pre-1.0 (0.13)', zh: 'TypeScript 原生；pre-1.0（0.13）' },
      paradigm: { en: 'Multi-agent networks with deterministic, state-based routing; a router (code or model) picks the next agent', zh: '带确定性状态路由的多智能体网络，由一个路由器（代码或模型）挑选下一个智能体' },
      deps: { en: '6 direct; runs on Inngest for durable, replayable execution', zh: '6 个直接依赖；跑在 Inngest 上以获得可持久、可重放的执行' },
      mixedModel: { en: 'Yes; per-agent model via @inngest/ai adapters', zh: '支持，通过 @inngest/ai 适配器按智能体设模型' },
      budget: { en: 'No hard token cap; maxIter caps router iterations', zh: '无硬性 token 上限，maxIter 限制路由迭代次数' },
      observability: { en: 'Run traces via the Inngest platform it runs on', zh: '通过其运行所依托的 Inngest 平台获取运行链路' },
    },
    howDiffer: {
      en: 'AgentKit models work as a <em>network</em> of agents sharing state, with a <em>router</em>; code you write or a model you delegate to; deciding which agent runs next, capped by <code>maxIter</code>. It runs on Inngest, so execution is durable and replayable. open-multi-agent doesn’t ask you to author the routing: a coordinator decomposes the goal into a task DAG <em>at runtime</em> and parallelizes the independent nodes. AgentKit gives you explicit, deterministic control flow (and Inngest’s durability); OMA gives you a plan generated per goal and no orchestration service to run.',
      zh: 'AgentKit 把工作建模为一张共享状态的智能体<em>网络</em>，由一个<em>路由器</em>，你写的代码，或你委派的一个模型，决定下一个跑哪个智能体，并以 <code>maxIter</code> 封顶。它跑在 Inngest 上，所以执行可持久、可重放。open-multi-agent 不要求你编写路由：协调器<em>在运行时</em>把目标拆解成任务 DAG，并把相互独立的节点并行化。AgentKit 给你显式、确定的控制流（以及 Inngest 的持久性）；OMA 给你一份按目标生成的计划，且无需运行一个编排服务。',
    },
    whenThem: {
      en: 'Choose AgentKit when you want deterministic, inspectable routing you author yourself and Inngest’s durable, replayable execution underneath; valuable when a run must survive restarts and every routing decision should be explicit and reproducible. It’s pre-1.0, so expect some churn, and it assumes Inngest in your stack.',
      zh: '当你想要自己编写的、确定且可审视的路由，以及底下 Inngest 那种可持久、可重放的执行时，选 AgentKit，当一次运行必须扛过重启、且每个路由决策都要显式可复现时，这很有价值。它还在 pre-1.0，要预期一些变动，并且默认你的技术栈里有 Inngest。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you’d rather describe the goal than author the routing, and you want to stay dependency-light: the coordinator plans the task DAG at runtime, there’s no orchestration service to stand up, and <code>maxTokenBudget</code> gives a hard spend ceiling. Checkpoint/resume covers crash recovery at task granularity over any MemoryStore, without a separate durable-execution backend.',
      zh: 'open-multi-agent 适合你更愿意描述目标、而非编写路由，并且想保持依赖轻量：协调器在运行时规划任务 DAG，无需另立一个编排服务，<code>maxTokenBudget</code> 给出一道硬性花费上限。检查点/恢复在任意 MemoryStore 上以任务粒度覆盖崩溃恢复，无需一个单独的持久化执行后端。',
    },
  },
  {
    slug: 'langchain',
    name: 'LangChain',
    tier: 'primary',
    repo: 'https://github.com/langchain-ai/langchain',
    keywords: ['langchain alternative', 'langchain typescript alternative', 'langchain vs open multi agent', 'lightweight langchain alternative'],
    seoDescription: {
      en: 'open-multi-agent vs LangChain: a lean, goal-driven TypeScript runtime versus the broad LangChain framework and ecosystem (chains, agents, integrations; multi-agent orchestration lives in LangGraph). An honest, sourced comparison.',
      zh: 'open-multi-agent 对比 LangChain：精简、目标驱动的 TypeScript 运行时，对上庞大的 LangChain 框架与生态（链、智能体、集成；多智能体编排在 LangGraph 里）。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'LangChain is the broad framework and integration ecosystem; its multi-agent orchestration lives in LangGraph (compared separately). open-multi-agent is a focused, goal-driven, TypeScript-native runtime.',
      zh: 'LangChain 是那个庞大的框架与集成生态；它的多智能体编排在 LangGraph 里（我们单独对比）。open-multi-agent 则是一个专注、目标驱动、TypeScript 原生的运行时。',
    },
    chooseThem: {
      en: 'You want LangChain’s chains, integration catalog, and LangSmith tracing in Python or LangChain.js.',
      zh: '你需要 LangChain 的链、集成目录与 LangSmith 追踪，并在 Python 或 LangChain.js 上构建。',
    },
    chooseUs: {
      en: 'You want a focused TypeScript orchestration runtime with dynamic and explicit DAGs, mixed-model teams, approvals, recovery, budgets, and local inspection.',
      zh: '你需要一个专注的 TypeScript 编排运行时，具备动态与显式 DAG、混合模型团队、审批、恢复、预算和本地检查能力。',
    },
    them: {
      language: { en: 'Python-first; a JavaScript/TypeScript port (LangChain.js) also exists', zh: 'Python 优先；也有 JavaScript/TypeScript 移植（LangChain.js）' },
      paradigm: { en: 'Chains + tool-calling agents (the classic AgentExecutor now lives in langchain_classic); the modern orchestration path is LangGraph', zh: '链 + 工具调用智能体（经典的 AgentExecutor 现已移入 langchain_classic）；现代的编排路径是 LangGraph' },
      deps: { en: '~8 direct in the langchain package (atop langchain-core); the wider integration ecosystem is very large', zh: 'langchain 包约 8 个直接依赖（在 langchain-core 之上）；更外围的集成生态非常庞大' },
      mixedModel: { en: 'Yes; per-agent / per-chain model', zh: '支持，按智能体 / 按链设模型' },
      budget: { en: 'No hard token cap; AgentExecutor max_iterations counts steps', zh: '无硬性 token 上限，AgentExecutor 的 max_iterations 计的是步数' },
      observability: { en: 'First-party LangSmith tracing', zh: '一方 LangSmith 链路追踪' },
    },
    howDiffer: {
      en: 'LangChain provides chains, integrations, and tool-calling agents. The classic <code>AgentExecutor</code> now sits under <code>langchain_classic</code>, while its multi-agent orchestration path is <em>LangGraph</em>. open-multi-agent focuses on TypeScript orchestration through dynamic or explicit task DAGs. For graph authoring specifically, the LangGraph comparison is the closer one.',
      zh: 'LangChain 提供链、集成与工具调用智能体。经典的 <code>AgentExecutor</code> 现已归入 <code>langchain_classic</code>，多智能体编排路径则是 <em>LangGraph</em>。open-multi-agent 专注于通过动态或显式任务 DAG 完成 TypeScript 编排。若要比较图的编写方式，LangGraph 那篇更贴近。',
    },
    whenThem: {
      en: 'LangChain fits when your application depends on its existing chains, prompt tooling, integrations, or LangSmith tracing. Python is its primary surface, with LangChain.js available for JavaScript and TypeScript projects.',
      zh: '当应用依赖 LangChain 现有的链、提示工具、集成或 LangSmith 追踪时，LangChain 合适。Python 是其主要载体，JavaScript 与 TypeScript 项目可使用 LangChain.js。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you don’t want a broad framework; just a lean, goal-driven multi-agent runtime that plans the task DAG for you, stays TypeScript-native with three dependencies, and enforces a hard <code>maxTokenBudget</code>. For the orchestration-model question specifically, compare against LangGraph.',
      zh: 'open-multi-agent 适合你不想要一个庞大框架、只想要一个精简、目标驱动的多智能体运行时的场景，它替你规划任务 DAG，保持 TypeScript 原生、三个依赖，并强制一道硬性 <code>maxTokenBudget</code>。若专门就编排范式发问，请对比 LangGraph。',
    },
  },
  {
    slug: 'llamaindex',
    name: 'LlamaIndex',
    repo: 'https://github.com/run-llama/llama_index',
    keywords: ['llamaindex alternative', 'llamaindex vs open multi agent', 'llamaindex agent workflow alternative', 'rag agent framework'],
    seoDescription: {
      en: 'open-multi-agent vs LlamaIndex: an orchestration-first TypeScript runtime versus a RAG/data-first Python framework that grew agent workflows. An honest, sourced comparison; and when each is the right call.',
      zh: 'open-multi-agent 对比 LlamaIndex：编排优先的 TypeScript 运行时，对上一个 RAG / 数据优先、后来长出智能体 workflow 的 Python 框架。一份诚实、可溯源的对比，以及各自何时更合适。',
    },
    lede: {
      en: 'LlamaIndex started as a data/RAG framework and grew agent workflows on top; open-multi-agent starts from orchestration. If your problem is retrieval over your data, they lead from opposite ends.',
      zh: 'LlamaIndex 起步于数据 / RAG 框架，后来在其上长出智能体 workflow；open-multi-agent 则从编排出发。如果你的问题是「在自己的数据上做检索」，两者从相反的一端切入。',
    },
    chooseThem: {
      en: 'Your core problem is RAG over your own data; indexing, retrieval, query engines; and you want agents that build on that, in Python.',
      zh: '你的核心问题是在自己的数据上做 RAG，索引、检索、查询引擎，并且想要在其之上构建的智能体，用 Python。',
    },
    chooseUs: {
      en: 'Your core problem is coordinating several agents, dependencies, approvals, and recovery steps in TypeScript. You can connect the retrieval layer you already use.',
      zh: '你的核心问题是在 TypeScript 中协调多个智能体、依赖、审批与恢复步骤，并接入你已经采用的检索层。',
    },
    them: {
      language: { en: 'Python; a TypeScript port (LlamaIndex.TS) also exists', zh: 'Python；也有 TypeScript 移植（LlamaIndex.TS）' },
      paradigm: { en: 'Data / RAG-first (indexing, retrieval, query engines) plus agent workflows (AgentWorkflow, FunctionAgent)', zh: '数据 / RAG 优先（索引、检索、查询引擎），加上智能体 workflow（AgentWorkflow、FunctionAgent）' },
      deps: { en: '~29 direct in llama-index-core (RAG-oriented: numpy, nltk, tiktoken, networkx, …)', zh: 'llama-index-core 约 29 个直接依赖（面向 RAG：numpy、nltk、tiktoken、networkx…）' },
      mixedModel: { en: 'Yes; per-agent model', zh: '支持，按智能体设模型' },
      budget: { en: 'No hard token cap', zh: '无硬性 token 上限' },
      observability: { en: 'An instrumentation module plus integrations (Arize, Langfuse, and others)', zh: '一个 instrumentation 模块，加上集成（Arize、Langfuse 等）' },
    },
    howDiffer: {
      en: 'LlamaIndex is <em>retrieval-first</em>: its center of gravity is indexing your data and querying it, with agent workflows layered on top. open-multi-agent is <em>orchestration-first</em>: it decomposes a goal into a task DAG and coordinates agents, and leaves retrieval to you. They overlap only at the edges; a RAG-heavy application leans toward LlamaIndex; a multi-agent coordination problem leans toward OMA. LlamaIndex carries ~29 core dependencies for all that data tooling; OMA carries three.',
      zh: 'LlamaIndex 是<em>检索优先</em>的：它的重心在于把你的数据建索引并查询，智能体 workflow 叠在上面。open-multi-agent 是<em>编排优先</em>的：它把目标拆解成任务 DAG 并协调智能体，检索交给你。两者只在边缘重叠，RAG 重的应用偏向 LlamaIndex；多智能体协调问题偏向 OMA。LlamaIndex 为那套数据工具带着约 29 个内核依赖；OMA 是三个。',
    },
    whenThem: {
      en: 'LlamaIndex fits when retrieval over your own data is the main problem and you want its loaders, indexes, retrievers, query engines, and agent workflows in the same stack.',
      zh: '当核心问题是在自己的数据上做检索，并希望加载器、索引、检索器、查询引擎与智能体 workflow 位于同一技术栈中时，LlamaIndex 合适。',
    },
    whenUs: {
      en: 'open-multi-agent fits when orchestration is the heart of the problem: a coordinator that decomposes a goal into a parallel task DAG, TypeScript-native, three dependencies, and a hard <code>maxTokenBudget</code>. It doesn’t ship retrieval; you bring whatever RAG or tools you like; which keeps the core small and the orchestration general.',
      zh: 'open-multi-agent 适合编排是问题核心的场景：一个把目标拆成并行任务 DAG 的协调器、TypeScript 原生、三个依赖、一道硬性 <code>maxTokenBudget</code>。它不自带检索，RAG 或工具你随意带，这让内核保持小、编排保持通用。',
    },
  },
  {
    slug: 'pydantic-ai',
    name: 'Pydantic AI',
    repo: 'https://github.com/pydantic/pydantic-ai',
    keywords: ['pydantic ai alternative', 'pydantic ai typescript alternative', 'pydantic ai vs open multi agent', 'type-safe agent framework'],
    seoDescription: {
      en: 'open-multi-agent vs Pydantic AI: task-DAG orchestration in TypeScript versus a type-safe Python agent framework with OpenTelemetry instrumentation and usage limits. A sourced comparison of mechanisms, controls, and fit.',
      zh: 'open-multi-agent 对比 Pydantic AI：TypeScript 任务 DAG 编排，对上一个类型安全、带 OpenTelemetry 埋点与用量上限的 Python 智能体框架。对机制、控制与适用场景做可溯源的对比。',
    },
    lede: {
      en: 'Pydantic AI applies Pydantic validation to agents and instruments them through Logfire; open-multi-agent uses task DAGs in a TypeScript runtime. The main differences are language and orchestration model.',
      zh: 'Pydantic AI 把 Pydantic 校验应用于智能体，并通过 Logfire 埋点；open-multi-agent 则在 TypeScript 运行时中使用任务 DAG。主要差别是语言与编排模型。',
    },
    chooseThem: {
      en: 'You’re in Python and want validated agent I/O, Logfire instrumentation, and built-in usage limits.',
      zh: '你在 Python 中，需要经过校验的智能体输入输出、Logfire 埋点与内置用量上限。',
    },
    chooseUs: {
      en: 'You want TypeScript-native, goal-driven multi-agent orchestration; a coordinator that builds the task DAG from a goal; with a hard, run-aborting token budget.',
      zh: '你想要 TypeScript 原生、目标驱动的多智能体编排，一个从目标构建任务 DAG 的协调器，外加一道会中止运行的硬性 token 预算。',
    },
    them: {
      language: { en: 'Python-native (built on Pydantic); no TypeScript port', zh: 'Python 原生（构建于 Pydantic 之上）；无 TypeScript 移植' },
      paradigm: { en: 'Type-safe, model-agnostic agents with tool calling and dependency injection; multi-agent via delegation and pydantic-graph', zh: '类型安全、提供方无关的智能体，带工具调用与依赖注入；多智能体通过委派与 pydantic-graph 实现' },
      deps: { en: 'A slim core (pydantic-ai-slim); model provider SDKs are optional extras', zh: '一个精简内核（pydantic-ai-slim）；模型提供方 SDK 是可选 extras' },
      mixedModel: { en: 'Yes; model-agnostic, per-agent model', zh: '支持，提供方无关，按智能体设模型' },
      budget: { en: 'Yes; UsageLimits includes total_tokens_limit, which raises before you overspend (one of the few here with a real token limit)', zh: '支持，UsageLimits 含 total_tokens_limit，超支前即抛错（这里少数带真正 token 上限的之一）' },
      observability: { en: 'Native OpenTelemetry via Pydantic Logfire (instrumentation built in)', zh: '经 Pydantic Logfire 的原生 OpenTelemetry（内置埋点）' },
    },
    howDiffer: {
      en: 'Pydantic AI provides validated inputs and outputs, dependency injection, model-agnostic agents, and Logfire instrumentation. Its <code>UsageLimits(total_tokens_limit=…)</code> caps a single agent run. open-multi-agent differs in language and orchestration shape: its TypeScript coordinator builds a parallel task DAG, and <code>maxTokenBudget</code> caps the whole DAG run.',
      zh: 'Pydantic AI 提供经校验的输入输出、依赖注入、提供方无关的智能体，以及 Logfire 埋点。它的 <code>UsageLimits(total_tokens_limit=…)</code> 作用于单次 agent run。open-multi-agent 的差别在语言与编排形态：TypeScript 协调器构建并行任务 DAG，<code>maxTokenBudget</code> 则封顶整次 DAG 运行。',
    },
    whenThem: {
      en: 'Pydantic AI fits Python projects that want validated agent I/O, dependency injection, Logfire tracing, and built-in usage limits. Its multi-agent patterns use delegation and pydantic-graph.',
      zh: '当 Python 项目需要经过校验的智能体输入输出、依赖注入、Logfire 追踪与内置用量上限时，Pydantic AI 合适。它的多智能体模式使用委派与 pydantic-graph。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want TypeScript-native, goal-driven multi-agent orchestration: the coordinator plans a parallel task DAG from the goal rather than you wiring delegation, and <code>maxTokenBudget</code> aborts the entire run at a hard ceiling. If you’re in Node rather than Python, OMA keeps you there.',
      zh: 'open-multi-agent 适合你想要 TypeScript 原生、目标驱动的多智能体编排：协调器从目标规划一张并行任务 DAG，而非你去接线委派，<code>maxTokenBudget</code> 在硬上限处中止整个运行。若你在 Node 而非 Python，OMA 让你留在这里。',
    },
  },
  {
    slug: 'google-adk',
    name: 'Google ADK',
    repo: 'https://github.com/google/adk-python',
    keywords: ['google adk alternative', 'agent development kit alternative', 'google adk vs open multi agent', 'google adk typescript alternative'],
    seoDescription: {
      en: 'open-multi-agent vs the Google Agent Development Kit (ADK): a lean, provider-neutral TypeScript runtime versus a code-first Python toolkit with explicit workflow agents and a Google Cloud deploy story. An honest, sourced comparison.',
      zh: 'open-multi-agent 对比谷歌 Agent Development Kit（ADK）：精简、提供方中立的 TypeScript 运行时，对上一个 code-first、带显式 workflow 智能体与 Google Cloud 部署路径的 Python 工具包。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'Google’s ADK is a code-first Python toolkit with explicit workflow agents and a path to Vertex AI deployment; open-multi-agent is a TypeScript-native, provider-neutral runtime that plans the workflow from a goal.',
      zh: '谷歌的 ADK 是一个 code-first 的 Python 工具包，带显式的 workflow 智能体与通往 Vertex AI 部署的路径；open-multi-agent 则是一个 TypeScript 原生、提供方中立、从目标规划工作流的运行时。',
    },
    chooseThem: {
      en: 'You’re on Google Cloud / Gemini, want explicit workflow agents (sequential, parallel, loop) you compose, and a managed deploy target (Vertex Agent Engine).',
      zh: '你在 Google Cloud / Gemini 上，想要你自己组合的显式 workflow 智能体（顺序、并行、循环），以及一个托管的部署目标（Vertex Agent Engine）。',
    },
    chooseUs: {
      en: 'You want a TypeScript-native, provider-neutral runtime that decomposes a goal at runtime; no web-server or cloud stack pulled in; with a lean core and a hard token budget.',
      zh: '你想要一个 TypeScript 原生、提供方中立、在运行时拆解目标的运行时，不拉进 web 服务器或云栈，内核精简、带硬性 token 预算。',
    },
    them: {
      language: { en: 'Python-first (a Java port exists); no TypeScript', zh: 'Python 优先（有 Java 移植）；无 TypeScript' },
      paradigm: { en: 'Code-first agents: an LlmAgent plus explicit workflow agents (SequentialAgent, ParallelAgent, LoopAgent) and multi-agent hierarchies', zh: 'code-first 智能体：一个 LlmAgent，加上显式的 workflow 智能体（SequentialAgent、ParallelAgent、LoopAgent）与多智能体层级' },
      deps: { en: '~24 direct; includes a FastAPI/Uvicorn web stack, google-genai, google-auth, and OpenTelemetry', zh: '约 24 个直接依赖，含 FastAPI/Uvicorn web 栈、google-genai、google-auth 与 OpenTelemetry' },
      mixedModel: { en: 'Yes; Gemini-first, other providers via LiteLLM', zh: '支持，Gemini 优先，其它提供方经 LiteLLM' },
      budget: { en: 'No hard token cap; LoopAgent bounds iterations, not tokens', zh: '无硬性 token 上限，LoopAgent 限制的是迭代次数，不是 token' },
      observability: { en: 'OpenTelemetry, with Google Cloud Trace integration', zh: 'OpenTelemetry，带 Google Cloud Trace 集成' },
    },
    howDiffer: {
      en: 'ADK is <em>code-first and explicit</em>: you compose an <code>LlmAgent</code> with workflow agents; <code>SequentialAgent</code>, <code>ParallelAgent</code>, <code>LoopAgent</code>; into a hierarchy, and it carries a FastAPI-based serving and Google Cloud deploy story. open-multi-agent doesn’t ask you to lay out the workflow: a coordinator decomposes the goal into a task DAG at runtime and parallelizes it. ADK is Gemini-first (other models via LiteLLM) and pulls a web-server stack into its ~24 dependencies; OMA is provider-neutral, three dependencies, and ships no server.',
      zh: 'ADK 是<em>code-first 且显式</em>的：你把一个 <code>LlmAgent</code> 和 workflow 智能体，<code>SequentialAgent</code>、<code>ParallelAgent</code>、<code>LoopAgent</code>，组合成一个层级，并带着一套基于 FastAPI 的服务与 Google Cloud 部署路径。open-multi-agent 不要求你铺开工作流：协调器在运行时把目标拆解成任务 DAG 并并行化。ADK 是 Gemini 优先（其它模型经 LiteLLM），并把一套 web 服务器栈拉进它约 24 个依赖里；OMA 提供方中立、三个依赖，且不带服务器。',
    },
    whenThem: {
      en: 'ADK fits Google Cloud projects that want explicit sequential, parallel, and loop agents, Gemini integration, evaluation tooling, and a first-party deployment path to Vertex AI.',
      zh: '当 Google Cloud 项目需要显式的顺序、并行与循环智能体、Gemini 集成、评估工具，以及部署到 Vertex AI 的一方路径时，ADK 合适。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you’d rather describe the goal than assemble workflow agents, want to stay provider-neutral and TypeScript-native, and don’t want a web-server or cloud stack in your dependencies. The coordinator plans the task DAG at runtime, the core is three dependencies, and <code>maxTokenBudget</code> gives a hard spend ceiling.',
      zh: 'open-multi-agent 适合你更愿意描述目标、而非拼装 workflow 智能体，想保持提供方中立与 TypeScript 原生，且不想让依赖里出现 web 服务器或云栈。协调器在运行时规划任务 DAG，内核三个依赖，<code>maxTokenBudget</code> 给出一道硬性花费上限。',
    },
  },
  {
    slug: 'semantic-kernel',
    name: 'Semantic Kernel',
    repo: 'https://github.com/microsoft/semantic-kernel',
    keywords: ['semantic kernel alternative', 'microsoft agent framework alternative', 'semantic kernel vs open multi agent', 'semantic kernel typescript alternative'],
    seoDescription: {
      en: 'open-multi-agent vs Microsoft Semantic Kernel: a lean, TypeScript-native goal-driven runtime versus Microsoft’s enterprise LLM SDK (C#-first), now converging into the Microsoft Agent Framework. An honest, sourced comparison.',
      zh: 'open-multi-agent 对比微软 Semantic Kernel：精简、TypeScript 原生、目标驱动的运行时，对上微软的企业级 LLM SDK（C# 优先），它正并入 Microsoft Agent Framework。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'Semantic Kernel is Microsoft’s enterprise LLM SDK for .NET, Python, and Java; open-multi-agent is a TypeScript-native task-DAG runtime. Microsoft is now converging its agent work into the Microsoft Agent Framework.',
      zh: 'Semantic Kernel 是微软面向 .NET、Python 与 Java 的企业级 LLM SDK；open-multi-agent 则是 TypeScript 原生的任务 DAG 运行时。微软正把其智能体工作并入 Microsoft Agent Framework。',
    },
    chooseThem: {
      en: 'You’re in the Microsoft / .NET / Azure ecosystem and want a first-party SDK; plugins, functions, agents; with a supported path forward via the Microsoft Agent Framework.',
      zh: '你在微软 / .NET / Azure 生态里，想要一个一方 SDK，插件、函数、智能体，并有一条经 Microsoft Agent Framework 的受支持前进路径。',
    },
    chooseUs: {
      en: 'You’re in Node/TypeScript and want a lean, provider-neutral, goal-driven runtime with three dependencies and a hard token budget; no .NET, no Azure assumption.',
      zh: '你在 Node/TypeScript 里，想要一个精简、提供方中立、目标驱动的运行时，三个依赖、一道硬性 token 预算，不带 .NET、不假设 Azure。',
    },
    them: {
      language: { en: '.NET / C#-first; first-party Python and Java; no TypeScript', zh: '.NET / C# 优先；一方支持 Python 与 Java；无 TypeScript' },
      paradigm: { en: 'Plugins / functions plus agents; multi-agent orchestration is moving to the Microsoft Agent Framework', zh: '插件 / 函数，加上智能体；多智能体编排正迁往 Microsoft Agent Framework' },
      deps: { en: '~22 direct in the Python package; the newer Agent Framework core is much leaner (~4)', zh: 'Python 包约 22 个直接依赖；更新的 Agent Framework 内核精简得多（约 4 个）' },
      mixedModel: { en: 'Yes; per-agent model / service', zh: '支持，按智能体设模型 / 服务' },
      budget: { en: 'No hard token cap', zh: '无硬性 token 上限' },
      observability: { en: 'Native OpenTelemetry', zh: '原生 OpenTelemetry' },
    },
    note: {
      en: 'Heads-up: in 2026 Microsoft began converging <strong>Semantic Kernel</strong> and <strong>AutoGen</strong> into the new <strong>Microsoft Agent Framework</strong> (Python + .NET) as the go-forward multi-agent stack. Semantic Kernel remains supported, but if you’re choosing for a new, long-lived project, weigh building on the Agent Framework directly.',
      zh: '提醒：2026 年微软开始把 <strong>Semantic Kernel</strong> 与 <strong>AutoGen</strong> 并入新的 <strong>Microsoft Agent Framework</strong>（Python + .NET），作为其前进方向的多智能体栈。Semantic Kernel 仍受支持，但若你在为一个全新、长期的项目做选择，值得掂量是否直接构建在 Agent Framework 上。',
    },
    howDiffer: {
      en: 'Semantic Kernel provides plugins, functions, planners, and agents. It is built C#-first with first-party Python and Java support, and integrates with Microsoft and Azure services. Its multi-agent direction is the <em>Microsoft Agent Framework</em>, which unifies SK and AutoGen. open-multi-agent is a TypeScript-native runtime that decomposes a goal into a task DAG at runtime, assumes no particular cloud, and carries three direct dependencies.',
      zh: 'Semantic Kernel 是一个<em>企业级 SDK</em>，提供插件、函数、planner 与智能体，以 C# 优先构建，一方支持 Python 与 Java，并接入微软与 Azure 技术栈。它的多智能体方向是统一 SK 与 AutoGen 的 <em>Microsoft Agent Framework</em>。open-multi-agent 则是 TypeScript 原生的运行时，在运行时把目标拆解成任务 DAG，不假设特定云，并保持三个直接依赖。选择主要取决于 .NET 与 Azure，还是 Node.js 与 TypeScript。',
    },
    whenThem: {
      en: 'Semantic Kernel or the Microsoft Agent Framework fits .NET and Azure projects that require Microsoft-supported SDKs, Azure integrations, and native OpenTelemetry.',
      zh: '当 .NET 与 Azure 项目需要微软支持的 SDK、Azure 集成与原生 OpenTelemetry 时，Semantic Kernel 或 Microsoft Agent Framework 合适。',
    },
    whenUs: {
      en: 'open-multi-agent fits when your stack is Node/TypeScript and you want to stay there: a lean, provider-neutral, goal-driven runtime with three dependencies and a hard <code>maxTokenBudget</code>, with no .NET runtime or Azure assumption. The coordinator plans the task DAG from a goal instead of you assembling plugins and planners.',
      zh: 'open-multi-agent 适合你的技术栈是 Node/TypeScript、且想留在这里的场景：一个精简、提供方中立、目标驱动的运行时，三个依赖、一道硬性 <code>maxTokenBudget</code>，不带 .NET 运行时、不假设 Azure。协调器从目标规划任务 DAG，而非你去拼装插件与 planner。',
    },
  },
];

export const COMPARE_SLUGS: readonly string[] = COMPARISONS.map((c) => c.slug);

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
