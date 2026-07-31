---
title: "Keep Competitive Sources Apart Until Something Compares Them"
description: "One agent per source, structured claims out of each, and an aggregator that reads validated records instead of prose — so contradictions between a vendor post, a community thread, and a news article survive to the report."
pubDate: 2026-07-31
tags: ["competitive-intelligence", "research", "typescript"]
contentType: application
useCases: ["competitive monitoring", "contradiction detection"]
industries: ["product intelligence"]
evidence:
  kind: runnable-demo
  note: "The recipe uses deliberately conflicting local Twitter, Reddit, and news fixtures. Live collection, source licensing, and production accuracy are outside this demonstration. The handoff and scheduling behavior described here is documented runtime API."
related:
  solutions: ["parallel-llm-calls", "mixed-model-teams"]
  examples: ["competitive-monitoring", "research-aggregation"]
  integrations: ["anthropic", "openai-compatible"]
  comparisons: ["langgraph"]
featured: false
readingMinutes: 7
---

A competitor announces one product update. The company post gives one date. A community thread gives another. A news article repeats a performance number with less context than it started with.

Feed all three to one summarizer and you get a smooth paragraph. It is easy to read and it has quietly destroyed the most useful thing in the input: the disagreement.

The fix is structural. Extract each source independently, keep the claims typed, and make comparison a separate job that reads records rather than prose.

## One reader per source boundary

The runnable [Competitive Monitoring example](/examples/competitive-monitoring/) gives one fixture to each source analyst — a Twitter feed, a community feed, a news feed — and lets an aggregator compare what comes back.

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Twitter',
    description: 'Extract claims from the Twitter feed.',
    assignee: 'twitter-analyst',
  },
  {
    title: 'Reddit',
    description: 'Extract claims from the community feed.',
    assignee: 'reddit-analyst',
  },
  {
    title: 'News',
    description: 'Extract claims from the news feed.',
    assignee: 'news-analyst',
  },
  {
    title: 'Compare',
    description: 'Group duplicates, compare dates and numbers, flag contradictions.',
    assignee: 'aggregator',
    dependsOn: ['Twitter', 'Reddit', 'News'],
    dependencyPayload: 'structured',
  },
])
```

The three readers declare no dependencies on each other, so they run together. That is the smaller benefit.

The larger one is isolation. A single agent reading every feed in one prompt can treat repetition as corroboration even when all three channels copied the same original statement, and it can drop the awkward detail that two sources disagree. Separate agents do not make any source more accurate. They make the boundaries harder to lose.

## Comparison reads records, not paragraphs

`dependencyPayload: 'structured'` is doing the load-bearing work here. Without it, a direct dependency injects the upstream task's raw `output` — and the aggregator would be re-reading three narratives, re-extracting claims that were already extracted, and re-guessing which feed each one came from.

With it, only canonical JSON derived from each analyst's successful `AgentRunResult.structured` reaches the aggregator. Narrative text is excluded. Each claim arrives with the shape the analyst validated: the claim, its date, its source URL, its confidence.

That changes what the aggregator can be asked to do. Not "write a better summary" but a narrower, checkable job: group duplicate claims, compare dates and numbers, flag contradictions, preserve source links and confidence, and produce one report.

The final artifact can then say "these two sources disagree" instead of forcing a resolution the evidence does not support.

## Every source's extraction stays separately readable

The report is not the only output worth keeping. When a claim turns out to be wrong three weeks later, the question is which feed carried it and what the analyst actually returned.

`taskResults` keeps every task's unmerged result, keyed by stable task ID, alongside the `agentResults` index that merges by agent:

```ts
const result = await orchestrator.runTasks(team, tasks)

const newsTask = result.tasks?.find(task => task.title === 'News')
const newsClaims = newsTask
  ? result.taskResults?.get(newsTask.id)?.structured
  : undefined
```

Both indexes reference the same executions, and exposing `taskResults` does not count usage twice.

## Pay for depth only where judgment happens

Three extraction passes over bundled feeds and one comparison across conflicting claims are not the same kind of call. Model Routing separates them:

```ts
const modelRouting: ModelRoutingPolicy = {
  rules: [
    { match: { agent: 'aggregator' }, route: { model: 'claude-opus-4-7' } },
    { match: { phase: 'worker' }, route: { model: 'claude-haiku-4-5' } },
  ],
}

await orchestrator.runTasks(team, tasks, { modelRouting })
```

Rules evaluate in order and the first match wins, so the specific rule leads. A call matching nothing keeps the model it would have used.

## What the example does not do

The recipe reads local fixtures. It does not authenticate to a live social or news API, decide whether your use complies with a source's terms, or measure recall across the channels your team actually follows. Those are the production work, and the first two are policy decisions before they are engineering ones.

A real deployment needs a source policy before it needs more agents: which channels are allowed, what gets stored (original URL, retrieval time, relevant excerpt), how first-party statements are distinguished from commentary, and which contradictions require a human.

Where the runtime does help is the last mile of that list. Extraction and contradiction detection are exactly the kind of thing that drifts silently, and the `@open-multi-agent/core/eval` subpath exists to measure it: score a versioned set of labeled feeds, gate CI on the report, and watch the trend rather than one run. Evaluation observes completed results and never changes the business outcome, which is why it is a separate subpath rather than a runtime hook. A scorer that throws is recorded as `scorer_error` and excluded from the averages — a failed measurement is not a zero score.

If collection eventually writes anywhere — a CRM, a briefing doc, an alert channel — that tool is `consequential: true`, and `onToolCall` gates each invocation after input validation and before `execute`.

## When several agents earn their cost

Use this shape when source boundaries matter and each source can be processed independently. Do not use it merely because there are several URLs: a single extraction pass is enough when volume is small and no downstream decision depends on provenance.

The multi-agent shape pays off when several feeds can be processed concurrently, the same claim appears in different forms, disagreement is itself the signal, and the artifact has to show where every conclusion came from.

## Run the fixtures first

From the framework repository, with `ANTHROPIC_API_KEY` set:

```bash
npx tsx packages/core/examples/cookbook/competitive-monitoring.ts
```

Read the fixture claims by hand before reading the generated report, then check whether the output kept the contradictions you can see yourself. Only after that, replace fixtures with one live source at a time. A monitoring system should get more connected without getting less attributable.
