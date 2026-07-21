---
title: "上下文管理"
description: "用上下文策略、工具结果压缩与跨提供方推理，让长时运行始终待在 token 上限之下。"
---

长时运行的智能体很快就会触及输入 token 上限。在 `AgentConfig` 上设置 `contextStrategy`，控制对话在变长时如何收缩：

```typescript
const agent: AgentConfig = {
  name: 'long-runner',
  model: 'claude-sonnet-4-6',
  // Pick one:
  contextStrategy: { type: 'sliding-window', maxTurns: 20 },
  // contextStrategy: { type: 'summarize', maxTokens: 80_000, summaryModel: 'claude-haiku-4-5' },
  // contextStrategy: { type: 'compact', maxTokens: 100_000, preserveRecentTurns: 4 },
  // contextStrategy: { type: 'custom', compress: (messages, estimatedTokens) => ... },
}
```

| Strategy | 何时选用 |
|----------|----------------------|
| `sliding-window` | 开销最低。保留最近 N 轮，其余丢弃。 |
| `summarize` | 把旧轮次发送给一个摘要模型；用摘要替换原始内容。 |
| `compact` | 基于规则：截断大段 assistant 文本和工具结果，最近轮次原样保留。不额外调用 LLM。 |
| `custom` | 提供你自己的 `compress(messages, estimatedTokens)` 函数。 |

## 压缩工具结果

工具输出会跨轮次留在对话历史中，即便智能体已经据此行动过。在长时运行中，这会占用相当大一部分上下文预算。

`compressToolResults` 会在每次新的 LLM 调用前，把已消费的工具结果（即后面跟着一条 assistant 回复的那些）替换成一个简短标记：

```typescript
const agent: AgentConfig = {
  name: 'long-runner',
  model: 'claude-sonnet-4-6',
  // Enable with the default threshold (500 chars):
  compressToolResults: true,
  // Or only compress results longer than N characters:
  // compressToolResults: { minChars: 2000 },
}
```

| Value | 行为 |
|-------|-----------|
| `true` | 压缩长度超过 500 字符的结果（默认阈值） |
| `{ minChars: N }` | 压缩长度超过 N 字符的结果 |
| `false` / `undefined` | 禁用（默认） |

**说明：**
- 错误类工具结果永不压缩。
- 委派的 `tool_result` 块（来自 `delegate_to_agent`）豁免——父智能体始终保留子智能体的完整输出。
- 与 `contextStrategy` 协同工作；两者结合可获得最大的上下文余量。

## 截断工具输出

`maxToolOutputChars` 为某个智能体使用的每个工具限制原始输出长度。超过限制的输出会被截断成「头部 + 尾部」摘录，中间放一个标记。这发生在执行时、结果进入对话之前。

```typescript
const agent: AgentConfig = {
  name: 'long-runner',
  model: 'claude-sonnet-4-6',
  maxToolOutputChars: 10_000, // truncate any single tool output to 10 k chars
}
```

按工具设置的 `maxOutputChars`（设在 `ToolDefinition` 上）优先于智能体级的 `maxToolOutputChars`。

## 跨提供方保留推理

推理模型（OpenAI o 系列、DeepSeek reasoner、Anthropic 扩展思考、Gemini 思考摘要）会产出中间推理，框架将其提取为 `ReasoningBlock`，并带一个 `provenance` 字段标明产出它的适配器。默认情况下，只有带有效签名的同提供方块会被回传；其余的在出站转换时被静默丢弃，以免接收方模型拒绝一个未签名的思考块，或为了让 prompt 体积可预测。

`preserveReasoningAsText` 选择性启用一个 `<thinking>...</thinking>` 文本兜底：每当出站转换遇到一个目标适配器无法原生回传的推理块时，该块会被降级为行内文本，并拼接到下一条 assistant 消息前：

```typescript
const agent: AgentConfig = {
  name: 'cross-provider',
  model: 'gpt-5',
  provider: 'openai',
  // Enable text fallback for reasoning blocks the target adapter can't echo.
  preserveReasoningAsText: true,
  // Defaults to ON when preserveReasoningAsText is true; head+tail truncate
  // each block to 1200 chars. Override to tune, or set false to disable.
  // compressReasoningText: { minChars: 4000 },
}
```

兜底触发时：

| Source provenance | Target adapter capability | `preserveReasoningAsText: true` 下的行为 |
|---|---|---|
| 与目标匹配（`'anthropic'` → Anthropic）且有签名 | `'own-issued'` | 原生回传（不变） |
| 与目标匹配但无签名 | `'own-issued'` | 文本兜底 |
| 外来（如 `'openai'` → Anthropic） | `'own-issued'` | 文本兜底 |
| 在工具调用对话中与目标匹配（`'deepseek'` → DeepSeek） | `'tool-use-only'` | 原生 `reasoning_content` 回传（依 DeepSeek V4 规范，见 #251） |
| 与目标匹配但历史中任何位置都没有 `tool_use` | `'tool-use-only'` | 丢弃（DeepSeek 规范忽略非工具推理） |
| 外来（如 `'openai'` → DeepSeek） | `'tool-use-only'` | 文本兜底 |
| 与目标匹配（`'bedrock'` → Bedrock）且有签名或已脱敏 | `'own-issued'` | 经 `reasoningContent.{reasoningText,redactedContent}` 原生回传（见 #223） |
| 任意 | `'never'`（OpenAI、Azure、Copilot、AI SDK 等） | 文本兜底 |

被脱敏的推理（Anthropic 安全过滤）会产出占位符 `<thinking>[redacted]</thinking>`，用以表明发生过推理，同时不泄露那段不透明的负载。

**说明：**
- 默认禁用，以免静默膨胀 prompt token。
- 默认开启的截断（`compressReasoningText`）在长链式思考上是强制的安全措施；只在调试时才关闭。
- 某些本地 OpenAI 兼容模型可能把 `<thinking>` 文本重新输出到自己的 assistant 回复中，这可能触发循环检测器。失败模式与缓解办法见 [`examples/patterns/cross-provider-reasoning.ts`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cross-provider-reasoning.ts)。
- Bedrock 的 `capabilities.echoesReasoning === 'own-issued'`：带签名的推理块（`reasoningContent.reasoningText.signature`）和脱敏块（`reasoningContent.redactedContent`）在 `chat()` 和 `stream()` 上都能原生往返，入站提取与出站序列化两侧皆然（见 #223）。
- `'tool-use-only'`（DeepSeek V4）是唯一一种**无需**用户启用 `preserveReasoningAsText` 就能做同提供方回传的能力——它在内部被强制开启，因为 DeepSeek API 要求如此。
