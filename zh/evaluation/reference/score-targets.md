---
title: Score targets
---

# Score targets

可选 **measurements** 投影到便于查询的 `scores` 表。Softprobe 不要求投影才能得到合法 WorkflowRun——原生 result bundle 仍是权威。

**Score target v2** 为 workflow 实体增加规范寻址，同时保留 v1 的 span/trace/session 兼容。

## Target 类型（v2）

| `target_type` | 用途 |
|---------------|------|
| `span` | OTLP span（generation、tool 等） |
| `trace` | 整条 W3C trace |
| `session` | SESSIFY / 产品 session |
| `workflow_run` | Softprobe WorkflowRun |
| `framework_attempt` | Softprobe FrameworkAttempt |

## v1 兼容

遗留列 `span_id`、`trace_id`、`session_id` 对这些 target 类型仍会填充并建立索引。v1 API/SDK 保持现有校验。

## 写入规则（v2）

- 每次 measurement 写入只接受**恰好一个**规范 target。
- 适用时由服务端推导遗留列。
- 拒绝不一致的双重表示。

## 读取规则

- v2 读取按规范 target 过滤；返回规范字段 + 适用的遗留字段。
- v1 读取仅暴露可按遗留方式寻址的 measurement。

## 什么会投影到 scores

| 会投影 | 不会投影 |
|--------|----------|
| Softprobe 选择投影的框架上报 measurement | 完整原生聚合/明细（留在 result bundle） |
| 可选配置的 gate 布尔值 | GateDecision 记录（默认仅在 ledger） |
| | 原始 attempt 诊断 |

Gate decision 留在 ledger；需要在 score 查询中使用时，门禁可另行发出一个 **独立的布尔 measurement**。

## 迁移

回填选择最具体的规范 target：`span` → `trace` → `session`。Score ID 保留。此前使用 Softprobe 专有 target（`case_run`、`rollout` 等）的行映射到 `workflow_run` / `framework_attempt`，或继续以框架原生形式留在 result bundle。

参见 [分数与门禁](/zh/evaluation/concepts/scores-and-gates)。
