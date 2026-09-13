---
title: "自托管与数据驻留"
description: "框架会连接什么、状态存放在哪里、气隙部署需要什么——安全评审会问的那些事实，集中在一处。"
---

`@open-multi-agent/core` 是一个库，不是服务。这里没有 OMA 后端、没有账号、也没有托管控制面：框架完全运行在你自己的 Node.js 进程内，它持久化的一切都经由你提供的存储写出。本页把一次评审所需的事实集中在一处。每条陈述都是关于框架本身的；凡是由你自己的配置决定的地方，都会明确说明。

## 运行时足迹

Core 的运行时依赖是：

| 包 | 用途 |
|---|---|
| `@anthropic-ai/sdk` | Anthropic 提供方适配器 |
| `openai` | OpenAI 适配器，以及每一个 OpenAI 兼容的提供方，包括本地服务 |
| `zod` | 工具输入 schema 与结构化输出校验 |

其余全部是 peer 依赖且可选：ACP SDK、MCP SDK、Google GenAI SDK、AWS Bedrock 客户端与 Vercel AI SDK。每一个都在某项功能真正需要它的那一刻通过动态 `import()` 加载，因此一次从不使用 ACP 的安装永远不会解析 ACP SDK。提供方适配器模块同样是动态导入的，所以那两个内置的提供方 SDK 只在需要它们的适配器被构造时才加载。

受支持的运行时是 Node.js 20 或更高版本。OpenTelemetry 位于独立的 `@open-multi-agent/otel` 包中，core 的导入永远不会把它拉进来。

## 什么会连接网络

框架为一个目的打开出站 HTTP：与你的配置所指定的 LLM 端点通信。`AgentConfig.baseURL` 与提供方环境变量决定它指向哪里。把它们指向一个本地服务，框架便再没有任何理由离开这台机器。唯一会触及自身模型 API 之外的提供方是 GitHub Copilot，其适配器还会调用 `api.github.com` 获取 token，并在交互式设备登录时调用 `github.com`。

包中**没有遥测、没有分析、没有许可证检查、没有更新检查，也没有任何形式的回传**。本代码库中的"遥测"一词指的是本地的[可观测性](/zh/reference/observability/)子系统：链路记录被送往你自己构造的 sink 和你自己拥有的存储。除非你亲手接上一个导出器，否则什么都不会被发送出去；而能做这件事的 OpenTelemetry 适配器是一个拥有独立生命周期的可选包。

有四样东西启动的是子进程而非连接，且每一样都是你配置的：

- **MCP 服务**只通过 stdio 连接。MCP 客户端使用 `StdioClientTransport`，因此一个服务就是同一台机器上的一个子进程。core 中没有 HTTP 或 SSE 形式的 MCP 传输。
- **`process` 与 `acp` 后端**会启动你指定的命令。参见[外部智能体](/zh/reference/external-agents/)。
- **`bash` 工具**通过本地 shell 运行命令。
- **进程树清理**在 Windows 上外调 `taskkill` 以终止子进程的后代。

这些子进程各自拥有你的进程的权限和它自己的网络访问能力。框架启动它们并交换字节；框架并不约束它们。

## 约束 LLM 出网

`egressPolicy` 收窄框架自有的 LLM 请求可以去往何处。两种模式：

- `offline` 只允许回环源：`localhost`、`*.localhost`、`127.0.0.0/8` 与 `[::1]`。
- `allowlist` 只允许你列出的那些确切 HTTP(S) 源。

在编排器、运行与智能体三个层级配置的策略会取交集，因此更窄的作用域可以收紧、但永远无法放宽更宽的那一个。所谓强制执行，是指在提供方 SDK 加载之前就检查源，一个受保护的 fetch 会对每个请求再检查一次，且重定向会被拒绝。OMA 无法强制执行的适配器会 fail closed，而不是不受保护地继续。

