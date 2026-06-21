---
title: "How to Run a Mixed-Model AI Agent Team in TypeScript?"
description: "A practical walkthrough from a single-model team baseline to a mixed-provider production setup with live cost and latency monitoring, using open-multi-agent, the TypeScript-ecosystem answer to CrewAI."
pubDate: 2026-05-16
tags: ["typescript","agents","ai","opensource"]
devtoUrl: "https://dev.to/jackchenme/how-to-run-a-mixed-model-ai-agent-team-in-typescript-1569"
readingMinutes: 16
---
> A practical walkthrough that takes you from a single-model team baseline to a mixed-provider production setup with live cost and latency monitoring, using [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent), the TypeScript-ecosystem answer to CrewAI.

If you have ever priced out a multi-agent system that runs on a single frontier model, you already know the trap. You wire up three agents, plan, build, review, and the monthly bill can hit hundreds of dollars at modest cadence (100 runs/day) and climb past four figures at production volume, because the architect, the developer, and the reviewer are all eating Opus tokens to argue about a one-line bug.

Most TypeScript agent frameworks assume one provider, one model. You can swap the model, but only globally. That single knob makes the cost-quality tradeoff harder than it needs to be. The frontier models are right for a small fraction of the team's turns. The rest is wasted spend.

This post shows the alternative. Three agents, three different model tiers, one `runTeam()` call. Architect on Claude Opus 4.7, developer on a cheaper hosted OpenAI model, reviewer on a local model running through Ollama. The mix is configured per agent in `AgentConfig`, no provider lock-in, no glue code. By the end you will have:

- A concrete way to combine the existing OMA examples for multi-model teams, local models, and cost-tiered execution.
- A cost ledger that gets you per-agent dollar numbers from a single `onProgress` callback.
- A current pricing table for the providers used here, snapshot 2026-05-16, so you can do back-of-the-envelope monthly forecasts before you commit.
- An honest list of what mixed-model teams cost you (because they do cost something).

The repository examples this post connects are:

- [`examples/basics/multi-model-team.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/multi-model-team.ts): different hosted models per agent.
- [`examples/providers/ollama.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/ollama.ts): Claude plus a local Ollama reviewer through an OpenAI-compatible `baseURL`.
- [`examples/patterns/cost-tiered-pipeline.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts): token usage and cost comparison across model tiers.
- [`examples/providers/gemini.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/gemini.ts): Pro/Flash tiering inside one provider.

There is no separate companion repo for this post. The point is the pattern: per-agent model assignment is already a first-class field on `AgentConfig`.

## What "mixed-model" actually means here

A few definitions before we start, because the term is overloaded.

**Single-model team.** Every agent runs on the same provider and the same model. Easiest to reason about, easiest to debug, most expensive when the model is a frontier one.

**Multi-provider team.** Different agents run on different providers, but each agent's model is still picked at design time, not at runtime. This is what we mean by "mixed-model" in this post.

**Dynamic model routing.** The framework decides which model to use per turn based on cost, latency, or quality signals. Powerful, but adds a layer of indirection and a new failure mode. Out of scope here. Static per-agent assignment gets you 80% of the value with 5% of the complexity.

The framework primitive we lean on is `AgentConfig`. open-multi-agent's `AgentConfig` carries `provider`, `model`, `baseURL`, and `apiKey` on each agent. The orchestrator instantiates the right LLM adapter (Anthropic, OpenAI, Gemini, Grok, Bedrock, Copilot, and OpenAI-compatible local servers via `baseURL`) lazily, so you only install the SDKs you actually use.

## The four pieces, in order

The OMA repo already has the building blocks. Read them in this order; each one isolates a different part of the mixed-model pattern.

### Step 1: All-Opus baseline (the cost ceiling)

