---
title: "用 TencentDB-Agent-Memory 给你的 TypeScript AI 智能体加上长期记忆"
description: "把 open-multi-agent 的 MemoryStore 通过 Hermes Gateway 接到 TencentDB-Agent-Memory：一个端到端实测的跨运行记忆闭环，以及两个决定到底有没有东西被存下来的上游坑。"
pubDate: 2026-06-15
tags: ["typescript","ai","llm","tutorial"]
readingMinutes: 7
---
> 一篇实操，把 [open-multi-agent](https://github.com/open-multi-agent/open-multi-agent) 那个可插拔的 `MemoryStore` 通过 Hermes Gateway 接到 [TencentDB-Agent-Memory](https://github.com/TencentCloud/TencentDB-Agent-Memory)，在 DeepSeek 上端到端实测了一个真实的跨运行记忆闭环，外加两个任何 README 都没写、漏了就会悄无声息吞掉你记忆的上游行为。

多数多智能体框架没有长期记忆，而且这是有意为之。它们做的是编排：拆解一个目标，跑各个智能体，在它们之间传结果。运行一结束，智能体学到的一切就没了。没有「这个用户上周告诉过我们什么」的概念，也没有「前三次看这件事我们得出过什么结论」。对一次性的批处理作业来说这没问题。但对一个助手、一个客服机器人，或任何用户会回头再用的东西来说，这就是全部。

open-multi-agent 就是这类框架之一。它的 `SharedMemory` 是单次运行内的进程内协调状态，不是知识库。所以「我的智能体怎么跨会话记住东西」这个问题，诚实的答案是：你得自带一层记忆。这篇就接入了一个具体的记忆层，TencentDB-Agent-Memory（TDAM），腾讯云开源的一套智能体记忆系统，它把原始对话蒸馏成可检索的长期记忆，并把这一切全部留在本地磁盘上。

读完你会得到：

- 一个 `MemoryStore` 适配器，让一个智能体团队跨独立的进程运行拥有持久记忆。
- 一个实测的两轮闭环：第一轮写入并蒸馏记忆，第二轮把它们召回、再喂回智能体的提示里。
- 两个带服务端日志为证的上游坑，它们决定了到底有没有东西被存下来。
- 一条清楚的界线：什么时候这是对的记忆层，什么时候它属于杀鸡用牛刀。

## 它处在什么位置：给智能体加记忆的三种路子

在写任何代码之前，先把真实的格局摆清楚，因为对你来说对的答案，可能比这整篇文章都简单。

给一个智能体系统加长期记忆，大体有三种路子：

1. **自己造。** 一个向量数据库、一个 embedding 模型，外加你自己那套决定存什么、怎么总结的逻辑。控制力拉满，然后你得永远维护这一切。
2. **托管的记忆 SaaS。** 一个托管 API，替你存取记忆。投入最少，但你的对话历史和抽取出的事实活在别人的服务器上。
3. **自托管的蒸馏式记忆。** 一套系统自己跑抽取流水线，跑在你的数据上、跑在你掌控的基础设施上。TDAM 就是这一类：原始对话（L0）被蒸馏成原子事实（L1），再到场景（L2），再到人设（L3），存进本地 SQLite 加 sqlite-vec，用 BM25 加向量的混合检索取回。存储这一环零外部 API 依赖。

这篇搭的是第三种。如果你在 TypeScript 技术栈上、想让记忆抽取跑在你掌控的基础设施上，且「数据永不离开我们的机器」是一条真实的硬要求（受监管行业、本地化部署、隐私敏感的产品），那这篇就值得你花时间。如果你只需要一个能扛住重启的键值草稿本，那就把 open-multi-agent 的 `MemoryStore` 直接指向 Redis 或 SQLite，这一整篇都可以跳过。

## 两个系统如何对接

open-multi-agent 暴露一个 `MemoryStore` 接口（`get` / `set` / `list` / `delete` / `clear`），并允许你把任意实现注入成一个团队的 `sharedMemoryStore`。而 TDAM 这边没有通用 SDK；第三方框架通过它的 **Hermes Gateway** 集成——一个 HTTP sidecar（默认 `127.0.0.1:8420`），暴露 `capture`、`search`、`recall` 三个端点，外加可选的 Bearer 鉴权。所以这个适配器就是一个通过 HTTP 跟 Gateway 说话的 `MemoryStore`。

有一处不匹配塑造了整个设计。`MemoryStore` 是一份键值契约：`get(key)` 必须原样返回 `set(key, value)` 写进去的东西。而 Gateway 压根没有按 key 读取的端点；它的 `search` 和 `recall` 返回的是*蒸馏过、格式化过的文本*，不是你存进去的原始记录。硬把键值读取塞进一个 search 端点，会悄悄搞坏编排器的记账，因为它在步骤之间是按 key 读回任务结果的。所以适配器把职责拆开：

```plaintext
within a run:
  get / list / delete / clear  ───────────────►  local in-process map  (exact KV)
  set(key, value)              ──┬────────────►  local map
                                 └── /capture ──►  TDAM  →  L0 → L1 → L2 → L3  (local SQLite)

across runs:
  recall(topic)  ◄── formatted context ──  TDAM  (BM25 + vector hybrid)  ──►  agent prompts
```

在一次运行内，本地 map 是唯一真源，和默认的内存存储完全一致。跨运行时，被持久化的是蒸馏后的 TDAM 记忆。这条区分就是整个集成的全部。

## 两个决定到底有没有东西被存下来的上游行为

这一部分你从 README 里拿不到，也是最容易让你以为集成坏了、而其实它正按设计工作的地方。

### 1. 抽取器只记住用户，从不记助手

TDAM 的 L1 抽取提示蒸馏三类记忆，全都是*关于用户的*：人设、情景、指令。它的「不要抽取」清单里明确点名了 AI 助手自己的输出。这是一套用户记忆系统，不是一份对话存档——而且这条排除是在抽取提示里强制的，不是靠代码层的过滤器。

我适配器的第一版把智能体的结果放进了被捕获那一轮的 `assistant_content` 字段，这感觉很自然：结果是智能体产出的，所以是助手在说话。Gateway 接受了这次捕获，触发了抽取，然后什么都没存：

```console
[l1-extractor] Total extracted memories: 0 across 1 scene(s)
[l1] L1 complete: extracted=0, stored=0
```

修法是把捕获措辞成：让智能体以*用户*的身份来报告它的结果。同样的内容，换个槽位。改完之后，同一次运行抽取出了一条记忆：

```console
[l1-extractor] Total extracted memories: 1 across 1 scene(s)
[l1] L1 complete: extracted=1, stored=1
```

如果你往 TDAM 里喂的是任何非对话式的产出方（一个智能体、一个作业、一条流水线），这就是你最需要做对的一件事。

### 2. 抽取是被调度的，`session/end` 并不强制它

被捕获的轮次不会立刻被抽取。抽取在一个会话的对话计数越过阈值时触发，或者在一个 600 秒的空闲计时器之后触发。这个阈值有一段会*翻倍*的预热：它从 1 起步，然后 2，然后 4，最后才稳定到稳态值（`everyNConversations`，默认 5）。

这个翻倍就是坑。在默认配置、外加只有两次捕获的一次短运行下：

```console
notify: conversation_count=1/1 (warmup: 1)   -> threshold reached, triggering L1
Warm-up advanced -> next threshold 2
notify: conversation_count=1/2 (warmup: 2)   -> L1 idle timer reset (600s)
flushSession: complete
```

第一次捕获抽取了。第二次没有：它需要计数 2，而预热此刻正从一个刚归零的计数 1 上要 2。调用 `POST /session/end` 会把已经在途的抽取排干，但并不会把第二次捕获强推过去。在上面的日志里，`flushSession: complete` 之后再没有第二次抽取。那条记忆正躺在缓冲区里，等一个短命的 demo 永远触不到的阈值或计时器。

对一个长跑的生产会话来说，这套调度没问题，而且多半正是你想要的。但对一个确定性的「捕获，然后立刻 search」闭环，就在 `tdai-gateway.yaml` 里设 `everyNConversations: 1`。阈值于是直接毕业到稳态 1，每次捕获都当场抽取。

配置时还有个小提醒：Gateway 需要 Node 22。在 Node 20 上它会因 `TypeError: webidl.util.markAsUncloneable is not a function` 启动失败，这是个 undici 不兼容。

## 实测的闭环

配置：来自 npm 包的 TDAM v0.3.6、Node 22、SQLite 后端且禁用 embeddings（所以检索走 BM25 / FTS）、开启 Bearer 鉴权，以及用 `deepseek-v4-flash` 同时驱动智能体团队和 Gateway 的抽取流水线。团队是两个智能体（一个分析师和一个写手）研究同一个主题。鉴权的表现和文档一致：`GET /health` 是开放的，其余每个端点在没有合法 Bearer token 时都返回 401。

**第一轮，冷启动。** 没有任何先前记忆。团队跑起来，每一次共享内存写入都被捕获进 TDAM：

```console
[1/4] Recalling long-term memory... No long-term memories yet (first run).
[3/4] Captured 2/2 shared-memory writes into TDAM (4 L0 records). Flushing...
[4/4] 1 memories match (strategy: fts).
  [episodic] (priority: 80) The user (analyst) reported completed work comparing
  SQLite and PostgreSQL for agent memory stores, concluding that SQLite is
  preferable for real-time latency and simplicity, while PostgreSQL is better
  for multi-agent concurrency and scalability.
```

被捕获的两轮蒸馏成了一条情景记忆。Token 用量：输入 4443，输出 2137。

**第二轮，同一个会话，全新进程。** 这次召回找到了东西：

```console
[1/4] Recalling long-term memory... Recalled 1 memories (strategy: hybrid)
      -> injecting into agent prompts.
```

被召回的记忆进了两个智能体的系统提示，写手在先前的结论上接着往下写，而不是从头来过。新一轮的结果再被捕获回去，而 TDAM 不只是追加第二条记忆，它把两轮合并成了一条升级后的记录：

```console
[4/4] 1 memories match (strategy: fts).
  [episodic] (priority: 85) The open-multi-agent team completed work on storage
  choice for AI agent memory: the analyst completed an analysis comparing SQLite
  and PostgreSQL ... the writer completed a memorandum recommending SQLite for
  single-agent local workloads and PostgreSQL for multi-agent concurrent systems.
```

优先级从 80 升到 85，场景现在覆盖了两个智能体。Token 用量：输入 11384，输出 2489，更高是因为召回的上下文现在进了提示。这就是闭环合上了：写入、蒸馏、跨进程边界召回、喂回、再蒸馏成更好的东西。

关于延迟有一处实话。第一轮里 flush 在 0.0 秒返回，因为有了 `everyNConversations: 1`，抽取已经在捕获期间内联完成了。第二轮里 flush 花了 49.9 秒，因为那一轮的捕获还排在队里，`session/end` 是实打实地在等抽取模型。要给 flush 时真实的 LLM 延迟留预算。换成本地模型，按分钟算，别按秒算。

## 什么时候该上它，什么时候不该

成本得说实话，也值得讲清楚：TDAM 的 Gateway 是一个你要跟着应用一起跑的独立服务。对一个整套卖点就是三个依赖、进程内、一次调用的框架来说，「现在还要跑一个 sidecar 加一个抽取 LLM」是实打实的摩擦。你为某个理由才背上它，而不是默认就背。

什么时候该上它：当长期记忆必须留在你掌控的基础设施上、当你想要分层蒸馏（事实、场景、人设）而不是一份扁平日志、且当你愿意为此跑那个 sidecar 时。什么时候跳过它：当一个能扛住重启的键值存储就是你的全部所需时；一个由 Redis 或 SQLite 撑起来的 `MemoryStore`，活动部件只有它的十分之一。

完整可跑的示例（适配器、search 工具包、双智能体 demo、README）在 open-multi-agent 仓库的 `examples/integrations/with-tencentdb-memory/` 下，钉死在 TDAM v0.3.6（两个坑都在 TDAM 源码里一路核到 1.0.0 确认未变），lint 和整套测试全绿。如果你把 TDAM 接进另一个框架、撞上了第三个坑，我想知道是哪个。
