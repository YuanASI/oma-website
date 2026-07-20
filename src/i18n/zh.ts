// 简体中文 UI 文案（自定义页）。形状必须与 ./en.ts 完全一致（UiDict = typeof en），
// 缺键即类型错误（pnpm check CI 闸用 tsc 抓——astro build 走 esbuild 不做类型检查，
// 单跑 build 抓不到、会把缺键静默渲染成 undefined）。术语与已上线的中文文档站一致
// （协调器 / 任务 DAG / 目标优先 / 编排 / 智能体 / 模型提供方 …）。
// 保留不译：代码标识符、API 名、URL、包名；第三方背书引用按原文保留。
import type { UiDict } from './en';

export const zh: UiDict = {
  nav: {
    brandAria: 'Open Multi-Agent 首页',
    capabilities: '能力',
    docs: '文档',
    useCases: '应用场景',
    whyOma: '为什么选择 OMA',
    architecture: '架构',
    examples: '示例',
    showcase: '案例',
    blog: '博客',
    compare: '对比',
    solutions: '用例',
    integrations: '集成',
    forCompanies: '企业服务',
    capabilityCols: { build: '构建', operate: '可靠运行' },
    capabilityMenu: {
      orchestration: { title: '多智能体编排', desc: '从目标自动规划任务 DAG，也支持显式任务图' },
      models: { title: '模型与提供方', desc: '13 个内置、本地及 OpenAI 兼容选项' },
      tools: { title: '工具与 MCP', desc: '默认拒绝的工具权限与外部系统接入' },
      externalAgents: { title: '外部智能体', desc: '通过 ACP 接入 Claude Code 等 CLI' },
      evaluation: { title: '评估', desc: 'EvalSet、Scorer、报告与 CI 质量闸门' },
      observability: { title: '可观测性', desc: 'TraceStore、Run Viewer 与 OpenTelemetry' },
      reliability: { title: '可靠性与控制', desc: '预算、审批、重试、超时与检查点' },
      allIntegrations: '全部集成',
    },
    whyOmaDesc: {
      compare: '与主流多智能体框架逐项对比',
      showcase: '真实项目、团队与采用案例',
    },
    useCasesCols: { solutions: '解决方案', examples: '示例' },
    viewAllSolutions: '全部解决方案',
    stars: 'Star',
    toggleThemeAria: '切换浅色/深色主题',
    toggleThemeTitle: '切换主题',
    menuAria: '菜单',
  },

  langSwitcher: {
    toAria: '切换到 {lang}',
  },

  footer: {
    blurb: '自动分工的智能体团队，<br />跑在你掌控的环境里。',
    product: { head: '产品', capabilities: '能力', useCases: '应用场景', integrations: '集成', faq: '常见问题' },
    resources: { head: '资源', docs: '文档', architecture: '架构', examples: '示例', showcase: '案例', compare: '对比', blog: '博客' },
    project: { head: '项目', github: 'GitHub', npm: 'npm', mitLicense: 'MIT 许可证', llmsTxt: 'llms.txt', rss: 'RSS' },
    resourcesEnterprise: '企业服务',
    mitLicensed: 'MIT 许可 · @open-multi-agent',
    builtBy: '出自',
  },

  enterpriseCta: {
    eyebrow: '企业服务',
    title: '要把它用到生产环境？',
    body: 'open-multi-agent 采用 MIT 许可、可自行免费运行。当你需要在期限内交付、集成，或获得支持时，元定义科技（YuanASI）提供商业交付与支持。',
    button: '企业服务',
  },

  enterpriseDialog: {
    eyebrow: '直接联系',
    title: '把 Open Multi-Agent 用进真实业务',
    body: '联系框架作者本人，帮你梳理 AI 落地目标、让 AI 真正与业务结合',
    servicesLabel: '可提供的工程服务',
    services: [
      { code: 'S-01', title: 'AI Agent 定制开发', body: '业务梳理、Agent 设计、Prompt 评估、生产部署、私有化与持续支持。' },
      { code: 'S-02', title: '多智能体系统集成', body: '多 Agent 架构编排、RAG、CRM / ERP / API 对接、性能与稳定性调优。' },
      { code: 'S-03', title: '企业 AI 咨询', body: 'AI 场景评估、技术选型、POC、ROI 估算与落地路线规划。' },
    ],
    contactEyebrow: '本人微信',
    contactNote: '添加时建议备注：公司名称 + 需求',
    qrAlt: 'open-multi-agent 作者 JackChen 的个人微信二维码',
    wechatId: 'JackChen_co',
    copy: '复制微信号',
    copied: '已复制',
    copyFailed: '复制失败',
    closeAria: '关闭企业服务联系弹窗',
  },

  taskStatus: {
    done: '完成',
    running: '运行中',
    queued: '排队',
    failed: '失败',
    skipped: '跳过',
    statusPrefix: '状态：',
    badge: { stable: '稳定', live: '运行', error: '报错' },
  },

  landing: {
    seo: {
      title: 'Open Multi-Agent：TypeScript 多智能体框架',
      description: 'TypeScript 原生的多智能体框架：给一个目标，自动分工的智能体团队并行完成，跑在你自己的环境里，云端或完全离线均可。',
    },
    hero: {
      eyebrow: '为 TypeScript 团队打造 · 多智能体框架',
      h1: '自动分工的智能体团队，',
      h1Accent: '跑在你自己的环境里。',
      sub: '给一个目标，它自动拆任务、并行执行、汇总出一个结果。<br />云端或本地模型同队，可以完全不上云。',
      meta: ['3 个运行时依赖', '任意模型同队混用', 'MIT 许可'],
      quickStart: '快速开始',
      demoNote: '首次 Demo：无需 API Key，也不会请求模型。',
      ioInput: '输入 · team.ts',
      ioGoal: '目标',
      capturedGoal: '真实运行目标',
      expandGoal: '查看完整目标',
      collapseGoal: '收起',
      decomposesInto: '拆解为',
      parallel: '并行',
      expandTasks: '其余 {count} 个任务 · 展开完整 DAG',
      runReal: '真实',
      runTasks: '个任务',
    },
    copy: '复制',
    copied: '✓ 已复制',
    copyFailed: '复制失败，请手动选择并复制。',
    sectionWhy: {
      eyebrow: '为什么选 OMA',
      title: '从目标直达一次可控运行。',
      sub: '从结果出发，执行过程由你掌控，并跑在数据所在的环境里。',
    },
    why: [
      {
        tag: '目标 → DAG',
        title: '给它目标，不用先画图。',
        desc: '协调器把结果拆成带依赖的任务，并行运行独立工作，再综合成一个结果。任何执行开始前，你都可以先审视计划。',
        proof: 'runTeam() · planOnly · 可检视 DAG',
        ref: '/architecture/',
        refLabel: '查看运行时流程',
      },
      {
        tag: '控制 → 证据',
        title: '给每次运行加上护栏。',
        desc: '审批计划与工具调用，给 token 或预估成本封顶，用评估闸门把关，需要复查时再带着证据回放或恢复。',
        proof: 'onPlanReady · maxCostBudget · EvalSet',
        ref: '/guides/orchestration-controls/',
        refLabel: '查看编排控制',
      },
      {
        tag: '你的环境',
        title: '跑在数据所在的地方。',
        desc: '用你自己的凭证，连接云端提供方、本地端点或气隔环境。工具默认拒绝，core 只有三个运行时依赖。',
        proof: '离线 · 工具默认拒绝 · 3 个运行时依赖',
        ref: '/guides/production-checklist/',
        refLabel: '打开生产清单',
      },
    ],
    whyViewer: {
      eyebrow: '运行证据',
      title: '每次运行后，都能查清发生了什么。',
      body: '离线 Run Viewer 把一次已完成的运行变成可复查的证据，无需上传到托管的 OMA 服务。',
      points: ['任务 DAG 与承担者', '模型、提供方、token 与成本汇总', '工具调用、状态与安全证据详情'],
      link: '打开可观测性参考',
    },
    sectionCapabilities: {
      eyebrow: '工作原理',
      title: '一个智能体运行时，不是图构建器。',
      sub: '目标优先，而非图优先。你描述想要的结果；拆解、并行与综合都交给 OMA。',
    },
    caps: [
      { n: '01', t: '目标驱动的协调器', d: '你传入的是目标，不是图。协调器把它拆解成任务 DAG，并行运行相互独立的节点，并综合出最终结果。' },
      { n: '02', t: '在一个团队里混用任意模型', d: '每个智能体各自指定模型，在同一个团队里协作。内置提供方涵盖 Anthropic、OpenAI、Gemini、Bedrock、Azure OpenAI 和 DeepSeek（共 13 个），还支持任何兼容 OpenAI 的端点。' },
      { n: '03', t: '工具与 MCP，默认拒绝', d: '智能体只拥有被授予的工具。Model Context Protocol 服务器在同样的按需授权约定下，把外部系统暴露给智能体。' },
      { n: '04', t: '流式与结构化输出', d: '在 DAG 逐步填充时流式输出 token 和节点状态变化，或在运行结束时取回一个带类型、经 schema 校验的对象。' },
      { n: '05', t: '跨提供方推理', d: '一份 thinking 配置，映射到 Anthropic 的 thinking、Gemini 的 thinkingConfig 和 OpenAI 的 reasoning_effort。推理以事件形式流式输出，开启后还能在切换提供方时保留。' },
      { n: '06', t: '把编码 CLI 当作智能体运行', d: '通过 Agent Client Protocol（ACP），外部编码智能体（包括 Claude Code）作为 OMA 智能体加入团队，而调度、共享记忆与预算仍由协调器掌管。' },
    ],
    oneCall: { title: '一次调用', body: '整个 DAG 解析完成时 runTeam() 才返回。无需手工接线节点，也没有调度器要维护。' },
    capsLinks: { threeWays: 'runAgent · runTeam · runTasks：三种运行方式', archFlow: '查看架构与 runTeam() 流程' },
    sectionReliability: {
      eyebrow: '掌控',
      title: '控制权在你手里。',
      sub: '在非确定性的智能体外面，加上确定性控制与可度量的质量。',
    },
    reliability: [
      {
        tag: '留在回路内',
        t: '你始终在掌控之中',
        ref: '/guides/orchestration-controls/',
        refLabel: '编排控制',
        parts: [
          '用 ', { c: 'onPlanReady' },
          ' 预览计划、', { c: 'onApproval' },
          ' 逐轮审批、', { c: 'onToolCall' },
          ' 为每次工具调用把关。', { c: 'runConsensus' },
          ' 加一道第二智能体校验；循环检测叫停原地打转的智能体。',
        ],
      },
      {
        tag: '花费封顶',
        t: '把钱花在刀刃上',
        ref: '/reference/model-routing/',
        refLabel: '模型路由',
        parts: [
          '用 ', { c: 'modelRouting' },
          ' 把规划交给旗舰模型、叶子任务交给便宜模型。用 ', { c: 'maxTokenBudget' },
          ' 和 ', { c: 'maxCostBudget' },
          ' + ', { c: 'estimateCost' },
          ' 给花费封一个 token 或美元上限。',
        ],
      },
      {
        tag: '可观测',
        t: '检查、回放、恢复',
        ref: '/reference/observability/',
        refLabel: '可观测性',
        parts: [
          '用 ', { c: 'createPlanArtifact' },
          ' 冻结一份已审过的计划，再用 ', { c: 'runFromPlan' },
          ' 重放。运行后打开离线 Run Viewer（', { c: 'oma run --dashboard' },
          '）；检查点从最后一个已完成任务之后恢复。',
        ],
      },
    ],
    evaluation: {
      tag: '评估',
      title: '在部署前后，量出质量变化。',
      parts: [
        '为 ', { c: 'EvalSet' }, ' 数据集和 ', { c: 'Scorer' },
        ' 逻辑做版本管理，用 ', { c: 'runEvalSet()' },
        ' 跑回归，再用 ', { c: 'oma eval gate' }, ' 在 CI 中执行结果。',
      ],
      note: '线上采样需要显式开启，且不会改变业务结果。Scorer 失败会保留为 scorer_error，不会被算成零分。',
      steps: [
        { label: '版本', value: 'EvalSet + Scorer' },
        { label: '运行', value: '报告 + 聚合指标' },
        { label: '闸门', value: 'GateVerdict + CLI' },
      ],
      ref: '/reference/evaluation/',
      refLabel: '评估参考',
    },
    dashboard: {
      caption: '而当真的出岔子时，离线 Run Viewer 可以回放已完成的运行：任务 DAG，以及每个任务的承担者、模型与提供方、token 与成本汇总、工具调用次数和安全证据详情。',
      obsLink: '可观测性',
      imgAlt: '离线 Run Viewer 正在回放一次已完成的团队运行，展示任务 DAG，以及每个任务的承担者、模型、提供方、token、成本、工具调用与状态详情。',
    },
    sectionEnvironment: {
      eyebrow: '你的运行环境',
      title: '跑在你自己的环境里。',
      sub: '本地、离线，或气隙运行，用你自己的凭证，工具默认拒绝，只有三个运行时依赖。无需托管服务，无需云。',
    },
    environment: [
      {
        tag: '你的基础设施',
        t: '跑在数据所在的地方',
        ref: '/reference/providers/',
        refLabel: '本地与自托管模型',
        parts: [
          '本地、离线，或气隙运行 OMA，跑在你自己的服务器、用你自己的凭证。用 ', { c: 'baseURL' },
          ' 指向一个本地端点，整次运行就都在离线状态：没有要接入的托管 OMA 服务，也无需云。',
        ],
      },
      {
        tag: '最小权限',
        t: '默认锁死',
        ref: '/reference/tool-configuration/',
        refLabel: '工具与沙箱',
        parts: [
          '内置工具默认拒绝：智能体只拿到你授予的那些，文件系统工具限定在配置的 ', { c: 'cwd' },
          ' 内。密钥会从 trace、shell 输出和 Viewer 载荷中脱敏，尽力而为。',
        ],
      },
      {
        tag: '轻量',
        t: '轻到能塞进封闭内网',
        ref: '/guides/production-checklist/',
        refLabel: '生产清单',
        parts: [
          'core 只装三个运行时依赖：', { c: '@anthropic-ai/sdk' }, '、', { c: 'openai' }, ' 和 ', { c: 'zod' },
          '。没有守护进程，没有 sidecar；其余每个 SDK 都是惰性加载、按需可选的 peer。',
        ],
      },
    ],
    sectionEvidence: {
      eyebrow: '场景 · 技术栈 · 采用证据',
      title: '它适合哪些场景，又有谁在用。',
      sub: '从工作流出发，确认它能嵌入你的后端，再直接查看实时采用数据和开源生态项目。',
      fullShowcase: '浏览完整案例',
    },
    sectionBuild: {
      eyebrow: '应用场景',
      title: '三个工作流，三种明确的编排选择。',
      sub: '先从你要的结果出发，再打开一个已明确编排选择、可直接运行的示例。',
      seeCode: '查看代码',
      viewAll: '浏览全部示例',
    },
    builds: {
      'adaptive-customer-support': { primitive: '目标驱动 · runTeam()', scenario: '客服 · 升级处理', title: '自适应客服', desc: '协调器根据物流或账单升级问题选择所需的专职 Agent，再综合各自证据。', outcome: '围绕实际客服目标形成一份有依据的回复。' },
      'contract-review-dag': { primitive: '显式 DAG · runTasks()', scenario: '法务运营 · 审查', title: '合同审查', desc: '只提取一次条款，并行完成合规检查与摘要，等待两者完成后再生成通知。', outcome: '一份支持步骤级重试的完整 Markdown 审查。' },
      'incident-postmortem-dag': { primitive: '显式 DAG · runTasks()', scenario: 'SRE · 运维', title: '事故复盘', desc: '三项基于 fixtures 的调查并行开始，再汇入根因假设与最终事故复盘。', outcome: '一份保留证据链、运行时长与 token 成本的 Markdown 产物。' },
    },
    sectionStack: {
      eyebrow: '集成',
      title: '与你的技术栈协同。',
    },
    stack: [
      { name: '提供方', note: 'Anthropic、Gemini、OpenAI、Bedrock、Azure、DeepSeek，以及任何兼容 OpenAI 的端点', count: '13 个内置' },
      { name: 'MCP', note: '把 Model Context Protocol 服务器作为工具接入', count: '原生' },
      { name: 'Vercel AI SDK', note: '桥接 60+ 个 AI SDK 提供方与平台', count: '兼容' },
      { name: 'Express', note: '把固定的 runTasks() 流水线挂在路由处理器后面', count: '即插即用' },
      { name: '任意 Node.js', note: '没有守护进程，没有 sidecar，只有三个运行时依赖', count: 'Node 18+' },
    ],
    sectionProof: {
      eyebrow: '采用情况',
      title: '开源，数字实时来自仓库。',
      sub: '仓库信号与真实项目集中放在一屏，方便核验，但不把首页变成目录。',
      liveTag: '实时 · 同步自 registry',
      watchMention: '观看提及片段',
      stats: { stars: 'Star', forks: 'Fork', contributors: '贡献者', latestRelease: '最新版本', license: '许可证' },
    },
    sectionFaq: {
      eyebrow: '常见问题',
      title: '运行时如何表现。',
      sub: '最常被问到的问题，直接回答。完整参考在文档里。',
      viewAll: '查看全部问题',
    },
    faqs: [
      { q: '协调器如何把目标变成 DAG？', a: '协调器智能体会规划工作：把目标拆成一个个离散任务，推断它们之间的依赖，并产出一张有向无环图。相互独立的节点并发运行；有依赖的节点等待各自的输入。传入 planOnly 即可在任何智能体执行前审视这张 DAG。' },
      { q: '同一个团队里的智能体能用不同的模型提供方吗？', a: '可以。每个智能体声明自己的模型，所以一个团队可以混用前沿云端模型、自托管端点和本地 Ollama 实例。协调器把每个任务路由给指派的智能体，也就因此路由给对应的模型。' },
      { q: '工具是如何暴露给智能体的？', a: '默认拒绝。智能体只拥有它在 tools 数组里显式列出的工具，其余一律不可用。外部系统通过 MCP 服务器接入，遵循同样的按需授权约定。' },
      { q: '某个节点失败了会怎样？', a: '错误可能是暂时性问题时，失败节点会按任务策略重试。预算耗尽、输入格式错误、主动取消与不可重试的客户端错误会跳过无意义的重试。持续失败会以 FAILED 状态和错误显示在节点上，下游依赖被挂起，独立分支则可以继续。' },
      { q: '怎样防止一次多智能体运行失控？', a: '分层控制，全部可选开启。onPlanReady 把拆解出的计划交给你，在任何智能体运行前审视；onApproval 为每一轮把关；返回 false，剩余任务就被跳过。runConsensus 加一道提议者→评审检查，必须由第二个智能体认可；循环检测则会在某个智能体不断重复同一次工具调用或输出时将其叫停。' },
      { q: '怎样给一次运行的成本设上限？', a: '使用 maxCostBudget 与 estimateCost。每个模型的美元价格表由你的估算器维护；OMA 在整次运行中累计估算成本，越过上限后停止后续调用。检查发生在回合与任务边界，因此最多可能多出一个模型回合，而不是在调用中途精确熔断。maxTokenBudget 同时提供累计 token 上限，modelRouting 则能把叶子任务路由给更便宜的模型。' },
      { q: '它是流式的，还是只在最后返回？', a: '都支持。你可以在 DAG 逐步填充时流式输出 token 和节点状态变化，也可以直接 await runTeam()，在图解析完成后拿到一个带类型、经 schema 校验的结果对象。' },
      { q: 'open-multi-agent 和 Claude Code 的动态工作流是什么关系？', a: '两者押的是同一个赌注：让模型在运行时规划工作，而不是你去接一张固定的图。Claude 的动态工作流跑在 Claude Code 内部，Claude 自己写编排脚本，在一次会话里扇出并行的子智能体。open-multi-agent 把同样的目标到任务 DAG 的思路嵌进你自己的 Node.js 后端，作为一个 MIT 库运行在任意提供方上，并把计划保留为可检视、可重放的数据。两者也能组合：通过 ACP，一个 open-multi-agent 团队甚至可以把 Claude Code 本身当作它的一个智能体来运行。' },
    ],
    endorse: {
      eyebrow: '被提及',
      quote: 'A brilliant TypeScript-native multi-agent orchestration framework.',
      cite: 'GithubAwesome · 58K subscribers · GitHub Trending Monthly #6',
      imgAlt: '在 YouTube 观看 GithubAwesome 的 GitHub Trending Monthly #6，画面停在 open-multi-agent 的 GitHub 仓库（6k stars）。',
    },
    ctaFinal: {
      eyebrow: '开始上手',
      title1: '一条命令，跑起你的第一支团队。',
      title2: '就在你的机器上，无需注册，无需云。',
      quickStart: '快速开始',
      aiSdk: '在用 Vercel AI SDK？OMA 可直接驱动 60+ AI SDK 提供方',
    },
  },

  examples: {
    seo: {
      title: '示例 — Open Multi-Agent',
      description: '按目标浏览全部 Open Multi-Agent 示例：从这里开始、场景实例、编排、生产控制、技术栈集成，以及紧凑的模型 / 提供方目录。',
    },
    hero: {
      eyebrow: '示例',
      title: '用 OMA 能搭出什么。',
      lede: '直接来自仓库、可直接运行的实例——每一个都围绕它解决的问题来组织。按你想搭的东西浏览，然后打开源码。',
    },
    openExample: '打开示例',
    moreInGoal: '这个目标下的更多示例',
    advancedComposition: '进阶组合',
    goalNav: { label: '按目标浏览', examples: '个示例' },
    formats: { script: '脚本', 'multi-file': '多文件', app: '应用' },
    levels: { beginner: '入门', intermediate: '进阶', advanced: '高级' },
    goals: {
      'start-here': {
        eyebrow: '从这里开始',
        title: '先掌握三种运行方式。',
        sub: '掌握单个 Agent、协调器规划的团队和显式任务 DAG，再进阶组合混合模型池。',
      },
      'use-case-recipes': {
        eyebrow: '场景实例',
        title: '从你要解决的问题出发。',
        sub: '覆盖客服、运营、研究、会议、安全等具体结果的完整工作流。',
      },
      orchestration: {
        eyebrow: '编排',
        title: '选择工作应该如何流动。',
        sub: '可复用的协调模式：并行处理、任务交接、共识、依赖，以及跨模型推理。',
      },
      'production-controls': {
        eyebrow: '生产控制',
        title: '给一次运行加上边界。',
        sub: '在工作流进入生产前加入 schema、重试、评估、预算、工具闸门、计划重放与可观测性。',
      },
      'connect-your-stack': {
        eyebrow: '连接你的技术栈',
        title: '把 OMA 嵌进你已经在用的系统。',
        sub: '连接服务器、MCP 工具、记忆、AI SDK 应用、外部编码 Agent 与链路追踪设施。',
      },
    },
    modelsProviders: {
      eyebrow: '模型 / 提供方',
      title: '让同一支团队运行在你的模型栈上。',
      sub: '来自 catalog 的紧凑目录，覆盖 provider adapter、OpenAI 兼容端点与本地模型配置。',
      local: '本地',
      compatible: '兼容',
    },
    unavailable: {
      title: '同步 catalog 暂时不可用。',
      desc: '已提交的 snapshot 未通过校验，因此页面不会静默显示一份残缺或手工维护的列表。',
    },
    footPre: '由已校验的 catalog 在固定的 ',
    footCode: 'Framework commit',
    footPost: ' 上生成；每条 catalog entry 都恰好出现一次。',
    browseAll: '在 GitHub 上浏览全部',
    // 单个实例详情页（/zh/examples/<slug>/）。仅壳文案——实例标题、描述、源码、
    // 运行命令在所有语言下都保持英文（从上游文件解析，和索引 blurb 一致）。
    detail: {
      backToIndex: '← 全部示例',
      goals: {
        'start-here': '从这里开始',
        'use-case-recipes': '场景实例',
        orchestration: '编排',
        'production-controls': '生产控制',
        'connect-your-stack': '连接你的技术栈',
      },
      exampleLabel: '示例',
      apisUsed: 'OMA API',
      linesLabel: '行',
      runTitle: '运行',
      runNote: '在仓库的克隆里运行这个文件：',
      prereqsTitle: '前置条件',
      providerNote: 'OMA 与 provider 无关——这个示例按上面的 key 编写，但你也可以用 OpenAI、Gemini、Groq 等任意 provider 运行。',
      providerLink: '全部 provider',
      sourceTitle: '完整源码',
      sourceNote: '完整示例，从固定的 Framework commit 同步。',
      viewOnGithub: '在 GitHub 查看 / 编辑',
      relatedTitle: '相关示例',
      relatedNote: '同一目标下的更多示例。',
      learnTitle: '学习相关概念',
      learnQuickStart: '快速开始',
      learnDocs: '文档',
      browseAll: '全部示例',
      seoTitleSuffix: ' — Open Multi-Agent 示例',
      // 按 slug 的中文覆盖：标题 + 描述。代码、API 名、运行命令、源码保持英文；
      // 未列出的例子回退到英文（en 源）。忠实翻译上游描述，不曲解例子行为。
      recipes: {
        'express-customer-support': {
          title: 'Express 客服 API',
          intent: '一条 Express REST API 把 OMA 的显式 runTasks() DAG 放在 POST /tickets 后面；每次请求依次完成分类、回复起草与 QA 复核，并返回结构化 JSON。',
        },
        'contract-review-dag': {
          title: '合同审查 DAG（步骤级重试）',
          intent: '用 runTasks() 演示 DAG 任务编排 + 步骤级重试。场景：由 4 个任务组成 DAG 的合同审查流水线。',
        },
        'competitive-monitoring': {
          title: '竞品监控（多源聚合 + 矛盾检测）',
          intent: '三个并行的来源智能体从本地 JSON fixtures 抽取数据、各自处理带 { claim, date, source_url, confidence } 的论断；聚合器跨来源交叉核对、识别重复、标记矛盾，输出结构化 Markdown 报告；并计时校验并行执行须低于串行总和的 70%。',
        },
        'meeting-summarizer': {
          title: '会议纪要生成器（并行后处理）',
          intent: '三个专职智能体对同一份会议转录做 fan-out；用 Zod schema 产出结构化的待办项与情绪；计时对比并行墙钟时间 vs 各智能体耗时之和；聚合器合并成单份 Markdown 报告。',
        },
        'incident-postmortem-dag': {
          title: '事故复盘 DAG（并行 fan-out）',
          intent: '演示 DAG 任务编排：三个独立的根任务从 t=0 起并行 fan-out，最后汇总成一份事故复盘文档。',
        },
        'structured-output': {
          title: '结构化输出',
          intent: '演示 AgentConfig 上的 outputSchema：智能体的回复会被自动解析为 JSON 并按 Zod schema 校验；校验失败时框架带着错误反馈重试一次。',
        },
        'personalized-interview-simulator': {
          title: '个性化面试模拟器（面试官 + 观察者）',
          intent: '有状态的面试官智能体用 Agent.prompt() 跨轮对话；无状态的观察者智能体在每轮之间读取完整转录上下文；在 runTeam() / runTasks() 之外手动注入 SharedMemory 与 prompt；用 readline 在应用层处理人工输入；面试循环结束时用 Zod 产出结构化复盘。',
        },
        'multi-model-team': {
          title: '多模型团队（自定义工具）',
          intent: '在同一个团队里混用 Anthropic 与 OpenAI 模型；用 defineTool() + Zod schema 定义自定义工具；用自定义 ToolRegistry 构建能使用这些工具的智能体；运行一个用到这些工具的团队目标。',
        },
        'fan-out-aggregate': {
          title: 'Fan-Out / 聚合（MapReduce）模式',
          intent: 'fan-out：把同一个问题并行发给 N 个「分析师」智能体；聚合：一个「综合者」智能体读取所有分析结果、产出平衡的最终报告；用 AgentPool + runParallel() 做并发 fan-out；无需工具——纯 LLM 推理以聚焦模式本身。',
        },
        'narrative-puzzle-hint-arbitration': {
          title: '叙事解谜提示仲裁（多源冲突消解 + 安全否决）',
          intent: '多源提示仲裁，配一个位于生成循环之外的外部安全否决。',
        },
        'research-aggregation': {
          title: '多源研究聚合',
          intent: '用 runTasks() 演示显式依赖链：三个分析师智能体并行、各自独立研究同一主题；通过 dependsOn 建立依赖链，综合者等所有分析师完成；自动共享记忆——智能体输出经框架流向下游智能体。',
        },
        'translation-backtranslation': {
          title: '翻译 + 回译质量校验（跨模型）',
          intent: '智能体 A 用 Claude 把英文译成目标语言；智能体 B 用另一家 provider 回译成英文；智能体 C 比对原文与回译、标记语义漂移；用 Zod schema 产出结构化结果。',
        },
        'paper-replication-triage': {
          title: '论文复现分诊（多源证据调和）',
          intent: '各来源专属智能体审查不同的证据快照、而非同一份 PDF；runTasks() DAG：并行来源审查 → 依赖它们的复现规划器；共享记忆 / 依赖上下文把上游 JSON 带进规划器；预置的冲突迫使规划器调和论文论断与产物；mock 的来源快照会被标记，SOURCE_MODE=live 则走 Asta + GitHub。',
        },
        'cost-tiered-pipeline': {
          title: '成本分层流水线',
          intent: '把同一条四阶段 runTasks() 流水线跑两次；在一条流水线内给每个智能体分配不同模型；通过 onTrace 采集各模型的 token 用量；按各 provider 的模型定价估算美元成本。',
        },
        'plan-replay': {
          title: '固定并回放协调器计划',
          intent: '演示 planOnly + createPlanArtifact + runFromPlan：让协调器把目标分解一次、序列化成可 diff 的 JSON 产物，之后无需再调用协调器就能回放完全相同的任务图。任务 id、依赖、指派、描述与执行配置（memoryScope、重试设置）都被保留，所以回放的图与评审过的一致，而不是被 LLM 重新分解。',
        },
        'multi-perspective-code-review': {
          title: '多视角代码评审',
          intent: '依赖链：生成器产出代码，三个评审者依赖它；并行执行：安全、性能、风格三个评审者并发运行；结构化输出：综合者返回经 Zod 校验的问题清单；共享记忆：每个智能体的输出由框架自动存储并注入下游智能体的 prompt。',
        },
        'agent-handoff': {
          title: '通过 delegate_to_agent 的同步智能体交接',
          intent: '在 runTeam / runTasks 期间，池中的智能体注册内置的 delegate_to_agent 工具，让一个专家智能体能在同一轮对话里对另一个在册智能体跑子 prompt 并读取答复。',
        },
        'single-agent': {
          title: '单智能体',
          intent: '最简单的用法：一个带 bash 与文件工具的智能体执行编码任务；随后演示直接用 Agent 类做流式输出。',
        },
        'task-retry': {
          title: '任务重试（指数退避）',
          intent: '演示任务配置上的 maxRetries、retryDelayMs 与 retryBackoff：任务失败时框架按指数退避自动重试；onProgress 回调会收到 task_retry 事件，便于实时记录重试。',
        },
        'team-collaboration': {
          title: '多智能体团队协作',
          intent: '三个专职智能体（架构师、开发、评审）围绕一个共同目标协作。OpenMultiAgent 编排器把目标拆成任务、分派给合适的智能体，并收集结果。',
        },
        'consensus': {
          title: '提议者 / 评判者共识模式',
          intent: '演示 runConsensus()：提议者智能体起草答案，一组评判者智能体尝试反驳；若足够多的评判者接受（达到法定数），答案即被判为通过；若异议超出预算，提议者修订、循环最多重复 maxRounds 轮。',
        },
        'task-pipeline': {
          title: '带依赖的显式任务流水线',
          intent: '演示如何用显式依赖链定义任务。',
        },
        'rare-disease-information-triage': {
          title: '罕见病信息分诊（来源隔离的证据审查 + 安全仲裁）',
          intent: '五个来源隔离的智能体分别读取不同的 MOCK fixtures，对患者自述症状、公益科普、官方指南 / 专家共识类内容、基因-表型证据、以及网络 / 论坛 / 商业论断做来源隔离的证据审查；下游仲裁者只接收结构化的审查输出；运行时检测各来源证据之间的冲突；安全策略禁止诊断、治疗、剂量或商业推荐；用 Zod 校验结构化输出并做简单的运行时断言。',
        },
        'cross-provider-reasoning': {
          title: '通过 preserveReasoningAsText 跨 provider 保留推理',
          intent: '通过 preserveReasoningAsText 跨 provider 保留推理模型的思维流。',
        },
      } as Record<string, { title: string; intent: string }>,
    },
    // /examples 索引卡片/行的中文覆盖（短标题 + blurb）。代码标识符、产品专名
    // （Engram、Vercel AI SDK 等）保留英文；未列出的条目回退英文。
    entries: {
      // cookbook
      'adaptive-customer-support': { title: '自适应客服', blurb: '协调器根据物流或账单升级问题动态选择专职 Agent，再综合各自证据，形成一份有依据的回复。' },
      'competitive-monitoring': { title: '竞品监控', blurb: '并行监控多个来源（Twitter/Reddit/News）、检测矛盾，并聚合成情报报告。' },
      'contract-review-dag': { title: '合同审查 DAG', blurb: '4 个任务的 DAG（extract → compliance-check + summary → notify）+ 步骤级重试。正常运行，或用 FORCE_FAIL=task2 触发重试。' },
      'incident-postmortem-dag': { title: '事故复盘 DAG', blurb: '5 个任务的 DAG：三个并行的根任务（日志模式 + 部署关联 + 影响范围）汇入根因假设与最终复盘综合。' },
      'meeting-summarizer': { title: '会议纪要生成器', blurb: '对转录做 fan-out 后处理，产出摘要、结构化待办项与情绪。' },
      'narrative-puzzle-hint-arbitration': { title: '叙事解谜提示仲裁', blurb: '多源提示仲裁，配一个位于生成循环之外的外部安全否决。' },
      'paper-replication-triage': { title: '论文复现分诊', blurb: '多源论文复现分诊，含产物发现、预置冲突，以及结构化的 go/no-go 计划。' },
      'personalized-interview-simulator': { title: '个性化面试模拟器', blurb: '交互式面试官循环，带观察者标记、共享记忆与结构化复盘。' },
      'rare-disease-information-triage': { title: '罕见病信息分诊', blurb: '来源隔离的罕见病信息分诊，含 mock fixtures、预置的错误信息 / 冲突检测，以及安全边界仲裁。' },
      'translation-backtranslation': { title: '翻译回译', blurb: '翻译 → 用另一家 provider 回译 → 标记语义漂移（跨模型）。' },
      // reference（API、协议与产品专名保留；标题的人类可读部分和 blurb 中文化）
      'external-agent-acp': { title: 'ACP 外部 Agent', blurb: '通过 ACP（Agent Client Protocol）接入外部编码智能体。' },
      'external-agent-process': { title: '外部 Agent 进程', blurb: '无需模型 API Key，把确定性的本地子进程作为外部 Agent 运行。' },
      'mcp-bilig-workpaper': { title: 'Bilig WorkPaper MCP', blurb: 'Bilig WorkPaper 的 MCP 工具：公式回读、重算，以及持久化的 workbook JSON。' },
      'mcp-github': { title: 'GitHub MCP', blurb: '通过 connectMCPTools() 把一个 MCP 服务器的工具暴露给智能体。' },
      'mcp-open-design': { title: 'Open Design MCP', blurb: '对一个 MCP 服务器的异步任务做批量 fan-out：通过 runTasks() 并行生成 N 次 Open Design run，每次用代码驱动编排轮询 get_run 至完成。' },
      'trace-observability': { title: 'Trace 可观测性', blurb: '对 LLM 调用、工具与任务的 onTrace span。' },
      // apps
      'express-customer-support': { title: 'Express 客服', blurb: 'Express REST API：POST /tickets 背后跑 runTasks()、每个智能体独立 Zod schema、可切换的 provider 环境变量、HTTP 错误映射（400/502/504）。' },
      'with-vercel-ai-sdk': { title: 'Vercel AI SDK 集成', blurb: 'Next.js：OMA runTeam() 搭配 AI SDK useChat 流式输出。' },
      // vendor（产品专名保留，补充中文用途）
      'with-engram': { title: 'Engram 记忆', blurb: 'Engram 记忆后端。' },
      'with-tencentdb-memory': { title: 'TencentDB Agent Memory 集成', blurb: '通过 Hermes Gateway sidecar 接入 TencentDB-Agent-Memory 长期记忆（L0→L3 流水线）。' },
      // basics（name 是 slug，保留；只译 blurb）
      'multi-model-team': { blurb: '一个团队里每个智能体用不同的模型。' },
      'single-agent': { blurb: '一个带 bash + 文件工具的智能体，随后用 Agent 类做流式输出。' },
      'task-pipeline': { blurb: '带显式任务 DAG 与依赖的 runTasks()。' },
      'team-collaboration': { blurb: 'runTeam() 协调器模式——目标进，结果出。' },
      // patterns（API 与产品名保留；04「生产控制」的展示标题中文化）
      'agent-handoff': { blurb: '通过 delegate_to_agent 的同步子智能体委派。' },
      'consensus': { blurb: '通过 runConsensus() 的提议者→评判者反驳循环：默认评判 prompt 与每个评判者的 judgePrompt 函数。' },
      'cost-tiered-pipeline': { title: '成本分层流水线', blurb: '把同一条四阶段流水线跑两次，对比旗舰模型 vs 分层模型的成本。' },
      'cross-provider-reasoning': { blurb: '通过 preserveReasoningAsText 跨 provider 保留推理模型的思维流。' },
      'eval-offline-regression': { title: '离线评估回归', blurb: '对两个 Target 运行无需 API Key 的 EvalSet 回归，结合规则评分器、Judge 评分器和 Gate 给出结果。' },
      'eval-online-sampling': { title: '在线评估采样', blurb: '对线上运行进行采样，在持久化 FileEvalStore 中异步评分，并显式关闭评估管线。' },
      'fan-out-aggregate': { blurb: '通过 AgentPool.runParallel() 的 MapReduce 式 fan-out。' },
      'multi-perspective-code-review': { blurb: '多个评审智能体并行，然后综合。' },
      'observability-v2': { title: '可观测性 v2', blurb: '无需 API Key 的示例，覆盖批处理、TraceStore、OpenTelemetry、生命周期处理和离线 Run Viewer。' },
      'plan-replay': { title: '计划回放', blurb: '用 createPlanArtifact 固定协调器计划，再用 runFromPlan 回放，不重跑协调器。' },
      'research-aggregation': { blurb: '多源研究，由一个综合智能体汇整。' },
      'risk-gated-bash': { title: '风险门控 Bash', blurb: '将工具授权与逐次调用 Gate 组合，对 bash 命令执行放行、人工复核或拦截。' },
      'structured-output': { title: '结构化输出', blurb: '智能体产出经 Zod 校验的 JSON。' },
      'task-retry': { title: '任务重试', blurb: '每个任务的指数退避重试。' },
    } as Record<string, { title?: string; blurb: string }>,
  },

  showcase: {
    seo: {
      title: '案例 — Open Multi-Agent',
      description: '用 Open Multi-Agent 构建的开源项目，以及与之集成的工具——从一个生产级的 WordPress 安全平台，到 PR 审查、智能体记忆和可观测性。',
    },
    hero: {
      eyebrow: '案例',
      title: '基于 Open Multi-Agent 构建。',
      subPre: '用这个框架构建的开源项目与集成——来自生态，且均可公开验证。在用 OMA 做东西？',
      discuss: '发起一个讨论',
      subPost: ' 就能被收录。',
    },
    builtWith: { eyebrow: '用 OMA 构建', title: 'OMA 作为内核。', sub: '在 Open Multi-Agent 上运行智能体团队的应用。' },
    integrates: { eyebrow: '与 OMA 集成', title: '为运行中的团队扩展能力。', sub: '即插即用的工具，为 Open Multi-Agent 增添新能力。' },
    spotlight: { eyebrow: '聚焦', heading: '完全离线，跑在生产环境。', cta: '查看主页' },
    entries: {
      'Mark Galyan': {
        desc: '完全离线运行 OMA：使用纯本地量化模型，不联网、无需 API key。靠协调器和上下文压缩，在紧张显存下维持自主智能体循环不中断。',
        tag: '离线 · 本地模型',
        status: '框架第一个月起的贡献者，涉及上下文压缩、采样、工具调用解析。',
      },
      'temodar-agent': { desc: 'WordPress 安全分析平台。在 Docker 运行时里调用 OMA 内置工具（bash、文件操作、grep）。', tag: '安全', status: '已上架 Docker Hub' },
      'PR-Copilot': { desc: 'AI 拉取请求审查助手。运行一个 OMA 审查团队——一个协调器加若干限定范围的审查智能体——配自定义工具和按 token 感知的 diff 压缩。', tag: '代码审查', status: '基于 OMA 构建' },
      'StuFlow': { desc: '终端 AI 编码助手。用自定义的 RunTeamOptions 协调器，通过 runAgent / runTasks / runTeam 驱动一个 OMA 团队，搭配 DeepSeek。', tag: '编码智能体', status: '基于 OMA 构建' },
      'Engram': { desc: '「AI 记忆的 Git」：跨智能体的共享记忆，带冲突检测，基于 OMA 的 MemoryStore + ToolRegistry 工具包。', tag: '记忆', status: '工具包' },
      '@agentsonar/oma': { desc: '一个 sidecar，检测跨运行的委派环路、重复和速率突发。', tag: '可观测性', status: '集成' },
      'CodingScaffold': { desc: '一个智能体编码脚手架，把 OMA 列为可选的编排后端，附带一个 runTeam 工作流模板。', tag: '脚手架', status: '可选后端' },
    },
  },

  architecture: {
    seo: {
      title: 'OMA 工作原理 — 架构与 runTeam() 流程',
      description: 'Open Multi-Agent 的架构与 runTeam() 执行流程图解：协调器把目标拆解成任务 DAG，让智能体在共享的 MessageBus 上并行扇出，并综合出结果。',
    },
    hero: {
      eyebrow: '工作原理',
      title: 'OMA 的工作原理。',
      ledeHtml: '两张图，一套系统。一张是<b>架构</b>——OMA 的结构，也就是它<i>是什么</i>；另一张是<b>流程</b>——调用 <code>runTeam()</code> 时，按时间顺序发生了什么。',
    },
    structure: {
      eyebrow: '结构',
      title: '架构。',
      sub: '自上而下五层：你调用的编排器、它协调的团队、负责调度工作的池与队列、真正干活的智能体，以及底层的适配器、运行器和工具接口。每个方框都与框架里的一个类型一一对应。',
      imgAlt: 'OMA 架构。OpenMultiAgent 是入口，拥有一个 Team，Team 持有一个 AgentPool 和一个 TaskQueue。Agent 通过 AgentRunner 的对话循环运行，并与 LLMAdapter 接口（多个提供方实现）和 ToolRegistry（defineTool 加 6 个内置工具）通信。',
    },
    structureLegend: [
      { k: '强调色描边', d: '用户入口——你实例化的那个类。每张图里有且仅有一个。' },
      { k: '实线', d: '具体类型——只有一种实现的类：Team、AgentPool、TaskQueue、Agent、AgentRunner。' },
      { k: '虚线', d: '有多种实现的接口——LLMAdapter 提供方、ToolRegistry 工具。' },
      { k: '箭头', d: '拥有 / 包含——源端实例化或拥有目标端。自上而下读。' },
    ],
    execution: {
      eyebrow: '执行',
      titleHtml: '一次 <code>runTeam()</code> 调用。',
      sub: '目标进，结果出。协调器把目标拆解成任务 DAG，让智能体并行扇出，通过 MessageBus 传递中间结果，并综合出最终答案。从左往右读——横轴是时间。',
      imgAlt: 'runTeam() 流程。一个目标拆解成四个任务；一个 architect 和两个 developer 并行运行，reviewer 通过 TaskQueue 依赖等待它们，MessageBus 连接各条轨道，最后综合出一个带类型的结果对象。',
    },
    flowRead: [
      { k: '纵向 = 哪个智能体', d: '每个智能体有自己的一条水平轨道，像乐谱里的一个声部。' },
      { k: '横向 = 什么时候', d: '对齐在同一个 x 上的轨道，在同一逻辑时刻运行；更早结束的轨道先完成。' },
      { k: 'reviewer 等待', d: 'reviewer 向右偏移——它在 TaskQueue 里依赖 architect 和两个 developer。' },
      { k: 'message bus', d: '那条翠绿色虚线带，是任何智能体在执行期间都能发布和订阅的通道。' },
    ],
    next: {
      eyebrow: '深入了解',
      title: '从图到代码。',
      threeWays: 'runAgent · runTeam · runTasks',
      quickStart: '快速开始',
    },
  },

  blog: {
    seo: {
      title: '博客 — Open Multi-Agent',
      description:
        '关于 TypeScript 多智能体编排的写作：目标驱动的任务 DAG、混合模型团队、长期记忆，以及智能体框架生态里的经验教训。',
    },
    eyebrow: '博客',
    title: '关于多智能体编排的笔记。',
    ledePre: '深入探讨目标驱动的任务 DAG、混合模型团队，以及 TypeScript 智能体生态。',
    ledeLink: '',
    ledePost: '',
    minRead: '分钟阅读',
    allPosts: '← 所有文章',
    originallyOn: '最初发表于',
    translatedFrom: '阅读英文原文',
  },

  compare: {
    seo: {
      title: 'open-multi-agent 对比 LangGraph、CrewAI、Mastra、LangChain、Pydantic AI 等',
      description: '把 open-multi-agent 与主流多智能体框架做可溯源的对比，覆盖编排、确定性控制、恢复、预算、可观测性与适用场景。',
    },
    hero: {
      eyebrow: '对比',
      title: 'open-multi-agent 怎么比。',
      lede: '比较真实的运行时能力，而不是一句分类标签。每一页都说明系统如何编排工作、OMA 提供哪些控制，以及各自适合什么场景。',
    },
    hub: {
      pickThem: '选 {name}，如果',
      pickUs: '选 open-multi-agent，如果',
      view: '完整对比',
      moreTitle: '更多对比',
      moreLede: '同样规格的完整对比，覆盖其余框架与相邻工具，包括单智能体工具包、RAG 栈与云厂商 SDK。',
    },
    page: {
      eyebrow: '对比',
      vsTitle: 'open-multi-agent 对比 {name}',
      seoTitle: 'open-multi-agent 对比 {name}：一份可溯源的评测',
      matrix: { eyebrow: '速览', title: '并排来看。', dimension: '维度', oma: 'open-multi-agent' },
      capabilities: {
        eyebrow: '真实能力',
        title: 'open-multi-agent 实际包含什么。',
        lede: 'OMA 不只是目标拆解与少量依赖。以下均为项目 README 已记录的当前框架能力。',
      },
      howDiffer: { eyebrow: '机制', title: '它们差在哪。' },
      whenThemTitle: '{name} 适合什么',
      whenUsTitle: 'open-multi-agent 适合什么',
      repoLink: '{name} 的 GitHub',
      seeAlso: '对比另一个框架',
      backToHub: '全部对比',
    },
  },

  // /compare/claude-dynamic-workflows —— 独立页（不是 COMPARISONS 条目），承接
  // "claude dynamic workflows" 搜索意图并引导到 OMA。框架同上游 README 的
  // "vs. Claude Code's dynamic workflows" 段落：同一个赌注（模型在运行时规划
  // 工作），不同形态。护栏：不把 OMA 说成动态工作流的"替代品"（那个词留给
  // LangGraph/Mastra，见 seeAlso）；不争"谁更 dynamic"（两者都是模型驱动）；
  // 不断言动态工作流"缺"什么——每个"Claude 动态工作流"格子只陈述官方帖子说它
  // 做什么。
  dynamicWorkflows: {
    seo: {
      title: 'Claude 动态工作流，自托管 —— open-multi-agent',
      description:
        'Claude 动态工作流与 open-multi-agent 押的是同一个赌注：让模型在运行时规划工作。区别在形态——动态工作流跑在 Claude Code 内部；open-multi-agent 是一个开源（MIT）TypeScript 库，把同样的目标到任务 DAG 的思路跑在你自己的后端、任意模型上。',
    },
    hero: {
      eyebrow: '背景',
      backToHub: '全部对比',
      h1: 'Claude 动态工作流，与 open-multi-agent',
      lede: '2026 年 5 月，Anthropic 在 Claude Code 里推出了动态工作流（dynamic workflows）：由模型在运行时自己规划、编排工作。open-multi-agent 押的是同一个赌注，只是形态不同。',
    },
    cards: {
      dwLabel: 'Claude 动态工作流',
      dwBody:
        'Claude Code 内部的模型驱动编排。Claude 自己写编排脚本，在一次会话里扇出数十到数百个并行子智能体，并在结果交到你手上之前自行检查。',
      dwLink: '阅读官方公告',
      omaLabel: 'open-multi-agent',
      omaBody:
        '一个 MIT 许可的 TypeScript 库。协调器在运行时把你的目标拆成任务 DAG，并在你自己的后端、任意模型提供方上运行——计划以可检视、可重放的数据形式暴露出来。',
      omaLink: '快速开始',
    },
    bet: {
      eyebrow: '共同的赌注',
      title: '同一个赌注：让模型来规划工作。',
      body: '两者都是模型驱动的。你不必事先接好一张固定的图——你交出一个目标，模型在运行时规划工作，把它拆成可并行的步骤再把结果汇拢。Claude 的动态工作流在 Claude Code 内部这么做；open-multi-agent 的协调器在你的后端这么做。思路相同——所以这一页不会去争谁<em>更 dynamic</em>。真正有用的问题是：编排在哪里运行，以及你能拿这份计划做什么。',
    },
    form: {
      eyebrow: '差别',
      title: '差别在于形态。',
      intro: '它们不是同一类东西。Claude 动态工作流是 Claude Code 内部的一项能力，编排的是 Claude 子智能体。open-multi-agent 是一个你装进 TypeScript 后端、指向任意模型提供方的库。下面把两者并排来看。',
      th: { dimension: '维度', dw: 'Claude 动态工作流', oma: 'open-multi-agent' },
      rows: [
        { k: '在哪里运行', dw: 'Claude Code 内部——CLI、桌面端与 IDE', oma: '你自己的 Node.js 后端——用 npm 安装，无需迁移到托管服务' },
        { k: '它是什么', dw: 'Claude Code 的一项能力', oma: '一个你嵌入的开源（MIT）库' },
        { k: '模型', dw: 'Claude 子智能体', oma: '任意提供方——OpenAI、Anthropic、Gemini、Bedrock，或任意本地 / OpenAI 兼容模型' },
        { k: '语言 / 载体', dw: '从 Claude Code 使用', oma: 'TypeScript，可用于任意 Node.js 18+ 后端' },
        { k: '计划', dw: 'Claude 在会话里写下并运行的编排脚本，返回前自行检查', oma: '一张可作为数据检视与重放的任务 DAG——planOnly、createPlanArtifact、runFromPlan' },
      ],
    },
    compose: {
      eyebrow: '可组合',
      title: '可组合，不只是并行。',
      body: '两者并不互斥。open-multi-agent 讲 Agent Client Protocol（ACP），所以一个 OMA 团队可以把外部编码智能体——包括 Claude Code 本身——当作团队里的一个智能体来驱动。你在 Claude Code 里得到的模型规划式编排，可以成为一次更大的、由你端到端掌控、且中立于提供方的运行中的一个节点。',
      cta: '查看 ACP 集成与权限边界',
    },
    fit: {
      eyebrow: 'OMA 适合什么',
      title: 'open-multi-agent 适合什么。',
      body: '当编排需要活在你自己的产品内部时，选 open-multi-agent：一个你 <code>npm install</code> 进 Node.js 后端的开源（MIT）库，运行在任意提供方上——OpenAI、Anthropic、Gemini、Bedrock，或一个本地的 OpenAI 兼容模型。协调器在运行时规划任务 DAG，而这份计划是你可以检视、重放、把关的数据——<code>planOnly</code> 在任何东西运行前审阅，<code>createPlanArtifact</code> 把它存下来，<code>runFromPlan</code> 执行一份你已经审过的计划。',
      cta: '快速开始',
    },
    seeAlso: {
      eyebrow: '在对比框架？',
      title: '想找一个框架替代品？',
      body: '把各个编排库互相掂量是另一个问题。看看 open-multi-agent 与 LangGraph、Mastra 以及其他框架的对比。',
      cta: '全部框架对比',
    },
    hubCard: {
      label: '背景',
      name: 'open-multi-agent 与 Claude 动态工作流',
      blurb: '同一个赌注——让模型规划工作——只是形态不同。OMA 与 Anthropic 在 Claude Code 里的动态工作流是什么关系。',
      cta: '阅读',
    },
  },

  // 用例（solutions）页。仅 chrome——每个用例的文案在 src/lib/solutions.ts。
  solutions: {
    seo: {
      title: '应用场景 —— TypeScript 多智能体编排',
      description: '用 open-multi-agent 能构建什么：并行 LLM 调用、目标驱动的任务 DAG、混编模型团队、本地智能体、长期记忆，以及在 Vercel AI SDK 之上做编排。',
    },
    hero: {
      eyebrow: '应用场景',
      title: '你能构建什么。',
      lede: 'TypeScript 里多智能体工作的几种常见形态——每种都讲清机制、何时合适，并配一篇带可运行代码的完整走查。',
    },
    hub: { view: '看怎么做' },
    page: {
      eyebrow: '应用场景',
      backToHub: '全部场景',
      problemEyebrow: '问题',
      problemTitle: '问题在哪。',
      approachEyebrow: '做法',
      approachTitle: 'open-multi-agent 怎么做。',
      whenEyebrow: '适用',
      whenTitle: '何时合适。',
      walkthroughEyebrow: '走查',
      walkthroughCta: '读完整走查，含可运行代码',
      relatedCompare: '相关对比',
      seeAlso: '更多场景',
    },
  },

  // 集成页。仅 chrome——每个集成的文案与代码在 src/lib/integrations.ts。
  integrations: {
    seo: {
      title: '集成 —— 模型、OpenTelemetry 与运行时适配器',
      description: '把 open-multi-agent 接入 OpenTelemetry、Anthropic、OpenAI、Gemini、DeepSeek、AWS Bedrock、Azure OpenAI、Ollama，以及任意兼容 OpenAI 的端点。',
    },
    hero: {
      eyebrow: '集成',
      title: '把运行时接进来。',
      lede: '先为编排核心接入可观测性或外部执行能力，再选择智能体调用模型的位置。',
    },
    hub: {
      runtimeEyebrow: '运行时能力',
      runtimeTitle: '扩展运行时。',
      runtimeLede: '接入横切整个运行过程的能力，核心的目标到任务 DAG 编排保持不变。',
      runtimeCount: '个集成',
      providersEyebrow: '模型接入',
      providersTitle: '选择模型提供方。',
      providersLede: '整个团队可以共用一个提供方，也可以按智能体混用模型，编排契约保持一致。',
      providersCount: '个提供方',
    },
    page: {
      eyebrow: '集成',
      backToHub: '全部集成',
      setupEyebrow: '配置',
      setupTitle: '一份最小配置。',
      howEyebrow: '怎么契合',
      howTitle: '它怎么契合。',
      mixCta: '在一个团队里混用提供方',
      allProviders: '全部提供方与环境变量',
      seeAlso: '其它集成',
    },
  },
};
