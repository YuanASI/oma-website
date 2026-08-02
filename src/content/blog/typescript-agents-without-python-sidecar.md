---
title: "Multi-Agent AI in a TypeScript Service, Without the Python Sidecar"
description: "Three agents behind one Express route, in the Node process you already deploy: per-agent model tiers, validated JSON handoffs, a run-level token ceiling, and cancellation that actually cancels."
pubDate: 2026-08-02
tags: ["typescript", "nodejs", "multi-agent", "express"]
contentType: decision-guide
useCases: ["ticket triage", "backend orchestration"]
industries: ["software"]
evidence:
  kind: runnable-demo
  note: "The pipeline mirrors the repository's Express Customer Support example; the runtime controls are documented v1.14 API surface. Model choice, prompts, and provider are the article's, and throughput at production volume is untested here."
related:
  solutions: ["mixed-model-teams", "goal-driven-orchestration"]
  examples: ["express-customer-support", "task-pipeline"]
  integrations: ["anthropic", "openai-compatible"]
  comparisons: ["langgraph", "vercel-ai-sdk", "crewai"]
featured: false
readingMinutes: 8
---

You just got out of sprint planning. The ask: add AI-powered ticket handling to the API. Three agents — one classifies the ticket, one drafts a reply, one QA-reviews it. They run in order, share context, and return structured JSON to an Express route.

Your stack is TypeScript, Node.js, PostgreSQL. The route, the auth, the migrations — you know exactly how to do all of that. The only part that makes you stop is the orchestration: three model calls that depend on each other, each on a different model tier, each needing its output validated before anything downstream reads it.

So you search. And the thing you find first is that the old answer — *the agent ecosystem is Python, go stand up a sidecar* — is no longer true.

## What the search actually turns up in 2026

**LangGraph** is not a Python-only argument any more. It ships a first-party TypeScript package, `@langchain/langgraph`, and it is GA. You define nodes, edges, and shared state over a `StateGraph`, and you get thread-scoped checkpoints, human intervention, and time travel over that graph. What you are signing up for is authoring the topology yourself — deliberately low-level, on purpose.

**The Vercel AI SDK** is TypeScript-native and the leanest thing here. Its agent primitives run one tool-calling loop very well. Multi-agent coordination — dependency ordering, parallel branches, shared budgets across the whole run — is application code you write on top. That is a design choice, not an oversight, and it is fine right up until the coordination *is* the feature.

**CrewAI** is Python only; there is no official TypeScript port. **AutoGen** has no TypeScript surface either, and there is a second thing to weigh: Microsoft folded AutoGen and Semantic Kernel into the new Microsoft Agent Framework, and AutoGen still receives fixes but is effectively in maintenance mode. Those two are where "add a Python service" is still a real cost you would be paying.

**Hand-rolling it** is the option that looks cheapest in sprint planning. Write a promise chain. Add retry. Add schema validation. Add concurrency limits. Add tracing. Two weeks later you have a bespoke agent framework instead of the feature.

So the question stopped being *Python or TypeScript*. It is: **how much of the orchestration do you want to own, and what has to be true for it to survive production?** If you want the full shortlist by workflow shape, we wrote one: [Best TypeScript Multi-Agent Frameworks in 2026](/blog/best-typescript-multi-agent-frameworks-2026/).

## The checklist, for one API endpoint

1. **Runs in Node, in-process.** One `npm install`. Same container, same CI, same deploy, same logs. No second runtime to patch on a Tuesday.
2. **Agent-to-agent dependencies.** Classifier first. Drafter waits for it. QA waits for both. The framework resolves the DAG and runs the independent parts together; you declare the edges.
3. **Structured output that is enforced, not requested.** Each agent returns typed JSON, validated against a schema. Not `JSON.parse` inside a `try` block.
4. **Per-agent model selection.** Cheap model for classification, mid-tier for drafting, top-tier for review — one pipeline, one run, one bill.
5. **Guardrails that hold.** A token ceiling so a runaway loop does not quietly spend $50. Loop detection. A timeout wired to an `AbortSignal` that actually cancels in-flight model calls.

Not "50 integrations." Not a visual graph builder. Just the things between you and shipping.