```ts
import { OpenMultiAgent } from '@open-multi-agent/core'
import type { AgentConfig } from '@open-multi-agent/core'

const architect: AgentConfig = {
  name: 'architect',
  provider: 'anthropic',
  model: 'claude-opus-4-7',
  systemPrompt: 'You are a senior software architect...',
  temperature: 0.2,
}
const developer: AgentConfig = { ...architect, name: 'developer', systemPrompt: '...' }
const reviewer:  AgentConfig = { ...architect, name: 'reviewer',  systemPrompt: '...' }

const orchestrator = new OpenMultiAgent({
  defaultModel: 'claude-opus-4-7',
  defaultProvider: 'anthropic',
})

const team = orchestrator.createTeam('design-build-review', {
  name: 'design-build-review',
  agents: [architect, developer, reviewer],
  sharedMemory: true,
})

const result = await orchestrator.runTeam(team, 'Implement retryWithBackoff<T>...')
console.log(result.totalTokenUsage)
```

That is the entire team. Three agents, one model, one orchestrator. The coordinator that gets spawned by `runTeam()` decomposes the goal into tasks, assigns each task to an agent, runs them with dependency-aware parallelism, and returns a `TeamRunResult` with per-agent token usage in `agentResults` and a total in `totalTokenUsage`.

We use it as the cost ceiling. Everything that follows will be measured against this baseline.

### Step 2: Dual-model (Opus plans, OpenAI executes)

The architect's job is to look at the goal once, decide what to build and what to skip, and lay out an API shape. It is called rarely, but each call is high leverage. Opus is right for that.

The developer and the reviewer fire many times on smaller prompts. The reviewer in particular is mostly running short checklist passes. Spending Opus tokens on those is wasteful. A mini-tier OpenAI model, for example GPT-5.4 mini at $0.75 input and $4.50 output per million tokens as of 2026-05-16, is roughly 5.5x cheaper than Opus on the output side. You can absorb the quality delta on simpler turns.

```ts
const architect: AgentConfig = {
  name: 'architect',
  provider: 'anthropic',
  model: 'claude-opus-4-7',
  systemPrompt: '...',
}
const developer: AgentConfig = {
  name: 'developer',
  provider: 'openai',
  model: 'gpt-5.4-mini',
  systemPrompt: '...',
}
const reviewer: AgentConfig = {
  name: 'reviewer',
  provider: 'openai',
  model: 'gpt-5.4-mini',
  systemPrompt: '...',
}
```

Same `createTeam()`, same `runTeam()`. The only thing that changes is `provider` and `model` on two of the three agents. The orchestrator handles the adapter switching internally; you do not write a single line of provider-specific code in your team setup.

### Step 3: Triple-model with a local reviewer

Now we push the reviewer onto a local model. The argument is the same as Step 2, pushed harder: the reviewer does style checks, edge-case prompts, and short-form QA. A local Ollama model is often good enough for that, and the marginal cloud cost is zero.

The trick is that Ollama exposes an OpenAI-compatible endpoint, so you reuse the `openai` adapter and override `baseURL` and `apiKey` on the agent:

```ts
const reviewer: AgentConfig = {
  name: 'reviewer',
  provider: 'openai',
  model: 'llama3.1',
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  systemPrompt: '...',
}
```

A note that catches people: even when the local server ignores the key, the OpenAI SDK validates that it is non-empty. Pass any placeholder. `'ollama'` works.

Prerequisites for this step: `ollama pull llama3.1` once, then `ollama serve` in a separate terminal. Swap `llama3.1` for Gemma, Qwen, or whatever local model you actually use. Same setup works with vLLM, LM Studio, llama-server, or any OpenAI-compatible inference server.

### Step 4: Live cost and latency monitoring

The mixed-model team is now functionally complete. The problem is you do not yet know what it costs. In production you want to find out fast when an agent hot-loops on Opus and burns $50 in an afternoon.

open-multi-agent's `OrchestratorConfig` accepts an `onProgress` callback that fires for `agent_start`, `agent_complete`, `task_start`, `task_complete`, `error`, and a few others. We use the start and complete events to build a per-agent ledger.

