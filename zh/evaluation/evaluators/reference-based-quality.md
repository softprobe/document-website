---
title: 基于参考的质量评估器
---

# 基于参考的质量评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**基于参考的质量评估器**相对数据集参考打分：正确性、groundedness、引用覆盖、RAG 相关性与 faithfulness。

它们需要期望参考与检索上下文，位于 **框架** 套件 / 原生证据包中。

## 度量内容

| 指标 | 问题 |
|------|------|
| Correctness | 回答是否匹配参考？ |
| Groundedness | 每条主张是否都有上下文支撑？ |
| Citation coverage | 需要引用处是否已引用？ |
| RAG faithfulness | 回答是否停留在检索段落范围内？ |

## 所需证据

- 模型输出
- 框架定义中的期望参考
- 检索到的上下文块（内容寻址）
- 可选：引用 spans

## 示例

如 `support.evidence_grounded` 这类 RAG 评估器，会把基于参考的检查与轨迹及环境 oracle 结合。

## 类似能力

带 `expected_output` 的 Langfuse dataset experiments、Braintrust 基于 `expected` 的 scorers。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
