---
title: "When Should a Support Ticket Trigger a Multi-Agent Team?"
description: "A practical split for customer support: keep the high-volume path on a fixed classify → draft → QA pipeline, and use dynamic specialist routing only for escalations whose shape changes with the ticket."
pubDate: 2026-07-31
tags: ["customer-support", "typescript", "agents"]
contentType: application
useCases: ["ticket triage", "escalation handling"]
industries: ["customer support"]
evidence:
  kind: runnable-demo
  note: "This playbook combines two runnable repository examples with synthetic tickets. It does not claim CRM integration, autonomous account actions, or production outcomes."
related:
  solutions: ["goal-driven-orchestration", "parallel-llm-calls"]
  examples: ["express-customer-support", "adaptive-customer-support"]
  integrations: ["openai", "openai-compatible"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 6
---

A password reset and a disputed invoice arrive through the same support form. That does not mean they deserve the same workflow.

The password reset is familiar. Classify it, draft a reply, check the tone, return the result.

The disputed invoice may need billing policy, account history, refund rules, and a careful handoff. The work changes with the ticket.

That gives support teams a useful design rule:

> Use a fixed task graph for the path you already understand. Pay for dynamic planning only when the escalation can take materially different shapes.

Open Multi-Agent has two runnable examples that make this boundary concrete. Neither connects to a real help desk. Both use demonstration tickets. Their value is the decision they expose.

## The high-volume path: fixed and typed

The [Express Customer Support example](/examples/express-customer-support/) puts a three-step workflow behind `POST /tickets`:

1. A classifier returns a category and urgency.
2. A support drafter writes the customer-facing response.
3. A QA reviewer checks tone, empathy, and factual consistency.

The route validates the request before any model call. Each agent returns a schema-validated object. The endpoint also maps invalid input, pipeline failure, and timeout to explicit HTTP behavior.

Nothing in that topology needs to be rediscovered for every ticket. Classification always comes before drafting. QA always comes last. `runTasks()` is the natural fit because the application owns the graph.

That predictability matters more than novelty on a busy route. You can inspect each handoff, test its schema, and decide exactly what downstream code receives.

## The escalation path: let the ticket shape the team

Some tickets do not fit one stable graph.

A shipping escalation may need a logistics specialist and a policy reviewer. A billing dispute may need a different set of checks. Adding every possible branch to one permanent workflow produces a graph that is expensive to maintain and still brittle at the edges.

The [Adaptive Customer Support example](/examples/adaptive-customer-support/) takes the other route. It gives `runTeam()` a support goal and a pool of specialists. A coordinator decomposes that goal into a task DAG at runtime, assigns the relevant work, runs independent tasks together, and synthesizes the response.

The trade-off is real:

- The plan can adapt to the ticket.
- The coordinator adds a planning call.
- The exact task graph can vary between runs.
- You need approval, budget, and trace boundaries before using the result in a consequential workflow.

Dynamic planning is not an upgrade to apply everywhere. It is a different cost shape.

## A two-lane support architecture

Put the two patterns together and the support system has two lanes.

### Lane 1: repeatable tickets

Use a fixed DAG when:

- The categories are stable.
- The handoffs are known.
- Every response needs the same QA step.
- Latency and predictable cost matter more than adaptation.

The application decides the route. Agents fill in typed work products inside it.

### Lane 2: changing escalations

Use a coordinator when:

- The ticket may require different specialists.
- The dependency order cannot be known from the category alone.
- The result needs synthesis across several investigations.
- A human can inspect or approve the plan before consequential actions.

The coordinator proposes the route. Your application still owns the allowed agents, tools, budgets, and approval policy.

## What comes out

The fixed example returns structured JSON: classification, urgency, draft reply, and QA notes.

The adaptive example produces a synthesized response from the specialists selected for that ticket.

Neither example issues a refund, changes an account, or reads a real CRM. Those are separate integrations with their own permissions and audit requirements. A customer-facing draft is one thing. An account-changing action is another.

That boundary should stay visible in production:

- Give read tools and write tools different grants.
- Require approval before refunds, cancellations, or account changes.
- Preserve the ticket, plan, agent outputs, and final decision in the run trace.
- Evaluate the workflow on a versioned set of representative tickets before expanding its authority.

## Run both before choosing

The fastest way to understand the difference is to run both shapes. Start from the framework repository root after setting the provider credential listed on each example page:

```bash
# Fixed classify → draft → QA API
(
  cd packages/core/examples/integrations/express-customer-support
  npm install
  npm start
)

# Dynamic specialist selection, from the repository root
npx tsx packages/core/examples/cookbook/adaptive-customer-support.ts
```

Start with the fixed path. Add the adaptive lane only for tickets whose variation earns the extra planning and control work.
