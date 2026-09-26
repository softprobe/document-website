---
title: 人工标注评估器
---

# 人工标注评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。
>
> 若要在 Softprobe LLM 捕获的 **span** / **observation** 上打分标注（而非 Softprobe 评估器），参见 [Annotation](/zh/evaluation/concepts/annotation)。

**人工标注评估器**集成盲测队列、rubric 打分、成对偏好与裁决。

它们与自动打分器使用同一测量信封——外部 / 框架内人工评审，而不是单独的分数子系统。

## 度量内容

- 标注员给出的 rubric 维度
- 候选之间的成对偏好
- 分歧后的裁决标签
- 标注者间一致性元数据

## 工作流

1. FrameworkAttempt 完成并产出 EvidenceArtifacts
2. 人工队列收到盲测任务
3. 标注员提交与评估器版本关联的测量
4. 裁决者解决冲突；聚合计算一致性

## 治理

将提案、评审、批准、发布与激活权限分离，并用 digest 绑定批准。参见 [人工评估](/zh/evaluation/concepts/human-evaluation)。

## 类似能力

Langfuse annotation queues、Braintrust human review、Prod eval rubric 工作流。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
