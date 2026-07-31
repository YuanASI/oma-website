---
title: "Five Seams That Decide Whether a Workflow Needs a Team"
description: "Across OMA's runnable recipes the same five boundaries keep reappearing — and each one turns out to have a specific runtime mechanism behind it, from structured dependency payloads to an execution routing decision you can read back."
pubDate: 2026-07-31
tags: ["field-notes", "workflow-design", "agents"]
contentType: field-note
useCases: ["multi-agent fit", "workflow decomposition"]
industries: ["application design"]
evidence:
  kind: field-observation
  note: "Synthesizes OMA's current runnable use-case recipes. The patterns describe those prototypes; what customer deployments look like is a separate question. The runtime mechanisms named for each pattern are documented API."
related:
  solutions: ["parallel-llm-calls", "goal-driven-orchestration"]
  examples: ["meeting-summarizer", "competitive-monitoring", "contract-review-dag", "adaptive-customer-support"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 4
---

Most multi-agent designs start from a cast list. Researcher. Writer. Reviewer. Planner.

The recipes suggest a different starting point: find the seams in the work first. Which parts run independently, which evidence must stay separate, which handoff needs a typed contract, and which decision cannot be delegated. The agent count falls out of that; it is not an input to it.

Five seams kept reappearing across Open Multi-Agent's runnable use-case recipes, and each one has a specific mechanism behind it. These are prototypes with fixtures and stated limits, not customer research — what makes them worth reading is that the shapes recur.

## Seam 1: one input, several independent readings

The [meeting summarizer](/examples/meeting-summarizer/) gives the same transcript to three specialists: summary, action items, sentiment.

Splitting helps because the outputs have different contracts. A summary is prose. Action items need owners. Sentiment needs a constrained label plus evidence. One source, several interpretations, one aggregation step — the cleanest fan-out case, and the same shape appears in multi-perspective code review and document analysis.

The mechanism is the scheduler. Tasks that declare no dependencies on each other start together, and a downstream task starts as soon as *its* dependencies are satisfied rather than when a batch completes.

The counter-test: if every branch returns the same kind of generic summary, several agents only multiply cost.

## Seam 2: sources have to be able to disagree

The [competitive monitoring recipe](/examples/competitive-monitoring/) isolates social, community, and news fixtures. The [paper replication triage](/examples/paper-replication-triage/) isolates paper claims, code artifacts, dataset evidence, and follow-up discussion.

Several agents do not know more than one agent. What they preserve is attribution. Blending sources in the first prompt makes a smooth answer easier and an evidence audit harder — repetition starts reading as corroboration, and the detail that two sources disagree is the easiest thing to drop.

Two mechanisms carry this one. `dependencyPayload: 'structured'` injects only canonical JSON derived from a dependency's successful `AgentRunResult.structured`, so the comparison step reads validated records instead of re-parsing prose. And `taskResults`, keyed by stable task ID, keeps each task's unmerged result available afterward — the difference between "the model said X" and "the news analyst, in task 3, reported X".

Use source-specific agents when provenance and disagreement are part of the deliverable. They are not a substitute for source quality.

## Seam 3: fixed dependencies want a fixed graph

The [contract review DAG](/examples/contract-review-dag/) knows its topology before the run: extract clauses, then compliance review and summarization in parallel, then the final notification once both branches finish. The [incident postmortem DAG](/examples/incident-postmortem-dag/) has the same property.

Paying a coordinator to rediscover a stable graph buys nothing. `runTasks()` keeps the graph reviewable in code, and a missing branch blocks synthesis instead of quietly disappearing.

This is also the seam where the two routing decisions separate. Execution Routing chooses whether a goal runs as a single agent or a team at all; Model Routing chooses the model for calls inside whichever topology won. A stable graph usually wants the first decision pinned and the second one used aggressively — cheap models on the fan-out, the expensive one on the synthesis.

## Seam 4: variable work may earn runtime planning

The [adaptive customer support recipe](/examples/adaptive-customer-support/) is the exception. A shipping escalation and a billing dispute may need different specialists in a different order, and encoding every branch permanently produces a graph that costs more to maintain and is still brittle.

A coordinator proposes the DAG; the application inspects and constrains the run. That extra planning call should answer a real variability problem — "we did not want to write the graph" is not one.

The mechanism that makes this inspectable rather than opaque is `result.routingDecision`, which records the topology that ran and the reasons for it, linked to trace evidence. Pin it with an explicit `mode`, hand the decision to your own `ExecutionRouter`, or leave it to the built-in `DeterministicRouter` — either way the choice is readable after the fact instead of inferred.

## Seam 5: a hard rule belongs outside the generation loop

Several recipes end in arbitration or a final safety decision. The narrative puzzle example lets specialists propose a hint, then gives a separate reviewer a binary veto over protected information.

A prompt that says "please be safe" is a preference. A separate allow-or-deny decision can be inspected and tested.

The runtime draws this boundary in two places. Tools that cause real side effects are marked `consequential: true`, and with `requireConsequentialConfirmation` each such call clears `onToolCall` after input validation and before `execute` — so the gate sees actual arguments, not just a tool name. Above that, `governanceIntent` with `requiredRoles` and `requiredOrder` declares a role path the runtime checks against the executed topology rather than against labels in agent prose.

Worth stating precisely, because it is the kind of thing that gets overclaimed: the consequential classification reads **tool grants only**. It never scans the goal, the prompt, tool arguments, or model output for alarming words. And the gate is a policy decision, not a process sandbox — it decides whether a call proceeds, not what the tool can reach once it does.

## The smaller decision test

Before adding a second agent, five questions:

1. Are there genuinely different work products?
2. Can some of them run independently?
3. Must evidence stay attributable?
4. Is the topology fixed or request-dependent?
5. Is there a decision the model must not make alone?

Mostly no — use one agent, or ordinary code.

If the answers surface parallel work, conflicting evidence, typed handoffs, or a hard authority boundary, then the agent count is answering a real question. That is the repeated observation across these recipes: the value never starts with how many agents there are. It starts with a workflow that has real seams, and each seam turning out to need a specific mechanism rather than a bigger prompt.
