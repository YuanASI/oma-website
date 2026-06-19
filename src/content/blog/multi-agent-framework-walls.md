---
title: "5 walls multi-agent frameworks hit: receipts from Mastra's year of .network() to Supervisor migration"
description: "Mastra spent a year migrating .network() to the Supervisor pattern. 5 engineering walls hit (context, routing, observability, nesting, performance), 18 GitHub issues as receipts. What it means for TypeScript multi-agent framework development."
pubDate: 2026-05-21
tags: ["mastra","typescript","agents","opensource"]
devtoUrl: "https://dev.to/jackchenme/5-walls-multi-agent-frameworks-hit-receipts-from-mastras-year-of-network-to-supervisor-3am3"
readingMinutes: 13
---
Multi-agent in TypeScript is engineering-hard. Context propagation between agents, routing quality across providers, observability inside LLM-driven decisions, nesting depth, performance under concurrency: each of these has bitten Mastra over the past year, with public GitHub issues to prove it.

This post pulls 5 engineering walls out of Mastra's year-long migration from `.network()` to the Supervisor pattern. I searched the Mastra GitHub repo for `AgentNetwork`, `multi-agent`, `supervisor`, and `network`, got 32 relevant issues spanning May 2025 to May 2026, and cite 18 representative ones below.

Why Mastra specifically? Because they are the most public case study. On April 9, 2026, Mastra raised a $22M Series A led by Spark Capital, bringing total funding to $35M. Same day, they launched Mastra Platform. I read the Series A post, the Platform announcement, and the pricing page end to end: the exact phrase "multi-agent" appears zero times across all three. They still mention `subagents` once in the Series A post, so multi-agent coordination has not vanished as a capability. But "multi-agent" as a *positioning word* is gone.

This is a shift. Nine months earlier, in July 2025, Mastra published "Beyond Workflows: Introducing Agent Network" and positioned automatic LLM-driven multi-agent routing as a step beyond workflows. Nine months later, the Series A narrative is Studio + Server + Memory Gateway. It is "agent infrastructure platform." It is "framework gives you primitives, platform gives you tools to run at scale."

What happened in between? The 32 issues are far more honest than any blog post. They cover Mastra's full arc: every iteration, every transition, every shift in positioning.

The five walls are below. Each one Mastra hit, with issue receipts.

## Context: everyone was racing on multi-agent

To understand the weight of this shift, look at the field. Through 2024 and 2025, LangGraph, CrewAI, AutoGen, and Mastra all pushed multi-agent as a core narrative. The Microsoft AutoGen paper kept emphasizing "multiple agents collaborating outperform a single agent." LangChain promoted LangGraph to a top-line product. CrewAI grew to tens of thousands of stars in a year.

In the TypeScript world, Mastra was the standard bearer. Founded October 2024 by Gatsby co-founder Sam Bhagwat and team. YC W25. $13M seed round announced October 2025, from 100+ investors (the post headline says "120+ others"), including YC, Paul Graham, Guillermo Rauch, Amjad Masad, and Balaji Srinivasan. Three founders from a framework used by hundreds of thousands of developers.

They had every advantage: TS ecosystem, Gatsby pedigree, YC, top-tier VCs, marquee angels, a $22M Series A, and customers including Replit, Brex, Sanity, Factorial, Indeed, Marsh McLennan, MongoDB, Workday, and Salesforce.

And they still moved `.network()` out of the multi-agent headline.

## The full timeline of Mastra's multi-agent narrative

