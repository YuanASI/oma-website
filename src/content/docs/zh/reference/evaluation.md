---
title: "评估"
description: "对 EvalSet 进行版本管理，运行参考 scorer，用离线报告为 CI 设闸，持久化结果，并对生产运行进行采样。"
---

`@open-multi-agent/core/eval` 子路径用于离线衡量智能体与多智能体质量，也可以通过尽力而为的在线采样进行衡量。评估观察已完成的结果，绝不会改变业务结果。

运行时验证与评估分别适用于不同工作：

| | `runConsensus()` / 每任务 `verify` | 评估 |
|---|---|---|
| 时机 | 单次业务运行期间 | 离线批量执行，或实时运行后的异步执行 |
| 是否改变业务结果 | 是：可能接受、修订或拒绝 | 否 |
| 衡量对象 | 一个结果 | 案例、版本、回归与趋势 |
| 失败含义 | 影响运行时 verdict | 产生 `scorer_error`；绝不会变成零分 |
| 输出 | `ConsensusResult` | `EvalRecord`、`EvalRunReport` 和 `GateVerdict` |

两种机制可以组合：验证保护单次运行，而 EvalSet 可以检测验证通过率随时间发生的变化。

## Scorer

```ts
import { defineScorer, type ScorerContext } from '@open-multi-agent/core/eval'

const exact = defineScorer({
  name: 'exact-match',
  version: '1',
  score({ output, evalCase }) {
    const hit = output === evalCase.expected
    return { score: hit ? 1 : 0, pass: hit }
  },
})

const context: ScorerContext = {
  evalCase: { id: 'capital-france', input: 'Capital of France?', expected: 'Paris' },
  output: 'Paris',
  metadata: { promptVersion: 'v2' },
  signal: new AbortController().signal,
}

const result = await exact.score(context)
console.log(result.score) // 1
```

分数必须是从 `0` 到 `1` 的有限数值。`pass` 是可选的，因此后续闸门可以应用自己的阈值。`defineScorer()` 会冻结 scorer 定义，并校验同步和异步结果。scorer 可以省略 `version`，但 OMA 会针对每个 scorer 名称警告一次，因为闸门随后无法区分评分逻辑漂移与目标漂移。规则、提示词、judge 模型或 judge 配置发生变化时，都要递增版本。

## Scorer 失败不是零分

抛出错误、被拒绝或超过超时的 scorer 并未衡量质量。`runEvalSet()` 会把该结果记录为 `status: 'scorer_error'` 的 `EvalRecord`，规范化错误，继续执行后续 scorer，并在分数平均值、百分位数和通过率中排除该失败。不要用 `{ score: 0 }` 代替 scorer 失败。

如果目标本身抛出错误，该样本会在保留的 scorer 名称 `_target` 下产生一条 `target_error` 记录，其 scorer 不会运行。eval 子路径还定义了 `EvalRecord` 形状和 schema 主版本。

### 参考 scorer

参考 scorer 是刻意保持精简的示例，而不是通用质量标准。请从 `@open-multi-agent/core/eval` 导入：

