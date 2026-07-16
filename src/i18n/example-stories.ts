import type { Locale } from './index';

// Editorial explanation for the workflows surfaced under Use Cases, including
// selected full applications as well as Cookbook recipes.
// Runtime facts (source, commands, prerequisites, APIs, LOC) deliberately stay in
// examples-source.json; this file explains those verified facts in plain language.
// When an upstream Cookbook recipe changes, review its EN + ZH story alongside the
// refreshed snapshot rather than attempting to generate business claims at build time.

export interface ExampleStoryAgent {
  name: string;
  task: string;
}

export interface ExampleStoryStage {
  title: string;
  summary: string;
  parallel?: boolean;
  agents: ExampleStoryAgent[];
}

export interface ExampleStory {
  audience: string;
  outcome: string;
  problem: string;
  input: { title: string; detail: string };
  stages: ExampleStoryStage[];
  deliverable: { title: string; summary: string; items: string[] };
  why: string[];
  boundary: string;
  related: string[];
}

export interface ExampleStoryUi {
  audience: string;
  scenarioEyebrow: string;
  problem: string;
  input: string;
  workflowEyebrow: string;
  workflowTitle: string;
  workflowLede: string;
  parallel: string;
  outputEyebrow: string;
  outputShape: string;
  why: string;
  boundary: string;
  builderEyebrow: string;
  builderTitle: string;
  builderLede: string;
  implementationFacts: string;
  fullSourceSummary: (lines: number) => string;
  relatedNote: string;
}

const ui: Record<Locale, ExampleStoryUi> = {
  en: {
    audience: 'Useful for',
    scenarioEyebrow: 'The scenario',
    problem: 'The problem',
    input: 'What goes in',
    workflowEyebrow: 'How it works',
    workflowTitle: 'A team, with a clear handoff.',
    workflowLede: 'Each specialist sees the evidence it needs. Independent work runs together; dependent work waits for the right inputs.',
    parallel: 'runs in parallel',
    outputEyebrow: 'The result',
    outputShape: 'What comes out',
    why: 'Why use multiple agents',
    boundary: 'Scope and limits',
    builderEyebrow: 'For builders',
    builderTitle: 'Run it, then inspect the implementation.',
    builderLede: 'The business view above is editorial. The commands, prerequisites, APIs, and source below stay synchronized with the real repository.',
    implementationFacts: 'Implementation facts',
    fullSourceSummary: (lines) => `Open the complete, synchronized source · ${lines} lines`,
    relatedNote: 'More examples with a similar decision, evidence, or handoff pattern.',
  },
  zh: {
    audience: '适合',
    scenarioEyebrow: '使用情境',
    problem: '要解决的问题',
    input: '输入什么',
    workflowEyebrow: '工作方式',
    workflowTitle: '一支分工明确、交接清楚的团队。',
    workflowLede: '每个专职 Agent 只处理它需要的证据；互不依赖的工作同时进行，需要上游结果的工作则按顺序等待。',
    parallel: '并行执行',
    outputEyebrow: '最终结果',
    outputShape: '会产出什么',
    why: '为什么使用多个 Agent',
    boundary: '范围与限制',
    builderEyebrow: '开发者实现',
    builderTitle: '先运行，再查看具体实现。',
    builderLede: '上面是面向业务的解释；下面的命令、运行前提、API 和源码继续与真实仓库同步。',
    implementationFacts: '实现信息',
    fullSourceSummary: (lines) => `展开完整同步源码 · ${lines} 行`,
    relatedNote: '在决策、证据处理或交接方式上相近的其他示例。',
  },
};