| Date | Event | Position of "multi-agent" in their story |
|---|---|---|
| Oct 2024 | Team formed | None. Pitch was "TS framework for the next million AI developers" |
| H1 2025 | AgentNetwork v1 (experimental) | Present, but they later admitted v1 was "pretty whack" |
| Oct 8, 2025 | $13M seed round announced | Not a core funding narrative |
| **Jul 3, 2025** | **Blog: "Beyond Workflows: Introducing Agent Network (vNext)"** | **Peak**. Original wording: "intelligent AI orchestration that automatically routes and executes complex multi-agent tasks without predetermined workflows" |
| Aug 26, 2025 | Blog: "Improved agent orchestration with AI SDK v5" | The "orchestration" in the title quietly downgrades to single-agent tool orchestration |
| Oct 10, 2025 | Blog: "The evolution of AgentNetwork." `.network()` API consolidates | Multi-agent still featured, but the API is simplifying |
| Nov 2025 | v1 Beta | Still mentions `.network()` for agent networks |
| Jan 2026 | v1.0 stable | Multi-agent no longer a top-line feature |
| **Feb 26, 2026** | **Supervisor pattern launches as the first-class primitive for multi-agent orchestration** | `.network()` later marked deprecated in the migration guide |
| **Apr 9, 2026** | **Mastra Platform + Series A $22M** | The exact phrase "multi-agent" appears 0 times across the Series A, Platform, and Pricing pages. `subagents` still mentioned once |
| May 19, 2026 | "Introducing A2A support" | Cross-framework interop protocol. Multi-agent capability continues, but now framed as agent-to-agent interop rather than internal orchestration |

Multi-agent as primary headline ran from July 2025 to November 2025, roughly 4 to 5 months. Then a quiet downgrade in August, an API migration to Supervisor in February, and a vocabulary switch in the Series A by April.

Nine months of repositioning.

## Blogs are written for press. Issues are real.

Announcement posts have communications teams. GitHub issues do not.

The Mastra repo currently has about 24.1k stars, 2.1k forks, and 200+ open issues (checked 2026-05-21). Of the 32 issues matching my search, this post cites 18 representative ones. Five themes show up repeatedly. These are not feature requests. They are not typos or doc errors. They are the actual hard problems of running multi-agent systems in production.

Mastra spent a year on them and chose to migrate to a structurally simpler design (Supervisor tree) that sidesteps some, but not all, of them.

Here are the five walls.

## Wall 1: Memory, context propagation, and persistence between agents

This is the deepest wall, and the one Mastra hit longest.

Issue #11468, titled simply "Agent Network," was filed December 29, 2025 from their Discord. The original text:

> "Using agent.network() I found something that when an orchestrating agent decides which secondary agent to call, the message history is not transferred to the secondary agent, making it difficult for it to understand the context for action. Please, can you help me with this? I haven't found in any documentation how to pass the memory to this flow in the final agent."

Translated to product language: **the coordinator decides who to call, but the agent being called does not know why it is being called.**

This problem persisted in Mastra's tracker for at least six months. Issue #5381 ("Memory for Networks?") was filed June 23, 2025. Adjacent memory/storage/persistence issues continued after the Supervisor migration, including #15336 ("LibSQL Storage/Memory Error with supervisor agent and sub agents") and #14583 ("Supervisor/Subagent Persistence Duplication"). These are not strictly the same "message history not propagated" bug as #11468, but they share a root: state management between a coordinator and its sub-agents is hard, in multiple ways.

The real engineering hardness: you cannot dump the entire conversation history into every sub-agent (token explosion, privacy, signal-to-noise), but you cannot leave them blind either (they need task context). The tradeoff is an open problem, not a few-months problem.

## Wall 2: Routing quality and prompt fragility

Automatic LLM-driven routing depends on prompt robustness across models. Cross-provider, the same routing prompt behaves very differently.

The receipts:

- **#9873** (2025-11-07) "Network Agents does not forward the request to sub agents inside the network." Routing literally does not work
- **#12468** (2026-01-29) "Agent Network Routing Latency." Slow
- **#12955** (2026-02-11) "The sub agents are returning empty output inside network." Sub-agents return empty
- **#13621** (2026-02-28) "Agent Network routing prompt has trailing whitespace, causing failures with Bedrock-backed Claude models." **A trailing whitespace in a routing prompt breaks the entire routing chain on Bedrock Claude.**

The last one is the most diagnostic. A trailing whitespace, undebuggable across providers. This is not a user mistake. This is the brittleness of LLM-driven routing as a paradigm. Switch providers and your routing behavior may need a full re-tune.

## Wall 3: AgentNetwork routing observability gap

LLMs do the routing inside AgentNetwork. Users couldn't see why.

Issue **#12277** (2026-01-24) "Missing Observability for Routing and Validation LLM Calls in Agent Networks" pointed this out directly. The scope is narrow: it's specifically about tracing for AgentNetwork's internal routing and validation LLM calls, not framework-wide observability. By that date, `.network()` had been live for roughly three months. Production users of `.network()` had been flying blind on the routing layer that whole time.