| 工厂 | 分数含义 | 所需数据与缺失数据时的行为 |
|---|---|---|
| `toolCallSuccessScorer()` | 成功工具 span / 全部工具 span | 有 trace 时使用 trace 状态。仅有结果的 `ToolCallRecord` 没有错误标志，因此已完成的结果调用会视为成功。没有调用时返回 `1`，同时给出 `details.tool_calls = 0` 和明确的不适用原因。 |
| `structuredOutputComplianceScorer(schema?)` | `AgentRunResult.structured` 存在，且在提供 Zod schema 时通过校验则为 `1` | 仅适用于智能体配置含 `outputSchema` 的目标。缺少结构化输出是已衡量的失败（`0`），而不是基础设施缺失。 |
| `costBudgetScorer({ maxTokens?, maxCostAmount? })` | 硬阶跃：处于所有可观测上限内则为 `1`，否则为 `0` | token 来自 OMA 结果；成本来自 `StoredRun.costs`。不可用维度会在 `reason` 和 `details.data_complete` 中列出；没有可观测维度时返回 `1` 并带有 `applicable: false`。多种货币会抛出错误并成为 `scorer_error`，而不会被错误相加。 |
| `dependencyUtilizationScorer()` | 已完成的含依赖任务 span / 全部含依赖任务 span | 需要 trace。这是保守的依赖链完成代理指标；它能证明相连的前置任务与依赖任务均已完成，不能证明模型在语义上使用了前置文本。 |
| `duplicateWorkScorer({ threshold? })` | `1 - duplicatePairs / comparedPairs` | 同时需要 trace 和 `TeamRunResult`。trace 用来识别任务 ID，实际输出来自 `agentResults`。相似度是基于规范化字符三元组的 Jaccard。输出少于两个时，明确返回不适用的 `1`。 |
| `noProgressScorer({ maxStallTurns? })` | 处于允许的连续停滞次数内则为 `1`；超过后为 `maxStallTurns / observedMaximum` | 需要 trace。停滞指一次失败的任务-智能体尝试：发生了 LLM 工作，但没有工具调用，也没有任务完成。这衡量智能体尝试，不是语义推理轮次。 |
| `createAnswerRelevancyScorer({ judges, ... })` | 输入与预期输出之间直接相关性的 judge 平均分 | 对 `createJudgeScorer()` 的轻量封装，使用固定的 `{ score, reason }` schema。应把它视为需要按自己的数据进行版本管理和校验的提示词模板。 |

三个结构感知 scorer 暴露了多智能体 DAG 特有的行为，同时保持隐私意识：trace 不会持久化任务输出正文。因此，依赖利用率和无进展使用如实的结构代理指标，而重复工作从内存中的 `TeamRunResult` 读取输出，只使用 trace 选择任务执行。请让这三个 scorer 配合离线 `runEvalSet(..., { traceStore })` 使用；在线采样不会为 scorer 加载 trace。

```ts
import {
  createAnswerRelevancyScorer,
  toolCallSuccessScorer,
} from '@open-multi-agent/core/eval'

const scorers = [
  toolCallSuccessScorer(),
  createAnswerRelevancyScorer({
    version: 'relevancy-prompt-v1',
    judges: [{ name: 'judge', model: 'claude-sonnet-4-6', provider: 'anthropic' }],
  }),
]
```

## 五分钟离线评估快速入门

```ts
import {
  defineEvalSet,
  defineScorer,
  runEvalSet,
  type EvalTarget,
} from '@open-multi-agent/core/eval'

const set = defineEvalSet({
  name: 'greetings',
  version: '1.0.0',
  cases: [
    { id: 'a', input: 'hi', expected: 'HI', tags: ['upper'] },
    { id: 'b', input: 'yo', expected: 'YO', tags: ['upper'] },
  ],
  defaults: { concurrency: 2 },
})

const target: EvalTarget = async (input) => ({
  output: String(input).toUpperCase(),
})

const exact = defineScorer({
  name: 'exact',
  version: '1',
  score({ output, evalCase }) {
    const pass = output === evalCase.expected
    return { score: pass ? 1 : 0, pass }
  },
})

const report = await runEvalSet(set, target, {
  scorers: [exact],
  repeats: 2,
  metadata: { prompt_version: 'v2' },
})

console.log(report.records.length)          // 4
console.log(report.aggregates[0]?.avg)      // 1
console.log(report.aggregates[0]?.passRate) // 1
```

`defineEvalSet()` 会校验非空名称、版本和案例，要求案例 ID 唯一，并返回深度冻结的副本。把 `version` 视为内容版本，案例变化时递增版本。`filterTags` 会选择与任一请求标签匹配的案例。`repeats` 和 `concurrency` 会覆盖集合默认值。

每个案例/重复的目标运行一次，随后该样本的 scorer 串行运行。不同样本最多以 `concurrency`（默认 `2`）并行运行。中止会停止调度新样本，等待已启动样本，并返回带 `aborted: true` 的部分报告。

