---
title: "检查点与恢复"
description: "在任意 MemoryStore 之上、按需开启的逐次运行快照——持久化任务进度，并在崩溃、中止或重启后用 restore() 恢复。"
---

长时间运行的任务工作流可以持久化自己的进度，并在崩溃、中止或进程重启后恢复。检查点是**需显式开启**的，且完全运行在既有的 [`MemoryStore`](/zh/reference/shared-memory/) 接口之上，因此承载共享内存的那个内存、Redis、Postgres 或自定义后端，同样承载检查点——无需额外的存储层。

它覆盖编排路径（`runTeam`、`runTasks`、`runFromPlan` 和 `restore`）。单次 `runAgent` 调用没有可恢复的东西，不做检查点。

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

// Snapshots are written after each completed task.
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

> **当团队没有共享内存存储时，必须提供 `runId`、`key` 或显式的 `store`。** 实例级的回退存储在该编排器上的每次运行间共享，因此若没有一个区分性的键，两次并发运行会在默认检查点键上互相覆盖。该调用宁可抛错，也不冒静默互踩的风险。

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

**该把 `FileStore` 用作哪个存储。** 优先把它用作*检查点*存储，让共享内存留在快速的 `InMemoryStore` 上（如上）。一个独立的检查点存储会自嵌入共享内存快照（见[保存了什么](#保存了什么)），因此恢复能从这一个文件重建一切——同时持久化 I/O 保持在检查点的节奏（每个完成的任务一次），而不是在每次智能体内存写入时触发。把 `FileStore` 用作 `sharedMemoryStore` 也可行且是持久的，但那样*每一次*共享内存写入都会重写整个文件；只有当共享内存本身必须独立于检查点在重启后存活时，才选用那种方式。

**适用范围。** 一次一个进程——没有跨进程文件锁，因此这不是一个共享数据库。进程*内部*的并发写入会被串行化且是安全的。这与恢复的场景相符，后者本质上是顺序的（进程 A 崩溃，进程 B 恢复）。一个损坏或不可读的状态文件会让存储抛错，而不是静默地从空开始，因此持久化的数据绝不会被悄悄丢弃。

## 恢复

`restore()` 加载最新的检查点，重建任务队列与共享内存，跳过已完成的任务，并运行其余任务。

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

每当一个任务成功完成，编排器就写入一份 `CheckpointSnapshot`：

- **执行标识（schema v2）**——`runId`、当前的 `attempt`、`lastTraceId` 和 `lastRootSpanId`。恢复会保留逻辑 `runId`，递增 `attempt`，创建全新的 trace/root ID，并返回一个指向上一次尝试的 `continued_from` 链接。
- **任务队列状态**——每个任务及其状态分区（pending / in-progress / completed / failed / blocked / skipped）。
- **共享内存**——回合计数器总会被记录。完整的条目快照**仅在检查点存储与团队的共享内存存储不同时**才嵌入。当它们是同一个存储时（`checkpoint: true` 的默认情形），这些条目已经在那里持久化了，因此每个任务都重新嵌入它们会造成在一次长运行中浪费约 O(N²) 的写入量；恢复时改为直接从存储读取它们。无论哪种方式，恢复都能正确地重建共享内存。
- **已完成任务的结果**——每个完成任务的 `taskId`、`assignee` 和 `result`，这样被恢复的智能体能看到先前的输出。

快照以 JSON 形式存储在一个保留命名空间下：`__oma_checkpoint__/<runId>/latest`（未设 `runId` 时为 `__oma_checkpoint__/latest`）。`__oma_checkpoint__/` 下的键是保留的——共享内存的快照 / 恢复会刻意跳过它们，使得一个存储能同时承载智能体内存和检查点。

新的写入使用检查点 schema v2。schema v1 仍可读取：它可选的顶层 `runId` 会被保留，且恢复会把已保存的执行视为第 1 次尝试。一个没有 `runId` 的 v1 检查点会获得一个新的逻辑运行 ID。如果调用方提供的恢复 `runId` 与快照冲突，恢复会抛出一个校验错误，而不是并入不相关的运行。

### 保存是尽力而为的

检查点写入绝不能拖垮它所保护的运行。如果存储拒绝（一次瞬时的 Redis/SQLite 错误），该失败会通过 `onProgress` 暴露出来，运行继续；下一个完成的任务会重试这次写入。

```typescript
const orchestrator = new OpenMultiAgent({
  onProgress(event) {
    if (event.type === 'error' && event.data?.kind === 'checkpoint_save_failed') {
      console.warn('checkpoint write failed, run continues:', event.data.error)
    }
  },
})
```

## 对持久化的机密做脱敏

检查点会**原样**存储已完成任务的结果——对于一个独立的检查点存储，还包括共享内存快照。别处（trace、仪表盘）的脱敏**不会**触及这条路径，因此智能体输出到其答案里的机密会落到磁盘上。要清除它，用 **`RedactingStore`** 包裹持久化存储：

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

脱敏在设计上是按需开启的，并且是有意有损的：一次**恢复的**运行会看到 `[redacted]` 取代被掩码的值。如果某个下游智能体在恢复时确实需要一个持久化的机密，就不要启用它。

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

- **恢复是任务粒度的，不是任务中途的。** 一个在运行中被打断的任务，在恢复时会从头重跑——运行中任务内部、进行中智能体的对话历史不会被持久化。恢复发生在任务边界处。
- **基于快照，而非事件溯源。** 每个检查点覆盖前一个；没有可回放的状态转换日志。

关于上面所述共享内存优化的两点说明：

- 一个*独立的*持久检查点存储（共享内存在存储 X，`checkpoint: { store: Y }`）在每次保存时仍会嵌入完整的内存快照——这是必要的，因为 Y 不持有这些条目的任何其它副本。
- 复用存储的路径不会对共享内存做时间点回滚。默认框架仅在任务完成时写入结果（因此一个崩溃的进行中任务什么也没写），但一个在任务中途向共享内存写入的自定义工具，其那些部分写入在恢复时不会被回滚。

这些作为后续项追踪：[#312](https://github.com/open-multi-agent/open-multi-agent/issues/312)（任务中途恢复）和 [#313](https://github.com/open-multi-agent/open-multi-agent/issues/313)（事件溯源回放）。
