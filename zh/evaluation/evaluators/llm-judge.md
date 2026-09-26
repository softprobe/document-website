---
title: LLM judge 评估器
---

# LLM judge 评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**LLM judge 评估器**使用钉选的模型、提示词与采样策略，应用 rubric、G-Eval 风格标准、factuality、风格与安全检查。

它们返回数值、类别或布尔测量，并可附带作为产物存储的推理文本。

## 度量内容

- Rubric 维度（可操作性、清晰度、语气）
- Factuality 与幻觉风险
- 风格与格式合规
- 安全与策略遵循

## 所需证据

- Subject 输出与可选上下文包
- 钉选在框架套件 / runner digest 中的 rubric 提示词
- 带版本锁定的模型/提供商描述符

## 示例测量

| Measurement | 用途 |
|-------------|------|
| `support.actionability` | 建议是否可执行？ |
| `support.evidence_grounded` | 回答是否引用会话证据？ |

## 可复现性

仅将温度设为 0 **并不**意味着确定性可复现——应归类为 `pinned_external`。默认使用多次 trials，或声明明确的单次 trial 策略。

## 类似能力

Langfuse LLM-as-a-judge 模板、Braintrust autoevals、Promptfoo model-graded assertions。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
