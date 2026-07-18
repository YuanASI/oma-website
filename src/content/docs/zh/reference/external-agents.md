---
title: "外部智能体"
description: "编排以本地进程运行、或通过 Agent Client Protocol (ACP) 运行的外部智能体——让 Claude Code 这类编码智能体成为 OMA 团队的一等公民。"
---

OMA 可以编排**以本地进程运行的外部智能体**，与它由 LLM 驱动的智能体并肩工作。内置两种后端类型：

- `process` 为每次智能体运行启动一个通用的本地命令，通过 stdin 或参数发送 prompt，并把 stdout/stderr/退出状态映射成一个正常的智能体结果。
- `acp` 通过 [Agent Client Protocol (ACP)](https://agentclientprotocol.com) 驱动一个编码智能体——这是一个 JSON-RPC-over-stdio 标准，由 Gemini CLI、Claude Code、Codex 等实现。

外部智能体是一等的团队成员：它处于同一个任务 DAG 中，写入同一份共享内存，向其下游依赖级联失败，并返回与任何 LLM 智能体相同的结果形状。最能说明问题的形态是一个**混合团队**——一个 LLM 规划器分解目标，一个外部编码智能体编写代码，一个 LLM 审查器审计 diff——全部在一次 `runTeam` / `runTasks` 调用中完成。

## 快速开始

用 `backend` 而非模型来声明一个智能体。团队的其它一切都保持不变：

```typescript
import { OpenMultiAgent } from '@open-multi-agent/core'

const oma = new OpenMultiAgent({ defaultModel: 'claude-sonnet-4-6', defaultProvider: 'anthropic' })

const team = oma.createTeam('hybrid-dev', {
  name: 'hybrid-dev',
  agents: [
    { name: 'planner',  systemPrompt: 'Break the task into a short plan. Do not write code.' },
    {
      name: 'coder',
      systemPrompt: 'Writes and edits code by running an external coding CLI.',
      backend: {
        kind: 'process',
        command: 'node',
        args: ['scripts/code-agent.js'],
        cwd: process.cwd(),
      },
    },
    { name: 'reviewer', systemPrompt: 'Review the change and summarize risks. Do not edit files.' },
  ],
  sharedMemory: true,
})

const result = await oma.runTeam(team, 'Add a slugify() utility with tests, then review it.')
```

协调器根据 `coder` 的名册描述把编码工作路由给它；子进程执行文件编辑；`reviewer` 随后从共享内存读取结果。

一个可运行的 `process` 版本见
[`examples/integrations/external-agent-process.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/external-agent-process.ts)。
一个可运行的 ACP 版本见
[`examples/integrations/external-agent-acp.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/external-agent-acp.ts)。

## 安装

`process` 后端没有额外依赖。它使用 Node 内置的子进程 API，并启动你所配置的任何本地命令。

ACP 支持需要那个可选的 peer 依赖，它是惰性加载的，因此绝不会影响不使用 ACP 的使用方：

```bash
npm install @agentclientprotocol/sdk
```

你还需要一个会说 ACP 的智能体。设置后端的 `command` / `args` 来启动它——任何 ACP 智能体都可以。常见选择：

| 智能体 | `command` / `args` | 说明 |
|-------|--------------------|-------|
| **Claude Code** | `npx -y @agentclientprotocol/claude-agent-acp` | 官方 [Claude Agent SDK 适配器](https://github.com/agentclientprotocol/claude-agent-acp)（Claude Code 没有原生 ACP）。通过 `ANTHROPIC_API_KEY` 认证。 |
| Gemini CLI | `gemini --acp` | 原生 ACP。注意：据报道 Google 正在停用免费层的 Gemini CLI（及其 `--experimental-acp` 标志）——依赖它之前请先确认其可用性。 |
| Codex | `codex-acp` (or `codex --experimental-acp`) | 实验性的 ACP 支持。 |

本指南中的 ACP 示例使用 Claude Code，它契合 OMA 以 Anthropic 为中心的默认配置，且整个团队只需一个密钥（`ANTHROPIC_API_KEY`）。

## 配置

`AgentConfig.backend` 接受一个 `ExternalAgentBackendConfig` 可辨识联合类型：

| 字段 | 类型 | 默认值 | 含义 |
|-------|------|---------|---------|
| `kind` | `'process' \| 'acp'` | — | 后端判别式。 |
| `command` | `string` | — | 要启动的可执行文件（`'npx'`、`'gemini'`、…）。 |
| `args` | `string[]` | `[]` | 传给 `command` 的参数。 |
| `env` | `Record<string,string>` | — | 额外的环境变量，合并覆盖到 `process.env` 之上。 |
| `cwd` | `string` | `process.cwd()` | 子进程的工作目录。 |
| `input` | `'stdin' \| 'argument' \| 'none'` | `'stdin'` | 仅 `process`：如何把 prompt 传给命令。 |
| `permission` | `'auto-approve' \| 'reject' \| fn` | `'auto-approve'` | 仅 `acp`：如何回应权限提示（见下）。 |

当设置了 `backend` 时，LLM 专属的字段（`model`、`provider`、`adapter`、采样、`tools`、上下文策略）都不适用——外部智能体运行它自己的循环，`model` 变为可选。智能体的 `systemPrompt` 是例外：它仍然会塑造外部智能体，因为 OMA——缺少任何 ACP 系统 prompt 字段——会把它前置到智能体的第一个 prompt 之前（每个会话一次），此外还会像对每个智能体那样用它为协调器的路由做引导。

对于 `process`，OMA 每次运行都启动一个全新的子进程。对于从 stdin 读取 prompt 的命令，使用 `input: 'stdin'`；当命令期望把 prompt 作为最后一个参数时，使用 `input: 'argument'`；对于从文件或环境推导其工作内容的固定适配器，使用 `input: 'none'`。

### ACP 权限

ACP 智能体会请求客户端批准敏感的工具调用（编辑文件、运行命令）。因为 OMA 在 DAG 内自主运行智能体，默认值是 `'auto-approve'`（当有提供时它选择最小权限的 `allow_once`，否则选 `allow_always`）。按需收紧：

```typescript
backend: {
  kind: 'acp',
  command: 'npx',
  args: ['-y', '@agentclientprotocol/claude-agent-acp'],
  // Reject everything…
  permission: 'reject',
  // …or decide per request.
  permission: (req) => req.kind !== 'delete' && !req.title.includes('rm -rf'),
}
```

该回调收到一个最小化的、与 SDK 无关的 `{ title, kind, optionKinds }`，返回 `true` 表示批准 / `false` 表示拒绝。

> **安全。** 与 OMA 的文件系统工具沙箱不同，外部后端直接访问
> `cwd`——它们是拥有你的权限的本地子进程。把 `cwd`
> 限定在一个你信任该后端的项目里。ACP 后端可以用 `permission` 来
> 把关协议层的权限提示；process 后端没有协议级的
> 权限提示，因此要约束所配置的 command、args、env 和 cwd。

## 工作原理

两个内置后端都实现了与 `AgentRunner` 已经实现的相同的 `AgentBackend` 接口（`run` + `stream`）。因此，池、调度器、任务队列、共享内存和预算聚合都可以像对待 LLM 智能体一样对待外部智能体，无需任何特例。

### Process 后端

`process` 后端为每次运行启动一个全新的子进程。它拼接所配置的 `systemPrompt` 和用户 prompt，把结果传给命令，并按如下方式映射进程的结果：

| 进程结果 | 映射为 |
|-----------------|---------|
| stdout + 退出码 `0` | 成功；stdout 成为 `result.output` |
| stderr + 退出码 `0` | 成功；stderr 被忽略，除非进程把它写入了 stdout |
| 退出码 / 信号 | 任务失败；stderr 经脱敏处理后包含在错误输出中 |
| 调用方中止 | 取消；子进程被杀掉 |
| 无 token 信号 | `tokenUsage` 为 `{0, 0}` |

对于简单的本地 CLI、脚本，或不需要长生命周期智能体协议的适配器，使用这个后端。

### ACP 后端

OMA 担任 ACP **客户端**角色。在某个智能体的第一次运行时，它启动子进程，把它的 stdio 组织为以换行分隔的 JSON-RPC，执行 `initialize`，并在 `cwd` 中打开一个 `session/new`。随后每次 `agent.run(prompt)` 发送一个 `session/prompt` 回合，并把 `session/update` 通知抽取汇入一个正常的智能体结果：

| ACP update / stop | 映射为 |
|-------------------|---------|
| `agent_message_chunk` (text) | 流式的 `text` 增量 + 结果的 `output` |
| `tool_call` / `tool_call_update` | `result.toolCalls` 中的条目 |
| `usage_update` (`used`) | `result.tokenUsage`（见下方注意事项） |
| stop `end_turn` | 成功 |
| stop `max_tokens` / `max_turn_requests` | 成功，带 `budgetExceeded`（提前停止） |
| stop `refusal` | 任务失败（级联到下游依赖） |
| stop `cancelled` | 返回部分输出（来自一次中止） |

### ACP token 计量的注意事项

ACP 报告的是单个**上下文 token**数字（`usage_update.used`——“当前在上下文中的 token”），而非输入/输出的拆分，且它在一个会话中是*累计的*，不是每回合的增量。因为 OMA 在一个智能体的各回合间复用同一个会话，它把每回合的用量记录为自上次读数以来的**增量**，并存为 `tokenUsage.input_tokens`（`output_tokens: 0`）——这样跨回合求和会收敛到最新的数字，而非重复计数。那个总量会聚合进本次运行并遵守 `maxTokenBudget`。一个不发出任何 `usage_update` 的智能体会报告 `{0, 0}`，因此**不受**预算门控——请按 LLM 智能体来设定预算，或用 ACP 智能体自己的 `--max-*` 标志来约束它。

## 编程式 API

大多数用户只会接触 `backend`。若要直接构造一个后端，从对应的子路径导入：

```typescript
import { createAcpBackend } from '@open-multi-agent/core/acp'
import { createProcessBackend } from '@open-multi-agent/core/process'

const processBackend = createProcessBackend({ command: 'node', args: ['agent.js'] })
const processResult = await processBackend.run([{ role: 'user', content: [{ type: 'text', text: 'summarize' }] }])

const backend = createAcpBackend({ command: 'npx', args: ['-y', '@agentclientprotocol/claude-agent-acp'] })
const result = await backend.run([{ role: 'user', content: [{ type: 'text', text: 'refactor foo.ts' }] }])
await backend.dispose() // close the connection and kill the subprocess
```

## v1 范围

本次发布**尚未**做到的（带上真实用例开一个 issue，可以推动其中任何一项提前）：

- **仅客户端角色。** OMA 驱动外部智能体；它不会把 OMA 智能体*作为*一个 ACP 智能体暴露给编辑器。
- **不代理 `fs/*`。** 智能体在 `cwd` 内自行进行文件系统访问；OMA 尚未通过它的沙箱代理 ACP 文件操作。需要客户端来提供文件的智能体不受支持。
- **Process 后端是无状态的。** 它每次运行启动一个子进程，并把 stdout 映射为输出。当你需要会话、结构化的工具事件或协议级的权限提示时，使用 ACP 或自定义后端。
- **没有基于成本的预算。** 预算是基于 token 的；`usage_update.cost` 会被忽略。
- **ACP 子进程的生命周期。** 一个被编排的 ACP 智能体的子进程会一直存活到进程退出（`runTeam` / `runTasks` 中没有按智能体的销毁钩子）。当你需要显式拆除时，使用编程式 API + `dispose()`。
