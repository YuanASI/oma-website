---
title: "可观测性"
description: "三个遥测层：onProgress 事件、带 TraceStore 和可选 OpenTelemetry 导出的结构化 onTrace span，以及运行后的离线 Run Viewer。"
---

`open-multi-agent` 暴露三个遥测层：实时进度事件、结构化的 trace span，以及运行后的单次运行 DAG/Waterfall Viewer。

对于已有的回调集成，请遵循分阶段的
[`onTrace` 迁移指南](/zh/reference/observability-migration/)。发布工程
与基准测试证据记录在
[`observability-performance.md`](/zh/reference/observability-performance/) 以及
[`observability-release-readiness.md`](https://github.com/open-multi-agent/open-multi-agent/blob/main/docs/observability-release-readiness.md) 中。

## 运行标识与结果

每一次顶层执行（`runAgent`、`runTeam`、`runTasks`、`runFromPlan`、
`runConsensus` 和 `restore`）都会返回一个标识，即使没有配置 `onTrace`
也是如此：

```typescript
const result = await orchestrator.runTasks(team, tasks, { runId: 'order-42' })

result.identity // { runId, attempt, traceId, rootSpanId, links? } at runtime
result.status   // { code, message? } at runtime
result.errorInfo // redacted, JSON-safe details on failures
```

`runId` 标识一次逻辑运行，可由调用方提供（1-128 个字符）。`attempt` 从 1
开始。每一次执行尝试都会获得一个新的 32 位十六进制 `traceId` 和 16 位十六进制
`rootSpanId`。恢复会保留 `runId`、递增 `attempt`、生成新的 trace/root ID，
并在恢复 v2 检查点时链接到上一次尝试。

状态码有 `ok`、`error`、`cancelled`、`timeout`、`budget_exhausted`、
`rejected` 和 `skipped`。既有的 `success` 字段仍然可用，且由
`status.code === 'ok'` 推导得出；因此取消和整次运行超时不再被报告为成功运行。
被拒绝的共识裁决仍然是一次 `ok` 的执行结果——该裁决是一个领域结果，而非运行时
失败。

为了在首个 1.x 版本中保持源码兼容，这些新的结果字段在 TypeScript 声明中是可选的，
但这些 API 的每一个运行时结果都包含 `identity` 和 `status`。

### 单次运行元数据

在任意顶层执行上使用 `metadata`，可为该次运行附加有界的评估或关联事实，
例如 prompt 版本、实验分组或数据集标签：

```typescript
const result = await orchestrator.runTasks(team, tasks, {
  metadata: {
    prompt_version: 'v3',
    experiment: 'routing_ab',
    dataset_tag: 'support_holdout',
  },
})

result.metadata // the validated metadata, even without observability sinks
```

元数据的键必须匹配 `[a-z0-9_.]{1,64}`，每次运行最多包含 32 个键，且 `oma.`
前缀为框架保留。值使用 `TraceAttributeValue` 契约：字符串、有限数值、布尔值，
或由其中某一种标量类型构成的同质数组。字符串（包括数组中的字符串）会被截断到
1,024 个字符。无效的元数据会在执行开始前拒绝该调用。框架还保留了确切的
`_overridden` 键，用于恢复来源溯源。

当 tracing 处于激活状态时，元数据会以 `oma.meta.<key>` 的形式写入 root span，
并在校验后从顶层结果回传。v2 检查点会持久化它；`restore()` 会继承检查点的元数据，
除非调用方提供了一组不同的元数据。显式提供的差异会胜出，且新一次尝试的 root span
会记录 `oma.meta._overridden=true`。没有元数据的既有检查点仍然可读。

`TraceStore` 会把最近一次尝试的 root 元数据物化到 `RunSummary.metadata` 中，
因此 `getRun()` 和 `queryRuns()` 的结果会暴露它。`TraceQuery` 有意不提供针对
元数据的过滤。

这个按运行划分的通道不同于 `ObservabilityResource`：资源字段用于实例级的事实，
例如服务、版本和部署环境；运行元数据用于可能在每次调用时变化的维度。

## TraceRecord schema v2

core 包导出了内部 OBS-1B 运行时使用的 `TraceRecord` schema。一个 span 会产生
一条 `span_start`、零条或多条 `span_event` 记录，以及恰好一条自包含的 `span_end`。
记录携带 `schemaVersion: 2`、一个唯一的 `recordId`、一个每条 trace 内严格递增的
`sequence`、运行标识、W3C 兼容的 trace/span ID、时间戳、状态、安全属性，
以及可选的链接。

该层级结构使用父级关系来表达生命周期的包含关系，使用链接来表达非树状关系：

- 运行根节点包含协调器、任务、共识、检查点和回调操作；
- 任务尝试是智能体的子节点，LLM 和工具调用位于智能体之下；
- DAG 前置依赖使用 `depends_on` 链接；
- 被委派的智能体是 `delegate_to_agent` 工具的子节点，并链接回该任务；
- 协调器综合使用 `consumed` 链接指向任务 span；
- 检查点恢复会开启一条新的 trace，其根节点通过 `continued_from` 链接到先前的根节点。

`span_end` 会重复 span 的 kind、名称、开始时间、最终属性、链接、状态和结构化错误，
因此即使某条 start/event 记录在投递管线后续环节丢失，它仍然有用。关闭是幂等的，
第一条 end 胜出。

OBS-2 增加了公开的 sink/exporter 生命周期。运行时可由 `observability.sinks` 或
既有的 `onTrace` 路径激活。若两个选项都不启用，则不会构造任何子 `TraceRecord`
对象或属性；顶层的 identity/status 仍然存在。

在 v2 中，流式通知是 span 事件，而不是零时长的子 span。TTFT 仅由真正的流式提供方
路径记录；当前聚合的 `chat()` 路径绝不会用总延迟来替代 TTFT。旧版 `agent_stream`
回调事件保持不变。

## Sink、exporter 与所有权

`TraceSink` 是同步热路径契约。它的 `emit(record): void` 方法会快速接收一条记录，
且从不被 Agent、Task 或 Run 的执行 await。`TraceExporter` 是 `BatchingTraceSink`
使用的异步批量投递契约；网络或存储 I/O 应放在那里。sink 或 exporter 失败只会改变
可观测性统计和诊断，绝不会改变业务结果。

```typescript
import {
  BatchingTraceSink,
  OpenMultiAgent,
  type TraceExporter,
} from '@open-multi-agent/core'

const exporter: TraceExporter = {
  async export(records, signal) {
    // Send the batch using `signal`; return a delivered prefix count.
    return { status: 'success', exported: records.length }
  },
}

const sink = new BatchingTraceSink(exporter)
const orchestrator = new OpenMultiAgent({
  observability: { sinks: [sink] },
})
```

一个 exporter 结果具有 `success`、`retryable` 或永久性 `failure` 状态。`exported`
是所提供批次中被成功投递的前缀。偏短的 `success` 是一个永久性的部分结果；偏短的
`retryable` 结果只会重试尚未导出的后缀。被拒绝或超时的 exporter promise 会被批处理
sink 隔离承接。

core 还导出了 `CompositeSink`、`FilteringSink`、`SensitiveDataProcessor` 和
`LegacyCallbackTraceSink`，既可从包根导入，也可从显式的
`@open-multi-agent/core/observability` 子路径导入。

## TraceStore 查询与参考存储

`TraceStore` 是面向 v2 `TraceRecord` 批次的、与存储介质无关的持久化与查询契约。
core 内置 `InMemoryTraceStore` 作为参考实现，并以 `TraceStoreExporter` 作为接入
`BatchingTraceSink` 的桥梁：

```typescript
import {
  BatchingTraceSink,
  InMemoryTraceStore,
  TraceStoreExporter,
} from '@open-multi-agent/core/observability'

const store = new InMemoryTraceStore()
const sink = new BatchingTraceSink(new TraceStoreExporter(store))

// Configure sink under observability.sinks, run work, then flush its watermark.
await sink.forceFlush({ timeoutMs: 1_000 })
const page = await store.queryRuns({
  status: ['error', 'timeout'],
  agent: ['researcher'],
  limit: 50,
})
```

`InMemoryTraceStore` 不具持久性，也不是生产数据库。它面向单元测试、本地检查和
短生命周期的进程。它没有文件系统或数据库依赖，并且返回的是副本而非指向其内部记录的
可变引用。

### FileTraceStore：持久化的单进程参考实现

`FileTraceStore` 是仅限 Node 的参考实现，面向本地开发、测试、CLI 以及规模不大的
单进程服务。它随 core 包一起发布——无需安装额外依赖——但必须从显式的、仅限 Node 的
子路径导入：

```typescript
import { FileTraceStore } from '@open-multi-agent/core/observability/file'
import {
  BatchingTraceSink,
  TraceStoreExporter,
} from '@open-multi-agent/core/observability'

const store = await FileTraceStore.open('./.oma/traces.ndjson')
const sink = new BatchingTraceSink(new TraceStoreExporter(store))

try {
  const orchestrator = new OpenMultiAgent({ observability: { sinks: [sink] } })
  await orchestrator.runAgent(agent, prompt)
  await sink.forceFlush({ timeoutMs: 5_000 }) // exporter → FileTraceStore
  await store.flush()                         // fsync the trace file
} finally {
  await sink.shutdown({ timeoutMs: 5_000 })
  await store.close()
}
```

`@open-multi-agent/core` 和 `@open-multi-agent/core/observability` 都不会导出或
导入这个实现。只有 `@open-multi-agent/core/observability/file` 才会加载它的 Node
文件系统代码。导入这些模块中的任何一个都不会执行文件 I/O；`FileTraceStore.open`
才是显式的创建/恢复边界。

`FileTraceStore` 和 `InMemoryTraceStore` 运行同一套 TraceStore 契约。内存存储
没有生命周期或持久性，其状态随进程消失。文件存储会在打开时扫描其日志、重建相同的
内存索引、在单个实例上串行化每一次读取/变更，并暴露 `flush`、`close` 和 `compact`。
查询游标仍然是特定于存储实例的：来自已关闭实例的游标在重新打开后有意视为无效；
请开始一次全新的分页遍历。

#### 磁盘封装与恢复

这个仅追加的文件是 UTF-8 NDJSON，采用如下带版本的封装：

```text
file_header(format="oma.file_trace_store", formatVersion=1, traceSchemaMajor=2)
batch_start(batchId, operation, itemCount, payloadSha256)
batch_item(batchId, index, payload)  # one TraceRecord or delete tombstone
...
batch_commit(batchId, itemCount, payloadSha256)
```

格式版本属于文件封装；每个 trace 载荷仍然拥有各自的 `schemaVersion: 2`。恢复不会
从内存推断这两个版本中的任何一个。受支持的 TraceRecord v2 载荷中的未知新增字段会
原样往返而不被改动。

一个 append/delete 批次只有在其提交标记是一条完整的 NDJSON 行，且其 id、连续的
条目数量和 SHA-256 校验和与起始标记及载荷相匹配时，才会变为可见。打开时，存储会按
文件顺序扫描并只重放已提交的批次。末尾一条被截断的行或尾部一个未提交的批次会产生
一条结构化的、不含载荷的诊断，并被截断回最后一个已提交的字节边界。因此在重启后，
一个 API 批次要么完全可见，要么完全不存在。一条格式错误的完整行、尾部之前的损坏、
无效的已提交载荷、不受支持的文件格式或不受支持的 trace schema 都会在打开时明确
失败；它绝不会被跳过。

删除和保留操作会追加已提交的 tombstone 批次，其中包含被移除的确切逻辑运行 ID。
因此重新打开不会复活已删除的记录，也不会用一个不同的时钟重新评估保留策略。

#### 写入、flush、close 与失败语义

- 一次成功的 `append` 意味着完整的已提交封装被操作系统的文件写入所接受，且描述符
  已关闭。它并**不**意味着 `fsync` 已完成。
- `flush()` 会排在它之前被接受的所有操作之后等待，并对目标文件执行 `fsync`。重复
  调用是安全的。在本地文件系统所承诺的范围内，它是抵御操作系统崩溃/断电的显式边界。
- `close()` 会停止接受新操作、等待已接受的工作、执行同样的文件 `fsync`，并且是
  幂等的。此后，除重复的 `close()` 之外的调用都会以一个结构化的 `CLOSED` 错误
  被拒绝。
- 优雅的 CLI/服务器关闭应先 flush 批处理 sink，再关闭存储。在进程突然退出时，
  已完整写入但未 fsync 的批次可能因操作系统/断电故障而丢失；单纯的进程崩溃通常仍能
  让内核已接受的写入可恢复。
- 写入、权限、磁盘写满、fsync 和重命名失败都会以 `FileTraceStoreError` 被拒绝。
  它们绝不会被报告为成功。错误和诊断消息不包含任何 TraceRecord 或遥测载荷。

新文件会请求 `0600` 权限模式。不强制执行 POSIX 权限模式的平台会发出一条诊断，
并依赖其原生的访问控制。该存储不注册任何信号处理器，也绝不会调用 `process.exit()`。

#### 崩溃安全的 compaction

`await store.compact()` 只会把当前有效的记录，按稳定的查询/记录顺序，写入同一目录
下的 `<path>.compact.tmp`。它会设置 `0600` 权限模式、对临时文件执行 flush/fsync、
原子地将其重命名覆盖到目标文件之上，并在平台/文件系统支持目录 fsync 时对父目录执行
fsync。重命名失败会让原始目标文件保持权威且可用。一个存在于既有目标文件旁边的、
被中断的临时文件会被诊断为陈旧，并在下一次 compaction 覆盖它之前被忽略。一个没有
对应目标文件的临时文件会被视为含义不明的可能数据，此时打开会失败，而不是创建一个空
存储。对未变化状态的重复 compaction 是字节确定性的。

Compaction 不会改变查询结果。被删除/被保留策略清理的记录及其 tombstone 会从
compact 后的文件中消失。

#### 范围与迁移边界

这是一个参考存储，而不是数据库。它有意不提供跨进程锁、多进程写入者协调、网络文件系统
一致性、高并发调优、全文搜索、高级分析、租户认证或 RBAC。不要让两个实例写入同一个
路径，也不要把它当作共享的 NFS/SMB trace 后端使用。对于这些需求，请在一个独立的
数据库适配器/包中实现与存储介质无关的 `TraceStore` 契约，并通过重放已提交的
TraceRecord 流来迁移。任何数据库驱动都不应放进 core 或这个子路径。

在仓库根目录下，运行 `npm run build -w @open-multi-agent/core`，再运行
`node --expose-gc packages/core/benchmarks/file-trace-store.mjs`，即可得到可重复的
1k/10k 本地边界基准测试（append、fsync、reopen、query、compaction、堆内存估算、
文件大小以及批次大小对比）。该基准测试是一个仓库开发工具，被有意排除在 npm tarball
之外。

### Append、schema 与物化

`append(records)` 会原子地接受一个批次：校验失败会让整个批次不可见。支持 schema
主版本 `2`；其他主版本会以 `TraceStoreError(code = 'UNSUPPORTED_SCHEMA_VERSION')`
被拒绝。schema-v2 记录上的未知字段会被保留，以便新增式的次版本演进能够往返。

`recordId` 是幂等键。重新导出一个先前已接受的批次，对这些记录而言是一次成功的空
操作。如果同一个 span 收到了多于一条不同的 `span_end`，则第一条被接受的 end 胜出，
且 append 会返回一条 `duplicate_span_end` 诊断；后来的 end 无法改变已物化的 Agent
或 Run 结果。

物化会在每条 trace 内按 `sequence` 对记录排序，与到达顺序无关。一条 end 记录是
自包含的，因此一个只有 end 的 span 是完整的。一个没有被接受的 end 的 start 仍然是
不完整的。一个逻辑 `runId` 会把所有尝试和 trace 标识分为一组，包括恢复的续接。
父子关系以及 `continued_from`、`depends_on`、`delegated_from` 和 `consumed` 链接会
在已物化的 span 上被保留。运行的终态状态是最近一次尝试实际的 root end 状态；当该
记录缺失时它会缺席，且绝不会被臆造为 `ok`。

运行摘要包括开始/结束/时长、尝试次数和 trace/root 标识、存在时的终态状态、属性中
实际找到的 agent/task/model/provider 值、LLM token 和成本事实、不完整状态，以及
schema 版本。只有 LLM 的 end 记录才会计入 token/成本总量，从而避免对 agent 或 run
的汇总重复计数。

### 过滤器、排序与不透明游标

`queryRuns` 支持组合的 `runId`、ISO 时间范围、状态、agent、任务 ID、model 和
provider 过滤器。`startedAfter` 为包含边界；`startedBefore` 为排除边界。默认页
大小为 50（最大 500）。稳定排序为 `(startedAt, runId)`，默认降序；`started_asc`
会同时反转该键的两个部分，因此相等的时间戳总是有一个确定性的决胜依据。

游标是不透明的、特定于存储实例的，并绑定到创建它的过滤器/排序。无效、被篡改或不匹配
的游标会以 `TraceStoreError(code = 'INVALID_CURSOR')` 被拒绝。第一页会捕获一个
append 修订版本：在读取后续页期间被追加的记录不会出现在那次分页遍历中，从而防止
重复和遗漏。一次全新的查询能看到它们。删除是即时一致的，并会使尚未用完的游标失效；
append 快照并不宣称在并发的删除或保留操作之间构成一个事务。

### 删除与保留

`deleteRun(runId)` 会移除一次逻辑运行的每一次尝试。`delete(query)` 使用与查询相同
的冻结过滤器批量删除逻辑运行，不带游标、排序或 limit。两者都是幂等的，且成功的删除
会立即反映在 `getRun` 和 `queryRuns` 中。

保留策略接受 `maxAgeMs`、`maxRuns` 和一个可选的终态状态范围。年龄使用注入的存储时钟
和运行的开始时间。`maxRuns` 会按同样的稳定排序保留最新的匹配运行；年龄与数量的删除
集合会被合并。一个仅按状态的策略会删除具有这些实际终态状态的运行，而不会匹配没有
状态的不完整运行。删除顺序为最旧的优先，以 `runId` 作为决胜依据，且重复应用是安全的。

TraceStore 的保留策略只影响该存储。它无法删除已经导出到 OTel 或其他厂商的副本。

### Dashboard、TraceStore、CheckpointStore 与 RunStore

| 数据面 | 职责 | 可靠性边界 |
|---|---|---|
| Run Viewer | 运行后的静态任务 DAG 加上 span Waterfall、计时、token/成本事实和安全详情 | 派生产物；无实时投递或权威状态 |
| TraceStore | 追加/查询遥测、保留策略和 trace 删除 | 尽力而为；无 CAS、租约、挂起或恢复 |
| CheckpointStore | 由 `restore()` 消费的任务粒度执行快照 | 执行恢复状态；不是一个 trace 查询系统 |
| 未来的 RunStore | 权威的、持久的运行状态机 | Observability v2 未实现 |

丢失遥测绝不能回滚一次持久的运行。删除 trace 绝不能删除检查点、共享内存或已远程
导出的 OTel 数据。

## 可选的 OpenTelemetry 包

`@open-multi-agent/otel` 是一个独立的 workspace/包，它把 OBS-2 的 `TraceRecord`
批次适配为 OpenTelemetry span。它不被 core 导入，因此仅安装 core 不会带来任何
OpenTelemetry 运行时依赖或导入路径。

```typescript
import { OpenMultiAgent } from '@open-multi-agent/core'
import { createOtelTraceSink } from '@open-multi-agent/otel'

// The application has already constructed and configured this OTel provider.
const sink = createOtelTraceSink({
  tracerProvider: provider,
  metadata: { environment: 'production', release: '2026.07.15' },
})
const orchestrator = new OpenMultiAgent({ observability: { sinks: [sink] } })
```

请恰好传入一个由应用拥有的 `tracer` 或 `tracerProvider`；两者都不提供是一个配置
错误。该适配器绝不会读取、初始化或替换全局 provider。当所提供的 provider 支持该
操作时，`forceFlush()` 会委托给它。默认情况下会跳过 provider 的 shutdown，即使它
可用：仅当适配器拥有该 provider 的生命周期时，才设置 `shutdownOnShutdown: true`。
拒绝/超时会映射为 OBS-2 的 exporter 结果和诊断，绝不会映射为 Agent/Task/Run 的失败。

OMA 的 run/agent/task/LLM/tool/consensus/checkpoint 记录会变成 span；retry、
verdict、first-chunk 和 stream 记录会变成 `oma.*` 事件。DAG、委派、
consumed-synthesis 和 restore-continuation 关系会变成 OTel 链接。该适配器会把
`schemaVersion: 2`、run/attempt、OMA 的 trace/span ID、record ID 和 sequence
保留为稳定的 `oma.*` 属性。它会把 `error`、`timeout` 和 `budget_exhausted` 映射为
OTel 的 `Error`；所有其余的 OMA 状态保持为 OTel 的 `Unset`，并保留在 `oma.status`
中。

目标被同一个适配器观测到的链接会使用目标 span 实际由 SDK 生成的 OTel 上下文。每个
链接会记录 `oma.link.resolved` 以及稳定的 OMA 目标 trace/span ID。同进程内的恢复
会通过一个容量有界的、缓存最近 256 个 root 上下文的缓存来解析。进程重启之后，先前
的 SDK 上下文不再可用，因此 `continued_from` 会回退到一个由 OMA ID 构建的远程未采样
上下文，并把自己标记为未解析；OMA 目标属性仍然可用于关联。

已完成的 OTel `Span` 对象会被立即释放。轻量级上下文只存活到其 root span 关闭为止，
届时 trace 本地的注册表会被清空。root 关闭和适配器 shutdown 会在清空状态之前，把
任何剩余的打开 span 结束为不完整，因此遥测丢失不会产生一个无界增长的活跃 span
注册表。

对于 LLM/tool span，它还会发出当前处于开发状态的 GenAI 约定的一个有界兼容子集
（provider/model、token/cache/reasoning 计数、工具名称和 TTFT）。每个 span 都会
记录 `oma.otel.mapping.version` 和 `oma.otel.gen_ai_semconv.version`；稳定契约是
`oma.*`，而不是不断演进的 GenAI 字段名。它不发出任何指标，因此不会有高基数的
run/task/tenant/request 字段变成指标标签。

该适配器不导出任何 prompt、completion、工具参数/结果、原始载荷、凭据、思维链或推理
内容。数值型的 token 计数仍然符合条件。它只转发一个显式的、低敏感度的 `oma.*`
白名单，而不是任意的记录属性。`contentCapture` 是一个保留的、仅限禁用的扩展点；
本次发布中没有内容捕获开关。

首个版本有意不提供 OTLP 便利子路径。应用自行选择其 OTel SDK 和 OTLP/exporter 实现，
从而避免过早的 OTLP 导入、隐式的全局 provider 配置，以及第二套 SDK/exporter
兼容性矩阵。完整的 API 和映射表见
[`packages/otel/README.md`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/otel/README.md)。

## Flush 与 shutdown

`forceFlush({ timeoutMs })` 会捕获一个接受水位线。它承诺：在该调用之前被接受的记录
已被导出，或已被显式计为失败/丢弃；此后被接受的记录不会拖延该调用。随后它会委托给
exporter 可选的 `forceFlush`。结果为 `ok`、`partial`、`timeout` 或 `error`，并包含
累计的 accepted/exported/dropped/failed 计数。

`shutdown({ timeoutMs })` 会原子地停止接受、flush 掉截止点，然后关闭 exporter。它是
幂等的：并发和重复的调用共享第一个结果。截止点之后的 `emit` 会被丢弃并诊断。超时是
整个生命周期的总截止时间，而不是抛入 Agent 执行中的异常。

sink 的创建者拥有它的生命周期。OMA **不会**自动关闭注入的 sink、安装进程信号处理器、
调用 `process.exit()`，也不会假设某个 sink 为某一个编排器所独占。

```typescript
// Serverless/FaaS: flush this invocation, keep a shared singleton usable.
const result = await orchestrator.runAgent(agent, prompt)
const telemetry = await sink.forceFlush({ timeoutMs: 1_500 })
return { result, telemetry: telemetry.status }

// Short-lived CLI: finish delivery before natural process exit.
try {
  await main()
} finally {
  await sink.forceFlush({ timeoutMs: 5_000 })
  await store?.flush()
  await sink.shutdown({ timeoutMs: 5_000 })
  await store?.close()
}

// Long-lived server: application-owned graceful shutdown.
async function stopServer() {
  await stopAcceptingAndWaitForInflight(server)
  await sink.forceFlush({ timeoutMs: 10_000 })
  await sink.shutdown({ timeoutMs: 10_000 })
  await store?.close()
  await provider?.shutdown()
}
// Register stopServer with your server/process framework if desired.
```

## 队列、重试、丢弃与诊断

`BatchingTraceSink` 的默认值是有界的：

| 设置项 | 默认值 |
|---|---:|
| 排队记录数 | 2,048 |
| 排队字节数 | 16 MiB |
| 单条记录 | 256 KiB |
| 批次记录数 | 512 |
| 调度延迟 | 5 秒 |
| 导出超时 | 30 秒 |
| 首次尝试之后的重试次数 | 3 |
| 重试退避 | 1 秒，指数 ×2，等量抖动，上限 30 秒 |

只有 `retryable` 结果、被拒绝的 exporter promise 和导出超时才会被重试。重试/退避
发生在传输 worker 中，绝不会阻塞业务执行。队列准入是非阻塞的。当需要腾出容量时，
sink 会按如下优先级顺序丢弃最旧的记录：`stream_chunk`、其他事件、`span_start`，
然后是自包含的 `span_end`。超大的记录会在被接受之前就被拒绝。

`getStats()` 会报告 accepted、exported、retried、failed、dropped、排队记录数/字节数，
以及一个不含载荷的最后错误码。内置诊断绝不包含任何记录、prompt、工具载荷或原始异常。
它们默认为每个 sink+code 每 60 秒一条 `console.warn`；向内置 sink 显式传入
`diagnostics: 'silent'` 可禁用警告，或使用 `onDiagnostic`。诊断处理器抛出的异常会被捕获并忽略，而不会递归地产生另一条诊断。

## 进度事件

当你需要给日志、终端输出或实时 UI 提供轻量级的生命周期事件时，用 `onProgress`。

```typescript
const orchestrator = new OpenMultiAgent({
  onProgress: (event) => {
    console.log(event.type, event.task ?? event.agent ?? '')
  },
})
```

常见的事件类型包括 `task_start`、`task_complete`、`task_retry`、`task_skipped`、
`agent_start`、`agent_complete`、`budget_exceeded` 和 `error`。一个 `task_retry`
事件的 `data.nextDelayMs` 是下一次尝试之前实际的、经过抖动后的延迟，而不是名义上的
退避计划。

## Trace Spans

`onTrace` 对既有用户仍保持源码与运行时兼容。每个事件仍然携带其 UUID `spanId`、
可选的 UUID `parentId`、时长、token 计数，以及同样经过尽力脱敏的旧版工具 I/O。

```typescript
const orchestrator = new OpenMultiAgent({
  onTrace: async (span) => {
    await traceSink.write(span)
  },
})
```

把 trace span 转发给 OpenTelemetry、Datadog、Honeycomb、Langfuse，或你自己的运行
数据库——但要先判断哪些数据进入该 sink 是安全的。可运行的示例见
[`integrations/trace-observability`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/trace-observability.ts)。

七个成员的 `TraceEvent` 联合类型以及 completion/event 计时保持不变。在内部，
`LegacyCallbackTraceSink` 会把 v2 记录映射回确切的旧版事件对象。同步回调的抛出和
异步的拒绝仍然是隔离的，不会变成未处理的拒绝。`onTrace` 在本次发布中未被标记为弃用；
1.x 兼容窗口保持开放，用户可以按自己的节奏把传输代码迁移到 `observability.sinks`。
可复制的逐阶段路径见
[`observability-migration.md`](/zh/reference/observability-migration/)，
包括直接使用 `LegacyCallbackTraceSink`、批处理、TraceStore/OTel 以及生命周期所有权。

Span 的父子关系是尽力而为的，并使用运行时已知的因果结构。在团队运行中，工作者智能体
的 span 指向其任务 span，而 LLM/tool/stream span 指向智能体 span。诸如顶层智能体运行
这样的 root span 会省略 `parentId`。

## 运行后的 Run Viewer

`renderRunViewer()` 会为单次运行返回一个自包含的静态 HTML 页面。它接受一个
`TeamRunResult`、一个已物化的 `StoredRun`，或两者兼有：

```typescript
import { writeFileSync } from 'node:fs'
import { renderRunViewer } from '@open-multi-agent/core'

const result = await orchestrator.runTeam(team, goal)
writeFileSync('run.html', renderRunViewer({ result }))
```

仅结果模式会渲染确切的任务图，并显式标注缺失的 trace 细节。仅 trace 模式会从
`depends_on` 链接推导任务依赖，并在一个按尝试分组、可展开、按比例的 Waterfall 中
提供每一种已物化的 span kind。组合模式以结果图为权威，并把它的任务链接到更丰富的
trace 证据。

```typescript
const run = await traceStore.getRun(result.identity!.runId, { includeRecords: true })
if (run) writeFileSync('run.html', renderRunViewer({ result, run }))
```

`renderTeamRunDashboard(result)` 保持源码兼容，并委托给 `renderRunViewer({ result })`；
它不维护一个单独的渲染器。

库的渲染器不执行任何文件系统或网络 I/O。文件输出由 CLI 负责：

```bash
# Capture and render the run being executed
oma run --goal "..." --team team.json --dashboard

# Export one previously persisted FileTraceStore run
oma dashboard --trace-store ./.oma/traces.ndjson --run-id <runId> --output run.html
```

这个历史命令在逻辑存储层是只读的，并且总是会关闭存储。关于覆盖、stdout、stderr 和
退出码行为，见 [docs/cli.md](/zh/reference/cli/)。

当有记录时，Viewer 会渲染状态、完整性、运行标识、时长、尝试次数、token、成本、
agent、model 和 provider。DAG 与 Waterfall 的选择通过任务 ID 同步；搜索以及
kind/status/agent/task 过滤器会保留祖先上下文。有环或缺失的层级/依赖数据会降级为
可见的警告，而不是被静默地当作成功。

生成的 HTML 包含它自己的 CSS、JavaScript 和进入白名单的数据，不加载任何远程脚本、
样式表、字体、图片、遥测或运行时 API。它不嵌入 prompt、completion、任意属性、工具
参数/工具结果、消息、任务描述/结果或推理内容。安全展示字段在序列化之前会被再次脱敏。
这是一个开发者检查产物，而不是一个实时仪表盘、多运行浏览器或权威的运行状态存储。

在构建完这个包之后，生成一个有代表性的、无网络的产物：

```bash
npx tsx packages/core/examples/integrations/observability-v2/run-viewer.ts
```

该示例会通过一次真实的 `FileTraceStore` 历史导出写出
`oma-dashboards/run-viewer-demo.html`。它的记录是明确虚构的、确定性的演示数据，
而不是一次真实的 provider 运行。

## 该持久化什么

对于生产环境的运行，持久化足够的数据，让你不必重放整个作业就能重建一次失败：

- `TeamRunResult.tasks`——执行过的 DAG 和任务状态。
- `TeamRunResult.totalTokenUsage`——用于成本归因。
- `result.identity` 和 `result.status`——作为稳定的运行查找依据和结果。
- TraceStore 中的 `TraceRecord` v2 数据——用于 LLM、工具、任务、retry/event、链接和尝试的证据。
- 渲染好的 Run Viewer HTML——当你需要一个可分享的事后复盘产物时。

> **脱敏范围。** 上面提到的脱敏适用于*遥测*——trace span 和仪表盘载荷。它并**不**
> 覆盖已持久化的运行状态：共享内存写入和检查点保存会原样存储智能体输出。若要在那里
> 清除密钥，请用 [`RedactingStore`](/zh/reference/shared-memory/#对持久化的密钥脱敏)
> 包裹持久化存储。

## 默认隐私边界

v2 埋点默认不收集 prompt、completion、工具参数或工具结果。`OpenMultiAgent` 会把
配置好的 v2 sink 包裹在一个 `SensitiveDataProcessor` 中；它可选的
`observability.capture` 策略是唯一由 core 控制的内容开启项。即使启用了内容捕获，
结构化的凭据字段也会被移除。思维链/推理内容、签名的推理块以及 `<thinking>` 文本绝不
会被 OMA 埋点捕获；数值型的推理 token 计数可能会被记录。

旧版 `onTrace` 出于兼容性保留了它既有的、经过脱敏的工具输入/输出字段，因此它的隐私
暴露面有意比 v2 默认值更广。Trace 处理不会对检查点或共享内存进行脱敏。
