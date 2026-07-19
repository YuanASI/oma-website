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

test('rejects a synthesizer that skips a review', () => {
  const run = validRun()
  run.tasks[3].dependsOn = [ids.attack, ids.data]
  assert.ok(validateHeroRun(run, 'en').includes('synthesizer must depend directly on all three reviews'))
})

test('rejects a cyclic task graph', () => {
  const run = validRun()
  run.tasks[0].dependsOn = [ids.synth]
  assert.ok(validateHeroRun(run, 'en').some((error) => error.includes('task graph contains a cycle')))
})
