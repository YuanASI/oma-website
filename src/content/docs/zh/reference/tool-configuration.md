---
title: "工具配置"
description: "授予内置工具（默认拒绝）、预设与允许清单、文件系统沙箱、自定义工具，以及 MCP。"
---

可以用预设、允许清单和拒绝清单，为智能体配置细粒度的工具访问控制。

## 在 `runTeam()` 中声明治理角色

工具与凭据边界往往绑定到具名 Agent。如果目标必须真实经过指定 roster 角色，请在
`runTeam()` 调用上声明拓扑：

```typescript
const result = await orchestrator.runTeam(team, 'Review this change before release.', {
  governanceIntent: 'required',
  requiredRoles: ['reviewer', 'security'],
  requiredOrder: ['reviewer', 'security'],
})

if (result.governanceConclusion !== 'satisfied') {
  throw new Error('Required governance was not satisfied by the executed topology.')
}
```

对 `required` 和 `preferred`，OMA 都会跳过 Coordinator 拆解与简单目标的单智能体
短路，为每个 `requiredRoles` 条目创建一个任务、固定分配给该 roster Agent，并用
`requiredOrder` 建立依赖边。每个任务收到未经改写的原始目标；角色行为来自该 Agent
的 `systemPrompt`、工具与凭据。下游任务通过依赖作用域记忆接收前置输出。

目标文本不会参与拓扑选择，因此同一声明对英文、中文或其他语言都会产生相同角色与
依赖顺序。所有角色名必须存在于 roster；若提供 `requiredOrder`，它必须是这些角色的
一个排列。无效声明会在任何 Agent 运行前抛错。

`planOnly: true` 与 required / preferred 治理同时出现时，`planOnly` 优先：OMA
返回已校验、全为 pending 的角色 DAG，不运行 Coordinator 或任务 Agent。
`governanceConclusion` 在计划执行前为 `not-applicable`；之后可通过
`runFromPlan()` 执行。

用 `governanceIntent: 'none'` 显式选择自动 `runTeam()` 路由；省略 `governanceIntent`
效果相同。这条路径默认是确定性的，不会发起语义 profile 调用。混合式语义路由需显式
开启：设置 `executionRouting: { strategy: 'hybrid' }`，即可让一个确定性的 Single 候选
在一次语义 profile 调用之后被升级。见[执行路由](/zh/reference/execution-routing/)。

执行后，required 声明会针对 execution receipt 检查。`governanceConclusion` 为
`satisfied`、`unsatisfied` 或 `not-applicable`；只有 `required` 被强制执行。
`unsatisfied` 表示必要角色、依赖路径 / 顺序或独立审查事实缺失。它不会改写
`result.success`，后者仍表示 runtime error 状态，因此治理敏感的调用方必须显式检查
`governanceConclusion`。Gate 只读取 `buildExecutionReceipt()` 产生的结构化拓扑；
模型回答中的角色名、审批标签或审计标记不能证明另一个角色真实执行。

### 显式模式与预算冲突

`runTeam()` 按以下顺序解析执行策略：

1. 应用指定的 `mode`（`single` 或 `team`）；
2. 声明的 `governanceIntent` 拓扑或 `preferredUnderBudget` 策略；
3. 用于自动路由的自定义[执行路由器](/zh/reference/execution-routing/)；
4. 内置 `DeterministicRouter`；
5. 语义 Profiler 与确定性策略，只作用于默认 / fallback 的 Single 候选。

`single` 始终使用既有的最佳 Agent 路径；`team` 强制走 Coordinator 生成的 Team 路径，并绕过简单目标短路。
`runAgent()` 与 `runTasks()` 本身仍是显式选择。`mode` 只声明拓扑偏好，不声明治理，
因此不会绕过高影响操作确认。路由器也只能选择拓扑，不能覆盖结构化角色要求。
TaskProfile 同样只是推断出来的路由证据。如果推断出的副作用或隔离需求，与实际的
高影响工具授权、或调用方声明的多个 `AgentConfig.permissionBoundary` 相交，OMA 会在
任何模型或工具执行之前抛出 `ROUTING_DECLARATION_REQUIRED`。

应用可以用模式覆盖 required 下限，但不会被误报为成功：

```typescript
const result = await orchestrator.runTeam(team, goal, {
  mode: 'single',
  governanceIntent: 'required',
  requiredRoles: ['reviewer', 'security'],
  requiredOrder: ['reviewer', 'security'],
})

// The Single result is still returned, and runtime success keeps its existing meaning.
result.governanceConclusion // 'unsatisfied'
result.governanceReason     // 'overridden'
result.flags                // includes 'governance-overridden'
```

也就是“下限可以被显式覆盖，但不能静默覆盖”。即使显式模式取代治理拓扑，结构声明仍会
在执行前校验。

Token 与成本上限可以设在编排器上，也可以设在一次 `runTeam()` / `runTasks()` 调用上。
单次运行的取值不能放宽编排器的上限，较低者生效。这让应用能够把治理下限与预算上限一起
声明，而无需引入另一套预算子系统：

```typescript
const result = await orchestrator.runTeam(team, goal, {
  governanceIntent: 'required',
  requiredRoles: ['reviewer', 'security'],
  requiredOrder: ['reviewer', 'security'],
  maxTokenBudget: 12_000,
  maxCostBudget: 0.25, // requires orchestrator estimateCost
})
```

