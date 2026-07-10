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
];

export const COMPARE_SLUGS: readonly string[] = COMPARISONS.map((c) => c.slug);

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
