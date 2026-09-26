---
title: 环境包与依赖 tape
---

# 环境包与依赖 tape

**环境** 是 Agent 周围可执行的任务世界 — 本身不等于一个 Docker 镜像。Softprobe 把这个世界打包为内容寻址产物，以便你能 **重置**、**回放依赖**、**评判结果**，而无需为每个测试用例改写 Agent。

## 心智模型

```text
production episode
  entry task + tool/MCP/HTTP/fs interactions + workspace state
                 │
                 ▼
        EnvironmentBundle (immutable)
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  replay eval  fork tasks  training rollouts
```

| 产物 | 内容 |
|----------|----------------|
| **Environment bundle（环境包）** | 任务刺激、主体适配器引用、依赖 tape 索引、状态种子、episode 策略、评估器句柄 |
| **Dependency tape（依赖 tape）** | 按 **类别** 有序记录的交互（请求 digest + 类型化响应） |
| **Closure report（封闭性报告）** | 每个依赖的诚实状态：`recorded`、`simulated`、`seeded`、`live` 或 `unsupported` |

这些是 **环境依赖类别**，不是 OpenTelemetry span kind：

`TOOL_CALL` · `MCP_CALL` · `FILESYSTEM` · `CHILD_PROCESS` · `HTTP_CLIENT` · `CLOCK` · `RANDOM` · `USER_TURN`

## 示例：客服 CRM Agent

一个编码或客服 Agent：

1. 收到「查询账户 A-42 并写一条退款备注」
2. 调用 CRM 工具 `get_account`
3. 在工作区写入 `refund-note.md`

一次已录制的 episode 会变成类似这样的 tape 条目：

```json
{
  "schema": "softprobe.dependency-tape/v1",
  "entries": [
    {
      "category": "TOOL_CALL",
      "operation": "crm.get_account",
      "request": {
        "canonical_digest": "sha256:…",
        "payload_ref": "artifact:sha256:…"
      },
      "response": {
        "payload_ref": "artifact:sha256:…",
        "runtime_type": "application/json"
      },
      "causal_parent": "span-id",
      "sequence": 0
    }
  ]
}
```

在 **回放** 时，Softprobe 在真实 CRM 运行 **之前** 匹配调用，跳过副作用，并注入已录制的 JSON（包括当时捕获的 `null` 或抛出的错误）。

## 诚实封闭性

每一个被观察到的依赖都必须出现在 closure report 中。发生 tape miss 时，Softprobe 绝不会静默回退到实时 SaaS。

```json
{
  "schema": "softprobe.closure-report/v1",
  "run_level": "recorded_external",
  "dependencies": [
    {
      "category": "TOOL_CALL",
      "operation": "crm.get_account",
      "provider": "recorded",
      "call_site": "agent#tools.get_account",
      "canonical_request_digest": "sha256:…",
      "available_capabilities": ["tape_replay"]
    }
  ]
}
```

`run_level` 是所有依赖中最不可复现的级别：`hermetic`、`recorded_external`、`pinned_external` 或 `live`。

## Softprobe 不会发明什么

- Softprobe **不会**取代 Promptfoo / DeepEval 的断言 DSL。
- Softprobe **不会**把原始历史 OTLP 本身当作一次评估 — 必须 **调用** 框架。
- Softprobe **不会**声称仅靠容器或 VM 快照就能让 Agent episode 确定性。

## 相关

- [录制与回放 Agent 环境](/zh/evaluation/guides/record-replay-agent-environment)
- [仅提示 vs 环境评估](/zh/evaluation/guides/eval-modes)
- [环境结果评估器](/zh/evaluation/evaluators/environment-outcome)
- [Node 包](/zh/evaluation/reference/node-packages)
