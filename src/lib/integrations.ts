// Provider-integration page data — the source for /integrations/<slug> and the
// /integrations hub. One dynamic template renders every entry, mirroring the
// /compare and /solutions pairs.
//
// HONESTY DISCIPLINE (red-line §1). Every code snippet is grounded in the vendored
// reference docs, not invented: the OpenMultiAgent → createTeam → runTeam shape and
// AgentConfig come from getting-started/quick-start.md; each provider's `provider`
// name, env var, example model, and baseURL come verbatim from reference/providers.md
// (itself synced from the framework repo). `code` is invariant (English) — it's code,
// not prose. Bilingual copy (en/zh) is co-located here; page chrome lives in the
// type-checked i18n dict. zh follows TRANSLATING.md; API identifiers stay verbatim.

import type { Loc } from './compare';

export type Integration = {
  slug: string;
  /** Display name, kept verbatim in every locale. */
  name: string;
  /** Target search terms — English, invariant. */
  keywords: string[];
  seoDescription: Loc;
  /** Hero H1. */
  title: Loc;
  /** Hero sub-line. */
  lede: Loc;
  /** A real, minimal team config for this provider (invariant — it's code). */
  code: string;
  /** How this provider fits open-multi-agent. Rendered set:html. */
  body: Loc;
};

// Shared minimal team used across the snippets, so the only thing that changes per
// provider is the OpenMultiAgent config + credential — which is exactly the point.
const AGENTS = `const agents: AgentConfig[] = [
  { name: 'researcher', systemPrompt: 'Gather the key facts.' },
  { name: 'writer', systemPrompt: 'Write a tight summary.' },
]`;
const RUN = `const team = oma.createTeam('brief', { name: 'brief', agents })
const result = await oma.runTeam(team, 'Summarize the latest release notes.')
console.log(result.success)`;
const HEAD = `import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'`;

