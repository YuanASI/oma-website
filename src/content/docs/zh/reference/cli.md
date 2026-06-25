---
title: "CLI"
description: "JSON 优先的 oma 二进制命令——面向 shell 与 CI：命令、配置文件、输出与退出码。"
---

这个包附带一个小巧的二进制 **`oma`**，它把 TypeScript API 的同一批原语暴露出来：`runTeam`、`runTasks`，外加一份静态的 provider 参考。它面向 **shell 脚本和 CI**（stdout 输出 JSON、退出码稳定）。

它**不**提供交互式 REPL、向工具注入工作目录、人工审批闸门或会话持久化。这些留在应用代码里。

## 安装与调用

装好这个包后，用 `npx` 或本地 `node_modules/.bin` 时二进制就在 `PATH` 上：

```bash
npm install @open-multi-agent/core
npx oma help
```

如果是从仓库的克隆运行，需要先构建：

```bash
npm run build
node packages/core/dist/cli/oma.js help
```

在环境里设好常用的 provider API 密钥（见 [README](https://github.com/open-multi-agent/open-multi-agent/blob/main/packages/core/README.md#quick-start)）；CLI 不从命令行参数读取密钥。MiniMax 还会读 `MINIMAX_BASE_URL` 来选择全球（`https://api.minimax.io/v1`）或中国（`https://api.minimaxi.com/v1`）端点。MiMo 还会读 `MIMO_BASE_URL` 来指定 Token Plan 集群端点，例如 `https://token-plan-cn.xiaomimimo.com/v1`。

OpenRouter 通过 OpenAI 兼容适配器工作：把 `provider` 设为 `openai`、`baseURL` 设为 `https://openrouter.ai/api/v1`，并把 `OPENROUTER_API_KEY` 作为 agent 或 orchestrator 的 `apiKey` 传入。

---

## 命令

### `oma run`

运行 **`OpenMultiAgent.runTeam(team, goal)`**：协调器拆解、任务队列、可选的综合。

带 `--dashboard` 调用时，**`oma` CLI** 会把一个静态的、执行后的 DAG 仪表盘 HTML 写到当前工作目录下的 `oma-dashboards/runTeam-<timestamp>.html`（库本身不写文件；如果你想在 CLI 之外得到它，在应用代码里调用 `renderTeamRunDashboard(result)`——见 `packages/core/src/dashboard/render-team-run-dashboard.ts`）。

仪表盘页面是自包含的：它不加载远程脚本、样式表或字体，且嵌入的运行载荷中看起来敏感的值会在渲染前被脱敏。

| Argument | Required | Description |
|----------|----------|-------------|
| `--goal` | Yes | 传给团队运行的自然语言目标。 |
| `--team` | Yes | JSON 文件路径（见 [Team 文件](#team-file)）。 |
| `--orchestrator` | No | JSON 文件路径，在团队文件里的 orchestrator 片段之后合并进 `new OpenMultiAgent(...)`。 |
| `--coordinator` | No | JSON 文件路径，作为 `runTeam(..., { coordinator })` 传入（`CoordinatorConfig`）。 |
| `--dashboard` | No | 把执行后的 DAG 仪表盘 HTML 写到 `oma-dashboards/runTeam-<timestamp>.html`。 |

全局标志：[`--pretty`](#output-flags)、[`--include-messages`](#output-flags)。

### `oma task`

用一份固定的任务清单运行 **`OpenMultiAgent.runTasks(team, tasks)`**（不做协调器拆解）。

| Argument | Required | Description |
|----------|----------|-------------|
| `--file` | Yes | [tasks 文件](#tasks-file)的路径。 |
| `--team` | No | JSON `TeamConfig` 的路径。设置后会覆盖 `--file` 里的 `team` 对象。 |

全局标志：[`--pretty`](#output-flags)、[`--include-messages`](#output-flags)。

### `oma provider`

只读辅助命令，用于接线 JSON 配置和环境变量。

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

其它字段都会像在 TypeScript 里一样透传给库。

**仅 SDK 可用的字段**：`sharedMemoryStore`（自定义 `MemoryStore` 实例）无法从 JSON 设置，因为它是运行时对象。默认的内存存储用 `sharedMemory: true`，或在 TypeScript 里通过 `orchestrator.createTeam()` 接入自定义存储。

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

- **`dependsOn`** —— 任务标题（不是内部 id），与库里协调器输出的约定一致。
- 可选的每任务字段：`memoryScope`（`"dependencies"` \| `"all"`）、`maxRetries`、`retryDelayMs`、`retryBackoff`。
- **`tasks`** 必须是非空数组；每一项需要字符串 `title` 和 `description`。

如果传了 **`--team path.json`**，文件顶层的 `team` 属性会被忽略，改用外部文件（当同一份团队定义在多个 pipeline 文件间共享时很有用）。

### Orchestrator 与 coordinator JSON

这些文件是任意 JSON 对象，分别合并进 **`OrchestratorConfig`** 和 **`CoordinatorConfig`**。函数值的选项（`onProgress`、`onApproval` 等）无法出现在 JSON 里，CLI 也不支持。

在 orchestrator JSON 上设 `defaultCwd`，或在单个 agent/coordinator JSON 上设 `cwd`，来选择内置文件系统工具的沙箱根目录。传给 `file_read`、`file_write`、`file_edit`、`grep` 和 `glob` 的路径必须是绝对路径，并解析到该根目录内部。省略 `defaultCwd` 时，沙箱默认为 `<cwd>/.agent-workspace`（首次写入时自动创建）。传入等价于 `"<process.cwd()>"` 的绝对路径可把它放宽到整个工作目录，或传 `null` 来禁用沙箱。`bash` 工具有意未被覆盖——理由和推荐姿态见 `docs/tool-configuration.md`。

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

`agentResults` 的键是 agent 名。当一个 agent 跑了多个任务时，库会合并结果；CLI 镜像合并后的 `AgentRunResult` 字段。

**错误（usage、validation、I/O、runtime）**

```json
{
  "error": {
    "kind": "usage",
    "message": "--goal and --team are required"
  }
}
```

`kind` 是以下之一：`usage`、`validation`、`io`、`runtime`，或 `internal`（外层处理器里未捕获的错误）。

### 输出标志

| Flag | Effect |
|------|--------|
| `--pretty` | 带缩进美化打印 JSON。 |
| `--include-messages` | 在 `agentResults` 里包含每个 agent 完整的 `messages` 数组。长时间运行时**非常大**；默认省略。 |

没有单独的进度流；需要丰富遥测时，用 TypeScript API 配合 `onProgress` / `onTrace`。

---

## 退出码

| Code | Meaning |
|------|---------|
| **0** | 成功：`run`/`task` 以 `success === true` 结束，或 help / `provider` 正常完成。 |
| **1** | 运行结束但 **`success === false`**（库报告的 agent 或任务失败）。 |
| **2** | usage、validation、可读的 JSON 错误，或文件访问问题（例如文件缺失）。 |
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
- 布尔式标志（`--pretty`、`--include-messages`）不取值；如果下一个 token 不以 `--` 开头，它会被当作前一个选项的值（标准的 `getopt` 风格配对）。

---

## 限制（出于设计）

- 没有 TTY 会话、历史，或从 `stdin` 输入目标。
- 没有专门的标志来设文件系统沙箱根目录；通过 orchestrator 或 agent JSON 里的 `defaultCwd` / `cwd` 来配置。
- JSON 里没有 **`onApproval`**；仅支持非交互式批处理。
- 协调器 **`runTeam`** 路径和其它任何运行一样，仍然需要网络和 API 密钥。
