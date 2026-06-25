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

对于持久化或跨进程的后端（Redis、Postgres、Engram 等），实现 `MemoryStore` 接口并通过 `sharedMemoryStore` 传入。键在抵达存储之前仍会被命名空间化为 `<agentName>/<key>`：

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