export const INTEGRATIONS: Integration[] = [
  {
    slug: 'anthropic',
    name: 'Anthropic (Claude)',
    keywords: ['open-multi-agent anthropic', 'claude multi-agent typescript', 'anthropic agent orchestration', 'claude agent team node'],
    seoDescription: {
      en: 'Run a multi-agent team on Anthropic Claude in TypeScript with open-multi-agent — set ANTHROPIC_API_KEY, name the model, and mix Claude with other providers in one team.',
      zh: '用 open-multi-agent 在 TypeScript 里让多智能体团队跑在 Anthropic Claude 上——设好 ANTHROPIC_API_KEY、指定模型，还能在一个团队里把 Claude 与其它提供方混用。',
    },
    title: { en: 'Multi-agent teams on Anthropic Claude', zh: '在 Anthropic Claude 上跑多智能体团队' },
    lede: { en: 'Claude via the native Anthropic SDK — set one env var and name the model.', zh: '经原生 Anthropic SDK 使用 Claude——设一个环境变量、指定模型即可。' },
    code: `${HEAD}

${AGENTS}

// Set ANTHROPIC_API_KEY in the environment.
const oma = new OpenMultiAgent({ defaultProvider: 'anthropic', defaultModel: 'claude-sonnet-4-6' })
${RUN}`,
    body: {
      en: 'Anthropic is a built-in provider on the native Anthropic SDK. The agent config shape stays the same as every other provider — so you can give one agent Claude and another agent a different model, and they cooperate in a single run.',
      zh: 'Anthropic 是内置提供方，走原生 Anthropic SDK。智能体的配置形状与其它提供方完全一致——于是你可以让一个智能体用 Claude、另一个用别的模型，它们在同一次运行里协作。',
    },
  },
  {
    slug: 'openai',
    name: 'OpenAI (GPT)',
    keywords: ['open-multi-agent openai', 'gpt multi-agent typescript', 'openai agent orchestration', 'gpt agent team node'],
    seoDescription: {
      en: 'Run a multi-agent team on OpenAI GPT models in TypeScript with open-multi-agent — set OPENAI_API_KEY and orchestrate a goal into a parallel task DAG.',
      zh: '用 open-multi-agent 在 TypeScript 里让多智能体团队跑在 OpenAI GPT 上——设好 OPENAI_API_KEY，把一个目标编排成并行任务 DAG。',
    },
    title: { en: 'Multi-agent teams on OpenAI GPT', zh: '在 OpenAI GPT 上跑多智能体团队' },
    lede: { en: 'GPT models via the OpenAI API — the default provider, one env var away.', zh: '经 OpenAI API 使用 GPT——默认提供方，设一个环境变量即可。' },
    code: `${HEAD}

${AGENTS}

// Set OPENAI_API_KEY in the environment.
const oma = new OpenMultiAgent({ defaultProvider: 'openai', defaultModel: 'gpt-4o' })
${RUN}`,
    body: {
      en: 'OpenAI is the default provider. The same OpenAI adapter also reaches any OpenAI-compatible endpoint (Groq, OpenRouter, local servers) by setting a baseURL — see the dedicated integration.',
      zh: 'OpenAI 是默认提供方。同一个 OpenAI 适配器只要设 baseURL，也能对接任意兼容 OpenAI 的端点（Groq、OpenRouter、本地服务）——见专门的那一页集成。',
    },
  },
  {
    slug: 'gemini',
    name: 'Google Gemini',
    keywords: ['open-multi-agent gemini', 'gemini multi-agent typescript', 'google gemini agent orchestration', 'gemini agent team node'],
    seoDescription: {
      en: 'Run a multi-agent team on Google Gemini in TypeScript with open-multi-agent — set GEMINI_API_KEY, install @google/genai, and name the model.',
      zh: '用 open-multi-agent 在 TypeScript 里让多智能体团队跑在 Google Gemini 上——设好 GEMINI_API_KEY、装 @google/genai、指定模型。',
    },
    title: { en: 'Multi-agent teams on Google Gemini', zh: '在 Google Gemini 上跑多智能体团队' },
    lede: { en: 'Gemini via the native Google GenAI SDK — one extra install, one env var.', zh: '经原生 Google GenAI SDK 使用 Gemini——多装一个包、设一个环境变量。' },
    code: `${HEAD}

${AGENTS}

// npm install @google/genai — then set GEMINI_API_KEY in the environment.
const oma = new OpenMultiAgent({ defaultProvider: 'gemini', defaultModel: 'gemini-2.5-pro' })
${RUN}`,
    body: {
      en: 'Gemini is a built-in provider on the native Google GenAI SDK; it needs the peer dependency <code>@google/genai</code>. As with every provider, agents can mix Gemini with Claude, GPT, or a local model in one team.',
      zh: 'Gemini 是内置提供方，走原生 Google GenAI SDK；它需要 peer 依赖 <code>@google/genai</code>。和每个提供方一样，智能体可以在一个团队里把 Gemini 与 Claude、GPT 或本地模型混用。',
    },
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    keywords: ['open-multi-agent deepseek', 'deepseek multi-agent typescript', 'deepseek agent orchestration', 'deepseek agent team node'],
    seoDescription: {
      en: 'Run a multi-agent team on DeepSeek in TypeScript with open-multi-agent — a built-in, OpenAI-compatible provider; set DEEPSEEK_API_KEY and name the model.',
      zh: '用 open-multi-agent 在 TypeScript 里让多智能体团队跑在 DeepSeek 上——内置的、兼容 OpenAI 的提供方；设好 DEEPSEEK_API_KEY、指定模型。',
    },
    title: { en: 'Multi-agent teams on DeepSeek', zh: '在 DeepSeek 上跑多智能体团队' },
    lede: { en: 'DeepSeek as a built-in provider — OpenAI-compatible, one env var.', zh: 'DeepSeek 作为内置提供方——兼容 OpenAI，一个环境变量。' },
    code: `${HEAD}

${AGENTS}

// Set DEEPSEEK_API_KEY in the environment.
const oma = new OpenMultiAgent({ defaultProvider: 'deepseek', defaultModel: 'deepseek-v4-flash' })
${RUN}`,
    body: {
      en: 'DeepSeek ships as a built-in shortcut around its OpenAI-compatible endpoint, so the config is just the provider name and a key. It’s a common pick for the cheap, high-volume steps in a mixed-model team.',
      zh: 'DeepSeek 以内置快捷方式提供，包装其兼容 OpenAI 的端点，于是配置只是提供方名 + 一把 key。在混编模型团队里，它常被用在便宜、高频的步骤上。',
    },
  },
  {
    slug: 'bedrock',
    name: 'AWS Bedrock',
    keywords: ['open-multi-agent bedrock', 'aws bedrock multi-agent typescript', 'bedrock agent orchestration', 'bedrock claude agent team'],
    seoDescription: {
      en: 'Run a multi-agent team on AWS Bedrock in TypeScript with open-multi-agent — no API key (AWS credential chain), install the Bedrock runtime SDK, and name a Bedrock model.',
      zh: '用 open-multi-agent 在 TypeScript 里让多智能体团队跑在 AWS Bedrock 上——无需 API key（走 AWS 凭据链）、装 Bedrock runtime SDK、指定一个 Bedrock 模型。',
    },
    title: { en: 'Multi-agent teams on AWS Bedrock', zh: '在 AWS Bedrock 上跑多智能体团队' },
    lede: { en: 'Bedrock via the AWS SDK credential chain — no API key to manage.', zh: '经 AWS SDK 凭据链使用 Bedrock——无需管理 API key。' },
    code: `${HEAD}

${AGENTS}

// npm install @aws-sdk/client-bedrock-runtime — credentials come from the AWS
// credential chain (env vars, shared config, or IAM role). Set AWS_REGION.
const oma = new OpenMultiAgent({
  defaultProvider: 'bedrock',
  defaultModel: 'anthropic.claude-3-5-haiku-20241022-v1:0',
})
${RUN}`,
    body: {
      en: 'Bedrock is a built-in provider with no API key — credentials come from the standard AWS chain. It needs the peer dependency <code>@aws-sdk/client-bedrock-runtime</code>, and can serve Claude, Llama, Mistral, and Cohere models. Newer Claude models may require a cross-region inference profile prefix such as <code>us.</code>.',
      zh: 'Bedrock 是内置提供方，无需 API key——凭据走标准 AWS 链。它需要 peer 依赖 <code>@aws-sdk/client-bedrock-runtime</code>，可服务 Claude、Llama、Mistral 与 Cohere 模型。较新的 Claude 模型可能需要跨区域推理配置前缀，例如 <code>us.</code>。',
    },
  },
  {
    slug: 'azure-openai',
    name: 'Azure OpenAI',
    keywords: ['open-multi-agent azure openai', 'azure openai multi-agent typescript', 'azure agent orchestration', 'azure openai agent team'],
    seoDescription: {
      en: 'Run a multi-agent team on Azure OpenAI in TypeScript with open-multi-agent — set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT and name your deployment model.',
      zh: '用 open-multi-agent 在 TypeScript 里让多智能体团队跑在 Azure OpenAI 上——设好 AZURE_OPENAI_API_KEY 与 AZURE_OPENAI_ENDPOINT、指定你的部署模型。',
    },
    title: { en: 'Multi-agent teams on Azure OpenAI', zh: '在 Azure OpenAI 上跑多智能体团队' },
    lede: { en: 'Azure OpenAI as a built-in provider — two env vars for key and endpoint.', zh: 'Azure OpenAI 作为内置提供方——两个环境变量：key 与 endpoint。' },
    code: `${HEAD}

${AGENTS}

// Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT (optionally
// AZURE_OPENAI_API_VERSION and AZURE_OPENAI_DEPLOYMENT).
const oma = new OpenMultiAgent({ defaultProvider: 'azure-openai', defaultModel: 'gpt-4' })
${RUN}`,
    body: {
      en: 'Azure OpenAI is a built-in provider; it reads the key and endpoint from env, with optional API-version and deployment overrides. If your organization standardizes on Azure, agents run there while keeping the same team shape.',
      zh: 'Azure OpenAI 是内置提供方；它从环境变量读取 key 与 endpoint，可选覆盖 API 版本与部署名。如果你的组织统一用 Azure，智能体就跑在那里，团队形状保持不变。',
    },
  },
  {
    slug: 'ollama',
    name: 'Ollama (local)',
    keywords: ['open-multi-agent ollama', 'ollama multi-agent typescript', 'local llm agent team', 'private agents ollama'],
    seoDescription: {
      en: 'Run a fully local multi-agent team on Ollama in TypeScript with open-multi-agent — no API key, just point the base URL at your local Ollama server.',
      zh: '用 open-multi-agent 在 TypeScript 里跑一个完全本地的多智能体团队于 Ollama——无需 API key，把 base URL 指向你本地的 Ollama 服务即可。',
    },
    title: { en: 'A fully local multi-agent team on Ollama', zh: '在 Ollama 上跑完全本地的多智能体团队' },
    lede: { en: 'Ollama through the OpenAI-compatible endpoint — no key, no cloud, $0.', zh: '经兼容 OpenAI 的端点使用 Ollama——无 key、无云、$0。' },
    code: `${HEAD}

${AGENTS}

// Fully local — no API key. Requires \`ollama serve\` running.
const oma = new OpenMultiAgent({
  defaultProvider: 'openai',
  defaultModel: 'llama3.1',
  defaultBaseURL: 'http://localhost:11434/v1',
})
${RUN}`,
    body: {
      en: 'Ollama speaks the OpenAI-compatible API, so it’s reached with <code>provider: \'openai\'</code> and a local <code>baseURL</code> — no key needed. Tool-calling works with local tool-capable models (Gemma, Llama 3.1, Qwen 3, and others). See the <a href="/solutions/local-agents-ollama/">local team walkthrough</a> for a full setup.',
      zh: 'Ollama 讲兼容 OpenAI 的 API，所以用 <code>provider: \'openai\'</code> 加一个本地 <code>baseURL</code> 就能对接——无需 key。工具调用在本地支持工具的模型上可用（Gemma、Llama 3.1、Qwen 3 等）。完整搭建见<a href="/solutions/local-agents-ollama/">本地团队走查</a>。',
    },
  },
  {
    slug: 'openai-compatible',
    name: 'OpenAI-compatible endpoints',
    keywords: ['openai compatible agent framework', 'groq openrouter vllm agents', 'custom llm endpoint typescript', 'litellm multi-agent'],
    seoDescription: {
      en: 'Point open-multi-agent at any OpenAI-compatible endpoint in TypeScript — Groq, OpenRouter, vLLM, LM Studio, LiteLLM, and more — with provider: openai and a baseURL.',
      zh: '在 TypeScript 里把 open-multi-agent 指向任意兼容 OpenAI 的端点——Groq、OpenRouter、vLLM、LM Studio、LiteLLM 等——用 provider: openai 加一个 baseURL。',
    },
    title: { en: 'Any OpenAI-compatible endpoint', zh: '任意兼容 OpenAI 的端点' },
    lede: { en: 'Groq, OpenRouter, vLLM, LiteLLM, and more — one adapter, a baseURL.', zh: 'Groq、OpenRouter、vLLM、LiteLLM 等——一个适配器，一个 baseURL。' },
    code: `${HEAD}

${AGENTS}

// Any server that speaks OpenAI Chat Completions. Example: Groq.
// Set the service's key (here GROQ_API_KEY) and point baseURL at it.
const oma = new OpenMultiAgent({
  defaultProvider: 'openai',
  defaultModel: 'llama-3.3-70b-versatile',
  defaultBaseURL: 'https://api.groq.com/openai/v1',
})
${RUN}`,
    body: {
      en: 'Any server implementing the OpenAI Chat Completions API works with <code>provider: \'openai\'</code> and a <code>baseURL</code> — Groq, OpenRouter, vLLM, LM Studio, llama.cpp, Mistral, Qwen, Moonshot, or a LiteLLM proxy that unifies 100+ providers behind one endpoint. Pass the service’s key via <code>apiKey</code> when it isn’t <code>OPENAI_API_KEY</code>.',
      zh: '任何实现了 OpenAI Chat Completions API 的服务，都能用 <code>provider: \'openai\'</code> 加一个 <code>baseURL</code> 对接——Groq、OpenRouter、vLLM、LM Studio、llama.cpp、Mistral、Qwen、Moonshot，或一个把 100+ 提供方统一到单一端点后的 LiteLLM 代理。当 key 不是 <code>OPENAI_API_KEY</code> 时，通过 <code>apiKey</code> 显式传入。',
    },
  },
];

export const INTEGRATION_SLUGS: readonly string[] = INTEGRATIONS.map((i) => i.slug);

export function getIntegration(slug: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug);
}
