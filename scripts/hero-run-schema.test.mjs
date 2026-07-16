import assert from 'node:assert/strict'
import test from 'node:test'
import { HERO_SCENARIO, validateHeroRun } from './hero-run-schema.mjs'

const ids = {
  triage: '11111111-1111-4111-8111-111111111111',
  order: '22222222-2222-4222-8222-222222222222',
  policy: '33333333-3333-4333-8333-333333333333',
  response: '44444444-4444-4444-8444-444444444444',
}

function validRun() {
  return {
    capturedAt: '2026-07-17T00:00:00.000Z',
    runId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    scenario: HERO_SCENARIO,
    locale: 'en',
    goal: 'Resolve shipping ticket #12345.',
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    success: true,
    wallMs: 1000,
    totalTokenUsage: { input_tokens: 100, output_tokens: 50 },
    tasks: [
      { id: ids.triage, title: 'Classify ticket', assignee: 'triage-specialist', status: 'completed', dependsOn: [], durationMs: 100 },
      { id: ids.order, title: 'Investigate shipment', assignee: 'order-specialist', status: 'completed', dependsOn: [], durationMs: 200 },
      { id: ids.policy, title: 'Apply policy', assignee: 'policy-specialist', status: 'completed', dependsOn: [], durationMs: 150 },
      { id: ids.response, title: 'Draft reply', assignee: 'response-specialist', status: 'completed', dependsOn: [ids.triage, ids.order, ids.policy], durationMs: 250 },
    ],
  }
}

test('accepts a real-shaped adaptive shipping DAG', () => {
  assert.deepEqual(validateHeroRun(validRun(), 'en'), [])
})

test('rejects selecting the unrelated billing specialist', () => {
  const run = validRun()
  run.tasks.push({
    id: '55555555-5555-4555-8555-555555555555',
    title: 'Investigate billing',
    assignee: 'billing-specialist',
    status: 'completed',
    dependsOn: [],
    durationMs: 120,
  })
  assert.ok(validateHeroRun(run, 'en').includes('shipping capture must not select billing-specialist'))
})

test('rejects a cyclic task graph', () => {
  const run = validRun()
  run.tasks[0].dependsOn = [ids.response]
  assert.ok(validateHeroRun(run, 'en').some((error) => error.includes('task graph contains a cycle')))
})
