---
title: "Guides"
description: "Task-shaped walkthroughs that combine several runtime features: orchestration controls, cost and budget limits, and the production checklist."
---

Guides answer "how do I make a run behave", where [Reference](/reference/) answers "what does this option do". Each one pulls together several parts of the runtime around a single decision.

- [Orchestration controls](/guides/orchestration-controls/) — execution topology, declared governance, task dispatch, gates on consequential tools, cancellation, coordinator configuration, and fan-out.
- [Control costs and budgets](/guides/cost-budget-control/) — bound a run with `maxTokenBudget` or `maxCostBudget` plus a caller-owned `estimateCost`, and decide what should happen when a run hits the ceiling.
- [Production checklist](/guides/production-checklist/) — the controls to wire up before going live: routing, dispatch, budgets, timeouts, recovery, evidence, redaction, and tool grants.

## Elsewhere

- [Getting started](/getting-started/) — install, first run, and choosing a run mode.
- [Reference](/reference/) — every runtime page, grouped by what it configures.
