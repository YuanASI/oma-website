---
title: "Field Note: Where Multi-Agent Workflows Actually Start to Help"
description: "Across OMA's runnable use-case recipes, the same boundaries keep appearing: parallel reading, source isolation, explicit handoffs, runtime planning, and an independent veto for hard rules."
pubDate: 2026-07-31
tags: ["field-notes", "workflow-design", "agents"]
contentType: field-note
useCases: ["multi-agent fit", "workflow decomposition"]
industries: ["application design"]
evidence:
  kind: field-observation
  note: "This is a synthesis of OMA's current runnable use-case recipes. They are application prototypes, not a representative sample of customer deployments or industries."
related:
  solutions: ["parallel-llm-calls", "goal-driven-orchestration"]
  examples: ["meeting-summarizer", "competitive-monitoring", "contract-review-dag", "adaptive-customer-support"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 6
---

We kept building multi-agent examples and found the same mistake hiding in very different domains.

People start by choosing agents.

Researcher. Writer. Reviewer. Planner.

That is backwards. The useful starting point is the work boundary: which parts can run independently, which evidence must stay separate, which handoff needs a typed contract, and which decision cannot be delegated.

This note summarizes what kept repeating across Open Multi-Agent's runnable use-case recipes. It is not customer research. The recipes are prototypes with fixtures and explicit limits. They are still useful because the workflow shapes recur.

## Pattern 1: one input needs several independent readings

The [meeting summarizer](/examples/meeting-summarizer/) gives the same transcript to three specialists: summary, action items, and sentiment.

The agents help because those outputs have different contracts. A summary is prose. Action items need owners. Sentiment needs a constrained label and evidence.

The pattern is:

> One source → several independent interpretations → one aggregation step.

This is the cleanest fan-out case. It also appears in multi-perspective code review and document analysis.

If every branch returns the same kind of generic summary, several agents may only multiply cost.

## Pattern 2: sources must disagree before they can be reconciled

The [competitive monitoring recipe](/examples/competitive-monitoring/) isolates social, community, and news fixtures. The [paper replication triage](/examples/paper-replication-triage/) isolates paper claims, code artifacts, dataset evidence, and follow-up discussion.

The point is not that several agents know more. The point is that each result remains attributable.

The pattern is:

> Separate sources → structured audits → explicit contradiction handling.

Blending the sources in the first prompt makes a smooth answer easier and an evidence audit harder.

Use source-specific agents when provenance and disagreement are part of the deliverable. Do not use them as a substitute for source quality.

## Pattern 3: fixed dependencies want a fixed graph

The [contract review DAG](/examples/contract-review-dag/) knows its topology before the run:

- Extract clauses.
- Run compliance review and summarization after extraction.
- Produce the final notification after both branches finish.

The [incident postmortem DAG](/examples/incident-postmortem-dag/) has the same property. Investigation branches fan out, analysis waits, writing comes last.

The pattern is:

> Known handoffs → explicit dependencies → parallelize only the independent nodes.

There is no benefit in paying a coordinator to rediscover a stable graph. `runTasks()` keeps that graph reviewable in code and lets retry policy live on the step that can fail.

## Pattern 4: changing work may earn runtime planning

The [adaptive customer support recipe](/examples/adaptive-customer-support/) is different. A shipping escalation and a billing dispute may need different specialists and dependencies.

The pattern is:

> Variable request → coordinator proposes a task DAG → application inspects and constrains the run.

This is where goal-driven planning earns its extra call. It is also where plan review, budgets, and traces matter most, because the topology is not fixed.

Dynamic planning should answer a real variability problem. "We did not want to write the graph" is not enough.

## Pattern 5: a hard rule belongs outside the generation loop

Some recipes include arbitration or a final safety decision. The narrative puzzle example lets several specialists propose a hint, then gives a separate reviewer a binary veto over protected information.

The pattern is:

> Generate and negotiate inside the workflow. Enforce the hard boundary outside that negotiation.

A prompt that says "please be safe" is a preference. A separate allow, review, or deny decision can be inspected and tested.

This does not make the classifier infallible. It makes the authority boundary explicit.

## A smaller decision test

Before adding a second agent, ask five questions:

1. Are there genuinely different work products?
2. Can some of them run independently?
3. Must evidence remain attributable?
4. Is the topology fixed or request-dependent?
5. Is there a decision the model must not make alone?

If the answers are mostly no, use one agent or ordinary code.

If the answers reveal parallel work, conflicting evidence, typed handoffs, or a hard authority boundary, several agents may give the application a cleaner shape.

That is the repeated observation from these recipes: the value does not begin with the number of agents. It begins with a workflow that has real seams.
