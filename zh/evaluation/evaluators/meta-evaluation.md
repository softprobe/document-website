---
title: 元评估评估器
---

# 元评估评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**元评估器**评判其他 judge：相对人工标签的校准、标注者间一致性、位置偏差、基准泄漏与污染检测。

它们可将既有结果集作为数据集消费——仍发出带完整溯源的标准测量。

## 度量内容

| 检查 | 目的 |
|------|------|
| Judge 校准 | LLM judge vs 人工 gold |
| 一致性 | 标注者间的 Cohen's kappa |
| 位置偏差 | 成对 judge 的顺序效应 |
| 泄漏 | 训练/评估重叠检测 |
| 污染 | 基准记忆信号 |

## 所需证据

- 既有 Run 的测量与聚合（按引用）
- 校准切分上的人工 gold 标签
- 数据集血缘与切分标签（`held_out_release`）

## 工作流

元评估作为独立的 **FrameworkDefinition**，在导出的快照上运行——不内联在 Softprobe subject rollout 中。

## 类似能力

Judge 评估文献、Braintrust meta-experiments、基准卫生工具。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
