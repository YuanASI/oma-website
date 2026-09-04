import assert from 'node:assert/strict'
import test from 'node:test'
import { HERO_SCENARIO, validateHeroRun } from './hero-run-schema.mjs'

const ids = {
  attack: '11111111-1111-4111-8111-111111111111',
  data: '22222222-2222-4222-8222-222222222222',
  supply: '33333333-3333-4333-8333-333333333333',
  synth: '44444444-4444-4444-8444-444444444444',
}

function validRun() {
  return {
    capturedAt: '2026-07-17T00:00:00.000Z',
    runId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    scenario: HERO_SCENARIO,
    locale: 'en',
    goal: 'Review this service for security issues: GET /admin/users is injectable.',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    success: true,
    wallMs: 1000,
    totalTokenUsage: { input_tokens: 100, output_tokens: 50 },
    tasks: [
      { id: ids.attack, title: 'Attack surface review', assignee: 'attack-surface-reviewer', status: 'completed', dependsOn: [], durationMs: 100 },
      { id: ids.data, title: 'Data security review', assignee: 'data-security-reviewer', status: 'completed', dependsOn: [], durationMs: 200 },
      { id: ids.supply, title: 'Supply chain review', assignee: 'supply-chain-reviewer', status: 'completed', dependsOn: [], durationMs: 150 },
      { id: ids.synth, title: 'Synthesize security report', assignee: 'synthesizer', status: 'completed', dependsOn: [ids.attack, ids.data, ids.supply], durationMs: 250 },
    ],
  }
}

test('accepts a real-shaped adaptive security DAG', () => {
  assert.deepEqual(validateHeroRun(validRun(), 'en'), [])
})

// The planner is no longer told the topology, so a capture is not required to
// use every agent or to fan in exactly three branches. What it still has to show
// is the shape the hero draws: a parallel level, and a task joining it back.
test('accepts a smaller decomposition the planner chose on its own', () => {
  const run = validRun()
  run.tasks = run.tasks.filter((task) => task.id !== ids.supply)
  run.tasks[2].dependsOn = [ids.attack, ids.data]
  assert.deepEqual(validateHeroRun(run, 'en'), [])
})

test('rejects a serial chain with no parallel level', () => {
  const run = validRun()
  run.tasks[1].dependsOn = [ids.attack]
  run.tasks[2].dependsOn = [ids.data]
  run.tasks[3].dependsOn = [ids.supply]
  assert.ok(validateHeroRun(run, 'en').includes('capture must have at least one level of parallel tasks'))
})

test('rejects a fan-out that never joins back', () => {
  const run = validRun()
  run.tasks[3].dependsOn = [ids.attack]
  assert.ok(validateHeroRun(run, 'en').includes('capture must end in a task that joins at least two earlier tasks'))
})

test('rejects an assignee that is not on the team', () => {
  const run = validRun()
  run.tasks[0].assignee = 'compliance-reviewer'
  assert.ok(validateHeroRun(run, 'en').includes('task 1 must be assigned to a real team agent'))
})

test('rejects a cyclic task graph', () => {
  const run = validRun()
  run.tasks[0].dependsOn = [ids.synth]
  assert.ok(validateHeroRun(run, 'en').some((error) => error.includes('task graph contains a cycle')))
})
