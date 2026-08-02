---
title: 执行路由
description: "通过显式模式、治理策略、自定义路由器和可审计的路由决策，为 runTeam 选择单智能体或团队执行。"
---

执行路由决定一次自动 `runTeam()` 调用采用哪种执行拓扑：直接使用一个 Agent
（`single`），或让 Coordinator 构建并执行 Team 计划（`team`）。它与
[模型路由](/zh/reference/model-routing/)相互独立；模型路由负责为已选拓扑内部的
调用选择模型。

## 优先级

`runTeam()` 按以下顺序解析拓扑：

1. 显式 `mode: 'single' | 'team'`；
2. 声明的治理拓扑或 `preferredUnderBudget` 降级策略；
3. 单次运行或编排器级的自定义 `executionRouter`；
4. 内置 `DeterministicRouter`；
5. 当 `executionRouting.strategy` 为 `hybrid`，且默认 / fallback 的确定性结果是
   Single 时，进入语义 `TaskProfiler` 与确定性语义策略。

路由器只参与自动、非 `planOnly` 的拓扑选择，不会覆盖显式模式、声明的角色拓扑
或治理预算策略。`governanceIntent: 'none'` 保留自动拓扑选择，但对高影响工具确认
来说仍属于显式治理声明。

自定义 Router 给出的有效决策是终局的，Profiler 不会重新解读它。如果自定义 Router
失败、且其确定性 fallback 选择了 Single，Hybrid 路由可以对这个 fallback 候选做
语义分析。

## 混合语义路由

Hybrid 需要显式开启。它保留成本低廉的确定性 Team 决策，只在路由器本来会选择 Single
时，才增加至多一次不带工具的模型调用：

```ts
const orchestrator = new OpenMultiAgent({
  executionRouting: {
    strategy: 'hybrid',
    confidenceThreshold: 0.7,
    failurePolicy: 'fallback',
  },
})
```

`LLMTaskProfiler` 产出一份严格的、与 provider 无关的 `TaskProfile`，其中只包含推断
出的语义信号：独立证据来源、独立评审、目标冲突、副作用意图、权限隔离、可分解性、
并行度、复杂度、置信度，以及有边界的理由。目标文本被当作不可信数据处理。Profiler
拿不到 Agent / Coordinator 的 system prompt、凭据、工具实现或完整权限细节，也不能
调用工具。

选择拓扑的不是模型。一套确定性策略会把 profile 与框架自身计算出的事实一起消费：

- 高置信度的独立证据、评审、冲突或真正可并行的工作，可以把 Single 升级为 Team；
- 推断出的副作用 / 隔离需求，如果与高影响的实际工具授权、或调用方声明的多个
  `permissionBoundary` 相交，会产生 `ROUTING_DECLARATION_REQUIRED`；
- 置信度不足或没有实质信号时保持 Single；
- V1 永远不会把 Team 改成 Single。

`ROUTING_DECLARATION_REQUIRED` 会在任何 Coordinator、worker 或可用工具的 Agent 启动
之前抛出。Profile 永远不会创建 `requiredRoles`、批准一次副作用，或证明治理已被满足。

内置 Profiler 按以下顺序解析 adapter：

1. 单次运行的 `executionRouting.adapter`；
2. 编排器级的 `executionRouting.adapter`；
3. 实际生效的 Coordinator adapter；
4. 用编排器默认 provider / 模型构造的 adapter。

被选中的 adapter 会收到作为不可信用户数据的目标文本。特别注意第 4 步：即使每个
worker 都用自己的 adapter、确定性 Single 路径原本根本不需要调用默认 provider，它
仍可能把目标发给 `defaultProvider`。有数据驻留或 provider 边界要求的应用，应配置
`executionRouting.adapter`、提供 Coordinator adapter，或选择
`strategy: 'deterministic'`。

`executionRouting.model` 遵循同样的「单次运行优先于编排器」优先级，再往后是
Coordinator 模型与默认模型。Profiler 的用量计入本次运行的 token / 成本预算，并出现在
路由 tracing 与 `TeamRunResult.totalTokenUsage` 中。

## 契约

```ts
import type {
  ExecutionRouter,
  RoutingContext,
  RoutingDecision,
} from '@open-multi-agent/core'

class ApplicationRouter implements ExecutionRouter {
  readonly version = 'application-router-v1'

  decide(context: RoutingContext): RoutingDecision {
    const mode = context.goal.startsWith('[team]') ? 'team' : 'single'
    return {
      mode,
      reasons: [`Application policy selected ${mode}.`],
      routerVersion: this.version,
    }
  }
}
```

`RoutingContext` 包含目标、结构化 roster 摘要，以及路由开始时可选的剩余 token /
成本上限。Roster 条目包含 `name`、生效的 `model` 与可选的直接声明工具数。
完整 `systemPrompt`、凭据、API Key、工具实现与模型输出都不会交给路由器。这个摘要
刻意保持精简，让后续的结构化能力模型可以扩展它，而不暴露 prompt。

可以在编排器上设默认值，也可以为单次调用覆盖：

```ts
const orchestrator = new OpenMultiAgent({
  executionRouter: new ApplicationRouter(),
})

const result = await orchestrator.runTeam(team, goal, {
  executionRouter: requestScopedRouter,
})
```

单次运行路由器优先于编排器路由器。有效决策必须满足：`mode` 为 `single` 或
`team`，`reasons` 为字符串数组，`routerVersion` 与路由器非空的 `version`
一致；可选 `confidence` 位于 0 到 1 之间；选择 `single` 时 roster 至少有一个成员。