报告百分位数使用最近秩方法。对于两个排序后的分数，p50 是较低分，p95 是较高分。`passRate` 只包含显式带有 `pass` 的已评分记录；所有分数分母都会排除 scorer 错误。`byTag` 会对每个案例标签重复同样的聚合。每个样本的目标 token 用量只计算一次，即使运行多个 scorer；成本也只在相同货币内相加。

## 在线采样生产运行

在线评估需要在 `OpenMultiAgent` 上选择启用。已结束的顶层运行只会同步执行采样决策和有界队列准入；scorer 与 store 写入随后运行，绝不会改变业务结果。

```ts
import { OpenMultiAgent } from '@open-multi-agent/core'
import {
  InMemoryEvalStore,
  defineScorer,
} from '@open-multi-agent/core/eval'

const onlineStore = new InMemoryEvalStore()
const lengthScorer = defineScorer({
  name: 'length',
  version: '1',
  score({ output }) {
    const length = String(output).length
    return { score: Math.min(1, length / 200), pass: length >= 40 }
  },
})

const orchestrator = new OpenMultiAgent({
  evaluation: {
    scorers: [lengthScorer],
    sample: 0.05,
    maxConcurrent: 1,
    maxQueueLength: 100,
    budget: { maxEvaluationsPerMinute: 30 },
    store: onlineStore,
  },
})

const run = await orchestrator.runAgent(agent, prompt)
// The business result does not wait for lengthScorer or onlineStore.
console.log(run.success)

await orchestrator.evaluation.forceFlush({ timeoutMs: 1_000 })
const page = await onlineStore.query({ runId: [run.identity!.runId] })
console.log(page.items[0]?.source) // online
```

`runAgent`、`runTeam`、`runTasks`、`runFromPlan`、`runConsensus` 和 `restore` 都使用 `OpenMultiAgent` 实例拥有的同一个 evaluator。因此，其 `evalRunId` 在该实例生命周期内保持稳定。每个采样运行会为每个 scorer 产生一条 `source: 'online'` 的 `EvalRecord`，不含 EvalSet 或案例 ID，并带有包含准确逻辑运行与尝试次数的 `runRef`。

数值采样使用 `Math.random() < sample`。规则可以根据规范化状态和经过校验的运行元数据进行选择，无需实现尾部采样：

```ts
const failuresOnly = new OpenMultiAgent({
  evaluation: {
    scorers: [lengthScorer],
    sample: (context) =>
      context.status.code !== 'ok'
      && context.metadata['deployment'] === 'canary',
    store: onlineStore,
  },
})
```

抛出错误的采样规则会被视为 `false` 并得到诊断。scorer 抛出错误、被拒绝或超时时会产生 `scorer_error` 记录。被拒绝的 store append 会丢弃该样本的整批记录。队列溢出、预算耗尽、回调和所有评估失败都与原始运行结果隔离。

在线默认值刻意保持保守：省略配置或 `sample` 为 `0` 时关闭评估；`maxConcurrent` 为 `1`，`maxQueueLength` 为 `100`，载荷持久化为 `none`，每个诊断代码最多每 60 秒警告一次，并且没有隐式速率或成本上限。必须显式设置 `diagnostics: 'silent'`。`getStats()` 返回累计的 `sampled`、`enqueued`、`completed`、`dropped`、`failed` 和 `storeFailed` 计数。

`maxEvaluationsPerMinute` 计算 scorer 评估次数，因此一个带三个 scorer 的采样运行会消耗三个单位。`maxCostPerHour` 使用调用方已有的 `OrchestratorConfig.estimateCost` 函数，以及 `createJudgeScorer` 等框架支持 scorer 暴露的模型用量。上限使用 `estimateCost` 返回的同一调用方自定义单位，可能因当前正在运行的 scorer 工作而超限，并随滚动小时推进而恢复。规则 scorer 没有模型用量，成本为零。自定义模型 scorer 无法计费，除非使用会报告内部用量的框架 scorer。配置 `maxCostPerHour` 但未配置 `estimateCost` 时，上限保持未启用并发出一次无载荷警告；它绝不会静默阻止运行。

