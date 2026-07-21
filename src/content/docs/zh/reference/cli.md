---
title: "CLI"
description: "JSON 优先的 oma 二进制命令——面向 shell 与 CI：命令、配置文件、输出与退出码。"
---

这个包附带一个小巧的二进制 **`oma`**，它把 TypeScript API 的同一批原语暴露出来：`runTeam`、`runTasks`、离线 EvalSet 执行、单次运行的仪表盘导出，外加一份静态的 provider 参考。它面向 **shell 脚本和 CI**（stdout 输出 JSON、退出码稳定）。

它**不**提供交互式 REPL、向工具注入工作目录、人工审批闸门或会话持久化。这些留在应用代码中。

## 安装与调用

安装好这个包后，用 `npx` 或本地 `node_modules/.bin` 时二进制就在 `PATH` 上：

```bash
npm install @open-multi-agent/core
npx oma help
```

如果是从仓库的克隆运行，需要先构建：

```bash
npm run build
node packages/core/dist/cli/oma.js help
```

在环境中设置好常用的 provider API 密钥（见 [README](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/README.md#quick-start)）；CLI 不从命令行参数读取密钥。MiniMax 还会读 `MINIMAX_BASE_URL` 来选择全球（`https://api.minimax.io/v1`）或中国（`https://api.minimaxi.com/v1`）端点。MiMo 还会读 `MIMO_BASE_URL` 来指定 Token Plan 集群端点，例如 `https://token-plan-cn.xiaomimimo.com/v1`。

OpenRouter 通过 OpenAI 兼容适配器工作：把 `provider` 设为 `openai`、`baseURL` 设为 `https://openrouter.ai/api/v1`，并把 `OPENROUTER_API_KEY` 作为 agent 或 orchestrator 的 `apiKey` 传入。

---

## 命令

### `oma run`

运行 **`OpenMultiAgent.runTeam(team, goal)`**：协调器拆解、任务队列、可选的综合。

带 `--dashboard` 调用时，CLI 除了任何已配置的 sink 之外，还会为该次运行捕获结构化追踪记录，把它们与精确的 `TeamRunResult` 组合起来，并把一个静态的 Run Viewer 写到 `oma-dashboards/runTeam-<timestamp>.html`。生成的页面包含任务 DAG、层级感知的 span 瀑布图、筛选器，以及安全的证据详情。

仪表盘路径会打印到 stderr。stdout 上正常的运行 JSON 和退出状态不变。如果追踪捕获无法落地，CLI 会在 stderr 上输出 `DASHBOARD_TRACE_CAPTURE_FAILED`，并回退到只含结果的 Viewer。渲染或写入失败会用 `DASHBOARD_RENDER_FAILED` 或 `DASHBOARD_WRITE_FAILED`，且不会改变已完成的运行结果。

仪表盘页面是自包含的：它不加载远程脚本、样式表或字体，且嵌入的运行载荷中看起来敏感的值会在渲染前被脱敏。

| Argument | Required | Description |
|----------|----------|-------------|
| `--goal` | Yes | 传给团队运行的自然语言目标。 |
| `--team` | Yes | JSON 文件路径（见 [Team 文件](#team-文件)）。 |
| `--orchestrator` | No | JSON 文件路径，在团队文件里的 orchestrator 片段之后合并进 `new OpenMultiAgent(...)`。 |
| `--coordinator` | No | JSON 文件路径，作为 `runTeam(..., { coordinator })` 传入（`CoordinatorConfig`）。 |
| `--dashboard` | No | 把执行后的 Run Viewer HTML 写到 `oma-dashboards/runTeam-<timestamp>.html`；输出路径和任何仅与仪表盘相关的警告都会输出到 stderr。 |

全局标志：[`--pretty`](#输出标志)、[`--include-messages`](#输出标志)。

### `oma dashboard`

导出恰好一个已存在的 `FileTraceStore` 运行，期间不调用任何模型、协调器、agent、工具或 OpenTelemetry provider：

```bash
oma dashboard \
  --trace-store ./.oma/traces.ndjson \
  --run-id <runId> \
  [--output ./oma-dashboards/run.html] \
  [--pretty]
```

`--trace-store` 和 `--run-id` 是必填的。源文件必须已经存在。该命令会按文档所述的 `FileTraceStore` 恢复规则打开它，读取一个运行及其记录，渲染 Viewer，并在成功和失败时都关闭该存储。它不会追加、删除、压缩或应用保留策略。

不带 `--output` 时，CLI 会在 `oma-dashboards/` 下创建一个带时间戳的文件。显式指定的目标绝不会被覆盖：文件已存在时会返回 `dashboard_output_exists`，退出码为 2。

### `oma task`

用一份固定的任务清单运行 **`OpenMultiAgent.runTasks(team, tasks)`**（不做协调器拆解）。

| Argument | Required | Description |
|----------|----------|-------------|
| `--file` | Yes | [tasks 文件](#tasks-文件)的路径。 |
| `--team` | No | JSON `TeamConfig` 的路径。设置后会覆盖 `--file` 里的 `team` 对象。 |

全局标志：[`--pretty`](#输出标志)、[`--include-messages`](#输出标志)。

### `oma eval run`

用用户提供的目标运行一个版本化 EvalSet，写出一份或多份离线报告，并可选择应用质量闸门：

```bash
oma eval run --set ./evals/greetings.json --target ./evals/target.mjs \
  [--scorers ./evals/scorers.mjs] \
  [--repeats 3] [--concurrency 2] [--tags smoke,regression] \
  [--report json] [--report markdown] [--report junit] \
  [--out ./eval-results] [--meta prompt_version=v2] \
  [--gate ./evals/gate.json] [--baseline ./evals/baseline.json] [--pretty]
```

`--set` 和 `--target` 是必填的。EvalSet 文件按 JSON 解析，并使用与 TypeScript API 相同的 `defineEvalSet()` 契约校验。`--repeats`、`--concurrency` 和 `--tags` 会覆盖对应的 runner 选项。重复传入 `--meta key=value`，可为每条记录附加字符串元数据。

目标路径会作为 ES 模块动态导入。其默认导出可以是一个 `EvalTarget` 函数，也可以是包含 `{ target, scorers? }` 的对象：

```js
const target = async (input) => ({ output: String(input).toUpperCase() })

const exact = {
  name: 'exact',
  score({ output, evalCase }) {
    const pass = output === evalCase.expected
    return { score: pass ? 1 : 0, pass }
  },
}

export default { target, scorers: [exact] }
```

设置 `--scorers` 时，该 ES 模块必须默认导出一个 `Scorer[]`。显式 scorer 会追加到所有内嵌 scorer 之后。每个 scorer 名称必须唯一，没有 scorer 的评估属于用法错误。动态导入会以当前进程权限执行所提供的模块；只加载你信任的代码。CLI 不会对目标或 scorer 模块进行沙箱隔离。

可以在任一模块中从 `@open-multi-agent/core/eval` 导入 `toolCallSuccessScorer()`、`costBudgetScorer()`、`createAnswerRelevancyScorer()` 等参考工厂。请为自定义 scorer 和 judge scorer 设置版本，使基线漂移警告保持可操作性。

重复传入 `--report`，可请求 `json`、`markdown` 和 `junit` 的任意组合；默认为 JSON。输出根目录默认为 `./eval-results`。每次调用都会写入 `<out>/<evalRunId>/`，对应使用 `report.json`、`report.md` 和 `report.junit.xml`。JSON 是权威的 `EvalRunReport` 表示。Markdown 包含便于阅读的聚合结果与失败详情。JUnit 会把 `pass: false` 映射为 `<failure>`，把目标/scorer 错误映射为 `<error>`。

不带 `--gate` 的已完成评估即使包含低分或失败分数，也会以 0 退出。带 `--gate` 时，CLI 会加载经过校验的 `GatePolicy`，应用阈值、scorer/目标健康度和可选的基线回归检查，在 stdout 摘要中加入 `verdict` 与 `verdictPath`，并把原样 verdict 写入 `<out>/<evalRunId>/verdict.json`。闸门失败或所有选中目标都失败时以 1 退出。文件、模块、参数和契约错误以 2 退出。

`--baseline` 加载先前的 JSON `EvalRunReport`，且要求同时设置 `--gate`。策略含基线规则但未设置 `--baseline` 时，仍会执行阈值和健康度检查，随后报告跳过回归检查的警告。

### `oma eval gate`

把闸门应用到已有的权威 JSON 报告，而不重新运行目标：

```bash
oma eval gate --report ./candidate/report.json --gate ./evals/gate.json \
  [--baseline ./evals/baseline.json] [--pretty]
```

`--report` 和 `--gate` 是必填的。该命令向 stdout 打印原样的 `GateVerdict` JSON（`pass`、`failures` 和 `warnings`）。verdict 通过时以 0 退出，失败时以 1 退出；报告、策略、基线或参数无效时以 2 退出。GatePolicy 参考、基线工作流、确定性闸门示例和 GitHub Actions 接入方式见[评估](/zh/reference/evaluation/#在-ci-中设置质量闸门)。

### `oma provider`

只读辅助命令，用于接入 JSON 配置和环境变量。

- **`oma provider`** 或 **`oma provider list`** —— 打印 JSON：内置 provider id、API 密钥的环境变量名、是否支持 `baseURL`，以及简短说明（例如 OpenAI 兼容服务器、CI 里的 Copilot）。
- **`oma provider template <provider>`** —— 打印一个 JSON 对象，含示例 `orchestrator` 和 `agent` 字段，以及占位的 `env` 条目。`<provider>` 是以下之一：`anthropic`、`azure-openai`、`openai`、`gemini`、`grok`、`minimax`、`mimo`、`deepseek`、`doubao`、`qiniu`、`copilot`、`bedrock`。

对于 OpenRouter，使用 `openai` 的 provider 模板，把 `baseURL` 设为 `https://openrouter.ai/api/v1`，并在你的 JSON 配置里从 `OPENROUTER_API_KEY` 设置 `apiKey`。

支持 `--pretty`。

### `oma`、`oma help`、`oma -h`、`oma --help`

把用法文本打印到 stdout，并以 **0** 退出。

---

## 配置文件

文件结构与库类型 `TeamConfig`、`OrchestratorConfig`、`CoordinatorConfig` 以及 `runTasks()` 接受的任务对象一致。

### Team 文件

与 **`oma run --team`**（以及可选的 **`oma task --team`**）配合使用。

**方案 A —— 纯 `TeamConfig`**

```json
{
  "name": "api-team",
  "agents": [
    {
      "name": "architect",
      "model": "claude-sonnet-4-6",
      "provider": "anthropic",
      "systemPrompt": "You design APIs.",
      "tools": ["file_read", "file_write"],
      "maxTurns": 6
    }
  ],
  "sharedMemory": true
}
```

**方案 B —— 团队加上默认的 orchestrator 设置**

```json
{
  "team": {
    "name": "api-team",
    "agents": [{ "name": "worker", "model": "claude-sonnet-4-6", "systemPrompt": "…" }]
  },
  "orchestrator": {
    "defaultModel": "claude-sonnet-4-6",
    "defaultProvider": "anthropic",
    "maxConcurrency": 3
  }
}
```

CLI 强制执行的校验规则：

- 根（或 `team`）必须是一个对象。
- `team.name` 是非空字符串。
- `team.agents` 是非空数组；每个 agent 必须有非空的 `name` 和 `model`。

其他字段都会像在 TypeScript 中一样透传给库。

**仅 SDK 可用的字段**：`sharedMemoryStore`（自定义 `MemoryStore` 实例）无法从 JSON 设置，因为它是运行时对象。默认的内存存储用 `sharedMemory: true`，或在 TypeScript 中通过 `orchestrator.createTeam()` 接入自定义存储。

### Tasks 文件

与 **`oma task --file`** 配合使用。

```json
{
  "orchestrator": {
    "defaultModel": "claude-sonnet-4-6"
  },
  "team": {
    "name": "pipeline",
    "agents": [
      { "name": "designer", "model": "claude-sonnet-4-6", "systemPrompt": "…" },
      { "name": "builder", "model": "claude-sonnet-4-6", "systemPrompt": "…" }
    ],
    "sharedMemory": true
  },
  "tasks": [
    {
      "title": "Design",
      "description": "Produce a short spec for the feature.",
      "assignee": "designer"
    },
    {
      "title": "Implement",
      "description": "Implement from the design.",
      "assignee": "builder",
      "dependsOn": ["Design"]
    }
  ]
}
```

- **`dependsOn`** —— 任务标题（不是内部 id），与库中协调器输出的约定一致。
- 可选的每任务字段：`memoryScope`（`"dependencies"` \| `"all"`）、`maxRetries`、`retryDelayMs`、`retryBackoff`。启用重试（`maxRetries > 0`）时，退避会加抖动，且可证明是终态的失败——除 408/409/429 之外的 4xx 客户端错误，加上 token 预算和无效消息错误——会自动跳过重试；无需额外配置。
- **`tasks`** 必须是非空数组；每一项需要字符串 `title` 和 `description`。

如果传了 **`--team path.json`**，文件顶层的 `team` 属性会被忽略，改用外部文件（当同一份团队定义在多个 pipeline 文件间共享时很有用）。

### Orchestrator 与 coordinator JSON

这些文件是任意 JSON 对象，分别合并进 **`OrchestratorConfig`** 和 **`CoordinatorConfig`**。函数值的选项（`onProgress`、`onApproval` 等）无法出现在 JSON 中，CLI 也不支持。

在 orchestrator JSON 上设 `defaultCwd`，或在单个 agent/coordinator JSON 上设 `cwd`，来选择内置文件系统工具的沙箱根目录。传给 `file_read`、`file_write`、`file_edit`、`grep` 和 `glob` 的路径必须是绝对路径，并解析到该根目录内部。省略 `defaultCwd` 时，沙箱默认为 `<cwd>/.agent-workspace`（首次写入时自动创建）。传入等价于 `"<process.cwd()>"` 的绝对路径可把它放宽到整个工作目录，或传 `null` 来禁用沙箱。`bash` 工具有意未被覆盖——理由和推荐做法见 `docs/tool-configuration.md`。

---

## 输出

### Stdout

每次调用都会向 stdout 打印**一个 JSON 文档**，后跟一个换行符。

**成功的 `run` / `task`**

```json
{
  "command": "run",
  "success": true,
  "goal": "Build a REST API with token auth",
  "tasks": [
    {
      "id": "task-1",
      "title": "Design the database schema",
      "assignee": "architect",
      "status": "completed",
      "dependsOn": []
    }
  ],
  "totalTokenUsage": { "input_tokens": 0, "output_tokens": 0 },
  "agentResults": {
    "architect": {
      "success": true,
      "output": "…",
      "tokenUsage": { "input_tokens": 0, "output_tokens": 0 },
      "toolCalls": [],
      "structured": null,
      "loopDetected": false,
      "budgetExceeded": false
    }
  }
}
```

`agentResults` 的键是 agent 名。当一个 agent 运行了多个任务时，库会合并结果；CLI 镜像合并后的 `AgentRunResult` 字段。

**成功的历史仪表盘导出**

```json
{
  "command": "dashboard",
  "runId": "run-01",
  "dashboard": "/absolute/path/to/oma-dashboards/run-2026-07-18.html"
}
```

**成功的离线评估**

```json
{
  "command": "eval",
  "subcommand": "run",
  "evalRunId": "eval_run_...",
  "caseCount": 2,
  "repeats": 1,
  "targetErrors": 0,
  "scorers": [
    { "name": "exact", "avg": 1, "passRate": 1, "errorCount": 0 }
  ],
  "reports": {
    "json": "/workspace/eval-results/eval_run_.../report.json"
  }
}
```

**错误（usage、validation、I/O、runtime）**

```json
{
  "error": {
    "kind": "usage",
    "message": "--goal and --team are required"
  }
}
```

对于现有命令，`kind` 仍然是 `usage`、`validation`、`io`、`runtime` 或 `internal` 之一。仪表盘导出还会使用稳定的分类，例如 `trace_store_not_found`、`run_not_found`、`dashboard_output_exists`、`trace_store_close_failed`，以及小写的 `FileTraceStoreError` 代码（例如 `corrupt_file`）。错误消息绝不包含追踪载荷。

### 输出标志

| Flag | Effect |
|------|--------|
| `--pretty` | 带缩进美化打印 JSON。 |
| `--include-messages` | 在 `agentResults` 中包含每个 agent 完整的 `messages` 数组。长时间运行时**非常大**；默认省略。 |

仪表盘路径和仅与仪表盘相关的诊断信息会输出到 stderr。没有单独的进度流；需要实时遥测时，用 TypeScript API 配合 `onProgress` 或 `observability.sinks`。

---

## 退出码

| Code | Meaning |
|------|---------|
| **0** | 成功：`run`/`task` 成功；仪表盘导出完成；eval 已完成且并非所有目标都失败，任何已配置闸门也已通过；或 help / `provider` 正常完成。未配置闸门时，eval 低分本身仍以 0 退出。 |
| **1** | `run`/`task` 报告失败、所有选中的 eval 目标调用都失败，或 eval 闸门失败。 |
| **2** | usage、validation、可读的 JSON 错误、模块加载错误，或文件访问问题（例如文件缺失）。 |
| **3** | 意外错误，包括以抛出错误形式暴露的典型 LLM/API 失败。 |

在脚本里：

```bash
npx oma run --goal "Summarize README" --team team.json > result.json
code=$?
case $code in
  0) echo "OK" ;;
  1) echo "Run reported failure — inspect result.json" ;;
  2) echo "Bad inputs or files" ;;
  3) echo "Crash or API error" ;;
esac
```

---

## 参数解析

- 只有长选项：`--goal`、`--team`、`--file` 等。
- 值可以用 `=` 附带：`--team=./team.json`。
- `oma eval run` 接受重复的 `--report` 和 `--meta` 选项，可以使用附加值或分开的值。闸门、基线和报告文件选项各接受一个路径。
- 布尔式标志（`--pretty`、`--include-messages`）不取值；如果下一个 token 不以 `--` 开头，它会被当作前一个选项的值（标准的 `getopt` 风格配对）。

---

## 限制（出于设计）

- 没有 TTY 会话、历史，或从 `stdin` 输入目标。
- 没有专门的标志来设置文件系统沙箱根目录；通过 orchestrator 或 agent JSON 中的 `defaultCwd` / `cwd` 来配置。
- JSON 里没有 **`onApproval`**；仅支持非交互式批处理。
- 协调器 **`runTeam`** 路径和其它任何运行一样，仍然需要网络和 API 密钥。
