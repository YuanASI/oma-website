---
title: "From Transcript to Typed Action Items: Three Parallel Agents in TypeScript"
description: "Most meeting summarizers cram summary, action items, and sentiment into one LLM prompt. Here's a cleaner TypeScript shape: three specialist agents run in parallel, two return typed Zod output, and an aggregator merges them into one report."
pubDate: 2026-06-24
tags: ["typescript","ai","agents","opensource"]
devtoUrl: "https://dev.to/jackchenme/from-transcript-to-typed-action-items-three-parallel-agents-in-typescript-3oe"
readingMinutes: 8
---
## Your meeting summarizer is quietly doing three jobs in one prompt

The usual way to summarize a meeting with an LLM is one prompt: "Here's the transcript — give me a summary, pull out the action items, and tell me how everyone felt." One call, one model, one blob of text back.

It works on a demo and frays on a real transcript. Those are three different jobs with three different shapes. A summary wants to flow as prose. Action items want to be a strict list with an owner on every row. Sentiment wants one verdict per speaker. Cram them into a single prompt and they fight: the model pads the summary into the action items, or it forgets to tag a speaker, or the "action items" come back as a paragraph you now have to parse by hand. You also pay for all of it serially, and you get back unstructured text when half of what you wanted was structured data.

There's a cleaner shape. Run three specialists, each doing exactly one job, each at its own temperature, two of them returning typed objects instead of prose — and run them at the same time, because none of them needs another's output. Then a fourth agent merges the three results into one report.

This post builds exactly that, from the [`meeting-summarizer` cookbook example](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/cookbook/meeting-summarizer.ts) in open-multi-agent. The whole thing is ~280 lines of TypeScript and the parallelism is the point.

## What you get out of it

The end product is a single Markdown report with a fixed shape — a prose summary, an action-item table, per-person sentiment, and synthesized next steps. Here's the action-item section from a real run against a 21-line engineering standup — every row came back as typed data, not prose the script had to parse:

| Task | Owner | Due |
|------|-------|-----|
| Deploy shadow-write harness for billing-v2 migration | Raj | 2026-04-24 |
| Add covering index to reconciliation query before cutover | Raj | 2026-04-28 |
| Flip feature flag for checkout redesign to 5% traffic | Priya | 2026-04-23 |
| Draft proposal for mandatory second reviewer on multi-region changes | Dan | 2026-04-27 |
| Create handoff doc for primary on-call rotation | Dan | — |
| Follow up with Len about authz refactor timeline | Maya | — |

The full report also carries the three-paragraph summary, a per-speaker sentiment read, and a synthesized Next Steps list. All of it is produced by four agents — three of which ran concurrently. Here's how it's wired.

## Three specialists, one transcript

Each specialist is a plain `Agent` with its own system prompt and temperature. Start with the summarizer — prose out, no schema, a slightly higher temperature so it reads naturally:

```ts
const summaryConfig: AgentConfig = {
  name: 'summary',
  model: 'claude-sonnet-4-6',
  systemPrompt: `You are a meeting note-taker. Given a transcript, produce a
three-paragraph summary:

1. What was discussed (the agenda).
2. Decisions made.
3. Notable context or risk the team should remember.

Plain prose. No bullet points. 200-300 words total.`,
  maxTurns: 1,
  temperature: 0.3,
}
```

The other two specialists are where this stops being "call an LLM three times" and starts being reliable: **they return typed objects, not text.** You declare a Zod schema, hand it to the agent as `outputSchema`, and read the parsed result off `result.structured`.

Action items are a list, and every item must carry an owner. The due date is optional, because real meetings only sometimes name one:

```ts
const ActionItemList = z.object({
  items: z.array(
    z.object({
      task: z.string().describe('The action to be taken'),
      owner: z.string().describe('Name of the person responsible'),
      due_date: z.string().optional().describe('ISO date or human-readable due date if mentioned'),
    }),
  ),
})

const actionItemsConfig: AgentConfig = {
  name: 'action-items',
  model: 'claude-sonnet-4-6',
  systemPrompt: `You extract action items from meeting transcripts. An action
