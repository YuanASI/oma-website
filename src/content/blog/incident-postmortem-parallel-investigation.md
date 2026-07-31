---
title: "Build an Incident Postmortem Pipeline That Investigates in Parallel"
description: "Logs, deployments, and customer impact can be investigated at the same time. A task DAG keeps those evidence streams separate until a root-cause analyst has enough context to synthesize them."
pubDate: 2026-07-31
tags: ["sre", "incident-response", "typescript"]
contentType: application
useCases: ["incident postmortems", "root-cause analysis"]
industries: ["software operations"]
evidence:
  kind: runnable-demo
  note: "The repository example runs on a bundled incident scenario. Orchestration and evidence handoffs are demonstrated; wiring it to a live observability stack is left to the reader."
related:
  solutions: ["parallel-llm-calls"]
  examples: ["incident-postmortem-dag", "trace-observability"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph", "inngest-agentkit"]
featured: false
readingMinutes: 5
---

Incident reviews often begin with a bad queue.

One person reads logs. Then somebody checks the deployment history. Then the team estimates customer impact. Only after those steps does anyone try to explain what happened.

That sequence is easy to manage, but much of the waiting is unnecessary. Logs, deployments, and blast radius are separate evidence streams. They can be investigated together.

The important part is what happens next: do not blend those streams before each one has produced attributable evidence.

## The graph

The runnable [Incident Postmortem DAG](/examples/incident-postmortem-dag/) uses five tasks:

1. A log investigator extracts patterns from the incident logs.
2. A deployment investigator checks correlation with recent changes.
3. An impact investigator analyzes the blast radius.
4. A root-cause analyst waits for all three investigations and forms a supported hypothesis.
5. A postmortem writer turns the evidence and hypothesis into the final document.

The first three tasks have no dependency on one another, so they start together. The analyst cannot start until all three finish. The writer cannot start until the analysis is ready.

That is a small DAG, but it encodes an important operating rule:

> Parallelize evidence collection. Serialize judgment.

If the synthesis starts too early, one vivid signal can dominate the narrative. If every investigation runs sequentially, the team pays unnecessary wall-clock time.

## Keep evidence attributable

A postmortem is not just a polished explanation. It is an evidence chain.

The log investigator should be able to say which pattern it found. The deployment investigator should identify which change it correlated. The impact investigator should state what scope the bundled scenario supports.

The downstream analyst receives those completed results through task dependencies. It does not need to infer which source a statement came from after the fact.

This separation makes disagreement useful. Logs might suggest one failure mode while deployment timing points elsewhere. The analyst's job is to reconcile that tension, not erase it.

## The deliverable

The example produces:

- Three investigation results.
- A root-cause hypothesis based on those inputs.
- A final postmortem artifact.
- Run-level timing and usage information printed by the example.

It does not query a live log service, deployment platform, status page, or ticket system. The incident scenario is bundled with the recipe. That keeps the orchestration easy to inspect, but it also sets the evidence boundary.

Connecting real systems is a separate piece of work. The application needs to decide:

- Which time window each investigator may query.
- Which fields must be redacted before model access.
- Whether customer data may leave the controlled environment.
- Which source links and query parameters must be preserved in the final artifact.
- Who approves the root-cause statement and corrective actions.

## Why a task graph fits

This workflow does not need a coordinator to invent its topology. The five roles and their dependencies are known before the incident begins.

That makes an explicit `runTasks()` graph a better default:

- The same evidence branches run every time.
- Dependencies are reviewable in code.
- A missing branch blocks synthesis instead of silently disappearing.
- Independent branches can still run concurrently.

A dynamic coordinator becomes interesting when the investigation plan itself varies sharply by incident type. Even then, inspect the proposed plan before granting access to production systems.

## Run the recipe

From the framework repository, with `ANTHROPIC_API_KEY` set:

```bash
npx tsx packages/core/examples/cookbook/incident-postmortem-dag.ts
```

Start with the bundled scenario. Inspect the task records and final artifact. Then replace one evidence branch at a time with a read-only integration to your own systems.

The safe progression is deliberately boring: fixture, read-only source, reviewed output, then broader authority.