`storePayloads: 'none'` 向 scorer 提供不含内容的运行输入描述，也不持久化输入或输出。`'redacted'` 向 scorer 和记录提供有界、已脱敏的输入字符串，并持久化有界、已脱敏的输出；`'full'` 同样处理但不脱敏，必须是显式隐私决策。scorer 始终会在内存中收到候选输出，以便评分。尤其是 judge scorer 会把该输出发送给其配置的模型提供方；对于不可离开其信任边界的数据，不要启用外部 judge。

### 生命周期所有权

应用负责 evaluator 生命周期。OMA 不安装信号处理器，也不调用 `process.exit()`。所有 evaluator 定时器都不会保持引用，因此不会让 CLI 或 serverless 进程继续存活。这也意味着进程崩溃或自然退出可能丢失排队中的工作：第一版实现在进程内运行、尽力而为，并且有意不提供持久性。持久化或跨进程评分队列属于未来的独立集成，不是 `EvalStore` 的保证。

```ts
// Serverless/FaaS: flush this invocation; keep a shared singleton usable.
const result = await orchestrator.runAgent(agent, prompt)
const evaluation = await orchestrator.evaluation.forceFlush({ timeoutMs: 1_500 })
return { result, evaluation: evaluation.status }

// Short-lived CLI: settle accepted samples before natural process exit.
try {
  await main()
} finally {
  await orchestrator.evaluation.forceFlush({ timeoutMs: 5_000 })
  await orchestrator.evaluation.shutdown({ timeoutMs: 5_000 })
}

// Long-lived server: stop traffic, then drain and close on graceful shutdown.
async function stopServer() {
  await stopAcceptingAndWaitForInflight(server)
  await orchestrator.evaluation.forceFlush({ timeoutMs: 10_000 })
  await orchestrator.evaluation.shutdown({ timeoutMs: 10_000 })
  await provider?.shutdown()
}
// Register stopServer with your server/process framework if desired.
```

`forceFlush()` 会等待其水位线之前已接受的样本，并返回 `ok`、`partial`、`timeout` 或 `error` 以及累计计数。`shutdown()` 会原子地拒绝新样本、刷新其截止点，并且是幂等的：重复或并发调用共享第一次结果。`OpenMultiAgent.shutdown()` 仍是现有的团队注册表重置；evaluator 关闭需要通过 `orchestrator.evaluation` 显式执行。

在在线评估维护者基准中（Node 22，同一进程内直接准入 50,000 次），采样加有界入队在实现主机上的 p95 约为 `0.42 µs`（平均 `0.30 µs`）。绝对微秒值随主机而异；CI 还为未配置路径保留了现有的可观测性同主机回归闸门。

## EvalStore

将 `InMemoryEvalStore` 用于短期本地运行、测试或适配器原型。把它传给 `runEvalSet()`，可为每个已完成的案例/重复样本持久化一个原子批次：

```ts
import {
  InMemoryEvalStore,
  runEvalSet,
} from '@open-multi-agent/core/eval'

const store = new InMemoryEvalStore()
const storedReport = await runEvalSet(set, target, {
  scorers: [exact],
  store,
})

const first = await store.query({
  evalRunId: storedReport.evalRunId,
  scorer: ['exact'],
  order: 'time_asc',
  limit: 100,
})
```

`EvalStore.append()` 对每个批次是原子的，并按 `recordId` 保持幂等。查询可以按评估运行、引用的 OMA 运行、EvalSet 名称、scorer、来源、状态，以及包含边界的 `after` / 不含边界的 `before` 时间戳筛选。结果采用稳定的 `(timestampUnixMs, recordId)` 顺序。默认页面上限为 100，最大为 1,000。

游标是不透明快照。第一页之后的 append 不会在该分页序列中造成缺口或重复。游标只对相同 store 实例和规范化查询有效；更改筛选条件、删除记录或重新打开文件 store 都会使它失效。不要把游标解析或持久化为数据。

可选的 `InMemoryEvalStore({ maxRecords })` 容量是硬上限。会超过容量的批次将被原子拒绝。需要驱逐时，请显式使用保留策略：

