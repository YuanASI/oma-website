// Reproduce the hero's real task DAG (src/data/hero-run.json).
//
// The landing hero renders a REAL OMA run, not a hand-built mockup
// (PRD §4.1 hard constraint ①: no synthetic DAGs). This script is how that
// data is produced — run it to refresh src/data/hero-run.json after an OMA
// release or a goal change.
//
// Usage (outside this repo's dependency tree, so the site build stays lean):
//   mkdir -p /tmp/oma-hero-run && cd /tmp/oma-hero-run
//   npm init -y && npm pkg set type=module && npm i @open-multi-agent/core
//   DEEPSEEK_API_KEY=sk-... node /path/to/scripts/capture-hero-dag.mjs
//   cp hero-run.json /path/to/oma-website/src/data/hero-run.json
//
// Last capture: 2026-06-19, @open-multi-agent/core@1.7.0, deepseek-v4-flash,
//   runId f7c2a363-94ef-4563-9ed2-fbe25bb775bb (see hero-run.json).
// Agents run tool-less with short turns: the goal → DAG decomposition is real,
// the run is cheap. The API key is read from env only — never hard-code it.
import { OpenMultiAgent, renderTeamRunDashboard } from '@open-multi-agent/core'
import { writeFileSync } from 'node:fs'

const MODEL = process.env.OMA_MODEL ?? 'deepseek-v4-flash'

// Locale of the captured run. `OMA_LANG=zh` captures with a Chinese goal + agent
// prompts so the coordinator's decomposition — and the task titles it emits —
// come out in Chinese. The hero stays a REAL run, just captured in the page's
// language; the JSON is never hand-translated (PRD §4.1 ①). The site reads
// hero-run.json (en) and hero-run.<lang>.json (every other locale).
const LANG = process.env.OMA_LANG ?? 'en'
const LOCALES = {
  en: {
    goal: 'Build a REST API for a todo list: design the data model and routes, implement the CRUD endpoints, generate a test suite, and review it for security.',
    architect: 'You are a software architect. Design the data model and API routes. Answer concisely.',
    developer: 'You are a TypeScript/Node.js developer. Implement endpoints and a test suite. Answer concisely.',
    reviewer: 'You are a code reviewer. Review for correctness and security. Answer concisely.',
  },
  zh: {
    // Numbered list: the only language-agnostic COMPLEXITY_PATTERN the orchestrator
    // has is /^\s*\d+[\.\)]/m — a short Chinese prose goal matches none of the
    // (English) patterns and short-circuits to one agent. This phrasing mirrors the
    // English goal's four deliverables and decomposes for real.
    goal: '为待办事项列表构建一个 REST API。请完成：\n1. 设计数据模型与 API 路由\n2. 实现 CRUD 接口\n3. 为这些接口生成测试套件\n4. 对实现进行安全审查',
    architect: '你是一名软件架构师。设计数据模型与 API 路由。回答简洁。',
    developer: '你是一名 TypeScript/Node.js 开发者。实现接口并编写测试套件。回答简洁。',
    reviewer: '你是一名代码评审员。审查正确性与安全性。回答简洁。',
  },
}
const cfg = LOCALES[LANG] ?? LOCALES.en
const OUT = LANG === 'en' ? 'hero-run.json' : `hero-run.${LANG}.json`
const events = []
let runId = null

const oma = new OpenMultiAgent({
  defaultProvider: 'deepseek',
  defaultModel: MODEL,
  maxConcurrency: 3,
  onProgress: (e) => {
    events.push({ t: Date.now(), type: e.type, agent: e.agent ?? null, task: e.task ?? null })
  },
  onTrace: (s) => {
    if (!runId && s.runId) runId = s.runId
  },
})

const team = oma.createTeam('api-team', {
  name: 'api-team',
  agents: [
    { name: 'architect', model: MODEL, systemPrompt: cfg.architect, tools: [], maxTurns: 2 },
    { name: 'developer', model: MODEL, systemPrompt: cfg.developer, tools: [], maxTurns: 2 },
    { name: 'reviewer', model: MODEL, systemPrompt: cfg.reviewer, tools: [], maxTurns: 2 },
  ],
})

// Goal must carry a multi-deliverable signal, or the coordinator short-circuits
// to a single agent (see isSimpleGoal in the orchestrator). If the zh goal ever
// short-circuits (the heuristic may key on English cues), reword it — never
// hand-build the DAG. Override entirely with OMA_GOAL.
const goal = process.env.OMA_GOAL ?? cfg.goal
const t0 = Date.now()
const result = await oma.runTeam(team, goal)
const wallMs = Date.now() - t0

const dag = {
  capturedAt: new Date().toISOString(),
  runId,
  goal: result.goal ?? goal,
  provider: 'deepseek',
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

writeFileSync(OUT, JSON.stringify(dag, null, 2) + '\n')
try { writeFileSync('hero-run-dashboard.html', renderTeamRunDashboard(result)) } catch {}
console.log(`lang=${LANG} success=${result.success} runId=${runId} tasks=${dag.tasks.length} wallMs=${wallMs}`)
console.log(`wrote ${OUT}` + (dag.tasks.length ? '' : ' (no tasks — goal short-circuited?)'))
