---
title: "Investigate an Incident in Parallel Without Blending the Evidence"
description: "Logs, deployments, and blast radius are independent evidence streams. A runTasks() DAG starts them together, keeps each result unmerged in taskResults, and hands the analyst validated structured payloads instead of prose."
pubDate: 2026-07-31
tags: ["sre", "incident-response", "typescript"]
contentType: application
useCases: ["incident postmortems", "root-cause analysis"]
industries: ["software operations"]
evidence:
  kind: runnable-demo
  note: "The repository example runs on a bundled incident scenario. Orchestration and evidence handoffs are demonstrated; wiring it to a live observability stack is left to the reader. The scheduling and handoff behavior described here is documented runtime API."
related:
  solutions: ["parallel-llm-calls"]
  examples: ["incident-postmortem-dag", "trace-observability"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph", "inngest-agentkit"]
featured: false
readingMinutes: 7
---

Incident reviews usually begin with a queue. One person reads logs. Then somebody checks the deployment history. Then the team estimates customer impact. Only after all of that does anyone try to explain what happened.

Most of that waiting buys nothing. Logs, deployments, and blast radius are separate evidence streams and can be investigated at the same time. What must stay serial is the judgment — and that is a scheduling property, not a matter of discipline.

## The graph

The runnable [Incident Postmortem DAG](/examples/incident-postmortem-dag/) uses five tasks: three investigators, an analyst, and a writer.

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Logs',
    description: 'Extract failure patterns from the incident logs.',
    assignee: 'log-investigator',
  },
  {
    title: 'Deployments',
    description: 'Correlate the window with recent changes.',
    assignee: 'deployment-investigator',
  },
  {
    title: 'Impact',
    description: 'Analyze the blast radius.',
    assignee: 'impact-investigator',
  },
  {
    title: 'Root cause',
    description: 'Form a supported hypothesis from all three investigations.',
    assignee: 'analyst',
    dependsOn: ['Logs', 'Deployments', 'Impact'],
    dependencyPayload: 'structured',
  },
  {
    title: 'Postmortem',
    description: 'Turn the evidence and hypothesis into the final document.',
    assignee: 'writer',
    dependsOn: ['Root cause'],
  },
])
```

The first three declare no dependencies, so they start together. The analyst cannot start until all three finish. The writer cannot start until the analysis lands.

The executor is event-driven: a downstream task starts as soon as *its* dependencies are satisfied, not when a batch completes. `TaskQueue` emits `task:ready`, the scheduler assigns that one task, a dispatch gate checks cancellation, budget state, approval state, and pool capacity, and completion immediately unblocks dependents. A branch that finishes early does not wait on an unrelated one.

## Keep the evidence attributable

A postmortem is an evidence chain, not a polished explanation. The value of splitting investigators disappears if their findings reach the analyst as one blended paragraph.

`dependencyPayload: 'structured'` is what prevents that. By default a direct dependency injects the upstream task's raw `output` — narrative text the analyst has to re-read and attribute by hand. Set `'structured'` and only canonical JSON derived from that dependency's successful `AgentRunResult.structured` is injected; the prose is excluded. `'both'` injects labeled raw and structured sections when the narrative is also worth carrying.

The analyst therefore does not infer which source a statement came from. It receives three validated records, each traceable to the investigator that produced it.

That makes disagreement useful. Logs may suggest one failure mode while deployment timing points elsewhere. Reconciling that tension is the analyst's job — possible only if the tension survived the handoff.

## Every branch stays readable afterward

When one agent runs multiple tasks, `agentResults` merges them. For a postmortem that is the wrong index: you want the log investigator's finding as its own record, not folded in with everything else that agent did.

`taskResults` keeps the unmerged result for every task, keyed by stable task ID:

```ts
const result = await orchestrator.runTasks(team, tasks)

const logTask = result.tasks?.find(task => task.title === 'Logs')
const logFindings = logTask
  ? result.taskResults?.get(logTask.id)?.structured
  : undefined
```

Both indexes reference the same executions, and exposing `taskResults` does not count token usage twice. For an incident review this is the difference between "the model said X" and "the log investigator, in task 1, reported X". The second one survives a disagreement three weeks later.

## Route the expensive model to the judgment

Three investigators reading bundled evidence and one analyst forming a hypothesis are not equally hard calls. Model Routing prices them separately:

```ts
const modelRouting: ModelRoutingPolicy = {
  rules: [
    { match: { agent: 'analyst' }, route: { model: 'claude-opus-4-7' } },
    { match: { phase: 'worker' }, route: { model: 'claude-haiku-4-5' } },
  ],
}

await orchestrator.runTasks(team, tasks, { modelRouting })
```

Rules evaluate in array order and the first match wins, so the specific rule goes first. A call matching no rule keeps the model it would have used anyway. Besides `agent` and `phase`, a rule can match on `taskRole`, `taskPriority`, `leaf`, and `hasDependencies` — the last three only ever match worker and delegated calls.

This is Model Routing, choosing the model for a call. Execution Routing is the separate decision of whether a goal runs as a single agent or a team at all.

## The deliverable, and its boundary

The example produces three investigation results, a root-cause hypothesis derived from them, a final postmortem artifact, and run-level timing and usage.

It queries no live log service, deployment platform, status page, or ticket system. The scenario ships with the recipe. That keeps the orchestration inspectable and sets the evidence boundary honestly.

Connecting real systems is application work, and the runtime gives you places to put those decisions:

- Read-only integrations stay read-only by construction. Built-in tools are default-deny; an agent declaring neither `tools` nor `toolPreset` resolves to zero of them.
- A tool that pages an on-call engineer or closes an incident is `consequential: true`, and `onToolCall` gates each invocation after input validation and before `execute`.
- `onPlanReady` and `onTaskDispatch` sit at the other two boundaries: approve the shape of an investigation, or one unit of it, before it reaches production.
- Trace payloads redact detected secrets on a best-effort basis. Incident logs are exactly where that qualifier earns its keep, so field-level redaction at the source stays your job, not a runtime guarantee.

What the runtime will not do is guess. Consequential classification reads tool grants only — never the goal, the prompt, tool arguments, or model output. An incident described in alarming language is not flagged when it granted only benign tools.

## Why an explicit graph and not a coordinator

This workflow does not need its topology invented. The five roles and their dependencies are known before the incident begins, which makes `runTasks()` the better default: the same evidence branches run every time, dependencies are reviewable in code, a missing branch blocks synthesis instead of quietly vanishing, and independent branches still run concurrently.

A coordinator becomes interesting when the investigation plan itself varies sharply by incident type. Even then `onPlanReady` exists so the proposed plan can be read before it is granted access to anything.

## Run the recipe

From the framework repository, with `ANTHROPIC_API_KEY` set:

```bash
npx tsx packages/core/examples/cookbook/incident-postmortem-dag.ts
```

Check the task records and the final artifact against the bundled scenario. Then replace one evidence branch at a time with a read-only integration to your own systems: fixture, read-only source, reviewed output, and only then broader authority.
