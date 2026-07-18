---
title: "工具配置"
description: "授予内置工具（默认拒绝）、预设与允许清单、文件系统沙箱、自定义工具，以及 MCP。"
---

可以用预设、允许清单和拒绝清单，为智能体配置细粒度的工具访问控制。

## 内置工具需显式开启（默认拒绝）

内置工具——`bash` 以及文件系统工具（`file_read`、`file_write`、`file_edit`、`grep`、`glob`）——默认拒绝。只有通过 `tools`（名称的允许清单）或 `toolPreset` 显式授予时，智能体才会获得某个内置工具。两者都没设置的智能体，解析出来是零个内置工具：

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

这一点在 `runAgent`、`runTeam` / `runTasks`、`runTeam` 的简单目标短路路径，以及独立的 `Agent` 上都一致成立。调用 `registerBuiltInTools()` 让工具_可被授予_——它本身不授予；智能体仍然需要 `tools` / `toolPreset`。如果模型对一个已注册但未授予的工具发起调用（模型犯糊涂，或文本被 prompt injection 引导），运行器会返回清晰的 `"not granted"` 错误，而不是执行它。

**一个工具被授予后，有两件事始终成立——围绕它们来设计：**

- **`bash` 没有沙箱。** 授予它就等于给了智能体在宿主上的任意 shell（见下文 [_文件系统工作目录_](#文件系统工作目录)）。只有文件系统工具是路径受限的。
- **工具输出会流向你的模型提供方。** 每个工具结果都会追加到对话里，并在下一轮发给配置的 LLM。工具读到的任何东西——文件内容、命令输出、抓取的页面——都会离开你的进程、到达提供方。要审慎授予读取权限。

**自定义 / 运行时工具不受授予要求约束**——注册它们_即是_授予。通过 `customTools` 或 `agent.addTool()` 传入的工具始终可用（它们仍然遵守 `disallowedTools`）；见 [_自定义工具_](#自定义工具)。**`delegate_to_agent`**（团队编排交接）和其它内置工具一样遵循默认拒绝规则：在你希望能够委派的每个智能体上，用 `tools: ['delegate_to_agent']` 授予它。

### 恢复此前的「全部工具」行为

在默认拒绝之前，没有工具配置的智能体会获得每一个已注册的内置工具——包括没有沙箱的 `bash`。要一行恢复这个便利，在编排器上设置 `defaultToolPreset`：

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

## 用 `onToolCall` 做逐次调用门控

上面这些层都作用于工具_名称_，回答的是**「哪些工具可达？」**。`onToolCall` 门控则在下一层回答一个不同的问题：**「_这一次具体调用_现在到底该不该跑？」** `bash` 是单个被允许的名称，它对 `ls -la` 和 `rm -rf /` 一视同仁；门控会检查实际参数，并可以否决个别调用。

这个钩子**需显式开启、默认关闭**。它在每次工具调用时运行一次——在 Zod 输入校验之后、工具实现之前——并返回一个决定：

```typescript
import type { ToolCallContext, ToolCallDecision } from '@open-multi-agent/core'

const orchestrator = new OpenMultiAgent({
  // Orchestrator-level default, inherited by any agent that sets no gate of its own.
  onToolCall: async (ctx: ToolCallContext): Promise<ToolCallDecision> => {
    // ctx: { toolName, input (post-validation), agentName, runId?, taskId? }
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
- **人工介入（human-in-the-loop）就发生在你的回调里。** 用 `await` 等你自己的 CLI 提示、Slack 按钮或网页对话框，然后返回 `allow` 或 `deny`。框架不规定任何审核渠道，从而把接口面保持得很小。
- **智能体覆盖编排器。** 对某个智能体来说，`AgentConfig.onToolCall` 会压过 `OrchestratorConfig.onToolCall`，因此一个团队可以设一条默认策略，同时让某个专职智能体把它收紧或放松。独立的 `new Agent({ ..., onToolCall })` 会把门控直接接进它的执行器。
- **在基于名称的授予之后运行。** 默认拒绝 / 允许清单 / 拒绝清单的解析**先**跑；一个未被授予的工具在门控之前就已被拒绝，所以门控只会看到对那些已经可达的工具的调用。自定义工具和 MCP 工具都走同一个执行器，因此它们也会被门控。
- **与 `onApproval` 正交。** `OrchestratorConfig.onApproval` 在编排回合之间对整批任务做门控；`onToolCall` 则在执行期间对单次工具调用做门控。它们工作在不同层级，可以叠加组合。
- **可观测性。** 当门控运行时，`tool_call` 追踪事件会带上 `gated: true`、`gateAction: 'allow' | 'deny'`，以及（在 deny 时）一个 `gateReason`——它会像其它敏感的追踪文本一样被脱敏，因此 `onTrace` 的消费方可以审计每一个决定。

> **不是安全边界。** 一个返回 `deny` 的门控仍然依赖于配合的代码；它是一个协调层，而不是隔离手段。`bash` 依旧没有沙箱（见下方标注）。面对一个真正不可信的 shell，请用进程级隔离（容器 / VM / seccomp）；门控管的是*策略*，不是*隔离*。

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
- **`review`**：吃上下文或含糊的：`ls -R`、不带 `-maxdepth` 的 `find /` / `find ~`、不带限定路径的 `grep -r` / `rg -r`、`tree`、`du`，以及任何无法识别的命令（默认：「别盲跑」）。
- **`high`**：破坏性 / 敏感的：`rm`、`sudo`、`curl ... | bash`、`dd`、`mkfs`、`chmod 777`/`-R`、`git push --force`、`npm publish`、写入系统路径。

复合命令会按 shell 分隔符（`&&`、`||`、`;`、`|`、替换）切段，取其中找到的**最高**风险，所以安全的前缀无法夹带破坏性的后缀（`ls && rm -rf /` 会变成 `high`）。带引号的片段会先被剥离，所以 `echo "rm -rf /"` 仍然是 `safe`。

这个分类器是一个**浅层启发式，而不是解析器**；它可能被混淆手法骗过（变量间接引用、base64 解码后执行、奇异的引号用法）。它只图方便：可以扩展这些表、包一层，或者整个替换掉。端到端的示例见 [`examples/patterns/risk-gated-bash.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/risk-gated-bash.ts)。

## 文件系统工作目录

内置文件系统工具（`file_read`、`file_write`、`file_edit`、`grep`、`glob`）被沙箱限制在每个智能体各自的工作目录里。路径必须是绝对路径，并且解析后落在该目录之内；符号链接会在检查之前被解析，因此无法逃出配置的根目录。

> **`bash` 没有沙箱。** 一旦智能体拿到 shell，任何 `cd /etc`、绝对路径或子 shell 都能轻易绕过逐工具的路径检查。因此沙箱最好理解为**对内置文件系统工具的路径限制**，而不是抵御任意命令执行的安全边界。如果完整的路径限制很重要，就用 `disallowedTools: ['bash']` 去掉 `bash`（或者干脆不把它放进你的 `tools` 允许清单），转而依赖文件系统工具。进程级隔离（容器、seatbelt、firejail）才是面对一个真正不可信 shell 的正确工具。

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

`bash` 工具在 POSIX 上运行于自己的进程组里，于是超时和中止信号会杀掉所有在后台运行的子进程，而不是任由它们比父进程活得更久。

## 自定义工具

有两种方式，给智能体一个不在内置集合里的工具。

**在配置时注入**，通过 `AgentConfig` 上的 `customTools`。当编排器集中接线工具时适用。这里定义的工具跳过预设 / 允许清单过滤，但仍然遵守 `disallowedTools`。

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

一个工具的 `execute` 闭包常常会捕获某个机密——一个 API token、一个服务密钥。如果多个智能体共用这个工具，它们就都以完整作用域握着同一个机密：一个被攻陷或行为失常的子智能体，会继承协调器持有的每一份凭据。要把机密按智能体划定作用域，就在 `AgentConfig` 上设置一个 `credentials` 包，并在工具内部从 `ToolUseContext` 读取它，而不是闭包捕获一个模块级的机密。

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

这个包是**逐智能体的、从不合并**：`researcher` 只看得到 `SEARCH_API_KEY`，`publisher` 只看得到 `CMS_TOKEN`，协调器和被委派的子智能体都不会继承另一个智能体的包。没有设置 `credentials` 的智能体拿到的是 `ctx.credentials === undefined`。

这是一种**划定作用域的便利，而不是隔离边界**。工具代码在进程内运行，仍然能读取 `process.env` 或任何模块级变量；`credentials` 只是给了你一个一等的位置，把每个智能体只需要的那些机密交给它。（你本来就可以给每个智能体各自一份带限定作用域闭包的 `customTools` 实例来近似做到这一点——`credentials` 包只是把它显式化，并把机密挪出闭包。）这些值会被当作机密对待：`credentials` 键会从追踪和仪表盘中自动脱敏。

## 工具输出控制

过长的工具输出会撑大对话体量、抬高成本。两个控制手段配合使用。

**校验（可选）。** 加上 `outputSchema`，在格式错误的工具结果被转发之前就拦下：

> **注意——两个不同的 `outputSchema` 字段。** `defineTool()` /
> `ToolDefinition` 上的那个（下面展示）校验单个**工具**的 `ToolResult.data`
> ——它始终是 `ZodSchema<string>`，因为工具输出会序列化为
> 文本。[`AgentConfig`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/structured-output.ts)
> 上的 `outputSchema` 则不同：它把**智能体的最终答案**当作解析后的 JSON、
> 对照一个任意的 Zod schema 来校验（见 `examples/` 里的 _Structured output_）。
> 类型不同、作用域不同——你把它们弄混时 TypeScript 不会警告你，
> 所以挑出和你所在层级匹配的那一个。

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

**消费后压缩。** 一旦智能体已对某个工具结果采取行动，就压缩记录里较旧的副本，让它们不再在之后的每一轮上消耗输入 token。错误结果永远不会被压缩。

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
- 优先使用本地安装或固定版本的 MCP 服务器二进制文件，并只传入该服务器需要的环境变量。避免把 `process.env` 展开进 MCP 子进程。

完整可运行的配置见 [`integrations/mcp-github`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/mcp-github.ts)。
