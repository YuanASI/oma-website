// English UI strings for the custom pages. This is the source-of-truth shape:
// `UiDict = typeof en`, and every other locale (./zh.ts) must match it key-for-key
// (a missing key is a type error caught by the `pnpm check` CI gate, which runs
// tsc — `astro build` uses esbuild and does NOT type-check, so build alone would
// ship a missing key as `undefined`).
//
// What is NOT here (stays English / invariant on every locale): package names,
// API identifiers, URLs, and build-time-fetched data (example blurbs from the repo
// README, live GitHub stats). The third-party endorsement quote is a real attributed
// citation and is kept verbatim in both locales.
export const en = {
  nav: {
    brandAria: 'Open Multi-Agent — home',
    // Top-level dropdown labels. `product` fronts the evaluate-the-framework pages
    // (architecture/examples/compare); `community` fronts showcase/blog; `code`
    // fronts the off-site source links (repo/forge/npm), whose entries are codeMenu.
    product: 'Product',
    docs: 'Docs',
    community: 'Community',
    code: 'Code',
    codeMenu: {
      framework: { pkg: 'open-multi-agent', desc: 'The multi-agent orchestration framework.' },
      forge: { pkg: 'oma-forge', desc: 'Experimental project under the open-multi-agent org.' },
      npm: { pkg: '@open-multi-agent/core', desc: 'The published package on npm.' },
    },
    architecture: 'Architecture',
    examples: 'Examples',
    showcase: 'Showcase',
    blog: 'Blog',
    compare: 'Compare',
    solutions: 'Solutions',
    integrations: 'Integrations',
    menuDesc: {
      architecture: 'How OMA works, diagrammed',
      examples: 'Runnable recipes from the repo',
      compare: 'vs LangGraph, CrewAI, AutoGen & more',
      showcase: 'Projects built with OMA',
      blog: 'Notes on multi-agent orchestration',
      solutions: 'Multi-agent use cases in TypeScript',
      integrations: 'Anthropic, OpenAI, Gemini, Ollama & more',
    },
    stars: 'stars',
    toggleThemeAria: 'Toggle light/dark theme',
    toggleThemeTitle: 'Toggle theme',
    menuAria: 'Menu',
  },

  langSwitcher: {
    // aria-label + title on the icon toggle; {lang} → the target locale's label.
    toAria: 'Switch to {lang}',
  },

  footer: {
    blurb: 'From a goal to a task DAG, automatically.<br />TypeScript-native multi-agent orchestration.',
    product: { head: 'Product', capabilities: 'Capabilities', useCases: 'Use cases', integrations: 'Integrations', faq: 'FAQ' },
    resources: { head: 'Resources', docs: 'Docs', architecture: 'Architecture', examples: 'Examples', showcase: 'Showcase', compare: 'Compare', blog: 'Blog' },
    project: { head: 'Project', github: 'GitHub', npm: 'npm', mitLicense: 'MIT license', llmsTxt: 'llms.txt', rss: 'RSS' },
    resourcesEnterprise: 'Enterprise support',
    mitLicensed: 'MIT licensed · @open-multi-agent',
    builtBy: 'Built by',
  },

  // Enterprise-support CTA (§3.2). Shared by the /compare pages and the examples
  // cookbook. The OSS site stays zero-commercial; this is one understated pointer
  // to YuanASI's paid delivery, shown where selection- and production-stage
  // readers already are — never a hard sell.
  enterpriseCta: {
    eyebrow: 'Enterprise',
    title: 'Taking this to production?',
    body: 'open-multi-agent is MIT-licensed and free to run yourself. When you need it delivered, integrated, or supported on a deadline, 元定义科技 (YuanASI) offers commercial delivery and support.',
    button: 'Enterprise support',
  },

  taskStatus: {
    done: 'DONE',
    running: 'RUNNING',
    queued: 'QUEUED',
    failed: 'FAILED',
    skipped: 'SKIPPED',
    statusPrefix: 'STATUS: ',
    badge: { stable: 'stable', live: 'live', error: 'error' },
  },

  landing: {
    seo: {
      title: 'Open Multi-Agent — From a goal to a task DAG, automatically',
      description: 'TypeScript-native multi-agent orchestration. A coordinator turns a goal into a task DAG, parallelizes it, and synthesizes a typed result — drops into any Node.js backend.',
    },
    hero: {
      eyebrow: 'TypeScript multi-agent orchestration',
      h1: 'From a goal to a task DAG, ',
      h1Accent: 'automatically.',
      meta: ['3 runtime deps', 'any model', 'runs anywhere'],
      quickStart: 'Quick Start',
      ioInput: 'input · team.ts',
      ioGoal: 'goal',
      decomposesInto: 'decomposes into',
      parallel: 'parallel',
      runReal: 'real',
      runTasks: 'tasks',
    },
    copy: 'copy',
    copied: '✓ copied',
    sectionCapabilities: {
      eyebrow: 'How it works',
      title: 'An agent runtime, not a graph builder.',
      sub: 'Goal-first, not graph-first. You describe the outcome; OMA owns the decomposition, the parallelism, and the synthesis.',
    },
    caps: [
      { n: '01', t: 'Goal-driven coordinator', d: 'You pass a goal, not a graph. The coordinator decomposes it into a task DAG, runs the independent nodes in parallel, and synthesizes the final result.' },
      { n: '02', t: 'Mix any model in one team', d: 'Each agent names its own model, and they cooperate inside a single team. Built-in providers include Anthropic, OpenAI, Gemini, Bedrock, Azure OpenAI, and DeepSeek (13 in total), plus any OpenAI-compatible endpoint.' },
      { n: '03', t: 'Tools and MCP, default-deny', d: 'An agent gets only the tools it is granted. Model Context Protocol servers expose external systems under the same opt-in contract.' },
      { n: '04', t: 'Streaming and structured output', d: 'Stream tokens and node-state transitions as the DAG fills, or await a typed, schema-validated object when the run completes.' },
      { n: '05', t: 'Cross-provider reasoning', d: 'One thinking config maps to Anthropic thinking, Gemini thinkingConfig, and OpenAI reasoning_effort. Reasoning streams as events, and can be preserved across a provider switch when you opt in.' },
    ],
    oneCall: { title: 'One call', body: 'runTeam() returns when the whole DAG resolves — no manual node wiring, no scheduler to maintain.' },
    capsLinks: { threeWays: 'runAgent · runTeam · runTasks — three ways to run', archFlow: 'See the architecture and runTeam() flow' },
    sectionReliability: {
      eyebrow: 'Reliability',
      title: 'Built to run in production.',
      sub: "Handing real work to autonomous agents raises three fair questions: do they run off the rails, burn the budget, or fail where you can't see it? Each one has an answer in the API.",
    },
    reliability: [
      {
        tag: "won't run away",
        t: 'You stay in the loop',
        ref: '/guides/orchestration-controls/',
        refLabel: 'orchestration controls',
        parts: [
          'Inspect the plan before any agent runs with ', { c: 'onPlanReady' },
          ', then approve each round with ', { c: 'onApproval' },
          ". A proposer→judge pass (", { c: 'runConsensus' },
          ") has one agent check another's output, and loop detection halts an agent that starts repeating itself.",
        ],
      },
      {
        tag: "won't burn the budget",
        t: 'Spend where it counts',
        ref: '/reference/model-routing/',
        refLabel: 'model routing',
        parts: [
          'Route planning to a flagship model and the leaf tasks to cheap ones with ', { c: 'modelRouting' },
          '. ', { c: 'maxTokenBudget' },
          " caps a run's spend — cross it and the orchestrator stops issuing calls instead of running up the bill.",
        ],
      },
      {
        tag: 'debug any run',
        t: 'Inspect, replay, resume',
        ref: '/reference/observability/',
        refLabel: 'observability',
        parts: [
          'Stream every LLM and tool call to your tracing stack with ', { c: 'onTrace' },
          ', or open a self-contained HTML dashboard after the run (', { c: 'oma run --dashboard' },
          '). Checkpoints resume a crashed run from its last completed task, and secrets are redacted from traces and dashboards on a best-effort basis.',
        ],
      },
    ],
    dashboard: {
      caption: 'And when something does slip, every run can render an auditable dashboard — the task DAG, per-node assignee and status, token breakdown, and the agent output log.',
      obsLink: 'Observability',
      imgAlt: 'Post-run dashboard replaying a completed team run: the task DAG with per-node assignee, status, token breakdown, and the agent output log.',
    },
    sectionBuild: {
      eyebrow: 'Use cases',
      title: 'Three workflows worth a team.',
      sub: 'Each is a single goal that benefits from parallel, multi-model decomposition — exactly what the coordinator is built for.',
      seeCode: 'see code',
    },
    builds: [
      { scenario: 'legal · document review', title: 'Contract review', desc: 'One goal — “flag risk in this MSA” — fans out to agents reading clauses, cross-checking a policy library, and drafting redlines in parallel.', outcome: 'A single structured risk report from one runTeam() call.' },
      { scenario: 'market · monitoring', title: 'Competitive monitoring', desc: 'Agents pull from different sources via MCP, each on the model that fits — cheap-local for scraping, frontier for analysis — and reconcile findings.', outcome: 'A deduped digest, refreshed on a schedule, mixed providers in one team.' },
      { scenario: 'sre · operations', title: 'Incident postmortem', desc: 'Logs, metrics, and the deploy timeline are investigated as parallel nodes; a reviewer agent synthesizes cause and contributing factors.', outcome: 'A timeline-grounded postmortem draft minutes after resolution.' },
    ],
    sectionStack: {
      eyebrow: 'Integrations',
      title: 'Works with your stack.',
      sub: 'OMA composes with the providers, protocols, and servers already in your backend — no platform to migrate to.',
    },
    stack: [
      { name: 'Providers', note: 'Anthropic, Gemini, OpenAI, Bedrock, Azure, DeepSeek — or any OpenAI-compatible endpoint', count: '13 built-in' },
      { name: 'MCP', note: 'Connect Model Context Protocol servers as tools', count: 'native' },
      { name: 'Vercel AI SDK', note: 'Bridge to 60+ AI SDK providers and hosts', count: 'compatible' },
      { name: 'Express', note: 'Mount runTeam() behind a route handler', count: 'drop-in' },
      { name: 'Any Node.js', note: 'No daemon, no sidecar — three runtime deps', count: 'Node 18+' },
    ],
    sectionProof: {
      eyebrow: 'Adoption',
      title: 'Already running in the wild.',
      sub: 'Open source and MIT-licensed, with a growing ecosystem of projects and integrations. Star, fork, and contributor counts read straight from the repo at build time.',
      liveTag: 'live · synced from registry',
      stats: { stars: 'stars', forks: 'forks', contributors: 'contributors', latestRelease: 'latest release', license: 'license' },
    },
    sectionFaq: {
      eyebrow: 'FAQ',
      title: 'Mechanism, not marketing.',
      sub: 'How the runtime actually behaves. The full reference lives in the docs.',
      viewAll: 'view all questions',
    },
    faqs: [
      { q: 'How does the coordinator turn a goal into a DAG?', a: 'A coordinator agent plans the work: it breaks the goal into discrete tasks, infers dependencies between them, and emits a directed acyclic graph. Independent nodes run concurrently; dependent nodes wait on their inputs. Pass planOnly to inspect the DAG before any agent executes.' },
      { q: 'Can agents in one team use different model providers?', a: 'Yes. Each agent declares its own model, so a single team can mix a frontier cloud model, a self-hosted endpoint, and a local Ollama instance. The coordinator routes each task to the agent — and therefore the model — assigned to it.' },
      { q: 'How do tools get exposed to an agent?', a: 'Default-deny. An agent only has the tools it explicitly lists in its tools array; everything else is unavailable. External systems are connected through MCP servers under the same opt-in contract.' },
      { q: 'What happens when a node fails?', a: 'A failed node is retried under its policy; persistent failures surface on the node with FAILED state and an error, and downstream dependents are held. The rest of the DAG keeps running, so one failure does not abort the whole run.' },
      { q: 'How do I keep a multi-agent run from going off the rails?', a: 'Layered controls, all opt-in. onPlanReady hands you the decomposed plan to inspect before any agent runs, and onApproval gates each round; return false and the remaining tasks are skipped. runConsensus adds a proposer→judge check that a second agent must accept, and loop detection halts an agent that keeps repeating the same tool call or output.' },
      { q: 'How do I cap what a run costs?', a: 'Two levers. modelRouting sends planning and synthesis to a flagship model while leaf tasks run on a cheaper one, so you pay frontier rates only where they matter. maxTokenBudget is a hard ceiling on cumulative tokens: cross it and the orchestrator stops issuing calls and skips the remaining tasks instead of running up the bill.' },
      { q: 'Does it stream, or only return at the end?', a: 'Both. You can stream tokens and node-state transitions as the DAG fills, or simply await runTeam() for a typed, schema-validated result object once the graph resolves.' },
      { q: "How does open-multi-agent relate to Claude Code's dynamic workflows?", a: "They make the same bet — the model plans the work at runtime instead of you wiring a fixed graph. Claude's dynamic workflows run inside Claude Code, where Claude writes its own orchestration scripts and fans out parallel subagents in a session. open-multi-agent embeds that same goal-to-DAG idea in your own Node.js backend as an MIT library, on any provider, with the plan kept as inspectable, replayable data. The two also compose: over ACP an open-multi-agent team can run Claude Code itself as one of its agents." },
    ],
    endorse: {
      eyebrow: 'mentioned',
      // Real attributed citation — kept verbatim in every locale (translating a quote
      // would misrepresent it).
      quote: 'A brilliant TypeScript-native multi-agent orchestration framework.',
      cite: 'GithubAwesome · 58K subscribers · GitHub Trending Monthly #6',
      imgAlt: "Watch on YouTube — GithubAwesome's GitHub Trending Monthly #6, paused on the open-multi-agent GitHub repository (6k stars).",
    },
    ctaFinal: {
      eyebrow: 'get started',
      title1: 'Start with one goal.',
      title2: 'Let the team figure out the work.',
      quickStart: 'Quick Start',
    },
  },

  examples: {
    seo: {
      title: 'Examples — Open Multi-Agent',
      description: 'Runnable, end-to-end examples for Open Multi-Agent — cookbook recipes framed by the problem they solve, framework and app integrations, orchestration patterns, and one example per model provider. Straight from the repo.',
    },
    hero: {
      eyebrow: 'examples',
      title: 'What you can build with OMA.',
      lede: 'Runnable recipes straight from the repo — each framed by the problem it solves. Browse by what you want to build, then open the source.',
    },
    seeSource: 'see source',
    cookbook: {
      eyebrow: 'Cookbook',
      title: 'Recipes for real problems.',
      sub: 'End-to-end scripts built around a concrete task, not a single primitive — open the source to see how the patterns compose on a real workflow.',
      subFallback: 'A few end-to-end recipes to start from. The full, always-in-sync suite — integrations, orchestration patterns, and one example per model provider — lives in the repo.',
    },
    integrations: {
      eyebrow: 'Integrations',
      title: 'Works with your stack.',
      sub: 'A library, not a platform — it composes with the protocols, servers, and frameworks already in your backend.',
      reference: 'Reference integrations',
      apps: 'Apps · clone and run',
      vendor: 'Vendor integrations',
    },
    buildingBlocks: {
      eyebrow: 'Building blocks',
      title: 'Primitives, patterns, and providers.',
      sub: "The lower-level pieces the cookbook composes — start here if you're learning the API or comparing models.",
      basics: 'Basics · start here',
      patterns: 'Patterns',
      providers: 'Providers · one example per model',
    },
    production: {
      title: 'Production examples',
      desc: 'End-to-end, production-grade use cases — a higher bar, with tests and pinned models. See the contribution criteria to add one.',
      link: 'production/ on GitHub',
    },
    footPre: "Generated at build time from the repo's ",
    footCode: 'packages/core/examples',
    footPost: ' tree, so it always matches the source. ',
    browseAll: 'Browse all on GitHub',
  },

  showcase: {
    seo: {
      title: 'Showcase — Open Multi-Agent',
      description: 'Open-source projects built with Open Multi-Agent and tools that integrate with it — from a production WordPress security platform to PR review, agent memory, and observability.',
    },
    hero: {
      eyebrow: 'Showcase',
      title: 'Built on Open Multi-Agent.',
      subPre: 'Open-source projects built with the framework, and tools that integrate with it — drawn from the ecosystem, MIT-licensed. Building something with OMA? ',
      discuss: 'Open a discussion',
      subPost: ' to get listed.',
    },
    builtWith: { eyebrow: 'Built with OMA', title: 'OMA at the core.', sub: 'Applications that run their agent teams on Open Multi-Agent.' },
    integrates: { eyebrow: 'Integrates with OMA', title: 'Extend a running team.', sub: 'Drop-in tools that add new capabilities to Open Multi-Agent.' },
    // Per-entry overrides keyed by `pkg` (src/lib/showcase.ts is the English source,
    // so EN leaves this empty and the page falls back to the entry's own fields).
    entries: {} as Record<string, { desc: string; tag: string; status: string }>,
  },

  architecture: {
    seo: {
      title: 'How OMA works — architecture & runTeam() flow',
      description: 'The Open Multi-Agent architecture and the runTeam() execution flow, diagrammed: a coordinator decomposes a goal into a task DAG, fans agents out in parallel over a shared MessageBus, and synthesizes the result.',
    },
    hero: {
      eyebrow: 'how it works',
      title: 'How OMA works.',
      // Inline <b>/<i>/<code> markup — rendered with set:html (trusted dict content).
      ledeHtml: 'Two diagrams, one system. The <b>architecture</b> is the structure — what OMA <i>is</i>. The <b>flow</b> is time — what happens when you call <code>runTeam()</code>.',
    },
    structure: {
      eyebrow: 'structure',
      title: 'The architecture.',
      sub: 'Five layers, top to bottom: the orchestrator you call, the team it coordinates, the pool and queue that schedule the work, the agent that does it, and the adapter, runner, and tool interfaces underneath. Every box maps one-to-one to a type in the framework.',
      imgAlt: 'OMA architecture. OpenMultiAgent is the entry point and owns a Team, which holds an AgentPool and a TaskQueue. The Agent runs through an AgentRunner conversation loop and talks to the LLMAdapter interface (multiple provider implementations) and the ToolRegistry (defineTool plus 6 built-in tools).',
    },
    structureLegend: [
      { k: 'accent border', d: 'User entry point — the class you instantiate. Exactly one per diagram.' },
      { k: 'solid', d: 'Concrete type — a class with one implementation: Team, AgentPool, TaskQueue, Agent, AgentRunner.' },
      { k: 'dashed', d: 'Interface with multiple implementations — LLMAdapter providers, ToolRegistry tools.' },
      { k: 'arrow', d: 'Owns / contains — the source instantiates or owns the target. Read top-down.' },
    ],
    execution: {
      eyebrow: 'execution',
      titleHtml: 'One <code>runTeam()</code> call.',
      sub: 'Goal in, result out. The coordinator decomposes the goal into a task DAG, fans the agents out in parallel, carries intermediate results over the MessageBus, and synthesizes the final answer. Read it left to right — the horizontal axis is time.',
      imgAlt: 'The runTeam() flow. A goal decomposes into four tasks; an architect and two developers run in parallel, the reviewer waits on them via a TaskQueue dependency, the MessageBus connects the tracks, and a typed result object is synthesized at the end.',
    },
    flowRead: [
      { k: 'vertical = which agent', d: 'Each agent gets its own horizontal track, like a voice in a music score.' },
      { k: 'horizontal = when', d: 'Tracks aligned at the same x run at the same logical time; a track that ends earlier finished first.' },
      { k: 'reviewer waits', d: 'The reviewer is offset right — a TaskQueue dependency on the architect and the two developers.' },
      { k: 'message bus', d: 'The dashed-emerald band is the channel any agent can publish to and subscribe from during execution.' },
    ],
    next: {
      eyebrow: 'go deeper',
      title: 'From diagram to code.',
      threeWays: 'runAgent · runTeam · runTasks',
      quickStart: 'Quick Start',
    },
  },

  blog: {
    seo: {
      title: 'Blog — Open Multi-Agent',
      description:
        'Writing on TypeScript multi-agent orchestration: goal-driven task DAGs, mixed-model teams, long-term memory, and lessons from the agent-framework ecosystem.',
    },
    eyebrow: 'Blog',
    title: 'Notes on multi-agent orchestration.',
    // Index lede. The inline link renders only when `ledeLink` is set: the en
    // index points at dev.to ("Cross-posted from dev.to"); the zh index drops it
    // (translations aren't cross-posted) by leaving ledeLink/ledePost empty.
    ledePre:
      'Deep dives on goal-driven task DAGs, mixed-model teams, and the TypeScript agent ecosystem. Cross-posted from ',
    ledeLink: 'dev.to',
    ledePost: '.',
    minRead: 'min read',
    allPosts: '← All posts',
    // en posts show "Originally published on dev.to"; zh translations show the
    // "translated from" link to the en original instead.
    originallyOn: 'Originally published on',
    translatedFrom: 'Read the English original',
  },

  // Comparison pages (§7.2). Chrome only — the per-framework copy (matrix cells,
  // narrative) lives in src/lib/compare.ts. {name} is interpolated with the
  // competitor's name at render time.
  compare: {
    seo: {
      title: 'open-multi-agent vs LangGraph, CrewAI, Mastra, LangChain, Pydantic AI & more',
      description: 'Honest, sourced comparisons of open-multi-agent against the main multi-agent frameworks — language, orchestration model, dependencies, budget control, and observability, and when to pick each.',
    },
    hero: {
      eyebrow: 'compare',
      title: 'How open-multi-agent compares.',
      lede: 'Choosing a multi-agent framework? Here is an honest, side-by-side look at open-multi-agent against the main alternatives — the dimensions that actually decide it, and a fair account of when the other tool is the better call.',
    },
    hub: {
      pickThem: 'Pick {name} if',
      pickUs: 'Pick open-multi-agent if',
      view: 'Full comparison',
      moreTitle: 'More comparisons',
      moreLede: 'The same full side-by-side treatment, for frameworks and adjacent tools — single-agent toolkits, RAG stacks, cloud-vendor SDKs.',
    },
    page: {
      eyebrow: 'comparison',
      vsTitle: 'open-multi-agent vs {name}',
      seoTitle: 'open-multi-agent vs {name} — an honest comparison',
      matrix: { eyebrow: 'at a glance', title: 'Side by side.', dimension: 'Dimension', oma: 'open-multi-agent' },
      howDiffer: { eyebrow: 'mechanism', title: 'How they differ.' },
      whenThemTitle: 'When {name} is the better choice',
      whenUsTitle: 'Where open-multi-agent fits',
      repoLink: '{name} on GitHub',
      seeAlso: 'Compare with another framework',
      backToHub: 'All comparisons',
    },
  },

  // /compare/claude-dynamic-workflows — a standalone page (NOT a COMPARISONS
  // entry) that captures "claude dynamic workflows" search intent and routes it
  // to OMA. Framing per the repo README's "vs. Claude Code's dynamic workflows"
  // entry: same bet (the model plans the work at runtime), different form factor.
  // GUARDRAILS baked into the copy: never call OMA an "alternative to" dynamic
  // workflows (that word is reserved for LangGraph/Mastra, see seeAlso); never
  // argue who is "more dynamic" (both are model-driven); never assert what
  // dynamic workflows lacks — every "Claude dynamic workflows" cell states only
  // what the official post says it does. Facts verified against
  // claude.com/blog/introducing-dynamic-workflows-in-claude-code (May 2026).
  dynamicWorkflows: {
    seo: {
      title: 'Claude dynamic workflows, self-hosted — open-multi-agent',
      description:
        'Claude dynamic workflows and open-multi-agent make the same bet: the model plans the work at runtime. The difference is form factor — dynamic workflows run inside Claude Code; open-multi-agent is an open-source (MIT) TypeScript library that runs the same goal-to-DAG idea in your own backend, on any model.',
    },
    hero: {
      eyebrow: 'in context',
      backToHub: 'All comparisons',
      h1: 'Claude dynamic workflows, and open-multi-agent',
      lede: 'In May 2026, Anthropic shipped dynamic workflows in Claude Code: the model plans and orchestrates the work at runtime. open-multi-agent makes the same bet in a different form factor.',
    },
    cards: {
      dwLabel: 'Claude dynamic workflows',
      dwBody:
        'Model-driven orchestration inside Claude Code. Claude writes its own orchestration scripts and fans out tens to hundreds of parallel subagents in a single session, checking its work before anything reaches you.',
      dwLink: 'Read the announcement',
      omaLabel: 'open-multi-agent',
      omaBody:
        'An MIT-licensed TypeScript library. A coordinator turns your goal into a task DAG at runtime and runs it in your own backend, on any provider — with the plan exposed as data you can inspect and replay.',
      omaLink: 'Quick Start',
    },
    bet: {
      eyebrow: 'the shared bet',
      title: 'The same bet: the model plans the work.',
      body: "Both are model-driven. You don't wire a fixed graph up front — you hand over a goal and the model plans the work at runtime, decomposing it into steps that run in parallel and pulling the results back together. Claude's dynamic workflows do this inside Claude Code; open-multi-agent's coordinator does it in your backend. Same idea — so this page won't argue over which is <em>more dynamic</em>. The useful question is where the orchestration runs, and what you can do with the plan.",
    },
    form: {
      eyebrow: 'the difference',
      title: 'The difference is form factor.',
      intro: "They aren't the same kind of thing. Claude dynamic workflows are a capability inside Claude Code, orchestrating Claude subagents. open-multi-agent is a library you install into a TypeScript backend and point at any provider. Here is how the two line up.",
      th: { dimension: 'Dimension', dw: 'Claude dynamic workflows', oma: 'open-multi-agent' },
      rows: [
        { k: 'Where it runs', dw: 'Inside Claude Code — CLI, desktop, and IDE', oma: 'Your own Node.js backend — installed with npm, no hosted service to adopt' },
        { k: 'What it is', dw: 'A capability of Claude Code', oma: 'An open-source (MIT) library you embed' },
        { k: 'Models', dw: 'Claude subagents', oma: 'Any provider — OpenAI, Anthropic, Gemini, Bedrock, or any local / OpenAI-compatible model' },
        { k: 'Language / surface', dw: 'Used from Claude Code', oma: 'TypeScript, in any Node.js 18+ backend' },
        { k: 'The plan', dw: 'Orchestration scripts Claude writes and runs in the session, checking its work before returning', oma: 'A task DAG you can inspect and replay as data — planOnly, createPlanArtifact, runFromPlan' },
      ],
    },
    compose: {
      eyebrow: 'composable',
      title: 'Composable, not just parallel.',
      body: "These aren't mutually exclusive. open-multi-agent speaks the Agent Client Protocol (ACP), so an OMA team can drive external coding agents — including Claude Code itself — as one agent inside the team. The model-planned orchestration you get in Claude Code can become a single node in a larger, provider-neutral run that you own end to end.",
    },
    fit: {
      eyebrow: 'where oma fits',
      title: 'Where open-multi-agent fits.',
      body: 'Reach for open-multi-agent when the orchestration needs to live inside your own product: an open-source (MIT) library you <code>npm install</code> into a Node.js backend, running on any provider — OpenAI, Anthropic, Gemini, Bedrock, or a local, OpenAI-compatible model. The coordinator plans the task DAG at runtime, and the plan is data you can inspect, replay, and gate — <code>planOnly</code> to review it before anything runs, <code>createPlanArtifact</code> to store it, <code>runFromPlan</code> to execute a plan you have already vetted.',
      cta: 'Quick Start',
    },
    seeAlso: {
      eyebrow: 'comparing frameworks?',
      title: 'Looking for a framework alternative?',
      body: 'Weighing orchestration libraries against each other is a different question. See how open-multi-agent compares with LangGraph, Mastra, and the other frameworks.',
      cta: 'All framework comparisons',
    },
    // Rendered on the /compare hub in a separate band, deliberately kept out of
    // the competitor grid so it never reads as "OMA vs a Claude feature".
    hubCard: {
      label: 'in context',
      name: 'open-multi-agent and Claude dynamic workflows',
      blurb: 'Same bet — the model plans the work — in a different form factor. How OMA relates to Anthropic’s dynamic workflows in Claude Code.',
      cta: 'Read',
    },
  },

  // Use-case ("solutions") pages. Chrome only — the per-use-case copy lives in
  // src/lib/solutions.ts.
  solutions: {
    seo: {
      title: 'Use cases — multi-agent orchestration in TypeScript',
      description: 'What you can build with open-multi-agent: parallel LLM calls, goal-driven task DAGs, mixed-model teams, local agents, long-term memory, and orchestration on top of the Vercel AI SDK.',
    },
    hero: {
      eyebrow: 'use cases',
      title: 'What you can build.',
      lede: 'Common shapes of multi-agent work in TypeScript — each with the mechanism, when it fits, and a full walkthrough with runnable code.',
    },
    hub: { view: 'See how' },
    page: {
      eyebrow: 'use case',
      backToHub: 'All use cases',
      problemEyebrow: 'the problem',
      problemTitle: 'The problem.',
      approachEyebrow: 'the approach',
      approachTitle: 'How open-multi-agent does it.',
      whenEyebrow: 'fit',
      whenTitle: 'When this fits.',
      walkthroughEyebrow: 'walkthrough',
      walkthroughCta: 'Read the full walkthrough, with runnable code',
      relatedCompare: 'Related comparisons',
      seeAlso: 'More use cases',
    },
  },

  // Provider-integration pages. Chrome only — the per-provider copy + code lives
  // in src/lib/integrations.ts.
  integrations: {
    seo: {
      title: 'Integrations — run open-multi-agent on any model provider',
      description: 'open-multi-agent works with Anthropic, OpenAI, Gemini, DeepSeek, AWS Bedrock, Azure OpenAI, Ollama, and any OpenAI-compatible endpoint — change the provider, keep the team.',
    },
    hero: {
      eyebrow: 'integrations',
      title: 'Run on any provider.',
      lede: 'The agent config shape stays the same across providers — change the provider, model, and credential, and the rest of your team stays put. Mix them freely in one team.',
    },
    hub: { view: 'Set it up' },
    page: {
      eyebrow: 'integration',
      backToHub: 'All providers',
      setupEyebrow: 'setup',
      setupTitle: 'A minimal team.',
      howEyebrow: 'how it fits',
      howTitle: 'How it fits.',
      mixCta: 'Mix providers in one team',
      allProviders: 'All providers & env vars',
      seeAlso: 'Other providers',
    },
  },
};

export type UiDict = typeof en;