```ts
await store.applyRetention({
  maxAgeMs: 30 * 24 * 60 * 60 * 1_000,
  maxRecords: 10_000,
  sources: ['offline'],
})

await store.delete({
  evalSetName: 'greetings',
  before: new Date('2026-01-01T00:00:00.000Z').toISOString(),
})
```

删除和保留操作是幂等的。在二者共用的 `DeleteResult` 中，`runIds` 包含受影响的 `evalRunId` 值，`runsDeleted` 计算受影响的不同评估运行数，`recordsDeleted` 计算记录数。`sources` 保留范围只把时间和数量限制应用到这些来源；当它是唯一字段时，会删除选中来源的全部记录。

对于持久化本地存储，请单独导入仅限 Node 的实现：

```ts
import { FileEvalStore } from '@open-multi-agent/core/eval/file'

const fileStore = await FileEvalStore.open('./eval-results/history.ndjson', {
  onDiagnostic(diagnostic) {
    console.warn(diagnostic.code, diagnostic.message)
  },
})

await fileStore.append(storedReport.records)
await fileStore.flush()
await fileStore.compact()
await fileStore.close()
```

`FileEvalStore` 是单进程参考实现，不是生产数据库或跨进程协调层。它维护仅追加、带 schema 版本的 NDJSON 变更日志，并在打开时重建内存索引。已提交批次要么完整可见，要么完全不可见；进程或机器崩溃最多丢失最后一个尚未持久化的批次。`flush()` 是显式 fsync 边界。恢复只会截断不完整的末行或批次并发出诊断；完整损坏会响亮地失败。

压缩会写入 `<file>.compact.tmp`，对其执行 fsync，将其原子重命名覆盖目标，然后在支持的平台上对父目录执行 fsync。残留临时文件绝不会覆盖现有目标。当需要多进程、大数据量或服务端聚合时，请使用数据库支持的 `EvalStore` 适配器。

store 会保留受支持 schema 主版本中的未知字段，使未来的小版本新增字段可在往返后保留。更高的 `schemaVersion` 主版本会被拒绝，而不是降级。`EvalStore` 有意不提供聚合方法：请从查询到的记录在内存中计算趋势。需要下推聚合，意味着应引入数据库适配器，而不是向接口加入文件特有概念。

持久化对评估运行是故障开放的。如果样本批次无法存储，`runEvalSet()` 仍会返回完整记录与聚合结果，并针对该样本向 `report.warnings` 加入一条不含载荷的记录。

## 评估 OMA 运行

当被评估系统是 OMA 智能体、团队或固定计划时，使用便捷目标：

```ts
import { Team, type AgentConfig, type PlanArtifact } from '@open-multi-agent/core'
import {
  targetFromAgent,
  targetFromPlan,
  targetFromTeam,
} from '@open-multi-agent/core/eval'

declare const agent: AgentConfig
declare const team: Team
declare const plan: PlanArtifact

const agentTarget = targetFromAgent(agent, {
  metadata: { prompt_version: 'v2' },
})
const teamTarget = targetFromTeam(team)
const planTarget = targetFromPlan(team, plan)

void agentTarget
void teamTarget
void planTarget
```

智能体与团队目标会用 `String(input)` 转换非字符串输入，并将其用作 prompt 或 goal。计划目标会重放给定的 `PlanArtifact`；该计划固定任务与目标。这些包装器会返回 OMA 结果和主输出，注入 `eval_case` 与从一开始计数的 `eval_repeat` 运行元数据，并加入可用的模型/提供方指纹。runner 使用结果身份设置 `runRef`，使用结果用量设置报告总计。提供 `traceStore` 时，它还会把匹配的 `StoredRun` 加载到 `ScorerContext.trace`。

记录元数据按以下顺序合并，后面的值胜出：案例元数据、`runEvalSet()` 元数据，然后是便捷目标回显的元数据（包括其配置指纹）。

## 加载 EvalSet 并写入报告

