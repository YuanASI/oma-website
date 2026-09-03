---
title: "结构化智能体输入"
description: "向 run()、stream() 与 runAgent() 传入完整的 LLMMessage 数组而非字符串：既有对话轮次、图像内容块，以及经校验的深拷贝。"
---

`Agent.run()`、`Agent.stream()` 与 `OpenMultiAgent.runAgent()` 既接受字符串，也接受完整的
`LLMMessage[]`。字符串形式仍是「一条 user 文本消息」的简写，未发生变化。当应用自己
持有先前的对话轮次、或需要图像这类内容块时，改用消息形式：

```ts
import {
  OpenMultiAgent,
  type LLMMessage,
} from '@open-multi-agent/core'

const messages: LLMMessage[] = [
  { role: 'user', content: [{ type: 'text', text: 'Keep answers concise.' }] },
  { role: 'assistant', content: [{ type: 'text', text: 'Understood.' }] },
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is shown here?' },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: imageBytes.toString('base64'),
        },
      },
    ],
  },
]

const result = await new OpenMultiAgent().runAgent(
  { name: 'vision', model: 'claude-sonnet-4-6' },
  messages,
)
```

所选的模型 / 提供方必须支持你提供的每一种内容块。OMA 不会推断某个「视觉能力」标志，
也不会静默移除不受支持的块；提供方的报错沿正常的智能体失败路径处理。

## API 边界

| API | 字符串形式 | 结构化形式 | 对话行为 |
|---|---|---|---|
| `Agent.run(input)` | 一条 user 文本消息 | 完整的 `readonly LLMMessage[]` | 全新开始；既不读取也不更新持久历史 |
| `Agent.stream(input)` | 一条 user 文本消息 | 完整的 `readonly LLMMessage[]` | 全新开始；输入语义与 `run()` 相同 |
| `OpenMultiAgent.runAgent(config, input)` | 一条 user 文本消息 | 完整的 `readonly LLMMessage[]` | 全新的一次性 Agent，带编排、追踪、进度、预算与评估 |
| `Agent.prompt(input)` | 一条 user 文本消息 | 以 `readonly ContentBlock[]` 表达的一个 user 轮次 | 把该轮次与响应追加到持久历史 |

`AgentConfig.history` 为 `prompt()` 恢复更早的持久轮次。向 `prompt()` 传入一个内容块列表
并不会替换那段历史，也无法插入 assistant 轮次；需要由调用方自己掌控完整对话时，请用
`run(messages)`。`runTeam()` 的目标与 `runTasks()` 的任务描述仍然只接受文本。

## 复制与校验

结构化输入会用适配器边界上同一套 `LLMMessage` 形状守卫做运行时校验，随后在钩子、
运行器、进度回调、评估或持久历史留存它们之前做防御性深拷贝。在调用某个 API 之后
再修改调用方的数组、内容块、图像 source 或工具输入，都不会改变那一次运行。
`Agent.getHistory()` 同样返回深拷贝。

无效的消息 / 内容形状，或无法克隆的数据，会在 `beforeRun`、提供方 / 后端执行、进度与
在线评估之前抛出 `InvalidMessageError`。无效的 `prompt()` 输入不会被追加进历史。
对 `stream()` 而言，这项校验发生在 `stream()` 被调用时，早于返回的迭代器开始产出。

## `beforeRun` 语义

`beforeRun` 会同时收到有效输入的两个视图：

```ts
beforeRun(ctx) {
  return {
    ...ctx,
    messages: ctx.messages, // complete defensive message copy
    prompt: ctx.prompt,     // text blocks from the latest user message
  }
}
```

`ctx.prompt` 仍是最新那条 user 消息中文本块的向后兼容拼接。因此一个只含图像的轮次
会有一个空的 `prompt`，但在 `ctx.messages` 中完整可得。

返回 `messages` 会替换整份输入。如果该钩子同时改动了 `prompt`，OMA 会先应用消息替换，
再把最新那条 user 消息的文本块替换成单个文本块。非文本块保持其相对顺序。钩子的输入
与执行用的消息都是副本，因此钩子里的重写不会改动调用方自有的数据，也不会改动
`Agent.prompt()` 所存下的原始 user 轮次。

## 进度与在线评估

字符串形式的 `runAgent()` 调用保留既有的 `agent_start` 负载 `{ prompt: string }` 与字符串
评估输入。结构化调用则发出 `{ messages: LLMMessage[] }`，并向在线评估提交一份独立的
消息副本。进度回调中的修改无法影响执行或评估。评估器既有的 `storePayloads` 策略依然
适用：`none` 会略去内容，而 `redacted` 或 `full` 会按照文档化的隐私约定序列化一份有界负载。

## 外部进程与 ACP 后端

进程与 ACP 后端暴露的是文本 prompt 传输通道，而不是 OMA 的结构化消息协议。向
`run()` / `stream()` / `runAgent()` 传入 `LLMMessage[]`，或向 `prompt()` 传入 `ContentBlock[]`，
都会在进程被拉起、或 ACP 会话被开启之前抛出 `InvalidMessageError`。这条快速失败的边界
防止图像或调用方自有的历史被静默丢弃。请改传字符串。

出于同样的原因，外部智能体的 `beforeRun` 可以重写 `prompt`，但不能改动 `messages`。
既有的字符串执行——包括进程后端「每次运行全新开始」的行为与 ACP 的协议会话行为——
均保持不变。`AgentConfig.history` 不会为这两种外部传输通道注入内容；它只为由 LLM
支撑的 `prompt()` 对话恢复消息。
