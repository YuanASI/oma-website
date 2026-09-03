---
title: "检查点与恢复"
description: "在任意 MemoryStore 之上、按需开启的逐次运行快照——持久化任务进度，并在崩溃、中止或重启后用 restore() 恢复。"
---

长时间运行的任务工作流可以持久化自己的进度，并在崩溃、中止或进程重启后恢复。检查点是**需显式开启**的，且完全运行在既有的 [`MemoryStore`](/zh/reference/shared-memory/) 接口之上，因此承载共享内存的那个内存、Redis、Postgres 或自定义后端，同样承载检查点——无需额外的存储层。

它覆盖编排路径（`runTeam`、`runTasks`、`runFromPlan` 和 `restore`）。单次 `runAgent` 调用没有可恢复的内容，不做检查点。

检查点 schema v4 还承载[持久化审批门](/zh/reference/durable-approvals/)的挂起续行状态。审批决定以独立的主记录形式存放在同一个存储中；它们不是遥测数据。

## 启用它

按调用传入 `checkpoint`，或通过 `OrchestratorConfig.checkpoint` 为每次运行设默认值。按调用的选项会覆盖配置默认值。

```typescript
import { OpenMultiAgent, Team, InMemoryStore } from '@open-multi-agent/core'

const store = new InMemoryStore() // for durability across restarts, use FileStore (below) or a custom MemoryStore

const team = new Team({
  name: 'research',
  agents: [researcher, writer],
  sharedMemoryStore: store,
})

const orchestrator = new OpenMultiAgent()

// Snapshots are written at safe in-flight boundaries and after completed tasks.
await orchestrator.runTasks(team, tasks, { checkpoint: { store } })
```

`checkpoint: true` 是简写：当团队有共享内存存储时复用它，否则用一个限定在该编排器实例上的私有内存存储。

```typescript
const orchestrator = new OpenMultiAgent({ checkpoint: true }) // default for all runs
```

### `CheckpointOptions`

| 字段 | 类型 | 默认值 | 用途 |
|-------|------|---------|---------|
| `enabled` | `boolean` | `true` | 当配置默认值为开启时，设为 `false` 可对单次运行禁用。 |
| `store` | `MemoryStore` | 团队的共享内存存储 | 检查点记录的持久化后端。 |
| `runId` | `string` | — | 逻辑运行 id；据此派生逐次运行的检查点键。 |
| `key` | `string` | — | 精确的存储键。优先于 `runId`。 |

> **当团队没有共享内存存储时，必须提供 `runId`、`key` 或显式的 `store`。** 实例级的回退存储在该编排器上的每次运行间共享，因此若没有一个区分性的键，两次并发运行会在默认检查点键上互相覆盖。该调用宁可抛错，也不冒静默互相覆盖的风险。

## 持久存储：`FileStore`

`InMemoryStore` 就是一个普通的 `Map`——它随进程一同消亡，因此存放在其中的检查点无法在重启后存活。要开箱即用地获得持久性，请使用内置的 **`FileStore`**：一个零依赖、由文件系统支撑的 `MemoryStore`，它只用 Node 内置模块，不给 core 增加任何运行时依赖。每次写入都是原子落地的——临时文件 → `fsync` → `rename`——因此读取方永远不会看到写了一半的文件，即便遭遇断电，而不仅仅是进程崩溃。

```typescript
import { OpenMultiAgent, Team, InMemoryStore, FileStore } from '@open-multi-agent/core'

const team = new Team({
  name: 'research',
  agents: [researcher, writer],
  sharedMemoryStore: new InMemoryStore(), // hot-path memory stays in RAM
})

const orchestrator = new OpenMultiAgent()

// Checkpoints are durable; a fresh process can resume from the same path.
await orchestrator.runTasks(team, tasks, {
  checkpoint: { store: new FileStore('./.oma/checkpoint.json') },
})
```

