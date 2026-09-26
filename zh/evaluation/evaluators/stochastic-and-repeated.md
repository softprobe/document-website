---
title: 随机与重复评估器
---

# 随机与重复评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**随机评估器**使用 trial 组与 reducers：pass@k、pass^k、best-of-n、方差与稳定性指标。

## 度量内容

| 聚合 | 含义 |
|------|------|
| pass@k | k 次 trials 中任一通过即成功 |
| pass^k | 全部 k 次 trials 都通过才成功 |
| best-of-n | n 个样本中的最佳测量 |
| Variance / CI | 跨 trials 的稳定性 |

## 配置

Trial 次数与 reducers 留在 **框架** 套件中。Softprobe 记录一次 FrameworkAttempt，其原生包可包含 trial 详情。

Promptfoo `--repeat` 映射到内核 trial 策略。参见 [Trials 与聚合](/zh/evaluation/concepts/trials-and-aggregates)。

## 说明

仅提示词套件默认确定性单次 trial。基于环境的评估可在 SubjectVersion 温度 &gt; 0 时使用成对重复 trials。

## 类似能力

代码生成 pass@k 基准、Braintrust 重复实验运行、Verifiers group scoring。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
