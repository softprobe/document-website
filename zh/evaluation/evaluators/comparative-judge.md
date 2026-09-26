---
title: 比较式 judge 评估器
---

# 比较式 judge 评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**比较式 judge**（框架内）对候选结果做 pairwise、listwise 或 tournament 比较。Softprobe 也可通过独立的 WorkflowRuns 比较 SubjectVersions。

## 度量内容

- 成对偏好（A vs B）
- 对 N 个候选的 listwise 排序
- Tournament 胜率与 Elo 风格聚合
- 相对基线的改进

## 拓扑

使用带位置随机化的 **group** 拓扑，以降低位置偏差。通过 Reducers 发出比较测量与可选的聚合胜率。

## 所需证据

- 组内每个候选一份证据包
- 共享的用例输入与环境快照
- 可选：人工比较式 judge 的盲测呈现元数据

## 类似能力

Promptfoo compare mode、Braintrust 并排实验、人工成对偏好队列。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