item is a concrete task with a clear owner. Skip vague intentions ("we should
think about X"). Include due dates only when the speaker named one explicitly.

Return JSON matching the schema.`,
  maxTurns: 1,
  temperature: 0.1,
  outputSchema: ActionItemList,
}
```

Note the temperature: `0.1`. Extraction is not a place for creativity — you want the same transcript to yield the same action items. And because `outputSchema` is set, `result.structured` comes back as a typed `{ items: [...] }` you can push straight into Jira or Linear. No regex, no "parse the markdown table the model hopefully produced."

Sentiment is the same idea with a tighter constraint — `tone` is an enum, so the model can only return one of four values, and every verdict has to cite evidence:

```ts
const SentimentReport = z.object({
  participants: z.array(
    z.object({
      participant: z.string().describe('Name as it appears in the transcript'),
      tone: z.enum(['positive', 'neutral', 'negative', 'mixed']),
      evidence: z.string().describe('Direct quote or brief paraphrase supporting the tone'),
    }),
  ),
})
```

The `evidence` field is a cheap hallucination guard: forcing the model to attach a quote to each tone keeps it from inventing a mood nobody expressed. (One naming gotcha if you adapt this: the outer keys are plural — `items` and `participants` — and the arrays live under them.)

## Fan out: run the three at once

None of the three specialists depends on another — they all read the same transcript and write independent outputs. That's the textbook condition for fan-out. open-multi-agent's `AgentPool` runs agents concurrently up to a limit; give it three slots, add the agents, and kick them all off with `Promise.all`:

```ts
function buildAgent(config: AgentConfig): Agent {
  const registry = new ToolRegistry()
  registerBuiltInTools(registry)
  const executor = new ToolExecutor(registry)
  return new Agent(config, registry, executor)
}

const pool = new AgentPool(3) // three specialists can run concurrently
pool.add(buildAgent(summaryConfig))
pool.add(buildAgent(actionItemsConfig))
pool.add(buildAgent(sentimentConfig))

const specialists = ['summary', 'action-items', 'sentiment'] as const

const parallelStart = performance.now()
const timed = await Promise.all(
  specialists.map(async (name) => {
    const t = performance.now()
    const result = await pool.run(name, TRANSCRIPT)
    return { name, result, durationMs: performance.now() - t }
  }),
)
const parallelElapsed = performance.now() - parallelStart
```

One subtlety worth knowing: `AgentPool` holds a per-agent lock, so the *same* agent can't run twice at once — but three differently-named agents run truly in parallel. A pool size of 3 is exactly enough to fit them.

Now the part most fan-out tutorials skip: **proving it actually ran in parallel.** Measure two things — the wall-clock time around the whole `Promise.all`, and the sum of each agent's own duration. If the work really overlapped, the wall time is much smaller than the sum:

```ts
const serialSum = timed.reduce((acc, r) => acc + r.durationMs, 0)
console.log(`Parallel wall time: ${Math.round(parallelElapsed)}ms`)
console.log(`Serial sum (per-agent): ${Math.round(serialSum)}ms`)
console.log(`Speedup: ${(serialSum / parallelElapsed).toFixed(2)}x`)

if (parallelElapsed >= serialSum * 0.7) {
  console.error('ASSERTION FAILED: parallel wall time is not < 70% of serial sum.')
  process.exit(1)
}
```

That last block is deliberate, and it's worth keeping in your own version. It's a **parallelism self-check**: if the three calls didn't substantially overlap — say your provider rate-limited you and quietly serialized the requests — the wall time creeps up toward the serial sum and the script exits non-zero. So if you run this and see `ASSERTION FAILED`, that's usually not a bug in the code; it's the check earning its keep by telling you the fan-out degraded into a queue.

On a real run against DeepSeek the three specialists overlapped for a **2.21× speedup** — 11.7s of wall time against 25.9s of summed per-agent work. The exact number moves with model latency and network, which is the point of measuring it per run instead of quoting a brochure figure.

## The fourth agent: the aggregator

Fan-out gets you three results in parallel. You still need them merged into one report — and that's a fourth agent, running *after* the others because it depends on all three. No hiding it: this pattern is three-parallel-plus-one, not three.

The aggregator takes the prose summary as text and the two structured results as JSON, and is told to emit a fixed four-heading report:

```ts
const aggregatorPrompt = `Merge the three analyses below into a single Markdown report.

--- SUMMARY (prose) ---
${byName.get('summary')!.output}

--- ACTION ITEMS (JSON) ---
${JSON.stringify(actionData, null, 2)}

--- SENTIMENT (JSON) ---
${JSON.stringify(sentimentData, null, 2)}

Produce the Markdown report per the system instructions.`

const reportResult = await pool.run('aggregator', aggregatorPrompt)
```

Its system prompt pins the output structure (`## Summary / ## Action Items / ## Sentiment / ## Next Steps`, action items as a table) and adds one important rule: *do not invent action items that are not grounded in the other data.* The aggregator's job is to format and synthesize next steps, not to discover new facts — that line keeps it from drifting.

## One real run

![Terminal output from the run: the three specialists (summary, action-items, sentiment) each report OK with their timing, a 2.21x parallelism speedup, the typed action-items and sentiment JSON, and the closing token-usage summary](/blog/meeting-summarizer-parallel-agents-run.png)

The example ships with `claude-sonnet-4-6`; these numbers are from a run swapped to DeepSeek (`deepseek-v4-flash`) — the agent configs are identical, only the model id changes. The three specialists fanned out, the `action-items` and `sentiment` outputs validated against their Zod schemas, and the aggregator produced the report above. Token usage for the full run — three specialists plus the aggregator — was **3,225 input and 4,083 output tokens**. (That's token counts, not a dollar figure; what you pay depends on your provider and model.)

A thing to set expectations on: fan-out buys you **wall-clock time, not tokens.** You still make four model calls — you've just stopped waiting for them one after another. And you added a call (the aggregator) you wouldn't have with a single prompt. On a tiny transcript the coordination overhead can eat the win; the pattern pays off as each specialist's own work grows.

## When this pattern fits — and when it doesn't

**Reach for fan-out when** one input needs several independent analyses. Meeting → {summary, actions, sentiment} is the canonical case, but so is a PR → {security review, style review, test-coverage check}, or a support ticket → {category, urgency, suggested reply}. Independent jobs, same source, typed outputs you want to use downstream.

**Don't** when the steps depend on each other — research-then-write is a pipeline, not a fan-out, and forcing it parallel just breaks the data flow. And don't fan out a single job for the sake of it: one agent is simpler than a pool plus an aggregator.

There's also a higher-level option in the same framework. Here you wired the parallelism by hand — you decided what runs concurrently. If you'd rather describe a goal and let a coordinator decompose it into a task graph and parallelize *that* for you, that's what `runTeam()` does; I wrote it up in [Goal In, DAG Out](/blog/goal-to-task-dag-coordinator/). Hand-wired fan-out like this post is the right call when the shape is fixed and you want it explicit; the coordinator is the right call when the shape varies with the goal.

## Run it

```bash
npm install @open-multi-agent/core
```

The full example is in the repo — run it from the repository root (it needs `ANTHROPIC_API_KEY`):

```bash
npx tsx packages/core/examples/cookbook/meeting-summarizer.ts
```

Source to read: the [`meeting-summarizer` example](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/cookbook/meeting-summarizer.ts) and its [transcript fixture](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/fixtures/meeting-transcript.txt). For the same fan-out/aggregate shape stripped to its essentials, see the [`fan-out-aggregate` pattern](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/fan-out-aggregate.ts).

One honest caveat: the transcript here is a synthetic standup, and the project's production validation is still early. If you point this at real meetings, I'd like to hear where the typed extraction held up and where it didn't.
