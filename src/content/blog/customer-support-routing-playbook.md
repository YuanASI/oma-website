---
title: "Route Support Tickets Between a Fixed Pipeline and a Live Agent Team"
description: "Keep the high-volume path on a typed classify → draft → QA graph, let escalations get a coordinator-built team, and put the refund behind a confirmation gate the runtime enforces per call."
pubDate: 2026-07-31
tags: ["customer-support", "typescript", "agents"]
contentType: application
useCases: ["ticket triage", "escalation handling"]
industries: ["customer support"]
evidence:
  kind: runnable-demo
  note: "Two runnable repository examples over synthetic tickets. Classification, drafting, and routing are what the demo covers; CRM writes, account actions, and production results sit outside it. The runtime controls shown here are documented API surface, exercised outside these two recipes."
related:
  solutions: ["goal-driven-orchestration", "parallel-llm-calls"]
  examples: ["express-customer-support", "adaptive-customer-support"]
  integrations: ["openai", "openai-compatible"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 8
---

A password reset and a disputed invoice arrive through the same support form. They should not run the same workflow.

The password reset is familiar: classify, draft, check the tone, send. The disputed invoice may need billing policy, account history, refund rules — and a person, before anything reaches the customer.

Open Multi-Agent ships a runnable example for each shape. Both use demonstration tickets and connect to no help desk. What they show is where the boundary falls, and which runtime controls hold it once real systems sit behind it.

## The high-volume path owns its graph

The [Express Customer Support example](/examples/express-customer-support/) puts three steps behind `POST /tickets`: a classifier returns category and urgency, a drafter writes the customer-facing reply, a QA reviewer checks tone and factual consistency.

Nothing there needs rediscovering per ticket. Classification precedes drafting, QA is last, and the application owns the topology. `runTasks()` executes the graph you wrote:

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Classify',
    description: 'Categorize the ticket and set urgency.',
    assignee: 'classifier',
  },
  {
    title: 'Draft',
    description: 'Write the customer-facing reply.',
    assignee: 'drafter',
    dependsOn: ['Classify'],
  },
  {
    title: 'QA',
    description: 'Check tone, empathy, and factual consistency.',
    assignee: 'reviewer',
    dependsOn: ['Draft'],
    dependencyPayload: 'structured',
  },
])
```

`dependencyPayload: 'structured'` hands QA the drafter's validated JSON instead of its narrative text, so the reviewer reads a typed work product rather than prose it has to re-parse.

## The escalation path lets the ticket shape the team

Some tickets do not fit one stable graph. A shipping escalation may need a logistics specialist and a policy reviewer; a billing dispute needs a different set. Encoding every branch permanently produces a graph that costs more to maintain and is still brittle at the edges.

The [Adaptive Customer Support example](/examples/adaptive-customer-support/) hands `runTeam()` a goal and a pool of specialists. A coordinator decomposes the goal into a task DAG at runtime, assigns the work, runs independent tasks together, and synthesizes the reply.

Which shape actually ran is not something you have to infer:

```ts
const result = await orchestrator.runTeam(team, goal, { mode: 'team' })

