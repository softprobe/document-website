---
title: 关联与 Trace
---

# 关联与 Trace

每次 **FrameworkAttempt** 都会创建或采纳一条 **W3C trace**，使 Softprobe 结果能下钻到 OTLP 证据，并与生产可观测性链接。

## Softprobe / runner span 上的 ID

| 字段 | 用途 |
|-------|---------|
| `workflow_run_id` | Softprobe WorkflowRun |
| `framework_attempt_id` | 外层 runner attempt |
| `workflow_version_id`、`runner_version_id` | 钉死的版本 |
| `trace_id`、根 `span_id` | W3C 关联 |
| `traceparent` | 传播到被测主体 |

框架内部的用例 ID 可出现在原生结果包中；Softprobe 不要求每个框架测试都有 Softprobe `case_run_id`。

## Runner span vs 主体 span

框架 runner 的执行 span 携带 `runner_version_id` 与原生结果包 digest。它们观察主体 — Softprobe 不会发明 Softprobe 评估器 span 去重新打分断言。

## 来自 Trace 的分数目标

投影测量可目标为 `span`、`trace`、`session`、`workflow_run` 或 `framework_attempt`。见 [分数目标](/zh/evaluation/reference/score-targets)。

## 防环路

评估执行使用保留的内部环境标签。在线策略默认排除这些 trace — 防止递归评估环路。

## Softprobe Testing 关联

[Testing](/zh/testing/) 中的 Java 录制 / 回放 trace 语义不同（`appId`、mocker）。在策略允许时，评估可把生产或回放 trace **导入**为证据快照 — 评估并不取代 Testing 回归。