文件 I/O 隔离在仅限 Node 的 `@open-multi-agent/core/eval/file` 子路径中。根包和 `@open-multi-agent/core/eval` 不导入该入口点。

```ts
import {
  loadEvalReport,
  loadEvalSet,
  loadGatePolicy,
  writeEvalReport,
} from '@open-multi-agent/core/eval/file'

const setFromJson = await loadEvalSet('./evals/greetings.json')
const fileReport = await runEvalSet(setFromJson, target, { scorers: [exact] })

await writeEvalReport(fileReport, { format: 'json', path: './report.json' })
await writeEvalReport(fileReport, { format: 'markdown', path: './report.md' })
await writeEvalReport(fileReport, { format: 'junit', path: './report.junit.xml' })

const policy = await loadGatePolicy('./evals/gate.json')
const baseline = await loadEvalReport('./evals/baseline.json')
```

`loadEvalSet()` 解析 JSON，应用与 `defineEvalSet()` 相同的校验和深度冻结，并在校验错误中包含解析后的文件路径和第一个 schema 问题。`writeEvalReport()` 会按需创建父目录，并支持：

- `json`：权威、经过美化打印的 `EvalRunReport` 表示。
- `markdown`：用于人工审查的元数据、scorer 和标签聚合、失败样本及总计。过长的失败原因会被截断。
- `junit`：每条记录一个 testcase。`pass: false` 变成 `<failure>`；`scorer_error` 和 `target_error` 变成 `<error>`；不含 `pass` 且没有错误的记录是成功 testcase。XML 名称和消息都会完全转义。

`loadGatePolicy()` 和 `loadEvalReport()` 校验各自带 schema 版本的 JSON 契约，并报告解析后的文件路径与第一个无效字段。加载的对象会防御性复制并深度冻结。

## 从 CLI 运行评估

构建或安装软件包后，可以从 shell 或 CI 作业评估一个无需网络的目标：

```bash
oma eval run --set ./evals/greetings.json --target ./evals/target.mjs \
  --report json --report junit --out ./eval-results \
  --gate ./evals/gate.json --baseline ./evals/baseline.json \
  --meta prompt_version=v2
```

目标模块必须默认导出一个 `EvalTarget` 函数或 `{ target, scorers? }`。可选的 `--scorers` 模块默认导出一个 `Scorer[]`；两个来源中的 scorer 名称必须唯一。CLI 会以当前进程权限动态导入并执行这些用户模块，因此必须信任它们。

