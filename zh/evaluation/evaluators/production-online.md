---
title: 生产与在线方法族
---

# 生产与在线方法族

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**在线**工作流选择生产 traces（过滤、稳定采样、水位线、预算），并启动 Softprobe 离线时使用的**同一 framework runner**。Softprobe 提供在线策略与证据快照；框架负责打分。

## 团队通常度量什么

- 线上流量的持续质量
- 生产 spans 上的回归检测
- 框架套件版本变更后的 backfill 重打分
- 过滤后的子集（例如仅诊断 traces）

## Softprobe 策略控制

| 控制 | 目的 |
|------|------|
| 稳定采样 | `hash(target_id + policy_version)` |
| 水位线 | 等待迟到 spans 后再启动 runner |
| 速率/成本上限 | 限制花费 |
| 排除标签 | 跳过评估执行 traces（防循环） |

参见 [在线评估](/zh/evaluation/concepts/online-evaluation) 与 [Promptfoo 用于生产 OTEL](/zh/evaluation/guides/promptfoo-online-otel)。

## 类似能力

Langfuse 实时 LLM-as-a-judge、Braintrust 在线打分规则、持续评估流水线——通过 Softprobe 以 runners + 在线策略接入，而非 Softprobe 原生 scorers。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
