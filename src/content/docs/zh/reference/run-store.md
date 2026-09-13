---
title: "运行记录与租约"
description: "每个逻辑运行一份可选开启的权威记录：生命周期状态、执行租约与 fencing token，使同一时刻只有一个 worker 推进它。"
---

[检查点](/zh/reference/checkpoint/)回答的是*执行可以从什么状态恢复*。它不回答*谁被允许推进它*。没有任何机制阻止两个进程加载同一份快照并双双继续下去，也没有任何机制阻止一个已经停滞到超出自身存活期的 worker 醒来，覆盖掉接替它的 worker 此后写入的状态。

**运行记录（run store）**补上了这个缺口。它为每个逻辑运行持有一条权威记录——生命周期状态、执行租约，以及一个单调递增的 fencing token——从而让一个长时运行的工作流成为一项被持久托管的作业，而不是一次需要某个进程全程看护的函数调用。它是可选开启的：不配置运行记录时，既有的单进程检查点与恢复行为一概不变。

## 启用它

```typescript
import { MemoryStoreRunStore, OpenMultiAgent } from '@open-multi-agent/core'

// `durableStore` is your own cross-process MemoryStore (Redis, Postgres, ...).
const orchestrator = new OpenMultiAgent({
  runStore: new MemoryStoreRunStore(durableStore, { atomicity: 'cross-process' }),
  checkpoint: true,
})
```

传入一个对象即可为 worker 命名或放宽租约：

```typescript
const orchestrator = new OpenMultiAgent({
  runStore: {
    store: runStore,
    owner: `worker-${process.env['HOSTNAME']}`,
    leaseTtlMs: 120_000,
  },
})
```

`RunTasksOptions.runStore` 会为单次调用覆盖编排器的默认值，而 `runStore: false` 让单次调用不使用已配置的存储。

| 字段 | 默认值 | 含义 |
|---|---|---|
| `store` | — | `RunStore` 的实现。必填。 |
| `owner` | pid 加一个随机后缀 | 不透明的 worker 标识。两个存活的进程绝不可共用同一个。 |
| `leaseTtlMs` | `60000` | 一份租约在不续期的情况下保持有效多久。 |
| `heartbeat` | `true` | 在运行处于打开状态期间于后台续期。 |
| `now` | `Date` | 供测试使用的时钟接缝。 |

## 一条运行记录包含什么

```typescript
interface RunRecord {
  schema: 1
  runId: string
  version: number          // optimistic concurrency; increments on every write
  status: RunLifecycleStatus
  attempt: number          // increments when a worker takes an abandoned run over
  fencingToken: number     // increments only when ownership changes hands
  lease?: { owner: string; acquiredAt: string; expiresAt: string }
  checkpointRef?: { key: string; snapshotVersion: number; savedAt: string }
  outcome?: { code: RunStatusCode; message?: string }
  suspension?: { suspendedAt: string; pendingApprovalIds: readonly string[] }
  createdAt: string
  updatedAt: string
}
```

这两个计数器是刻意分开的。`version` 是存储用来比对并拒绝陈旧写入的依据。`fencingToken` 只在租约易手时才移动，因此一个持有 token `N` 的 worker，在任意多次无关写入之后仍然能被识别为陈旧。

`RunLifecycleStatus` 是一套小而封闭的词汇，与调用方收到的 `RunStatus` 并非同一回事。`RunStatus` 归一化的是单次调用的结果；这里描述的则是运维人员或另一个 worker 所看到的持久状态机。

| 从 | 可以变为 |
|---|---|
| `queued` | `running`、`cancelled`、`failed` |
| `running` | `suspended`、`completed`、`failed`、`cancelled`，或在一个 worker 未完成便释放它时退回 `queued` |
| `suspended` | `queued`、`running`、`cancelled`、`failed` |
| `completed`、`failed`、`cancelled` | 无 |

终态没有出边：一条迟到或重复的命令无法重新打开一个已结束的运行。`canTransitionRun()` 与 `isTerminalRunStatus()` 都已导出，好让外部存储或看板套用同一套规则。