const en = {
  'express-customer-support': {
    audience: 'Backend and support-operations teams embedding a repeatable AI workflow behind an API',
    outcome: 'Accept a support ticket over HTTP, run a fixed classify → draft → QA pipeline, and return schema-validated JSON.',
    problem: 'A production support route needs more than a plausible reply. Input must be validated, each handoff must have a predictable shape, failures need explicit HTTP behavior, and the workflow should not pay to rediscover the same topology on every request.',
    input: { title: 'One POST /tickets request', detail: 'A JSON body with a ticket subject and body. The Express route rejects malformed or missing input before any model call.' },
    stages: [
      { title: 'Classify the ticket', summary: 'The first task returns a schema-validated category and urgency.', agents: [
        { name: 'Classifier', task: 'Categorizes the issue and assigns an urgency level.' },
      ] },
      { title: 'Draft the reply', summary: 'The drafter receives the original ticket plus the classifier result through the explicit task dependency.', agents: [
        { name: 'Support drafter', task: 'Writes an empathetic customer-facing response.' },
      ] },
      { title: 'Review before returning', summary: 'The final task checks the draft against the ticket and classification.', agents: [
        { name: 'QA reviewer', task: 'Reviews tone, empathy, and factual consistency.' },
      ] },
    ],
    deliverable: { title: 'A typed HTTP response', summary: 'The endpoint assembles the three structured outputs and maps invalid input, pipeline failure, and timeout to explicit status codes.', items: ['Category and urgency', 'Customer-facing draft reply', 'QA notes with 400 / 502 / 504 error behavior'] },
    why: ['A fixed runTasks() DAG keeps the high-volume route predictable.', 'Zod schemas make every handoff usable by application code.', 'A separate QA step checks the customer-facing draft before it leaves the pipeline.'],
    boundary: 'This clone-and-run app demonstrates the API and orchestration boundary. It does not connect to a real CRM, order system, or ticketing platform, and it does not take account actions on a customer’s behalf.',
    related: ['incident-postmortem-dag', 'meeting-summarizer', 'contract-review-dag'],
  },
  'competitive-monitoring': {
    audience: 'Product intelligence and market research teams',
    outcome: 'Turn conflicting claims from several channels into one source-linked intelligence report.',
    problem: 'The same competitor announcement can appear with different dates or performance claims across social posts, community discussion, and news. Reading each feed separately makes contradictions easy to miss.',
    input: { title: 'Three source feeds', detail: 'Local Twitter, Reddit, and news fixtures, each containing claims, dates, source links, and confidence.' },
    stages: [
      { title: 'Read each source independently', summary: 'Source boundaries stay visible instead of being blended too early.', parallel: true, agents: [
        { name: 'Twitter analyst', task: 'Extracts claims from the Twitter fixture.' },
        { name: 'Reddit analyst', task: 'Extracts claims from the Reddit fixture.' },
        { name: 'News analyst', task: 'Extracts claims from the news fixture.' },
      ] },
      { title: 'Cross-check the evidence', summary: 'The aggregator receives all structured claims after the three source reviews finish.', agents: [
        { name: 'Intelligence aggregator', task: 'Finds duplicates, compares dates and numbers, and flags contradictions.' },
      ] },
    ],
    deliverable: { title: 'A structured Markdown intelligence report', summary: 'The report preserves where each claim came from instead of hiding disagreement in a single summary.', items: ['Claims grouped across sources', 'Duplicate and conflicting claims called out', 'Dates, source links, and confidence retained'] },
    why: ['Three feeds are processed at the same time.', 'Source-specific agents reduce premature blending.', 'A separate aggregator can compare, rather than merely summarize, the evidence.'],
    boundary: 'This recipe uses deliberately conflicting local fixtures. It demonstrates the orchestration pattern; connecting live social or news APIs is a separate integration step.',
    related: ['paper-replication-triage', 'rare-disease-information-triage', 'incident-postmortem-dag'],
  },
  'contract-review-dag': {
    audience: 'Legal-operations and workflow teams evaluating repeatable review pipelines',
    outcome: 'Extract contract clauses once, review and summarize them in parallel, then produce a final Markdown notification.',
    problem: 'A contract review has steps that depend on one another, but not every step needs to wait. Running everything in sequence wastes time; restarting the whole review after one temporary failure wastes even more.',
    input: { title: 'A contract review scenario', detail: 'The bundled example supplies the contract content and a four-step review plan.' },
    stages: [
      { title: 'Extract the clauses', summary: 'One upstream task prepares the shared material needed by the reviewers.', agents: [
        { name: 'Clause extractor', task: 'Identifies and structures the relevant contract clauses.' },
      ] },
      { title: 'Review from two angles', summary: 'Both tasks start after extraction and do not block each other.', parallel: true, agents: [
        { name: 'Compliance checker', task: 'Checks the extracted clauses and retries this step if it fails.' },
        { name: 'Summarizer', task: 'Creates a concise contract summary.' },
      ] },
      { title: 'Finish the handoff', summary: 'The last task waits until both review branches are complete.', agents: [
        { name: 'Notifier', task: 'Combines the completed work into the final Markdown notification.' },
      ] },
    ],
    deliverable: { title: 'A completed review notification', summary: 'The final artifact is produced only after the compliance check and summary have both succeeded.', items: ['Extracted clause context', 'Compliance-check result', 'Contract summary and final notification'] },
    why: ['Parallel review shortens the middle of the workflow.', 'Dependencies make the handoffs explicit.', 'Step-level retry repeats only the failed work, with exponential backoff.'],
    boundary: 'This is an orchestration and retry example, not legal advice or a production compliance policy. A forced-failure command is included so the retry path can be observed safely.',
    related: ['incident-postmortem-dag', 'meeting-summarizer', 'translation-backtranslation'],
  },
  'incident-postmortem-dag': {
    audience: 'SRE and engineering teams that assemble incident postmortems',
    outcome: 'Investigate logs, deployments, and impact at the same time, then synthesize one root-cause hypothesis and postmortem.',
    problem: 'Incident evidence lives in different places. Waiting for one investigation to finish before starting the next delays learning, while merging raw evidence too early can erase useful distinctions.',
    input: { title: 'Three views of one incident', detail: 'Log patterns, deployment correlation, and blast-radius evidence supplied by the example.' },
    stages: [
      { title: 'Investigate independently', summary: 'All three root investigations begin together.', parallel: true, agents: [
        { name: 'Log investigator', task: 'Extracts patterns from the logs.' },
        { name: 'Deployment investigator', task: 'Correlates the incident with deployments.' },
        { name: 'Impact investigator', task: 'Analyzes the blast radius.' },
      ] },
      { title: 'Form a root-cause hypothesis', summary: 'This step waits for all three evidence streams.', agents: [
        { name: 'Root-cause analyst', task: 'Reconciles the investigations into a supported hypothesis.' },
      ] },
      { title: 'Write the postmortem', summary: 'The final writer turns the hypothesis and evidence into a durable artifact.', agents: [
        { name: 'Postmortem writer', task: 'Produces the final document and writes it to a temporary file.' },
      ] },
    ],
    deliverable: { title: 'A synthesized incident postmortem', summary: 'The output keeps the evidence chain visible and includes runtime and token-cost information from the example run.', items: ['Evidence from three investigations', 'Root-cause hypothesis', 'Final postmortem document'] },
    why: ['Independent investigations start immediately.', 'The synthesis waits for complete evidence.', 'A dedicated writer separates analysis from communication.'],
    boundary: 'This example focuses on parallel investigation and synthesis. Unlike the contract recipe, it intentionally does not demonstrate forced failure or retry behavior.',
    related: ['contract-review-dag', 'competitive-monitoring', 'meeting-summarizer'],
  },
  'meeting-summarizer': {
    audience: 'Teams turning meeting transcripts into useful follow-up',
    outcome: 'Transform one transcript into a summary, structured action items, sentiment, and a single Markdown report.',
    problem: 'A useful meeting record requires several kinds of reading. Asking one pass to summarize, extract commitments, and judge tone can blur those objectives and slow the result.',
    input: { title: 'One meeting transcript', detail: 'The same transcript is shared with three specialists, each with a different responsibility.' },
    stages: [
      { title: 'Read for three different purposes', summary: 'Each specialist works on the same transcript at the same time.', parallel: true, agents: [
        { name: 'Summary specialist', task: 'Captures the main discussion and decisions.' },
        { name: 'Action-item specialist', task: 'Returns schema-validated owners and follow-up work.' },
        { name: 'Sentiment specialist', task: 'Returns a structured view of meeting sentiment.' },
      ] },
      { title: 'Assemble the meeting record', summary: 'The aggregator waits for every specialist result.', agents: [
        { name: 'Report aggregator', task: 'Merges the three perspectives into one Markdown report.' },
      ] },
    ],
    deliverable: { title: 'A ready-to-share meeting report', summary: 'The example also compares parallel wall-clock time with the sum of the individual agent durations.', items: ['Concise meeting summary', 'Structured action items', 'Sentiment and one combined Markdown report'] },
    why: ['Different reading goals remain explicit.', 'All three analyses run concurrently.', 'Structured outputs make action items and sentiment easier to use downstream.'],
    boundary: 'The recipe demonstrates transcript post-processing. Production use still needs decisions about recording consent, transcript retention, and who can access meeting content.',
    related: ['incident-postmortem-dag', 'personalized-interview-simulator', 'contract-review-dag'],
  },
  'narrative-puzzle-hint-arbitration': {
    audience: 'Game teams designing hints that help without spoiling discovery',
    outcome: 'Reconcile progress, narrative, and player-behavior evidence, then let an independent safety reviewer veto an over-revealing hint.',
    problem: 'The most direct hint may improve short-term progress but damage immersion or reveal the protected puzzle linkage. Those objectives need both negotiation and a hard boundary.',
    input: { title: 'Four fictional, local policy and game-data sources', detail: 'Mock game state, lore, player analytics, and designer safety policy fixtures.' },
    stages: [
      { title: 'Build source-specific proposals', summary: 'The first three specialists are isolated from one another.', parallel: true, agents: [
        { name: 'Mechanic analyst', task: 'Reads structured puzzle progress without writing player-facing text.' },
        { name: 'Lore specialist', task: 'Frames a hint in the game world’s narrative voice.' },
        { name: 'Community analyst', task: 'Proposes an empirically effective hint from behavior data.' },
      ] },
      { title: 'Resolve the conflict', summary: 'The arbiter receives only the structured upstream results.', agents: [
        { name: 'Hint arbiter', task: 'Balances safety, immersion, and progress into a draft hint.' },
      ] },
      { title: 'Apply the hard boundary', summary: 'Safety review sits outside the generation loop.', agents: [
        { name: 'Safety reviewer', task: 'Issues a binary veto if the draft reveals or materially narrows the protected linkage.' },
      ] },
    ],
    deliverable: { title: 'An approved hint or an explicit veto', summary: 'The runtime scenario is intentionally constructed so the compromise hint is rejected for narrowing the puzzle too far.', items: ['Source-specific structured proposals', 'Conflict-aware draft hint', 'Independent pass-or-veto decision'] },
    why: ['Source isolation preserves distinct objectives.', 'An arbiter can make trade-offs visible.', 'An external veto prevents a soft preference from overriding a hard rule.'],
    boundary: 'All fixtures and the game scenario are fictional. This is a demonstration of conflict resolution and safety architecture, not a real game integration.',
    related: ['rare-disease-information-triage', 'competitive-monitoring', 'translation-backtranslation'],
  },
  'paper-replication-triage': {
    audience: 'Research teams deciding whether and how to reproduce a paper',
    outcome: 'Audit separate evidence sources in parallel, surface disagreements, and produce a structured replication go/no-go plan.',
    problem: 'A paper’s claims, code repository, and available artifacts may not agree. Reviewing only the paper—or giving every reviewer one blended context—can hide missing evidence and contradictions.',
    input: { title: 'A paper title or arXiv identifier', detail: 'By default the recipe uses clearly marked evidence snapshots; live mode can use Asta and GitHub.' },
    stages: [
      { title: 'Audit each source separately', summary: 'Source-specific agents review different evidence snapshots in parallel.', parallel: true, agents: [
        { name: 'Paper reviewer', task: 'Extracts the paper’s claims and reported setup.' },
        { name: 'Artifact reviewer', task: 'Checks the available implementation and artifacts.' },
        { name: 'Evidence reviewer', task: 'Records source quality, gaps, and conflicts.' },
      ] },
      { title: 'Plan the replication', summary: 'The planner receives the structured audits through dependency context.', agents: [
        { name: 'Replication planner', task: 'Reconciles the claims and artifacts into a concrete go/no-go plan.' },
      ] },
    ],
    deliverable: { title: 'A structured replication triage plan', summary: 'The plan makes uncertainty and seeded source conflicts explicit rather than presenting a falsely clean answer.', items: ['Source-by-source evidence audit', 'Missing artifacts and contradictions', 'Replication decision and next-step plan'] },
    why: ['Evidence sources remain attributable.', 'Independent reviews can run concurrently.', 'The planner reasons over structured disagreements, not a flattened summary.'],
    boundary: 'Snapshot mode is a deterministic demonstration. Live source collection requires additional credentials and optional dependencies, and its evidence quality still needs human judgment.',
    related: ['competitive-monitoring', 'rare-disease-information-triage', 'incident-postmortem-dag'],
  },
  'personalized-interview-simulator': {
    audience: 'Teams prototyping interview practice and structured coaching',
    outcome: 'Run a multi-turn interview while a separate observer tracks the full conversation, then produce a structured debrief.',
    problem: 'An interviewer needs conversational continuity, while an evaluator needs enough distance to notice patterns across the whole session. Combining both roles in one prompt can make the interview inconsistent.',
    input: { title: 'Candidate context and live answers', detail: 'Bundled materials can be replaced with a resume, project notes, code, and job description from your own directory.' },
    stages: [
      { title: 'Conduct the interview', summary: 'The interviewer retains state across turns and receives the candidate’s live terminal input.', agents: [
        { name: 'Interviewer', task: 'Asks personalized follow-ups based on prior answers and candidate materials.' },
      ] },
      { title: 'Observe between turns', summary: 'A stateless observer rereads the complete transcript after each exchange.', agents: [
        { name: 'Interview observer', task: 'Records patterns and coaching signals without taking over the conversation.' },
      ] },
      { title: 'Close with a debrief', summary: 'The full session is converted into a schema-validated result.', agents: [
        { name: 'Debrief step', task: 'Produces structured feedback at the end of the interview loop.' },
      ] },
    ],
    deliverable: { title: 'A personalized, structured interview debrief', summary: 'The conversation stays human-led while the observer provides a second perspective over the complete transcript.', items: ['Stateful multi-turn interview', 'Observer notes across turns', 'Schema-validated final debrief'] },
    why: ['Conversation and evaluation have separate responsibilities.', 'Shared memory keeps relevant candidate context available.', 'Structured debrief data can feed a later coaching workflow.'],
    boundary: 'This is an interactive simulator, not a validated hiring assessment. Candidate materials and transcripts may contain sensitive information and need an explicit retention and access policy in production.',
    related: ['meeting-summarizer', 'translation-backtranslation', 'narrative-puzzle-hint-arbitration'],
  },
  'rare-disease-information-triage': {
    audience: 'Teams evaluating safety patterns for health-information systems',
    outcome: 'Keep five evidence types separate, expose conflicts and overclaims, and produce a safety-constrained information triage result.',
    problem: 'Patient reports, educational material, guidelines, genetic evidence, and commercial claims have very different reliability. Blending them too early can turn weak overlap into false certainty or a commercial recommendation.',
    input: { title: 'Five clearly marked mock evidence sources', detail: 'Fictional patient-reported symptoms, nonprofit education, guideline-style content, gene–phenotype evidence, and web or commercial claims.' },
    stages: [
      { title: 'Audit each evidence class in isolation', summary: 'Five reviewers work independently so provenance and source quality stay visible.', parallel: true, agents: [
        { name: 'Patient-report reviewer', task: 'Structures the reported symptoms without diagnosing.' },
        { name: 'Education reviewer', task: 'Checks nonprofit educational claims.' },
        { name: 'Guideline reviewer', task: 'Preserves the broader differential in official-style guidance.' },
        { name: 'Genetic-evidence reviewer', task: 'Records weak or uncertain gene–phenotype evidence.' },
        { name: 'Web-claims reviewer', task: 'Flags certainty inflation and paid-test promotion.' },
      ] },
      { title: 'Arbitrate with safety constraints', summary: 'The downstream arbiter receives structured reviews, not the raw blended sources.', agents: [
        { name: 'Safety arbiter', task: 'Detects conflicts and forbids diagnosis, treatment, dosing, or commercial recommendation.' },
      ] },
    ],
    deliverable: { title: 'A structured, safety-bounded evidence triage', summary: 'The output communicates uncertainty and source disagreement without converting the material into medical advice.', items: ['Five attributable evidence audits', 'Conflict and overclaim flags', 'Schema-validated safety-constrained result'] },
    why: ['Source isolation reduces evidence laundering.', 'Parallel audits keep the workflow practical.', 'A separate arbiter applies cross-source and safety rules consistently.'],
    boundary: 'All fixtures are mock and contain no real patient data. The example must not be used for diagnosis, treatment, dosing, or commercial recommendations.',
    related: ['narrative-puzzle-hint-arbitration', 'paper-replication-triage', 'competitive-monitoring'],
  },
  'translation-backtranslation': {
    audience: 'Localization teams checking whether important meaning survived translation',
    outcome: 'Translate with one model family, translate back with another, then flag possible semantic drift in a structured report.',
    problem: 'A fluent translation can still lose a condition, number, or nuance. Asking the same model to grade its own work also gives the check too little independence.',
    input: { title: 'Source text and a target language', detail: 'The example uses credentials for two different provider families so translation and backtranslation are separated.' },
    stages: [
      { title: 'Translate the source', summary: 'The first model creates the target-language version.', agents: [
        { name: 'Translator', task: 'Translates the English source into the requested language.' },
      ] },
      { title: 'Translate it back independently', summary: 'A different provider family sees the translated text, not the original answer rationale.', agents: [
        { name: 'Backtranslator', task: 'Produces a fresh English version from the translation.' },
      ] },
      { title: 'Compare meaning', summary: 'A third specialist compares the original with the backtranslation.', agents: [
        { name: 'Quality reviewer', task: 'Flags semantic drift and returns schema-validated findings.' },
      ] },
    ],
    deliverable: { title: 'A structured translation quality check', summary: 'The result identifies where meaning may have shifted; it does not merely score surface fluency.', items: ['Target-language translation', 'Independent backtranslation', 'Structured semantic-drift findings'] },
    why: ['Different roles keep generation and checking distinct.', 'Cross-provider review adds useful independence.', 'Structured findings are easier to route for human review.'],
    boundary: 'Backtranslation is a signal, not proof of translation quality. High-stakes or culturally sensitive content still requires a qualified human reviewer.',
    related: ['meeting-summarizer', 'personalized-interview-simulator', 'competitive-monitoring'],
  },
} satisfies Record<string, ExampleStory>;