报告写在 `<out>/<evalRunId>/` 下；`--out` 默认为 `./eval-results`。`--report` 可重复，默认为 JSON。`--meta key=value` 也可重复，所有值都是字符串。完整参数与退出码契约见 [CLI 参考](/zh/reference/cli/#oma-eval-run)。

不带 `--gate` 时，低分和 `pass: false` 记录不会改变退出码。带 `--gate` 时，stdout 摘要包含 verdict 及其路径，原样的 `{ pass, failures, warnings }` 对象会写入 `<out>/<evalRunId>/verdict.json`。闸门失败或所有选中目标都失败时以 1 退出。用法/文件/模块错误以 2 退出。`--baseline` 要求同时设置 `--gate`。

## 在 CI 中设置质量闸门

`evaluateGate()` 是从 `@open-multi-agent/core/eval` 导出的纯逻辑：

```ts
import { evaluateGate } from '@open-multi-agent/core/eval'

const verdict = evaluateGate(report, {
  schemaVersion: 1,
  thresholds: [
    // A rule scorer plus passRate=1 is a deterministic quality gate.
    { scorer: 'exact', metric: 'passRate', min: 1 },
    { scorer: 'relevancy', metric: 'avg', min: 0.8 },
    { scorer: 'relevancy', metric: 'p50', min: 0.85, tag: 'critical' },
  ],
  maxScorerErrorRate: 0.1,
  maxTargetErrorRate: 0,
  baseline: {
    maxRegression: 0.05,
    perScorer: { exact: 0 },
  },
}, baseline)

if (!verdict.pass) process.exitCode = 1
```

等价的 JSON 策略如下：

```json
{
  "schemaVersion": 1,
  "thresholds": [
    { "scorer": "exact", "metric": "passRate", "min": 1 },
    { "scorer": "relevancy", "metric": "avg", "min": 0.8 },
    { "scorer": "relevancy", "metric": "p50", "min": 0.85, "tag": "critical" }
  ],
  "maxScorerErrorRate": 0.1,
  "maxTargetErrorRate": 0,
  "baseline": {
    "maxRegression": 0.05,
    "perScorer": { "exact": 0 }
  }
}
```

阈值支持 `avg`、`p50`、`p95`、`min` 和 `passRate`，可选按标签限定范围，并使用包含边界的 `min`/`max`。缺少 scorer、标签或 `passRate` 来源属于配置失败，而不是静默通过。默认健康度检查会在 scorer 错误超过已评分记录加 scorer 错误记录的 10%，或任何选中目标失败时判定失败。

每个 verdict 只包含 `pass`、`failures` 和 `warnings`。失败项含稳定的 `kind`，可选的 scorer/metric/tag 坐标，观测到的 `actual`、配置的 `limit` 和便于阅读的 `message`。对于可用性问题而非实测分数，`missing_scorer` 使用 `actual: 0` 和 `limit: 1`，`baseline_mismatch` 使用 `actual: 1` 和 `limit: 0`。

基线就是普通的 JSON `EvalRunReport`，不是第二种文件格式。推荐工作流如下：

1. 用 `--report json` 运行已接受目标，把其 `report.json` 复制到经过审查的位置，例如 `evals/baseline.json`。
2. 将该报告与其版本化 EvalSet 和闸门策略一起提交。
3. 在 CI 中使用 `--baseline` 比较候选报告。
4. 只有在有意审查并接受行为变化后才更新基线；CLI 绝不会自动更新。

集合名称或版本不匹配默认会失败。只有明确需要警告并跳过回归检查时，才把 `baseline.allowSetMismatch` 设为 `true`。当 scorer 版本不同时，OMA 会警告并跳过该 scorer 的回归检查，因为变化后的 judge 提示词或模型不会产生可比较的分数。阈值与健康度检查仍会运行。如果配置了基线规则但未提供基线报告，OMA 会警告并跳过回归检查。

当报告生成和质量执行是分开的 CI 阶段时，使用 `oma eval gate`。它会向 stdout 打印原样的 verdict JSON：

```bash
oma eval gate --report ./candidate/report.json --gate ./evals/gate.json \
  --baseline ./evals/baseline.json
```

GitHub Actions 作业可以保留两种机器可读报告，同时让闸门控制步骤状态：

```yaml
- name: Run deterministic evaluation gate
  run: |
    oma eval run --set ./evals/set.json --target ./evals/target.mjs \
      --gate ./evals/gate.json --baseline ./evals/baseline.json \
      --report json --report junit --out ./eval-results || exit 1

- name: Upload evaluation JUnit report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: evaluation-junit
    path: eval-results/**/report.junit.xml
```

## 内存评估指标

`MemoryExtractionSample` 和 `MemoryRetrievalSample` 是未来内存 scorer 的实验性输入形状；此版本不新增内存运行时，也不提供自动内存写入器。以下指标可以用现有规则 scorer 或 judge scorer 实现：

| 阶段 | 指标 | 定义 |
|---|---|---|
| 提取 | 产出率 | 相对于对话、token、延迟或货币成本的有效提取记录数。任何比率旁都要报告原始计数。 |
| 提取 | 重复与冲突率 | 重复、矛盾或未增加持久信息的记录占比。规则检查可以捕获完全重复；语义冲突需要版本化 judge。 |
| 提取 | 过时标注率 | 对时间敏感的记录中，带有足够溯源或过期信息、可识别过时风险的占比。 |
| 提取 | 范围泄漏 | 写入团队范围的私有内容。这是安全闸门：任何非零泄漏都会失败。 |
| 提取 | 成本与原因 | 提取延迟和 token，以及跳过与合并原因的分布。 |
| 检索 | 相关性 | 查询与检索记录之间的 judge 分数。对 rubric 和 judge 配置进行版本管理。 |
| 检索 | 遗漏 | 本应返回但未返回的可用正向记录。 |
| 检索 | 污染 | 对同一案例分别在注入和不注入检索内存时运行；注入后主分数下降属于有害污染。 |
| 检索 | 额外成本 | 检索和 prompt 注入导致的额外 token 与延迟。 |

自动提取或整合在同时通过版本化离线 EvalSet 闸门和在线采样前，不应默认启用。范围泄漏始终是硬安全闸门，不受平均质量影响。

## 隐私

EvalSet 案例可能包含私有用户数据。因此 `storePayloads` 默认为 `'none'`，记录含分数、原因、元数据和运行引用，但不含输入/输出快照。`'redacted'` 会序列化每个载荷字段，将其限制在 8 KiB，并应用 OMA 现有的密钥脱敏。`'full'` 会保留未经脱敏的序列化文本，但仍应用 8 KiB 上限；只对你准备保留的数据选择启用。无论记录载荷存储设置为何，基于模型的 judge 都必然会把被评估输出发送给配置的 judge 模型。

## 可复现性与没有 seed

OMA 当前的提供方契约没有跨提供方 seed 参数，也不记录 LLM 响应。因此，向 `EvalSet` 添加 seed 会承诺框架无法提供的确定性。使用 `repeats` 对非确定性行为采样并比较聚合统计。`targetFromPlan()` 会固定编排计划，但模型响应仍可能变化。

## 使用 OMA 智能体作为 judge

```ts
import { z } from 'zod'
import { createJudgeScorer } from '@open-multi-agent/core/eval'

const relevancy = createJudgeScorer({
  name: 'relevancy',
  version: 'prompt-v1',
  judges: [
    { name: 'judge-a', model: 'claude-sonnet-4-6', provider: 'anthropic' },
    { name: 'judge-b', model: 'gpt-5', provider: 'openai' },
  ],
  quorum: 2,
  timeoutMs: 30_000,
  verdictSchema: z.object({
    score: z.number().min(0).max(1),
    pass: z.boolean(),
    reason: z.string(),
  }),
})

const result = await relevancy.score(context)
console.log(result.score, result.pass)
```

judge 分数会取平均值。当 verdict schema 返回布尔值 `pass` 时，scorer 在达到配置的 quorum 后返回 `pass: true`。默认 verdict schema 只含 `score` 和 `reason`，因此默认结果不会设置 `pass`。

`result.details.judges`、`result.details.models` 和 `result.details.scores` 是并行数组：相同索引的值描述同一个 judge。这种扁平表示与 trace attribute 值保持兼容，同时保留模型漂移证据。judge 模型、配置或 prompt 变化时都要递增 scorer `version`。

## 常见问题

### Scorer 错误应该计为零分吗？

不应该。这意味着质量没有得到衡量。OMA 会记录 `scorer_error`，将其排除在分数分母外，并让闸门健康度上限决定评估基础设施是否足够可靠。

### 为什么基线 scorer 比较产生了警告？

候选与基线的 scorer 版本不同，或其中一方省略了该 scorer。OMA 仍会应用绝对阈值和健康度检查，但会跳过无效的同类不同比较回归。请审查 scorer 变化，并有意创建一份新的已接受基线。

### 评估会延迟业务响应或导致它失败吗？

离线评估是单独调用。在线评估只在运行结束后同步执行采样和有界队列决策；评分与持久化尽力而为且彼此隔离。主机必须在退出前等待已接受样本时，调用 `forceFlush()`。

### `targetFromPlan()` 会让 LLM 运行具有确定性吗？

它会固定任务图，并避免协调器再次拆解。模型响应仍可能变化，因为 OMA 没有跨提供方 seed 契约。使用 `repeats` 并比较分布。

### 在哪里可以查看完整示例？

运行 `examples/patterns/eval-offline-regression.ts` 查看无需密钥的双目标闸门，或运行 `examples/patterns/eval-online-sampling.ts` 查看 `FileEvalStore` 生命周期。
