---
title: 相似度与统计评估器
---

# 相似度与统计评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**相似度与统计评估器**用编辑距离、BLEU/ROUGE、embedding 相似度、分类器与校准指标对输出打分。

它们需要可 **批量** 执行；当 embeddings 或分类器参与时，需钉选模型/产物 digests。

## 度量内容

- 词面重叠（BLEU、ROUGE、chrF）
- 语义相似度（embeddings 上的余弦距离）
- 分类器置信度与校准
- 成对差异的统计显著性

## 所需证据

- 候选文本
- CaseVersion 或数据集中的参考文本
- 可选：框架套件中的 n-gram 或 embedding 配置

## 可复现性

当模型产生 embeddings 时，归类为 `pinned_external`。隔离运行应钉选权重并禁用网络。

## 类似能力

传统 NLP 基准、Langfuse 实验中基于 embedding 的 RAG 评估器。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
