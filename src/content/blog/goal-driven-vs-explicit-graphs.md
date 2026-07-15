---
title: "Goal-Driven Agent Orchestration vs Explicit Graphs: A TypeScript Framework Taxonomy"
description: "Most multi-agent framework reviews compare features. This post compares a different axis: where the framework places the decomposition cost. Goal-first frameworks pay it at runtime in tokens; graph-first frameworks pay it at design time in code."
pubDate: 2026-06-03
tags: ["typescript","ai"]
devtoUrl: "https://dev.to/jackchenme/goal-driven-agent-orchestration-vs-explicit-graphs-a-typescript-framework-taxonomy-6i3"
readingMinutes: 12
---
> Most multi-agent framework reviews compare features. This post argues you should compare a different axis first: where the framework places the decomposition cost. Goal-first frameworks pay it at runtime in tokens; graph-first frameworks pay it at design time in code. The right default depends on what kind of work your team actually has.

If you spent any time in 2025 evaluating TypeScript agent frameworks, you probably hit the same wall I did. The product pages do not distinguish themselves on the axes that matter once you ship anything. They all promise "multi-agent". They all show a cooperating-agents diagram. They all link to a half dozen integrations. None of them tell you what the framework is going to make you write at 2am when a customer reports a regression.

The thing the pages do not tell you is who decides the topology. That is the central design choice of every multi-agent framework, and it sorts cleanly into two camps. Graph-first frameworks make you decide. Goal-first frameworks let a coordinator agent decide for you at runtime. Each has costs the other does not.

