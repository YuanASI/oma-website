export const HERO_SCENARIO = 'security-analysis'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REQUIRED_ASSIGNEES = [
  'attack-surface-reviewer',
  'data-security-reviewer',
  'supply-chain-reviewer',
  'synthesizer',
]

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
  add(Array.isArray(run.tasks) && run.tasks.length >= 4 && run.tasks.length <= 7, 'capture must contain 4-7 tasks')

  if (!Array.isArray(run.tasks)) return errors

  const ids = new Set()
  for (const [index, task] of run.tasks.entries()) {
    add(isRecord(task), `task ${index + 1} must be an object`)
    if (!isRecord(task)) continue
    add(typeof task.id === 'string' && task.id.length > 0, `task ${index + 1} must have an id`)
    add(!ids.has(task.id), `task id ${task.id} must be unique`)
    ids.add(task.id)
    add(typeof task.title === 'string' && task.title.trim().length > 0, `task ${index + 1} must have a title`)
    add(typeof task.assignee === 'string' && task.assignee.length > 0, `task ${index + 1} must have an assignee`)
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
  for (const assignee of REQUIRED_ASSIGNEES) {
    add(assigned.has(assignee), `capture must include ${assignee}`)
  }

  // The zh hero renders the coordinator's own task titles, so they must come out
  // in Chinese (the English-heavy code fixture can otherwise steer the model to
  // English titles even from a Chinese goal — the coordinator prompt asks for
  // Chinese, and this makes shipping English titles a loud failure, not a silent one).
  add(
    locale !== 'zh' || run.tasks.every((task) => /[㐀-鿿]/u.test(task?.title ?? '')),
    'the zh capture task titles must be Chinese',
  )

  const roots = run.tasks.filter((task) => Array.isArray(task?.dependsOn) && task.dependsOn.length === 0)
  add(roots.length >= 3, 'the three security reviews must run as parallel root tasks')

  const synthTasks = run.tasks.filter((task) => task?.assignee === 'synthesizer')
  add(synthTasks.length === 1, 'capture must contain exactly one synthesizer task')
  if (synthTasks.length === 1) {
    add(
      Array.isArray(synthTasks[0].dependsOn) && synthTasks[0].dependsOn.length >= 3,
      'synthesizer must depend directly on all three reviews',
    )
  }

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

  return errors
}

export function assertValidHeroRun(run, locale) {
  const errors = validateHeroRun(run, locale)
  if (errors.length > 0) {
    throw new Error(`Invalid ${locale} hero capture:\n- ${errors.join('\n- ')}`)
  }
}
