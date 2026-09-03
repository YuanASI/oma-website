---
title: "运行事件日志"
description: "按需开启的仅追加日志，记录哪些内容进入了上下文、哪些工具运行过、计划如何变化——「模型为什么会看到这些」的审计轨迹。"
---

运行日志是一次运行内部所发生之事的仅追加记录：哪些消息进入了对话、模型实际看到了哪些块、哪些工具运行过以及它们返回了什么、某个上下文策略用什么替换了它们、计划与任务状态如何流转，以及检查点落在了哪里。它回答另外三种记录都回答不了的一个问题——**模型为什么会看到这些？**

它是**按需开启、默认关闭**的，关闭时不产生任何成本：不分配记录器，不收集重写元数据，每个发出点都有守卫，因此一次没有日志的运行，其行为与该能力从未存在时完全一致——连检查点仍写 schema v4 这一点也一样。

日志不是恢复机制。[检查点快照](/zh/reference/checkpoint/)仍是持久的恢复锚点；日志在它们之外补上一条审计轨迹，并在恢复时补上最后一份快照之后的一段可回放尾部。

## 启用它

按调用传入一个后端，或通过 `OrchestratorConfig.journal` 为每次运行设默认值。按调用的取值会覆盖配置默认值，而 `journal: false` 会为单次运行禁用它。

```typescript
import { OpenMultiAgent, Team, InMemoryRunJournal } from '@open-multi-agent/core'

const journal = new InMemoryRunJournal()
const orchestrator = new OpenMultiAgent()

await orchestrator.runTasks(team, tasks, { journal })

for (const event of await journal.readFrom(0)) {
  console.log(event.seq, event.type)
}
```

你总是要自己提供那个实例，因为一份没人能读回的日志毫无用处。这里刻意没有 `journal: true` 这样的简写，而且框架从不对你的后端调用 `close()`——它的生命周期由你掌管，正如 `MemoryStore` 由你掌管一样。

`runAgent`、`runTeam`、`runTasks`、`runFromPlan` 与 `restore` 都接受 `journal`。`RestoreOptions` 从 `RunTasksOptions` 继承该字段。

### `RunJournalOptions`

常见情形直接传一个裸后端；需要那些开关时再传选项对象：