I am the maintainer of one of the goal-first frameworks ([open-multi-agent](https://github.com/open-multi-agent/open-multi-agent), the TypeScript-ecosystem answer to CrewAI), so my bias is going to show. I am going to try to be honest about what goal-first costs you, because I think the choice between paradigms is more interesting than which framework wins a feature checklist.

## The two-axis problem with most comparison posts

Read any "Top N TypeScript Agent Frameworks 2026" listicle and you will get a feature grid: which framework supports streaming, structured output, retries, observability, MCP, Zod schemas, lifecycle hooks, agent handoffs, and so on. Every framework gets a check or a partial mark.

The grid is not useless, but it conceals the design choice that determines whether you will be productive on the framework six months in. That choice is:

> **Who decides which agent runs next, and when?**

Two answers:

1. **You do, at design time.** The framework gives you primitives for nodes, edges, conditions, and you wire them. The execution path is whatever your code says it is.
2. **A coordinator does, at runtime.** You declare the agents and the goal. The framework runs an LLM call to plan a task DAG, then executes it.

Call these **graph-first** and **goal-first** respectively. They are not feature sets. They are paradigms with different cost shapes, different failure modes, and different right-fit use cases.

This post is the taxonomy. The same two-agent task appears inline below, implemented in four TypeScript frameworks (LangGraph.js, Mastra workflows, KaibanJS, open-multi-agent), so you can read each surface and judge for yourself.

## What "graph-first" and "goal-first" mean

### Graph-first

You declare the topology yourself. Nodes are agents (or steps). Edges declare execution order or conditions. The compiled object is a deterministic state machine. The framework executes it; it does not change it.

Canonical examples:

- **LangGraph.js**: `StateGraph` with explicit `Annotation.Root` schema, `addNode` per agent, `addEdge` for transitions, `addConditionalEdges` for routing. You compile the graph and invoke it.
- **Mastra workflows**: `createWorkflow` with typed `inputSchema` and `outputSchema`, `createStep` per stage, `.then()` to chain. A linear-graph DSL on top of typed steps.

### Goal-first

You declare agents (role, model, system prompt). You hand the orchestrator a sentence-level goal. At runtime, a coordinator agent (an LLM call you do not write) decomposes the goal into a task DAG, assigns tasks to agents, runs them in dependency order, and synthesizes a final answer.

Canonical examples:

- **CrewAI** (Python): the prototype. `Crew.kickoff()` on a list of agents plus tasks. CrewAI uses the role/goal/backstory metaphor to seed agent behavior.
- **open-multi-agent**: `OpenMultiAgent` orchestrator plus `runTeam(team, goal)`. The coordinator pattern lives in [`src/orchestrator/orchestrator.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/src/orchestrator/orchestrator.ts) (`runTeam` method) and is described inline in the JSDoc, six steps: decompose, queue, schedule, execute with parallelism, persist results, synthesize.

### What about KaibanJS

KaibanJS lives between the two. You define `Agent` and `Task` objects with explicit dependencies (the writer's task description references the researcher's output by convention), then the framework's Kanban board moves tasks across columns. Topology is mostly explicit in your task list, but the state machine that drives execution is hidden inside the board abstraction. Call it a **hybrid**. Closer to graph-first than goal-first in practice.

## Four-way side by side: the same task in four frameworks

The task is small on purpose: a `researcher` agent gathers a brief on a topic, and a `writer` agent turns the brief into a 400-word summary. The writer depends on the researcher. The snippets below are the relevant core of each implementation, written to show the API surface side by side rather than as a packaged runnable project.

### LangGraph.js

```ts
const State = Annotation.Root({
  topic:   Annotation<string>,
  brief:   Annotation<string>,
  summary: Annotation<string>,
})

async function researcher(state: typeof State.State) {
  const res = await model.invoke([
    { role: 'system', content: '...' },
    { role: 'user',   content: `Topic: ${state.topic}` },
  ])
  return { brief: String(res.content) }
}

async function writer(state: typeof State.State) {
  const res = await model.invoke([
    { role: 'system', content: '...' },
    { role: 'user',   content: `Brief:\n${state.brief}` },
  ])
  return { summary: String(res.content) }
}

const graph = new StateGraph(State)
  .addNode('researcher', researcher)
  .addNode('writer',     writer)
  .addEdge('__start__',  'researcher')
  .addEdge('researcher', 'writer')
  .addEdge('writer',     '__end__')
  .compile()

const result = await graph.invoke({ topic: '...' })
```

What you see in the code: a state schema, two node functions, three edges, a compile-and-invoke. The dependency between researcher and writer is the edge `addEdge('researcher', 'writer')`. The writer reads `state.brief` because the researcher wrote to it.

### Mastra workflows

```ts
const researchStep = createStep({
  id: 'research',
  inputSchema:  z.object({ topic: z.string() }),
  outputSchema: z.object({ brief: z.string() }),
  execute: async ({ inputData }) => ({ brief: await callLLM(inputData.topic) }),
})

const writeStep = createStep({
  id: 'write',
  inputSchema:  z.object({ brief: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ inputData }) => ({ summary: await callLLM(inputData.brief) }),
})

const wf = createWorkflow({ id: 'r+w', inputSchema: ..., outputSchema: ... })
  .then(researchStep)
  .then(writeStep)
  .commit()
```

What you see: Zod-typed steps, a `.then()` chain. The dependency between research and write is positional in the chain. Mastra workflows expose more types than LangGraph at this complexity level, and trades graph generality for linear DSL clarity.

### KaibanJS

```ts
const researchTask = new Task({
  description: 'Research the topic {topic} and produce a brief.',
  agent: researcher,
})
const writeTask = new Task({
  description: 'Using the brief produced previously, write a 400-word summary.',
  agent: writer,
})

const team = new Team({
  name: 'Research and Write',
  agents: [researcher, writer],
  tasks: [researchTask, writeTask],
  inputs: { topic: '...' },
})

await team.start()
```

What you see: agents and tasks declared, dependency implicit in task order and prose references. The board state machine drives execution under the hood.

### open-multi-agent

```ts
const orchestrator = new OpenMultiAgent({ defaultModel: 'claude-sonnet-4-6', defaultProvider: 'anthropic' })

const team = orchestrator.createTeam('research-and-write', {
  name: 'research-and-write',
  agents: [researcher, writer],   // researcher + writer AgentConfig
  sharedMemory: true,
})

const goal = 'Research "Multi-agent orchestration tradeoffs in TypeScript" and write a 400-word summary.'
const result = await orchestrator.runTeam(team, goal)
```

What you see: agents declared, a goal sentence, one call. What `runTeam()` can do for you, on a goal complex enough to need it, is a coordinator planning pass that decomposes the goal into a DAG (here a `researcher → writer` dependency), runs the tasks in order, and synthesizes the final summary. One honest caveat, expanded in the cost section below: this particular goal is simple enough that OMA short-circuits and skips the coordinator entirely, dispatching straight to one agent.

## Where the cost actually lives

These four snippets look like a "fewer lines = better" comparison. They are not.

**Graph-first frameworks make you pay the decomposition cost in code, at design time, in your file.** You write the State schema, you write the edges, you decide the routing. The cost is visible, version-controlled, diffable, and stable: the graph behaves the same on Tuesday as it did on Monday because nothing about it has changed.

**Goal-first frameworks make you pay the decomposition cost at runtime, in tokens, in a coordinator LLM call.** The cost is invisible in your source code but visible in your bill and your trace. A non-trivial `runTeam()` call spends a coordinator turn to plan the DAG, plus a synthesis turn to combine results, before any of your agents do their actual work. Those two extra turns are the overhead: proportionally heavy on a tiny job, shrinking toward noise as the real work grows. Simple goals skip it entirely, through the short-circuit described below.

The graph-first model is more predictable. The goal-first model is more compressive: the line count is lower because the work moved into a place you cannot see. Neither is free.

This is the part most comparisons skip. Picking a framework is not picking a feature set. It is picking where you want the topology cost to live: in your repo or in your API bill.

## Which paradigm fits your work

**Graph-first when the shape of the work is fixed.** A pipeline that runs the same five steps on every record is worth writing once as an explicit graph; goal-first would just rediscover that DAG every run and bill you a coordinator turn for it. Same when you need an audit trail (compliance, legal, medical, finance), where "the coordinator decided to skip step 4 this run" is not an answer and an explicit edge from node 3 to node 5 is. Same, doubly, when the problem is a real state machine: cycles, retries that mutate state, interrupt-and-resume across long pauses; LangGraph.js is the most mature option there. And the most common reason of all, less technical than the rest: if your senior engineers do not yet trust an LLM making the routing call, build graph-first and earn that trust before you hand it over.

**Goal-first when the shape of the work varies.** "Summarize this 3-page contract" and "summarize this 80-page master services agreement" want different sub-tasks; hard-coding the maximum graph and gating it with conditionals is doable but ugly, and a coordinator handles it naturally. It is also the faster paradigm while you are still discovering the decomposition, since changing a sentence-level goal beats redrawing a graph after every user conversation. Once you have several similarly-capable agents, letting a coordinator route between them beats encoding a soft "who does what" call as hard edges. And if your product's value is that it adapts to the user's goal rather than running a fixed automation, you want that planning surface visible, not buried in a graph DSL.

## The Coordinator: what the framework writes for you in goal-first

Goal-first sounds magical when you describe it from outside. From inside, the trick is mundane: it is one well-prompted LLM call.

When you call `runTeam(team, goal)` in open-multi-agent, the orchestrator does this in the `runTeam` method (full source in [`src/orchestrator/orchestrator.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/src/orchestrator/orchestrator.ts), see the JSDoc on the method):

1. A temporary coordinator agent receives the goal and the list of agents on the team, with their names, models, and system prompts.
2. The coordinator is asked to output a JSON array of tasks. Each task has a title, description, assignee (one of the agent names), and an optional `dependsOn` field listing which earlier tasks must complete first.
3. Title-based dependency tokens are resolved to task IDs and the array is loaded into a `TaskQueue`.
4. A scheduler assigns ready tasks to the named agent. The queue's topological dependency resolution (`src/task/queue.ts`) figures out which tasks are unblocked.
5. Independent tasks run in parallel up to `maxConcurrency`. Results are written to shared memory after each task completes, so downstream tasks can read them.
6. After all tasks complete, the coordinator runs once more to synthesize a final answer from the collected outputs.
7. A `TeamRunResult` is returned with per-agent token usage and a total.

There is a short-circuit: if the goal is short and contains no multi-step signals, the orchestrator skips the coordinator and dispatches the goal directly to the best-matching agent. That keeps trivial goals from paying the planning tax.

The cost is genuinely real, and the example here has a sharp edge worth knowing. The two-agent goal in the OMA example above is simple enough that the short-circuit fires: the coordinator never runs, the goal is dispatched straight to a single agent, and for this goal the tax is zero. You pay the planning-plus-synthesis overhead only once a goal is genuinely multi-step, and when you do, it is proportionally heavy on small jobs and minor on large ones. Do not trust a generic number for it: measure your own workload from `result.totalTokenUsage`, because the ratio depends entirely on how large your real agent work is next to the two coordinator turns.

## What goal-first loses on

Now the honest counterweight: where goal-first is the weaker choice.

The clearest cost is tokens. Whenever a goal is complex enough that the coordinator runs, you pay for that planning turn plus a synthesis turn on top of the actual agent work. Putting the coordinator on a cheap model softens that but does not remove it. There is also a subtler cost that grows with the team: every dependent task carries upstream results forward as context, so agents spend tokens re-reading state they did not produce. Ken W Alger aptly named that the ["Prose Tax"](https://dev.to/kenwalger/comment/38e55), and it is the argument for passing explicit, typed results between agents rather than free-form prose.

Then there is control flow. A flat DAG is the natural unit, so anything that is really a state machine (cycles, retry-with-mutation, interrupt-and-resume across long pauses, deeply nested conditionals) can be bent to fit but should not be. If your problem is a state machine, do not pretend it is a DAG.

Debugging is less predictable too. The coordinator can pick a slightly different decomposition between runs, which shifts the output shape. Low temperature, a pinned prompt, and reviewing the plan through the `onPlanReady` hook all help, but none of them are as deterministic as reading a graph file you wrote yourself.

And there is social proof. Graph-first frameworks have shipped at LinkedIn, Klarna, and J.P. Morgan; goal-first is younger in production at that tier, so it is the harder sell in a board-level review today. For a documented case of an LLM-driven routing system hitting these walls and the engineering response, see [Mastra's year of network-to-supervisor](/blog/multi-agent-framework-walls/), traced through its own issue tracker.

## Human-in-the-loop: the bridge to production, already shipped

The path from goal-first as a fast-prototyping paradigm to goal-first as a production paradigm runs through human-in-the-loop, and in open-multi-agent that path is already in place. Two primitives, both shipped, let you put a human between the plan and its execution: the `onPlanReady` hook (a callback that receives the coordinator's task list and returns approve or reject before anything runs) and PlanOnly mode (`runTeam(team, goal, { planOnly: true })`, which returns the plan without executing it, so you can inspect or edit it first).

This is the move that brings goal-first into the same audit story graph-first has had since day one: the planning is still LLM-driven, but the executed plan is human-approved. You get the goal-first benefit (you did not write the topology yourself) and the graph-first guarantee (a human signed off on it).

That is the piece that turns goal-first from a prototyping convenience into something you can defend in a production review. The ergonomics will keep improving, but the load-bearing primitives are available today.

## Decision rubric

Take this as a starting point, not gospel:

| Signal | Lean graph-first | Lean goal-first |
|--------|------------------|-----------------|
| Pipeline shape varies per input | weak | strong |
| Audit trail required | strong | weak |
| Prototyping a new product | weak | strong |
| Team unfamiliar with LLM planning | strong | weak |
| 3+ agents with overlapping skills | weak | strong |
| Cycles or interrupts needed | strong | weak |
| Goals expressed in user language | weak | strong |
| Token cost per run is the bottleneck | strong | weak |

If your signals split, build the first version graph-first. Graph-first is the safer starting place when you cannot tell which way the pendulum goes. You can always swap to goal-first later when you have learned enough to trust the planning. The reverse migration is harder because you have to invent the explicit topology you never wrote down.

## What I'd build first

If you are starting a new TypeScript agent project today and have not picked a framework, I would advise this sequence:

1. Build the first three weeks graph-first in **Mastra workflows**. It is the cleanest TypeScript graph DSL right now and gets you to running in the least surface area.
2. When you find that you are spending most of your time editing the graph rather than the agent prompts, that is the signal your task shape is varying. Try the same task in **open-multi-agent** with a goal sentence and see whether the coordinator's plan matches what you would have written.
3. If the coordinator plan is consistently good, switch your prototype to goal-first. If it is consistently off, you are in graph-first territory and you have just saved yourself a six-month detour.

None of this is provably right; it is what I would tell a friend. The frameworks are not enemies, and which paradigm fits your work matters more than which one wins a feature checklist. Pick the paradigm, and the framework choice mostly follows.

---

**About open-multi-agent.** TypeScript-native multi-agent orchestration framework, MIT-licensed. Goal-first by design, with a coordinator pattern that decomposes a sentence-level goal into a parallel task DAG at runtime. Three runtime dependencies (`@anthropic-ai/sdk`, `openai`, `zod`). The TypeScript-ecosystem answer to CrewAI's role/goal/crew pattern.

Repo: <https://github.com/open-multi-agent/open-multi-agent>. Coordinator implementation: [`src/orchestrator/orchestrator.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/src/orchestrator/orchestrator.ts).

**Related posts.**

- [5 Walls Multi-Agent Frameworks Hit](/blog/multi-agent-framework-walls/): the empirical companion to this taxonomy. One TypeScript framework's year-long migration from LLM-driven routing to a supervisor tree, traced through its issue tracker, is the production evidence behind the goal-first / graph-first split.