```ts
const ledger = new Map<string, { startedAt: number; finishedAt?: number; model: string }>()
const modelForAgent = (agent: string) =>
  [architect, developer, reviewer].find(a => a.name === agent)?.model ??
  (agent === 'coordinator' ? 'claude-opus-4-7' : 'unknown')

const orchestrator = new OpenMultiAgent({
  defaultModel: 'claude-opus-4-7',
  defaultProvider: 'anthropic',
  onProgress: (event) => {
    if (event.type === 'agent_start' && event.agent) {
      ledger.set(event.agent, { startedAt: Date.now(), model: modelForAgent(event.agent) })
    }
    if (event.type === 'agent_complete' && event.agent) {
      const entry = ledger.get(event.agent)
      if (entry) entry.finishedAt = Date.now()
    }
  },
})
```

After `runTeam()` finishes, you walk `result.agentResults`, pull `tokenUsage` for each agent, look up the per-million pricing for its model, and compute a dollar number. The same ledger pattern used by the cost-tiered example produces output like this (representative shape; for a real recorded run with measured numbers, see the **Update 2026-05-22** section near the end of this post):

```plaintext
agent       | model              | latency  | tokens in/out  | cost
------------+--------------------+----------+----------------+--------
coordinator | claude-opus-4-7    |    3.4s  |   1102/   612  | $0.0208
architect   | claude-opus-4-7    |    6.1s  |   1580/  1140  | $0.0364
developer   | gpt-5.4-mini       |    8.7s  |   2240/  2106  | $0.0112
reviewer    | llama3.1           |   12.0s  |   2680/   480  | $0.0000

Grand total: $0.0684 USD
```

The reviewer is the slowest agent in the table because a local model on a consumer machine is usually slower than a hosted frontier model. That is the local-cost trade-off in concrete terms: zero marginal cloud dollars, more wall-clock seconds. Whether that is the right call depends on whether your team blocks on the reviewer or runs it asynchronously.

## Pricing snapshot (2026-05-16)

These are the numbers used by the examples and estimates in this post. They are also the numbers you want for any cost back-of-the-envelope before you ship a mixed-model team to production. Verify on the official pages before you commit to a forecast.

