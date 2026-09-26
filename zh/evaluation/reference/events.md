---
title: 事件
---

# 事件

评估内核向不可变 ledger 追加 **带类型的事件**。本地运行写入 JSONL；托管运行在状态迁移的同时原子追加到 thelake。

规范名称（设计契约）：

```text
workflow.validated
framework.attempted
artifact.committed
framework.result.accepted
gate.decided
workflow.completed
```

其他页面应链接到此处——不要另造一套 Softprobe 事件词表。

## 核心事件类型

| 事件 | 时机 |
|------|------|
| `workflow.validated` | WorkflowVersion 已校验；外层 attempt 可开始 |
| `framework.attempted` | FrameworkAttempt 开始或推进（payload 携带 status） |
| `artifact.committed` | 内容寻址字节已校验并注册 |
| `framework.result.accepted` | 原生 result bundle 已按声明的 schema/限制接受 |
| `gate.decided` | 已应用 gate policy → GateDecision |
| `workflow.completed` | WorkflowRun 到达终态 |

框架内部的 case/trial 事件留在 **原生 result bundle** 内。

可选投影测量值可能在 `framework.result.accepted` 之后作为 ledger/投影记录出现；它们不是 Softprobe evaluator attempt。

## 事件信封

每个事件包含：

- `event_id`、`workflow_run_id`、单调序号
- `type`、`timestamp`、`schema_version`
- 按类型而定的 payload（artifact digest、status、gate 原因）
- 托管摄入时的租户/项目上下文

## 一致性

- **Artifact 字节**必须先上传并哈希校验，再发出 `artifact.committed`。
- **权威事务**原子追加 kernel 事件 + ledger 状态迁移。
- **Projector**（score/run 视图）异步消费事件——可能滞后，但不能成为真相源。

## 本地 bundle 布局

```text
.sp-work/runs/<workflow_run_id>/
  events.jsonl
  artifacts/<digest>/...
  workflow.resolved.json
```

发布前会校验签名、WorkflowVersion 身份与 artifact 哈希，再执行托管追加。

## 相关

- [存储与 thelake](/zh/evaluation/architecture/storage-and-thelake)
- [工作原理](/zh/evaluation/how-it-works)
- [Result status](/zh/evaluation/reference/result-status)
