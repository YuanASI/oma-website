// Comparison-page data (§7.2) — the source for /compare/<slug> and the /compare
// hub. One dynamic template (src/pages/[...locale]/compare/[competitor].astro)
// renders every entry, so adding a framework is a data edit, not a new page.
//
// HONESTY DISCIPLINE (red-line §1). Every competitor cell below was verified in
// July 2026 against a PRIMARY source — the framework's own pyproject.toml /
// package.json (dependency counts), its docs (paradigm, budget, tracing), and
// the PyPI/npm registry (latest version, license) — not from memory. OMA's
// column was verified against open-multi-agent core v1.9.0 source + docs. The
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
    oma: { en: 'TypeScript-native — embeds in any Node.js 18+ backend', zh: 'TypeScript 原生——可嵌入任意 Node.js 18+ 后端' },
  },
  {
    key: 'paradigm',
    label: { en: 'Orchestration model', zh: '编排范式' },
    oma: { en: 'Goal-first — a coordinator decomposes the goal into a task DAG at runtime', zh: '目标优先——协调器在运行时把目标拆解成任务 DAG' },
  },
  {
    key: 'deps',
    label: { en: 'Runtime dependencies', zh: '运行时依赖' },
    oma: { en: '3 direct (Anthropic SDK, OpenAI SDK, Zod); extra providers + MCP are opt-in peers', zh: '3 个直接依赖（Anthropic SDK、OpenAI SDK、Zod）；额外提供方与 MCP 为按需 peer 依赖' },
  },
  {
    key: 'mixedModel',
    label: { en: 'Mixed-model teams', zh: '模型混编' },
    oma: { en: 'Yes — each agent names its own model in one team', zh: '支持——同一个团队里每个智能体各自指定模型' },
  },
  {
    key: 'budget',
    label: { en: 'Token-budget control', zh: 'Token 预算控制' },
    oma: { en: 'Hard cap — maxTokenBudget aborts the run and skips remaining tasks', zh: '硬上限——maxTokenBudget 中止运行并跳过剩余任务' },
  },
  {
    key: 'observability',
    label: { en: 'Observability', zh: '可观测性' },
    oma: { en: 'onTrace spans you forward to OTel / Datadog / Langfuse, plus a self-contained post-run HTML dashboard', zh: 'onTrace span 由你转发到 OTel / Datadog / Langfuse，另有一个自包含的运行后 HTML 仪表盘' },
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
  /** Target search terms — English, invariant (what people actually type). */
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
      en: 'open-multi-agent vs LangGraph: goal-first task-DAG decomposition versus a declarative state graph. An honest, sourced comparison of language, orchestration model, dependencies, budget control, and observability — and when to pick each.',
      zh: 'open-multi-agent 对比 LangGraph：目标优先的任务 DAG 拆解，对上声明式状态图。就语言、编排范式、依赖、预算控制与可观测性做一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'LangGraph and open-multi-agent approach multi-agent orchestration from opposite ends: LangGraph runs a graph you define; open-multi-agent decomposes a goal you describe.',
      zh: 'LangGraph 与 open-multi-agent 从两端切入多智能体编排：LangGraph 运行你定义好的图，open-multi-agent 拆解你描述的目标。',
    },
    chooseThem: {
      en: 'You want a fixed graph you control node-by-node, and a deep, battle-tested persistence + time-travel ecosystem.',
      zh: '你想要一张能逐节点掌控的固定图，以及成熟、久经考验的持久化与时间回溯生态。',
    },
    chooseUs: {
      en: 'You want to hand over a goal and have the plan built at runtime — in TypeScript, with three dependencies and a hard token cap.',
      zh: '你想交出一个目标、让计划在运行时自动生成——用 TypeScript、三个依赖，外加一道硬性 token 上限。',
    },
    them: {
      language: { en: 'Python-first; first-party TypeScript port (@langchain/langgraph) is GA', zh: 'Python 优先；官方 TypeScript 移植（@langchain/langgraph）已 GA' },
      paradigm: { en: 'Graph-first — you define nodes and edges over shared state (StateGraph)', zh: '图优先——你在共享状态之上定义节点与边（StateGraph）' },
      deps: { en: '6 direct (Python) / 4 direct + 2 peers (JS)', zh: '6 个直接依赖（Python）/ 4 直接 + 2 peer（JS）' },
      mixedModel: { en: 'Yes — bind a distinct model inside each node', zh: '支持——在每个节点内绑定不同的模型' },
      budget: { en: 'No token cap — recursion_limit counts steps, not tokens', zh: '无 token 上限——recursion_limit 计的是步数，不是 token' },
      observability: { en: 'First-party LangSmith tracing (near-zero-config) + OpenTelemetry export', zh: '一方 LangSmith 链路追踪（近乎零配置）+ OpenTelemetry 导出' },
    },
    howDiffer: {
      en: 'LangGraph compiles a declarative graph — nodes, edges, conditional routing — into an invokable you run. open-multi-agent runs a coordinator that decomposes the goal into a task DAG <em>at runtime</em> and auto-parallelizes the independent nodes. Same destination, opposite directions: graph-first versus goal-first. Both checkpoint and resume — OMA snapshots completed tasks over any <code>MemoryStore</code> and resumes after a crash with <code>restore()</code>, though recovery is task-grained (a task interrupted mid-run re-runs from its start). LangGraph’s persistence and time-travel tooling is deeper and more mature.',
      zh: 'LangGraph 把一张声明式的图——节点、边、条件路由——编译成一个可调用对象供你运行。open-multi-agent 则运行一个协调器，<em>在运行时</em>把目标拆解成任务 DAG，并自动并行相互独立的节点。终点相同，方向相反：图优先，对上目标优先。两者都能检查点与恢复——OMA 在任意 <code>MemoryStore</code> 上为已完成任务打快照，崩溃后用 <code>restore()</code> 恢复，不过恢复是按任务粒度的（运行中被打断的任务会从头重跑）。LangGraph 的持久化与时间回溯工具更深、更成熟。',
    },
    whenThem: {
      en: 'Reach for LangGraph when the orchestration topology is known and you want to lay it out explicitly, or when durable state history and time-travel debugging over that graph are the deciding factors. Its TypeScript port is GA and its persistence ecosystem is more mature than OMA’s, and if your team already lives in LangChain, that gravity is real and worth respecting.',
      zh: '当编排拓扑已经确定、你想把它显式铺开，或者持久化的状态历史与在图上做时间回溯调试是决定性因素时，选 LangGraph。它的 TypeScript 移植已 GA，持久化生态也比 OMA 成熟；如果你的团队本就在 LangChain 生态里，那份惯性是真实的，值得尊重。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you’d rather describe the outcome than wire the graph — the coordinator plans the task DAG at runtime, so the orchestration adapts to each goal instead of being hand-built for one. It’s TypeScript-native with three runtime dependencies, and it ships a hard <code>maxTokenBudget</code> cap that aborts a run before it overspends — a guardrail LangGraph doesn’t offer at the token level.',
      zh: 'open-multi-agent 适合你更愿意描述结果、而非接线图的场景——协调器在运行时规划任务 DAG，于是编排随每个目标自适应，而不是为某一个手工搭好。它 TypeScript 原生、只有三个运行时依赖，并自带一道硬性 <code>maxTokenBudget</code> 上限，会在超支前中止运行——这是 LangGraph 在 token 层面没有提供的护栏。',
    },
  },
  {
    slug: 'crewai',
    name: 'CrewAI',
    repo: 'https://github.com/crewAIInc/crewAI',
    keywords: ['crewai alternative', 'crewai vs open multi agent', 'crewai typescript alternative', 'crewai alternative nodejs'],
    seoDescription: {
      en: 'open-multi-agent vs CrewAI: a lean 3-dependency TypeScript runtime versus a batteries-included Python framework of role-based crews. An honest, sourced comparison — and when each is the right call.',
      zh: 'open-multi-agent 对比 CrewAI：精简到 3 个依赖的 TypeScript 运行时，对上开箱即全、基于角色 crew 的 Python 框架。一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'CrewAI is the mature role-based multi-agent framework in Python; open-multi-agent is goal-driven and TypeScript-native. The orchestration surface is comparable — the real choice is your language stack.',
      zh: 'CrewAI 是 Python 里成熟的、基于角色的多智能体框架；open-multi-agent 则目标驱动、TypeScript 原生。两者的编排能力面相当——真正要选的是你的语言栈。',
    },
    chooseThem: {
      en: 'You’re in Python and want a batteries-included toolkit — role-based crews, built-in memory and RAG, a large ecosystem.',
      zh: '你在 Python 里，想要一套开箱即全的工具包——基于角色的 crew、内置记忆与 RAG、庞大的生态。',
    },
    chooseUs: {
      en: 'Your backend is TypeScript and you want a lean core (three dependencies) with goal-driven decomposition and a hard token budget.',
      zh: '你的后端是 TypeScript，想要一个精简内核（三个依赖）、目标驱动的拆解，以及硬性 token 预算。',
    },
    them: {
      language: { en: 'Python only (3.10+); no official TypeScript port', zh: '仅 Python（3.10+）；无官方 TypeScript 移植' },
      paradigm: { en: 'Role-based crews under a sequential or hierarchical process', zh: '基于角色的 crew，在顺序或分层 process 下运行' },
      deps: { en: '~30 direct dependencies, plus many optional extras', zh: '约 30 个直接依赖，另有大量可选 extras' },
      mixedModel: { en: 'Yes — per-agent llm= (native SDKs, LiteLLM for the rest)', zh: '支持——按智能体设 llm=（原生 SDK，其余走 LiteLLM）' },
      budget: { en: 'No hard cap — max_rpm / max_iter limits + post-hoc usage metrics', zh: '无硬上限——max_rpm / max_iter 限制 + 事后用量统计' },
      observability: { en: 'Native event bus; forward to Langfuse / OpenLIT / MLflow / others', zh: '原生事件总线；转发到 Langfuse / OpenLIT / MLflow 等' },
    },
    howDiffer: {
      en: 'CrewAI organizes work around role-playing agents grouped into a <em>crew</em> that runs sequentially or hierarchically, with memory and RAG built in. open-multi-agent hands a coordinator a goal and lets it decompose that goal into a task DAG at runtime, running independent tasks in parallel. The orchestration surface is roughly comparable; the decision is mostly the language stack — Python versus TypeScript — and how lean you want the dependency footprint (CrewAI pulls in ~30 direct dependencies; OMA, three).',
      zh: 'CrewAI 围绕扮演角色的智能体来组织工作，把它们编成一个顺序或分层运行的 <em>crew</em>，并内置记忆与 RAG。open-multi-agent 则把目标交给协调器，让它在运行时把目标拆解成任务 DAG，并行运行相互独立的任务。两者的编排能力面大致相当；决策主要在语言栈——Python 还是 TypeScript——以及你想要多精简的依赖足迹（CrewAI 拉入约 30 个直接依赖，OMA 是三个）。',
    },
    whenThem: {
      en: 'Choose CrewAI when your stack is Python and you want a batteries-included framework: built-in memory, RAG, a big library of integrations, and an established community. Its role-and-process model is a natural fit when you think in terms of a crew of specialists with defined jobs. The dependency footprint is heavier, but you get a lot in the box.',
      zh: '当你的技术栈是 Python、且想要一个开箱即全的框架时，选 CrewAI：内置记忆、RAG、庞大的集成库，以及成熟的社区。当你习惯用「一支各司其职的专家 crew」来思考时，它的角色—流程模型很贴合。依赖足迹更重，但你在开箱时就得到很多。',
    },
    whenUs: {
      en: 'open-multi-agent fits when your backend is TypeScript and you want to stay there — no Python service to stand up beside your Node app. The core is deliberately small (three runtime dependencies; extra providers and MCP load only when you opt in), the coordinator plans the work from a goal, and <code>maxTokenBudget</code> gives you a hard spend ceiling that aborts the run.',
      zh: 'open-multi-agent 适合你的后端是 TypeScript、且想一直待在这里的场景——无需在 Node 应用旁再立一个 Python 服务。内核刻意做得很小（三个运行时依赖；额外提供方与 MCP 仅在你按需启用时才加载），协调器从目标出发规划工作，<code>maxTokenBudget</code> 则给你一道会中止运行的硬性花费上限。',
    },
  },
  {
    slug: 'autogen',
    name: 'AutoGen',
    repo: 'https://github.com/microsoft/autogen',
    keywords: ['autogen alternative', 'autogen typescript alternative', 'autogen vs open multi agent', 'conversation-driven vs goal-driven agents'],
    seoDescription: {
      en: 'open-multi-agent vs Microsoft AutoGen: goal-driven TypeScript orchestration versus conversation-driven Python agents. An honest, sourced comparison — including AutoGen’s shift to maintenance mode — and when each is the right call.',
      zh: 'open-multi-agent 对比微软 AutoGen：目标驱动的 TypeScript 编排，对上对话驱动的 Python 智能体。一份诚实、可溯源的对比——含 AutoGen 转入维护模式这一事实——以及各自何时更合适。',
    },
    lede: {
      en: 'AutoGen pioneered conversation-driven multi-agent orchestration in Python; open-multi-agent takes a goal-driven, TypeScript-native approach.',
      zh: 'AutoGen 在 Python 里开创了对话驱动的多智能体编排；open-multi-agent 走的是目标驱动、TypeScript 原生的路线。',
    },
    chooseThem: {
      en: 'You’re in Python, prefer a conversational or actor-model mental model, and want native OpenTelemetry — and you’ve accounted for AutoGen’s maintenance status.',
      zh: '你在 Python 里，偏好对话式或 actor 模型的思维方式，想要原生 OpenTelemetry——并且已把 AutoGen 的维护状态纳入考量。',
    },
    chooseUs: {
      en: 'You want an actively-developed, TypeScript-native runtime with goal-driven decomposition and a hard token budget.',
      zh: '你想要一个仍在积极开发、TypeScript 原生、目标驱动拆解、且带硬性 token 预算的运行时。',
    },
    them: {
      language: { en: 'Python (autogen-core / autogen-agentchat); .NET in preview; no TypeScript', zh: 'Python（autogen-core / autogen-agentchat）；.NET 尚在 preview；无 TypeScript' },
      paradigm: { en: 'Conversation / group-chat (v0.2) over an event-driven actor runtime (v0.4)', zh: '对话 / group-chat（v0.2），底层是事件驱动的 actor 运行时（v0.4）' },
      deps: { en: '6 direct (autogen-core)', zh: '6 个直接依赖（autogen-core）' },
      mixedModel: { en: 'Yes — per-agent model_client via autogen-ext', zh: '支持——通过 autogen-ext 按智能体设 model_client' },
      budget: { en: 'No hard cap — soft, self-reported TokenUsageTermination between turns', zh: '无硬上限——软性的、依赖自报用量的 TokenUsageTermination，在轮次之间生效' },
      observability: { en: 'Native OpenTelemetry — runtimes auto-emit spans', zh: '原生 OpenTelemetry——运行时自动发出 span' },
    },
    note: {
      en: 'Heads-up: in 2026 Microsoft merged AutoGen and Semantic Kernel into the new <strong>Microsoft Agent Framework</strong>, its supported successor. AutoGen still gets fixes but is effectively in maintenance mode (latest release 0.7.5, September 2025). Worth weighing if you’re choosing a framework for a new, long-lived project.',
      zh: '提醒：2026 年微软把 AutoGen 与 Semantic Kernel 合并进了新的 <strong>Microsoft Agent Framework</strong>，作为其受支持的继任者。AutoGen 仍在收修复，但实际上已进入维护模式（最新版本 0.7.5，2025 年 9 月）。如果你在为一个全新、长期的项目选框架，这点值得掂量。',
    },
    howDiffer: {
      en: 'AutoGen models multi-agent work as a <em>conversation</em>: agents exchange messages in a group chat and coordination emerges from that dialogue (its v0.4 core adds an event-driven, actor-model runtime underneath). open-multi-agent is goal-driven: you hand the coordinator an outcome and it decomposes it into a task DAG with explicit dependencies, running independents in parallel. AutoGen’s tracing story is strong — OpenTelemetry is emitted natively — while OMA forwards its own <code>onTrace</code> spans to whichever backend you choose.',
      zh: 'AutoGen 把多智能体工作建模为一场<em>对话</em>：智能体在 group chat 里交换消息，协作从这场对话中涌现（它的 v0.4 内核在底层加了一个事件驱动的 actor 模型运行时）。open-multi-agent 则目标驱动：你把一个结果交给协调器，它拆解成一张带显式依赖的任务 DAG，并行运行相互独立的部分。AutoGen 的追踪能力很强——原生发出 OpenTelemetry——而 OMA 把自己的 <code>onTrace</code> span 转发到你选定的任意后端。',
    },
    whenThem: {
      en: 'AutoGen is a strong fit if you’re in Python, prefer a conversational or actor-model mental model, and value native OpenTelemetry out of the box; its research lineage runs deep. The caveat is momentum: with Microsoft steering new work to the Agent Framework, AutoGen is now a maintenance-mode choice — fine for an existing system, worth a second thought for a brand-new one.',
      zh: '如果你在 Python 里、偏好对话式或 actor 模型的思维、并看重开箱即用的原生 OpenTelemetry，AutoGen 很合适；它的研究血统很深。要留意的是势能：随着微软把新工作导向 Agent Framework，AutoGen 如今是个维护模式的选择——用在既有系统上没问题，但为一个全新项目选它就值得再想想。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want a TypeScript-native runtime under active development, a goal-first model instead of a conversation you have to steer, and a hard <code>maxTokenBudget</code> cap. Starting fresh in Node.js, OMA avoids both a Python dependency and a framework in transition.',
      zh: 'open-multi-agent 适合你想要一个 TypeScript 原生、仍在积极开发的运行时，想要目标优先的模型、而不是一场需要你去引导的对话，以及一道硬性 <code>maxTokenBudget</code> 上限。若从零起步于 Node.js，OMA 既省去 Python 依赖，也避开一个正在过渡期的框架。',
    },
  },
  {
    slug: 'openai-agents-sdk',
    name: 'OpenAI Agents SDK',
    repo: 'https://github.com/openai/openai-agents-python',
    keywords: ['openai agents sdk alternative', 'openai agents sdk typescript', 'multi provider agent framework', 'openai agents sdk vs open multi agent'],
    seoDescription: {
      en: 'open-multi-agent vs the OpenAI Agents SDK: provider-neutral goal-driven orchestration versus a lightweight, handoffs-based SDK with best-in-class built-in tracing. An honest, sourced comparison — and when each is the right call.',
      zh: 'open-multi-agent 对比 OpenAI Agents SDK：提供方中立、目标驱动的编排，对上轻量、基于 handoff、自带一流追踪的 SDK。一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'The OpenAI Agents SDK is a lightweight, handoffs-based framework with excellent built-in tracing; open-multi-agent is goal-driven and provider-neutral. Both are lean — they differ most in orchestration model and how tied to one provider you want to be.',
      zh: 'OpenAI Agents SDK 是一个轻量、基于 handoff、自带出色追踪的框架；open-multi-agent 则目标驱动、提供方中立。两者都很精简——最大的差别在编排范式，以及你想跟单一提供方绑得多紧。',
    },
    chooseThem: {
      en: 'You’re centered on OpenAI’s platform, like the handoffs model, and want best-in-class tracing that works out of the box.',
      zh: '你以 OpenAI 平台为中心，喜欢 handoff 模型，想要开箱即用、一流的追踪。',
    },
    chooseUs: {
      en: 'You want provider-neutral, goal-driven orchestration in TypeScript, with a hard token budget and a lean footprint.',
      zh: '你想要提供方中立、目标驱动的 TypeScript 编排，带硬性 token 预算和精简的足迹。',
    },
    them: {
      language: { en: 'Python-first; official TypeScript port (@openai/agents) — both pre-1.0', zh: 'Python 优先；官方 TypeScript 移植（@openai/agents）——两者均为 pre-1.0' },
      paradigm: { en: 'Handoffs — an agent delegates to another; agents can also be tools', zh: 'Handoff——一个智能体委派给另一个；智能体也可作为工具' },
      deps: { en: '7 direct (Python) / 2 direct + peer (JS)', zh: '7 个直接依赖（Python）/ 2 直接 + peer（JS）' },
      mixedModel: { en: 'Yes — per-agent model= (OpenAI-compatible endpoints, LiteLLM)', zh: '支持——按智能体设 model=（兼容 OpenAI 的端点、LiteLLM）' },
      budget: { en: 'No hard cap — max_turns counts steps; usage reported only', zh: '无硬上限——max_turns 计的是步数；用量仅作报告' },
      observability: { en: 'Built-in tracing on by default (OpenAI dashboard) + 25+ external processors', zh: '内置追踪默认开启（OpenAI 仪表盘）+ 25 个以上外部 processor' },
    },
    howDiffer: {
      en: 'The Agents SDK orchestrates through <em>handoffs</em>: an agent decides to delegate to another agent and control passes along that chain (agents can also be exposed as tools). open-multi-agent orchestrates through <em>decomposition</em>: a coordinator breaks the goal into a task DAG up front and runs independent tasks in parallel. The SDK’s tracing is a genuine strength — on by default, with a large processor ecosystem — whereas OMA gives you <code>onTrace</code> spans plus a self-contained post-run dashboard. The SDK is lightest when you build on OpenAI; OMA is provider-neutral by design.',
      zh: 'Agents SDK 通过 <em>handoff</em> 编排：一个智能体决定委派给另一个，控制权沿这条链传递（智能体也能被暴露为工具）。open-multi-agent 则通过<em>拆解</em>编排：协调器先把目标拆成任务 DAG，再并行运行相互独立的任务。SDK 的追踪是实打实的强项——默认开启、processor 生态庞大——而 OMA 给你 <code>onTrace</code> span 加一个自包含的运行后仪表盘。SDK 在你构建于 OpenAI 之上时最轻；OMA 则从设计上就提供方中立。',
    },
    whenThem: {
      en: 'Pick the OpenAI Agents SDK if your world is OpenAI-centric, you like the handoffs model, and you want tracing that just works out of the box. It’s minimal and well-instrumented. Its TypeScript port is official, though both it and the Python package are still pre-1.0, so expect some churn.',
      zh: '如果你的世界以 OpenAI 为中心、喜欢 handoff 模型、想要开箱即用的追踪，就选 OpenAI Agents SDK。它精简、埋点到位。它的 TypeScript 移植是官方的，不过它和 Python 包都还在 pre-1.0，所以要预期一些变动。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want to stay provider-neutral — mix Anthropic, Gemini, OpenAI, local models, or any OpenAI-compatible endpoint in one team — and prefer decomposing a goal to wiring handoffs. It’s TypeScript-native, three dependencies, and its <code>maxTokenBudget</code> gives a hard spend ceiling the Agents SDK doesn’t have.',
      zh: 'open-multi-agent 适合你想保持提供方中立——在同一个团队里混用 Anthropic、Gemini、OpenAI、本地模型，或任何兼容 OpenAI 的端点——并且更愿意拆解目标、而非接线 handoff。它 TypeScript 原生、三个依赖，其 <code>maxTokenBudget</code> 给出一道 Agents SDK 所没有的硬性花费上限。',
    },
  },
  {
    slug: 'mastra',
    name: 'Mastra',
    repo: 'https://github.com/mastra-ai/mastra',
    keywords: ['mastra alternative', 'mastra vs open multi agent', 'mastra typescript agent framework', 'lean mastra alternative'],
    seoDescription: {
      en: 'open-multi-agent vs Mastra: a lean 3-dependency goal-driven runtime versus a batteries-included TypeScript framework with workflows, memory, RAG, and evals. An honest, sourced comparison — and when each is the right call.',
      zh: 'open-multi-agent 对比 Mastra：精简到 3 个依赖、目标驱动的运行时，对上开箱即全、带 workflow / 记忆 / RAG / evals 的 TypeScript 框架。一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'Both are TypeScript-native and actively developed — the real difference is surface area. Mastra is a batteries-included framework; open-multi-agent is a lean, goal-driven core.',
      zh: '两者都是 TypeScript 原生、都在积极开发——真正的差别在覆盖面。Mastra 是开箱即全的框架，open-multi-agent 是一个精简、目标驱动的内核。',
    },
    chooseThem: {
      en: 'You want an all-in-one TypeScript framework — graph-based workflows, built-in memory and RAG, evals, a dev playground — in one package.',
      zh: '你想要一个 all-in-one 的 TypeScript 框架——图式 workflow、内置记忆与 RAG、evals、一个开发调试台——一站备齐。',
    },
    chooseUs: {
      en: 'You want a small core (three dependencies), goal-driven decomposition instead of hand-built workflow graphs, and a hard token-budget cap.',
      zh: '你想要一个小内核（三个依赖）、用目标驱动的拆解代替手搭 workflow 图，以及一道硬性 token 预算上限。',
    },
    them: {
      language: { en: 'TypeScript-native; runs on Node.js', zh: 'TypeScript 原生；运行于 Node.js' },
      paradigm: { en: 'Agents plus graph-based workflows (.then / .branch / suspend), with built-in memory, RAG, and evals', zh: '智能体，加上图式 workflow（.then / .branch / suspend），内置记忆、RAG 与 evals' },
      deps: { en: '~32 direct in @mastra/core; built on the Vercel AI SDK provider layer', zh: '@mastra/core 约 32 个直接依赖；构建于 Vercel AI SDK 的提供方层之上' },
      mixedModel: { en: 'Yes — per-agent model via the AI SDK model interface', zh: '支持——通过 AI SDK 的模型接口按智能体设模型' },
      budget: { en: 'No hard token cap — maxSteps limits agent steps', zh: '无硬性 token 上限——maxSteps 限制智能体步数' },
      observability: { en: 'OpenTelemetry tracing, plus a local dev playground for inspecting runs', zh: 'OpenTelemetry 链路追踪，外加一个本地开发调试台用于查看运行' },
    },
    howDiffer: {
      en: 'Mastra bundles the whole design surface — <em>agents</em>, graph-based <em>workflows</em> you compose with <code>.then()</code>/<code>.branch()</code>, plus memory, RAG, and evals — into one framework. open-multi-agent keeps the core small and hands a coordinator a goal, which it decomposes into a task DAG <em>at runtime</em> and auto-parallelizes. Mastra is built on the Vercel AI SDK provider layer and carries ~32 direct dependencies in its core; OMA carries three, with extra providers and MCP loaded only when you opt in.',
      zh: 'Mastra 把整个设计面——<em>智能体</em>、用 <code>.then()</code>/<code>.branch()</code> 组合的图式 <em>workflow</em>，加上记忆、RAG 与 evals——都打包进一个框架。open-multi-agent 则把内核做小，把目标交给协调器，由它<em>在运行时</em>拆解成任务 DAG 并自动并行。Mastra 构建于 Vercel AI SDK 提供方层之上，内核约 32 个直接依赖；OMA 是三个，额外提供方与 MCP 仅在按需时加载。',
    },
    whenThem: {
      en: 'Choose Mastra when you want a batteries-included TypeScript framework and would rather adopt one opinionated stack than assemble your own: graph-based workflows with suspend/resume and human-in-the-loop, built-in memory and RAG, and an evals harness. If you think in explicit workflow steps and want the pieces in the box, Mastra gives you a lot up front.',
      zh: '当你想要一个开箱即全的 TypeScript 框架、且宁愿采纳一套有主见的技术栈而非自己拼装时，选 Mastra：带 suspend/resume 与 human-in-the-loop 的图式 workflow、内置记忆与 RAG，以及一套 evals 框架。如果你习惯用显式的 workflow 步骤来思考、想要开箱即得的组件，Mastra 一开始就给你很多。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want to stay lean and let the plan be built for you. The coordinator decomposes a goal into a task DAG at runtime, so you describe the outcome instead of wiring a workflow graph; the core is three dependencies; and <code>maxTokenBudget</code> gives a hard spend ceiling that aborts the run — a guardrail Mastra doesn’t offer at the token level.',
      zh: 'open-multi-agent 适合你想保持精简、并让计划替你生成的场景。协调器在运行时把目标拆解成任务 DAG，于是你描述结果、而非接线 workflow 图；内核只有三个依赖；<code>maxTokenBudget</code> 给出一道会中止运行的硬性花费上限——这是 Mastra 在 token 层面没有提供的护栏。',
    },
  },
  {
    slug: 'vercel-ai-sdk',
    name: 'Vercel AI SDK',
    tier: 'primary',
    repo: 'https://github.com/vercel/ai',
    keywords: ['vercel ai sdk alternative', 'vercel ai sdk multi-agent', 'ai sdk vs open multi agent', 'multi-agent on top of vercel ai sdk'],
    seoDescription: {
      en: 'open-multi-agent vs the Vercel AI SDK: goal-driven multi-agent orchestration versus a lower-level provider-neutral toolkit. They sit at different layers — and open-multi-agent can run on top of the AI SDK. An honest, sourced comparison.',
      zh: 'open-multi-agent 对比 Vercel AI SDK：目标驱动的多智能体编排，对上更底层、提供方中立的工具包。两者处在不同层——open-multi-agent 甚至可以跑在 AI SDK 之上。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'These sit at different layers. The Vercel AI SDK is a lightweight toolkit for talking to models — one agent, tools, streaming. open-multi-agent is the orchestration layer above it: describe a goal, get a multi-agent task DAG. You can even run OMA on top of the AI SDK.',
      zh: '这两者处在不同的层。Vercel AI SDK 是一个轻量工具包，用来和模型对话——单个智能体、工具、流式。open-multi-agent 是它之上的编排层：描述一个目标，得到一张多智能体的任务 DAG。你甚至可以把 OMA 跑在 AI SDK 之上。',
    },
    chooseThem: {
      en: 'You want a lightweight, provider-neutral toolkit for a single agent — model calls, tool use, streaming — and you’ll handle any orchestration yourself.',
      zh: '你想要一个轻量、提供方中立的工具包，服务单个智能体——模型调用、工具使用、流式——编排部分你自己来。',
    },
    chooseUs: {
      en: 'You want multi-agent orchestration on top: a coordinator that decomposes a goal into a parallel task DAG, mixed-model teams, and a hard token budget — without hand-building the plumbing.',
      zh: '你想要在其之上的多智能体编排：一个把目标拆成并行任务 DAG 的协调器、混编模型的团队，以及一道硬性 token 预算——而不必手搭这些管道。',
    },
    them: {
      language: { en: 'TypeScript-native; the leanest of the group', zh: 'TypeScript 原生；本组里最精简' },
      paradigm: { en: 'A single-agent tool-calling loop (generateText / streamText / Agent, stopWhen); multi-agent is manual composition you build', zh: '单智能体的工具调用循环（generateText / streamText / Agent，stopWhen）；多智能体是你自己搭的手工组合' },
      deps: { en: '3 direct (@ai-sdk/gateway, provider, provider-utils)', zh: '3 个直接依赖（@ai-sdk/gateway、provider、provider-utils）' },
      mixedModel: { en: 'Yes — provider-neutral by design, one model per agent loop', zh: '支持——设计上提供方中立，每个智能体循环一个模型' },
      budget: { en: 'No hard token cap — stopWhen / stepCountIs are step conditions', zh: '无硬性 token 上限——stopWhen / stepCountIs 是步数条件' },
      observability: { en: 'experimental_telemetry emits OpenTelemetry spans', zh: 'experimental_telemetry 发出 OpenTelemetry span' },
    },
    howDiffer: {
      en: 'The Vercel AI SDK is <em>primitives</em>: a provider-neutral interface for model calls, tool use, and streaming, plus an <code>Agent</code> abstraction that runs a single tool-calling loop until <code>stopWhen</code>. Multi-agent coordination is something you compose yourself on top. open-multi-agent is that coordination layer — a coordinator decomposes a goal into a task DAG at runtime, runs independent tasks in parallel, and hands you a typed result. They’re complementary as much as competing: OMA ships an AI SDK bridge, so the SDK can be the model layer under an OMA team.',
      zh: 'Vercel AI SDK 是<em>原语</em>：一套提供方中立的接口，负责模型调用、工具使用与流式，外加一个 <code>Agent</code> 抽象，跑单个工具调用循环直到 <code>stopWhen</code>。多智能体协作是你自己在其上组合出来的。open-multi-agent 就是那一层协作——协调器在运行时把目标拆解成任务 DAG，并行运行相互独立的任务，交给你一个带类型的结果。二者与其说竞争，不如说互补：OMA 自带一个 AI SDK bridge，于是 SDK 可以作为 OMA 团队之下的模型层。',
    },
    whenThem: {
      en: 'Reach for the Vercel AI SDK when you want a minimal, provider-neutral foundation and intend to own the control flow — a single well-instrumented agent, or your own orchestration built exactly how you want it. It’s the leanest option here (three dependencies), it’s widely adopted, and its streaming and tool ergonomics are excellent.',
      zh: '当你想要一个极简、提供方中立的地基、并打算自己掌控控制流时，选 Vercel AI SDK——一个埋点良好的单智能体，或一套完全按你意愿搭建的自有编排。它是这里最精简的选择（三个依赖），采用广泛，其流式与工具人体工学都很出色。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want the orchestration handed to you rather than hand-built: a coordinator that plans the task DAG from a goal, mixed-model teams in one run, and a hard <code>maxTokenBudget</code> ceiling. And you don’t have to choose — run OMA over the AI SDK and keep the SDK’s provider layer underneath.',
      zh: 'open-multi-agent 适合你想要现成的编排、而非手工搭建：一个从目标出发规划任务 DAG 的协调器、一次运行里混编模型的团队，以及一道硬性 <code>maxTokenBudget</code> 上限。而且你不必二选一——把 OMA 跑在 AI SDK 之上，底下继续用 SDK 的提供方层。',
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
      en: 'You want tracing that works out of the box — a bundled OpenTelemetry stack — and a supervisor coordinating sub-agents, with workflows, memory, and RAG included.',
      zh: '你想要开箱即用的追踪——内置的整套 OpenTelemetry——以及一个协调子智能体的 supervisor，附带 workflow、记忆与 RAG。',
    },
    chooseUs: {
      en: 'You want a much smaller footprint (three dependencies vs ~44), goal-driven decomposition, a hard token budget, and to forward your own spans rather than adopt a bundled OTel stack.',
      zh: '你想要小得多的足迹（三个依赖 vs 约 44 个）、目标驱动的拆解、一道硬性 token 预算，并且更愿意转发自己的 span、而非采纳一整套内置 OTel。',
    },
    them: {
      language: { en: 'TypeScript-native; runs on Node.js', zh: 'TypeScript 原生；运行于 Node.js' },
      paradigm: { en: 'Agents plus supervisor / sub-agent networks and workflows, with memory and RAG', zh: '智能体，加上 supervisor / 子智能体网络与 workflow，带记忆与 RAG' },
      deps: { en: '~44 direct in @voltagent/core — bundles the @ai-sdk provider set and a full OpenTelemetry stack', zh: '@voltagent/core 约 44 个直接依赖——内置整套 @ai-sdk 提供方与完整的 OpenTelemetry 栈' },
      mixedModel: { en: 'Yes — per-agent model via the AI SDK providers', zh: '支持——通过 AI SDK 提供方按智能体设模型' },
      budget: { en: 'No hard token cap — maxSteps limits agent steps', zh: '无硬性 token 上限——maxSteps 限制智能体步数' },
      observability: { en: 'Native OpenTelemetry — the core bundles the OTel SDK and auto-instruments agents', zh: '原生 OpenTelemetry——内核内置 OTel SDK 并自动为智能体埋点' },
    },
    howDiffer: {
      en: 'VoltAgent puts <em>observability first</em>: its core bundles a full OpenTelemetry stack and auto-instruments agents, and it structures work as a <em>supervisor</em> coordinating sub-agents, with memory, RAG, and workflows included. open-multi-agent keeps the core to three dependencies and forwards <code>onTrace</code> spans to whichever backend you choose, and instead of a supervisor topology it hands a coordinator a goal to decompose into a task DAG at runtime. The trade-off is footprint versus batteries: ~44 core dependencies against three.',
      zh: 'VoltAgent 把<em>可观测性放在第一位</em>：内核内置整套 OpenTelemetry 栈、自动为智能体埋点，并把工作组织成一个 <em>supervisor</em> 协调子智能体，附带记忆、RAG 与 workflow。open-multi-agent 把内核控制在三个依赖，并把 <code>onTrace</code> span 转发到你选定的任意后端；它不用 supervisor 拓扑，而是把目标交给协调器、在运行时拆解成任务 DAG。取舍就是足迹 vs 开箱即全：约 44 个内核依赖，对上三个。',
    },
    whenThem: {
      en: 'Choose VoltAgent when first-class observability out of the box is a deciding factor — you want OpenTelemetry tracing without wiring it yourself — and a supervisor/sub-agent model fits how you think about coordination. It’s a batteries-included framework with memory, RAG, and workflows, at the cost of a heavier dependency footprint.',
      zh: '当开箱即用的一流可观测性是决定性因素时，选 VoltAgent——你想要 OpenTelemetry 追踪、又不必自己接线——并且 supervisor/子智能体模型贴合你对协作的思考方式。它是一个开箱即全的框架，带记忆、RAG 与 workflow，代价是更重的依赖足迹。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you want a lean core and goal-driven orchestration: three dependencies instead of ~44, a coordinator that plans the task DAG from a goal, a hard <code>maxTokenBudget</code> cap, and tracing you forward to your own OTel / Datadog / Langfuse backend plus a self-contained post-run HTML dashboard.',
      zh: 'open-multi-agent 适合你想要精简内核与目标驱动编排的场景：三个依赖而非约 44 个、一个从目标规划任务 DAG 的协调器、一道硬性 <code>maxTokenBudget</code> 上限，以及由你转发到自有 OTel / Datadog / Langfuse 后端的追踪，另有一个自包含的运行后 HTML 仪表盘。',
    },
  },
  {
    slug: 'inngest-agentkit',
    name: 'Inngest AgentKit',
    repo: 'https://github.com/inngest/agent-kit',
    keywords: ['inngest agentkit alternative', 'agentkit vs open multi agent', 'deterministic agent routing typescript', 'inngest agentkit alternative nodejs'],
    seoDescription: {
      en: 'open-multi-agent vs Inngest AgentKit: runtime goal decomposition versus deterministic, state-based routing over agent networks running on Inngest. An honest, sourced comparison — and when each is the right call.',
      zh: 'open-multi-agent 对比 Inngest AgentKit：运行时的目标拆解，对上跑在 Inngest 之上、对智能体网络做确定性状态路由。一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'Both build multi-agent systems in TypeScript. AgentKit routes a network of agents with deterministic, state-based logic on top of Inngest; open-multi-agent decomposes a goal into a task DAG at runtime.',
      zh: '两者都用 TypeScript 搭建多智能体系统。AgentKit 在 Inngest 之上，用确定性的状态路由来调度一张智能体网络；open-multi-agent 则在运行时把目标拆解成任务 DAG。',
    },
    chooseThem: {
      en: 'You want deterministic, inspectable routing you control, and durable, replayable execution — and you’re happy to run on Inngest.',
      zh: '你想要能自己掌控、确定且可审视的路由，以及可持久、可重放的执行——并且乐意跑在 Inngest 上。',
    },
    chooseUs: {
      en: 'You want the plan built at runtime instead of hand-authored routing, no Inngest dependency, and a hard token budget.',
      zh: '你想要计划在运行时自动生成、而非手写路由，不想引入 Inngest 依赖，还要一道硬性 token 预算。',
    },
    them: {
      language: { en: 'TypeScript-native; pre-1.0 (0.13)', zh: 'TypeScript 原生；pre-1.0（0.13）' },
      paradigm: { en: 'Multi-agent networks with deterministic, state-based routing — a router (code or model) picks the next agent', zh: '带确定性状态路由的多智能体网络——由一个路由器（代码或模型）挑选下一个智能体' },
      deps: { en: '6 direct; runs on Inngest for durable, replayable execution', zh: '6 个直接依赖；跑在 Inngest 上以获得可持久、可重放的执行' },
      mixedModel: { en: 'Yes — per-agent model via @inngest/ai adapters', zh: '支持——通过 @inngest/ai 适配器按智能体设模型' },
      budget: { en: 'No hard token cap — maxIter caps router iterations', zh: '无硬性 token 上限——maxIter 限制路由迭代次数' },
      observability: { en: 'Run traces via the Inngest platform it runs on', zh: '通过其运行所依托的 Inngest 平台获取运行链路' },
    },
    howDiffer: {
      en: 'AgentKit models work as a <em>network</em> of agents sharing state, with a <em>router</em> — code you write or a model you delegate to — deciding which agent runs next, capped by <code>maxIter</code>. It runs on Inngest, so execution is durable and replayable. open-multi-agent doesn’t ask you to author the routing: a coordinator decomposes the goal into a task DAG <em>at runtime</em> and parallelizes the independent nodes. AgentKit gives you explicit, deterministic control flow (and Inngest’s durability); OMA gives you a plan generated per goal and no orchestration service to run.',
      zh: 'AgentKit 把工作建模为一张共享状态的智能体<em>网络</em>，由一个<em>路由器</em>——你写的代码，或你委派的一个模型——决定下一个跑哪个智能体，并以 <code>maxIter</code> 封顶。它跑在 Inngest 上，所以执行可持久、可重放。open-multi-agent 不要求你编写路由：协调器<em>在运行时</em>把目标拆解成任务 DAG，并把相互独立的节点并行化。AgentKit 给你显式、确定的控制流（以及 Inngest 的持久性）；OMA 给你一份按目标生成的计划，且无需运行一个编排服务。',
    },
    whenThem: {
      en: 'Choose AgentKit when you want deterministic, inspectable routing you author yourself and Inngest’s durable, replayable execution underneath — valuable when a run must survive restarts and every routing decision should be explicit and reproducible. It’s pre-1.0, so expect some churn, and it assumes Inngest in your stack.',
      zh: '当你想要自己编写的、确定且可审视的路由，以及底下 Inngest 那种可持久、可重放的执行时，选 AgentKit——当一次运行必须扛过重启、且每个路由决策都要显式可复现时，这很有价值。它还在 pre-1.0，要预期一些变动，并且默认你的技术栈里有 Inngest。',
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
      en: 'You want the largest ecosystem — chains, hundreds of integrations, LangSmith tracing — and you’re building in Python (or LangChain.js).',
      zh: '你想要最大的生态——链、数百个集成、LangSmith 追踪——并且在 Python（或 LangChain.js）上构建。',
    },
    chooseUs: {
      en: 'You want a small, focused multi-agent runtime in TypeScript: goal-driven decomposition, three dependencies, and a hard token budget — without adopting a large framework.',
      zh: '你想要一个小而专注的多智能体运行时（TypeScript）：目标驱动的拆解、三个依赖、一道硬性 token 预算——而不必采纳一个庞大的框架。',
    },
    them: {
      language: { en: 'Python-first; a JavaScript/TypeScript port (LangChain.js) also exists', zh: 'Python 优先；也有 JavaScript/TypeScript 移植（LangChain.js）' },
      paradigm: { en: 'Chains + tool-calling agents (the classic AgentExecutor now lives in langchain_classic); the modern orchestration path is LangGraph', zh: '链 + 工具调用智能体（经典的 AgentExecutor 现已移入 langchain_classic）；现代的编排路径是 LangGraph' },
      deps: { en: '~8 direct in the langchain package (atop langchain-core); the wider integration ecosystem is very large', zh: 'langchain 包约 8 个直接依赖（在 langchain-core 之上）；更外围的集成生态非常庞大' },
      mixedModel: { en: 'Yes — per-agent / per-chain model', zh: '支持——按智能体 / 按链设模型' },
      budget: { en: 'No hard token cap — AgentExecutor max_iterations counts steps', zh: '无硬性 token 上限——AgentExecutor 的 max_iterations 计的是步数' },
      observability: { en: 'First-party LangSmith tracing', zh: '一方 LangSmith 链路追踪' },
    },
    howDiffer: {
      en: 'LangChain is a <em>framework and ecosystem</em>: chains, a huge library of integrations, and tool-calling agents (the classic <code>AgentExecutor</code> now sits under <code>langchain_classic</code>). Its answer to multi-agent orchestration is <em>LangGraph</em>, which we compare separately. open-multi-agent isn’t a broad framework — it’s a focused runtime that decomposes a goal into a task DAG at runtime and parallelizes it, in TypeScript, with three dependencies. If you’re weighing the orchestration model specifically, the LangGraph comparison is the closer one.',
      zh: 'LangChain 是一个<em>框架与生态</em>：链、庞大的集成库，以及工具调用智能体（经典的 <code>AgentExecutor</code> 现已归入 <code>langchain_classic</code>）。它对多智能体编排的答案是 <em>LangGraph</em>，我们另作对比。open-multi-agent 不是一个庞大的框架——它是一个专注的运行时，在运行时把目标拆解成任务 DAG 并并行化，用 TypeScript、三个依赖。如果你专门在掂量编排范式，LangGraph 那篇对比更贴近。',
    },
    whenThem: {
      en: 'Choose LangChain when you want the breadth: the largest integration ecosystem in the space, chains and prompt tooling, first-party LangSmith tracing, and a huge community — in Python or, with some feature lag, LangChain.js. If you’ll lean on that ecosystem, the gravity is real.',
      zh: '当你想要广度时选 LangChain：这个领域里最大的集成生态、链与提示工具、一方 LangSmith 追踪，以及庞大的社区——在 Python 里，或（功能略滞后地）在 LangChain.js 里。如果你会倚重那套生态，它的惯性是真实的。',
    },
    whenUs: {
      en: 'open-multi-agent fits when you don’t want a broad framework — just a lean, goal-driven multi-agent runtime that plans the task DAG for you, stays TypeScript-native with three dependencies, and enforces a hard <code>maxTokenBudget</code>. For the orchestration-model question specifically, compare against LangGraph.',
      zh: 'open-multi-agent 适合你不想要一个庞大框架、只想要一个精简、目标驱动的多智能体运行时的场景——它替你规划任务 DAG，保持 TypeScript 原生、三个依赖，并强制一道硬性 <code>maxTokenBudget</code>。若专门就编排范式发问，请对比 LangGraph。',
    },
  },
  {
    slug: 'llamaindex',
    name: 'LlamaIndex',
    tier: 'primary',
    repo: 'https://github.com/run-llama/llama_index',
    keywords: ['llamaindex alternative', 'llamaindex vs open multi agent', 'llamaindex agent workflow alternative', 'rag agent framework'],
    seoDescription: {
      en: 'open-multi-agent vs LlamaIndex: an orchestration-first TypeScript runtime versus a RAG/data-first Python framework that grew agent workflows. An honest, sourced comparison — and when each is the right call.',
      zh: 'open-multi-agent 对比 LlamaIndex：编排优先的 TypeScript 运行时，对上一个 RAG / 数据优先、后来长出智能体 workflow 的 Python 框架。一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'LlamaIndex started as a data/RAG framework and grew agent workflows on top; open-multi-agent starts from orchestration. If your problem is retrieval over your data, they lead from opposite ends.',
      zh: 'LlamaIndex 起步于数据 / RAG 框架，后来在其上长出智能体 workflow；open-multi-agent 则从编排出发。如果你的问题是「在自己的数据上做检索」，两者从相反的一端切入。',
    },
    chooseThem: {
      en: 'Your core problem is RAG over your own data — indexing, retrieval, query engines — and you want agents that build on that, in Python.',
      zh: '你的核心问题是在自己的数据上做 RAG——索引、检索、查询引擎——并且想要在其之上构建的智能体，用 Python。',
    },
    chooseUs: {
      en: 'Your core problem is orchestration — coordinating multiple agents toward a goal — in TypeScript, with a lean core and a hard token budget. You bring your own retrieval.',
      zh: '你的核心问题是编排——协调多个智能体奔向一个目标——用 TypeScript、精简内核、硬性 token 预算。检索你自己带。',
    },
    them: {
      language: { en: 'Python; a TypeScript port (LlamaIndex.TS) also exists', zh: 'Python；也有 TypeScript 移植（LlamaIndex.TS）' },
      paradigm: { en: 'Data / RAG-first (indexing, retrieval, query engines) plus agent workflows (AgentWorkflow, FunctionAgent)', zh: '数据 / RAG 优先（索引、检索、查询引擎），加上智能体 workflow（AgentWorkflow、FunctionAgent）' },
      deps: { en: '~29 direct in llama-index-core (RAG-oriented: numpy, nltk, tiktoken, networkx, …)', zh: 'llama-index-core 约 29 个直接依赖（面向 RAG：numpy、nltk、tiktoken、networkx…）' },
      mixedModel: { en: 'Yes — per-agent model', zh: '支持——按智能体设模型' },
      budget: { en: 'No hard token cap', zh: '无硬性 token 上限' },
      observability: { en: 'An instrumentation module plus integrations (Arize, Langfuse, and others)', zh: '一个 instrumentation 模块，加上集成（Arize、Langfuse 等）' },
    },
    howDiffer: {
      en: 'LlamaIndex is <em>retrieval-first</em>: its center of gravity is indexing your data and querying it, with agent workflows layered on top. open-multi-agent is <em>orchestration-first</em>: it decomposes a goal into a task DAG and coordinates agents, and leaves retrieval to you. They overlap only at the edges — a RAG-heavy application leans toward LlamaIndex; a multi-agent coordination problem leans toward OMA. LlamaIndex carries ~29 core dependencies for all that data tooling; OMA carries three.',
      zh: 'LlamaIndex 是<em>检索优先</em>的：它的重心在于把你的数据建索引并查询，智能体 workflow 叠在上面。open-multi-agent 是<em>编排优先</em>的：它把目标拆解成任务 DAG 并协调智能体，检索交给你。两者只在边缘重叠——RAG 重的应用偏向 LlamaIndex；多智能体协调问题偏向 OMA。LlamaIndex 为那套数据工具带着约 29 个内核依赖；OMA 是三个。',
    },
    whenThem: {
      en: 'Choose LlamaIndex when retrieval over your own data is the heart of the problem: it has the richest set of loaders, indexes, retrievers, and query engines, and its agent workflows plug straight into them. If you’re building a RAG application first and an agent system second, that head start is worth a lot.',
      zh: '当「在自己的数据上做检索」是问题核心时选 LlamaIndex：它有最丰富的一套加载器、索引、检索器与查询引擎，其智能体 workflow 能直接接上。如果你先建的是 RAG 应用、其次才是智能体系统，那份先发优势很值钱。',
    },
    whenUs: {
      en: 'open-multi-agent fits when orchestration is the heart of the problem: a coordinator that decomposes a goal into a parallel task DAG, TypeScript-native, three dependencies, and a hard <code>maxTokenBudget</code>. It doesn’t ship retrieval — you bring whatever RAG or tools you like — which keeps the core small and the orchestration general.',
      zh: 'open-multi-agent 适合编排是问题核心的场景：一个把目标拆成并行任务 DAG 的协调器、TypeScript 原生、三个依赖、一道硬性 <code>maxTokenBudget</code>。它不自带检索——RAG 或工具你随意带——这让内核保持小、编排保持通用。',
    },
  },
  {
    slug: 'pydantic-ai',
    name: 'Pydantic AI',
    repo: 'https://github.com/pydantic/pydantic-ai',
    keywords: ['pydantic ai alternative', 'pydantic ai typescript alternative', 'pydantic ai vs open multi agent', 'type-safe agent framework'],
    seoDescription: {
      en: 'open-multi-agent vs Pydantic AI: goal-driven TypeScript orchestration versus a type-safe, Python-native agent framework with first-class OpenTelemetry and usage limits. An honest, sourced comparison — and when each is the right call.',
      zh: 'open-multi-agent 对比 Pydantic AI：目标驱动的 TypeScript 编排，对上一个类型安全、Python 原生、自带一流 OpenTelemetry 与用量上限的智能体框架。一份诚实、可溯源的对比——以及各自何时更合适。',
    },
    lede: {
      en: 'Pydantic AI brings Pydantic’s type-safety discipline to agents, with excellent OpenTelemetry via Logfire; open-multi-agent is goal-driven and TypeScript-native. Both are lean and provider-agnostic — they differ most in language and orchestration model.',
      zh: 'Pydantic AI 把 Pydantic 的类型安全纪律带进智能体，并借 Logfire 提供出色的 OpenTelemetry；open-multi-agent 则目标驱动、TypeScript 原生。两者都精简、提供方无关——最大的差别在语言与编排范式。',
    },
    chooseThem: {
      en: 'You’re in Python, you value type-safe, validated agent I/O, and you want first-class OpenTelemetry (Logfire) and built-in usage limits.',
      zh: '你在 Python 里，看重类型安全、经校验的智能体输入输出，并且想要一流的 OpenTelemetry（Logfire）与内置用量上限。',
    },
    chooseUs: {
      en: 'You want TypeScript-native, goal-driven multi-agent orchestration — a coordinator that builds the task DAG from a goal — with a hard, run-aborting token budget.',
      zh: '你想要 TypeScript 原生、目标驱动的多智能体编排——一个从目标构建任务 DAG 的协调器——外加一道会中止运行的硬性 token 预算。',
    },
    them: {
      language: { en: 'Python-native (built on Pydantic); no TypeScript port', zh: 'Python 原生（构建于 Pydantic 之上）；无 TypeScript 移植' },
      paradigm: { en: 'Type-safe, model-agnostic agents with tool calling and dependency injection; multi-agent via delegation and pydantic-graph', zh: '类型安全、提供方无关的智能体，带工具调用与依赖注入；多智能体通过委派与 pydantic-graph 实现' },
      deps: { en: 'A slim core (pydantic-ai-slim); model provider SDKs are optional extras', zh: '一个精简内核（pydantic-ai-slim）；模型提供方 SDK 是可选 extras' },
      mixedModel: { en: 'Yes — model-agnostic, per-agent model', zh: '支持——提供方无关，按智能体设模型' },
      budget: { en: 'Yes — UsageLimits includes total_tokens_limit, which raises before you overspend (one of the few here with a real token limit)', zh: '支持——UsageLimits 含 total_tokens_limit，超支前即抛错（这里少数带真正 token 上限的之一）' },
      observability: { en: 'Native OpenTelemetry via Pydantic Logfire (instrumentation built in)', zh: '经 Pydantic Logfire 的原生 OpenTelemetry（内置埋点）' },
    },
    howDiffer: {
      en: 'Pydantic AI applies <em>type-safety</em> end to end — validated inputs and outputs, dependency injection, model-agnostic agents — and ships genuinely strong observability through Logfire (native OpenTelemetry). Notably, it’s one of the few frameworks here with a real token limit: <code>UsageLimits(total_tokens_limit=…)</code> raises before you overspend. open-multi-agent differs mainly in language and shape: it’s TypeScript-native and goal-driven, a coordinator decomposing a goal into a parallel task DAG rather than a single agent that delegates. OMA’s <code>maxTokenBudget</code> caps the whole run’s DAG; Pydantic AI’s limit is per agent run — both real, just scoped differently.',
      zh: 'Pydantic AI 把<em>类型安全</em>贯穿始终——经校验的输入输出、依赖注入、提供方无关的智能体——并借 Logfire 提供确实强的可观测性（原生 OpenTelemetry）。值得一提的是，它是这里少数带真正 token 上限的框架：<code>UsageLimits(total_tokens_limit=…)</code> 会在你超支前抛错。open-multi-agent 的差别主要在语言与形态：它 TypeScript 原生、目标驱动，是一个把目标拆成并行任务 DAG 的协调器，而非一个做委派的单智能体。OMA 的 <code>maxTokenBudget</code> 封顶的是整个运行的 DAG；Pydantic AI 的上限作用于单次 agent run——都真实，只是作用域不同。',
    },
    whenThem: {
      en: 'Pydantic AI is a strong fit if you’re in Python and want the Pydantic discipline: validated, type-safe agent I/O, clean dependency injection, best-in-class tracing through Logfire, and built-in usage limits. For a single well-typed agent or a delegation-based design, it’s excellent and lean.',
      zh: '如果你在 Python 里、想要 Pydantic 那套纪律，Pydantic AI 很合适：经校验、类型安全的智能体输入输出、干净的依赖注入、经 Logfire 的一流追踪，以及内置用量上限。对于一个类型良好的单智能体、或基于委派的设计，它出色且精简。',
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
      en: 'You want a TypeScript-native, provider-neutral runtime that decomposes a goal at runtime — no web-server or cloud stack pulled in — with a lean core and a hard token budget.',
      zh: '你想要一个 TypeScript 原生、提供方中立、在运行时拆解目标的运行时——不拉进 web 服务器或云栈——内核精简、带硬性 token 预算。',
    },
    them: {
      language: { en: 'Python-first (a Java port exists); no TypeScript', zh: 'Python 优先（有 Java 移植）；无 TypeScript' },
      paradigm: { en: 'Code-first agents: an LlmAgent plus explicit workflow agents (SequentialAgent, ParallelAgent, LoopAgent) and multi-agent hierarchies', zh: 'code-first 智能体：一个 LlmAgent，加上显式的 workflow 智能体（SequentialAgent、ParallelAgent、LoopAgent）与多智能体层级' },
      deps: { en: '~24 direct — includes a FastAPI/Uvicorn web stack, google-genai, google-auth, and OpenTelemetry', zh: '约 24 个直接依赖——含 FastAPI/Uvicorn web 栈、google-genai、google-auth 与 OpenTelemetry' },
      mixedModel: { en: 'Yes — Gemini-first, other providers via LiteLLM', zh: '支持——Gemini 优先，其它提供方经 LiteLLM' },
      budget: { en: 'No hard token cap — LoopAgent bounds iterations, not tokens', zh: '无硬性 token 上限——LoopAgent 限制的是迭代次数，不是 token' },
      observability: { en: 'OpenTelemetry, with Google Cloud Trace integration', zh: 'OpenTelemetry，带 Google Cloud Trace 集成' },
    },
    howDiffer: {
      en: 'ADK is <em>code-first and explicit</em>: you compose an <code>LlmAgent</code> with workflow agents — <code>SequentialAgent</code>, <code>ParallelAgent</code>, <code>LoopAgent</code> — into a hierarchy, and it carries a FastAPI-based serving and Google Cloud deploy story. open-multi-agent doesn’t ask you to lay out the workflow: a coordinator decomposes the goal into a task DAG at runtime and parallelizes it. ADK is Gemini-first (other models via LiteLLM) and pulls a web-server stack into its ~24 dependencies; OMA is provider-neutral, three dependencies, and ships no server.',
      zh: 'ADK 是<em>code-first 且显式</em>的：你把一个 <code>LlmAgent</code> 和 workflow 智能体——<code>SequentialAgent</code>、<code>ParallelAgent</code>、<code>LoopAgent</code>——组合成一个层级，并带着一套基于 FastAPI 的服务与 Google Cloud 部署路径。open-multi-agent 不要求你铺开工作流：协调器在运行时把目标拆解成任务 DAG 并并行化。ADK 是 Gemini 优先（其它模型经 LiteLLM），并把一套 web 服务器栈拉进它约 24 个依赖里；OMA 提供方中立、三个依赖，且不带服务器。',
    },
    whenThem: {
      en: 'Choose ADK when you’re in Google’s ecosystem and want explicit control of the agent workflow — sequential, parallel, and loop agents you assemble yourself — plus a first-party path to deploying on Vertex AI. Its evaluation tooling and Gemini integration are strong, and the code-first model is clear.',
      zh: '当你在谷歌生态里、想要对智能体工作流的显式控制时选 ADK——你自己拼装的顺序、并行、循环智能体——外加一条部署到 Vertex AI 的一方路径。它的评估工具与 Gemini 集成很强，code-first 模型也清晰。',
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
      zh: 'open-multi-agent 对比微软 Semantic Kernel：精简、TypeScript 原生、目标驱动的运行时，对上微软的企业级 LLM SDK（C# 优先）——它正并入 Microsoft Agent Framework。一份诚实、可溯源的对比。',
    },
    lede: {
      en: 'Semantic Kernel is Microsoft’s enterprise LLM SDK, strongest in the .NET world; open-multi-agent is a lean, TypeScript-native, goal-driven runtime. Microsoft is now converging its agent work into the Microsoft Agent Framework.',
      zh: 'Semantic Kernel 是微软的企业级 LLM SDK，在 .NET 世界里最强；open-multi-agent 则是一个精简、TypeScript 原生、目标驱动的运行时。微软正把其智能体工作并入 Microsoft Agent Framework。',
    },
    chooseThem: {
      en: 'You’re in the Microsoft / .NET / Azure ecosystem and want a first-party SDK — plugins, functions, agents — with a supported path forward via the Microsoft Agent Framework.',
      zh: '你在微软 / .NET / Azure 生态里，想要一个一方 SDK——插件、函数、智能体——并有一条经 Microsoft Agent Framework 的受支持前进路径。',
    },
    chooseUs: {
      en: 'You’re in Node/TypeScript and want a lean, provider-neutral, goal-driven runtime with three dependencies and a hard token budget — no .NET, no Azure assumption.',
      zh: '你在 Node/TypeScript 里，想要一个精简、提供方中立、目标驱动的运行时，三个依赖、一道硬性 token 预算——不带 .NET、不假设 Azure。',
    },
    them: {
      language: { en: '.NET / C#-first; first-party Python and Java; no TypeScript', zh: '.NET / C# 优先；一方支持 Python 与 Java；无 TypeScript' },
      paradigm: { en: 'Plugins / functions plus agents; multi-agent orchestration is moving to the Microsoft Agent Framework', zh: '插件 / 函数，加上智能体；多智能体编排正迁往 Microsoft Agent Framework' },
      deps: { en: '~22 direct in the Python package; the newer Agent Framework core is much leaner (~4)', zh: 'Python 包约 22 个直接依赖；更新的 Agent Framework 内核精简得多（约 4 个）' },
      mixedModel: { en: 'Yes — per-agent model / service', zh: '支持——按智能体设模型 / 服务' },
      budget: { en: 'No hard token cap', zh: '无硬性 token 上限' },
      observability: { en: 'Native OpenTelemetry', zh: '原生 OpenTelemetry' },
    },
    note: {
      en: 'Heads-up: in 2026 Microsoft began converging <strong>Semantic Kernel</strong> and <strong>AutoGen</strong> into the new <strong>Microsoft Agent Framework</strong> (Python + .NET) as the go-forward multi-agent stack. Semantic Kernel remains supported, but if you’re choosing for a new, long-lived project, weigh building on the Agent Framework directly.',
      zh: '提醒：2026 年微软开始把 <strong>Semantic Kernel</strong> 与 <strong>AutoGen</strong> 并入新的 <strong>Microsoft Agent Framework</strong>（Python + .NET），作为其前进方向的多智能体栈。Semantic Kernel 仍受支持，但若你在为一个全新、长期的项目做选择，值得掂量是否直接构建在 Agent Framework 上。',
    },
    howDiffer: {
      en: 'Semantic Kernel is an <em>enterprise SDK</em> — plugins, functions, planners, and agents — built C#-first with first-party Python and Java, and it’s deeply at home in the Microsoft/Azure stack. Its multi-agent future is the <em>Microsoft Agent Framework</em>, which unifies SK and AutoGen. open-multi-agent is a lean, TypeScript-native runtime that decomposes a goal into a task DAG at runtime; it assumes no particular cloud and carries three dependencies. The choice is largely ecosystem: .NET/Azure versus Node/TypeScript.',
      zh: 'Semantic Kernel 是一个<em>企业级 SDK</em>——插件、函数、planner 与智能体——以 C# 优先构建，一方支持 Python 与 Java，在微软/Azure 栈里如鱼得水。它的多智能体未来是 <em>Microsoft Agent Framework</em>，它统一了 SK 与 AutoGen。open-multi-agent 则是一个精简、TypeScript 原生的运行时，在运行时把目标拆解成任务 DAG；它不假设特定云，带三个依赖。选择很大程度上是生态之别：.NET/Azure 对上 Node/TypeScript。',
    },
    whenThem: {
      en: 'Choose Semantic Kernel (or its successor, the Microsoft Agent Framework) when you’re invested in .NET/Azure and want a first-party, enterprise-supported SDK with strong Microsoft integration and native OpenTelemetry. In that ecosystem, the first-party support and roadmap are the deciding factors.',
      zh: '当你深耕 .NET/Azure、想要一个一方、企业级受支持、与微软深度集成并带原生 OpenTelemetry 的 SDK 时，选 Semantic Kernel（或其继任者 Microsoft Agent Framework）。在那套生态里，一方支持与路线图是决定性因素。',
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