**该把 `FileStore` 用作哪个存储。** 优先把它用作*检查点*存储，让共享内存留在快速的 `InMemoryStore` 上（如上）。一个独立的检查点存储会自嵌入共享内存快照（见[保存了什么](#保存了什么)），因此恢复能从这一个文件重建一切——同时持久化 I/O 保持在检查点的节奏（安全的智能体 / 工具边界处，以及完成的任务之后），而不是在每次智能体内存写入时触发。把 `FileStore` 用作 `sharedMemoryStore` 也可行且是持久的，但那样*每一次*共享内存写入都会重写整个文件；只有当共享内存本身必须独立于检查点在重启后存活时，才选用那种方式。

**适用范围。** 一次一个进程——没有跨进程文件锁，因此这不是一个共享数据库。进程*内部*的并发写入会被串行化且是安全的。这与恢复的场景相符，后者本质上是顺序的（进程 A 崩溃，进程 B 恢复）。一个损坏或不可读的状态文件会让存储抛错，而不是静默地从空开始，因此持久化的数据绝不会被悄然丢弃。

## 恢复

`restore()` 加载最新的检查点，重建任务队列与共享内存，跳过已完成的任务，并运行其余任务。如果内置 LLM 运行器在任务中途停止，恢复还会在继续之前重新载入它已完成的轮次、token 用量与工具调用状态。

```typescript
// After a crash/restart: same team wiring, same store.
const resumedTeam = new Team({
  name: 'research',
  agents: [researcher, writer],
  sharedMemoryStore: store,
})

const result = await orchestrator.restore(resumedTeam, { checkpoint: { store } })
```

一次恢复的 `runTeam` 运行会重新执行协调器综合，因此你会得到和全新 `runTeam` 相同的、综合出的最终答案（位于 `result.agentResults.get('coordinator')`），而不只是各任务的原始输出。要重新提供你最初使用的协调器配置——检查点无法持久化一个活动的 adapter：

```typescript
const result = await orchestrator.restore(resumedTeam, {
  checkpoint: { store },
  coordinator: { provider: 'anthropic', model: 'claude-sonnet-4-6' }, // same as the original runTeam
})
```

如果综合无法运行（没有可用的协调器配置或凭据）或综合调用失败，恢复是尽力而为的：它返回各任务的原始输出，不带 `'coordinator'` 条目，并发出一个 `onProgress` 的 `synthesis_failed` 事件。`runTasks` / `runFromPlan` 运行从不综合。

如果找不到检查点，`restore()` 会回退为对你传入的任务或计划做一次正常运行——因此同一个调用对首次运行和恢复都适用：

```typescript
// Fresh store → runs all tasks. Existing checkpoint → resumes, skipping done tasks.
await orchestrator.restore(team, tasks, { checkpoint: { store } })
await orchestrator.restore(team, plan,  { checkpoint: { store } })  // PlanArtifact
await orchestrator.restore(team,        { checkpoint: { store } })  // resume-only, no-op on empty store
```

## 保存了什么

在每个安全的运行中（in-flight）运行器边界处，以及每个任务成功完成之后，编排器都会写入最新的 `CheckpointSnapshot`：

- **执行标识（schema v4 及以后）**——`runId`、当前的 `attempt`、`lastTraceId` 和 `lastRootSpanId`。恢复会保留逻辑 `runId`，递增 `attempt`，创建全新的 trace/root ID，并返回一个指向上一次尝试的 `continued_from` 链接。
- **任务队列状态**——每个任务及其状态分区（pending / in-progress / completed / failed / blocked / skipped）。
- **共享内存**——回合计数器总会被记录。完整的条目快照**仅在检查点存储与团队的共享内存存储不同时**才嵌入。当它们是同一个存储时（`checkpoint: true` 的默认情形），这些条目已经在那里持久化了，因此在每个安全边界都重新嵌入它们，会在一次长运行中造成浪费的写入量；恢复时改为直接从存储读取它们。无论哪种方式，恢复都能正确地重建共享内存。
- **已完成任务的结果**——每个完成任务的 `taskId`、`assignee`、原始 `result`
  与 JSON-safe 的 `AgentRunResult`。这样可保留任务级 `structured`、规范化状态 /
  错误详情、token 用量、工具调用和消息，让恢复后可以重建
  `TeamRunResult.taskResults`。仅限进程内的原始 `error` 对象不会持久化。如果调用方
  添加的结果数据无法 JSON 序列化，以 checkpoint 持久性为先：该任务的完整结果会被
  省略，恢复时重建旧版最小结果。
- **运行中的运行器状态**——对每个活动的内置 LLM 工作智能体：完整的模型对话、
  该任务产出的消息、已完成的轮次计数、token 用量、工具调用记录、下一个恢复阶段，
  以及任何待执行的工具调用。工具结果按模型下发的工具调用 ID 各自独立提交，因此
  一个并行轮次里可能同时包含可回放的结果和仍需执行的调用。模型可见的图像 / 文件类
  工具结果属于这些消息的一部分：内联的 base64 会嵌入检查点 JSON，而 URL 引用则按
  URL 存储。应用自有的 `ToolResult.data` 不属于对话，除非应用另行把它放进去。
- **审批续行状态**——精确的待决审批请求，以及本次逻辑运行已经消费掉的决定。
  权威的请求 / 决定记录单独存放在 `__oma_approval__/<requestId>` 之下，并在恢复时
  与检查点相互核对。
- **任务交接 / 来源配置**——`dependencyPayload`、逻辑 `role` 与已校验的任务
  `metadata` 会保留在队列快照中，因此恢复后的消费者使用与原运行相同的数据流和
  trace 引用。
- **日志水位线（仅 schema v5）**——`journalWatermarkSeq`，即这份快照所折叠的最高
  [运行事件日志](/zh/reference/run-journal/)序号，外加一个用于说明后端的
  `journalRef`。每个运行中条目也各自携带自己的 `journalSeq`。仅当该次运行启用了
  日志时才存在；见[尾部重放](#尾部重放)。

快照以 JSON 形式存储在一个保留命名空间下：`__oma_checkpoint__/<runId>/latest`（未设 `runId` 时为 `__oma_checkpoint__/latest`）。`__oma_checkpoint__/` 与 `__oma_approval__/` 下的键都是保留的——共享内存的快照 / 恢复会刻意跳过它们，使得一个存储能同时承载智能体内存、检查点与主审批记录。

带日志的运行写入检查点 schema v5；不带日志的运行仍完全照旧写 v4，因此启用日志是唯一会改变 schema 的因素。schema v1 到 v4 仍可读取；v1 与 v2 不含运行中的运行器状态，因此它们的活动任务从任务边界恢复。schema v3 保留了任务中途的工具恢复，但没有持久的审批续行。一个 v1 检查点可选的顶层 `runId` 会被保留，且恢复会把已保存的执行视为第 1 次尝试。一个没有 `runId` 的 v1 检查点会获得一个新的逻辑运行 ID。如果调用方提供的恢复 `runId` 与快照冲突，恢复会抛出一个校验错误，而不是并入不相关的运行。

### 尾部重放

快照写在安全边界上，因此两个边界之间发生的一切会在崩溃时丢失——代价最高的，是一个已经运行并返回、但其结果从未被持久化的工具。当向 `restore()` 提供了运行事件日志**且**快照是 v5 时，恢复会回放快照尚未包含的那部分日志，并在继续之前把这些事件折叠进运行中状态。实际效果，是把「重新执行那次工具调用」变成「回放它已记录的结果」。

**每个任务按自己的水位线折叠，而不是快照的水位线。** 快照只在某个任务自己的边界处刷新该任务的运行中条目，因此当 `maxConcurrency` 大于 1 时，快照可能在另一个任务处于某一轮中途时被写入：那个条目于是比 `journalWatermarkSeq` 陈旧许多个事件。因此每个条目都携带自己的 `journalSeq`——该任务中序号小于等于它的事件都已在条目里，大于它的都不在——而回放窗口从最陈旧的那个条目开始。已被另一个任务吸收的事件会被识别并跳过，而不是重复应用。没有 `journalSeq` 的条目（写于该字段存在之前）会回退到快照级的水位线，这样是安全的，只是折叠得更少。

这种折叠刻意保持狭窄。它**只**折叠运行中的运行器状态：追加到对话里的 assistant 与 user 消息、来自 `turn/end` 的轮次计数、来自 `tool/call` 的待执行调用，以及来自 `tool/result` 的已提交结果。它**不会**折叠 `task/status`、`memory/set`，也不会折叠 `approval/request` / `approval/decision`——队列、共享内存存储与持久审批账本各自已经是这些内容的权威来源，为它们再加一个真相来源只会带来分歧，而不是恢复能力。

折叠是防御性的。一个事件必须点名快照正在恢复的某个任务（同时匹配任务**与**执行者，因此被委派的子智能体的事件绝不会落进父任务的状态），必须以仅追加的方式延长日志，必须由它所依赖的状态锚定——一次工具调用由请求它的那条 assistant 轮次锚定，一条工具结果消息由一个尚未闭合的轮次锚定——并且要留下一个运行器确实能从中恢复的状态。只要有任何一个事件没通过这些检查，**整条**尾部都会被丢弃，并发出一个代码为 `JOURNAL_TAIL_DISCARDED` 的 `onProgress` 警告，运行仅从快照恢复——这正是今天的行为。快照始终是恢复的锚点；尾部是对其粒度的增强，绝不是替代。

```typescript
const orchestrator = new OpenMultiAgent({
  onProgress(event) {
    if (event.type === 'warning' && event.data?.code === 'JOURNAL_TAIL_DISCARDED') {
      console.warn('journal tail rejected, resuming from the snapshot:', event.data.reason)
    }
  },
})
await orchestrator.restore(team, { checkpoint: { store }, journal })
```

一份 v5 快照还会为它的对话携带按块的日志来源信息，因此一次恢复的运行仍能解释模型看到的每个块从何而来。没有它，恢复后的对话将无法解释——每个块都会是一处空缺。

### 保存是尽力而为的

一次普通的检查点写入绝不能拖垮它所保护的运行。如果存储拒绝（一次瞬时的 Redis/SQLite 错误），该失败会通过 `onProgress` 暴露出来，运行继续；下一个安全的运行器边界或完成的任务会重试这次写入。

挂起是例外：在精确的待决边界被保存下来之前，OMA 无法返回一个可恢复的审批请求。那次保存是严格的，并且失败即关闭。见[持久化审批](/zh/reference/durable-approvals/#拒绝与恢复语义)。

[运行事件日志](/zh/reference/run-journal/)的追加遵循同样的约定，且没有任何例外：一次失败的追加会被报告并丢弃，绝不升级为错误。这正是为什么日志在恢复时只能延长一份快照、而永远不能取代它——一份被允许缺失的记录，不能充当恢复的锚点。

```typescript
const orchestrator = new OpenMultiAgent({
  onProgress(event) {
    if (event.type === 'error' && event.data?.kind === 'checkpoint_save_failed') {
      console.warn('checkpoint write failed, run continues:', event.data.error)
    }
  },
})
```

## 对持久化的密钥脱敏

检查点会**原样**存储已完成任务的结果与运行中的运行器状态——包括结构化值、消息、
工具输入 / 结果与工具调用记录；对于独立的 checkpoint store，还包括共享内存快照。
任务 metadata 有自己的校验和凭据脱敏边界，但 Agent 产生的结果没有。别处（trace、仪表盘）的脱敏**不会**触及这条路径，
因此智能体输出到答案中的密钥会落到磁盘上。要清除它，用
**`RedactingStore`** 包裹持久化存储：

```typescript
import { RedactingStore, FileStore } from '@open-multi-agent/core'

await orchestrator.runTasks(team, tasks, {
  checkpoint: { store: new RedactingStore(new FileStore('./.oma/checkpoint.json')) },
})
```

`RedactingStore` 会在写入时、在存储边界处对值做脱敏，因此它通过同一个原语覆盖了**两条**持久化路径：

- 包裹**检查点存储**（如上），以清除检查点自身的结果以及任何嵌入的共享内存快照。
- 包裹**共享内存存储**（`sharedMemoryStore: new RedactingStore(...)`），以清除 `<agent>/<key>` 条目。在默认的 `checkpoint: true` 复用情形下，检查点存储*就是*那个存储，因此一次包裹即可同时清除两者。

要包裹**你持久化写入的每一个持久存储**：在一个拆分的设置里——已包裹的共享存储、独立的*未包裹*检查点存储——检查点的 `completedTaskResults`（来自队列，而非存储）仍会是原始的。可通过 `new RedactingStore(store, { patterns: [/…/] })` 添加自定义的值模式（例如 PII）。

脱敏在设计上是按需开启的，并且是有意有损的：一次**恢复的**运行会看到 `[redacted]` 取代被掩码的值。如果某个下游智能体在恢复时确实需要一个持久化的密钥，就不要启用它。

同样的有损性，使 `RedactingStore` 不适用于持久化审批——审批的哈希必须绑定原样的受审内容。它刻意不暴露 `compareAndSet`，因此一个挂起决定会在 OMA 报出待决请求之前就失败即关闭。这类运行请使用一个受保护、不做脱敏的检查点 / 审批存储。

## 任务中途的工具恢复

对内置的 LLM 运行器来说，一次工具使用轮次会跨越三个持久化边界：

1. assistant 消息与每个被请求的工具调用，在工具执行之前保存。
2. 每个返回的 `ToolResult` 作为按调用的提交记录单独保存。
3. 一旦所有调用都已提交，它们的结果块会作为下一条 user 消息保存，模型从随后的轮次继续。

恢复时，已提交的结果会被原样回放——包括正常的错误结果——不会再次调用该工具。没有提交记录的调用会被保守地运行。并行的工具调用彼此独立：一个已提交的结果不会迫使一个缺失的兄弟调用被跳过，也不会让一个已提交的兄弟调用运行两次。已完成的轮次计数与累计的 token 用量也会一并恢复，因此 `maxTurns` 与 token 预算不会从零重新开始。

每个工具都会收到模型下发的调用 ID，作为 `context.toolCallId`。OMA 会持久化该 ID，并在恢复后运行一个缺失的调用时复用它。一个有实际后果的工具可以把它作为幂等键传给外部系统：

```typescript
import { defineTool } from '@open-multi-agent/core'
import { z } from 'zod'

const charge = defineTool({
  name: 'charge',
  description: 'Create a charge.',
  inputSchema: z.object({ amount: z.number() }),
  execute: async ({ amount }, context) => {
    const idempotencyKey = [context.runId, context.taskId, context.toolCallId]
      .filter(Boolean)
      .join(':')
    const result = await payments.charge({ amount, idempotencyKey })
    return { data: JSON.stringify(result) }
  },
})
```

这个键之所以重要，是因为 OMA 无法把一个任意的外部副作用和一次 `MemoryStore.set()` 变成一个跨系统事务。如果进程在外部服务提交之后、但在工具返回并且它的检查点写入成功之前死掉，快照仍会显示结果缺失，恢复会再次运行该调用。对重复执行不安全的操作，请使用 `toolCallId`（或另一个领域幂等键）。内置的 `FileStore` 让每次本地快照写入都是原子的，但它无法关闭那个外部事务窗口。

## 进阶：`Checkpoint` 类

为了直接检视或管理检查点，管理器与键辅助函数都已导出：

```typescript
import {
  Checkpoint,
  checkpointKey,
  isCheckpointKey,
  CHECKPOINT_KEY_PREFIX,
  DEFAULT_CHECKPOINT_KEY,
} from '@open-multi-agent/core'

const cp = new Checkpoint(store, { runId: 'nightly-2026-06-18' })
const snapshot = await cp.loadLatest() // CheckpointSnapshot | null
await cp.delete()                      // drop the persisted checkpoint
```

## 局限

在 `MemoryStore` 之上的逐次运行快照 / 恢复。它*尚未*做到的：

- **基于快照，而非事件溯源。** 每个检查点覆盖前一个。启用[运行事件日志](/zh/reference/run-journal/)会在最新快照之后补上一段可回放的尾部（[尾部重放](#尾部重放)），但快照仍是锚点，而恢复从不要求有日志。
- **外部智能体后端仍是任务粒度的。** 进程与 ACP 后端拥有自己的循环，因此 OMA 无法持久化它们私有的任务中途对话或工具状态。
- **可挂起的工具关卡需要内置 LLM 运行器。** 独立智能体、简单目标短路路径与外部后端在遇到工具的 `suspend` 决定时会失败即关闭，因为它们没有可恢复的私有工具循环状态。
- **只有运行器的工具结果有按调用的提交记录。** 应用钩子、自定义上下文策略回调，以及在收到响应前被打断的 LLM 请求，都可能从上一个安全边界重新运行。

关于上面所述共享内存优化的两点说明：

- 一个*独立的*持久检查点存储（共享内存在存储 X，`checkpoint: { store: Y }`）在每次保存时仍会嵌入完整的内存快照——这是必要的，因为 Y 不持有这些条目的任何其它副本。
- 复用存储的路径不会对共享内存做时间点回滚。一个在任务中途向共享内存写入的自定义工具，会把那次写入留在被复用的存储里；请对它采用与任何其它外部副作用相同的幂等纪律。

仅追加的状态转换回放已作为按需开启的[运行事件日志](/zh/reference/run-journal/)交付（[#527](https://github.com/open-multi-agent/open-multi-agent/issues/527)），它带来了上文所述的尾部重放，并让 `verifyRun()` 能离线审计一次已完成的运行。此前那个用它彻底取代快照的提案（[#313](https://github.com/open-multi-agent/open-multi-agent/issues/313)）维持关闭：快照仍是恢复的锚点。
