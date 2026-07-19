---
title: "迁移到 Observability v2"
description: "在保持运行时行为不变的前提下，分阶段、可回滚地从 onTrace 迁移到 sink、存储与 OpenTelemetry。"
---

Observability v2 是一条增量演进路径。既有的 `onTrace` 集成可以继续运行，同时逐层迁移
传输、存储与 OpenTelemetry，无需一次性重写全部代码。

本页可直接复制的代码片段与仅用于编译检查的
[`public-snippets.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/public-snippets.ts)
fixture 保持一致，并在 Node 18/20/22 测试矩阵中接受类型检查。

## 兼容性契约

- `onTrace` 在当前整个 1.x 版本线中继续受支持，本次发布**没有**将其标记为弃用。
- 由七种成员组成的 `TraceEvent` 联合类型、完成/事件时序、UUID `spanId`、UUID
  `parentId` 树，以及经过尽力而为脱敏的旧版工具载荷保持不变。
- 同步回调抛错或异步回调被拒绝，绝不会改变 Agent、Task 或 Run 的结果，也不会变成
  未处理的 rejection。
- 新的 identity、status、start/event/end、link、diagnostic、store 与 OTel 映射使用
  `TraceRecord` schema v2，不会改变旧版事件的形状。

## 迁移阶段

| 阶段 | 改动 | 回滚方式 |
|---|---|---|
| 0 | 保持 `onTrace` 原样不动。 | 无需回滚。 |
| 1 | 把回调放到 `LegacyCallbackTraceSink` 之后。 | 把同一个回调移回 `onTrace`。 |
| 2 | 增加 `BatchingTraceSink` 与自定义 `TraceExporter`。 | 保留阶段 1 的桥接，同时禁用新的 exporter。 |
| 3 | 用 `TraceStoreExporter` 或 `@open-multi-agent/otel` 替换自定义 exporter。 | 切换 exporter；OMA 的运行契约不变。 |
| 4 | 由应用负责 `forceFlush` / `shutdown` / store/provider 的关闭。 | 保留显式 flush 并延长超时；绝不让业务成功依赖遥测。 |

### 阶段 0：无需立即迁移

```ts
import { OpenMultiAgent, type TraceEvent } from '@open-multi-agent/core'

function existingCallback(event: TraceEvent): void {
  legacyCollector.write(event)
}

const oma = new OpenMultiAgent({ onTrace: existingCallback })
```

这在 1.x 中仍然是有效配置。

### 阶段 1：包装既有回调

```ts
import { OpenMultiAgent } from '@open-multi-agent/core'
import { LegacyCallbackTraceSink } from '@open-multi-agent/core/observability'

const legacySink = new LegacyCallbackTraceSink(existingCallback)
const oma = new OpenMultiAgent({
  observability: { sinks: [legacySink] },
})

try {
  await oma.runAgent(agent, prompt)
  await legacySink.forceFlush({ timeoutMs: 1_000 })
} finally {
  await legacySink.shutdown({ timeoutMs: 1_000 })
}
```

请直接在 `observability.sinks` 中配置这个桥接。不要同时把同一个回调传给 `onTrace`，
否则应用就是有意配置了两次投递。该桥接保留旧版隐私边界；与它并列的 v2 sink 仍会收到
范围更窄、默认安全的记录。

### 阶段 2：批量使用自定义 exporter

```ts
import {
  BatchingTraceSink,
  type TraceExporter,
} from '@open-multi-agent/core/observability'

const exporter: TraceExporter = {
  async export(records, signal) {
    const delivered = await sendBatch(records, { signal })
    return { status: 'success', exported: delivered }
  },
}

const sink = new BatchingTraceSink(exporter)
const oma = new OpenMultiAgent({ observability: { sinks: [sink] } })
```

`emit()` 只把记录接纳进一个有界的本地队列。导出结果描述已投递的前缀：较短的
`success` 表示永久性的部分投递；较短的 `retryable` 只会重试剩余后缀。rejection、
超时、队列溢出和永久失败会出现在 `getStats()`、diagnostic 与 flush 结果中，但绝不会
改变业务结果。

可运行版本：[`batching-exporter.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/batching-exporter.ts)。

### 阶段 3A：选择 TraceStore

```ts
import {
  BatchingTraceSink,
  InMemoryTraceStore,
  TraceStoreExporter,
} from '@open-multi-agent/core/observability'

const store = new InMemoryTraceStore()
const sink = new BatchingTraceSink(new TraceStoreExporter(store))
```

`InMemoryTraceStore` 适合测试与本地检查。仅限 Node 的 `FileTraceStore` 子路径适合
持久化本地文件、CLI 和规模不大的单进程服务。它不是共享数据库，不得让两个进程写入
同一路径。

可运行版本：[`in-memory-store.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/in-memory-store.ts)
和 [`file-trace-store.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/file-trace-store.ts)。

### 阶段 3B：选择 OpenTelemetry adapter

首组兼容的安装组合为：

```bash
npm install @open-multi-agent/core@^1.11.0 @open-multi-agent/otel@^0.1.0
```

```ts
import { createOtelTraceSink } from '@open-multi-agent/otel'

const sink = createOtelTraceSink({ tracerProvider: applicationProvider })
const oma = new OpenMultiAgent({ observability: { sinks: [sink] } })
```

provider、processor、sampler、resource 与 exporter 均由应用构造。adapter 不使用全局
provider。默认不会关闭 provider；排空 OMA sink 后，由应用关闭它所拥有的 provider。

可运行的内存 provider 版本：[`otel-provider.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/otel-provider.ts)。

### 阶段 4：显式管理生命周期

| 运行时 | 工作结束顺序 |
|---|---|
| Serverless/FaaS 暖单例 | `run → sink.forceFlush(short timeout)`；不要在每次调用后关闭共享单例。 |
| 短生命周期 CLI | `run → sink.forceFlush → store.flush (if file-backed) → sink.shutdown → store.close`。 |
| 长生命周期服务 | 停止接收新工作并等待进行中的请求，然后对应用拥有的资源执行 `sink.forceFlush → sink.shutdown → store.close → provider.shutdown`。 |

OMA 不会安装信号处理器、调用 `process.exit()`、关闭传入的 store，也不会关闭应用拥有的
provider。请参阅可运行的
[`CLI`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/cli-lifecycle.ts)、
[`SIGTERM server`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/server-lifecycle.ts)
和 [`FaaS`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/observability-v2/serverless-lifecycle.ts)
示例。

## 需要考虑的隐私差异

旧版 `onTrace` 会有意保留经过历史脱敏逻辑处理的工具输入/输出字段。v2 插桩默认不采集
prompt、completion、工具参数、工具结果或推理内容；包括推理 token 数在内的数值型用量
事实仍可采集。trace 隐私处理不会脱敏 CheckpointStore 或共享内存中的数据；如果持久化
运行状态也需要遮蔽，请另行使用 `RedactingStore`。

## 切换检查清单

1. 只有在确实需要重复投递且已分别设置键时，才让旧版与 v2 目标并行运行。
2. 按 `runId` 比较运行次数；不要把旧版 UUID span ID 与 v2 的 W3C 兼容 trace/span ID
   等同起来。
3. 对 sink 的 `dropped`、`failed` 和 `lastError` 告警，不要把它们变成 Agent 失败。
4. 切换前演练 exporter rejection、挂起与部分投递。
5. 移除阶段 1 的桥接前，为每一种进程模式补齐生命周期处理。
6. 在新后端满足留存、隐私和持久性要求之前，始终保留通过配置回滚的能力。
