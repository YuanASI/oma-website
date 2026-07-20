---
title: "Open Multi-Agent v1.12.1: Evaluation, Offline Inspection, and a No-Key First Run"
description: "v1.12.1 adds versioned EvalSets, scorers, CI gates, online sampling, richer offline run inspection, per-run metadata, and a deterministic create-oma-app demo that needs no API key."
pubDate: 2026-07-20
tags: ["release","evaluation","typescript"]
readingMinutes: 5
---

Open Multi-Agent v1.12.1 adds a quality loop around the runtime. You can now
version evaluation cases and scorer logic, compare reports, enforce a CI gate,
and sample completed production runs without changing the business result. The
same release also makes the first `create-oma-app` run deterministic and
credential-free, and gives the offline Run Viewer better task-level evidence.

```bash
npm install @open-multi-agent/core@1.12.1
npm create oma-app@latest my-oma
```

The patch version matters: v1.12.1 fixes the installed `oma` binary so it
launches correctly through npm-created symlinks. If you installed v1.12.0,
upgrade to v1.12.1.

## Evaluation is separate from runtime verification

OMA already had runtime controls such as `runConsensus()` and per-task
`verify`. Those mechanisms can accept, revise, or reject one business result
while it is being produced.

Evaluation answers a different question: did a change improve quality across a
versioned set of cases?

The new `@open-multi-agent/core/eval` entry point includes:

- versioned `EvalSet` fixtures and reusable `Scorer` definitions;
- offline runs through `runEvalSet()` with repeats, concurrency, and tag filters;
- JSON, Markdown, and JUnit reports;
- in-memory and file-backed stores;
- pure `GateVerdict` logic plus `oma eval run` and `oma eval gate` for CI;
- rule-based, trace-aware, and model-judge scorer factories;
- opt-in online sampling after completed runs.

A scorer that throws, rejects, or times out has not measured quality. OMA
records that result as `scorer_error`, continues with later scorers, and excludes
the failure from averages, percentiles, and pass rates instead of turning it
into a zero score.

Online evaluation is disabled by default. When enabled, it samples only settled
top-level runs, evaluates them asynchronously, and isolates evaluation failures
from the original result. This is measurement, not a second runtime verdict.

See the [Evaluation reference](/reference/evaluation/) for the five-minute
offline path, online lifecycle, persistence, payload policy, scorer factories,
and a complete GitHub Actions gate.

## Better evidence after a run

The offline Run Viewer now rolls descendant LLM spans up to the task that caused
them. A task detail can therefore show its model, provider, token and cost
totals, and tool-call count alongside the DAG, status, timing, and safe evidence
details.

No service needs to be running. `oma run --dashboard` writes a self-contained
Viewer after a new run, while `oma dashboard` opens one saved run from a
`FileTraceStore` without invoking a model or OpenTelemetry provider.

Top-level run APIs also accept bounded metadata for facts such as a prompt
version, experiment arm, or dataset tag. Validated metadata appears in the
result, root trace span, stored run summary, and v2 checkpoint restore path, so
an evaluation record can point back to the exact logical run and attempt.

See [Observability](/reference/observability/) and the [CLI reference](/reference/cli/)
for the exact lifecycle and commands.

## A first run without credentials

`create-oma-app@0.5.0` now lets an interactive terminal choose a PR review,
security analysis, or teaching-DAG starter, then installs it and runs a local
demo automatically.

That first demo reads no API key and makes no model request. Scripted model
responses drive the real OMA scheduler, aggregation, report writers, and Run
Viewer. The generated Markdown, JSON, and HTML identify those responses as
simulated so the artifact cannot be mistaken for a live-model result.

Use `--no-install` to write files only, or `--no-run` to install without running
the demo. A real cloud-model run still requires your credentials; an Ollama
starter uses your local service. The [Quick Start](/getting-started/quick-start/)
keeps the two paths explicit.

## Compatibility

Existing `runAgent`, `runTeam`, `runTasks`, `runFromPlan`, `runConsensus`, and
restore flows remain compatible. Evaluation stays off unless configured.
`@open-multi-agent/otel@0.1.0` was not republished and remains compatible with
core 1.12.1.

The release also cleans up descendant processes after a process backend's
direct parent exits. Internal orchestrator extractions in this release preserve
behavior and do not add public APIs.

Read the complete [v1.12.1 release notes](https://github.com/open-multi-agent/open-multi-agent/releases/tag/v1.12.1),
then start with [Evaluation](/reference/evaluation/) or the
[no-key Quick Start](/getting-started/quick-start/).