Observability for AgentNetwork's routing and validation had to be a day-one design decision. Adding it months in means months of users hitting "why did the coordinator pick this agent" without an answer.

## Wall 4: Three-level nesting already breaks

Issue **#15013** (2026-04-03) "3-level sub-agent delegation: no progressive streaming to client."

Three levels of sub-agent delegation is enough to break streaming.

This matters because multi-agent frameworks that aspire to be an "agent OS" or "agent operating system" need to support deep organizational structures. Mastra cracks at three levels of sub-agent delegation. I haven't found public benchmarks for any framework at four levels of agent delegation, and Mastra hasn't disclosed the topology depth of their customer workloads (Brex, Indeed, Marsh McLennan), so I can't claim anything about that ceiling. What I can say is: three-level streaming broke for at least one user of Mastra, and the "deep agent organization" pitch deserves a higher evidence bar than it usually gets.

## Wall 5: Performance collapse

Issue **#15478** (2026-04-17, closed 2026-05-20), "[RFC] Agent Performance Optimization (Slow Responses)."

This is an RFC, not a bug. Mastra opened a public RFC acknowledging slow agent responses had reached the level of a systemic issue. The RFC was closed on May 20, 2026, the day before this post, after a maintainer commented that it had been taken care of.

The diagnosis comes via #15677 (2026-04-23):

> "ObservationalMemoryProcessor.processInputStep blocks every agentic loop step with DB reads and token counting even when far below thresholds."

Translated: **every agent loop iteration triggers a database read and token counting.** Tolerable on a single agent. Catastrophic when amplified across a supervisor with multiple concurrent sub-agents.

The hidden cost of multi-agent is consistently underestimated. Each agent is one LLM call. Each call needs context handling, plus observability, tracing, token counting, memory I/O. Mastra is exposing the real cost of these "lightweight" operations once they are stacked on multi-agent topologies.

## What happened after migrating to Supervisor

On February 26, 2026, Mastra officially launched the Supervisor pattern. The changelog described it as "a first-class supervisor pattern, exposed through the same primitives you already use, `stream()` and `generate()`." `.network()` was later marked deprecated in the migration guide: "will be removed in a future release. While existing code will continue to work until then, no new features will be added to it."

The logic of the migration: shift from LLM-driven routing to manually configured sub-agents in a tree. Simpler structure, more predictable decisions, fewer bug surfaces.

The issue data tells a different story.

From March to May 2026, Supervisor-related issues clustered:

- **#14723** (2026-03-26) Supervisor and sub-agent interactions stored as Supervisor-and-User interactions (history pollution)
- **#14820** (2026-03-29) No way to abort sub-agent execution in supervisor mode
- **#14583** (2026-03-23) Supervisor/Subagent persistence duplication
- **#15013** (2026-04-03) Three-level sub-agent delegation streaming broken
- **#15336** (2026-04-14) LibSQL storage + sub-agent throws
- **#15436** (2026-04-16) No control over sub-agent tool results
- **#15734** (2026-04-24) Suspend/resume breaks when sub-agent owns a workflow
- **#15887** (2026-04-28) Sub-agent calls serialized under approval mode (concurrency dies)
- **#16422** (2026-05-11) `transformAgent` drops sub-agent tool input streaming chunks
- **#15478** (performance RFC, closed 2026-05-20)

Supervisor is not the destination. It simplified some problems (no more LLM auto-routing), but the core multi-agent challenges (context propagation, persistence consistency, nesting depth, concurrency control, streaming) did not disappear. They got new issue numbers and resurfaced.

"Simplified design" is the story told to the community and to investors. The engineering reality is that they are still patching.

## What this means

Three takeaways from a year of Mastra's public behavior.

**One. The migration is not a concept failure. It is an engineering hardness.**

Multi-agent as a concept is validated in research and product. LangChain, AutoGen, CrewAI are all doing it. The gap is between "concept works" and "production-stable." Crossing it took Mastra a year, dozens of issues, one major API rewrite, and a vocabulary switch in the Series A. This is not a "pick it up and ship" direction. It is a real-engineering domain.

**Two. Multi-agent depth beyond two levels remains a hard, undersolved problem.**

