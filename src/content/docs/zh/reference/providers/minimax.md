---
title: "MiniMax 配置指南"
description: "通过内置的 minimax 提供方在 OMA 中使用 MiniMax M3，外加限时社区优惠。"
---

<img src="../../.github/brand/minimax-banner.png" alt="MiniMax" width="600">

只需一份简单的提供方配置，就能在 OMA 的 TypeScript 多智能体工作流里使用 MiniMax M3。

## 社区优惠

OMA 用户购买 MiniMax Token Plan 可享 **12% 折扣**。有效期至 **2026-06-30**。

| Region | Link |
|--------|------|
| Global | [platform.minimax.io](https://platform.minimax.io/subscribe/coding-plan?code=6ZoOY13DDV&source=link) |
| China | [platform.minimaxi.com](https://platform.minimaxi.com/subscribe/token-plan?code=98qruMqQhL&source=link) |

这是一项限时社区优惠，而非付费背书。

## 关于 MiniMax M3

MiniMax M3 是 MiniMax 最新的旗舰模型。它支持最高 1M-token 的上下文窗口（保证下限 512K），并在文本之外接受图像输入。M3 现在是推荐的默认选择；M2.7 和 `MiniMax-M2.7-highspeed` 仍可供显式指定模型的调用方使用。

## 配置

### 环境变量

```bash
export MINIMAX_API_KEY=your-api-key
```

适配器默认使用全球端点（`https://api.minimax.io/v1`）。中国用户应覆盖 base URL：

```bash
export MINIMAX_BASE_URL=https://api.minimaxi.com/v1
```

### 智能体配置

```typescript
const agent: AgentConfig = {
  name: 'my-agent',
  provider: 'minimax',
  model: 'MiniMax-M3',
  systemPrompt: 'You are a helpful assistant.',
}
```

完整示例：

```typescript
import { OpenMultiAgent, type AgentConfig } from '@open-multi-agent/core'

const agent: AgentConfig = {
  name: 'analyst',
  provider: 'minimax',
  model: 'MiniMax-M3',
  systemPrompt: 'Analyze data and produce concise reports.',
  tools: ['bash', 'file_read', 'file_write'],
}

const orchestrator = new OpenMultiAgent()
// Built-in filesystem tools default to a `<cwd>/.agent-workspace` sandbox;
// point the agent at an absolute path inside that root.
const result = await orchestrator.runAgent(
  agent,
  `Summarize the file ${process.cwd()}/.agent-workspace/report.csv`,
)
console.log(result.output)
```

## 披露

- 这是一项有效期至 2026-06-30 的限时社区优惠。
- 列出的服务并非付费背书。
- 部分提供方优惠可能包含有助于维护本项目的推荐返佣。
