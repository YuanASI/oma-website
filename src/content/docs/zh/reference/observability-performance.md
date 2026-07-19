---
title: "可观测性性能"
description: "了解可复现的 Observability v2 性能预算、基准测试方法与发布快照。"
---

本文档记录的是可复现的工程快照，而不是永久性的营销承诺。绝对耗时取决于 Node、CPU、
操作系统、文件系统、电源状态和后台负载。发布决策使用同一主机上的中位数与 RFC 预算；
CI 使用刻意放宽的闸值，避免受硬件影响的 flaky 结果。

## 预算

| 路径 | 专用基准测试闸值 | CI 守卫 |
|---|---:|---:|
| 无 sink 的墙钟时间 | 相比 OBS-1A identity/status 基线，中位数回归 `<1%` | 在专用发布运行中测量，不在浅克隆 CI checkout 中测量 |
| 无 sink 的留存内存 | 相比 OBS-1A，每个保留的顶层结果额外占用 `<1 KiB` | 使用 `--expose-gc` 报告；不是共享 runner 上的绝对闸值 |
| 旧版同步回调分发 | 每个完成事件 p95 `<10 µs` | p95 `<100 µs` |
| 批处理入队 | 每条记录 p95 `<20 µs` | p95 `<200 µs` |
| OTel 转换 + 内存 processor | 每条记录 p95 `<50 µs` | p95 `<500 µs` |
| 同一主机上整次运行的 sink 开销 | 相对于无 sink 路径报告 | `<1,000%`，用于捕获数量级回归 |

放宽后的 CI 阈值是专用微秒预算的 10 倍。它们是回归警报，不代表发布验收结果。

## 矩阵与方法

既有的基准测试脚本继续作为共用 harness：

| 矩阵行 | Harness 与统计量 |
|---|---|
| 无 sink | `observability-no-sink.mjs`；基线/候选交替运行多轮，取墙钟时间中位数 |
| 无 sink 内存 | 同一 harness 配合 `--expose-gc`；保留结果数组，交替计算每个结果所占字节的中位数 |
| 旧版回调 | `observability-sinks.mjs`；整次运行中位数，加直接旧版分发 p95 |
| `BatchingTraceSink` | 整次运行中位数和同步入队 p95 |
| `InMemoryTraceStore` | 1k/10k 次 append、首屏查询和预估留存 heap |
| `FileTraceStore` | 1k/10k 次 append、fsync、重新打开、完整查询、compaction、文件大小和批量大小对比 |
| OTel adapter | 官方 `InMemorySpanExporter` + `SimpleSpanProcessor`；每条记录 p95 以及 1k/10k 批次 |
| 等价于 1/10/100 个 agent 的数据包络 | 仅含元数据的 start/end 记录集；字节数和入队 p95 |
| 流式元数据 | 10k 个无载荷 `stream_chunk` 事件；字节数和入队 p95 |
| 队列压力/丢弃 | 有界队列按记录数与字节压力生成的快照 |

在仓库根目录构建后运行以下命令：

```bash
# Same-host historical comparison. The baseline must be a separately built
# OBS-1A/core dist, while candidate is this checkout's core dist.
node --expose-gc packages/core/benchmarks/observability-no-sink.mjs \
  /tmp/oma-obs1a-baseline/packages/core/dist/index.js \
  packages/core/dist/index.js

# Sink/store/OTel matrix.
node --expose-gc packages/core/benchmarks/observability-sinks.mjs \
  packages/core/dist/index.js packages/otel/dist/index.js

# File durability and query boundary.
node --expose-gc packages/core/benchmarks/file-trace-store.mjs

# Tolerant CI gate.
npm run bench:observability:ci
```

历史对比默认交替运行九轮，每轮 2,000 次顶层运行。可用
`OMA_BENCH_ITERATIONS`、`OMA_BENCH_ROUNDS`、`OMA_BENCH_MEMORY_ITERATIONS`
和 `OMA_BENCH_MEMORY_ROUNDS` 覆盖默认值。请随结果记录所有覆盖项。

## 当前发布快照

OBS-5 最终专用运行环境：Node `v22.22.3`、macOS/Darwin `25.5.0`
`darwin-arm64`、Apple M1。历史墙钟时间对比使用 2,000 次运行 × 9 个交替轮次；
留存内存对比使用 2,000 个保留结果 × 3 个交替轮次。微秒 p95 样本使用 10,000 个
旧版/批处理事件和 1,000 条预热后的 OTel 记录。

