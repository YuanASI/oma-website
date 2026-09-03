---
title: "出网策略"
description: "限制内置 LLM 适配器可以访问的源——allowlist 或 offline 模式，并在编排器、单次运行与智能体三个作用域上取交集，失败即关闭。"
---

`egressPolicy` 用于限制 OMA 能够识别、并在内置 LLM 适配器发起之前加以把关的网络请求。
它是一项应用层配置控制，不是进程沙箱，也不是主机防火墙。

不配置该策略即保持既有行为。一旦配置了策略，只有在本文明确说明「已强制执行」的那些
内置适配器接口面上，OMA 才会失败即关闭。

## 配置与优先级

`OpenMultiAgent`、`AgentConfig` 以及每次顶层运行的选项，都接受同一个 `EgressPolicy` 类型：

```typescript
import { OpenMultiAgent } from '@open-multi-agent/core'

const oma = new OpenMultiAgent({
  egressPolicy: {
    mode: 'allowlist',
    allowedOrigins: [
      'https://api.anthropic.com',
      'http://localhost:11434',
    ],
  },
})

const result = await oma.runAgent(
  {
    name: 'local',
    model: 'llama3.1',
    provider: 'openai',
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
  },
  'Summarize this text.',
  { egressPolicy: { mode: 'offline' } },
)
```

编排器、单次运行与智能体三层策略会取交集。被省略的作用域不改变结果；更具体的作用域
可以收窄访问范围，但不能放宽父作用域。交集为空时，会拒绝每一个由框架发起的 LLM 源。
同一份有效策略会作用到工作智能体、协调器、综合环节、被委派的智能体、模型路由的回退、
共识智能体，以及内置的 LLM 语义画像器。

可选的模式为：

- `offline`：只允许 URL 主机名为 `localhost`、`*.localhost`、IPv4 `127.0.0.0/8` 与 IPv6
  `::1`。私有局域网、链路本地地址，以及恰好解析到回环地址的任意名称，都不被允许。
- `allowlist`：只允许列出的 HTTP(S) 源。条目按标准的 URL origin 语义归一化，且不得包含
  凭据、路径、查询串或片段。非默认端口属于 origin 的一部分。

提供方的请求可以使用某个被允许的源之下的任意路径。每一次受把关的 fetch 都使用
`redirect: 'error'`，因此一个被放行的端点无法把携带凭据的 SDK 请求静默重定向到另一个源。

对内置提供方的目标选择而言，`AgentConfig.baseURL` 优先于 `OpenMultiAgent.defaultBaseURL`；
生效的显式取值再优先于提供方端点的环境变量，后者又优先于内置默认值。相关的端点变量有
`ANTHROPIC_BASE_URL`、`OPENAI_BASE_URL`、`AZURE_OPENAI_ENDPOINT`、`MINIMAX_BASE_URL`、
`MIMO_BASE_URL` 与 `HUNYUAN_BASE_URL`。Copilot 使用固定的源，会忽略 `baseURL`。策略生效时，
Azure OpenAI 要求提供显式 / 默认端点，或 `AZURE_OPENAI_ENDPOINT`。

## 强制执行对照表