## 失败行为

默认的 `failurePolicy: 'fallback'` 让路由基础设施保持建议性。如果自定义 Router
抛错、reject、超时或返回无效决策，OMA 会回退到 `DeterministicRouter`。Profiler
超时、拒绝、抛错或产出无效结构化输出时，同样保留那条确定性路由。

设为 `failurePolicy: 'fail'` 则改为终止。Profiler 失败使用
`ROUTING_PROFILER_FAILED`；Router / Profiler 超时使用 `ROUTING_TIMEOUT`。在抛出类型化
错误之前，运行 trace 会先以对应的错误或超时状态关闭，因此失败的路由不会留下一个
不完整的运行。机器可读的 `status`、`requestedRouterVersion` 与 `fallbackCode` 字段
让你不必再解析给人看的 `reasons`。

```ts
result.routingDecision
// {
//   mode: 'single',
//   reasons: [
//     'The goal has one concise action and no multi-stage structure.',
//     'Execution router fallback: custom decision failed (Error).'
//   ],
//   routerVersion: 'deterministic-v1',
//   status: 'fallback',
//   requestedRouterVersion: 'application-router-v1',
//   fallbackCode: 'router-error'
// }
```

每次 `runTeam()` 拓扑选择都会暴露 `TeamRunResult.routingDecision`。其中的
`source` 区分调用方 `override`、治理 `declared`、框架 `policy` 与自动
`router` 决策；只有 `router` 记录携带实际 `routerVersion`。参见
[五种路由 trace 来源分类](/zh/reference/observability/#trace-spans)，其中也包括
仅用于兼容的 `legacy-deterministic` 标签。

一旦跑过语义分析，结果与路由记录上都会带上 `semanticRoutingAssessment`。它会报告
推断出的 profile 及其版本、确定性的传统决策、语义建议、实际拓扑、用量，以及结构化
的 fallback 状态。真实执行的任务拓扑、最终工具授权与 `ExecutionReceipt` 仍然是治理
事实。

## 确定性默认值

不写 `executionRouting` 就是使用不带 Profiler 的确定性路由器。想在配置层面表达清楚
时，把 strategy 显式写出来：

```ts
const orchestrator = new OpenMultiAgent({
  executionRouting: { strategy: 'deterministic' },
})
```

这样不会产生额外的模型调用，并保留确定性 Router 的结果与自定义 Router 的回退行为。
只应对通过了文档中 Shadow 闸门的 provider 与模型开启 Hybrid。

显式把 `new DeterministicRouter()` 装成 `executionRouter`，同样会让那条有效的 Router
决策在优先级规则下成为终局，Profiler 不会重新解读它。但如果意图是兼容模式，优先用
`strategy: 'deterministic'`，因为它直接表达了「不带 Profiler」这一行为。

## 内置确定性策略

`DeterministicRouter` 包装唯一的 `isSimpleGoal()` 启发式；OMA 不维护第二套
互相竞争的启发式。

- 空 roster 不能选择 Single；否则由目标启发式决定。
- 继续识别英文的顺序、协调、并行与多交付物信号。
- 识别中文顺序标记（`先…然后`、`第一步/第二步`）、带圈序号、动作枚举、分号分隔
  子句与相连的动作动词。
- 识别日文（`まず…次に`、`第一に…第二に`、`ステップ1/手順1`）与韩文
  （`먼저…그다음`、`첫째…둘째`、`1단계/2단계`）顺序标记；对假名、Hangul
  或汉字开头的密集 `、` 枚举也会计数。标记必须成对出现，单独一个标记不会强制 Team。
- 长度使用低成本、script-aware 的信息量估算。CJK 字符——汉字、日文假名、韩文
  Hangul——按 2.25 单位计；普通拉丁词串近似 token 密度；很长且不分隔的字符串
  保留原始长度。

语言覆盖按真实能力分层，而不是宣称完全一致：

- **中文、日文和韩文**属于同一层：使用上述结构标记与 2.25 单位长度权重。
- **拉丁字母语言**共享英文长度处理。结构词模式仅针对英文，因此其他拉丁语言主要
  依据长度与标点，而不是本语言的顺序词。
- **其他文字系统**保守回退：每个非空白字符计一个单位，不使用结构标记，只依赖长度阈值。

CJK 动词连接式序列不是目标。中文保留动词连接模式，因为中文动词是稳定 token；
日文动词有て形、韩文有黏着式词尾，需要形态分析，而这套启发式刻意避免该复杂度，
因此以显式标记和枚举覆盖结构信号。

这套策略依然刻意保持低成本，而不是追求语义雄心。Hybrid 路由会在这一步之后，纠正
高置信度的 false-Single 情况。需要领域特定、权威决策的应用，仍应注入
`ExecutionRouter`，或声明显式模式 / 治理拓扑。

## 治理边界

执行路由不声明治理。无论哪个路由器选择 Single 或 Team，高影响工具 fallback
仍只把 `governanceIntent === undefined` 视为未声明。Router 决策与 TaskProfile 都不能
满足具名角色或独立审查要求；这些事实仍来自结构化治理声明与实际执行拓扑。

## 晋级标准

Shadow 评估是发布工程手段，不是面向用户的运行时模式：在 CI 与灰度中跑固定 fixture，
在不改变生产拓扑的前提下比对它的建议，只有在文档规定的准确率、无效输出、成本与延迟
闸门全部通过之后，才把某个 provider / 模型晋级为受支持的 Hybrid 用法。在线的历史成功率
学习与 Team 降为 Single 的优化不属于 V1。