| 字段 | 类型 | 默认值 | 用途 |
|-------|------|---------|---------|
| `journal` | `RunJournal` | — | 后端。必填。 |
| `enabled` | `boolean` | `true` | 设为 `false` 可在保留该字段的同时禁用。 |
| `enforceLineage` | `boolean` | `false` | 遇到无法解释的模型可见块时抛错，而不是记录下来。见[来源追溯与模型可见边界](#来源追溯与模型可见边界)。 |

```typescript
await orchestrator.runTasks(team, tasks, {
  journal: { journal, enforceLineage: true },
})
```

## 后端

`RunJournal` 是一个小巧的仅追加接口，刻意与 `MemoryStore` 分开：`MemoryStore` 是键值形态的，而 `FileStore` 每次写入都重写整个文件，因此若通过它们中的任何一个为每次模型调用追加一个事件，单个事件的代价将是 O(存储大小)。

```typescript
interface RunJournal {
  append(events: readonly RunEvent[]): Promise<void>
  readFrom(seq: number): Promise<RunEvent[]>
  close(): Promise<void>
  /** Optional. Recorded in a v5 checkpoint as `journalRef`, informational only. */
  describe?(): RunJournalRef  // { kind: string; path?: string }
}
```

### `InMemoryRunJournal`

一个有界的环形缓冲区，用于在一个进程内审计一次运行。`maxEvents` 默认为 10 000；淘汰会丢弃最旧的事件，因此 `readFrom` 返回的是保留下来的尾部，而不是整次运行。它暴露 `size`。

```typescript
const journal = new InMemoryRunJournal({ maxEvents: 50_000 })
```

### `JsonlRunJournal`

一个零依赖的 JSONL 文件——每行一个事件，仅追加，只用 Node 内置模块。

```typescript
import { JsonlRunJournal } from '@open-multi-agent/core'

const journal = new JsonlRunJournal('./.oma/run.jsonl', { flushIntervalMs: 50 })
try {
  await orchestrator.runTasks(team, tasks, { journal })
} finally {
  await journal.close() // flushes the open batch and closes the fd
}
```

- **带固定截止时间的批量刷写。** 第一个待写事件打开这个窗口；后续事件不会重置它。一阵密集的轮次只需一次写入，而不是每个事件一次；而一次安静的运行仍会在 `flushIntervalMs`（默认 50 毫秒）内落盘。
- **每批一次写入，随后 `fsync`。** 读取方看到的总是完整记录，绝不会是半条。
- **崩溃窗口 = 当前尚未刷写的那一批。** 直到最后一个完成批次为止的内容都已在磁盘上。`close()` 会刷写其余部分。
- **`readFrom` 容忍一行末尾的不完整记录**，那正是写入中途崩溃所留下的东西。其它位置的损坏会抛错，而不是静默丢弃事件。
- **每个文件一个写入者，没有跨进程锁**——与 `FileStore` 所声明的适用范围相同。

脱敏使用与 [`RedactingStore`](/zh/reference/shared-memory/) 相同的选项形状，并在写入时生效，因此 `readFrom` 返回的就是被持久化下来的内容：

```typescript
new JsonlRunJournal('./.oma/run.jsonl', { redact: { patterns: [/\bcust-\d+\b/g] } })
```

## 事件词汇表

每个事件都携带 `seq`（从 1 开始，按 `runId` 跨尝试严格递增）、`timestampUnixMs`、`runId`、`attempt`，以及在适用时的 `taskId`、`agentName`、`traceId`/`spanId` 与 `sourceEventSeqs`。

| `type` | 基础字段之外的负载 | 何时发出 |
|---|---|---|
| `run/start` | `mode`、`goal?`、`metadata?` | 一次运行开始时，每个入口点一次 |
| `run/end` | `status`、`error?` | 该运行的 trace 关闭时，覆盖每条退出路径 |
| `plan/set` | `revision`、`source`、`tasks`、`detail?` | 一份计划被载入（`'initial'`）或被修复（`'recovery'`） |
| `task/status` | `status`、`reason?` | 一个任务转入 `in_progress`、`completed`、`failed` 或 `skipped` |
| `turn/start` | `turn` | 一个模型轮次开启 |
| `turn/end` | `turn`、`outcome` | 一个模型轮次关闭，并附上原因 |
| `user/message` | `message`、`origin` | 一条 user 角色的消息进入对话 |
| `assistant/message` | `message`、`origin`、`usage?`、`model?`、`stopReason?` | 一条 assistant 消息进入对话 |
| `llm/request` | `turn`、`model`、`blocks`、`systemPromptHash?`、`toolsHash?` | 紧接在一次适配器调用之前 |
| `tool/call` | `call` | 模型请求了一个工具，在执行之前 |
| `tool/result` | `toolCallId`、`result`、`record?`、`delegationUsage?` | 一个工具结果被提交 |
| `context/replace` | `strategy`、`dropped?`、`replacements`、`detail?` | 一个上下文策略重写了对话 |
| `memory/set` | `agent`、`key`、`valueBytes?` | 一个任务结果被写入共享内存 |
| `approval/request` | `request` | 一个持久审批边界被持久化 |
| `approval/decision` | `decision` | 一个持久决定被核对或做出 |
| `checkpoint/saved` | `mode`、`version`、`watermarkSeq` | 一份快照被持久化 |

`sourceEventSeqs` 的约定：一条 `assistant/message` 点名它的 `llm/request`；一个 `tool/call` 点名它的 `assistant/message`；一个 `tool/result` 点名它的 `tool/call`；一条 `origin: 'tool_results'` 的 `user/message` 点名被组装进它的那些 `tool/result` 事件；一个由上下文策略派生出的块，点名承载它的那个 `context/replace` 事件。

**`task/status` 记录四种状态，而不是六种。** `pending` 与 `blocked` 这两种起始状态已由 `plan/set` 承载，因此日志不再重复它们。终态转换取自任务队列而非派发循环，这正是为什么级联失败与跳过——那些任何派发点都看不到的转换——也会出现在日志里。

**`checkpoint/saved.watermarkSeq`** 点名该快照所折叠的最后一个事件，它是在快照被构建时捕获的，而不是在存储写入之后，因此写入期间并发任务的追加无法把它抬高。一次带日志的运行写入[检查点 schema v5](/zh/reference/checkpoint/#尾部重放)，其中持久化了同一个水位线；不带日志的运行仍写 v4。

### `context/replace`

上下文策略会破坏性地重写对话，而这正是让那次重写保持可审计的事件：

```typescript
{
  type: 'context/replace',
  strategy: 'summarize',
  dropped: { sourceEventSeqs: [/* blocks removed with nothing in their place */] },
  replacements: [{ sourceEventSeqs: [12, 14], block: { type: 'text', text: '[Conversation summary]…' } }],
  detail: { summaryModel: 'claude-haiku-4-5', usage: { input_tokens: 900, output_tokens: 60 } },
}
```

每次应用策略产生一个事件。每条替换项都**原样**存储派生出的块，而不是存成「如何重建它」的描述，这正是让可复现性成为一次字节比较、而非一次重新执行的原因：一个点名了该事件的请求块，只要该事件携带一个与它相等的块（按内容匹配，而非按位置）就算通过。逐策略的行为在[上下文管理](/zh/reference/context-management/#审计策略替换了什么)中列成了表格。

### 覆盖范围

日志沿用标准的运行器管路，因此它覆盖 `runAgent`、协调器的分解与综合、`runTeam` 的短路运行、工作任务，以及被委派的子运行。被委派的对话在同一任务作用域内以自己的 `agentName` 记入日志，并交织成一条有序的流——对于一次同时有多个智能体在跑的运行来说，这才是正确的读法。

本版本中未记入日志的有：`runConsensus` 与按任务的共识裁判、语义化执行路由器的画像器，以及编排器的决策事件（`routing/decision`、`consensus/verdict`、`recovery/decision`）。计划修复仍会以 `source: 'recovery'` 的 `plan/set` 形式落盘。

## 来源追溯与模型可见边界

**模型可见边界，是交给 `adapter.chat()` / `adapter.stream()` 的那份 IR 对话（`LLMMessage[]`）。** 它之下的一切——提供方的线缆格式、推理回传与降级规则、`preserveReasoningAsText`——都是按适配器确定的，不在本范围内。系统 prompt 与工具定义属于调用方提供的配置，而不是对话状态，因此 `llm/request` 记录的是 `systemPromptHash` 与 `toolsHash`，而不是它们的字节。

`llm/request` 不存储对话本身。对话每一轮都会被重新发送，因此原样存储会让日志随轮次数量的平方增长。它为每个块存储一个描述符：

```typescript
interface RequestBlockDescriptor {
  messageIndex: number
  blockIndex: number
  role: 'user' | 'assistant'
  blockType: ContentBlock['type']
  sourceEventSeqs: readonly number[] | null  // null = no recorded lineage
  contentHash: string                        // sha256 of canonical JSON
}
```

来源追溯以**块的身份**为键，而不是消息的身份：上下文策略会重建消息对象，但把未被触碰的块按引用透传，因此在一次重写中，块的身份得以存续，而消息的身份不能。`canonicalContentHash` 是导出的，因此一个离线读取方可以从冷读自磁盘的日志中重算出同一个摘要。

### `enforceLineage`

在 `enforceLineage: false`（默认）下，一个来源从未被记录过的块，会按它本来的样子——一处空缺——写下：`sourceEventSeqs: null`。在 `enforceLineage: true` 下，它会在适配器调用之前、恰好在那个本会把它掩盖过去的请求处，抛出 `JournalLineageError`（`code: 'MISSING_CONTEXT_REPLACE'`，并携带 `messageIndex`、`blockIndex` 与 `blockType`）。该错误对编排器的重试而言是终态的——同一份对话在每次尝试中都会以同样的方式失败。

**`enforceLineage: true` 在每种内置上下文策略下都能通过。** `sliding-window`、`summarize`、`compact`、`compressToolResults` 与自定义策略，各自都会发出一个点名了其派生块的 [`context/replace`](#contextreplace)，因此一份被重写过的对话仍然可解释，而不会变成一堵由空缺砌成的墙。

**恢复后的运行同样保留其来源追溯。** 一次从 v5 检查点恢复的运行，不会重新发出上一次尝试已记入日志的对话——那会重复那些序号所指向的事件。取而代之的是，快照按位置携带逐块的来源信息，恢复时把它重新挂回解析出的块上；而日志在快照水位线之后记录的任何事件，会连同它们自己的来源一起被折叠进来。见[尾部重放](/zh/reference/checkpoint/#尾部重放)。从 v4 或更早的快照恢复时，没有可重新挂回的持久来源，因此那些块会按它们本来的样子——空缺——被记录下来；而 `enforceLineage: true` 会让这样一次恢复失败，这是正确的。

还有一处空缺，在它存在期间值得点名：

- **结构化输出的修复重试。** `outputSchema` 背后的纠正性重试是第二段模型可见的对话，因此它也被当作一段来记入日志：它的消息会被重新注入，而不是与第一次尝试做去重。

## 校验一份日志

`enforceLineage` 是一项进程内检查，而它至多只能记录运行器所知道的东西：一个块要么点名了它的来源事件，要么什么也没点名。运行器没有办法记录一个*错误的*来源。`verifyRun()` 对一份冷读回来的日志提出更难的问题——一个块所点名的那个事件，真的能逐字节地复现出这个块吗？

```typescript
import { verifyRun, JsonlRunJournal } from '@open-multi-agent/core'

const result = await verifyRun(new JsonlRunJournal('./.oma/run.jsonl'))
if (!result.ok) {
  for (const failure of result.failures) console.error(failure.code, failure.detail)
}
```

它接受一个 `RunJournal`（用 `readFrom(0)` 读取一次），或你手上已有的事件（`{ events }`），除此之外是纯函数。它面向测试、CI 闸与事后复盘，而不是热路径。

三种判定结果，刻意彼此区分：

| 判定 | 含义 |
|---|---|
| `failures` | 日志自相矛盾。当且仅当它非空时，`ok` 为 `false`。 |
| `inconclusive` | 日志无法回答，因为被点名的事件不在可读窗口内。不计入该次运行的负面结论。 |
| `stats` | `events`、`requests` 与 `blocksChecked`，从而让一个 `ok` 判定说明它是基于多少内容得出的。 |

各项检查按固定顺序运行，因此一份本身就不是连贯流的日志，会在被追问内容之前先把这一点说出来：

- **序列完整性。** 重复或倒退的序号是 `SEQ_NOT_MONOTONIC`。一处*向前的空档*不算失败：有界日志会淘汰它的头部，而尽力而为的追加可能丢掉一整批。
- **引用完整性。** 一个 `sourceEventSeqs` 条目若大于等于引用它的那个序号，就永远无法解析，因此是 `BROKEN_LINK`。仅仅是缺失的那种，属于下文的窗口空缺。
- **逐块可复现性。** 对每个 `llm/request` 的每个块：`sourceEventSeqs: null` 会以 `MISSING_CONTEXT_REPLACE` 失败，`reason: 'no-lineage'`。当某个承载消息的事件包含一个块，其 [`canonicalContentHash`](#来源追溯与模型可见边界) 等于所记录的 `contentHash`，或某个 `context/replace` 事件携带的替换项哈希到它时，一条被点名的来源即算通过。除此之外都是 `MISSING_CONTEXT_REPLACE`，`reason: 'not-reproducible'`——用同一个代码，是因为两者是同一处窟窿，而 reason 才是区分它们的东西。

最后那个区分正是这项检查的要点。一次静默替换了对话的重写，仍然会*点名*先前的事件，因此一个只追问「来源是否存在」的判定条件会接受它。要求被点名的事件复现出那些字节，才使得一次未被记录的重写在结构上可被发现，而不是只有完整重放才能察觉。

### 什么会落入 `inconclusive`

当窗口无法作出判断时，会连同它所点名的事件一起记录下一处空缺：

- 一个 `InMemoryRunJournal` 淘汰了某个仍被保留请求所引用的事件。
- 一次尽力而为的追加丢掉了一批，留下一个后续事件所指向的窟窿。
- 一次恢复的尝试拿到的是一份全新的日志，而不是更早那次尝试写入的那一份，因此它由检查点恢复出的来源，点名了这个文件从未持有过的序号。

一个块只要能从被点名事件中的某一个复现出来，即便另一个缺失也算通过。当它无法从*现有*的任何事件复现、但确有某个被点名的事件缺失时，判定是 inconclusive 而不是失败，因为那个缺失的事件本可能正是承载它的那一个。只有当每个被点名的事件都可得、且没有一个匹配时，才会断言不可复现。

### 它不能证明什么

- **它是一次来源审计，不是 schema 校验器。** 轮次不会被配对，`run/start` 与 `run/end` 不是必需的，上表中的 `sourceEventSeqs` 约定也不被强制。一份来自崩溃运行的日志——有一个未闭合的 `turn/start`、没有 `run/end`——照常通过校验。
- **它校验的是窗口，不是整次运行。** 被淘汰掉的一切都未经检查，这正是 `stats` 与 `inconclusive` 的用途。
- **脱敏与字节级可复现性彼此拉扯。** `contentHash` 在进程内计算，早于 `JsonlRunJournal` 在写入时的脱敏。一个模式如果重写了模型确实看到过的块，被持久化的事件就不再能复现它，于是 `verifyRun` 会对本来记录正确的内容报出 `not-reproducible`。没有被任何模式触碰的块不受影响，因此一份经过脱敏的日志至多只能部分通过校验。

一个 `oma verify-run` 的 CLI 命令已在计划中，且刻意尚未构建；目前导出的这个函数就是全部接口面。

## 带日志恢复

把崩溃那次尝试所写入的同一份日志传给 `restore()`，恢复的粒度就能细过最后一个安全边界：

```typescript
const journal = new JsonlRunJournal('./.oma/run.jsonl')
await orchestrator.restore(team, { checkpoint: { store }, journal })
```

快照仍是恢复所锚定的东西。在它之上，恢复会回放快照尚未包含的那部分日志，并折叠它找到的运行中运行器事件——最有用的，是一个在快照从未捕获的窗口里运行并返回过的工具，它于是被当作数据回放，而不是再执行一次。任务状态、内存写入与审批刻意不被折叠；它们各自已经有自己的持久记录。一条与快照不相容的尾部会被整条丢弃，并发出一个 `onProgress` 警告，运行会完全按照没有日志时的方式恢复。[检查点与恢复](/zh/reference/checkpoint/#尾部重放)给出了精确的折叠范围与那些防御性检查。

「快照已经包含什么」是按任务决定的，不是按快照决定的。一份 v5 快照只在某个任务自己的边界处刷新它的运行中条目，因此当并发度大于 1 时，一个条目可能比快照的 `journalWatermarkSeq` 陈旧许多个事件。每个条目都记录自己的 `journalSeq`，回放窗口从最陈旧的那个打开，而已被另一个任务吸收的事件会被识别并跳过，而不是折叠两次。

序号跨尝试连续，因此一次逻辑运行即便被恢复过好几次，读起来仍是一条流。一次恢复的尝试从两者中较大的那个开始编号：日志自己的尾部，或快照的水位线——当传给 `restore()` 的日志是一个全新文件、而不是崩溃时那一份时，后者就有意义了。

## 写入是尽力而为的

一次失败的追加会通过 `onProgress` 按次报告一次，且从不使该运行失败：

```typescript
new OpenMultiAgent({
  onProgress(event) {
    if (event.type === 'error' && (event.data as { kind?: string }).kind === 'journal_append_failed') {
      metrics.increment('oma.journal.append_failed')
    }
  },
})
```

这在审批边界处同样成立——而普通的检查点保存在那里会升级为严格写入。那里的持久性是[持久审批账本](/zh/reference/durable-approvals/)的职责；日志只记录该边界曾经存在。丢失审计轨迹，绝不能回滚一次确实发生过的运行。

## 日志与遥测的区别

[Trace 记录](/zh/reference/observability/)与日志事件描述的是同一次运行，并且刻意互不依赖。trace 是**遥测**：丢失它们绝不能回滚持久状态，而且它们可以被采样、批处理、导出或丢弃。日志事件是**执行状态**：它们记录该次运行做了什么、以及模型看到了什么。`journal/` 模块不从 `observability/` 导入，因此 trace 丢失不能推出日志丢失，反之亦然。当 trace 运行时处于活动状态时，事件会携带 `traceId`/`spanId`，这已足以在不把两者耦合起来的前提下把两条流连接起来。
