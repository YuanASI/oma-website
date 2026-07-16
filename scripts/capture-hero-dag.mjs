// Reproduce the hero's real adaptive customer-support task DAG.
//
// The landing hero renders a REAL OMA run, not a hand-built mockup
// (PRD §4.1 hard constraint ①: no synthetic DAGs). This script is how that
// data is produced — run it to refresh src/data/hero-run.json after an OMA
// release or a goal change. The generated JSON is validated before it is
// written; never hand-edit a capture to satisfy the validator.
//
// Usage (outside this repo's dependency tree, so the site build stays lean):
//   mkdir -p /tmp/oma-hero-run && cd /tmp/oma-hero-run
//   npm init -y && npm pkg set type=module && npm i @open-multi-agent/core
//   DEEPSEEK_API_KEY=sk-... OMA_LANG=en node /path/to/scripts/capture-hero-dag.mjs
//   DEEPSEEK_API_KEY=sk-... OMA_LANG=zh node /path/to/scripts/capture-hero-dag.mjs
//   cp hero-run*.json /path/to/oma-website/src/data/
//
// OMA_PROVIDER supports deepseek (default), openai, and copilot. OMA_MODEL and
// OMA_BASE_URL may override the defaults. Credentials are read from the normal
// provider environment variables only — never hard-code them.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { HERO_SCENARIO, assertValidHeroRun } from './hero-run-schema.mjs'

// Resolve the deliberately out-of-tree runtime from the caller's cwd. ESM
// otherwise searches from this script's directory and cannot see the package
// installed in /tmp/oma-hero-run as documented above.
const requireFromCaptureDir = createRequire(resolve(process.cwd(), 'package.json'))
const corePackagePath = requireFromCaptureDir.resolve('@open-multi-agent/core/package.json')
const corePackage = JSON.parse(readFileSync(corePackagePath, 'utf8'))
if (typeof corePackage.main !== 'string') {
  throw new Error('@open-multi-agent/core package.json does not declare a main entry.')
}
const coreEntry = resolve(dirname(corePackagePath), corePackage.main)
const { OpenMultiAgent, renderTeamRunDashboard } = await import(pathToFileURL(coreEntry).href)

const PROVIDERS = new Set(['deepseek', 'openai', 'copilot'])
const PROVIDER = process.env.OMA_PROVIDER?.trim().toLowerCase() || 'deepseek'
if (!PROVIDERS.has(PROVIDER)) {
  throw new Error('OMA_PROVIDER must be deepseek, openai, or copilot.')
}
const DEFAULT_MODELS = {
  deepseek: 'deepseek-v4-flash',
  openai: 'gpt-5.4-mini',
  copilot: 'gpt-5.4-mini',
}
const MODEL = process.env.OMA_MODEL ?? DEFAULT_MODELS[PROVIDER]
const credentialPresent = {
  deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
  openai: Boolean(process.env.OPENAI_API_KEY),
  copilot: Boolean(process.env.GITHUB_COPILOT_TOKEN || process.env.GITHUB_TOKEN),
}
if (!credentialPresent[PROVIDER]) {
  const expected = PROVIDER === 'deepseek'
    ? 'DEEPSEEK_API_KEY'
    : PROVIDER === 'openai'
      ? 'OPENAI_API_KEY'
      : 'GITHUB_COPILOT_TOKEN or GITHUB_TOKEN'
  throw new Error(`${expected} must be set for OMA_PROVIDER=${PROVIDER}. The value is never logged.`)
}

