---
title: 确定性评估器
---

# 确定性评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**确定性评估器**用精确规则比较产物：`equals`、`contains`、`not-contains`、regex、JSON Schema、AST match、策略规则，以及单元测试。

它们是对类型化产物的纯打分器——速度快、可隔离，适合 CI。

## 度量内容

| 检查 | 示例 |
|------|------|
| Exact match | 输出等于期望字符串 |
| Contains / not-contains | 技能名出现在路由响应中 |
| Regex | 结构化字段匹配模式 |
| JSON Schema | 工具参数通过 schema 校验 |
| Policy rules | 禁止字符串不出现 |

## 所需证据

- 模型输出文本或结构化 JSON
- 可选：框架用例中的参考文本
- 规则指向 oracle 字段时，需要环境状态快照

## 示例测量

| Measurement | Evaluator |
|-------------|-----------|
| `router.skill_match` | `icontains` → `billing-support` |
| `confidentiality.no_internal_terms` | `not-icontains` → `internal_db_schema` |

Promptfoo 的 `icontains` / `not-icontains` 留在 **FrameworkDefinition** 中。Softprobe 通过钉选的 runner 运行它们——不会把它们重新写成 Softprobe 评估器。参见 [Framework runners](/zh/evaluation/reference/framework-adapters)。

## 类似能力

Promptfoo assertions、Langfuse CODE evaluators、Braintrust 纯函数自定义 scorers。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