| 检查项 | 结果 | 闸值 |
|---|---:|---:|
| 无 sink 的中位数回归 | `-0.530%`（基线 18.743 ms；候选 18.644 ms） | `<1%` |
| 每个结果额外留存字节 | `-1.18 B`（基线 1,154.16 B；候选 1,152.98 B） | `<1,024 B` |
| 旧版分发 p95 | `0.125 µs` | `<10 µs` |
| 批处理入队 p95 | `1.250 µs` | `<20 µs` |
| OTel 转换/processor p95 | `15.208 µs` | `<50 µs` |

五个专用闸值全部通过。历史基线为已构建的 OBS-1A merge
`58096804a04c241a4c02943050acc4c89c884a85`；测量前已确认基线快照中的关键源码
blob hash 与该 commit 一致。

### 矩阵快照

| 路径 | 1k 条记录 | 10k 条记录 |
|---|---:|---:|
| InMemory append | 5.14 ms | 36.33 ms |
| InMemory 首屏查询 | 15.20 ms | 42.46 ms |
| InMemory 预估留存 heap | 414,384 B | 1,878,976 B |
| OTel 转换 + 内存处理 | 12.24 ms | 79.00 ms |
| File append（完成写入） | 12.47 ms | 84.80 ms |
| File fsync | 3.56 ms | 7.60 ms |
| File 重新打开/重建索引 | 9.77 ms | 63.51 ms |
| File 完整分页查询 | 16.33 ms | 339.57 ms |
| File compaction | 32.65 ms | 933.37 ms |

文件相关行代表 500/5,000 次逻辑运行（每次两条记录）。compaction 前文件大小为
431,818/4,393,820 字节，之后为 427,810/4,353,812 字节。对于 1,000 条记录，
批量大小为 1、10、100 和 1,000 时，append 分别耗时 158.99 ms、26.62 ms、
9.04 ms 和 7.92 ms。

等价元数据包络的入队 p95 为：1 个 agent 时 1.291 µs、10 个 agent 时
1.250 µs、100 个 agent 时 1.250 µs，每行至少使用 1,000 个计时样本。具有代表性的
100-agent 包络包含 402 条记录、共 202,500 字节，占默认 16 MiB 队列的 1.21%。
一万个无载荷流式元数据事件占用 4,196,674 字节，入队 p95 为 1.084 µs。

压力注入符合设计：100 条记录的队列接受 1,000 个事件、保留 100 个并报告 900 次丢弃；
相当于四条记录的字节上限接受 100 个事件、保留 4 个并报告 96 次丢弃。没有观察到
无界增长或静默丢失。

完整确定性运行的中位数分别为 9.001 µs/run（无 sink）、15.185 µs/run（旧版回调）
和 59.117 µs/run（batch sink）。这些端到端相对数字包含每次运行创建六条 v2 记录与
计算 JSON 字节数的开销；RFC 发布闸值是热路径 p95 与历史无 sink 对比，不承诺启用
tracing 后完全没有额外工作。

## 内容采集边界

本版本没有公开的 content-on 模式。`TraceCapturePolicy` 保持默认仅采集元数据的契约，
`@open-multi-agent/otel` 也只暴露已禁用的内容采集扩展点。因此，content-on 基准测试
是明确的非目标，并非遗漏的矩阵行。不会仅为填满矩阵而增加合成 prompt 或工具载荷
路径；仅采集元数据仍是产品基线。

## 如何解读存储数字

- `InMemoryTraceStore` 的数字包含进程内索引，不构成持久性承诺。
- `FileTraceStore.append()` 表示写入完成，`flush()` 和 `close()` 才是 fsync 边界；
  两者应分开报告。
- 重新打开耗时包含完整扫描追加日志与重建内存索引。
- compaction 包含同目录临时写入、fsync、原子 rename，以及尽力而为的父目录 fsync；
  它不是数据库 vacuum 或多进程测试。
- 队列压力输出预期会显示丢弃。通过意味着内存保持有界且丢弃会出现在统计/diagnostic
  中，不意味着任何记录都不会丢失。