## 执行所有权

1. 一个 worker 必须先取得租约，才能执行或恢复工作。
2. 它在活跃期间续期；一份过期的租约可以被任何人接管。
3. 每一次检查点与生命周期写入都携带 fencing token，因此一个已被接管的 worker 无法在接管之后再写入。
4. 一个被挂起的运行不依赖某个存活的 worker。在一条决定被记录之后，一次幂等的恢复就能让它重新有资格取得新的租约。
5. 重复的启动、恢复、取消与完成命令会收敛到同一个合法状态，而不是执行两次。

`RunLedger` 负责签发租约，`RunLeaseHandle` 则是一个 worker 在持有租约期间掌握的能力。编排器会替你驱动两者；若要从 worker 之外执行一条运维命令，可以直接使用它们：

```typescript
import { RunLedger } from '@open-multi-agent/core'

const ledger = new RunLedger(runStore, { owner: 'operator' })

await ledger.get('run-42')                 // read without taking ownership
await ledger.cancel('run-42', 'superseded')// stop the active worker
await ledger.requestResume('run-42')       // make a suspended run eligible again
```

取消会推进 fencing token，于是正在运行的 worker 会在它的下一次写入处被拦下并停止，而不是把一个已取消的运行跑完。

## fencing 在哪里强制执行

- **执行之前。**`runTeam`、`runTasks`、`runFromPlan` 与 `restore` 都会在第一个任务被派发之前取得租约。一个被另一个 worker 持有的运行、一个已处于终态的运行，或一个没有记录恢复请求的挂起运行，都会抛出 `RunStoreError` 且不派发任何任务。`runTasks`、`runFromPlan` 与 `restore` 在任何工作之前就取得租约；`runTeam` 则在协调器产出计划之后、计划审批边界之前取得，因此一次拿到有争用 `runId` 的 `runTeam` 调用仍然会花掉那次规划调用。
- **在每一个检查点边界。**检查点写入会先做 fencing：先以该 worker 的 token 把新的检查点引用更新进运行记录，然后才写快照。一次被拒绝的 fencing 意味着根本不会写入任何快照。`checkpointRef` 对运维人员而言是参考性的——恢复直接读取检查点的 key——因此一次在 fencing 成功之后失败的快照写入，会让指针比已存储的快照领先一次写入。
- **在派发闸门处。**租约丢失会像中止或预算耗尽一样让运行停下。不会再派发任何任务。
- **在终态转换处。**运行的最终状态会在结果返回之前，以同一个 token 写入。

`restore()` 本身就是恢复命令：它会让一条被挂起的记录重新具备资格，并在调和审批账本之前取得租约，因此两个恢复同一份检查点的 worker 不可能双双推进它。

### 唯一残留的窗口