Mastra's 3-level streaming bug (#15013) suggests this isn't a Mastra-only ceiling, but I can't speak for frameworks I haven't tested. What I can say from the receipts: prompt robustness, context propagation, streaming, token accounting, error recovery each barely held at two levels in Mastra's case, got shaky at three, and I haven't found public reliable demos at four for any framework. If you have counterexamples, I'd genuinely like to see them.

**Three. "Agent OS" as a buzzword does not match engineering reality.**

An operating system implies stability, predictability, and deep process nesting. A system that breaks streaming at three levels of delegation, needs an RFC for performance, and took six months to figure out context propagation is at best a framework. Calling it an OS is writing a check that current technology cannot cash.

Mastra clearly knows this. Their funding announcements do not use "OS." They use "Platform." They use "framework." They use "infrastructure." These are bounded words.

## Where I am sitting

I have been working on an open-source TypeScript multi-agent framework since April 2026. We call it open-multi-agent. The repo lives at github.com/open-multi-agent/open-multi-agent.

Watching Mastra's migration over the past year did not convince me the road is dead. It convinced me of something else: **Mastra chose to migrate `.network()` into Supervisor and shift the headline vocabulary. We are choosing to walk directly into these five walls and call them out by name.**

Where we are today:

- **Wall 1 (context propagation)**: `SharedMemory` as a namespaced key-value store, injected into prompts as markdown summaries, plus `MessageBus` for point-to-point and broadcast messages between agents. Different mechanism from Mastra's "pass message history." We sidestep the problem rather than solving it directly
- **Wall 2 (routing)**: Coordinator decisions are constrained by Zod schema with one automatic retry on validation failure. Local model fallback parses raw JSON and markdown-fenced JSON output formats
- **Wall 3 (observability)**: Built-in post-run task DAG dashboard (pure HTML render, no I/O dependency). Every team run renders the task DAG, assignee per task, status, timing, and token usage. Day-one design
- **Wall 4 (nesting)**: `maxDelegationDepth` cap, plus cycle detection (target already in `delegationChain` is rejected) and agent pool deadlock detection (rejected when `availableRunSlots < 1`). Three guards from day one
- **Wall 5 (performance)**: Three runtime dependencies only (`@anthropic-ai/sdk`, `openai`, `zod`). `SharedMemory` is in-process by default with no per-step DB I/O. Three-layer Semaphore concurrency control (agent pool, per-agent, tool execution)

## What we have not solved

None of the five walls is "we figured it out with a clever design." This is industry-hard. Not a single-team intelligence problem.

I should be explicit about where we are short:

- **Nesting depth**: `maxDelegationDepth` defaults to 3. **That is exactly the depth at which Mastra cracked.** We have not done serious engineering tests beyond four. Open problem for us too
- **Performance**: We have not systematically load-tested 100 tasks × 10 agents. Mastra hit performance walls in customer production, and our sample size is not comparable yet
- **Context propagation**: `SharedMemory` + `MessageBus` is directionally correct, but the policy of "what a sub-agent sees by default" is still iterating. We have not reproduced every Mastra failure case
- **Cross-provider robustness**: We run basic routing-consistency tests across providers. Edge cases like "trailing whitespace breaks Bedrock Claude" have not been systematically swept

This post is not announcing that we solved what Mastra did not.

It is an invitation. Multi-agent is a real direction with real engineering value and real engineering difficulty. We are continuing to push on it. If you also believe this is worth doing, come help.

## How to get involved

Repo: [github.com/open-multi-agent/open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)

PRs welcome. Counterarguments welcome in issues. Failure cases that break our claims especially welcome.

---

## Frequently asked questions

**Did Mastra abandon multi-agent?**

No. Mastra continues to support multi-agent coordination through the Supervisor pattern (launched February 26, 2026), the `subagents` primitive, and the A2A cross-framework interop protocol (May 19, 2026). What changed is the headline vocabulary: their Series A and Platform announcements (April 9, 2026) no longer use "multi-agent" as a positioning word. The capability stayed; the API and the marketing both shifted.

**If I'm starting a multi-agent project in TypeScript today, what should I use?**

