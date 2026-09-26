---
title: 多轮与多智能体评估器
---

# 多轮与多智能体评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**多轮评估器**使用有状态 rollout 协议，对对话质量、handoffs、协作与模拟用户场景打分。

## 度量内容

- 跨轮次的对话连贯性
- 子 Agent 之间的 handoff 正确性
- 模拟用户的目标完成
- 角色遵循与轮次策略

## 所需证据

- 带嵌套 traces 的多轮 Rollout
- 各轮之间的环境 `step` / `observe` 状态
- 框架套件中的角色与轮次元数据

## 配置

需要具备有状态生命周期的 Environment，以及配置为多轮或多智能体拓扑的 Subject。评估器可针对 `rollout` 或 `case_run` 分数目标。

## 类似能力

τ-bench 风格模拟用户、多智能体编排基准、对话式 RAG 评估。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