**请仔细阅读这条作用域声明。**该策略覆盖的是框架自身发出的 LLM 请求。它不覆盖工具代码、`bash` 工具、MCP 服务内部、`process` 与 ACP 子进程、应用回调，或你自己的链路导出器。`offline` 是关于 OMA 的提供方调用的一项声明，并不能作为 Node.js 进程及其后代处于离线状态的证据。完整的逐面对照表见[出网强制执行对照表](/zh/reference/egress-policy/#强制执行对照表)。

## 状态存放在哪里

没有任何东西会被持久化到你未曾选择的地方。共享内存、检查点、持久化审批，以及——在配置了运行记录时——权威的[运行记录](/zh/reference/run-store/)，全都经由 `MemoryStore` 接口，core 提供三个实现：

| 存储 | 持久性 | 说明 |
|---|---|---|
| `InMemoryStore` | 无；随进程消亡 | 进程内的 `compareAndSet` |
| `FileStore` | 单个 JSON 文件，每次变更原子重写 | 同一时刻只能有一个 Node 进程；没有跨进程文件锁 |
| `RedactingStore` | 取决于它所包装的对象 | 写入时清洗值；刻意不暴露 `compareAndSet`，因此无法支撑持久化审批。参见[脱敏](#脱敏) |

**没有内置的数据库存储。**Redis、Postgres 与 SQLite 在源码中只作为应用可以在 `MemoryStore` 之后实现什么的示例出现。当你的规模超出一个文件时，自己写一个才是受支持的路径。

**不提供跨进程原子性。**`FileStore.compareAndSet` 在共享同一个 `FileStore` 实例的调用方之间是原子的，而这就是全部保证。因此跨进程的审阅者应当只在被挂起的运行器已退出之后再作决定，否则该部署就需要一个由数据库支撑、其 `compareAndSet` 对所有写入方都原子的存储。这一点在[持久化审批](/zh/reference/durable-approvals/#存储要求)中最为要紧——那里决定的写入就是正确性边界——在[运行记录](/zh/reference/run-store/)中也同样要紧，它决定了两个 worker 能否推进同一次运行。因此 `MemoryStoreRunStore` 默认声明 `atomicity: 'process'`，除非你另行告知；随包提供的那些存储永远不够格声称 `'cross-process'`。

链路记录与评估记录有各自的存储，面临同一种形状的选择：`InMemoryTraceStore` 或 `FileTraceStore`、`InMemoryEvalStore` 或 `FileEvalStore`。两个基于文件的变体都是仅追加的本地文件。

## 文件系统范围

内置的文件系统工具会把每一个路径（含符号链接）解析到一个沙箱根之内。未设置时，该根是 `<process.cwd()>/.agent-workspace`，在首次写入时创建。`OrchestratorConfig.defaultCwd` 或 `AgentConfig.cwd` 可以移动它，`process.cwd()` 会把它放宽到整个项目，而 `null` 则关闭它。

**`bash` 工具不在沙箱内。**它直接从模型接收一个 `cwd` 参数，并以你的进程的权限通过 shell 运行命令。沙箱根不约束它，除非你配置了逐次调用的闸门，否则那道闸门也不约束它。授予 `bash` 就是授予对宿主机的 shell 访问权限；授权模型与逐次调用的 `onToolCall` 闸门见[工具配置](/zh/reference/tool-configuration/)，沙箱根、它的解析规则与可替换的 shell 执行器见[沙箱与 shell 执行](https://github.com/open-multi-agent/open-multi-agent/blob/v1.19.0/docs/sandbox-and-shell.md)。

## 脱敏

一个共享的凭据脱敏器会在内容被持久化或导出之前，在若干个面上运行：

- 链路属性，以及一次智能体运行所记录的工具输入/输出
- 可观测性状态消息与记录处理器
- 任务元数据
- `bash` 工具输出
- `process` 后端在失败退出时的 stderr
- 评估采样与报告载荷
- `RedactingStore` 的值，以及设置了 `redact` 时的 `JsonlRunJournal` 事件

它内置的模式都是凭据形状的：key/secret/token/password 一类的字段名，`Authorization` 与 `Bearer` 头，PEM 私钥块，以及诸如 `sk-`、`ghp_`、`AKIA` 和 `xox` 前缀这类字面 token 格式。

**默认不覆盖 PII。**邮箱、身份证号、账号，以及其他任何领域相关的信息，除非你自己提供模式，否则都会原样通过。接受这些模式的只有两个面：`RedactingStore` 与 `JsonlRunJournal`，都通过 `patterns` 选项（底层的辅助函数把同一份列表称作 `extraPatterns`）；上面其余的面只运行内置模式，不接受调用方追加。脱敏在构造上也是尽力而为的：它是一组作用于文本的正则表达式，而不是一个分类器。不要把它当作智能体可以输出什么的唯一控制手段。

有一条边界很容易被忽略：遥测脱敏触及不到已持久化的运行状态。除非存储本身被 `RedactingStore` 包裹，否则共享内存写入与检查点保存都会原样存下智能体的输出。参见[共享内存](/zh/reference/shared-memory/#对持久化的密钥脱敏)。

## 气隙部署

两处配置覆盖框架自身的行为：

1. **一个 OpenAI 兼容的端点。**把它配置为 `provider: 'openai'`，`baseURL` 指向该服务，并附一个非空的占位 `apiKey`——因为 OpenAI SDK 会校验该字段已设置，哪怕服务端会忽略它。参见[本地模型工具调用](/zh/reference/providers/#本地模型工具调用)。
2. **一条出网策略**，好让一个过时的 `baseURL` 或一个继承来的环境变量 fail closed，而不是够到某个托管的提供方。当端点位于同一台主机上时使用 `{ mode: 'offline' }`：它只允许回环，并刻意拒绝私有 LAN 地址。位于网络中别处的服务则需要 `{ mode: 'allowlist', allowedOrigins: ['http://<host>:<port>'] }`，因为 `offline` 会把它拦下。

这条边界上的其余一切都在框架能强制执行的范围之外：一个会向外调用的 MCP 服务、一个被授予 `bash` 的智能体、一个子进程拥有网络访问能力的外部后端，或一个指向机器之外的链路导出器。框架不会自行打开连接，但它也无法约束它代你启动的那些代码。真正起作用的控制手段是网络命名空间、出网代理，或宿主机防火墙。

## 不提供什么

为了不让本页的任何内容被读作超出其本意，框架**不**包含：

- **多租户。**这里没有租户概念。把一个客户的运行、存储与工作区同另一个客户隔离开，是应用层的事。
- **RBAC 或任何授权模型。**没有角色、没有权限、没有策略引擎。工具授权模型与 `onToolCall` 闸门是逐智能体的配置，不是一套身份系统。
- **SSO 或身份认证。**OMA 从不对任何人做身份认证。一条持久化审批记录下你传给它的 `reviewer.id` 字符串，且只校验它非空。
- **审批 UI 或工作流。**挂起/决定/恢复的 API 与持久化记录是存在的；面向审阅者的产品并不存在。参见[持久化审批](/zh/reference/durable-approvals/)。
- **防篡改审计。**运行事件日志没有哈希链、没有签名，也没有 WORM 存储。参见[运行事件日志](/zh/reference/run-journal/)。
- **由数据库支撑的存储。**随包提供的只有内存与单文件两种实现。任何具备跨进程保证的实现都要你自己写。
- **静态加密。**基于文件的存储写出的是纯 JSON 与按行分隔的 JSON。请针对这些文件将要承载的数据，采用相应的磁盘或文件系统加密。
