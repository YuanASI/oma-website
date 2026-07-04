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
];

export const COMPARE_SLUGS: readonly string[] = COMPARISONS.map((c) => c.slug);

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
