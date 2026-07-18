---
title: "共享内存"
description: "在团队间共享一个带命名空间的键值存储——默认的进程内存储或自定义 MemoryStore 后端。"
---

团队可以共享一个带命名空间的键值存储，让后面的智能体看到前面智能体的发现。用一个布尔值启用默认的进程内存储：

```typescript
const team = orchestrator.createTeam('research-team', {
  name: 'research-team',
  agents: [researcher, writer],
  sharedMemory: true,
})
```

想要持久存储又不想写任何存储代码，就传入内置的 **`FileStore`**——一个零依赖、基于文件系统、带原子写入的 `MemoryStore`（见 [检查点与恢复](/zh/reference/checkpoint/#持久存储filestore)）。对于跨进程或基础设施后端（Redis、Postgres、Engram 等），自行实现 `MemoryStore` 接口并通过 `sharedMemoryStore` 传入。键在抵达存储之前仍会被命名空间化为 `<agentName>/<key>`：

```typescript
import type { MemoryStore } from '@open-multi-agent/core'

class RedisStore implements MemoryStore { /* get/set/list/delete/clear */ }

const team = orchestrator.createTeam('durable-team', {
  name: 'durable-team',
  agents: [researcher, writer],
  sharedMemoryStore: new RedisStore(),
})
```

两者都提供时，`sharedMemoryStore` 胜出。仅限 SDK：CLI 无法传入运行时对象。

## 对持久化的密钥脱敏

共享内存的写入会**逐字**持久化智能体的输出。别处的脱敏（追踪 span、仪表盘）止步于遥测层，不会触及存储——所以如果某个智能体可能把密钥吐进它的回答、而你的存储又是持久的，那这个密钥就会落到磁盘上。用 **`RedactingStore`** 把存储包起来：它是一个 `MemoryStore` 装饰器，会在每次写入必经的那一个咽喉点上，于写入时把值里的凭据（外加你自行添加的任意自定义模式）擦除：

```typescript
import { RedactingStore, FileStore } from '@open-multi-agent/core'

const team = orchestrator.createTeam('durable-team', {
  name: 'durable-team',
  agents: [researcher, writer],
  sharedMemoryStore: new RedactingStore(new FileStore('./.oma/memory.json'), {
    // Optional: extra value patterns (e.g. PII) on top of built-in credential redaction.
    patterns: [/\b\d{3}-\d{2}-\d{4}\b/],
  }),
})
```

由于检查点默认使用团队的共享内存存储，这一次包装同样会对写入其中的检查点脱敏（见 [检查点与恢复](/zh/reference/checkpoint/#对持久化的机密做脱敏)）。脱敏发生在**写入时**，因此它从构造上就是需显式开启的，且刻意是有损的：下游智能体——或一次恢复的运行——会在原本是密钥的地方读到 `[redacted]`。面向调用方的运行结果不受影响；它从不经过存储。
