// 简体中文 UI 文案（自定义页）。形状必须与 ./en.ts 完全一致（UiDict = typeof en），
// 缺键即类型错误（pnpm check CI 闸用 tsc 抓——astro build 走 esbuild 不做类型检查，
// 单跑 build 抓不到、会把缺键静默渲染成 undefined）。术语与已上线的中文文档站一致
// （协调器 / 任务 DAG / 目标优先 / 编排 / 智能体 / 模型提供方 …）。
// 保留不译：代码标识符、API 名、URL、包名；第三方背书引用按原文保留。
import type { UiDict } from './en';

export const zh: UiDict = {
  nav: {
    brandAria: 'Open Multi-Agent — 首页',
    product: '产品',
    productMenu: {
      framework: { pkg: 'open-multi-agent', desc: '多智能体编排框架。' },
      forge: { pkg: 'oma-forge', desc: 'open-multi-agent 组织下的实验性项目。' },
    },
    docs: '文档',
    architecture: '架构',
    examples: '示例',
    showcase: '案例',
    blog: '博客',
    stars: 'Star',
    toggleThemeAria: '切换浅色/深色主题',
    toggleThemeTitle: '切换主题',
    menuAria: '菜单',
  },

  langSwitcher: {
    toAria: '切换到 {lang}',
  },

  footer: {
    blurb: '从目标到任务 DAG，自动完成。<br />TypeScript 原生的多智能体编排。',
    product: { head: '产品', capabilities: '能力', useCases: '应用场景', integrations: '集成', faq: '常见问题' },
    resources: { head: '资源', docs: '文档', architecture: '架构', examples: '示例', showcase: '案例', blog: '博客' },
    project: { head: '项目', github: 'GitHub', npm: 'npm', mitLicense: 'MIT 许可证', llmsTxt: 'llms.txt', rss: 'RSS' },
    resourcesEnterprise: '企业服务',
    mitLicensed: 'MIT 许可 · @open-multi-agent',
    builtBy: '出自',
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
      title: 'Open Multi-Agent — 从目标到任务 DAG，自动完成',
      description: 'TypeScript 原生的多智能体编排。协调器把目标转成任务 DAG、并行执行，并综合出带类型的结果——可嵌入任意 Node.js 后端。',
    },
    hero: {
      eyebrow: 'TypeScript 多智能体编排',
      h1: '从目标到任务 DAG，',
      h1Accent: '自动完成。',
      meta: ['3 个运行时依赖', '任意模型', '随处运行'],
      quickStart: '快速开始',
      ioInput: '输入 · team.ts',
      ioGoal: '目标',
      decomposesInto: '拆解为',
      parallel: '并行',
      runReal: '真实',
      runTasks: '个任务',
    },
    copy: '复制',
    copied: '✓ 已复制',
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
    ],
    oneCall: { title: '一次调用', body: '整个 DAG 解析完成时 runTeam() 才返回——无需手工接线节点，也没有调度器要维护。' },
    capsLinks: { threeWays: 'runAgent · runTeam · runTasks —— 三种运行方式', archFlow: '查看架构与 runTeam() 流程' },
    sectionReliability: {
      eyebrow: '可靠性',
      title: '为生产环境而生。',
      sub: '把真实工作交给自主智能体，会引出三个合理的问题：它们会不会失控、烧光预算、或在你看不见的地方失败？每一个问题，API 里都有答案。',
    },
    reliability: [
      {
        tag: '不会失控',
        t: '你始终在掌控之中',
        ref: '/guides/orchestration-controls/',
        refLabel: '编排控制',
        parts: [
          '在任何智能体运行前先审视计划——用 ', { c: 'onPlanReady' },
          '，再用 ', { c: 'onApproval' },
          ' 逐轮审批。一次提议者→评审（', { c: 'runConsensus' },
          '）让一个智能体检查另一个的输出，循环检测则会在某个智能体开始原地打转时将其叫停。',
        ],
      },
      {
        tag: '不会烧光预算',
        t: '把钱花在刀刃上',
        ref: '/reference/model-routing/',
        refLabel: '模型路由',
        parts: [
          '用 ', { c: 'modelRouting' },
          ' 把规划交给旗舰模型、把叶子任务交给便宜模型。', { c: 'maxTokenBudget' },
          ' 给一次运行的花费设上限——一旦越界，编排器就停止发起调用，而不是把账单越垒越高。',
        ],
      },
      {
        tag: '调试任意一次运行',
        t: '检查、回放、恢复',
        ref: '/reference/observability/',
        refLabel: '可观测性',
        parts: [
          '用 ', { c: 'onTrace' },
          ' 把每一次 LLM 和工具调用流式发送到你的链路追踪栈，或在运行结束后打开一个自包含的 HTML 仪表盘（', { c: 'oma run --dashboard' },
          '）。检查点能让崩溃的运行从最后一个已完成任务处恢复，密钥则会以尽力而为的方式从追踪和仪表盘中脱敏。',
        ],
      },
    ],
    dashboard: {
      caption: '而当真的出岔子时，每一次运行都能渲染出一个可审计的仪表盘——任务 DAG、每个节点的承担者与状态、token 拆解，以及智能体的输出日志。',
      obsLink: '可观测性',
      imgAlt: '运行后仪表盘正在回放一次已完成的团队运行：任务 DAG，标注每个节点的承担者、状态、token 拆解，以及智能体输出日志。',
    },
    sectionBuild: {
      eyebrow: '应用场景',
      title: '三个值得动用一个团队的工作流。',
      sub: '每一个都是单一目标，且能从并行、多模型的拆解中获益——这正是协调器擅长的。',
      seeCode: '查看代码',
    },
    builds: [
      { scenario: '法务 · 文档审查', title: '合同审查', desc: '一个目标——「标出这份 MSA 里的风险」——扇出给多个智能体，并行地研读条款、比对政策库、起草批注。', outcome: '一次 runTeam() 调用，产出一份结构化的风险报告。' },
      { scenario: '市场 · 监测', title: '竞品监测', desc: '多个智能体通过 MCP 从不同来源抓取，各自用合适的模型——抓取用便宜的本地模型、分析用前沿模型——再把发现对齐。', outcome: '一份去重后的摘要，按计划定时刷新，一个团队里混用多个提供方。' },
      { scenario: 'SRE · 运维', title: '事故复盘', desc: '日志、指标和部署时间线作为并行节点被调查；一个评审智能体综合出原因与诱因。', outcome: '事故解决几分钟后，就有一份基于时间线的复盘初稿。' },
    ],
    sectionStack: {
      eyebrow: '集成',
      title: '与你的技术栈协同。',
      sub: 'OMA 与你后端里已有的提供方、协议和服务器组合使用——没有要迁移过去的平台。',
    },
    stack: [
      { name: '提供方', note: 'Anthropic、Gemini、OpenAI、Bedrock、Azure、DeepSeek——或任何兼容 OpenAI 的端点', count: '13 个内置' },
      { name: 'MCP', note: '把 Model Context Protocol 服务器作为工具接入', count: '原生' },
      { name: 'Vercel AI SDK', note: '桥接 60+ 个 AI SDK 提供方与平台', count: '兼容' },
      { name: 'Express', note: '把 runTeam() 挂在一个路由处理器后面', count: '即插即用' },
      { name: '任意 Node.js', note: '没有守护进程，没有 sidecar——三个运行时依赖', count: 'Node 18+' },
    ],
    sectionProof: {
      eyebrow: '采用情况',
      title: '已经在真实世界里运行。',
      sub: '开源、MIT 许可，项目与集成的生态在持续生长。Star、fork 和贡献者数量在构建时直接读自仓库。',
      liveTag: '实时 · 同步自 registry',
      stats: { stars: 'Star', forks: 'Fork', contributors: '贡献者', latestRelease: '最新版本', license: '许可证' },
    },
    sectionFaq: {
      eyebrow: '常见问题',
      title: '讲机制，不讲营销。',
      sub: '运行时究竟如何表现。完整参考在文档里。',
      viewAll: '查看全部问题',
    },
    faqs: [
      { q: '协调器如何把目标变成 DAG？', a: '协调器智能体会规划工作：把目标拆成一个个离散任务，推断它们之间的依赖，并产出一张有向无环图。相互独立的节点并发运行；有依赖的节点等待各自的输入。传入 planOnly 即可在任何智能体执行前审视这张 DAG。' },
      { q: '同一个团队里的智能体能用不同的模型提供方吗？', a: '可以。每个智能体声明自己的模型，所以一个团队可以混用前沿云端模型、自托管端点和本地 Ollama 实例。协调器把每个任务路由给指派的智能体——也就因此路由给对应的模型。' },
      { q: '工具是如何暴露给智能体的？', a: '默认拒绝。智能体只拥有它在 tools 数组里显式列出的工具，其余一律不可用。外部系统通过 MCP 服务器接入，遵循同样的按需授权约定。' },
      { q: '某个节点失败了会怎样？', a: '失败的节点会按其策略重试；持续失败会以 FAILED 状态加一条错误显示在该节点上，下游依赖被挂起。DAG 的其余部分继续运行，所以一次失败不会让整次运行中止。' },
      { q: '怎样防止一次多智能体运行失控？', a: '分层控制，全部可选开启。onPlanReady 把拆解出的计划交给你，在任何智能体运行前审视；onApproval 为每一轮把关；返回 false，剩余任务就被跳过。runConsensus 加一道提议者→评审检查，必须由第二个智能体认可；循环检测则会在某个智能体不断重复同一次工具调用或输出时将其叫停。' },
      { q: '怎样给一次运行的成本设上限？', a: '两个杠杆。modelRouting 把规划和综合交给旗舰模型，叶子任务跑在更便宜的模型上，于是只在关键处付前沿模型的价。maxTokenBudget 是累计 token 的硬上限：一旦越界，编排器就停止发起调用、跳过剩余任务，而不是把账单越垒越高。' },
      { q: '它是流式的，还是只在最后返回？', a: '都支持。你可以在 DAG 逐步填充时流式输出 token 和节点状态变化，也可以直接 await runTeam()，在图解析完成后拿到一个带类型、经 schema 校验的结果对象。' },
    ],
    endorse: {
      eyebrow: '被提及',
      quote: 'A brilliant TypeScript-native multi-agent orchestration framework.',
      cite: 'GithubAwesome · 58K subscribers · GitHub Trending Monthly #6',
      imgAlt: '在 YouTube 观看——GithubAwesome 的 GitHub Trending Monthly #6，画面停在 open-multi-agent 的 GitHub 仓库（6k stars）。',
    },
    ctaFinal: {
      eyebrow: '开始上手',
      title1: '从一个目标开始。',
      title2: '让团队自己想清楚要做什么。',
      quickStart: '快速开始',
    },
  },

  examples: {
    seo: {
      title: '示例 — Open Multi-Agent',
      description: '可运行的 Open Multi-Agent 端到端示例——围绕所解决的问题来组织的 Cookbook 实例、框架与应用集成、编排模式，以及每个模型提供方一个示例。直接来自仓库。',
    },
    hero: {
      eyebrow: '示例',
      title: '用 OMA 能搭出什么。',
      lede: '直接来自仓库、可直接运行的实例——每一个都围绕它解决的问题来组织。按你想搭的东西浏览，然后打开源码。',
    },
    seeSource: '查看源码',
    cookbook: {
      eyebrow: 'Cookbook',
      title: '面向真实问题的实例。',
      sub: '围绕一个具体任务、而非单个原语写成的端到端脚本——打开源码，看这些模式如何在真实工作流里组合。',
      subFallback: '先从几个端到端实例上手。完整且始终保持同步的全集——集成、编排模式、每个模型提供方一个示例——都在仓库里。',
    },
    integrations: {
      eyebrow: '集成',
      title: '与你的技术栈协同。',
      sub: '它是库，不是平台——与你后端里已有的协议、服务器和框架组合使用。',
      reference: '参考集成',
      apps: '应用 · 克隆即跑',
      vendor: '厂商集成',
    },
    buildingBlocks: {
      eyebrow: '构建块',
      title: '原语、模式与提供方。',
      sub: 'Cookbook 所组合的那些更底层的零件——如果你在学 API 或在对比模型，从这里开始。',
      basics: '基础 · 从这里开始',
      patterns: '模式',
      providers: '提供方 · 每个模型一个示例',
    },
    production: {
      title: '生产级示例',
      desc: '端到端、生产级的用例——更高的门槛，带测试、锁定模型。想加一个，先看贡献标准。',
      link: 'GitHub 上的 production/',
    },
    footPre: '在构建时从仓库的 ',
    footCode: 'packages/core/examples',
    footPost: ' 目录生成，所以它始终与源码一致。',
    browseAll: '在 GitHub 上浏览全部',
  },

  showcase: {
    seo: {
      title: '案例 — Open Multi-Agent',
      description: '用 Open Multi-Agent 构建的开源项目，以及与之集成的工具——从一个生产级的 WordPress 安全平台，到 PR 审查、智能体记忆和可观测性。',
    },
    hero: {
      eyebrow: '案例',
      title: '基于 Open Multi-Agent 构建。',
      subPre: '用这个框架构建的开源项目，以及与之集成的工具——取自生态、MIT 许可。在用 OMA 做东西？',
      discuss: '发起一个讨论',
      subPost: ' 就能被收录。',
    },
    builtWith: { eyebrow: '用 OMA 构建', title: 'OMA 作为内核。', sub: '在 Open Multi-Agent 上运行智能体团队的应用。' },
    integrates: { eyebrow: '与 OMA 集成', title: '为运行中的团队扩展能力。', sub: '即插即用的工具，为 Open Multi-Agent 增添新能力。' },
    entries: {
      'temodar-agent': { desc: 'WordPress 安全分析平台。在 Docker 运行时里调用 OMA 内置工具（bash、文件操作、grep）。', tag: '安全', status: '已上架 Docker Hub' },
      'PR-Copilot': { desc: 'AI 拉取请求审查助手。运行一个 OMA 审查团队——一个协调器加若干限定范围的审查智能体——配自定义工具和按 token 感知的 diff 压缩。', tag: '代码审查', status: '基于 OMA 构建' },
      'StuFlow': { desc: '终端 AI 编码助手。用自定义的 RunTeamOptions 协调器，通过 runAgent / runTasks / runTeam 驱动一个 OMA 团队，搭配 DeepSeek。', tag: '编码智能体', status: '基于 OMA 构建' },
      'Engram': { desc: '「AI 记忆的 Git」——跨智能体的共享记忆，带冲突检测，基于 OMA 的 MemoryStore + ToolRegistry 工具包。', tag: '记忆', status: '工具包' },
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
};
