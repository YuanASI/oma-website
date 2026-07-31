---
title: "客服工单的两条车道：固定流水线与运行时组建的团队"
description: "高频路径交给带类型的分类 → 起草 → QA 任务图，升级事件交给协调器现场组队，退款这类动作则由运行时逐次拦在确认闸门后面。"
pubDate: 2026-07-31
tags: ["customer-support", "typescript", "agents"]
contentType: application
useCases: ["工单分流", "升级事件处理"]
industries: ["客户支持"]
evidence:
  kind: runnable-demo
  note: "组合了仓库里的两个可运行示例，工单为合成数据。演示覆盖分类、起草与路由；写入 CRM、自主修改账户与生产效果都在范围之外。文中的运行时控制能力来自已发布的 API，不由这两个示例演示。"
related:
  solutions: ["goal-driven-orchestration", "parallel-llm-calls"]
  examples: ["express-customer-support", "adaptive-customer-support"]
  integrations: ["openai", "openai-compatible"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 5
---

重置密码和争议账单，从同一个客服表单进来。它们不该走同一条工作流。

重置密码很熟悉：分类、起草、检查语气、发出。争议账单可能要牵扯计费政策、账户记录、退款规则——以及在任何内容发给客户之前，得有人过一眼。

Open Multi-Agent 为这两种形态各提供了一个可运行示例。它们都用演示工单，都没有连接真实客服系统。有价值的是这条边界划在哪里，以及真接上生产系统之后，靠什么把它守住。

## 高频路径：拓扑属于应用

[Express 客服示例](/zh/examples/express-customer-support/) 在 `POST /tickets` 后面放了三步：分类 Agent 返回类别与紧急程度，起草 Agent 写面向客户的回复，QA Agent 检查语气与事实一致性。

这里没有任何东西需要为每张工单重新推导。分类必然在起草之前，QA 必然在最后，拓扑本来就属于应用。`runTasks()` 直接执行你写好的图：

```ts
await orchestrator.runTasks(team, [
  {
    title: 'Classify',
    description: '判定工单类别与紧急程度。',
    assignee: 'classifier',
  },
  {
    title: 'Draft',
    description: '起草面向客户的回复。',
    assignee: 'drafter',
    dependsOn: ['Classify'],
  },
  {
    title: 'QA',
    description: '检查语气、同理心与事实一致性。',
    assignee: 'reviewer',
    dependsOn: ['Draft'],
    dependencyPayload: 'structured',
  },
])
```

`dependencyPayload: 'structured'` 让 QA 拿到起草 Agent 校验过的 JSON，而不是它的叙述文本——审阅方读到的是带类型的工作产物，不必再去解析一段散文。

## 升级路径：让工单决定需要谁

有些工单没有稳定拓扑。物流升级可能需要物流专家加政策审核，账单争议又是另一组人。把所有分支永久编进一张图，维护成本会一路涨，边缘情况照样脆。

[自适应客服示例](/zh/examples/adaptive-customer-support/) 把一个目标和一组专家交给 `runTeam()`。协调器在运行时把目标拆成任务 DAG，分派工作，让互不依赖的任务并行，最后综合出回复。

这次实际走了哪种形态，不需要你去猜：

```ts
const result = await orchestrator.runTeam(team, goal, { mode: 'team' })

result.routingDecision
// { mode: 'team', reasons: [...], routerVersion: '...' }
```

不传 `mode`，内置的 `DeterministicRouter` 来判定；传一个 `ExecutionRouter`，则由你自己的策略判定——按队列、客户等级，或者任何应用本来就知道的信息来路由工单。无论哪种，`routingDecision` 都会记下选中的拓扑和理由，并关联到链路证据。

这就是 Execution Routing，它只回答一个问题：单 Agent 还是团队。它与 Model Routing 是刻意分开的——后者决定的是在选定拓扑内部，每次调用用哪个模型。

## 退款动作，才是这套设计真正兑现的地方

起草一段回复和执行一笔退款是两种性质的动作，运行时对它们的处理也不同。

内置工具默认拒绝授权：一个既没声明 `tools` 也没声明 `toolPreset` 的 Agent，拿到的内置工具数量是零——起草 Agent 碰不到文件系统、跑不了 shell，不是因为有人记得去锁，而是默认如此。退款是你自己写的工具，授权它意味着什么，由你显式声明：

```ts
const issueRefund = defineTool({
  name: 'issue_refund',
  description: '对一张发票执行退款。',
  inputSchema: z.object({ invoiceId: z.string(), amount: z.number() }),
  consequential: true,
  execute: async (input) => billing.refund(input),
})
```

`consequential: true` 让这次授权对运行时可见。开启确认要求后，每一次这类调用都要先过闸门才能执行：

```ts
const orchestrator = new OpenMultiAgent({
  requireConsequentialConfirmation: true,
  onToolCall: async (context) => {
    if (context.consequential !== true) return { action: 'allow' }
    return (await supervisorApproves(context))
      ? { action: 'allow' }
      : { action: 'deny', reason: '退款未获批准。' }
  },
})
```

闸门每次调用触发一次，位置在输入校验之后、`execute` 之前，所以它看得到真实参数。这一点很关键：`bash` 是一个被允许的名字，`ls` 和 `rm -rf /` 都在它下面；5 元的退款和 5000 元的退款也是同一种不对称。

有两条边界必须说清楚。

这套判定**只看工具授权**。OMA 不会去扫描目标、提示词、工具参数或模型输出里有没有「退款」「密码」「生产」这类字眼。一张措辞吓人但只授权了无害工具的工单不会被标记；反过来，授权了高影响工具的运行会被标记，哪怕目标读起来平平无奇。

以及，这个闸门是策略决策，不是进程沙箱。它决定一次调用能不能继续，不决定工具真跑起来之后能碰到什么。

如果要求确认却没有配置任何审批路径，工具不会执行：结果会带上 `confirmationRequired: true` 和 `status.code === 'rejected'`，应用可以带着决策重新发起。

## 「加人工审批」其实是三个不同的决定

一次动态规划的运行有三个可介入的位置，它们回答的是不同的问题：

- `onPlanReady`——协调器已产出计划。在任何任务开跑之前，审批这次工作的整体形态。
- `onTaskDispatch`——某个任务已就绪。审批这一个工作单元。
- `onToolCall`——某次工具调用即将执行。审批这一个动作。

放到客服场景：计划闸门是主管看清升级车道打算做什么的地方，工具闸门是退款本身被拦下的地方。

如果工作流必须按顺序经过指定角色，那就把它声明出来，而不是寄望于写在 Agent 提示词里：

```ts
const result = await orchestrator.runTeam(team, goal, {
  governanceIntent: 'required',
  requiredRoles: ['reviewer', 'security'],
  requiredOrder: ['reviewer', 'security'],
})

if (result.governanceConclusion !== 'satisfied') {
  throw new Error(`治理未通过：${result.governanceReason}`)
}
```

OMA 检查的是实际执行的拓扑，不是 Agent 话术里的标签。应用可以覆盖已声明的下限，但那绝不会被报告成一次干净的成功：结论会是 `unsatisfied`，原因是 `overridden`。

## 怎么选车道

类别稳定、交接已知、每条回复都要过同一道 QA、可预测的延迟与成本比适应性更重要——用固定任务图。路由由应用决定，Agent 在其中填入带类型的工作产物。

工单可能需要不同专家、依赖顺序无法从类别推出、结果需要跨多路调查综合——用协调器。路由由协调器提议，允许的 Agent、工具、预算和审批策略依然归你的应用。

协调器要多付一次规划调用，任务图也可能在不同运行之间变化。这种变化在升级车道上正是你要的，在高频车道上则是负债。

## 扩大权限之前

两个示例跑的都是演示工单。换成真实工单，就该让评估上场了。评估在独立的 `@open-multi-agent/core/eval` 子路径下——它观察已完成的结果，从不改变业务结果，这正是它被分开的原因。

用一组版本化的代表性工单打分，用报告卡住 CI，看的是趋势而不是单次运行。抛异常的 scorer 会被记为 `scorer_error` 并排除在均值之外——一次失败的测量不等于零分。

运行记录留在你自己的基础设施上。稳定的运行标识、路由决策、execution receipt、TraceStore 与离线 Run Viewer 都不需要托管服务；链路数据会以尽力而为的方式脱敏检测到的敏感信息——之所以要标明「尽力而为」，恰恰是因为工单里可能有客户数据，而尽力而为不等于保证。

## 先把两条都跑一遍

按各示例页面上列出的凭证配好 provider，然后从框架仓库根目录把两种形态连着跑一次：

```bash
# 固定的 分类 → 起草 → QA 接口
(
  cd packages/core/examples/integrations/express-customer-support
  npm install
  npm start
)

# 动态选择专家
npx tsx packages/core/examples/cookbook/adaptive-customer-support.ts
```

先跑固定路径。只有当某类工单的变化程度确实值得多付规划和管控成本时，再加上自适应车道。
