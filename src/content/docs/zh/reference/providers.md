---
title: "模型提供方"
description: "配置托管、云端与本地的模型提供方——内置快捷方式、OpenAI 兼容端点、环境变量与本地工具调用。"
---

`open-multi-agent` 在托管、云端与本地提供方之间保持智能体配置的形态一致。更改 `provider`、`model` 和相应的凭据；团队定义的其余部分保持不变。

```typescript
const agent = {
  name: 'my-agent',
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  systemPrompt: 'You are a helpful assistant.',
}
```

## 内置提供方快捷方式

框架为下列每一个都内置了对应的提供方名。设置 `provider` 和对应环境变量，适配器即会处理端点。

> 在底层，Anthropic、Gemini 和 Bedrock 使用各自专用的 API。其余内置快捷方式是对 OpenAI 兼容端点的预配置封装；与下方 OpenAI 兼容表格相同的线路格式，只是 `baseURL` 已预先配置好。

| Provider | Config | Env var | Example model | Notes |
|----------|--------|---------|---------------|-------|
| Anthropic (Claude) | `provider: 'anthropic'` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` | 原生 Anthropic SDK。 |
| Gemini | `provider: 'gemini'` | `GEMINI_API_KEY` | `gemini-2.5-pro` | 原生 Google GenAI SDK。需要 `npm install @google/genai`。 |
| OpenAI (GPT) | `provider: 'openai'` | `OPENAI_API_KEY` | `gpt-4o` | |
| Azure OpenAI | `provider: 'azure-openai'` | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` | `gpt-4` | 可选 `AZURE_OPENAI_API_VERSION`、`AZURE_OPENAI_DEPLOYMENT`。 |
| GitHub Copilot | `provider: 'copilot'` | `GITHUB_COPILOT_TOKEN`（回退到 `GITHUB_TOKEN`） | `gpt-4o` | 在 OpenAI 协议之上的自定义 token 交换流程。 |
| Grok (xAI) | `provider: 'grok'` | `XAI_API_KEY` | `grok-4` | OpenAI 兼容；端点为 `api.x.ai/v1`。 |
| DeepSeek | `provider: 'deepseek'` | `DEEPSEEK_API_KEY` | `deepseek-v4-flash` | OpenAI 兼容。`deepseek-v4-flash`（默认）或 `deepseek-v4-pro`（编程旗舰）；两者都支持 1M 上下文与 384K 最大输出。旧版 `deepseek-chat` / `deepseek-reasoner` 将于 2026-07-24 下线。 |
| Doubao (Volcengine) | `provider: 'doubao'` | `ARK_API_KEY` | `doubao-seed-1-8-251228` | OpenAI 兼容。字节跳动火山引擎 Ark 端点 `https://ark.cn-beijing.volces.com/api/v3`。见 [`providers/doubao`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/doubao.ts)。 |
| Hunyuan (Tencent MaaS / TokenHub) | `provider: 'hunyuan'` | `HUNYUAN_API_KEY` | `hy3-preview` | OpenAI 兼容。默认端点 `https://tokenhub.tencentmaas.com/v1`（腾讯当前平台；`sk-...` 密钥，Hunyuan 3 系列模型）。工具调用已在 `hy3-preview` 上验证。见 [`providers/hunyuan`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/hunyuan.ts)。 |
| Hunyuan (legacy Tencent Cloud) | `provider: 'hunyuan'` + `HUNYUAN_BASE_URL` | `HUNYUAN_API_KEY` | `hunyuan-turbos-latest` | 旧版端点 `https://api.hunyuan.cloud.tencent.com/v1`（console.cloud.tencent.com/hunyuan 密钥；独立的密钥命名空间）。腾讯已宣布该平台即将下线（2026-06-30 停售，2026-09-30 全面关停）。在此之前可设置 `HUNYUAN_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1` 指向它。工具调用已在 `hunyuan-turbos` 和 `hunyuan-functioncall` 上验证。 |
| MiniMax (global) | `provider: 'minimax'` | `MINIMAX_API_KEY` | `MiniMax-M3` | OpenAI 兼容。 |
| MiniMax (China) | `provider: 'minimax'` + `MINIMAX_BASE_URL` | `MINIMAX_API_KEY` | `MiniMax-M3` | 设置 `MINIMAX_BASE_URL=https://api.minimaxi.com/v1`。 |
| MiMo | `provider: 'mimo'` | `MIMO_API_KEY`（+ 可选 `MIMO_BASE_URL`） | `mimo-v2.5-pro` | OpenAI 兼容。默认使用按量付费端点 `https://api.xiaomimimo.com/v1`；Token Plan 密钥（`tp-...`）需要订阅页面提供的集群 base URL，例如 `https://token-plan-cn.xiaomimimo.com/v1`。通过内置的 MiMo 适配器支持推理 / 工具调用循环。见 [`providers/mimo`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/mimo.ts)。 |
| Qiniu | `provider: 'qiniu'` | `QINIU_API_KEY` | `deepseek-v3` | OpenAI 兼容。端点 `https://api.qnaigc.com/v1`；多个模型系列，见 [Qiniu AI docs](https://developer.qiniu.com/aitokenapi/12882/ai-inference-api)。 |
| AWS Bedrock | `provider: 'bedrock'` | 无（AWS SDK 凭据链） | `anthropic.claude-3-5-haiku-20241022-v1:0` | 无 API 密钥。设置 `AWS_REGION`，或把 `region` 作为第 4 个参数传给 `createAdapter`。凭据来自环境变量、共享配置或 IAM 角色。较新的 Claude 模型可能需要跨区域推理配置前缀，如 `us.`。同时支持 Llama、Mistral 和 Cohere。见 [`providers/bedrock`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/bedrock.ts)。需要 `npm install @aws-sdk/client-bedrock-runtime`。 |

## OpenAI 兼容提供方

当一个服务端支持 OpenAI Chat Completions 时，不需要任何捆绑的快捷方式。使用 `provider: 'openai'` 并把 `baseURL` 指向该服务。

| Service | Config | Env var | Example model | Notes |
|---------|--------|---------|---------------|-------|
| Ollama (local) | `provider: 'openai'` + `baseURL: 'http://localhost:11434/v1'` | none | `llama3.1` | |
| vLLM (local) | `provider: 'openai'` + `baseURL` | none | server-loaded | |
| LM Studio (local) | `provider: 'openai'` + `baseURL` | none | server-loaded | |
| llama.cpp server (local) | `provider: 'openai'` + `baseURL` | none | server-loaded | |
| OpenRouter | `provider: 'openai'` + `baseURL: 'https://openrouter.ai/api/v1'` + `apiKey` | `OPENROUTER_API_KEY` | `openai/gpt-4o-mini` | |
| Groq | `provider: 'openai'` + `baseURL: 'https://api.groq.com/openai/v1'` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | |
| Mistral | `provider: 'openai'` + `baseURL: 'https://api.mistral.ai/v1'` | `MISTRAL_API_KEY` | `mistral-large-latest` | 见 [`providers/mistral`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/mistral.ts)。 |
| MiMo | `provider: 'openai'` + `baseURL: 'https://api.xiaomimimo.com/v1'` | `MIMO_API_KEY` | `mimo-v2.5-pro` | 在使用工具调用的智能体循环时，优先选用内置的 `mimo` 提供方。Token Plan 用户应设置自己的 `token-plan-*.xiaomimimo.com/v1` base URL。 |
| Zhipu GLM | `provider: 'openai'` + `baseURL: 'https://open.bigmodel.cn/api/paas/v4'` | `ZHIPU_API_KEY` | `glm-4-plus` | 见 [`providers/zhipu`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/zhipu.ts)。 |
| Qwen (DashScope) | `provider: 'openai'` + `baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'` | `DASHSCOPE_API_KEY` | `qwen-plus` | 见 [`providers/qwen`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/qwen.ts)。 |
| Moonshot AI (Kimi) | `provider: 'openai'` + `baseURL: 'https://api.moonshot.ai/v1'` | `MOONSHOT_API_KEY` | `kimi-k2.5` | 见 [`providers/moonshot`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/moonshot.ts)。 |
| LiteLLM (proxy) | `provider: 'openai'` + `baseURL: 'http://localhost:4000/v1'` + `apiKey` | `LITELLM_API_KEY`（若代理启用了鉴权） | 代理上的任意模型 | [LiteLLM](https://github.com/BerriAI/litellm) 把 100+ 提供方（OpenAI、Anthropic、Azure、Bedrock、Vertex 等）统一到一个 OpenAI 兼容端点之后。运行 `litellm --config config.yaml` 并把 `baseURL` 指向该代理。 |

其他服务只要实现了 OpenAI Chat Completions API，也能以同样方式接入，但这里未把它们列为已验证的提供方。对于密钥不是 `OPENAI_API_KEY` 的服务，通过 `apiKey` 显式传入；否则 `openai` 适配器会回退到 `OPENAI_API_KEY`。

## Vercel AI SDK（可选）

AI SDK 桥接器让智能体通过[任意 AI SDK 提供方](https://ai-sdk.dev/providers)运行，而不是使用内置的 `provider` 工厂。使用 `npm i ai @ai-sdk/<provider>` 安装可选 peer；peer 版本范围接受 AI SDK 5、6 和 7，AI SDK 7 要求 Node.js >= 22。

在 `AgentConfig` 上传入 `adapter: new AISdkAdapter(model)`。设置 `adapter` 后，该智能体会忽略 `provider`、`apiKey`、`baseURL` 和 `region`。混合团队仍照常工作：只有带 `adapter` 的智能体使用 AI SDK。

```typescript
import { openai } from '@ai-sdk/openai'
import { AISdkAdapter } from '@open-multi-agent/core/ai-sdk'
import { OpenMultiAgent } from '@open-multi-agent/core'

const oma = new OpenMultiAgent()
await oma.runAgent(
  {
    name: 'researcher',
    model: 'gpt-4o',
    adapter: new AISdkAdapter(openai('gpt-4o')),
    systemPrompt: 'You are a researcher.',
  },
  'What are the latest AI trends?',
)
```

协调器通过 `runTeam(team, goal, { coordinator: { adapter: new AISdkAdapter(...) } })` 接受同一个钩子。完整应用见 [`integrations/with-vercel-ai-sdk`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/integrations/with-vercel-ai-sdk/)。

## 扩展思考 / 推理

`AgentConfig` 上的一份 `thinking` 配置会映射到各提供方的原生推理设置：

```typescript
const agent = {
  name: 'deep-reasoner',
  provider: 'anthropic',
  model: 'claude-opus-4-6',
  systemPrompt: 'Reason carefully before answering.',
  thinking: { enabled: true, budgetTokens: 8_000 },
}
```

- `budgetTokens` 映射到 Anthropic 的 `thinking.budget_tokens` 和 Gemini 的 `thinkingConfig.thinkingBudget`。
- `effort`（`'low' | 'medium' | 'high'`）映射到 OpenAI 的 `reasoning_effort`。固定版本 SDK 的 union 尚未声明的值（例如 `'minimal'` 或 `'none'`）可通过 `extraBody: { reasoning_effort: '<value>' }` 传入。
- 适配器会忽略无法识别的字段，因此同一份配置可安全用于混合提供方团队。

推理以 `reasoning` 事件流式传输。跨提供方切换时保留推理需通过 `preserveReasoningAsText` 选择启用；参见[上下文管理](/zh/reference/context-management/)和 [`patterns/cross-provider-reasoning`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/patterns/cross-provider-reasoning.ts)。

## 本地模型工具调用

框架支持对由 Ollama、vLLM、LM Studio 或 llama.cpp 提供服务的本地模型进行工具调用。工具调用通过 OpenAI 兼容 API 原生处理。

已验证的本地模型包括 Gemma 4、Llama 3.1、Qwen 3、Mistral 和 Phi-4。Ollama 在 [ollama.com/search?c=tools](https://ollama.com/search?c=tools) 发布其支持工具的模型。

如果某个本地模型把工具调用以文本形式返回，而非 `tool_calls` 线路格式，框架会自动从文本输出中提取它们。这对思考型模型或配置不当的本地服务端有帮助。

对慢速的本地推理，在 `AgentConfig` 上使用 `timeoutMs`：

```typescript
const localAgent = {
  name: 'local',
  model: 'llama3.1',
  provider: 'openai',
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  tools: ['bash', 'file_read'],
  timeoutMs: 120_000,
}
```

在消费级硬件上高度量化的 MoE 模型，在默认采样下可能陷入重复循环或臆造工具调用 schema。`AgentConfig` 暴露了 `topK`、`minP`、`frequencyPenalty`、`presencePenalty`、`parallelToolCalls` 和 `extraBody`，用于服务端专属的参数，如 vLLM 的 `repetition_penalty`。完整配置见 [`providers/local-quantized`](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/examples/providers/local-quantized.ts)。

## 故障排查

- 模型不调用工具？确认它出现在 Ollama 的 [Tools category](https://ollama.com/search?c=tools) 中。
- 正在使用 Ollama？用 `ollama update` 更新到最新版本。
- 代理干扰本地服务端？使用 `no_proxy=localhost`。
