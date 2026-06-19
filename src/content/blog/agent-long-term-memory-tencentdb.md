---
title: "Give Your TypeScript AI Agents Long-Term Memory with TencentDB-Agent-Memory"
description: "Wiring open-multi-agent's MemoryStore to TencentDB-Agent-Memory through its Hermes Gateway: a measured cross-run memory loop, and two upstream gotchas that decide whether anything gets stored."
pubDate: 2026-06-15
tags: ["typescript","ai","llm","tutorial"]
devtoUrl: "https://dev.to/jackchenme/give-your-typescript-ai-agents-long-term-memory-with-tencentdb-agent-memory-elm"
readingMinutes: 7
---
> A walkthrough wiring [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent)'s pluggable `MemoryStore` to [TencentDB-Agent-Memory](https://github.com/TencentCloud/TencentDB-Agent-Memory) through its Hermes Gateway, with a real cross-run memory loop measured end to end on DeepSeek, plus two upstream behaviors that are not in any README and will silently cost you your memories if you miss them.

Most multi-agent frameworks have no long-term memory, and that is by design. They orchestrate: decompose a goal, run agents, pass results between them. The moment the run ends, everything the agents learned is gone. There is no notion of "what did this user tell us last week" or "what did we conclude the last three times we looked at this." For a one-shot batch job that is fine. For an assistant, a support bot, or anything a user comes back to, it is the whole game.

open-multi-agent is one of those frameworks. Its `SharedMemory` is in-process coordination state for a single run, not a knowledge base. So the honest answer to "how do my agents remember things across sessions" is: you bring your own memory layer. This post wires in one specific layer, TencentDB-Agent-Memory (TDAM), an open-source agent memory system from Tencent Cloud that distills raw conversation into searchable long-term memory and keeps all of it on local disk.

By the end you will have:

- A `MemoryStore` adapter that gives an agent team persistent memory across separate process runs.
- A measured two-run loop: run one writes and distills memories, run two recalls them and feeds them back into the agents' prompts.
- Two upstream gotchas, with server-log evidence, that decide whether anything gets stored at all.
- A clear line on when this is the right memory layer and when it is overkill.

## Where this sits: three ways to give agents memory

Before any code, the honest landscape, because the right answer for you might be simpler than this whole post.

There are roughly three ways to add long-term memory to an agent system:

1. **Roll your own.** A vector database, an embedding model, and your own logic to decide what to store and how to summarize it. Maximum control, and you maintain all of it forever.
2. **Hosted memory SaaS.** A managed API that stores and retrieves memories for you. Lowest effort, but your conversation history and extracted facts live on someone else's servers.
3. **Self-hosted distilled memory.** A system that runs the extraction pipeline itself, over your data, on infrastructure you control. TDAM is this kind: raw conversations (L0) get distilled into atomic facts (L1), then scenes (L2), then a persona (L3), stored in local SQLite with sqlite-vec, retrieved by BM25 plus vector hybrid search. Zero external API dependency for storage.

This post builds the third option. It is worth your time specifically if you are on a TypeScript stack, you want memory extraction to run on infrastructure you control, and "the data never leaves our machine" is a real requirement (regulated industries, on-prem deployments, privacy-sensitive products). If you just need a key-value scratchpad that survives restarts, point open-multi-agent's `MemoryStore` at Redis or SQLite directly and skip all of this.

## How the two systems meet

open-multi-agent exposes a `MemoryStore` interface (`get` / `set` / `list` / `delete` / `clear`) and lets you inject any implementation as a team's `sharedMemoryStore`. TDAM, for its part, has no general-purpose SDK; third-party frameworks integrate through its **Hermes Gateway**, an HTTP sidecar (default `127.0.0.1:8420`) exposing `capture`, `search`, and `recall` endpoints, with optional Bearer auth. So the adapter is a `MemoryStore` that speaks to the Gateway over HTTP.

One mismatch shapes the whole design. `MemoryStore` is a key-value contract: `get(key)` must return exactly what `set(key, value)` wrote. The Gateway has no read-by-key endpoint at all; its `search` and `recall` return *distilled, formatted text*, not the raw record you stored. Forcing key-value reads through a search endpoint would quietly corrupt the orchestrator's bookkeeping, since it reads task results back by key between steps. So the adapter splits responsibilities:

```plaintext
within a run:
  get / list / delete / clear  ───────────────►  local in-process map  (exact KV)
  set(key, value)              ──┬────────────►  local map
                                 └── /capture ──►  TDAM  →  L0 → L1 → L2 → L3  (local SQLite)

across runs:
  recall(topic)  ◄── formatted context ──  TDAM  (BM25 + vector hybrid)  ──►  agent prompts
```

Within a run, the local map is the source of truth, identical to the default in-memory store. Across runs, the distilled TDAM memories are what persist. That distinction is the entire integration.

## Two upstream behaviors that decide whether anything gets stored

This is the part you cannot get from the README, and the part most likely to make you think the integration is broken when it is working exactly as designed.

### 1. The extractor only remembers the user, never the assistant

TDAM's L1 extraction prompt distills three kinds of memory, all of them *about the user*: persona, episodic, and instruction. Its "do not extract" list explicitly names the AI assistant's own output. It is a user-memory system, not a transcript archive — and the exclusion is enforced in the extraction prompt, not by a code-level filter.

