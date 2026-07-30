// English UI strings for the custom pages. This is the source-of-truth shape:
// `UiDict = typeof en`, and every other locale (./zh.ts) must match it key-for-key
// (a missing key is a type error caught by the `pnpm check` CI gate, which runs
// tsc — `astro build` uses esbuild and does NOT type-check, so build alone would
// ship a missing key as `undefined`).
//
// What is NOT here (stays English / invariant on every locale): package names,
// API identifiers, URLs, and synchronized catalog data (example descriptions and
// live GitHub stats). The third-party endorsement quote is a real attributed
// citation and is kept verbatim in both locales.
export const en = {
  nav: {
    brandAria: 'Open Multi-Agent — home',
    // Top-level nav labels. `capabilities` exposes the framework's build and
    // production surfaces; `useCases` fronts catalog-featured examples; `whyOma`
    // groups selection and adoption proof; docs, blog, and the enterprise pathway
    // stay directly reachable.
    capabilities: 'Capabilities',
    docs: 'Docs',
    useCases: 'Use Cases',
    whyOma: 'Why OMA',
    architecture: 'Architecture',
    examples: 'Examples',
    showcase: 'Showcase',
    blog: 'Blog',
    compare: 'Compare',
    solutions: 'Solutions',
    integrations: 'Integrations',
    // Top-level link (not a dropdown) to YuanASI's paid delivery — the enterprise
    // pathway lifted out of the footer. External, so it renders with an ↗ marker.
    forCompanies: 'For Companies',
    capabilityCols: { build: 'Build', operate: 'Operate reliably' },
    capabilityMenu: {
      overview: { title: 'Capabilities overview', desc: 'The complete v1.13 runtime surface' },
      orchestration: { title: 'Orchestration', desc: 'Goal-to-DAG teams and explicit task graphs' },
      routing: { title: 'Routing & governance', desc: 'Execution modes, policy, approvals, and receipts' },
      scheduling: { title: 'Scheduling & dispatch', desc: 'Event-driven DAGs, requirements, and task results' },
      models: { title: 'Models & providers', desc: 'Cloud, local, and OpenAI-compatible options' },
      tools: { title: 'Tools & MCP', desc: 'Default-deny tools and external systems' },
      externalAgents: { title: 'External agents', desc: 'Run Claude Code and other CLIs over ACP' },
      evaluation: { title: 'Evaluation', desc: 'EvalSets, scorers, reports, and CI quality gates' },
      observability: { title: 'Observability', desc: 'TraceStore, Run Viewer, and OpenTelemetry' },
      reliability: { title: 'Reliability & control', desc: 'Budgets, approvals, retries, timeouts, and checkpoints' },
      allCapabilities: 'All capabilities',
      allIntegrations: 'All integrations',
    },
    whyOmaDesc: {
      compare: 'See how OMA differs from other agent frameworks',
      showcase: 'Real projects and teams building with OMA',
    },
    // Use Cases dropdown column headers + the left column's "view all" link
    // (the right column reuses examples.detail.browseAll).
    useCasesCols: { solutions: 'Solutions', examples: 'Examples' },
    viewAllSolutions: 'All solutions',
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
    blurb: 'A self-organizing agent team,<br />in an environment you control.',
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

  // The dialog is currently a Chinese-only conversion path. English strings
  // keep the shared dictionary shape complete for any future locale rollout;
  // English triggers continue to link directly to yuanasi.com/en.
  enterpriseDialog: {
    eyebrow: 'Direct contact',
    title: 'Put Open Multi-Agent to work in your business',
    body: 'Talk directly with the framework author about your business scenario, technical approach, and path to production.',
    servicesLabel: 'Engineering services',
    services: [
      { code: 'S-01', title: 'Custom AI Agent delivery', body: 'Business scenario mapping, Agent design, prompts and evaluation, production deployment, private hosting, and ongoing support.' },
      { code: 'S-02', title: 'Multi-agent system integration', body: 'Multi-Agent architecture and orchestration, RAG, CRM / ERP / internal API integration, performance, and reliability tuning.' },
      { code: 'S-03', title: 'Enterprise AI advisory', body: 'AI scenario assessment, technology selection, POC development, ROI estimation, and implementation roadmaps.' },
    ],
    contactEyebrow: 'Direct line',
    contactNote: 'When adding, mention your company name and what you need.',
    qrAlt: 'Personal WeChat QR code for open-multi-agent author JackChen',
    wechatId: 'JackChen_co',
    copy: 'Copy ID',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    closeAria: 'Close enterprise contact dialog',
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
      title: 'Open Multi-Agent: open-source TypeScript AI Agent framework',
      description: 'Open-source, TypeScript-native AI agent framework: one goal in, a self-organizing agent team plans and runs it in parallel, in your environment, cloud or fully offline.',
    },
    hero: {
      eyebrow: 'open-source AI Agent framework, TypeScript-native',
      h1: 'A self-organizing agent team, ',
      h1Accent: 'controlled by your TypeScript backend.',
      subtitle: 'Start from a goal or an explicit task DAG. Route, approve, budget, trace, and resume at task boundaries—in your own environment.',
      audience: 'for TypeScript backend and AI platform teams',
      meta: ['cloud + local models', 'MIT license'],
      quickStart: 'Run no-key demo',
      demoNote: 'No signup · no API key · no model request.',
      trust: { stars: 'GitHub stars', release: 'latest release', license: 'license', signup: 'no signup' },
      runtime: {
        eyebrow: 'v1.13 runtime path',
        mode: 'mode',
        modeValue: 'team',
        route: 'route',
        routeValue: 'deterministic',
        schedule: 'schedule',
        scheduleValue: 'event-driven',
        evidence: 'evidence',
        evidenceValue: 'receipt + trace',
      },
      ioInput: 'input · team.ts',
      ioGoal: 'goal',
      capturedGoal: 'captured goal',
      expandGoal: 'view full',
      collapseGoal: 'collapse',
      decomposesInto: 'decomposes into',
      parallel: 'parallel',
      expandTasks: '{count} more tasks · expand full DAG',
      runReal: 'real',
      runTasks: 'tasks',
    },
    copy: 'copy',
    copied: '✓ copied',
    copyFailed: 'Copy failed. Select and copy manually.',
    sectionWhy: {
      eyebrow: 'Why OMA',
      title: 'From intent to a controlled, inspectable run.',
      sub: 'Choose the topology, move ready work, put policy at the right boundaries, and keep the evidence.',
    },
    why: [
      {
        tag: 'plan → route',
        title: 'Start from an outcome—or an explicit graph.',
        desc: 'Use runTeam() to generate a reviewable task DAG, or runTasks() to execute the graph you define. Explicit mode, governance, or an ExecutionRouter chooses single-agent or team execution.',
        proof: 'runTeam · runTasks · mode · routingDecision',
        ref: '/reference/execution-routing/',
        refLabel: 'Review execution routing',
      },
      {
        tag: 'schedule → dispatch',
        title: 'Move work as soon as dependencies are ready.',
        desc: 'The event-driven scheduler removes unrelated round barriers. Match tasks by capability, validate hard requirements, approve each ready dispatch, and preserve unmerged task results.',
        proof: 'event-driven · onTaskDispatch · taskResults',
        ref: '/reference/task-scheduling/',
        refLabel: 'Open task scheduling',
      },
      {
        tag: 'govern → evidence',
        title: 'Put policy at the boundary it governs.',
        desc: 'Declare roles and review paths, confirm consequential tools, bound further calls at turn and task boundaries, then inspect governance conclusions, receipts, traces, and evaluation gates.',
        proof: 'governance · onToolCall · receipt · EvalSet',
        ref: '/guides/orchestration-controls/',
        refLabel: 'Review the controls',
      },
      {
        tag: 'your environment',
        title: 'Run where your data already lives.',
        desc: 'Use cloud providers, a local endpoint, or an air-gapped deployment on your credentials. Tools are default-deny, and core has only three runtime dependencies.',
        proof: 'offline · default-deny tools · 3 runtime deps',
        ref: '/guides/production-checklist/',
        refLabel: 'Open the production checklist',
      },
    ],
    whyViewer: {
      eyebrow: 'Run evidence',
      title: 'Inspect what happened after every run.',
      body: 'The offline Run Viewer turns a completed run into reviewable evidence, without sending it to a hosted OMA service.',
      points: ['Task DAG and assignees', 'Model, provider, token, and cost rollups', 'Tool calls, status, and safe evidence details'],
      link: 'Open the observability reference',
    },
    sectionCapabilities: {
      eyebrow: 'How it works',
      title: 'An agent runtime, not a graph builder.',
      sub: 'Goal-first, not graph-first. You describe the outcome; OMA owns the decomposition, the parallelism, and the synthesis.',
    },
    caps: [
      { n: '01', t: 'Goal-driven coordinator', d: 'You pass a goal, not a graph. The coordinator decomposes it into a task DAG, runs the independent nodes in parallel, and synthesizes the final result.' },
      { n: '02', t: 'Mix any model in one team', d: 'Each agent names its own model, and they cooperate inside a single team. Use built-in providers such as Anthropic, OpenAI, Gemini, Bedrock, Azure OpenAI, and DeepSeek, or any OpenAI-compatible endpoint.' },
      { n: '03', t: 'Tools and MCP, default-deny', d: 'An agent gets only the tools it is granted. Model Context Protocol servers expose external systems under the same opt-in contract.' },
      { n: '04', t: 'Streaming and structured output', d: 'Stream tokens and node-state transitions as the DAG fills, or await a typed, schema-validated object when the run completes.' },
      { n: '05', t: 'Cross-provider reasoning', d: 'One thinking config maps to Anthropic thinking, Gemini thinkingConfig, and OpenAI reasoning_effort. Reasoning streams as events, and can be preserved across a provider switch when you opt in.' },
      { n: '06', t: 'Run coding CLIs as agents', d: 'Over the Agent Client Protocol (ACP), external coding agents (Claude Code included) join a team as OMA agents while the coordinator keeps scheduling, shared memory, and budgets.' },
    ],
    oneCall: { title: 'One call', body: 'runTeam() returns when the whole DAG resolves. No manual node wiring, no scheduler to maintain.' },
    capsLinks: { threeWays: 'runAgent · runTeam · runTasks: three ways to run', archFlow: 'See the architecture and runTeam() flow' },
    sectionReliability: {
      eyebrow: 'Control',
      title: 'You hold the controls.',
      sub: 'Deterministic controls and measurable quality around non-deterministic agents.',
    },
    reliability: [
      {
        tag: 'in the loop',
        t: 'You stay in the loop',
        ref: '/guides/orchestration-controls/',
        refLabel: 'orchestration controls',
        parts: [
          'Preview the plan with ', { c: 'onPlanReady' },
          ', approve each round with ', { c: 'onApproval' },
          ', and gate every tool call with ', { c: 'onToolCall' },
          '. ', { c: 'runConsensus' },
          ' adds a second-agent check; loop detection stops an agent that repeats itself.',
        ],
      },
      {
        tag: 'on budget',
        t: 'Spend where it counts',
        ref: '/reference/model-routing/',
        refLabel: 'model routing',
        parts: [
          'Route planning to a flagship model and leaf tasks to cheap ones with ', { c: 'modelRouting' },
          '. Cap spend at a token or USD ceiling with ', { c: 'maxTokenBudget' },
          ' and ', { c: 'maxCostBudget' },
          ' + ', { c: 'estimateCost' },
          '.',
        ],
      },
      {
        tag: 'observable',
        t: 'Inspect, replay plans, restore tasks',
        ref: '/reference/observability/',
        refLabel: 'observability',
        parts: [
          'Freeze a vetted plan with ', { c: 'createPlanArtifact' },
          ' and replay it with ', { c: 'runFromPlan' },
          '. Open the offline Run Viewer after any run (', { c: 'oma run --dashboard' },
          '); checkpoints restore from completed task boundaries.',
        ],
      },
    ],
    evaluation: {
      tag: 'evaluation',
      title: 'Measure quality before and after deployment.',
      parts: [
        'Version ', { c: 'EvalSet' }, ' fixtures and ', { c: 'Scorer' },
        ' logic, run regressions with ', { c: 'runEvalSet()' },
        ', and enforce the result in CI with ', { c: 'oma eval gate' }, '.',
      ],
      note: 'Online sampling is opt-in and never changes the business result. Scorer failures remain scorer_error instead of becoming zero scores.',
      steps: [
        { label: 'version', value: 'EvalSet + Scorer' },
        { label: 'run', value: 'reports + aggregates' },
        { label: 'gate', value: 'GateVerdict + CLI' },
      ],
      ref: '/reference/evaluation/',
      refLabel: 'evaluation reference',
    },
    dashboard: {
      caption: 'And when something does slip, the offline Run Viewer replays the completed run: the task DAG, per-task assignee, model and provider, token and cost rollups, tool-call count, and safe evidence details.',
      obsLink: 'Observability',
      imgAlt: 'Offline Run Viewer replaying a completed team run with its task DAG and per-task assignee, model, provider, token, cost, tool-call, and status details.',
    },
    sectionEnvironment: {
      eyebrow: 'Your environment',
      title: 'Runs in your environment.',
      sub: 'Local, offline, or air-gapped, on your own credentials, with tools locked down by default and three runtime dependencies. No hosted service, no cloud required.',
    },
    environment: [
      {
        tag: 'your infrastructure',
        t: 'Runs where your data lives',
        ref: '/reference/providers/',
        refLabel: 'local & self-hosted models',
        parts: [
          'Run OMA local, offline, or air-gapped, on your own servers and your own credentials. Point it at a local endpoint with ', { c: 'baseURL' },
          ' and a whole run stays offline: no hosted OMA service to adopt, no cloud required.',
        ],
      },
      {
        tag: 'least privilege',
        t: 'Locked down by default',
        ref: '/reference/tool-configuration/',
        refLabel: 'tools & sandbox',
        parts: [
          'Built-in tools are default-deny: an agent gets only what you grant, and filesystem tools stay inside the configured ', { c: 'cwd' },
          '. Secrets are redacted from traces, shell output, and Viewer payloads on a best-effort path.',
        ],
      },
      {
        tag: 'lightweight',
        t: 'Light enough for locked-down infra',
        ref: '/guides/production-checklist/',
        refLabel: 'production checklist',
        parts: [
          'Core installs three runtime dependencies: ', { c: '@anthropic-ai/sdk' }, ', ', { c: 'openai' }, ', and ', { c: 'zod' },
          '. No daemon, no sidecar; every other SDK is a lazy-loaded, opt-in peer.',
        ],
      },
    ],
    sectionEvidence: {
      eyebrow: 'Scenarios · stack · adoption',
      title: 'Where OMA fits, and what runs on it.',
      sub: 'Start with a workflow, verify it fits your backend, then inspect live adoption and open-source projects without leaving the page.',
      fullShowcase: 'browse the full showcase',
    },
    sectionBuild: {
      eyebrow: 'Use cases',
      title: 'Three workflows, three explicit orchestration choices.',
      sub: 'Start from the outcome you need, then open a runnable recipe with the orchestration choice made explicit.',
      seeCode: 'see code',
      viewAll: 'browse all examples',
    },
    builds: {
      'adaptive-customer-support': { primitive: 'goal-driven · runTeam()', scenario: 'support · escalation', title: 'Adaptive customer support', desc: 'A coordinator selects the specialists needed for a shipping or billing escalation, then synthesizes their evidence.', outcome: 'A grounded response shaped around the actual support goal.' },
      'contract-review-dag': { primitive: 'explicit DAG · runTasks()', scenario: 'legal ops · review', title: 'Contract review', desc: 'Extract clauses once, run compliance and summary work in parallel, then wait for both before producing the notification.', outcome: 'A complete Markdown review with step-level retry.' },
      'incident-postmortem-dag': { primitive: 'explicit DAG · runTasks()', scenario: 'sre · operations', title: 'Incident postmortem', desc: 'Three fixture-backed investigations start in parallel, then feed a root-cause hypothesis and final postmortem.', outcome: 'A traceable Markdown artifact with timing and token-cost evidence.' },
    },
    sectionStack: {
      eyebrow: 'Integrations',
      title: 'Works with your stack.',
    },
    stack: [
      { name: 'Providers', note: 'Anthropic, Gemini, OpenAI, Bedrock, Azure, DeepSeek, or any OpenAI-compatible endpoint', count: 'built-in + compatible' },
      { name: 'MCP', note: 'Connect Model Context Protocol servers as tools', count: 'native' },
      { name: 'Vercel AI SDK', note: 'Bridge to 60+ AI SDK providers and hosts', count: 'compatible' },
      { name: 'Express', note: 'Mount a fixed runTasks() pipeline behind a route handler', count: 'drop-in' },
      { name: 'Any Node.js', note: 'No daemon, no sidecar, three runtime deps', count: 'Node 18+' },
    ],
    sectionProof: {
      eyebrow: 'Adoption',
      title: 'Open source, live from the repo.',
      sub: 'Repository signals and real projects, kept compact enough to verify without turning the homepage into a catalog.',
      liveTag: 'live · synced from registry',
      watchMention: 'watch the mention',
      stats: { stars: 'stars', forks: 'forks', contributors: 'contributors', latestRelease: 'latest release', license: 'license' },
    },
    sectionFaq: {
      eyebrow: 'FAQ',
      title: 'How the runtime behaves.',
      sub: 'Straight answers to the questions that come up most. The full reference lives in the docs.',
      viewAll: 'view all questions',
    },
    faqs: [
      { q: 'How does the coordinator turn a goal into a DAG?', a: 'A coordinator agent plans the work: it breaks the goal into discrete tasks, infers dependencies between them, and emits a directed acyclic graph. Independent nodes run concurrently; dependent nodes wait on their inputs. Pass planOnly to inspect the DAG before any agent executes.' },
      { q: 'Can agents in one team use different model providers?', a: 'Yes. Each agent declares its own model, so a single team can mix a frontier cloud model, a self-hosted endpoint, and a local Ollama instance. The coordinator routes each task to the agent, and therefore the model, assigned to it.' },
      { q: 'How do tools get exposed to an agent?', a: 'Default-deny. An agent only has the tools it explicitly lists in its tools array; everything else is unavailable. External systems are connected through MCP servers under the same opt-in contract.' },
      { q: 'What happens when a node fails?', a: 'A failed node is retried under its task policy when the error may be transient. Budget exhaustion, malformed input, deliberate aborts, and non-retryable client errors skip pointless retries. Persistent failures surface on the node with FAILED state and an error, downstream dependents are held, and independent branches can continue.' },
      { q: 'How do I keep a multi-agent run from going off the rails?', a: 'Layered controls, all opt-in. onPlanReady gates the plan, onTaskDispatch gates one ready task (or onApproval retains legacy round gates), and onToolCall can require confirmation for one consequential action. Declared governance verifies required roles and order after execution; runConsensus and loop detection add result and behavior checks.' },
      { q: 'How do I cap what a run costs?', a: 'Use maxCostBudget with estimateCost. Your estimator owns the per-model USD price table; OMA accumulates that estimate across the run and stops issuing further calls once the cap is crossed. The check happens at turn and task boundaries, so it can overshoot by one model turn rather than stopping mid-call. maxTokenBudget provides the parallel cumulative-token ceiling, and modelRouting can put cheaper models on leaf tasks.' },
      { q: 'Does it stream, or only return at the end?', a: 'Both. You can stream tokens and node-state transitions as the DAG fills, or simply await runTeam() for a typed, schema-validated result object once the graph resolves.' },
      { q: "How does open-multi-agent relate to Claude Code's dynamic workflows?", a: "They make the same bet: the model plans the work at runtime instead of you wiring a fixed graph. Claude's dynamic workflows run inside Claude Code, where Claude writes its own orchestration scripts and fans out parallel subagents in a session. open-multi-agent embeds that same goal-to-DAG idea in your own Node.js backend as an MIT library, on any provider, with the plan kept as inspectable, replayable data. The two also compose: over ACP an open-multi-agent team can run Claude Code itself as one of its agents." },
    ],
    endorse: {
      eyebrow: 'mentioned',
      // Real attributed citation — kept verbatim in every locale (translating a quote
      // would misrepresent it).
      quote: 'A brilliant TypeScript-native multi-agent orchestration framework.',
      cite: 'GithubAwesome · 58K subscribers · GitHub Trending Monthly #6',
      imgAlt: "Watch on YouTube: GithubAwesome's GitHub Trending Monthly #6, paused on the open-multi-agent GitHub repository (6k stars).",
    },
    ctaFinal: {
      eyebrow: 'get started',
      title1: 'Your first team. One command.',
      title2: 'Run locally. No signup.',
      quickStart: 'Quick Start',
      aiSdk: 'Already on Vercel AI SDK? OMA drives 60+ AI SDK providers',
    },
  },

  examples: {
    seo: {
      title: 'Examples — Open Multi-Agent',
      description: 'Browse all Open Multi-Agent examples by goal: start here, use-case recipes, orchestration, production controls, stack integrations, and a compact models/providers directory.',
    },
    hero: {
      eyebrow: 'examples',
      title: 'What you can build with OMA.',
      lede: 'Runnable recipes straight from the repo — each framed by the problem it solves. Browse by what you want to build, then open the source.',
    },
    openExample: 'open example',
    moreInGoal: 'More in this goal',
    advancedComposition: 'Advanced composition',
    goalNav: { label: 'Browse by goal', examples: 'examples' },
    formats: { script: 'Script', 'multi-file': 'Multi-file', app: 'App' },
    levels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    goals: {
      'start-here': {
        eyebrow: 'Start Here',
        title: 'Learn the three ways to run.',
        sub: 'Master one agent, coordinator-planned teams, and explicit task DAGs, then compose a mixed-model pool.',
      },
      'use-case-recipes': {
        eyebrow: 'Use-case Recipes',
        title: 'Start from the problem you need to solve.',
        sub: 'Complete workflows for support, operations, research, meetings, safety, and other concrete outcomes.',
      },
      orchestration: {
        eyebrow: 'Orchestration',
        title: 'Choose how the work should flow.',
        sub: 'Reusable coordination patterns for parallel work, handoffs, consensus, dependencies, and cross-model reasoning.',
      },
      'production-controls': {
        eyebrow: 'Production Controls',
        title: 'Put boundaries around the run.',
        sub: 'Add schemas, retries, evaluation, budgets, tool gates, plan replay, and observability before a workflow reaches production.',
      },
      'connect-your-stack': {
        eyebrow: 'Connect Your Stack',
        title: 'Embed OMA in the systems you already use.',
        sub: 'Connect servers, MCP tools, memory, AI SDK applications, external coding agents, and tracing infrastructure.',
      },
    },
    modelsProviders: {
      eyebrow: 'Models / Providers',
      title: 'Run the same team across your model stack.',
      sub: 'A compact directory of provider adapters, OpenAI-compatible endpoints, and local-model setups from the catalog.',
      local: 'local',
      compatible: 'compatible',
    },
    unavailable: {
      title: 'The synchronized catalog is unavailable.',
      desc: 'The committed snapshot failed validation, so this page will not silently show a partial or hand-maintained list.',
    },
    footPre: 'Generated from the validated catalog at the pinned ',
    footCode: 'Framework commit',
    footPost: '; all catalog entries are included exactly once. ',
    browseAll: 'Browse all on GitHub',
    // Per-recipe detail page (/examples/<slug>/). Chrome only — the recipe title,
    // description, source, and run commands are English on every locale (parsed
    // from the upstream file, like the index blurbs).
    detail: {
      backToIndex: '← All examples',
      goals: {
        'start-here': 'Start Here',
        'use-case-recipes': 'Use-case Recipe',
        orchestration: 'Orchestration',
        'production-controls': 'Production Control',
        'connect-your-stack': 'Connect Your Stack',
      },
      exampleLabel: 'Example',
      apisUsed: 'OMA APIs',
      linesLabel: 'lines',
      runTitle: 'Run it',
      runNote: 'From a clone of the repo — this exact file:',
      prereqsTitle: 'Prerequisites',
      providerNote: 'OMA is provider-agnostic — this example is written for the key above, but you can run it on OpenAI, Gemini, Groq and others.',
      providerLink: 'All providers',
      sourceTitle: 'Full source',
      sourceNote: 'The complete example, synchronized from the pinned Framework commit.',
      viewOnGithub: 'View & edit on GitHub',
      relatedTitle: 'Related examples',
      relatedNote: 'More examples for the same goal.',
      learnTitle: 'Learn the concepts',
      learnQuickStart: 'Quick Start',
      learnDocs: 'Documentation',
      browseAll: 'All examples',
      seoTitleSuffix: ' — Open Multi-Agent example',
      // Per-recipe zh overrides for the human-readable title + description, keyed
      // by slug. EN is the source (parsed from the upstream file by
      // refresh-gh-data.mjs), so it stays empty and each page falls back to
      // detail.title / detail.intent; zh.ts populates this. Code, API names, run
      // commands, and source stay English on every locale. Unlisted slugs (e.g. a
      // newly-added upstream example) fall back to English until translated.
      recipes: {} as Record<string, { title: string; intent: string }>,
    },
    // Per-entry zh overrides for the /examples INDEX cards/rows (short title +
    // blurb — distinct from detail.recipes' long title + intent). en stays empty
    // so each entry falls back to the English parsed from the repo; providers are
    // slugs and are never listed here.
    entries: {} as Record<string, { title?: string; blurb: string }>,
  },

  showcase: {
    seo: {
      title: 'Showcase — Open Multi-Agent',
      description: 'Open-source projects built with Open Multi-Agent and tools that integrate with it — from a production WordPress security platform to PR review, agent memory, and observability.',
    },
    hero: {
      eyebrow: 'Showcase',
      title: 'Built on Open Multi-Agent.',
      subPre: 'Open-source projects and integrations built with the framework — drawn from the ecosystem and publicly verifiable. Building something with OMA? ',
      discuss: 'Open a discussion',
      subPost: ' to get listed.',
    },
    builtWith: { eyebrow: 'Built with OMA', title: 'OMA at the core.', sub: 'Applications that run their agent teams on Open Multi-Agent.' },
    integrates: { eyebrow: 'Integrates with OMA', title: 'Extend a running team.', sub: 'Drop-in tools that add new capabilities to Open Multi-Agent.' },
    // Practitioner spotlight (the `practitioner` entry in src/lib/showcase.ts) —
    // rendered on both the landing proof section and /showcase. The person's
    // name/handle/body/badge/status come from the entry (+ zh `entries` override);
    // only the framing below is section-level copy.
    spotlight: { eyebrow: 'Spotlight', heading: 'Fully offline, in production.', cta: 'View profile' },
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
      sub: 'Five layers, top to bottom: the orchestrator; topology, governance, and planning; concurrency plus event scheduling; the agent; and the model loop and tool interfaces. The diagram names the released runtime boundaries rather than a hosted product control plane.',
      imgAlt: 'OMA v1.13 architecture. OpenMultiAgent routes a run through team coordination and governance, schedules ready tasks from the dependency graph, executes agents through model and tool gates, and produces task results and evidence.',
    },
    structureLegend: [
      { k: 'accent border', d: 'User entry point — the class you instantiate. Exactly one per diagram.' },
      { k: 'solid', d: 'Concrete type — a class with one implementation: Team, AgentPool, TaskQueue, Agent, AgentRunner.' },
      { k: 'dashed', d: 'Interface with multiple implementations — LLMAdapter providers, ToolRegistry tools.' },
      { k: 'arrow', d: 'Owns / contains — the source instantiates or owns the target. Read top-down.' },
    ],
    control: {
      eyebrow: 'control and evidence',
      title: 'The run is a chain of explicit boundaries.',
      sub: 'v1.13 separates topology, dispatch, policy, and proof, so an application can control each one without taking ownership of the whole runtime.',
      items: [
        { tag: 'route', title: 'Choose single or team', body: 'Use an explicit mode, declared governance, or a custom ExecutionRouter.', href: '/reference/execution-routing/' },
        { tag: 'schedule', title: 'Dispatch ready work', body: 'The event-driven scheduler releases one eligible task at a time as dependencies complete.', href: '/reference/task-scheduling/' },
        { tag: 'govern', title: 'Gate plans and actions', body: 'Approve a plan, each task dispatch, or one consequential tool invocation.', href: '/guides/orchestration-controls/' },
        { tag: 'evidence', title: 'Inspect what ran', body: 'Task results, routing decisions, traces, receipts, and governance conclusions close the loop.', href: '/reference/observability/' },
      ],
    },
    execution: {
      eyebrow: 'execution',
      titleHtml: 'One <code>runTeam()</code> call.',
      sub: 'Goal in, result plus receipt out. The runtime chooses the topology, creates or accepts a task DAG, dispatches ready work as dependencies complete, and preserves task-level evidence. Read it left to right — the horizontal axis is time.',
      imgAlt: 'The v1.13 runTeam flow. A goal is routed to a single or team topology, planned into a task DAG, dispatched by dependency readiness, and returned with task results, routing evidence, roles, dependency edges, and usage.',
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

  capabilitiesPage: {
    seo: {
      title: 'Capabilities — Open Multi-Agent',
      description: 'The released Open Multi-Agent runtime surface: execution routing, event-driven task scheduling, governance, approvals, recovery, evidence, evaluation, models, tools, MCP, and external agents.',
    },
    hero: {
      eyebrow: 'capabilities · v1.13.0',
      title: 'From a goal to a governed run.',
      lede: 'One TypeScript runtime for goal-driven teams and explicit task DAGs. Route the topology, schedule ready work, gate consequential actions, and keep the evidence in your own environment.',
      release: 'released · @open-multi-agent/core@1.13.0',
      quickStart: 'Run the no-key demo',
      releaseNotes: 'v1.13 release notes',
    },
    flow: [
      { n: '01', tag: 'input', title: 'Goal or DAG', body: 'Start with an outcome through runTeam(), or supply the task graph through runTasks().' },
      { n: '02', tag: 'route', title: 'Single or team', body: 'An explicit mode, governance policy, or ExecutionRouter selects the topology.' },
      { n: '03', tag: 'schedule', title: 'Ready work moves', body: 'The event-driven scheduler starts dependents as soon as their prerequisites complete.' },
      { n: '04', tag: 'govern', title: 'Policy gates dispatch', body: 'Approve the plan, each ready task, and every consequential tool call at the right boundary.' },
      { n: '05', tag: 'evidence', title: 'A receipt closes the run', body: 'Routing, task results, traces, usage, and governance conclusions stay inspectable.' },
    ],
    section: {
      eyebrow: 'runtime surface',
      title: 'Six capability layers. One execution contract.',
      lede: 'The layers below are shipped in the public package. Each one links to the version-matched Reference or guide.',
    },
    groups: [
      {
        tag: 'plan · route',
        title: 'Choose the execution topology.',
        body: 'Generate a reviewable task DAG from a goal, execute a graph you define, or short-circuit eligible work to one agent. Explicit mode and governance declarations win; custom routers remain advisory and fall back safely.',
        proof: 'runTeam · runTasks · mode · ExecutionRouter · routingDecision',
        link: 'Execution routing',
      },
      {
        tag: 'schedule · dispatch',
        title: 'Move work when dependencies are ready.',
        body: 'Event-driven execution removes unrelated round barriers. Choose dependency-first, round-robin, least-busy, capability-match, or composite assignment, with hard task requirements and task-scoped results.',
        proof: 'onTaskDispatch · requires · taskResults · dependencyPayload',
        link: 'Task scheduling',
      },
      {
        tag: 'control · govern',
        title: 'Put policy at the right boundary.',
        body: 'Declare required or preferred roles, ordered review paths, and budget-aware degradation. Gate plans, ready tasks, and consequential tools separately, then inspect governanceConclusion instead of inferring compliance.',
        proof: 'governance · onPlanReady · onTaskDispatch · onToolCall',
        link: 'Orchestration controls',
      },
      {
        tag: 'bound · recover',
        title: 'Stop new work, settle safely, resume by task.',
        body: 'Retries, model fallbacks, timeouts, loop detection, and token or estimated-cost budgets bound execution. Checkpoints persist completed task boundaries so restore can skip work already done.',
        proof: 'fallbacks · budgets · checkpoint · restore',
        link: 'Checkpoint and resume',
      },
      {
        tag: 'inspect · evaluate',
        title: 'Turn a run into reviewable evidence.',
        body: 'Stable run identity, execution receipts, TraceStore, the offline Run Viewer, and optional OpenTelemetry make the run inspectable. EvalSets, Scorers, reports, and gates turn that evidence into regression checks.',
        proof: 'receipt · TraceStore · renderRunViewer · EvalSet · GateVerdict',
        link: 'Observability and evaluation',
      },
      {
        tag: 'models · tools',
        title: 'Bring the environment you already use.',
        body: 'Mix cloud and local models in one team, connect MCP servers as opt-in tools, and run external coding agents through ACP or process backends. Core remains an embeddable library, not a hosted service.',
        proof: 'providers · MCP · ACP · process backend · default-deny',
        link: 'Integrations',
      },
    ],
    boundary: {
      eyebrow: 'truth boundary',
      title: 'What this runtime does—and what it does not claim.',
      body: 'The public site follows the latest package released on both GitHub and npm. Development-only main features stay out of the shipped surface until they are published.',
      items: [
        { label: 'Published', value: 'v1.13.0: routing, governance, event-driven scheduling, dispatch approval, receipts, structured handoffs, and model fallbacks.' },
        { label: 'Recovery', value: 'Checkpoint restore resumes at completed task boundaries. It is not mid-task recovery or an authoritative exactly-once RunStore.' },
        { label: 'Product layer', value: 'OMA is a self-hosted runtime library. It does not claim a hosted tenant, project, thread, seat, or RBAC control plane.' },
      ],
    },
    cta: {
      eyebrow: 'start with evidence',
      title: 'Run the local demo, then inspect the runtime.',
      quickStart: 'Run the no-key demo',
      architecture: 'See the v1.13 architecture',
    },
  },

  blog: {
    seo: {
      title: 'Blog — Open Multi-Agent',
      description:
        'Writing on TypeScript AI Agent orchestration: goal-driven task DAGs, mixed-model teams, durable shared state, and lessons from the agent-framework ecosystem.',
    },
    eyebrow: 'Blog',
    title: 'Notes on AI Agent orchestration.',
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
      description: 'Sourced comparisons of open-multi-agent against the main AI Agent frameworks, including orchestration, deterministic controls, recovery, budgets, observability, and fit.',
    },
    hero: {
      eyebrow: 'compare',
      title: 'How open-multi-agent compares.',
      lede: 'Compare the actual runtime surface, not a one-line category label. Each page covers how the systems orchestrate work, what controls OMA provides, and where each option fits.',
    },
    baseline: {
      eyebrow: 'start with the baseline',
      title: 'Know what OMA ships before comparing it.',
      body: 'v1.13 routes execution topology, dispatches ready tasks event by event, gates consequential work, and produces inspectable evidence in your own backend.',
      cta: 'See all capabilities',
    },
    hub: {
      pickThem: 'Pick {name} if',
      pickUs: 'Pick open-multi-agent if',
      view: 'Full comparison',
      moreTitle: 'More comparisons',
      moreLede: 'The same full comparison for frameworks and adjacent tools, including single-agent toolkits, RAG stacks, and cloud-vendor SDKs.',
    },
    page: {
      eyebrow: 'comparison',
      vsTitle: 'open-multi-agent vs {name}',
      seoTitle: 'open-multi-agent vs {name}: a sourced comparison',
      matrix: { eyebrow: 'at a glance', title: 'Side by side.', dimension: 'Dimension', oma: 'open-multi-agent' },
      capabilities: {
        eyebrow: 'actual capabilities',
        title: 'What open-multi-agent includes.',
        lede: 'OMA is more than goal decomposition and a small dependency count. These are current framework capabilities documented in the project README.',
      },
      howDiffer: { eyebrow: 'mechanism', title: 'How they differ.' },
      whenThemTitle: 'Where {name} fits',
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
      cta: 'See the ACP integration and permission boundary',
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
      title: 'Use cases — AI Agent orchestration in TypeScript',
      description: 'What you can build with open-multi-agent: parallel LLM calls, goal-driven task DAGs, mixed-model teams, local agents, durable shared state, and orchestration on top of the Vercel AI SDK.',
    },
    hero: {
      eyebrow: 'use cases',
      title: 'What you can build.',
      lede: 'Common shapes of AI Agent work in TypeScript — each with the mechanism, when it fits, and a full walkthrough with runnable code.',
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

  // Integration pages. Chrome only — the per-integration copy + code lives
  // in src/lib/integrations.ts.
  integrations: {
    seo: {
      title: 'Integrations — models, OpenTelemetry, and runtime adapters',
      description: 'Connect open-multi-agent to OpenTelemetry, Anthropic, OpenAI, Gemini, DeepSeek, AWS Bedrock, Azure OpenAI, Ollama, and any OpenAI-compatible endpoint.',
    },
    hero: {
      eyebrow: 'integrations',
      title: 'Connect the runtime.',
      lede: 'Extend the orchestration core with observability and external execution, then choose where your agents make model calls.',
    },
    hub: {
      runtimeEyebrow: 'runtime capabilities',
      runtimeTitle: 'Extend the runtime.',
      runtimeLede: 'Connect cross-cutting capabilities without changing the goal-to-DAG orchestration at the center.',
      runtimeCount: 'integrations',
      providersEyebrow: 'model access',
      providersTitle: 'Choose a model provider.',
      providersLede: 'Use one provider across the team or mix models per agent while keeping the same orchestration contract.',
      providersCount: 'providers',
    },
    page: {
      eyebrow: 'integration',
      backToHub: 'All integrations',
      setupEyebrow: 'setup',
      setupTitle: 'A minimal setup.',
      howEyebrow: 'how it fits',
      howTitle: 'How it fits.',
      mixCta: 'Mix providers in one team',
      allProviders: 'All providers & env vars',
      seeAlso: 'Other integrations',
    },
  },
};

export type UiDict = typeof en;