It depends on what you need. Mastra's Supervisor pattern is backed by a well-funded company with enterprise customers (Replit, Brex, MongoDB, Workday, Salesforce, Indeed), and it fits well when you want manually configured sub-agents with predictable execution. If you want LLM-driven goal-to-DAG decomposition (one goal in, an auto-generated task DAG executed across multiple agents in dependency order, rather than manually configuring a supervisor tree), [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) takes that approach with 3 runtime dependencies and a Coordinator pattern. LangGraph is also worth a look if you don't mind Python.

**What is open-multi-agent and how does it differ from Mastra?**

open-multi-agent is an open-source TypeScript framework for multi-agent orchestration, launched April 2026 ([github.com/open-multi-agent/open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)). The core difference: open-multi-agent uses a Coordinator that decomposes a goal into a task DAG via LLM, then executes tasks in dependency order across multiple agents in parallel, whereas Mastra's current Supervisor pattern uses manually configured sub-agents with the supervisor delegating at runtime. Other design choices include 3 runtime dependencies (`@anthropic-ai/sdk`, `openai`, `zod`), in-process `SharedMemory` with no per-step DB I/O by default, and built-in delegation depth caps with cycle detection.

**Does open-multi-agent solve the 5 walls Mastra hit?**

Honestly, partially. We have explicit design choices for each wall (SharedMemory + MessageBus for context, Zod-constrained Coordinator decisions for routing, post-run task DAG dashboard for observability, depth caps + cycle detection for nesting, in-process state for performance). But we have not load-tested at 100 tasks × 10 agents, our default `maxDelegationDepth` is 3 (exactly where Mastra cracked), and cross-provider routing edge cases like "trailing whitespace breaks Bedrock Claude" have not been systematically swept. This is an open invitation, not a solved problem.

---

## Sources

**Mastra posts and announcements:**

- [Mastra Series A (2026-04-09)](https://mastra.ai/blog/series-a)
- [Announcing Mastra Platform (2026-04-09)](https://mastra.ai/blog/announcing-mastra-platform)
- [Beyond Workflows: Introducing Agent Network vNext (2025-07-03)](https://mastra.ai/blog/vnext-agent-network)
- [Announcing improved agent orchestration with AI SDK v5 (2025-08-26)](https://mastra.ai/blog/announcing-mastra-improved-agent-orchestration-ai-sdk-v5-support)
- [The evolution of AgentNetwork (2025-10-10)](https://mastra.ai/blog/agent-network)
- [Mastra Changelog (Supervisor pattern launch, 2026-02-26)](https://mastra.ai/blog/changelog-2026-02-26)
- [Network to Supervisor migration guide](https://mastra.ai/guides/migrations/network-to-supervisor)
- [Introducing A2A support (2026-05-19)](https://mastra.ai/blog/introducing-agent-to-agent-support)
- [Seed round announcement (2025-10-08)](https://mastra.ai/blog/seed-round)
- [Mastra pricing](https://mastra.ai/pricing)

**GitHub issues (in order of appearance):**

- Context propagation: [#11468](https://github.com/mastra-ai/mastra/issues/11468) [#5381](https://github.com/mastra-ai/mastra/issues/5381) [#15336](https://github.com/mastra-ai/mastra/issues/15336) [#14583](https://github.com/mastra-ai/mastra/issues/14583)
- Routing quality: [#9873](https://github.com/mastra-ai/mastra/issues/9873) [#12468](https://github.com/mastra-ai/mastra/issues/12468) [#12955](https://github.com/mastra-ai/mastra/issues/12955) [#13621](https://github.com/mastra-ai/mastra/issues/13621)
- Observability: [#12277](https://github.com/mastra-ai/mastra/issues/12277)
- Nesting: [#15013](https://github.com/mastra-ai/mastra/issues/15013)
- Performance: [#15478](https://github.com/mastra-ai/mastra/issues/15478) [#15677](https://github.com/mastra-ai/mastra/issues/15677)
- Supervisor era: [#14723](https://github.com/mastra-ai/mastra/issues/14723) [#14820](https://github.com/mastra-ai/mastra/issues/14820) [#15436](https://github.com/mastra-ai/mastra/issues/15436) [#15734](https://github.com/mastra-ai/mastra/issues/15734) [#15887](https://github.com/mastra-ai/mastra/issues/15887) [#16422](https://github.com/mastra-ai/mastra/issues/16422)

---

*I work on open-multi-agent, an open-source TypeScript multi-agent framework. Comments, counterarguments, and failure cases welcome at the repo.*
