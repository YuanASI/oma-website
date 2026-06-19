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
    { name: 'architect', model: MODEL, systemPrompt: 'You are a software architect. Design the data model and API routes. Answer concisely.', tools: [], maxTurns: 2 },
    { name: 'developer', model: MODEL, systemPrompt: 'You are a TypeScript/Node.js developer. Implement endpoints and a test suite. Answer concisely.', tools: [], maxTurns: 2 },
    { name: 'reviewer', model: MODEL, systemPrompt: 'You are a code reviewer. Review for correctness and security. Answer concisely.', tools: [], maxTurns: 2 },
  ],
})

// Goal must carry a multi-deliverable signal, or the coordinator short-circuits
// to a single agent (see isSimpleGoal in the orchestrator).
const goal = 'Build a REST API for a todo list: design the data model and routes, implement the CRUD endpoints, generate a test suite, and review it for security.'
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

writeFileSync('hero-run.json', JSON.stringify(dag, null, 2) + '\n')
try { writeFileSync('hero-run-dashboard.html', renderTeamRunDashboard(result)) } catch {}
console.log(`success=${result.success} runId=${runId} tasks=${dag.tasks.length} wallMs=${wallMs}`)
console.log('wrote hero-run.json' + (dag.tasks.length ? '' : ' (no tasks — goal short-circuited?)'))