运行记录与检查点是两行独立的数据，OMA 并不要求一个横跨两者的事务。一次落在 fencing 成功与快照写入之间的接管，可能留下一份陈旧的快照。新持有者的下一次检查点会取代它，而运行记录——那一行决定谁可以推进的数据——自始至终都是无歧义的。这与[外部副作用的幂等窗口](/zh/reference/checkpoint/#任务中途的工具恢复)属于同一类窗口，也正因如此，运行记录并不能让任意的外部副作用变成 exactly-once。支付、消息与工单仍然需要那个稳定的 tool-call ID，或另一个领域自有的幂等键。

## 失败语义：不是尽力而为

普通的[检查点写入是尽力而为的](/zh/reference/checkpoint/#保存是尽力而为的)：存储出错会被上报，运行继续。所有权与生命周期写入则不是。

- 一次被 fencing 拦下的检查点写入不会落到存储上，运行会在下一个派发闸门处停止。
- 一个发现自己丢失租约的 worker 不会写入任何终态——这个运行属于接管它的那一方——而它自身的结果会被报告为 fencing 所检出的那次失败，绝不会被报告为成功。
- 一次无法写入的终态转换会抛出异常。OMA 不会报告一个权威记录并未承载的结果。

`RunStoreError.code` 说明原因：`RUN_LEASE_HELD`、`RUN_LEASE_LOST`、`RUN_ALREADY_TERMINAL`、`RUN_SUSPENDED`、`RUN_INVALID_TRANSITION`、`RUN_INTEGRITY_ERROR`、`RUN_VALIDATION_ERROR`、`RUN_CONFLICT`、`RUN_NOT_FOUND` 与 `RUN_STORE_ATOMIC_REQUIRED`。当失败是针对一条已读取的记录检出的时，`RunStoreError.record` 会携带它。

## 实现一个存储

`RunStore` 是三个方法加一项声明：

```typescript
interface RunStore {
  readonly atomicity: 'process' | 'cross-process'
  get(runId: string): Promise<RunRecord | null>
  create(record: RunRecord): Promise<boolean>
  compareAndSet(runId: string, expectedVersion: number, next: RunRecord): Promise<boolean>
  delete?(runId: string): Promise<void>
}
```

租约过期、fencing、转换合法性与命令幂等性，全都位于接缝之上的 `RunLedger` 里，因此一个实现复刻的是存储语义，而不是一台状态机。`create` 只在不存在时插入；`compareAndSet` 只在已存储的 version 匹配时交换，且 `next.version` 必须是 `expectedVersion + 1`。

### `atomicity` 是一项声称，不是提示

`MemoryStoreRunStore` 可以适配任何实现了 `compareAndSet` 的 [`MemoryStore`](/zh/reference/shared-memory/)，这让同一个后端可以同时存放检查点、审批账本与运行记录。它无法检视那个后端，因此默认取 `atomicity: 'process'`，只有在你明确声明时才取 `'cross-process'`。

| 后端存储 | 诚实的原子性 | 适用于 |
|---|---|---|
| `InMemoryStore` | `process` | 测试、单进程开发 |
| `FileStore` | `process` | 单机上的顺序重启恢复 |
| Redis（`WATCH`/Lua）、Postgres（条件 `UPDATE`）、DynamoDB（条件写入） | `cross-process` | 多 worker |

`FileStore` 仍然是本地顺序重启的参考存储。它在单个 Node 进程内串行化写入，且没有跨进程锁，因此绝不可把它当作多 worker 的租约后端来呈现——共用同一个文件的两个进程可能都以为自己持有租约。

### 一致性测试套件

`packages/core/tests/helpers/run-store-contract.ts` 是一套可复用的 Vitest 测试，覆盖创建竞态、version 匹配的 compare-and-set、并发交换、租约过期与接管、陈旧写入方的拒绝、挂起/恢复，以及终态封闭。把它指向你的实现：

```typescript
import { runRunStoreContractSuite } from './helpers/run-store-contract.js'

runRunStoreContractSuite('PostgresRunStore', () => new PostgresRunStore(pool))
```

这套测试无法从单个进程内部证明真实的跨进程原子性——那项声称需要针对真实后端的独立集成测试。

## 它不是什么

- **不是事件日志。**这条记录是当前的权威状态，不是一段历史。仅追加的历史是可选开启的[运行事件日志](/zh/reference/run-journal/)。
- **不是调度器或队列。**OMA 不会把运行派发给 worker、不会按定时器重试它们，也不会运行一个控制面。它只告诉某一个 worker 它是否可以继续。
- **不是 exactly-once 的副作用。**参见[唯一残留的窗口](#唯一残留的窗口)。
- **不是审批产品。**审阅者 UI、RBAC、通知与升级都在框架之外；参见[持久化审批](/zh/reference/durable-approvals/)。

## 相关

- [检查点与恢复](/zh/reference/checkpoint/)——租约所保护的那份快照。
- [持久化审批门](/zh/reference/durable-approvals/)——一个被挂起的运行在等待什么。
- [可观测性](/zh/reference/observability/#dashboardtracestorecheckpointstore-与-runstore)——这个数据面与遥测有何不同。
- [共享内存](/zh/reference/shared-memory/)——随包提供的适配器所依托的 `MemoryStore` 接口。