如果一次 required 运行在观察到全部 required 角色 / 顺序事实之前就耗尽了该上限，既有的
预算停止仍然生效，结果报告 `governanceConclusion: 'unsatisfied'` 与
`governanceReason: 'budget'`。`result.success` 不会被挪用为治理字段；预算耗尽继续使用
既有的 `budget_exhausted` 运行时状态。

对于软偏好，应用可以预先声明「让上限胜出」，同时不把被跳过的评审当成一次治理违规：

```typescript
const result = await orchestrator.runTeam(team, goal, {
  governanceIntent: 'preferred',
  requiredRoles: ['reviewer', 'security'],
  preferredUnderBudget: 'degrade',
  maxTokenBudget: 4_000,
})

// Executes the Single path and discloses why independent review was skipped.
result.governanceConclusion // 'not-applicable'
result.flags                // includes 'review-skipped-due-to-budget'
```

`preferredUnderBudget` 默认为 `attempt`，保留既有的 preferred 角色行为。`degrade` 仅在
存在有效的 token 或成本上限、且没有显式 `mode` 已经胜出时才适用。它是一项应用策略，而
不是模型成本预测：OMA 刻意不预估一个计划在运行前是否装得下。普通的上限强制执行仍是
反应式的，发生在模型轮次与任务边界。

## 未声明运行中的高影响工具

工具作者可以声明授予某个工具会允许真实副作用：

```typescript
const rotateSecret = defineTool({
  name: 'rotate_secret',
  description: 'Rotate an application secret.',
  inputSchema: z.object({ service: z.string() }),
  consequential: true,
  execute: async ({ service }) => rotateServiceSecret(service),
})
```

`consequential` 可选，默认 `false`。内置 `bash`、`file_write` 与 `file_edit` 已标记
为 consequential；只读文件工具不是。自定义与 MCP 工具除非在
`ToolDefinition` 中显式开启，否则仍视为普通工具。

对 `runAgent()` 与省略 `governanceIntent` 的自动 `runTeam()`，OMA 会在 preset、
allowlist、denylist、自定义工具与默认 preset 全部解析后检查最终授权集。如果至少授予
一个 consequential 工具，结果就会带有这个附加的、机器可读的标记：

```typescript
if (result.flags?.includes('consequential-no-independence')) {
  // The run had consequential capability without a governance declaration.
}

const receipt = buildExecutionReceipt(result)
// The same flag is copied to receipt.flags.
```

这个分类只看**工具授权**，不扫描 goal、prompt、模型输出、工具参数或敏感关键词。

显式的 required / preferred / none `runTeam()` 不进入该 fallback；显式
`runTasks()` DAG 与 `runFromPlan()` 也不进入。Fallback 不改变拓扑，也不把运行升级
成独立治理。

### 显式开启确认

确认默认关闭。设置 `requireConsequentialConfirmation: true`，即可通过
`onToolCall` 保护上述未声明运行：

```typescript
const orchestrator = new OpenMultiAgent({
  requireConsequentialConfirmation: true,
  onToolCall: async (context) => {
    if (context.consequential !== true) return { action: 'allow' }
    return (await app.confirm(context))
      ? { action: 'allow' }
      : { action: 'deny', reason: 'User rejected the action.' }
  },
})
```

该闸门与既有的逐次调用 `onToolCall` 网关组合使用，在输入校验后、`execute` 前运行。
`allow` 继续执行；`deny` 不调用该工具，返回一个错误 `ToolResult`。在一个带检查点的
任务内部，`suspend` 可以把这次确切的调用持久化下来，交由进程外做决定，之后再
`restore()`；见[持久化审批门](/zh/reference/durable-approvals/)。若没有可用的 per-call Gate，动态规划的
`runTeam()` 也可用已批准的 `onPlanReady` 提供审批；两者都没有时，工具不会执行，
结果返回 `confirmationRequired: true` 且 `status.code === 'rejected'`。
无论确认关闭、批准、待处理或拒绝，披露标记都会保留。

## 内置工具需显式开启（默认拒绝）

内置工具——`bash` 以及文件系统工具（`file_read`、`file_write`、`file_edit`、`grep`、`glob`）——默认拒绝。只有通过 `tools`（名称的允许清单）或 `toolPreset` 显式授予时，智能体才会获得某个内置工具。两者都未设置的智能体，将解析为零个内置工具：

```typescript
// No tools / toolPreset → this agent cannot run bash or touch the filesystem.
const llmOnly: AgentConfig = { name: 'writer', model: 'claude-sonnet-4-6' }

// Opt in explicitly.
const coder: AgentConfig = {
  name: 'coder',
  model: 'claude-sonnet-4-6',
  tools: ['file_read', 'file_write', 'bash'],
}
```

这一点在 `runAgent`、`runTeam` / `runTasks`、`runTeam` 的简单目标短路路径，以及独立的 `Agent` 上都一致成立。调用 `registerBuiltInTools()` 让工具_可被授予_——它本身不授予；智能体仍然需要 `tools` / `toolPreset`。如果模型对一个已注册但未授予的工具发起调用（模型出现混淆，或文本被 prompt injection 引导），运行器会返回清晰的 `"not granted"` 错误，而不是执行它。