| 接口面 | 配置了 `egressPolicy` 时的行为 |
|---|---|
| Anthropic、OpenAI、Azure OpenAI、DeepSeek、豆包、Grok、混元、MiniMax、MiMo 与七牛的内置适配器 | 强制执行。OMA 会在加载可选 SDK 之前解析并检查生效的提供方源，注入一个受把关的 fetch 传输层，对每个请求再检查一次，并拒绝重定向。 |
| Gemini 内置适配器 | 不支持，在导入或建连之前失败即关闭。当前的 Google GenAI SDK 路径使用模块级全局 fetch，没有向该适配器暴露按客户端的传输钩子。 |
| AWS Bedrock 内置适配器 | 不支持，在导入或建连之前失败即关闭。当前适配器无法约束全部请求与 AWS 凭据提供方端点，包括身份 / 元数据路径。 |
| AI SDK 桥接或其它自定义 `LLMAdapter` | 不支持，在调用适配器之前失败即关闭。模型对象没有向 OMA 暴露可靠的目标与传输约定。把自定义适配器提供给内置语义画像器或协调器时同样如此。 |
| GitHub Copilot 的鉴权与 API | 强制执行。预先提供的 GitHub token 需要 `https://api.github.com` 与 `https://api.githubcopilot.com`。交互式设备登录还额外需要 `https://github.com`。OMA 会在第一次鉴权请求之前检查全部必需的源，并对 token 交换与模型 API 的 fetch 一并把关。 |
| 自定义 `TaskProfiler`、执行路由器、钩子与其它应用回调 | 不在覆盖范围内。它们是应用自有的进程内代码。 |
| MCP stdio 子进程 | 不在覆盖范围内。OMA 启动所配置的子进程并交换 stdio 消息；它无法约束 MCP 服务器内部发起的连接。 |
| `process` 与 ACP 后端 | 不在覆盖范围内。OMA 启动一个子进程并使用 stdio；该子进程自行掌控其网络行为。ACP 的权限回调不是网络沙箱。 |
| 内置的 `bash` 工具 | 不在覆盖范围内。该 shell 进程可以使用宿主的权限与网络栈。 |
| 自定义工具，包括会调用 `fetch` 的工具 | 不在覆盖范围内。工具代码及其客户端由应用提供。 |
| `@open-multi-agent/otel` 与应用自有的 trace/OTel 导出器 | 不在覆盖范围内。OMA 调用你提供的 tracer、provider、sink 或 exporter；应用自行掌控其传输与生命周期。 |

任何通过 `AgentConfig.adapter` 提供的适配器实例，对本策略而言都算自定义适配器，即便应用
是用 OMA 的适配器类构造出来的。请通过 `provider` 与 `baseURL` 选择一个可强制执行的内置
提供方，让 OMA 掌控构造过程，从而能注入受把关的传输层。

即便 MCP、后端、shell 与自定义工具这几行是由一个已配置策略的智能体拉起的，它们依然处在
策略之外。当这些接口面必须被约束时，请使用进程 / 容器网络命名空间、出网代理或操作系统
防火墙。不要把 `offline` 当成整个 Node.js 进程及其子进程已经离线的证据。

## 错误与审计行为

无效的策略形状与允许列表条目会抛出 `EgressPolicyError`，其 `code: 'INVALID_EGRESS_POLICY'`；
无效条目绝不会被忽略。直接调用 `createAdapter()` 也会以同一个错误类拒绝。在一次智能体的
LLM 运行中，拒绝或不支持的适配器沿既有的 LLM 失败路径处理：该智能体结果为不成功，带
`status.code: 'rejected'`、`errorInfo.kind: 'validation'` 与一个不可重试的稳定代码。它不会被
转换成工具的 `ToolResult`。

其余的稳定代码为：

| 代码 | 含义 |
|---|---|
| `EGRESS_POLICY_DENIED` | 一个具体解析出的源落在生效策略之外。 |
| `EGRESS_POLICY_TARGET_UNRESOLVED` | 内置适配器需要一个端点，而配置与环境都没有提供。 |
| `EGRESS_POLICY_UNSUPPORTED` | OMA 无法如实地在所选适配器的传输接口面上强制执行。 |

既有的团队 / 任务失败与依赖级联行为保持不变。任何策略结果都不会重试，因为再试一次并不能
放宽策略。

## 安全边界

该把关在 fetch 实现运行之前评估所配置的 / 请求的 URL。它不是 DNS 解析钉定、代理强制、
套接字拦截，也不是对被攻破的提供方 SDK 的防护。一个被允许的主机名，仍会按进程所处的
DNS 环境去解析。若需要一条硬性的隔离边界，请把这项声明式审计控制与基础设施层面的出网
强制手段配合使用。