result.routingDecision
// { mode: 'team', reasons: [...], routerVersion: '...' }
```

Omit `mode` and the built-in `DeterministicRouter` decides. Supply an `ExecutionRouter` and your own policy decides — routing a ticket by queue, customer tier, or anything else your application already knows. Either way `routingDecision` records the topology and the reasons behind it, linked to trace evidence.

This is Execution Routing, and it answers one question: single agent or team. It is deliberately separate from Model Routing, which chooses the model for calls inside whichever topology won.

## The refund is where the design earns its keep

Drafting a reply and issuing a refund are different acts, and the runtime treats them differently.

Built-in tools are default-deny. An agent that declares neither `tools` nor `toolPreset` resolves to zero of them — a drafter cannot touch the filesystem or run a shell because nobody remembered to lock it down. A refund is a tool you write, and you declare what granting it permits:

```ts
const issueRefund = defineTool({
  name: 'issue_refund',
  description: 'Issue a refund against an invoice.',
  inputSchema: z.object({ invoiceId: z.string(), amount: z.number() }),
  consequential: true,
  execute: async (input) => billing.refund(input),
})
```

`consequential: true` makes that grant visible to the runtime. Require confirmation, and each such call clears a gate before it executes:

```ts
const orchestrator = new OpenMultiAgent({
  requireConsequentialConfirmation: true,
  onToolCall: async (context) => {
    if (context.consequential !== true) return { action: 'allow' }
    return (await supervisorApproves(context))
      ? { action: 'allow' }
      : { action: 'deny', reason: 'Refund not approved.' }
  },
})
```

The gate runs once per invocation, after input validation and before `execute`, so it sees the actual arguments. That matters: `bash` is a single allowed name covering both `ls` and `rm -rf /`, and the same asymmetry separates a $5 refund from a $5,000 one.

Two boundaries are worth stating plainly.

The classification reads **tool grants only**. OMA never scans the goal, the prompt, tool arguments, or model output for words like "refund", "password", or "production". A ticket full of alarming language that grants only benign tools is not flagged; a granted consequential tool is flagged even when the goal reads as routine.

And the gate is a policy decision, not a process sandbox. It decides whether a call proceeds — not what the tool can reach once it does.

If confirmation is required and no approval path is configured, the tool does not run. The result carries `confirmationRequired: true` with `status.code === 'rejected'`, and the application can re-run with a decision.

## "Human approval" is three different decisions

A dynamically planned run offers three places to intervene, and they answer different questions:

- `onPlanReady` — the coordinator has produced a plan. Approve the shape of the work before any task runs.
- `onTaskDispatch` — one task is ready. Approve this unit of work.
- `onToolCall` — one tool call is about to execute. Approve this action.

For support, the plan gate is where a supervisor sees what the escalation lane intends to do; the tool gate is where the refund itself stops.

If the workflow must pass named roles in order, declare it rather than implying it in agent prompts:

```ts
const result = await orchestrator.runTeam(team, goal, {
  governanceIntent: 'required',
  requiredRoles: ['reviewer', 'security'],
  requiredOrder: ['reviewer', 'security'],
})

if (result.governanceConclusion !== 'satisfied') {
  throw new Error(`Governance failed: ${result.governanceReason}`)
}
```

OMA checks the executed topology, not labels in agent prose. An application may override a declared floor, but that never reports as a clean success: the conclusion comes back `unsatisfied` with reason `overridden`.

## Choosing a lane

Use the fixed graph when the categories are stable, the handoffs are known, every reply needs the same QA step, and predictable latency and cost matter more than adaptation. The application decides the route; agents fill in typed work products inside it.

Use the coordinator when the ticket may require different specialists, the dependency order cannot be read off the category, and the result needs synthesis across several investigations. The coordinator proposes the route; your application still owns the allowed agents, tools, budgets, and approval policy.

The coordinator costs a planning call, and the task graph can vary between runs. That variance is the point on the escalation lane and a liability on the high-volume one.

## Before widening its authority

Both examples run on demonstration tickets. Moving to real ones is where evaluation belongs, and it lives in a separate subpath — `@open-multi-agent/core/eval` — because it observes completed results and never changes the business outcome.

Score a versioned set of representative tickets, gate CI on the report, and watch the trend rather than a single run. A scorer that throws is recorded as `scorer_error` and excluded from the averages; a failed measurement is not a zero.

Runs stay inspectable on your own infrastructure. Stable run identity, routing decisions, execution receipts, the TraceStore, and the offline Run Viewer need no hosted service, and trace payloads redact detected secrets on a best-effort basis — worth knowing precisely because "best-effort" is not "guaranteed" when customer data is in the ticket.

## Run both before choosing

Set the provider credential listed on each example page, then run the two shapes back to back from the framework repository root:

```bash
# Fixed classify → draft → QA API
(
  cd packages/core/examples/integrations/express-customer-support
  npm install
  npm start
)

# Dynamic specialist selection
npx tsx packages/core/examples/cookbook/adaptive-customer-support.ts
```

Start with the fixed path. Add the adaptive lane only for tickets whose variation earns the extra planning and control work.