## Three agents, one Express route

Here is the pipeline, adapted from the [Express Customer Support example](/examples/express-customer-support/) in the [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) repository:

```typescript
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'
import { z } from 'zod'

// Each agent's output is a contract, enforced at runtime.
const ClassifierOutput = z.object({
  category: z.enum(['billing', 'technical', 'shipping', 'returns', 'general']),
  urgency:  z.enum(['low', 'medium', 'high', 'critical']),
})
const DrafterOutput = z.object({ draft_reply: z.string() })
const QAOutput = z.object({ qa_notes: z.string() })

// Three agents, three model tiers, one team.
const classifier: AgentConfig = {
  name: 'classifier',
  model: 'claude-haiku-4-5',
  outputSchema: ClassifierOutput,
  systemPrompt: 'Classify the support ticket by category and urgency. Respond ONLY with valid JSON.',
}
const drafter: AgentConfig = {
  name: 'drafter',
  model: 'claude-sonnet-5',
  outputSchema: DrafterOutput,
  systemPrompt: 'Write an empathetic customer-facing reply. Respond ONLY with valid JSON.',
}
const qaReviewer: AgentConfig = {
  name: 'qa-reviewer',
  model: 'claude-opus-5',
  outputSchema: QAOutput,
  systemPrompt: 'Review the draft for tone and factual consistency. Respond ONLY with valid JSON.',
}

const orchestrator = new OpenMultiAgent({ maxTokenBudget: 100_000 })
const team = orchestrator.createTeam('support', {
  name: 'support',
  agents: [classifier, drafter, qaReviewer],
  maxConcurrency: 3,
})
```

Then the part you actually write — the handler:

```typescript
app.post('/tickets', async (req, res) => {
  const { subject, body } = req.body ?? {}
  if (typeof subject !== 'string' || typeof body !== 'string' || !subject || !body) {
    res.status(400).json({ error: 'subject and body are required strings' })
    return
  }

  const ticket = `Subject: "${subject}"\nBody: "${body}"`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60_000)

  try {
    const result = await orchestrator.runTasks(team, [
      {
        title: 'Classify ticket',
        assignee: 'classifier',
        description: `Classify this support ticket.\n\n${ticket}`,
      },
      {
        title: 'Draft reply',
        assignee: 'drafter',
        description: `Write a customer-facing reply.\n\n${ticket}`,
        dependsOn: ['Classify ticket'],
        dependencyPayload: 'structured',
      },
      {
        title: 'QA review',
        assignee: 'qa-reviewer',
        description: `Review the draft for tone, empathy, and accuracy.\n\n${ticket}`,
        dependsOn: ['Classify ticket', 'Draft reply'],
        dependencyPayload: 'structured',
      },
    ], { abortSignal: controller.signal })

    if (!result.success) {
      res.status(controller.signal.aborted ? 504 : 502).json({ error: 'Pipeline did not complete' })
      return
    }

    // `structured` is typed `unknown` on purpose. Parse once at the boundary
    // and everything downstream is typed.
    const classified = ClassifierOutput.parse(result.agentResults.get('classifier')?.structured)
    const drafted    = DrafterOutput.parse(result.agentResults.get('drafter')?.structured)
    const reviewed   = QAOutput.parse(result.agentResults.get('qa-reviewer')?.structured)

    res.json({ ...classified, ...drafted, ...reviewed })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) })
  } finally {
    clearTimeout(timer)
  }
})
```

That is the whole thing. The dependencies are data — `dependsOn: ['Classify ticket']` — so the runtime resolves the DAG, starts each task as soon as its own prerequisites are satisfied, and validates every output against its schema. You did not write a state machine or a task queue.

Two details worth pausing on, because they are the ones people get wrong:

**`dependencyPayload: 'structured'` changes what the next agent reads.** By default a dependency hands its downstream task the previous agent's raw prose output. With `'structured'`, the drafter receives the classifier's *validated JSON* — category and urgency as fields — and if that structured value is missing or unserializable, the dependent task fails with a machine-readable validation error instead of quietly proceeding on narrative text. Prose-shaped handoffs are the failure mode that only shows up in production, on the ticket that phrased things unusually.