The first version of my adapter put the agent's result in the `assistant_content` field of the captured turn, which felt natural: the agent produced the result, so it is the assistant talking. The Gateway accepted the capture, triggered extraction, and stored nothing:

```console
[l1-extractor] Total extracted memories: 0 across 1 scene(s)
[l1] L1 complete: extracted=0, stored=0
```

The fix is to phrase the capture so the agent reports its result as the *user* speaking. Same content, different slot. After the change, the same run extracted a memory:

```console
[l1-extractor] Total extracted memories: 1 across 1 scene(s)
[l1] L1 complete: extracted=1, stored=1
```

If you are feeding any non-conversational producer (an agent, a job, a pipeline) into TDAM, this is the single most important thing to get right.

### 2. Extraction is scheduled, and `session/end` does not force it

Captured turns are not extracted immediately. Extraction fires when a session's conversation count crosses a threshold, or after a 600-second idle timer. The threshold has a warm-up that *doubles*: it starts at 1, then 2, then 4, before settling at the steady-state value (`everyNConversations`, default 5).

That doubling is the trap. With the default config and a short run of two captures:

```console
notify: conversation_count=1/1 (warmup: 1)   -> threshold reached, triggering L1
Warm-up advanced -> next threshold 2
notify: conversation_count=1/2 (warmup: 2)   -> L1 idle timer reset (600s)
flushSession: complete
```

The first capture extracts. The second does not: it needs count 2, and the warm-up is now demanding 2 from a fresh count of 1. Calling `POST /session/end` drains extraction already in flight but does not force the second capture through. In the log above, `flushSession: complete` is followed by no second extraction. That memory is sitting in a buffer, waiting for a threshold or a timer that a short-lived demo never hits.

For a long-running production session this scheduling is fine and probably what you want. For a deterministic "capture, then immediately search" loop, set `everyNConversations: 1` in `tdai-gateway.yaml`. The threshold then graduates straight to a steady-state of 1 and every capture extracts on the spot.

One smaller note while you are setting up: the Gateway needs Node 22. On Node 20 it fails to start with `TypeError: webidl.util.markAsUncloneable is not a function`, an undici incompatibility.

## The measured loop

Setup: TDAM v0.3.6 from the npm package, Node 22, SQLite backend with embeddings disabled (so retrieval is BM25 / FTS), Bearer auth on, and `deepseek-v4-flash` driving both the agent team and the Gateway's extraction pipeline. The team is two agents (an analyst and a writer) researching one topic. Auth behaves as documented: `GET /health` is open, every other endpoint returns 401 without a valid Bearer token.

**Run one, cold start.** No prior memory exists. The team runs, and every shared-memory write is captured into TDAM:

```console
[1/4] Recalling long-term memory... No long-term memories yet (first run).
[3/4] Captured 2/2 shared-memory writes into TDAM (4 L0 records). Flushing...
[4/4] 1 memories match (strategy: fts).
  [episodic] (priority: 80) The user (analyst) reported completed work comparing
  SQLite and PostgreSQL for agent memory stores, concluding that SQLite is
  preferable for real-time latency and simplicity, while PostgreSQL is better
  for multi-agent concurrency and scalability.
```

The two captured turns distilled into one episodic memory. Token usage: 4443 in, 2137 out.

**Run two, same session, fresh process.** This time recall finds something:

```console
[1/4] Recalling long-term memory... Recalled 1 memories (strategy: hybrid)
      -> injecting into agent prompts.
```

The recalled memory goes into both agents' system prompts, and the writer builds on the prior conclusion instead of starting over. The new run's results capture back, and TDAM does not just append a second memory, it merges the two runs into one upgraded record:

```console
[4/4] 1 memories match (strategy: fts).
  [episodic] (priority: 85) The open-multi-agent team completed work on storage
  choice for AI agent memory: the analyst completed an analysis comparing SQLite
  and PostgreSQL ... the writer completed a memorandum recommending SQLite for
  single-agent local workloads and PostgreSQL for multi-agent concurrent systems.
```

Priority rose from 80 to 85, and the scene now covers both agents. Token usage: 11384 in, 2489 out, higher because the recalled context is now in the prompts. That is the loop closed: write, distill, recall across a process boundary, feed back, re-distill into something better.

One honest detail on latency. In run one the flush returned in 0.0 seconds, because with `everyNConversations: 1` extraction had already completed inline during capture. In run two the flush took 49.9 seconds, because that run's captures were still queued and `session/end` genuinely waited for the extraction model. Budget for real LLM latency at flush time. On a local model, think minutes, not seconds.

## When to reach for this, and when not to

The cost is honest and worth stating: TDAM's Gateway is a separate service you run alongside your app. For a framework whose whole pitch is three dependencies, in-process, one call, "now also run a sidecar and an extraction LLM" is real friction. You take that on for a reason, not by default.

Reach for it when long-term memory has to stay on infrastructure you control, when you want layered distillation (facts, scenes, persona) rather than a flat log, and when you are willing to run the sidecar to get it. Skip it when a key-value store that survives restarts is all you need; a `MemoryStore` backed by Redis or SQLite is a tenth of the moving parts.

The full runnable example (adapter, search toolkit, two-agent demo, README) is in the open-multi-agent repo under `examples/integrations/with-tencentdb-memory/`, pinned to TDAM v0.3.6 (both gotchas verified unchanged in TDAM's source through 1.0.0), lint and the full test suite green. If you wire TDAM into a different framework and hit a third gotcha, I want to know which one.