**一个工具被授予后，有两件事始终成立——围绕它们来设计：**

- **`bash` 没有沙箱。** 授予它就等于给了智能体在宿主上的任意 shell（见下文 [_文件系统工作目录_](#文件系统工作目录)）。只有文件系统工具是路径受限的。
- **工具输出会流向你的模型提供方。** 每个工具结果都会追加到对话中，并在下一轮发送给配置的 LLM。工具读取的任何内容——文件内容、命令输出、抓取的页面——都会离开你的进程、到达提供方。要审慎授予读取权限。

**自定义 / 运行时工具不受授予要求约束**——注册它们_即是_授予。通过 `customTools` 或 `agent.addTool()` 传入的工具始终可用（它们仍然遵守 `disallowedTools`）；见 [_自定义工具_](#自定义工具)。**`delegate_to_agent`**（团队编排交接）和其他内置工具一样遵循默认拒绝规则：在你希望能够委派的每个智能体上，用 `tools: ['delegate_to_agent']` 授予它。

### 恢复此前的「全部工具」行为

在默认拒绝之前，没有工具配置的智能体会获得每一个已注册的内置工具——包括没有沙箱的 `bash`。要用一行代码恢复这一便利，在编排器上设置 `defaultToolPreset`：

```typescript
const orchestrator = new OpenMultiAgent({
  defaultToolPreset: 'full', // agents with no tools/toolPreset get the full preset
})
```

`defaultToolPreset` 是一个**兜底**：它只对既不声明 `tools` 也不声明 `toolPreset` 的智能体生效。逐个智能体的配置始终覆盖它，而且它绝不会放宽一个已经声明了授予的智能体。它不会应用到内部协调器、最终综合环节，或共识的提议者 / 裁判智能体（`runConsensus` 以及逐任务的 `verify` 钩子）——这些都从各自的配置运行；要逐个智能体地给它们授予工具。

## 工具预设

为常见用例预定义的工具集合：

```typescript
const readonlyAgent: AgentConfig = {
  name: 'reader',
  model: 'claude-sonnet-4-6',
  toolPreset: 'readonly',  // file_read, grep, glob
}

const readwriteAgent: AgentConfig = {
  name: 'editor',
  model: 'claude-sonnet-4-6',
  toolPreset: 'readwrite',  // file_read, file_write, file_edit, grep, glob
}

const fullAgent: AgentConfig = {
  name: 'executor',
  model: 'claude-sonnet-4-6',
  toolPreset: 'full',  // file_read, file_write, file_edit, grep, glob, bash
}
```

## 高级过滤

把预设与允许清单、拒绝清单组合起来，实现精确控制：

```typescript
const customAgent: AgentConfig = {
  name: 'custom',
  model: 'claude-sonnet-4-6',
  toolPreset: 'readwrite',        // Start with: file_read, file_write, file_edit, grep, glob
  tools: ['file_read', 'grep'],   // Allowlist: intersect with preset = file_read, grep
  disallowedTools: ['grep'],      // Denylist: subtract = file_read only
}
```

**解析顺序：** 默认拒绝（无预设_且_无允许清单 ⇒ 零个内置工具）→ 预设 → 允许清单 → 拒绝清单 → 框架安全护栏。自定义 / 运行时工具跳过授予这一步（注册即授予），但仍然遵守拒绝清单。

## 能力感知的 Agent 选择

`AgentConfig` 可以携带四个可选、由调用方声明的选择信号：`description`（一句角色
摘要）、`capabilities`（标签）、`costTier` 与 `latencyClass`。省略字段保持未知；
OMA 不会从模型、Agent 名或 `systemPrompt` 猜默认值。

传给 `runTasks()` 的任务可以声明硬性要求：

```typescript
const tasks: RunTaskSpec[] = [{
  title: 'Patch the parser',
  description: 'Implement and test the parser fix.',
  requires: {
    requiredTools: ['file_read', 'file_edit'],
    requiredCapabilities: ['typescript'],
    requiredBackend: 'llm',
    requiredProvider: 'anthropic',
  },
}]
```

统一的 `AgentSelector` 先应用硬过滤，再按声明的能力匹配度排序，最后才回退到既有的
多语言关键词信号。`requiredTools` 针对执行所使用的同一份最终工具授权检查；
backend 与 provider 使用结构化配置字段；`requiredCapabilities` 只看调用方声明的
标签。权限与能力都不会从 `systemPrompt` 或其他文本推断。没有候选满足硬要求时，
selector 返回 `NO_ELIGIBLE_AGENT`，任何 fallback 都必须由调用方明确选择。

## 用 `onToolCall` 做逐次调用门控

上面这些层都作用于工具_名称_，回答的是**「哪些工具可达？」**。`onToolCall` 门控则在下一层回答一个不同的问题：**「_这一次具体调用_现在究竟是否应当运行？」** `bash` 是单个被允许的名称，它对 `ls -la` 和 `rm -rf /` 一视同仁；门控会检查实际参数，并可以否决个别调用。

这个钩子**需显式开启、默认关闭**。它在每次工具调用时运行一次——在 Zod 输入校验之后、工具实现之前——并返回一个决定：

```typescript
import type { ToolCallContext, ToolCallDecision } from '@open-multi-agent/core'

const orchestrator = new OpenMultiAgent({
  // Orchestrator-level default, inherited by any agent that sets no gate of its own.
  onToolCall: async (ctx: ToolCallContext): Promise<ToolCallDecision> => {
    // ctx: { toolName, input (post-validation), agentName, consequential?, runId?, taskId?, toolCallId? }
    if (ctx.toolName !== 'bash') return { action: 'allow' }
    if (/^\s*rm\b/.test(String(ctx.input.command))) {
      return { action: 'deny', reason: 'rm is blocked' }
    }
    return { action: 'allow' }
  },
})
```

关键语义：

- **`deny` 返回一个结构化的错误 `ToolResult`；它绝不抛异常。** 模型会把 `reason` 当作一次普通的工具错误来看，可以据此调整（换一个更安全的命令、询问用户、停止），而不是让整个运行崩溃。一个抛异常或返回非法决定的门控，也会被转成错误结果（fail closed，出错即拒绝）。
- **`suspend` 是持久的，并把控制权交还。** 在一个带检查点的内置 LLM 任务中，`{ action: 'suspend' }` 会保存这次确切的调用，并返回一个顶层的 `suspended` 结果。用 `decideApproval()` 记录一个决定，然后调用 `restore()`。若没有可恢复的检查点与原子存储，该调用会失败即关闭，工具不会运行。见[持久化审批门](/zh/reference/durable-approvals/)。
- **内联的人工介入（human-in-the-loop）仍然可用。** 用 `await` 等你自己的 CLI 提示、Slack 按钮或网页对话框，然后在同一个回调生命周期内返回 `allow` 或 `deny`。框架不规定任何审核渠道。
- **智能体覆盖编排器。** 对某个智能体来说，`AgentConfig.onToolCall` 优先于 `OrchestratorConfig.onToolCall`，因此一个团队可以设定一条默认策略，同时让某个专职智能体把它收紧或放松。独立的 `new Agent({ ..., onToolCall })` 会把门控直接接进它的执行器。
- **在基于名称的授予之后运行。** 默认拒绝 / 允许清单 / 拒绝清单的解析**先**执行；一个未被授予的工具在门控之前就已被拒绝，所以门控只会看到对那些已经可达的工具的调用。自定义工具和 MCP 工具都走同一个执行器，因此它们也会被门控。
- **模型下发的调用 ID 在恢复过程中保持稳定。** `toolCallId` 标识这一次调用。如果一个
  未提交的调用必须在检查点恢复之后再次运行，它会保持同一个 ID；而一个已提交的结果
  会被回放，不会再次运行门控或工具。见[检查点恢复](/zh/reference/checkpoint/#任务中途的工具恢复)。
- **与任务派发审批正交。** `OrchestratorConfig.onApproval` 为旧式任务轮次设闸，
  `onTaskDispatch` 在一个就绪任务派发前设闸，`onToolCall` 则管一次工具调用。
  三者位于不同层；两种任务级审批模式彼此互斥。
- **可观测性。** 当门控运行时，`tool_call` 追踪事件会带有 `gated: true`、`gateAction: 'allow' | 'deny' | 'suspend'`，以及一个可选的、已脱敏的 `gateReason`。持久的决定来自审批账本，并可能在执行回执中被摘要；遥测不是它们的真相来源。

> **不是安全边界。** 一个返回 `deny` 的门控仍然依赖于配合的代码；它是一个协调层，而不是隔离手段。`bash` 依旧没有沙箱（见下方标注）。面对一个真正不可信的 shell，请用进程级隔离（容器 / VM / seccomp）；门控负责的是*策略*，而非*隔离*。

### Shell 风险分类器

手写正则表很枯燥，所以我们提供了一个可选、零依赖的分类器，放在一个子路径导出后面。它把一条 bash 命令评为 `safe | review | high`；每个级别是什么含义由你来定：

```typescript
import { classifyBashCommand } from '@open-multi-agent/core/classifiers'

const orchestrator = new OpenMultiAgent({
  onToolCall: async (ctx) => {
    if (ctx.toolName !== 'bash') return { action: 'allow' }
    const risk = classifyBashCommand(String(ctx.input.command))
    if (risk.level === 'safe') return { action: 'allow' }
    if (risk.level === 'high') return { action: 'deny', reason: risk.reason }
    // 'review' → ask a human
    return (await myUi.confirm(ctx, risk)) ? { action: 'allow' } : { action: 'deny', reason: risk.reason }
  },
})
```

- **`safe`**：只读查看（`ls`、`cat`、`pwd`、带路径的 `grep`/`rg`、`git status|log|diff|show`，……）。
- **`review`**：占用大量上下文或含糊的：`ls -R`、不带 `-maxdepth` 的 `find /` / `find ~`、不带限定路径的 `grep -r` / `rg -r`、`tree`、`du`，以及任何无法识别的命令（默认：「不要盲目运行」）。
- **`high`**：破坏性 / 敏感的：`rm`、`sudo`、`curl ... | bash`、`dd`、`mkfs`、`chmod 777`/`-R`、`git push --force`、`npm publish`、写入系统路径。

复合命令会按 shell 分隔符（`&&`、`||`、`;`、`|`、替换）切段，取其中找到的**最高**风险，所以安全的前缀无法夹带破坏性的后缀（`ls && rm -rf /` 会变成 `high`）。带引号的片段会先被剥离，所以 `echo "rm -rf /"` 仍然是 `safe`。

这个分类器是一个**浅层启发式，而不是解析器**；它可能被混淆手法骗过（变量间接引用、base64 解码后执行、奇异的引号用法）。它仅为便利之用：可以扩展这些表、封装一层，或将其整体替换。端到端的示例见 [`examples/patterns/risk-gated-bash.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.17.0/packages/core/examples/patterns/risk-gated-bash.ts)。

## Shell 执行器

被授予的内置 `bash` 通过一个 `ShellExecutor` 来委派命令执行。未配置执行器时，OMA 使用
`LocalShellExecutor`，它在宿主上保持既有的 `bash -c` 行为：

```typescript
import { OpenMultiAgent } from '@open-multi-agent/core'
import type { AgentConfig } from '@open-multi-agent/core'
import type { ShellExecutor } from '@open-multi-agent/core/shell'

declare const sharedRemoteExecutor: ShellExecutor
declare const specialistExecutor: ShellExecutor

const orchestrator = new OpenMultiAgent({
  // Inherited by agents that do not set shellExecutor.
  defaultShellExecutor: sharedRemoteExecutor,
})

const agent: AgentConfig = {
  name: 'builder',
  model: 'claude-sonnet-4-6',
  tools: ['bash'],
  // Per-agent value wins over the orchestrator default.
  shellExecutor: specialistExecutor,
}
```

执行器改变的是**一条已被授予的命令在哪里运行**。它既不授予 `bash`，也不绕过
`disallowedTools`；命令仍然只在 `onToolCall` 放行之后才执行。既有的默认拒绝与逐次调用
门控规则保持不变。工具包装层还让面向模型的行为在各执行器之间保持一致：输入校验、
30 秒的默认超时、stdout/stderr 的格式化、输出脱敏，以及退出码非零时的 `isError`。

公开的类型约定可从 `@open-multi-agent/core/shell` 获得，且不带任何运行时导入：

```typescript
interface ShellExecutor {
  start?(): Promise<void>
  exec(command: string, options: ShellExecOptions): Promise<ShellExecResult>
  dispose?(): Promise<void>
}
```

`ShellExecOptions` 包含 `cwd`、`timeoutMs` 与 `abortSignal`。`ShellExecResult` 包含
`stdout`、`stderr` 与 `exitCode`。执行器必须用退出码 `124` 表示超时、`130` 表示中止、
`127` 表示进程或远程命令无法启动。工具包装层还加了一道短暂的截止时间兜底，使得一个
忽略超时或中止的执行器无法无限期地卡住工具循环；但实现方仍然自行负责及时取消，并终止
它所控制的进程、作业或远程会话。

### 生命周期与并发使用

一个执行器实例代表一个可复用的会话：

- OMA 会惰性调用 `start()`，就在一次运行中第一次被放行的 `bash` 执行之前。一个被授予
  但从未被调用（或被 `onToolCall` 拒绝）的工具不会创建会话。该次运行中后续的 shell
  调用会复用它。
- 无论运行成功、失败、被中止，还是某个流式消费方提前停止，OMA 总会尝试调用
  `dispose()`。如果 `start()` 部分分配了资源随后又拒绝，OMA 同样会尝试 `dispose()`。
- 如果多次重叠的运行共用同一个执行器实例（继承同一个 `defaultShellExecutor` 的智能体
  就是如此），OMA 会对它们做引用计数：一次 `start()`，并在最后一次运行结束之后一次
  `dispose()`。`exec()` 可以被并发调用，包括一个模型轮次请求多次 shell 调用的情形。
  无法并发执行命令的执行器必须在内部串行化；当每个智能体都需要自己的会话时，请为它们
  使用彼此独立的实例。
- 进程崩溃无法执行 JavaScript 清理逻辑。远程适配器还应配置服务端的 TTL、租约过期或
  带外的回收进程，以便崩溃后恢复。

这些生命周期调用属于 Agent/编排器的运行。如果应用代码直接调用底层导出的
`bashTool.execute()`，那么该调用方要自行在其工具调用前后负责 `start()` / `dispose()`。

`LocalShellExecutor` 是无状态的。它保持既有的安全环境变量允许清单，捕获 stdout/stderr，
在 POSIX 上于独立的进程组中运行命令，并在超时或中止时杀掉整棵进程树。它以宿主 Node.js
进程的权限执行：**它不是沙箱，也不是安全边界**。一个自定义执行器的隔离程度，取决于它
背后的环境与适配器实现；OMA 的 core 不附带 Docker、VM 或托管沙箱适配器。

### 宿主与远程文件系统会分叉

> **一个远程 shell 执行器并不会把内置的文件系统工具一并搬走。**
> `file_read`、`file_write`、`file_edit`、`grep` 与 `glob` 仍然在宿主上、于
> `AgentConfig.cwd` / `defaultCwd` 之内操作。传给 `bash` 的 `cwd` 则是在执行器的
> 环境中解释的。例如，`file_write` 可能在宿主的 `.agent-workspace` 里创建
> `report.md`，而随后一次远程 `bash` 调用 `wc -l report.md` 却看不到这个文件。
> 除非应用自己提供一层同步机制，否则不要把宿主的文件系统工具与远程 shell 一并授予
> 同一个智能体，或者明确地围绕这两套文件系统来设计。

Shell 执行器只在正常的 LLM 运行器工具循环内部生效。进程与 ACP 智能体后端替换掉了那个
循环，并继续自行管理它们的命令执行与 `cwd`；`shellExecutor` 不影响它们。

## 文件系统工作目录

内置文件系统工具（`file_read`、`file_write`、`file_edit`、`grep`、`glob`）被沙箱限制在每个智能体各自的工作目录中。路径必须是绝对路径，并且解析后落在该目录之内；符号链接会在检查之前被解析，因此无法逃出配置的根目录。

> **`bash` 没有沙箱。** 一旦智能体获得 shell，任何 `cd /etc`、绝对路径或子 shell 都能轻易绕过逐工具的路径检查。因此沙箱最好理解为**对内置文件系统工具的路径限制**，而不是抵御任意命令执行的安全边界。如果完整的路径限制很重要，就用 `disallowedTools: ['bash']` 移除 `bash`（或将其从你的 `tools` 允许清单中省略），转而依赖文件系统工具。进程级隔离（容器、seatbelt、firejail）才是面对一个真正不可信 shell 的正确工具。

### 三种典型配置

```typescript
import { OpenMultiAgent } from '@open-multi-agent/core'

// 1. Default — sandbox rooted at `<cwd>/.agent-workspace`.
//    The directory is auto-created on first write. Agents cannot read or
//    write outside that subdirectory, which keeps source files, `.env`,
//    `.git/`, and `node_modules` off-limits even when the host launched
//    from the repo root.
const defaultOrchestrator = new OpenMultiAgent()

// 2. Widen the sandbox to the entire current working directory.
//    Useful when the agent is a coding assistant operating on the user's
//    project (the host already established trust by launching there).
const wideOrchestrator = new OpenMultiAgent({
  defaultCwd: process.cwd(),
})

// 3. Disable the sandbox entirely (relative and absolute paths anywhere).
const unrestrictedOrchestrator = new OpenMultiAgent({
  defaultCwd: null,
})
```

### 自定义沙箱根目录

```typescript
const orchestrator = new OpenMultiAgent({
  defaultCwd: '/var/run/my-agent-workspace', // any absolute path
})

const agent: AgentConfig = {
  name: 'editor',
  model: 'claude-sonnet-4-6',
  toolPreset: 'readwrite',
  cwd: '/var/run/my-agent-workspace/packages/app', // optional per-agent override
}
```

**解析顺序。** `AgentConfig.cwd`（若设置）→ `OrchestratorConfig.defaultCwd`（若设置）→ `<process.cwd()>/.agent-workspace`。在任一层级传入 `null`，可对该作用域禁用沙箱。

**自动创建。** 沙箱根目录会在首次写入时被 `mkdir -p`，因此调用方无需预先创建 `.agent-workspace`（或任何自定义路径）。

`bash` 工具在 POSIX 上运行于自己的进程组中，于是超时和中止信号会杀掉所有在后台运行的子进程，而不是任由它们比父进程活得更久。

## 自定义工具

有两种方式可以为智能体提供内置集合之外的工具。

**在配置时注入**，通过 `AgentConfig` 上的 `customTools`。当编排器集中配置工具时适用。这里定义的工具跳过预设 / 允许清单过滤，但仍然遵守 `disallowedTools`。

```typescript
import { defineTool } from '@open-multi-agent/core'
import { z } from 'zod'

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Look up current weather for a city.',
  inputSchema: z.object({ city: z.string() }),
  execute: async ({ city }) => ({ data: await fetchWeather(city) }),
})

const agent: AgentConfig = {
  name: 'assistant',
  model: 'claude-sonnet-4-6',
  customTools: [weatherTool],
}
```

**在运行时注册**，通过 `agent.addTool(tool)`。这样添加的工具始终可用，与过滤无关。

## 逐智能体的工具凭据

一个工具的 `execute` 闭包常常会捕获某个密钥——一个 API token、一个服务密钥。如果多个智能体共用这个工具，它们就都以完整作用域持有同一个密钥：一个被攻陷或行为失常的子智能体，会继承协调器持有的每一份凭据。要把密钥按智能体划定作用域，就在 `AgentConfig` 上设置一个 `credentials` 包，并在工具内部从 `ToolUseContext` 读取它，而不是闭包捕获一个模块级的密钥。

```typescript
const search = defineTool({
  name: 'web_search',
  description: 'Search the web.',
  inputSchema: z.object({ query: z.string() }),
  // Reads the calling agent's scoped key, not a shared module secret.
  execute: async ({ query }, ctx) => ({
    data: await callSearchApi(query, ctx.credentials?.SEARCH_API_KEY),
  }),
})

const team = {
  name: 'research',
  agents: [
    {
      name: 'researcher',
      model: 'claude-sonnet-4-6',
      customTools: [search],
      credentials: { SEARCH_API_KEY: process.env.RESEARCHER_SEARCH_KEY! },
    },
    {
      name: 'publisher',
      model: 'claude-sonnet-4-6',
      customTools: [cms], // a CMS tool defined like `search` above
      credentials: { CMS_TOKEN: process.env.PUBLISHER_CMS_TOKEN! },
    },
  ],
}
```

这个包是**逐智能体的、从不合并**：`researcher` 只能看到 `SEARCH_API_KEY`，`publisher` 只能看到 `CMS_TOKEN`，协调器和被委派的子智能体都不会继承另一个智能体的包。没有设置 `credentials` 的智能体获得的是 `ctx.credentials === undefined`。

这是一种**划定作用域的便利，而不是隔离边界**。工具代码在进程内运行，仍然能读取 `process.env` 或任何模块级变量；`credentials` 只是给了你一个一等的位置，把每个智能体只需要的那些密钥交给它。（你本来就可以给每个智能体各自一份带限定作用域闭包的 `customTools` 实例来近似做到这一点——`credentials` 包只是把它显式化，并将密钥移出闭包。）这些值会被当作密钥对待：`credentials` 键会从追踪和仪表盘中自动脱敏。

## 工具输出控制

过长的工具输出会使对话体量膨胀、抬高成本。两个控制手段配合使用。

**校验（可选）。** 添加 `outputSchema`，在格式错误的工具结果被转发之前将其拦截：

> **注意——两个不同的 `outputSchema` 字段。** `defineTool()` /
> `ToolDefinition` 上的那个（下面展示）校验单个**工具**的 `ToolResult.data`
> ——它始终是 `ZodSchema<string>`，因为工具输出会序列化为
> 文本。[`AgentConfig`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.17.0/packages/core/examples/patterns/structured-output.ts)
> 上的 `outputSchema` 则不同：它把**智能体的最终答案**当作解析后的 JSON、
> 对照一个任意的 Zod schema 来校验（见 `examples/` 中的 _Structured output_）。
> 类型不同、作用域不同——当你将它们混淆时 TypeScript 不会警告你，
> 因此请选择与你所在层级匹配的那一个。

```typescript
const jsonTool = defineTool({
  name: 'json_tool',
  description: 'Return JSON payload as string.',
  inputSchema: z.object({}),
  outputSchema: z.string().refine((value) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }, 'Output must be valid JSON'),
  execute: async () => ({ data: '{"ok": true}' }),
})
```

### 富图像与文件结果

`ToolResult` 把应用自己保留的值，与回送给模型的内容分开：

```typescript
const renderChart = defineTool({
  name: 'render_chart',
  description: 'Render a chart and return a preview.',
  inputSchema: z.object({ metric: z.string() }),
  outputSchema: z.object({ chartId: z.string(), storageKey: z.string() }),
  execute: async ({ metric }) => ({
    // Application-owned value: available to onToolResult; not serialized into
    // the model conversation.
    data: { chartId: 'chart-42', storageKey: `artifacts/${metric}.png` },

    // Model-visible value: validated and copied before it enters the transcript.
    modelOutput: [
      { type: 'text', text: `Preview for ${metric}` },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: pngBytes.toString('base64'),
        },
      },
      {
        type: 'file',
        filename: 'report.pdf',
        source: {
          type: 'url',
          media_type: 'application/pdf',
          url: signedReportUrl,
        },
      },
    ],
  }),
})
```

既有的 `{ data: 'plain text' }` 工具不受影响：省略 `modelOutput` 时，`data` 中的字符串
沿用既有的 `maxOutputChars` 行为并发送给模型。非字符串的 `data` 取值必须配合
`modelOutput`；OMA 绝不猜测某种 JSON 序列化方式。无效内容会变成一个普通的文本错误
`ToolResult`（`isError: true`），使工具循环保持既有的错误行为。错误结果仍然只含文本。

`modelOutput` 要么是一个字符串，要么是由 `text`、`image` 与 `file` 部件组成的非空数组。
媒体来源要么是原始的 base64 字节（不是 `data:` URL），要么是一个绝对的 HTTP(S) 引用，
并且必须带有不含参数的 MIME 类型。file 部件还需要一个用于展示的文件名。OMA 会在工具
边界处、以及在回调能够影响模型对话记录之前，各做一次防御性的嵌套内容复制；`data` 仍
归应用所有，不会被克隆。

提供方转换要么忠实，要么显式——媒体绝不会被静默丢弃：

| 适配器家族 | 映射 | 确定性的本地拒绝 |
|---|---|---|
| OpenAI Chat Completions、Azure OpenAI、Copilot 与内置的 OpenAI 兼容适配器 | 文本留在 `tool` 消息中；附件随后放进一条 `user` 消息。图像接受内联数据或 URL；文件接受内联数据。 | 文件的 URL 引用。 |
| Anthropic | 图像留在 `tool_result` 中；PDF 文件作为相邻的 document 块。上述被映射的类型既接受内联数据，也接受 URL。 | 不受支持的图像 MIME 类型，以及非 PDF 的文件。 |
| Gemini | 媒体以 `inlineData` 或 `fileData` 映射到 `functionResponse.parts`。 | 在共享校验之后没有额外的协议层拒绝。 |
| Bedrock Converse | 内联图像与受支持的文档格式映射为原生的工具结果块。 | URL 媒体、未知的图像 MIME 类型，以及未被映射的文档 MIME 类型。 |
| `AISdkAdapter` | 媒体映射为 AI SDK 的 `file-data` 或 `file-url` 内容。 | 在共享校验之后没有额外的协议层拒绝。 |

这些是线缆格式的映射，并不承诺某个适配器背后的每个模型都接受每一种被映射的部件。
所选的模型或 OpenAI 兼容端点仍可能拒绝本来合法的内容；那种提供方错误会向上传播，而
不是回退成一个文本占位符。已知无法映射的部件，会在 SDK 请求之前抛出终态的
`UnsupportedToolResultContentError`。当你希望的正是「回退为纯文本」时，请自行使用只含
文本的 `modelOutput`。

在内联数据与引用之间要做审慎选择：

- 内联 base64 是自包含的，但它会让请求体膨胀，并被存进 `AgentRunResult.messages` 与
  任务检查点。OMA 不施加框架层面的字节上限；提供方的请求与媒体限制依然适用。
- HTTP(S) 引用能让对话记录更小，但提供方必须能够抓取它们。请把签名 URL、查询串中的
  令牌、文件名以及被引用的内容，都视为向模型提供方披露的数据。
- `maxOutputChars` 对隐式的字符串结果保留其原有含义。它不会重写显式的富 `modelOutput`；
  请在工具内部、返回之前就为富负载设限或调整其尺寸。
- 上下文摘要路径会用文本占位符替换旧媒体；`compressToolResults` 与 `compact` 可以把已
  消费的富结果替换成一个标记。最新的那个结果保持完整。
- 流式的 `tool_result` 事件、结果消息、`onToolResult` 与进度结果负载，都可能把完整的富
  内容暴露给应用的处理函数。旧式的工具调用 trace 与 `ToolCallRecord.output` 使用一份
  经过脱敏的文本 / 媒体摘要，其中略去内联字节与引用 URL。在线打分器收到的是正常的运行
  结果，而被存储的评估负载仍遵循所配置的评估负载策略。

任务检查点会把已完成的 `AgentRunResult.messages` 中模型可见的富内容做 JSON 序列化，
因此恢复出的任务结果会保留它。检查点存储不在 trace 脱敏的覆盖范围内；当这个取舍合适
时，请用 `RedactingStore` 封装该存储。任务中途的恢复仍是任务粒度的：一次被打断的、
运行中的工具调用仍会按 [`checkpoint.md`](/zh/reference/checkpoint/#局限) 所述重新运行。

当前的边界：原生的富内容约定不包含音频、本地文件系统路径、自动上传、尺寸调整、恶意
软件扫描、URL 抓取或 MIME 嗅探。进程与 ACP 后端自行掌管其执行，不使用运行器的工具
循环。适配器测试在不联系提供方 API 的前提下校验本地的线缆转换；在生产中依赖媒体支持
之前，请先验证你打算实际运行的那个提供方 / 模型组合。

可运行的示例见 [`rich-tool-results`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.17.0/packages/core/examples/patterns/rich-tool-results.ts)。

**截断。** 把单个工具结果裁成头部 + 尾部的摘录，中间放一个标记：

```typescript
const agent: AgentConfig = {
  // ...
  maxToolOutputChars: 10_000, // applies to every tool this agent runs
}

