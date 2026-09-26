---
title: 轨迹与工具评估器
---

# 轨迹与工具评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**轨迹评估器**对规范 OTLP 步骤做断言：使用的工具、参数形态、顺序、步数、效率，以及目标成功代理指标。

## 度量内容

| 检查 | 示例 |
|------|------|
| Tool used | Agent 调用了批准的 API 工具，而非原始 HTTP |
| Args shape | 工具参数匹配期望 schema |
| Ordering | 诊断先于修复建议 |
| Step count / efficiency | 更少冗余工具循环 |
| Policy compliance | 沙箱评估中无禁止工具 |

## 所需证据

- 由 OTLP spans 派生的规范有序轨迹
- Span 选择器：`generation`、`tool`、`retriever`、guardrail、sub-agent
- 可选：用于 diff 式检查的基线轨迹

## 示例测量

| Measurement | Evaluator |
|-------------|-----------|
| `agent.tool_policy_compliance` | 仅允许的工具 |
| `agent.trajectory_efficiency` | 步数相对 oracle 上界 |

选择器直接定位 spans，无需每个 scorer 重新解析原始 OTLP。参见 [证据与轨迹](/zh/evaluation/concepts/evidence-and-trajectories)。

## 类似能力

DeepEval 轨迹指标（经 adapter）、Agent 基准中的自定义工具使用检查。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