// Locale of the captured run. `OMA_LANG=zh` captures with a Chinese goal + agent
// prompts so the coordinator's decomposition — and the task titles it emits —
// come out in Chinese. The hero stays a REAL run, just captured in the page's
// language; the JSON is never hand-translated (PRD §4.1 ①). The site reads
// hero-run.json (en) and hero-run.<lang>.json (every other locale).
const LANG = process.env.OMA_LANG ?? 'en'
const LOCALES = {
  en: {
    goal: `Resolve this escalated customer-support ticket.

Ticket #12345: The customer ordered two weeks ago. Carrier tracking has not moved for six days, and the item is needed for an event this weekend.

Available evidence: the order was paid, packed, and handed to the carrier 13 days ago; the last scan was "in transit" six days ago; no replacement or refund has been issued; the customer has no prior delivery claims.

Applicable policy: after five days without carrier movement, support may offer a replacement or refund after confirming identity and delivery address. Never promise an unconfirmed delivery date.

Complete four coordinated deliverables:
1. Classify the ticket and urgency.
2. Investigate only the relevant operational domain.
3. Apply the supplied policy and identify required checks.
4. Draft a grounded customer reply with internal handoff notes.`,
    triage: 'Classify the supplied support ticket and explain its urgency. Use only facts in the task. Answer concisely.',
    order: 'Investigate shipping and order evidence. Identify supported findings, missing checks, and the next operational action. Answer concisely.',
    billing: 'Investigate payment and subscription evidence. Do not handle shipping-only tickets. Answer concisely.',
    policy: 'Apply only the supplied support policy. Separate allowed actions, prohibited promises, and required checks. Answer concisely.',
    response: 'Draft the final customer reply from the completed analyses. Be empathetic, make no unsupported promises, and include concise internal handoff notes.',
    coordinator: 'Create exactly four tasks. Assign one independent root task each to triage-specialist, order-specialist, and policy-specialist so those three run in parallel. Do not assign billing-specialist for this shipping ticket. Assign the final task to response-specialist and make it depend directly on all three root task IDs. Copy all evidence and policy text needed by each specialist into its task description.',
  },
  zh: {
    goal: `处理这张升级客服工单。

工单 #12345：客户两周前下单，承运商物流六天没有更新，商品要在本周末的活动中使用。

现有证据：订单已付款、打包，并在 13 天前交给承运商；最后一次扫描是六天前的“运输中”；尚未补发或退款；客户此前没有配送索赔记录。

适用政策：物流连续五天未更新时，客服在确认客户身份与收货地址后，可以提供补发或退款。不得承诺承运商尚未确认的送达日期。

请协作完成四项交付：
1. 判断工单类别与紧急程度。
2. 只调查相关的业务领域。
3. 应用给定政策并列出必要核验。
4. 起草有事实依据的客户回复与内部交接备注。`,
    triage: '判断客服工单的类别与紧急程度，只使用任务内给出的事实。回答简洁。',
    order: '调查物流与订单证据，列出已有结论、缺失核验和下一步操作。回答简洁。',
    billing: '调查支付与订阅证据，不处理纯物流工单。回答简洁。',
    policy: '只应用给出的客服政策，区分允许的动作、禁止的承诺与必要核验。回答简洁。',
    response: '根据已完成的分析起草最终客户回复。保持同理心，不作无依据承诺，并附简洁的内部交接备注。',
    coordinator: '只创建四个任务。分别把三个互不依赖的根任务交给 triage-specialist、order-specialist 和 policy-specialist，让它们并行执行。这是物流工单，不得分配 billing-specialist。最后一个任务交给 response-specialist，并让它直接依赖前三个根任务的 ID。把每位专家所需的证据和政策原文复制进对应任务描述。',
  },
}
if (!(LANG in LOCALES)) throw new Error('OMA_LANG must be en or zh.')
const cfg = LOCALES[LANG] ?? LOCALES.en
const OUT = LANG === 'en' ? 'hero-run.json' : `hero-run.${LANG}.json`
const events = []
let runId = null

const oma = new OpenMultiAgent({
  defaultProvider: PROVIDER,
  defaultModel: MODEL,
  defaultBaseURL: process.env.OMA_BASE_URL,
  maxConcurrency: 3,
  onProgress: (e) => {
    events.push({ t: Date.now(), type: e.type, agent: e.agent ?? null, task: e.task ?? null })
  },
  onTrace: (s) => {
    if (!runId && s.runId) runId = s.runId
  },
})

const team = oma.createTeam('adaptive-support-team', {
  name: 'adaptive-support-team',
  agents: [
    { name: 'triage-specialist', model: MODEL, systemPrompt: cfg.triage, tools: [], maxTurns: 2 },
    { name: 'order-specialist', model: MODEL, systemPrompt: cfg.order, tools: [], maxTurns: 2 },
    { name: 'billing-specialist', model: MODEL, systemPrompt: cfg.billing, tools: [], maxTurns: 2 },
    { name: 'policy-specialist', model: MODEL, systemPrompt: cfg.policy, tools: [], maxTurns: 2 },
    { name: 'response-specialist', model: MODEL, systemPrompt: cfg.response, tools: [], maxTurns: 2 },
  ],
})

// Goal must carry a multi-deliverable signal, or the coordinator short-circuits
// to a single agent (see isSimpleGoal in the orchestrator). If the zh goal ever
// short-circuits (the heuristic may key on English cues), reword it — never
// hand-build the DAG. Override entirely with OMA_GOAL.
const goal = process.env.OMA_GOAL ?? cfg.goal
const t0 = Date.now()
const result = await oma.runTeam(team, goal, {
  coordinator: { instructions: cfg.coordinator },
})
const wallMs = Date.now() - t0

const dag = {
  capturedAt: new Date().toISOString(),
  runId,
  scenario: HERO_SCENARIO,
  locale: LANG,
  goal: result.goal ?? goal,
  provider: PROVIDER,
  model: MODEL,
  success: result.success,
  wallMs,
  totalTokenUsage: result.totalTokenUsage,
  tasks: (result.tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    assignee: t.assignee ?? null,
    status: t.status,
    dependsOn: [...(t.dependsOn ?? [])],
    durationMs: t.metrics?.durationMs ?? null,
  })),
}

assertValidHeroRun(dag, LANG)
const outputPath = resolve(process.env.OMA_CAPTURE_DIR ?? '.', OUT)
writeFileSync(outputPath, JSON.stringify(dag, null, 2) + '\n')
try {
  writeFileSync(resolve(process.env.OMA_DASHBOARD_DIR ?? '.', `hero-run-dashboard.${LANG}.html`), renderTeamRunDashboard(result))
} catch {}
console.log(`lang=${LANG} success=${result.success} runId=${runId} tasks=${dag.tasks.length} wallMs=${wallMs}`)
console.log(`wrote ${outputPath}`)