**Parse at the boundary.** `AgentRunResult.structured` is `unknown` in the type system — the runtime validated it, but TypeScript has no way to know which schema produced it. One `Schema.parse()` per result turns that back into a typed object, and gives you a single obvious place where a contract violation surfaces.

Also note what is *not* in the config: `temperature`. Anthropic's current top-tier models (Opus 5, Sonnet 5) reject the sampling parameters outright, so tiering here is model choice plus prompt, not knobs. `temperature` is still a per-agent field for providers that accept it — and every agent can point at a different provider, including a local OpenAI-compatible endpoint.

## What happens when it doesn't go perfectly

The happy path is ~60 lines. The unhappy paths are why the framework is there at all.

**The model returns something that isn't your schema.** The agent validates, and on the first failure retries once with the validation error fed back into the conversation. If the retry also fails, the run reports a validation failure rather than handing you a half-parsed object. One retry — not an unbounded loop that bills you for optimism.

**The ticket is 8,000 words of ranting.** `maxTokenBudget` on the orchestrator is a run-level ceiling, checked between model calls and at task dispatch. Crossing it stops new work; already-started work settles first, then remaining tasks are marked skipped. Be precise about the boundary: a single in-flight model turn can carry you past the ceiling, because the check happens between calls, not mid-generation.

**The drafter keeps regenerating the same reply.** `loopDetection` on the agent catches the repeating pattern. The default action injects a "you appear stuck" message and gives the model one more chance; `onLoopDetected: 'terminate'` stops the run immediately instead.

**The pipeline runs long.** The `AbortSignal` cancels in-flight model calls. One thing to know: `runTasks` does not throw on abort — it drains, marks the rest skipped, and resolves with `success: false`, which is why the handler above distinguishes a timeout from a generic failure by checking `signal.aborted`. If you need to answer the client the instant the timer fires rather than after in-flight calls settle, race the run against a timeout promise the way the repository example does.

**You need to know what happened.** `onProgress` gives per-agent events; `onTrace` gives spans you can persist to a `TraceStore` and render offline in the run viewer. No hosted service in the path.

None of that is exotic. It is the difference between "it worked in staging on Tuesday" and "it is still working on Friday."

## What staying in-process actually buys

The orchestration is a library call inside the process that already owns the request. The task payloads never get serialized across a network hop. The trace and your application logs are in the same place, correlated by the same request ID. Your deploy is unchanged: same image, same CI, same rollback. And the dependency footprint stays small — three runtime dependencies in the core (`@anthropic-ai/sdk`, `openai`, `zod`); extra providers and MCP load only if you opt in.

The honest cost: your Node process now owns LLM latency and token spend, so concurrency and budget become service-level concerns rather than someone else's service. That is what `maxConcurrency` and `maxTokenBudget` are for, and it is a trade many teams will take over operating a second runtime.

## When this isn't the right choice

If the orchestration topology is fixed, long-running, and central to the product — and you want state history and time-travel debugging over it — author the graph explicitly with **LangGraph.js**. That control is the point.

If you have one agent and the hard part is the interface — token streaming, tool events, typed UI messages — the **Vercel AI SDK** is excellent and probably all you need. Multi-agent orchestration is overhead when there is one agent. (These are not exclusive: OMA can run *on top of* the AI SDK's provider layer.)

If you want agents, workflows, memory, a server, and evals under one framework boundary, look at **Mastra** before assembling those parts yourself.

And two boundaries on this approach specifically. Checkpoint recovery is task-grained: a completed task can be reused after a restart, but an interrupted task starts over — if you need process-independent timers and infrastructure-managed durable execution, evaluate a workflow runtime on purpose. And this is a library, not a platform: no visual editor, no hosted control plane, nothing to log into.

But if you are a TypeScript team adding coordinated agents to a product you are already shipping, and you would rather your stack stay one stack — that is the case this is built for.

---

[open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) is MIT-licensed and TypeScript-native. `@open-multi-agent/core` v1.14.0 runs on Node 20+ with three runtime dependencies:

```bash
npm install @open-multi-agent/core
```

Start with the [quick start](/getting-started/quick-start/), or read the [production checklist](/guides/production-checklist/) for the full set of controls.
