// Integration-page data — the source for /integrations/<slug> and the
// /integrations hub. One dynamic template renders model providers and optional
// runtime adapters alike, mirroring the /compare and /solutions pairs.
//
// HONESTY DISCIPLINE (red-line §1). Every code snippet is grounded in the vendored
// reference docs, not invented: the OpenMultiAgent → createTeam → runTeam shape and
// AgentConfig come from getting-started/quick-start.md; provider identifiers come
// from reference/providers.md, while adapter APIs come from their versioned package
// docs and runnable examples. `code` is invariant (English) — it's code, not prose.
// Bilingual copy is co-located here; page chrome lives in the type-checked i18n dict.

import type { Loc } from './compare';

export type Integration = {
  slug: string;
  /** Hub grouping: cross-cutting runtime capability or model access. */
  kind: 'runtime' | 'provider';
  /** Display name, kept verbatim in every locale. */
  name: string;
  /** Compact, scannable qualifier shown on the integration hub card. */
  hubLabel: Loc;
  /** Target search terms — English, invariant. */
  keywords: string[];
  seoDescription: Loc;
  /** Hero H1. */
  title: Loc;
  /** Hero sub-line. */
  lede: Loc;
  /** A real, minimal team config for this provider (invariant — it's code). */
  code: string;
  /** How this integration fits open-multi-agent. Rendered set:html. */
  body: Loc;
  /** Integration-specific follow-up links. Providers use the shared defaults. */
  links?: readonly { href: string; label: Loc; external?: boolean }[];
  /** Optional evidence cards for integrations whose operating boundary matters. */
  sections?: readonly {
    eyebrow: Loc;
    title: Loc;
    intro?: Loc;
    items: readonly { title: Loc; body: Loc }[];
  }[];
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
    slug: 'opentelemetry',
    kind: 'runtime',
    name: 'OpenTelemetry',
    hubLabel: { en: 'Observability', zh: '可观测性' },
    keywords: ['open multi agent opentelemetry', 'typescript multi agent tracing', 'open telemetry ai agents', 'open multi agent run viewer'],
    seoDescription: {
      en: 'Export open-multi-agent TraceRecord v2 spans to an application-owned OpenTelemetry provider with @open-multi-agent/otel, while keeping the three-dependency core and an offline Run Viewer.',
      zh: '用 @open-multi-agent/otel 把 open-multi-agent 的 TraceRecord v2 span 导出到应用自有的 OpenTelemetry provider，同时保留三个依赖的 core 与离线 Run Viewer。',
    },
    title: { en: 'OpenTelemetry tracing for multi-agent runs', zh: '为多智能体运行接入 OpenTelemetry' },
    lede: { en: 'An optional first-party adapter from TraceRecord v2 to the provider your application already owns.', zh: '一个可选的一方适配器：把 TraceRecord v2 映射到你的应用已经持有的 provider。' },
    code: `import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'
import { createOtelTraceSink } from '@open-multi-agent/otel'

// npm install @open-multi-agent/core@^1.11.0 @open-multi-agent/otel@^0.1.0
// npm install @opentelemetry/api @opentelemetry/sdk-trace-base
// Set OPENAI_API_KEY in the environment for the demo team.
const exporter = new InMemorySpanExporter()
const provider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)],
})
const sink = createOtelTraceSink({ tracerProvider: provider })

${AGENTS}

const oma = new OpenMultiAgent({
  defaultProvider: 'openai',
  defaultModel: 'gpt-5.4-mini',
  observability: { sinks: [sink] },
})
const team = oma.createTeam('brief', { name: 'brief', agents })

try {
  await oma.runTeam(team, 'Summarize the latest release notes.')
  await sink.forceFlush({ timeoutMs: 1_000 })
  console.log(exporter.getFinishedSpans().length)
} finally {
  await sink.shutdown({ timeoutMs: 1_000 })
  await provider.shutdown()
}`,
    body: {
      en: '<code>@open-multi-agent/otel</code> is the optional first-party bridge for core v1.11.0 TraceRecord v2. <code>createOtelTraceSink()</code> maps one OMA span lifecycle to OpenTelemetry spans, including stable run IDs, task and tool relationships, token counts, cost metadata, retry fields, and compatible <code>gen_ai.*</code> attributes. Your application supplies and owns the tracer or provider; the adapter never installs a global provider and does not shut down a shared provider unless you explicitly opt in. The in-memory exporter above keeps the example runnable without a collector—replace it with the SDK and exporter your application already uses. Prompt, completion, tool payload, credential, and reasoning content are filtered by the adapter by default; treat all telemetry redaction as best-effort and apply your own sink policy before export.',
      zh: '<code>@open-multi-agent/otel</code> 是面向 core v1.11.0 TraceRecord v2 的可选一方桥接包。<code>createOtelTraceSink()</code> 把 OMA 的每段 span 生命周期映射为 OpenTelemetry span，保留稳定的运行 ID、任务与工具关系、token 计数、成本元数据、重试字段，以及兼容的 <code>gen_ai.*</code> 属性。tracer 或 provider 由你的应用提供并持有；适配器不会安装全局 provider，也不会关闭共享 provider，除非你显式开启。上面的内存 exporter 让示例无需 collector 也能运行——生产中请换成应用已经使用的 SDK 与 exporter。适配器默认过滤 prompt、completion、工具 payload、凭据与推理内容；所有遥测脱敏仍应视为尽力而为，导出前还要应用你自己的 sink 策略。',
    },
    links: [
      { href: '/reference/observability/', label: { en: 'Observability lifecycle and Run Viewer', zh: '可观测性生命周期与 Run Viewer' } },
      { href: '/compare/voltagent/', label: { en: 'Compare bundled vs optional OTel', zh: '对比内置与可选 OTel' } },
    ],
  },
  {
    slug: 'external-agents',
    kind: 'runtime',
    name: 'External agents (ACP)',
    hubLabel: { en: 'External execution', zh: '外部执行' },
    keywords: [
      'claude code multi agent',
      'agent client protocol typescript',
      'acp external agents',
      'claude code acp orchestration',
      'external coding agent node js',
    ],
    seoDescription: {
      en: 'Run external coding agents such as Claude Code inside an open-multi-agent task DAG over ACP. See the exact TypeScript config, permission boundary, token caveats, and lifecycle limits.',
      zh: '通过 ACP 把 Claude Code 等外部编码智能体放进 open-multi-agent 任务 DAG：查看准确的 TypeScript 配置、权限边界、token 注意事项与生命周期限制。',
    },
    title: { en: 'External coding agents inside one task DAG', zh: '把外部编码智能体放进同一张任务 DAG' },
    lede: {
      en: 'Use ACP or a local process as one team member, while OMA keeps ownership of planning, scheduling, shared memory, and failure propagation.',
      zh: '用 ACP 或本地进程接入一个团队成员，同时由 OMA 继续掌管规划、调度、共享记忆与失败传播。',
    },
    code: `import path from 'node:path'
import { OpenMultiAgent } from '@open-multi-agent/core'

// npm install @open-multi-agent/core@^1.11.0 @agentclientprotocol/sdk
// Set ANTHROPIC_API_KEY. Keep this directory narrower than your repository root.
const projectDir = path.resolve(
  process.env.OMA_ACP_PROJECT_DIR ?? './scratch-project',
)

const oma = new OpenMultiAgent({
  defaultProvider: 'anthropic',
  defaultModel: 'claude-sonnet-4-6',
})

const team = oma.createTeam('hybrid-audit', {
  name: 'hybrid-audit',
  agents: [
    {
      name: 'planner',
      systemPrompt: 'Plan a focused repository audit. Do not edit files.',
    },
    {
      name: 'repo-auditor',
      systemPrompt: 'Inspect the project and report evidence. Do not edit files.',
      backend: {
        kind: 'acp',
        command: 'npx',
        args: ['-y', '@agentclientprotocol/claude-agent-acp'],
        cwd: projectDir,
        // OMA defaults to 'auto-approve'. This example starts read-only instead.
        permission: ({ kind }) => kind === 'read',
      },
    },
    {
      name: 'reviewer',
      systemPrompt: 'Challenge the audit findings and summarize residual risk.',
    },
  ],
  sharedMemory: true,
})

const result = await oma.runTeam(
  team,
  'Audit the authentication module for error-handling gaps, then review the evidence.',
)

console.log(result.success, result.totalTokenUsage)`,
    body: {
      en: 'Set <code>AgentConfig.backend</code> instead of a model for the external member. <code>kind: \'acp\'</code> starts a long-lived Agent Client Protocol session; <code>kind: \'process\'</code> starts a generic command for each run and maps stdout, stderr, exit status, and cancellation into a normal agent result. ACP is an optional peer loaded only when used. OMA is the ACP <strong>client</strong>: it launches the configured subprocess, sends prompts, receives tool and usage updates, and folds the result into the same task DAG and shared memory as its LLM-backed agents. Claude Code does not speak ACP natively; the example uses the official <code>@agentclientprotocol/claude-agent-acp</code> adapter.',
      zh: '给外部成员设置 <code>AgentConfig.backend</code>，而不是模型。<code>kind: \'acp\'</code> 会启动一个长连接的 Agent Client Protocol 会话；<code>kind: \'process\'</code> 则为每次运行启动通用命令，并把 stdout、stderr、退出状态与取消映射成普通智能体结果。ACP 是仅在使用时才加载的可选 peer。OMA 扮演 ACP <strong>客户端</strong>：启动配置好的子进程、发送 prompt、接收工具与用量更新，再把结果并入与 LLM 智能体相同的任务 DAG 和共享记忆。Claude Code 本身不原生支持 ACP；示例使用官方 <code>@agentclientprotocol/claude-agent-acp</code> 适配器。',
    },
    links: [
      { href: '/reference/external-agents/', label: { en: 'Full external-agent API reference', zh: '外部智能体完整 API 参考' } },
      { href: '/compare/claude-dynamic-workflows/', label: { en: 'How this composes with Claude dynamic workflows', zh: '它如何与 Claude 动态工作流组合' } },
      {
        href: 'https://github.com/open-multi-agent/open-multi-agent/blob/v1.11.0/packages/core/examples/integrations/external-agent-acp.ts',
        label: { en: 'Inspect the runnable ACP example', zh: '查看可运行的 ACP 示例' },
        external: true,
      },
    ],
    sections: [
      {
        eyebrow: { en: 'ownership', zh: '职责边界' },
        title: { en: 'One DAG, two control loops.', zh: '一张 DAG，两层控制循环。' },
        intro: {
          en: 'OMA coordinates the run; the external agent remains an independent runtime with its own tools and context.',
          zh: 'OMA 协调整次运行；外部智能体仍是拥有自身工具与上下文的独立运行时。',
        },
        items: [
          {
            title: { en: 'OMA owns the workflow', zh: 'OMA 掌管工作流' },
            body: {
              en: 'The coordinator decomposes the goal, assigns the external member a task, schedules dependencies, shares upstream results, and cascades failure to dependent tasks.',
              zh: '协调器拆解目标、把任务分给外部成员、调度依赖、共享上游结果，并把失败级联到下游任务。',
            },
          },
          {
            title: { en: 'The external agent owns its loop', zh: '外部智能体掌管自身循环' },
            body: {
              en: 'Its CLI chooses tools, maintains its own session context, and performs work with the local process permissions you launched it with. OMA does not replace that runtime.',
              zh: '外部 CLI 自己选择工具、维护会话上下文，并以启动它的本地进程权限执行工作；OMA 不会替代这层运行时。',
            },
          },
          {
            title: { en: 'ACP normalizes the handoff', zh: 'ACP 统一交接' },
            body: {
              en: 'Text deltas, tool-call updates, stop reasons, cancellation, and reported usage become a normal OMA result, so hybrid teams do not need a separate scheduler.',
              zh: '文本增量、工具调用更新、停止原因、取消与上报用量都会变成普通 OMA 结果，因此混合团队不需要另写调度器。',
            },
          },
        ],
      },
      {
        eyebrow: { en: 'production boundary', zh: '生产边界' },
        title: { en: 'Permission prompts are not a sandbox.', zh: '权限提示不等于沙箱。' },
        intro: {
          en: 'Treat an ACP backend as a local subprocess you are deliberately authorizing—not as an isolated OMA tool.',
          zh: '应把 ACP backend 当作你明确授权的本地子进程，而不是被 OMA 隔离起来的工具。',
        },
        items: [
          {
            title: { en: 'Approval policy', zh: '审批策略' },
            body: {
              en: '<code>permission</code> defaults to <code>\'auto-approve\'</code>, preferring one-time approval when the agent offers it. Use <code>\'reject\'</code> or a callback for each deployment; the read-only callback above is a starting policy, not a universal one.',
              zh: '<code>permission</code> 默认是 <code>\'auto-approve\'</code>，且在智能体提供选项时优先选择单次批准。每次部署都应改用 <code>\'reject\'</code> 或回调；上面的只读回调是起点，不是通用策略。',
            },
          },
          {
            title: { en: 'Filesystem and secrets', zh: '文件系统与密钥' },
            body: {
              en: 'The subprocess accesses <code>cwd</code> directly; OMA does not proxy ACP file operations through its filesystem sandbox. Scope <code>cwd</code>, command, args, and inherited environment to the minimum needed. The process backend has no protocol permission prompts.',
              zh: '子进程直接访问 <code>cwd</code>；OMA 不会通过自身文件系统沙箱代理 ACP 文件操作。把 <code>cwd</code>、command、args 与继承的环境变量缩到最小。process backend 没有协议级权限提示。',
            },
          },
          {
            title: { en: 'Budget accounting', zh: '预算计量' },
            body: {
              en: 'ACP reports cumulative context tokens, not an input/output split. OMA converts readings into per-turn increments for <code>maxTokenBudget</code>; an agent that sends no usage update reports zero and is not token-gated. ACP cost is not wired into <code>maxCostBudget</code>.',
              zh: 'ACP 上报累计上下文 token，而非输入/输出拆分。OMA 把读数换算成逐回合增量供 <code>maxTokenBudget</code> 使用；不发送用量更新的智能体会报告零，也不会被 token 门控。ACP 成本尚未接入 <code>maxCostBudget</code>。',
            },
          },
          {
            title: { en: 'Protocol and lifecycle scope', zh: '协议与生命周期范围' },
            body: {
              en: 'OMA is client-only; it does not expose OMA agents to editors as ACP agents. Orchestrated ACP subprocesses live until process exit; use <code>createAcpBackend()</code> with <code>dispose()</code> when explicit teardown is required.',
              zh: 'OMA 目前只做客户端，不会把 OMA 智能体作为 ACP agent 暴露给编辑器。经编排启动的 ACP 子进程会存活到进程退出；需要显式清理时，使用 <code>createAcpBackend()</code> 与 <code>dispose()</code>。',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'anthropic',
    kind: 'provider',
    name: 'Anthropic (Claude)',
    hubLabel: { en: 'Native SDK', zh: '原生 SDK' },
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
    kind: 'provider',
    name: 'OpenAI (GPT)',
    hubLabel: { en: 'Default provider', zh: '默认提供方' },
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
    kind: 'provider',
    name: 'Google Gemini',
    hubLabel: { en: 'Optional SDK', zh: '可选 SDK' },
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
    kind: 'provider',
    name: 'DeepSeek',
    hubLabel: { en: 'Built-in', zh: '内置提供方' },
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
    kind: 'provider',
    name: 'AWS Bedrock',
    hubLabel: { en: 'AWS credentials', zh: 'AWS 凭据链' },
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
    kind: 'provider',
    name: 'Azure OpenAI',
    hubLabel: { en: 'Managed endpoint', zh: '托管端点' },
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
    kind: 'provider',
    name: 'Ollama (local)',
    hubLabel: { en: 'Local · No key', zh: '本地 · 无需密钥' },
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
    kind: 'provider',
    name: 'OpenAI-compatible endpoints',
    hubLabel: { en: 'Custom endpoint', zh: '自定义端点' },
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
