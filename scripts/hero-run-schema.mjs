export const HERO_SCENARIO = 'security-analysis'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// The coordinator is no longer told how many tasks to create, who gets them, or
// how they depend on each other (see scripts/capture-hero-dag.mjs), so this file
// no longer asserts one particular topology — that would only re-prescribe the
// DAG at validation time. It still refuses any assignee that is not on the team
// roster below, which is what keeps a capture provably a real run of THIS team.
const TEAM_AGENTS = new Set([
  'attack-surface-reviewer',
  'data-security-reviewer',
  'supply-chain-reviewer',
  'synthesizer',
])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function validateHeroRun(run, locale) {
  const errors = []
  const add = (condition, message) => {
    if (!condition) errors.push(message)
  }

  add(isRecord(run), 'capture must be a JSON object')
  if (!isRecord(run)) return errors

  add(run.scenario === HERO_SCENARIO, `scenario must be ${HERO_SCENARIO}`)
  add(run.locale === locale, `locale must be ${locale}`)
  add(typeof run.capturedAt === 'string' && Number.isFinite(Date.parse(run.capturedAt)), 'capturedAt must be an ISO timestamp')
  add(typeof run.runId === 'string' && UUID_RE.test(run.runId), 'runId must be a UUID emitted by the real run')
  add(typeof run.goal === 'string' && run.goal.includes('/admin/users'), 'goal must contain the vulnerable-service fixture (/admin/users)')
  add(locale !== 'zh' || /[㐀-鿿]/u.test(run.goal), 'the zh capture goal must be Chinese')
  add(typeof run.provider === 'string' && run.provider.length > 0, 'provider must be recorded')
  add(typeof run.model === 'string' && run.model.length > 0, 'model must be recorded')
  add(run.success === true, 'run must finish successfully')
  add(Number.isFinite(run.wallMs) && run.wallMs > 0, 'wallMs must be positive')
  add(
    isRecord(run.totalTokenUsage)
      && Number.isFinite(run.totalTokenUsage.input_tokens)
      && run.totalTokenUsage.input_tokens > 0
      && Number.isFinite(run.totalTokenUsage.output_tokens)
      && run.totalTokenUsage.output_tokens > 0,
    'real input and output token usage must be positive',
  )
  add(Array.isArray(run.tasks) && run.tasks.length >= 3 && run.tasks.length <= 6, 'capture must contain 3-6 tasks')

  if (!Array.isArray(run.tasks)) return errors

  const ids = new Set()
  for (const [index, task] of run.tasks.entries()) {
    add(isRecord(task), `task ${index + 1} must be an object`)
    if (!isRecord(task)) continue
    add(typeof task.id === 'string' && task.id.length > 0, `task ${index + 1} must have an id`)
    add(!ids.has(task.id), `task id ${task.id} must be unique`)
    ids.add(task.id)
    add(typeof task.title === 'string' && task.title.trim().length > 0, `task ${index + 1} must have a title`)
    add(typeof task.assignee === 'string' && TEAM_AGENTS.has(task.assignee), `task ${index + 1} must be assigned to a real team agent`)
    add(task.status === 'completed', `task ${index + 1} must be completed`)
    add(Array.isArray(task.dependsOn), `task ${index + 1} must have a dependsOn array`)
    add(Number.isFinite(task.durationMs) && task.durationMs > 0, `task ${index + 1} must have a real duration`)
  }

  for (const task of run.tasks) {
    if (!isRecord(task) || !Array.isArray(task.dependsOn)) continue
    for (const dependency of task.dependsOn) {
      add(ids.has(dependency), `task ${task.id} references unknown dependency ${dependency}`)
      add(dependency !== task.id, `task ${task.id} cannot depend on itself`)
    }
  }

  const assigned = new Set(run.tasks.map((task) => task?.assignee))
  add(assigned.size >= 2, 'capture must spread the work over at least two agents')

  // The zh hero renders the planner's own task titles, so they must come out in
  // Chinese. The English-heavy code fixture can steer the model to English titles
  // even from a Chinese goal; this makes shipping those a loud failure rather than
  // a silent one. Re-run the capture — never translate the JSON by hand.
  add(
    locale !== 'zh' || run.tasks.every((task) => /[㐀-鿿]/u.test(task?.title ?? '')),
    'the zh capture task titles must be Chinese',
  )

  const byId = new Map(run.tasks.filter(isRecord).map((task) => [task.id, task]))
  const done = new Set()
  const visiting = new Set()
  const visit = (id) => {
    if (done.has(id)) return
    if (visiting.has(id)) {
      errors.push(`task graph contains a cycle at ${id}`)
      return
    }
    visiting.add(id)
    const task = byId.get(id)
    for (const dependency of task?.dependsOn ?? []) {
      if (byId.has(dependency)) visit(dependency)
    }
    visiting.delete(id)
    done.add(id)
  }
  for (const id of byId.keys()) visit(id)

  // Shape checks, not topology: the hero draws dependency levels and labels a
  // level with more than one task "parallel". A capture is only worth shipping if
  // the planner actually found concurrency and then joined it back together —
  // which agent it picked for which branch, and how many branches there are, is
  // the planner's call.
  const hasCycle = errors.some((message) => message.startsWith('task graph contains a cycle'))
  if (!hasCycle) {
    const depthCache = new Map()
    const depthOf = (id) => {
      if (depthCache.has(id)) return depthCache.get(id)
      depthCache.set(id, 0)
      const dependencies = (byId.get(id)?.dependsOn ?? []).filter((dependency) => byId.has(dependency))
      const depth = dependencies.length === 0 ? 0 : 1 + Math.max(...dependencies.map(depthOf))
      depthCache.set(id, depth)
      return depth
    }
    const widths = new Map()
    for (const id of byId.keys()) {
      const depth = depthOf(id)
      widths.set(depth, (widths.get(depth) ?? 0) + 1)
    }
    add([...widths.values()].some((width) => width >= 2), 'capture must have at least one level of parallel tasks')
    add(
      run.tasks.some((task) => Array.isArray(task?.dependsOn) && task.dependsOn.filter((id) => byId.has(id)).length >= 2),
      'capture must end in a task that joins at least two earlier tasks',
    )
  }

  return errors
}

export function assertValidHeroRun(run, locale) {
  const errors = validateHeroRun(run, locale)
  if (errors.length > 0) {
    throw new Error(`Invalid ${locale} hero capture:\n- ${errors.join('\n- ')}`)
  }
}