const zh: Record<keyof typeof en, ExampleStory> = {
  'express-customer-support': {
    audience: '希望把可重复 AI 工作流嵌进后端 API 的开发与客服运营团队',
    outcome: '通过 HTTP 接收客服工单，执行固定的「分类 → 起草 → QA」流水线，再返回经 schema 校验的 JSON。',
    problem: '生产级客服接口不能只产出一段看似合理的回复。输入必须校验，步骤之间要有可预测的数据结构，失败要映射成明确的 HTTP 行为，而且每次请求都不该重新推导同一套拓扑。',
    input: { title: '一次 POST /tickets 请求', detail: 'JSON body 包含工单标题与正文；Express 路由会在任何模型调用前拒绝格式错误或字段缺失的输入。' },
    stages: [
      { title: '给工单分类', summary: '第一项任务返回经过 schema 校验的类别与紧急程度。', agents: [
        { name: '分类 Agent', task: '判断问题类别并标记紧急程度。' },
      ] },
      { title: '起草回复', summary: '起草 Agent 通过显式任务依赖拿到原始工单和分类结果。', agents: [
        { name: '客服起草 Agent', task: '撰写有同理心、面向客户的回复。' },
      ] },
      { title: '返回前复核', summary: '最后一步结合原始工单与分类结果检查回复。', agents: [
        { name: 'QA 复核 Agent', task: '检查语气、同理心与事实一致性。' },
      ] },
    ],
    deliverable: { title: '带类型的 HTTP 响应', summary: '接口组装三个结构化结果，并把输入错误、流水线失败和超时映射成明确状态码。', items: ['类别与紧急程度', '面向客户的回复草稿', 'QA 备注，以及 400 / 502 / 504 错误行为'] },
    why: ['固定的 runTasks() DAG 让高频接口保持可预测。', 'Zod schema 让每次交接都能直接被应用代码消费。', '独立 QA 步骤会在回复离开流水线前完成检查。'],
    boundary: '这个可克隆运行的应用展示 API 与编排边界；它没有连接真实 CRM、订单系统或工单平台，也不会代替客服执行账户操作。',
    related: ['incident-postmortem-dag', 'meeting-summarizer', 'contract-review-dag'],
  },
  'competitive-monitoring': {
    audience: '产品情报与市场研究团队',
    outcome: '把多个渠道中互相冲突的说法，整理成一份保留来源的竞品情报报告。',
    problem: '同一条竞品消息，在社交平台、社区讨论和新闻报道中可能出现不同的日期或性能数字。逐个查看来源，很容易漏掉矛盾。',
    input: { title: '三个来源的数据流', detail: '本地 Twitter、Reddit 与新闻 fixtures；每条论断都带日期、来源链接和置信度。' },
    stages: [
      { title: '分别阅读每个来源', summary: '在比较之前先保留来源边界，避免过早混成一份摘要。', parallel: true, agents: [
        { name: 'Twitter 分析员', task: '从 Twitter fixture 提取论断。' },
        { name: 'Reddit 分析员', task: '从 Reddit fixture 提取论断。' },
        { name: '新闻分析员', task: '从新闻 fixture 提取论断。' },
      ] },
      { title: '交叉核对证据', summary: '三个来源完成后，聚合器接收全部结构化论断。', agents: [
        { name: '情报聚合器', task: '识别重复内容，对比日期与数字，并标记矛盾。' },
      ] },
    ],
    deliverable: { title: '结构化 Markdown 情报报告', summary: '报告保留每条信息来自哪里，而不是用一段看似确定的摘要掩盖分歧。', items: ['跨来源归类的论断', '重复与冲突内容', '保留日期、来源链接和置信度'] },
    why: ['三个来源可以同时处理。', '来源专属 Agent 能减少过早混合。', '独立聚合器负责比较证据，而不只是总结。'],
    boundary: '这个示例使用刻意放入矛盾的本地 fixtures，展示的是编排模式；接入实时社交媒体或新闻 API 属于另一个集成步骤。',
    related: ['paper-replication-triage', 'rare-disease-information-triage', 'incident-postmortem-dag'],
  },
  'contract-review-dag': {
    audience: '评估可重复审查流程的法务运营与工作流团队',
    outcome: '只提取一次合同条款，并行完成合规检查与摘要，最后生成 Markdown 通知。',
    problem: '合同审查有明确的先后关系，但并非每一步都必须排队执行。全部串行会浪费时间；某一步暂时失败后重跑整条流程，则会重复已经完成的工作。',
    input: { title: '一个合同审查场景', detail: '示例内置合同内容，以及一个四步骤的审查计划。' },
    stages: [
      { title: '提取条款', summary: '上游任务先准备两位审查者都需要的共同材料。', agents: [
        { name: '条款提取员', task: '识别并整理相关合同条款。' },
      ] },
      { title: '从两个角度审查', summary: '两项任务都在条款提取后开始，彼此不需要等待。', parallel: true, agents: [
        { name: '合规检查员', task: '检查提取出的条款；失败时只重试这一步。' },
        { name: '合同摘要员', task: '生成简明的合同摘要。' },
      ] },
      { title: '完成交付', summary: '最后一步等两个审查分支都完成后再开始。', agents: [
        { name: '通知生成器', task: '把全部结果合并成最终 Markdown 通知。' },
      ] },
    ],
    deliverable: { title: '完整的审查通知', summary: '只有合规检查和合同摘要都成功后，系统才生成最终产物。', items: ['提取后的条款上下文', '合规检查结果', '合同摘要与最终通知'] },
    why: ['并行审查缩短流程中段。', '依赖关系让交接顺序清楚可见。', '步骤级重试只重复失败的工作，并使用指数退避。'],
    boundary: '这是编排与重试示例，不是法律意见或生产级合规政策。示例还提供强制失败命令，方便安全观察重试路径。',
    related: ['incident-postmortem-dag', 'meeting-summarizer', 'translation-backtranslation'],
  },
  'incident-postmortem-dag': {
    audience: '负责事故复盘的 SRE 与工程团队',
    outcome: '同时调查日志、部署和影响范围，再汇总成根因假设与事故复盘文档。',
    problem: '事故证据分散在不同位置。等一项调查完成才开始下一项会拖慢复盘；过早混合原始证据，又可能抹掉重要差异。',
    input: { title: '同一事故的三类视角', detail: '示例提供日志模式、部署关联和影响范围证据。' },
    stages: [
      { title: '分别展开调查', summary: '三个根调查任务同时开始。', parallel: true, agents: [
        { name: '日志调查员', task: '从日志中提取模式。' },
        { name: '部署调查员', task: '核对事故与部署的关联。' },
        { name: '影响调查员', task: '分析影响范围。' },
      ] },
      { title: '形成根因假设', summary: '等待三路证据全部返回后再推断。', agents: [
        { name: '根因分析员', task: '调和三项调查，形成有证据支持的假设。' },
      ] },
      { title: '撰写复盘', summary: '最后把假设与证据整理成可长期保存的产物。', agents: [
        { name: '复盘撰写员', task: '生成最终文档，并写入临时文件。' },
      ] },
    ],
    deliverable: { title: '综合事故复盘文档', summary: '输出保留证据链，并显示示例运行时长与 token 成本信息。', items: ['三项独立调查的证据', '根因假设', '最终事故复盘文档'] },
    why: ['独立调查可以立即开始。', '综合步骤会等待证据完整。', '分析与对外表达由不同角色负责。'],
    boundary: '这个示例聚焦并行调查与综合；与合同审查示例不同，它刻意不演示强制失败或重试。',
    related: ['contract-review-dag', 'competitive-monitoring', 'meeting-summarizer'],
  },
  'meeting-summarizer': {
    audience: '需要把会议转录变成后续行动的团队',
    outcome: '把一份会议转录转成摘要、结构化待办、情绪判断和一份 Markdown 报告。',
    problem: '一份有用的会议记录需要从多个角度阅读。让一次处理同时负责总结、提取承诺和判断情绪，容易混淆目标并拖慢结果。',
    input: { title: '一份会议转录', detail: '同一份转录同时交给三位职责不同的专职 Agent。' },
    stages: [
      { title: '为了三个目标分别阅读', summary: '三位专职 Agent 同时处理同一份转录。', parallel: true, agents: [
        { name: '摘要专员', task: '提炼主要讨论与决定。' },
        { name: '待办专员', task: '按 schema 返回负责人和后续工作。' },
        { name: '情绪专员', task: '返回结构化的会议情绪判断。' },
      ] },
      { title: '组装会议记录', summary: '聚合器等待三个结果全部完成。', agents: [
        { name: '报告聚合器', task: '把三类结果合并成一份 Markdown 报告。' },
      ] },
    ],
    deliverable: { title: '可直接分享的会议报告', summary: '示例还会比较并行墙钟时间与各 Agent 耗时之和。', items: ['简洁会议摘要', '结构化待办事项', '情绪信息与一份合并报告'] },
    why: ['不同阅读目标保持独立。', '三项分析同时执行。', '结构化结果方便后续系统继续处理。'],
    boundary: '这个 recipe 展示会议转录的后处理。生产环境仍需明确录音同意、转录保留期限与访问权限。',
    related: ['incident-postmortem-dag', 'personalized-interview-simulator', 'contract-review-dag'],
  },
  'narrative-puzzle-hint-arbitration': {
    audience: '希望提供帮助、但不破坏探索感的游戏团队',
    outcome: '调和进度、叙事和玩家行为证据，再由独立安全审查者否决泄露过多的提示。',
    problem: '最直接的提示可能提升短期进度，却破坏沉浸感或泄露受保护的谜题关联。这些目标既需要协商，也需要不可越过的硬边界。',
    input: { title: '四类虚构的本地游戏数据与政策', detail: 'Mock 游戏状态、世界观资料、玩家分析和设计师安全政策 fixtures。' },
    stages: [
      { title: '形成来源专属提议', summary: '前三位专职 Agent 彼此隔离。', parallel: true, agents: [
        { name: '机制分析员', task: '读取结构化解谜进度，不生成玩家可见文案。' },
        { name: '叙事专员', task: '用游戏世界的叙事口吻构思提示。' },
        { name: '社区分析员', task: '根据玩家行为数据提出有效提示。' },
      ] },
      { title: '调和冲突', summary: '仲裁者只接收结构化的上游结果。', agents: [
        { name: '提示仲裁者', task: '在安全、沉浸感和进度之间形成提示草案。' },
      ] },
      { title: '应用硬边界', summary: '安全审查位于生成循环之外。', agents: [
        { name: '安全审查员', task: '如果草案泄露或明显缩小受保护关联，则二元否决。' },
      ] },
    ],
    deliverable: { title: '通过的提示，或明确的否决', summary: '运行时场景被刻意设计成：折中提示因为过度缩小解谜范围而被否决。', items: ['来源专属结构化提议', '识别冲突后的提示草案', '独立的通过或否决决定'] },
    why: ['来源隔离能保留不同目标。', '仲裁者让取舍过程清楚可见。', '外部否决防止软偏好覆盖硬规则。'],
    boundary: '所有 fixtures 和游戏场景都是虚构的；它展示冲突消解与安全架构，不是真实游戏集成。',
    related: ['rare-disease-information-triage', 'competitive-monitoring', 'translation-backtranslation'],
  },
  'paper-replication-triage': {
    audience: '需要判断论文是否值得、以及如何复现的研究团队',
    outcome: '并行审查不同证据来源，暴露分歧，并形成结构化的论文复现 go / no-go 计划。',
    problem: '论文论断、代码仓库和实际产物可能互不一致。只读论文，或让所有审查者使用已经混合的上下文，容易隐藏缺失证据与矛盾。',
    input: { title: '论文标题或 arXiv 标识符', detail: '默认使用明确标记的证据快照；live 模式可以接入 Asta 与 GitHub。' },
    stages: [
      { title: '分别审查每个来源', summary: '来源专属 Agent 并行检查不同证据快照。', parallel: true, agents: [
        { name: '论文审查员', task: '提取论文论断与报告的实验设置。' },
        { name: '产物审查员', task: '检查可用实现与产物。' },
        { name: '证据审查员', task: '记录来源质量、缺口和冲突。' },
      ] },
      { title: '规划复现', summary: '规划者通过依赖上下文接收结构化审查结果。', agents: [
        { name: '复现规划者', task: '调和论文论断与产物，形成具体 go / no-go 计划。' },
      ] },
    ],
    deliverable: { title: '结构化复现分诊计划', summary: '计划明确展示不确定性和预置的来源冲突，不会给出虚假的整洁答案。', items: ['逐来源证据审查', '缺失产物与矛盾', '复现决策与下一步计划'] },
    why: ['证据来源可追溯。', '独立审查可以并行完成。', '规划者处理结构化分歧，而不是扁平摘要。'],
    boundary: '快照模式是确定性的演示。实时来源收集需要额外凭据与可选依赖，其证据质量仍需人工判断。',
    related: ['competitive-monitoring', 'rare-disease-information-triage', 'incident-postmortem-dag'],
  },
  'personalized-interview-simulator': {
    audience: '原型验证面试练习与结构化辅导的团队',
    outcome: '进行多轮面试，让独立观察者追踪完整对话，最后生成结构化复盘。',
    problem: '面试官需要保持对话连续性，评估者则需要一定距离，才能观察整场会话的模式。把两个角色塞进同一个 prompt，容易让面试过程不稳定。',
    input: { title: '候选人材料与实时回答', detail: '内置材料可以替换成你自己的简历、项目笔记、代码和职位描述目录。' },
    stages: [
      { title: '进行面试', summary: '面试官跨轮保留状态，并接收候选人在终端输入的回答。', agents: [
        { name: '面试官', task: '根据先前回答与候选人材料继续追问。' },
      ] },
      { title: '在轮次之间观察', summary: '无状态观察者每轮重新读取完整转录。', agents: [
        { name: '面试观察者', task: '记录模式与辅导信号，但不接管对话。' },
      ] },
      { title: '以复盘结束', summary: '完整会话被转换为通过 schema 校验的结果。', agents: [
        { name: '复盘步骤', task: '在面试循环结束时生成结构化反馈。' },
      ] },
    ],
    deliverable: { title: '个性化、结构化的面试复盘', summary: '对话仍由人推动，观察者则从完整转录提供第二视角。', items: ['有状态的多轮面试', '跨轮观察记录', '通过 schema 校验的最终复盘'] },
    why: ['对话与评估职责分离。', '共享记忆让候选人背景保持可用。', '结构化复盘可以继续进入辅导流程。'],
    boundary: '这是交互式模拟器，不是经过验证的招聘评估。候选人材料与转录可能包含敏感信息，生产环境必须明确保留和访问政策。',
    related: ['meeting-summarizer', 'translation-backtranslation', 'narrative-puzzle-hint-arbitration'],
  },
  'rare-disease-information-triage': {
    audience: '评估健康信息系统安全模式的团队',
    outcome: '把五类证据保持隔离，暴露冲突与夸大论断，并产出受安全约束的信息分诊结果。',
    problem: '患者自述、科普材料、指南、遗传证据和商业论断的可靠性完全不同。过早混合可能把微弱重叠变成虚假确定性，甚至导向商业推荐。',
    input: { title: '五类明确标记的 Mock 证据', detail: '虚构的患者症状、公益科普、指南类内容、基因—表型证据，以及网络或商业论断。' },
    stages: [
      { title: '隔离审查每类证据', summary: '五位审查者独立工作，让来源与质量始终可见。', parallel: true, agents: [
        { name: '患者自述审查员', task: '整理自述症状，但不做诊断。' },
        { name: '科普审查员', task: '核对公益科普论断。' },
        { name: '指南审查员', task: '保留官方类指南中的宽泛鉴别范围。' },
        { name: '遗传证据审查员', task: '记录微弱或不确定的基因—表型证据。' },
        { name: '网络论断审查员', task: '标记确定性夸大和付费检测推广。' },
      ] },
      { title: '在安全约束下仲裁', summary: '下游仲裁者接收结构化审查，而不是混合后的原始来源。', agents: [
        { name: '安全仲裁者', task: '检测冲突，并禁止诊断、治疗、剂量或商业推荐。' },
      ] },
    ],
    deliverable: { title: '受安全边界约束的结构化证据分诊', summary: '结果传达不确定性与来源分歧，不会把材料转换成医疗建议。', items: ['五份可追溯的证据审查', '冲突与夸大论断标记', '通过 schema 校验的安全结果'] },
    why: ['来源隔离减少证据洗白。', '并行审查保证流程效率。', '独立仲裁者统一应用跨来源与安全规则。'],
    boundary: '全部 fixtures 都是 Mock，不含真实患者数据。该示例不得用于诊断、治疗、剂量或商业推荐。',
    related: ['narrative-puzzle-hint-arbitration', 'paper-replication-triage', 'competitive-monitoring'],
  },
  'translation-backtranslation': {
    audience: '需要确认翻译是否保留重要含义的本地化团队',
    outcome: '由一个模型家族翻译、另一个模型家族回译，再以结构化报告标记可能的语义漂移。',
    problem: '流畅的译文仍可能丢失条件、数字或语气。让同一个模型评价自己的工作，也很难获得足够独立的检查。',
    input: { title: '源文本与目标语言', detail: '示例使用两个不同 provider 家族的凭据，把翻译与回译分开。' },
    stages: [
      { title: '翻译源文本', summary: '第一个模型生成目标语言版本。', agents: [
        { name: '翻译员', task: '把英文原文翻译成指定语言。' },
      ] },
      { title: '独立回译', summary: '不同 provider 家族只看到译文，不读取原回答的推理。', agents: [
        { name: '回译员', task: '根据译文重新生成英文版本。' },
      ] },
      { title: '比较含义', summary: '第三位专职 Agent 比较原文和回译。', agents: [
        { name: '质量审查员', task: '标记语义漂移，并返回 schema 校验后的发现。' },
      ] },
    ],
    deliverable: { title: '结构化翻译质量检查', summary: '结果指出含义可能发生变化的位置，而不是只评价表面流畅度。', items: ['目标语言译文', '独立回译结果', '结构化语义漂移发现'] },
    why: ['生成与检查职责分离。', '跨 provider 审查增加有价值的独立性。', '结构化发现更容易交给人工继续复核。'],
    boundary: '回译只是一种信号，不是翻译质量的证明。高风险或文化敏感内容仍需合格的人工审校。',
    related: ['meeting-summarizer', 'personalized-interview-simulator', 'competitive-monitoring'],
  },
};

export function getExampleStory(locale: Locale, slug: string): ExampleStory | null {
  const stories = locale === 'zh' ? zh : en;
  return stories[slug as keyof typeof en] ?? null;
}

export function getExampleStoryUi(locale: Locale): ExampleStoryUi {
  return ui[locale];
}
