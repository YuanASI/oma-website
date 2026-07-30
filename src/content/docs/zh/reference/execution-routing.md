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
3. 单次运行的 `executionRouter`；
4. 编排器级 `executionRouter`；
5. 内置 `DeterministicRouter`。

路由器只参与自动、非 `planOnly` 的拓扑选择，不会覆盖显式模式、声明的角色拓扑
或治理预算策略。`governanceIntent: 'none'` 保留自动拓扑选择，但对高影响工具确认
来说仍属于显式治理声明。

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

路由属于建议性基础设施，不应把一次运行变成失败。如果自定义路由器抛错、reject
或返回无效决策，OMA 会回退到 `DeterministicRouter`。返回决策使用内置路由器
版本，并在 `reasons` 中追加回退原因。

```ts
result.routingDecision
// {
//   mode: 'single',
//   reasons: [
//     'The goal has one concise action and no multi-stage structure.',
//     'Execution router fallback: custom decision failed (Error).'
//   ],
//   routerVersion: 'deterministic-v1'
// }
```

每次 `runTeam()` 拓扑选择都会暴露 `TeamRunResult.routingDecision`。其中的
`source` 区分调用方 `override`、治理 `declared`、框架 `policy` 与自动
`router` 决策；只有 `router` 记录携带实际 `routerVersion`。参见
[五种路由 trace 来源分类](/zh/reference/observability/#trace-spans)，其中也包括
仅用于兼容的 `legacy-deterministic` 标签。

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

这套策略的目标是诚实、低成本并尽量语言中立，而不是追求语义雄心。语义等价的英文、
中文、日文与韩文目标应选择相同执行模式。需要领域语义的应用应注入
`ExecutionRouter`，或声明显式模式 / 治理拓扑。

## 治理边界

执行路由不声明治理。无论哪个路由器选择 Single 或 Team，高影响工具 fallback
仍只把 `governanceIntent === undefined` 视为未声明。路由决策也不能满足具名角色
或独立审查要求；这些事实仍来自结构化治理声明与实际执行拓扑。

## 行为变化

内置自动路由现在会识别较短的 CJK 多阶段目标，并采用 script-aware 长度，不再只依赖
英文词模式与原始字符数。在路由稳定性 Gate 中，英文、中文、日文与韩文之间的等价
翻译不再改变 Single/Team 拓扑。既有英文与中文结果（包括结构模式回归）保持不变。
Script 权重会把一个内容详细但信息长度仍有限的英文单动作目标从 `team` 改为
`single`，这一案例已由回归测试固定。多语言应用也可能观察到 CJK 结构化目标的
自动路由被修正。