| Model | Input ($/1M) | Output ($/1M) | Source |
|-------|--------------|---------------|--------|
| Claude Opus 4.7 | $5.00 | $25.00 | [platform.claude.com](https://platform.claude.com/docs/en/about-claude/pricing) |
| Claude Sonnet 4.6 | $3.00 | $15.00 | same |
| Claude Haiku 4.5 | $1.00 | $5.00 | same |
| GPT-5.5 | $5.00 | $30.00 | [openai.com/api/pricing](https://openai.com/api/pricing/) |
| GPT-5.4 | $2.50 | $15.00 | same |
| GPT-5.4 mini | $0.75 | $4.50 | same |
| Gemini 2.5 Flash | $0.30 | $2.50 | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Local model via Ollama | $0 marginal | $0 marginal | electricity + amortized hardware |

A reasonable starting reading of the table: the cloud frontier models charge 4x to 8x more on the output side than on the input side. That is the inversion you want to design against. Push input-heavy agents (research, summarization, retrieval grounding) onto the cheaper models. Reserve the expensive models for agents that produce a lot of high-stakes output.

## A worked cost comparison on a recurring workload

Suppose your team runs the same three-agent task 100 times a day (real-world cadence for an automation that fires on inbound webhooks, scheduled batches, or per-customer pipelines). A representative run uses roughly:

- Coordinator: 1.1K input, 0.6K output tokens (Opus 4.7 in all variants)
- Architect: 1.6K input, 1.1K output
- Developer: 2.2K input, 2.1K output
- Reviewer: 2.7K input, 0.5K output

Use this as a representative shape, not a benchmark. Your numbers will differ; the math below shows how to do it. If you want to measure your own workload, start with [`examples/patterns/cost-tiered-pipeline.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts).

**All-Opus run (Step 1 baseline)** runs to about $0.15 per execution on the token shape above. At 100/day that is roughly $450/month.

**Dual-model (Step 2): Opus on coordinator + architect, GPT-5.4 mini on developer + reviewer.** About $0.073 per run. Roughly $219/month.

**Triple-model (Step 3): Opus on coordinator + architect, GPT-5.4 mini on developer, local Ollama model on reviewer.** About $0.068 per run on the cloud side. Roughly $205/month, plus the local model's wall-clock overhead on a machine you already own.

That is a little over 50% monthly savings against the all-Opus baseline on this token shape, with the quality drop contained to lower-risk roles. The savings shape changes by workload: research-heavy, summarization-heavy, or retrieval-grounded teams can gain more by pushing input-heavy roles to cheaper models. Reasoning-heavy teams gain less and may be wrong to mix at all.

## When mixed-model is the wrong call

The post would be useless if it told you to always mix. Here is the honest list of when not to.

**Single-agent tasks.** If your goal is small enough that one agent can finish it, do not split into a team just to mix models. The coordinator overhead and inter-agent context shuffling will dwarf the savings.

**High-consistency tasks.** Models from different providers disagree on edge cases. If your output is graded against a strict rubric (legal review, medical triage, anything with a regulator-facing audit trail), the variance from mixing providers will bite you. Stay on one model and pay the price.

**Tight feedback loops with human reviewers.** When you are still iterating on prompts and the team's behavior is unstable, mixing models adds a degree of freedom you do not want. Get the team to converge on a single model first, then push pieces out to cheaper models once each role's prompt is stable.

**Cheap models with cheap output.** If every agent in your team already fits a single Haiku or GPT-5.4 mini run, the absolute savings from mixing are pennies and the operational complexity is real. Mixed-model pays off when at least one role's monthly cost is meaningful enough to justify the variance.

**Provider failure handling that is not in place.** A mixed-model team has more failure surfaces than a single-model team. Three providers means three rate-limit ceilings, three auth flows, three latency profiles, and three ways your pipeline can stall on a 503. Decide your retry, fallback, and circuit-breaker strategy before you ship.

## What the cookbook example looks like in mixed-model form

open-multi-agent ships a [personalized interview simulator cookbook](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/cookbook/personalized-interview-simulator.ts) that runs three agents on Claude Sonnet 4.6: an interviewer, an observer, and a reporter. It is a nice match for the mixed-model pattern.

The interviewer does deep, candidate-specific question generation across many turns. That role earns Opus.

The observer reads the transcript after each turn and writes 3-6 short flags. The role is short-output, repeatable, and structurally simple. Push it to a cheaper hosted model or even a local model.

The reporter runs once at the end of the session against a strict Zod schema (`recommendation: 'strong-hire' | 'hire' | ...`, plus structured arrays). Structured-output agents are sensitive to the underlying model's JSON adherence. Keep that on a frontier model.

The migration is two `provider` and `model` edits, two `AgentConfig` blocks. You do not touch the orchestration logic. You do not refactor the prompts. You read the schema and decide where the consistency requirements actually live.

## Why this lives in the TypeScript ecosystem

A small note on positioning since this is the question I get asked most.

CrewAI established the team-of-agents shape that this post leans on: an agent has a role, agents form crews, a crew has a goal, and the framework orchestrates the goal into work. CrewAI is Python-only, and the TypeScript options for the same pattern have been thin until recently. open-multi-agent treats the TypeScript ecosystem as a first-class target: 100% TypeScript runtime, three runtime dependencies (`@anthropic-ai/sdk`, `openai`, `zod`), and the same Goal → Result one-call surface (`runTeam`) that you would get from CrewAI's `Crew.kickoff()`. The mixed-model team is, by design, a first-class pattern rather than a custom adapter you write yourself.

If you are coming from CrewAI and looking for the team-of-roles model in TypeScript, the examples above are the migration target.

## Update 2026-05-22: Real run data + thinking-mode cost

The original post (2026-05-16) uses Anthropic + OpenAI as the canonical example because that's the setup most TypeScript readers will recognize. After publishing, I ran the same `runTeam`-shaped pipeline with **DeepSeek + a local Qwen model** on an M1 16GB MacBook because those were the API credentials I had at hand. Same code path, different provider/model strings. That's the model-agnostic point of the post, applied honestly to my own constraints.

This section adds (1) the actual recorded ledger so anyone reproducing can work from measured data, (2) a side experiment on thinking-mode cost using two Qwen 3.5 9B variants, and (3) a known limitation of the OMA + OpenAI-compatible path for thinking-mode models.

### Setup for the real run

- coordinator / default: DeepSeek `deepseek-chat` (non-thinking, $0.14 / $0.28 per MTok)
- architect: DeepSeek `deepseek-reasoner` (thinking mode, same pricing)
- developer: DeepSeek `deepseek-chat`
- reviewer: Ollama `qwen3:8b` (local, accessed via Ollama's OpenAI-compatible endpoint)
- DAG: `runTasks(team, tasks)` with explicit per-task `assignee` (see "Why `runTasks`" below)
- Hardware: MacBook M1, 16GB unified memory, Ollama 0.20.2

### Ledger 1: real run

```plaintext
agent       | model              | latency  | tokens in/out  | cost
------------+--------------------+----------+----------------+--------
architect   | deepseek-reasoner  |    25.3s |   1612/  2450  | $0.0009
developer   | deepseek-chat      |    68.1s | 108219/ 10408  | $0.0181
reviewer    | qwen3:8b           |   208.5s |   1432/   696  | $0 (local)

Grand total: $0.0190 USD
Wall total : 5:03
```

Per-run cost is $0.0190. At 100 runs/day that is roughly $57/month against the original all-Opus baseline of $450/month. The shape is different from the post's "40-70% savings" claim because the DeepSeek pricing floor is much lower than the OpenAI mini tier the original example used. Use whichever pricing matches your stack.

### Why `runTasks` over `runTeam(goal)` for mixed cloud + local

I tried `runTeam(goal)` three times before switching. Two failures worth recording, because they will hit anyone trying to pin a role to local inference:

1. **Short goal (under 200 chars, no complexity keywords).** OMA v1.1.0 introduced "Skip Coordinator for Simple Goals" — when `isSimpleGoal(goal)` returns true, the coordinator skips DAG decomposition entirely and routes the whole goal to the best-matching agent. The reviewer was never invoked.

2. **Multi-step goal that did trigger the coordinator.** The coordinator generated a DAG but folded the review work into the developer's task instead of dispatching to the reviewer agent. Even adding "the reviewer agent must independently audit" to the goal text didn't move the dispatch — the coordinator's routing decision wins over goal text hints.

For mixed cloud+local pipelines where you have intentionally pinned a role to local inference, this matters: a coordinator that optimizes your local agent away costs you both the architectural intent and the cost saving. `runTasks(team, tasks)` is the path that guarantees per-agent dispatch with compile-time `assignee` typing:

```ts
await orchestrator.runTasks(team, [
  { title: 'design-api', assignee: 'architect', description: '...' },
  { title: 'implement',  assignee: 'developer', description: '...', dependsOn: ['design-api'] },
  { title: 'review',     assignee: 'reviewer',  description: '...', dependsOn: ['implement'] },
])
```

For goal-driven workloads where you genuinely want the coordinator to decide, `runTeam(goal)` is still the right call. The two APIs are complementary; pick by whether the dispatch decision is yours or the framework's.

### Thinking-mode cost: same model, estimated 4-5x latency

Side experiment. I ran the same DAG two more times, only swapping the reviewer model. First with `qwen3.5:9b-mlx` (Qwen 3.5 9B, MLX-optimized for Apple Silicon, 8.9GB on disk) with thinking mode on its default. Then with the same model + `/no_think` appended to the reviewer task description (the prompt-level workaround Qwen 3 series ships with).

| Ledger | reviewer config | reviewer latency | reviewer in / out tokens | wall total |
|---|---|---:|---:|---:|
| 1 | `qwen3:8b` (no thinking by design) | 208s | 1432 / 696 | 5:03 |
| 2 | `qwen3.5:9b-mlx` (thinking default ON) | **1347s** | 21014 / 1566 | 24:30 |
| 3 | `qwen3.5:9b-mlx` (`/no_think` workaround) | 554s | 38342 / 568 | 10:44 |

Ledger 2 vs Ledger 3 is the cleanest control: same model, same hardware, only thinking mode varies. Output tokens dropped 63% (1566 → 568) with `/no_think`, and reviewer latency dropped 59% (1347s → 554s) — despite Ledger 3's reviewer receiving 82% *more* input (38K vs 21K) because the developer happened to emit more in that run. Normalizing for the input difference, the pure thinking-mode cost on this M1 16GB is an estimated 4-5x reviewer latency.

For short code-review-shaped tasks (~200-word output), thinking mode is overkill. Match the local model + thinking setting to the role, not to "biggest thing I can pull".

### Caveat: OMA + OpenAI-compatible can't fully kill Qwen 3.5 thinking

I tested three ways to disable thinking from OMA's side. Two failed, one partially works:

1. **Ollama's native `think: false` field via the OpenAI-compatible endpoint.** Did not work. Adding `"think": false` to a request body sent to `localhost:11434/v1/chat/completions` kept the model thinking for 60+ seconds, with `reasoning` length still 758 chars. The OpenAI Chat Completions schema doesn't define this field, and Ollama's compatibility layer drops it silently.

2. **OMA's `AgentConfig.extraBody`** is designed exactly for passing provider-specific params like GPT-5.5's `reasoning_effort: 'xhigh'`. It hits the same OpenAI-compatible endpoint, so the same outcome is the most likely (I did not retest separately; if you do, please report back).

3. **`/no_think` placed cleanly at the end of the user message / task description.** Partially works. `reasoning` length drops, output tokens drop, latency drops (Ledger 3 above). Putting `/no_think` in `systemPrompt` with extra reinforcement ("skip the <think> block entirely") made it strictly worse — the model pushed 1337 chars into `reasoning` and produced empty `content` because the `max_tokens` budget was consumed by the reasoning phase.

The fully-off path goes through Ollama's native `/api/chat` endpoint with `"think": false`. On the same review prompt, that endpoint completes in **6.7 seconds**. That is the theoretical ceiling for this model + hardware on this prompt. OMA's OpenAI-compatible path leaves measurable performance on the table for thinking-mode models. If you have found a way to pass Ollama's `think` field through an OpenAI-compatible client without bypassing the framework, please open an issue on the OMA repo. I would like to be wrong about this limitation.

### What this changes about the post above

Nothing about the architectural argument changes — per-agent model assignment through `AgentConfig` is still the lever, `runTasks` vs `runTeam(goal)` is still the dispatch choice, and the cost-tiered framing is still the design pattern. The cost numbers in the original worked example use a representative Anthropic + OpenAI shape; the real-run ledger here is a different provider mix with a different cost floor. Both are valid reference points, and being able to swap between them without rewriting orchestration code is exactly what the post argues for.

## Wrap-up: what to take from here

Mixed-model agent teams are not a clever trick. They are the right default once your team grows beyond two agents and the workload starts running on a real cadence. The savings can be material, often 40-70% against an all-frontier baseline depending on token shape, the operational cost is real (more failure modes, more variance), and the design choice that matters most is which agent gets the expensive model.

Three takeaways:

1. **Per-agent model assignment is a design lever, not an optimization.** Decide it when you decide the team. Retrofitting it later means rewriting prompts that have already drifted to match the wrong model.
2. **Start with two providers, then add local.** Step 2 captures most of the savings with two API keys and zero infrastructure. Step 3 is incremental and depends on whether you can spare the local-model latency.
3. **`onProgress` is the cheapest insurance you can buy.** Twenty lines of TypeScript turn token counts into dollar numbers per run. Without it, mixed-model teams silently regress and you find out from the bill.

Start with the existing repo examples: [`multi-model-team`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/basics/multi-model-team.ts), [`providers/ollama`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/ollama.ts), and [`cost-tiered-pipeline`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cost-tiered-pipeline.ts). Run the one closest to your workload, then add the per-agent ledger before you scale it up. If you push this pattern to production, I would like to hear what your real cost shape looks like. The reasonable model split is probably different from the examples, and the right answer is workload-specific.

---

**About open-multi-agent.** TypeScript-native multi-agent orchestration framework, MIT-licensed. Goal → Result in one `runTeam()` call. Three runtime dependencies. Repo: <https://github.com/open-multi-agent/open-multi-agent>. The framework treats the TypeScript ecosystem as a first-class target rather than a secondary port from Python.

**Edits and corrections.** If a price has moved since 2026-05-16 or a model has been renamed, please open an issue against the OMA repo and I will refresh the constants in the examples.
