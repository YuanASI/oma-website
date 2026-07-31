---
title: "Catch Translation Drift by Routing the Back-Translation to Another Model"
description: "Translate with one provider, back-translate with another through a model-routing rule, and let a reviewer return structured drift findings — then measure the reviewer itself with a versioned EvalSet."
pubDate: 2026-07-31
tags: ["localization", "translation", "typescript"]
contentType: application
useCases: ["translation QA", "semantic drift review"]
industries: ["localization"]
evidence:
  kind: runnable-demo
  note: "The cross-model recipe runs on bundled sample text. Back-translation produces a review signal: it flags candidates for a human to confirm. The routing and evaluation APIs described here are documented runtime surface, exercised outside this recipe."
related:
  solutions: ["mixed-model-teams", "parallel-llm-calls"]
  examples: ["translation-backtranslation", "multi-model-team"]
  integrations: ["anthropic", "openai", "gemini"]
  comparisons: ["openai-agents-sdk"]
featured: false
readingMinutes: 4
---

A translation can read naturally and still change the meaning. A qualifier disappears. A deadline gets softer. A product promise gets broader than the source. The sentence looks fine until somebody compares it against the original intent.

Back-translation gives localization teams one signal: translate the result back into the source language and inspect what changed. The signal is worth much more when the return trip does not go through the same model stack that produced the translation.

## Three roles, one of them deliberately foreign

The runnable [Translation and Backtranslation example](/examples/translation-backtranslation/) splits the work into a translator, a back-translator, and a reviewer.

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Translate',
    description: 'Render the English source in the target language.',
    assignee: 'translator',
  },
  {
    title: 'Back-translate',
    description: 'Render that output back into English.',
    assignee: 'back-translator',
    dependsOn: ['Translate'],
  },
  {
    title: 'Review',
    description: 'Compare source and back-translation; report semantic drift.',
    assignee: 'drift-reviewer',
    dependsOn: ['Translate', 'Back-translate'],
    dependencyPayload: 'structured',
  },
])
```

The reviewer depends on both the translation and the back-translation, so it sees the round trip rather than only its endpoint. `dependencyPayload: 'structured'` means it receives validated JSON from each — not two blobs of prose it has to segment itself.

## The provider split is a routing rule, not a second pipeline

Mixing providers is the whole point: a back-translation from the same model family tends to reproduce that family's preferred phrasing, which hides exactly the drift you are looking for.

You do not need separate orchestrations for that. A Model Routing rule assigns the model per call:

```ts
const modelRouting: ModelRoutingPolicy = {
  rules: [
    { match: { agent: 'back-translator' }, route: { model: 'gpt-5' } },
    { match: { agent: 'drift-reviewer' }, route: { model: 'claude-opus-4-7' } },
    { match: {}, route: { model: 'claude-sonnet-4-6' } },
  ],
}

await orchestrator.runTasks(team, tasks, { modelRouting })
```

Rules evaluate in array order and the first match wins, so specific rules lead and the empty `match: {}` acts as a catch-all. A call that matches no rule simply keeps the model it would have used anyway.

Routes also support ordered fallbacks, which matters more here than in most workflows: a localization batch that dies halfway because one provider returned a 503 leaves you with a partially reviewed release.

## Turn comparison into data

The reviewer's job is not to say "looks good". It returns findings, which is what makes the output usable by a queue rather than a person reading paragraphs.

This shape reliably surfaces changes such as a negation disappearing, numbers or units shifting, required and optional language swapping places, scope widening or narrowing, terminology drifting between passages, and tone changing in a way that alters the intended action.

It is most useful on repeated, structured content — help-center updates, product notices, release communication — where a human reviewer needs a prioritized queue rather than a full re-read.

## What a clean back-translation does not establish

A clean round trip does not prove the target text is correct.

Two models can share a blind spot. A literal back-translation flags harmless localization choices. A culturally appropriate phrase looks wrong when translated back word for word. Domain terminology needs a glossary the models do not have.

That is why the final role is a drift reviewer and not an automatic publisher, and why the finding goes to a queue.

## Measure the reviewer, not just the translation

Every workflow like this eventually raises the same question: is the reviewer still catching what it caught last month? Prompt edits, model upgrades, and provider changes all move that answer silently.

Evaluation is a separate subpath — `@open-multi-agent/core/eval` — precisely because it observes completed results and never changes the business outcome:

```ts
import { defineScorer } from '@open-multi-agent/core/eval'

const catchesKnownDrift = defineScorer({
  name: 'catches-known-drift',
  version: '1',
  score({ output, evalCase }) {
    const hit = output === evalCase.expected
    return { score: hit ? 1 : 0, pass: hit }
  },
})
```

Build a versioned EvalSet from labeled pairs — cases of acceptable adaptation alongside cases of material drift — score the reviewer against it, and gate CI on the resulting `GateVerdict` rather than on a spot check.

One property is worth knowing before you write scorers: a scorer that throws, rejects, or times out is recorded as an `EvalRecord` with `status: 'scorer_error'`, normalized, and excluded from score averages, percentiles, and pass rates. Do not replace a scorer failure with `{ score: 0 }` — a measurement that did not happen is not the same as a measurement of zero, and conflating them is how a broken scorer starts looking like a quality regression.

A production workflow still needs an approved glossary, locale-specific style guidance, human review for legal, medical, financial, or safety-critical content, and versioned records of source, translation, findings, and approval. The runtime covers that last one: stable run identity, execution receipts, the TraceStore, and the offline Run Viewer work without any hosted service.

## Why several agents rather than one prompt

The three responsibilities are genuinely different. Translating optimizes for fluency in the target language. Back-translating must not smooth over what the first pass did. Reviewing has to compare two texts and report differences as data.

Collapsing them into one prompt asks a single model to translate, then criticize its own output, then structure the criticism — with every step able to quietly cover for the one before it. Splitting them means the back-translator never sees the source, so it cannot be influenced by it.

## Run the recipe

From the framework repository, with the provider credentials listed on the example page:

```bash
npx tsx packages/core/examples/cookbook/translation-backtranslation.ts
```

Read the bundled sample and its back-translation side by side before reading the findings. Then check whether the reviewer flagged the drift you can already see — and, just as usefully, how much it flagged that you would have let through.
