---
title: "五条接缝：一条工作流什么时候需要一支团队"
description: "在 OMA 的可运行 recipe 里反复出现的五条边界——而每一条背后都对应一个具体的运行时机制，从结构化依赖载荷到事后可回读的执行路由决策。"
pubDate: 2026-07-31
tags: ["field-notes", "workflow-design", "agents"]
contentType: field-note
useCases: ["多智能体适用性", "工作流拆解"]
industries: ["应用设计"]
evidence:
  kind: field-observation
  note: "综合 OMA 当前的可运行场景 recipes。文中的模式描述的是这些原型；真实客户部署是另一个问题。每条模式对应的运行时机制均来自已发布的 API。"
related:
  solutions: ["parallel-llm-calls", "goal-driven-orchestration"]
  examples: ["meeting-summarizer", "competitive-monitoring", "contract-review-dag", "adaptive-customer-support"]
  integrations: ["opentelemetry"]
  comparisons: ["langgraph"]
featured: true
readingMinutes: 4
---

多数多智能体设计是从一张角色表开始的。研究员、撰写者、审阅者、规划者。

这些 recipe 指向另一个起点：先找出工作里的接缝。哪些部分可以独立跑、哪些证据必须彼此隔离、哪次交接需要带类型的契约、哪个决定不能下放。Agent 的数量是从这里推出来的结果，而不是设计的输入。

在 Open Multi-Agent 的可运行场景 recipe 里，有五条接缝反复出现，而每一条背后都有一个具体的机制。它们是带 fixture、有明确限制的原型，不是客户调研——值得一读的原因是这些形态确实在复现。

## 接缝 1：一份输入，需要几种独立的读法

[会议纪要示例](/zh/examples/meeting-summarizer/)把同一份转录稿交给三个专家：摘要、待办项、情绪。

拆开有用，是因为这三种产出的契约不同。摘要是叙述文本，待办项需要负责人，情绪需要一个受限标签外加证据。一份来源、多种解读、一步聚合——这是最干净的 fan-out 场景，同样的形态也出现在多视角代码审查和文档分析里。

对应的机制是调度器。彼此没有依赖声明的任务会同时启动，而下游任务在**自己的**依赖被满足时就开跑，不必等一整批做完。

反向检验：如果每条分支返回的都是同一种泛泛的摘要，那多个 Agent 只是在成倍烧钱。

## 接缝 2：来源必须能够互相矛盾

[竞品监控 recipe](/zh/examples/competitive-monitoring/) 隔离社交、社区与新闻 fixture。[论文复现分诊示例](/zh/examples/paper-replication-triage/)隔离论文论断、代码产物、数据集证据与后续讨论。

多个 Agent 并不比一个 Agent 知道得更多。它们保住的是归属。在第一个提示词里就把来源混在一起，会让答案更顺滑，也让证据审计更难做——重复开始被读成互相印证，而「两个来源对不上」是最容易被丢掉的那个细节。

这条接缝由两个机制承载。`dependencyPayload: 'structured'` 只注入从依赖成功的 `AgentRunResult.structured` 派生出的规范 JSON，于是比对环节读到的是校验过的记录，而不是再解析一遍散文。以及 `taskResults`，以稳定任务 ID 为键，让每个任务未经合并的结果在事后依然可取——这是「模型说了 X」和「新闻分析方在任务 3 里报告了 X」之间的区别。

当来源归属和分歧本身就是交付物的一部分时，用按来源拆分的 Agent。它们不能替代来源本身的质量。

## 接缝 3：依赖固定的工作，就该用固定的图

[合同审查 DAG](/zh/examples/contract-review-dag/) 在运行之前就知道自己的拓扑：先抽取条款，然后合规审查与摘要并行，两条分支都完成后再产出最终通知。[事故复盘 DAG](/zh/examples/incident-postmortem-dag/) 也是同样的性质。

为一张本来就稳定的图去付一次协调器的规划调用，买不到任何东西。`runTasks()` 让这张图在代码里始终可审阅，缺失的分支会阻塞综合而不是悄悄消失。

这也是两种路由分道扬镳的地方。Execution Routing 决定的是这个目标究竟以单 Agent 还是团队运行；Model Routing 决定的是在选定拓扑内部、每次调用用哪个模型。一张稳定的图通常应该把第一个决定钉死，而把第二个用足——fan-out 上用便宜模型，综合环节上用贵的。

## 接缝 4：会变的工作，才配得上运行时规划

[自适应客服 recipe](/zh/examples/adaptive-customer-support/) 是那个例外。物流升级和账单争议可能需要不同的专家、不同的顺序，把所有分支永久编进一张图，维护成本更高，边缘情况照样脆。

协调器提议 DAG，应用负责检查与约束。这次额外的规划调用应该回答一个真实存在的变化问题——「我们不想手写这张图」不算。

让这件事可检查而非黑箱的机制是 `result.routingDecision`：它记录实际运行的拓扑及其理由，并关联到链路证据。你可以用显式 `mode` 把它钉死，交给自己的 `ExecutionRouter`，或者留给内置的 `DeterministicRouter`——无论哪种，这个选择在事后都是读得到的，而不是靠推断。

## 接缝 5：硬规则应该待在生成循环之外

有几个 recipe 以仲裁或一次最终安全判定收尾。叙事谜题示例让多个专家各自提议一条提示，再交给一个独立审阅方，对涉及被保护信息的内容行使二元否决。

在提示词里写「请注意安全」是一种偏好。一次独立的放行或拒绝判定，则是可检查、可测试的。

运行时在两个位置划这条线。会产生真实副作用的工具标记 `consequential: true`，配合 `requireConsequentialConfirmation`，每一次这类调用都要在输入校验之后、`execute` 之前通过 `onToolCall`——所以闸门看到的是真实参数，而不只是一个工具名。再往上，`governanceIntent` 配合 `requiredRoles` 与 `requiredOrder` 声明一条角色路径，运行时据此检查实际执行的拓扑，而不是检查 Agent 话术里的标签。

有一点必须说准，因为这正是容易被夸大的地方：高影响判定**只看工具授权**。它不会去扫描目标、提示词、工具参数或模型输出里有没有骇人的字眼。而且这个闸门是策略决策，不是进程沙箱——它决定一次调用能不能继续，不决定工具真跑起来之后能碰到什么。

## 那个更小的判断测试

在加第二个 Agent 之前，问五个问题：

1. 是否真的存在不同的工作产物？
2. 其中一些能否独立运行？
3. 证据是否必须保持可归属？
4. 拓扑是固定的，还是随请求变化？
5. 是否存在一个模型不该独自做出的决定？

答案大多是否——那就用一个 Agent，或者干脆用普通代码。

如果答案里浮现出并行工作、互相冲突的证据、带类型的交接，或一条硬性的权限边界，那么 Agent 的数量才是在回答一个真实的问题。这就是这批 recipe 反复给出的观察：价值从来不始于有几个 Agent，而始于这条工作流真的有接缝，且每条接缝需要的是一个具体机制，而不是一个更大的提示词。