// Per-tool override (takes priority over AgentConfig.maxToolOutputChars):
const bigQueryTool = defineTool({
  // ...
  maxOutputChars: 50_000,
})
```

**消费后压缩。** 一旦智能体已对某个工具结果采取行动，就压缩记录中较旧的副本，让它们不再在之后的每一轮上消耗输入 token。错误结果永远不会被压缩。

```typescript
const agent: AgentConfig = {
  // ...
  compressToolResults: true,                 // default threshold: 500 chars
  // or: compressToolResults: { minChars: 2_000 }
}
```

## MCP 工具（模型上下文协议）

`open-multi-agent` 可以连接 stdio 的 MCP 服务器，并把它们的工具直接暴露给智能体。

```typescript
import { connectMCPTools } from '@open-multi-agent/core/mcp'

const { tools, disconnect } = await connectMCPTools({
  command: 'npx',
  args: ['--no-install', '@modelcontextprotocol/server-github'],
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    HOME: process.env.HOME,
    PATH: process.env.PATH,
  },
  namePrefix: 'github',
})

// Register each MCP tool in your ToolRegistry, then include their names in AgentConfig.tools
// Don't forget cleanup when done
await disconnect()
```

说明：
- `@modelcontextprotocol/sdk` 是一个可选的 peer 依赖，仅在使用 MCP 时才需要。
- 当前的传输支持是 stdio。
- MCP 的输入校验委托给 MCP 服务器（`inputSchema` 是 `z.any()`）。
- MCP 的文本输出保持既有的字符串行为。成功的 MCP `image` 块、内嵌的 blob 资源块，以及
  HTTP(S) 的 `resource_link` 块，也会获得一份富 `modelOutput`；错误、音频、格式错误的
  媒体与非 HTTP 的资源链接，则保留一份显式的文本表示。
- 优先使用本地安装或固定版本的 MCP 服务器二进制文件，并只传入该服务器需要的环境变量。避免把 `process.env` 展开进 MCP 子进程。
- `egressPolicy` 不约束 MCP 子进程内部、`bash` 或自定义工具所建立的连接。见[出网强制执行对照表](/zh/reference/egress-policy/#强制执行对照表)。

完整可运行的配置见 [`integrations/mcp-github`](https://github.com/open-multi-agent/open-multi-agent/blob/v1.17.0/packages/core/examples/integrations/mcp-github.ts)。
