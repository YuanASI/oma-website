---
title: "Competitive Monitoring Without a Single Source of Truth"
description: "Process social, community, and news claims in parallel, preserve their provenance, and make a separate agent compare contradictions instead of flattening them into one confident summary."
pubDate: 2026-07-31
tags: ["competitive-intelligence", "research", "typescript"]
contentType: application
useCases: ["competitive monitoring", "contradiction detection"]
industries: ["product intelligence"]
evidence:
  kind: runnable-demo
  note: "The recipe uses deliberately conflicting local Twitter, Reddit, and news fixtures. Live collection, source licensing, and production accuracy are outside this demonstration."
related:
  solutions: ["parallel-llm-calls", "mixed-model-teams"]
  examples: ["competitive-monitoring", "research-aggregation"]
  integrations: ["anthropic", "openai-compatible"]
  comparisons: ["langgraph"]
featured: false
readingMinutes: 5
---

A competitor announces one product update.

The company post gives one date. A community thread gives another. A news article repeats a performance number with less context. A normal summarizer compresses the disagreement into one smooth paragraph.

That paragraph is easy to read and hard to trust.

Competitive monitoring needs a different shape:

> Extract each source independently. Preserve the claims. Compare them only after their provenance is explicit.

The runnable [Competitive Monitoring example](/examples/competitive-monitoring/) demonstrates that shape with three deliberately conflicting local fixtures.

## Three readers, three source boundaries

The recipe gives one fixture to each source analyst:

- A Twitter analyst reads the Twitter feed.
- A Reddit analyst reads the community feed.
- A news analyst reads the news feed.

Each agent returns structured claims with a claim, date, source URL, and confidence. The three analyses run together because none depends on another.

This is more than a latency optimization. Source isolation prevents an early blend.

If one agent reads every feed in one prompt, it can silently treat repetition as corroboration, even when every channel copied the same original statement. It can also discard the awkward detail that two sources disagree.

Separate agents do not make the sources more accurate. They make the boundaries harder to lose.

## Comparison is a different job

After the three source reviews finish, an intelligence aggregator receives their structured results.

Its job is not "write a better summary." It has a narrower responsibility:

- Group duplicate claims.
- Compare dates and numbers.
- Flag contradictions.
- Preserve source links and confidence.
- Produce one Markdown intelligence report.

That handoff separates extraction from judgment. It also gives downstream code a usable record of what was compared.

The final report can say "these two sources disagree" instead of forcing an answer that the evidence does not support.

## What this architecture does not solve

The example uses local fixtures. It does not:

- Authenticate to a live social or news API.
- Decide whether your use complies with a source's terms.
- Establish that a claim is true because several channels repeated it.
- Replace a human analyst's decision about materiality.
- Measure recall across the sources your team actually follows.

Those are not footnotes. They are the production work.

A real deployment needs a source policy before it needs more agents:

1. Define which channels are allowed.
2. Store the original URL, retrieval time, and relevant excerpt.
3. Distinguish first-party statements from commentary and repetition.
4. Decide which contradictions require human review.
5. Evaluate extraction and contradiction detection on a labeled set.

## When multiple agents earn their cost

Use this pattern when source boundaries matter and each source can be processed independently.

Do not use it merely because there are several URLs. A single extraction pass may be enough when the volume is small and no downstream decision depends on provenance.

The multi-agent shape earns its cost when:

- Several feeds can be processed concurrently.
- The same claim may appear in different forms.
- Disagreement is itself useful information.
- The final artifact must show where every conclusion came from.

If the output is a weekly intelligence brief, the report should be a reviewable evidence product, not a prettier autocomplete result.

## Run the fixture first

From the framework repository, with `ANTHROPIC_API_KEY` set:

```bash
npx tsx packages/core/examples/cookbook/competitive-monitoring.ts
```

Read the fixture claims before reading the generated report. Check whether the output retains the contradictions you can see by hand.

Only then replace the fixtures with one live source at a time. A monitoring system should become more connected without becoming less attributable.
