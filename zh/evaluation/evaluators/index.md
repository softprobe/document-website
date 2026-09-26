---
title: 生态方法族
---

# 生态方法族

Softprobe **不会**将这些方法实现为 Softprobe 评估器。它们是各 **框架**（Promptfoo、DeepEval、judge、人工评审工具等）给 Agent 打分的方式。Softprobe 的职责是通过钉选的 runner **运行**这些框架、捕获证据，并对工作流结果做门禁。

用本页选择你需要的 **框架能力**，再将其打包为 FrameworkDefinition + RunnerVersion。

## 方法族

| 方法族 | 示例 | 通常由谁拥有 |
|--------|------|--------------|
| [确定性](/zh/evaluation/evaluators/deterministic) | exact match、contains、regex、JSON Schema | Promptfoo asserts、单元测试 |
| [相似度与统计](/zh/evaluation/evaluators/similarity-and-statistical) | 编辑距离、BLEU/ROUGE、embeddings | 框架指标 / 库 |
| [基于参考的质量](/zh/evaluation/evaluators/reference-based-quality) | groundedness、citation、RAG faithfulness | DeepEval / RAG 框架 |
| [LLM judge](/zh/evaluation/evaluators/llm-judge) | rubric、G-Eval、factuality、style | 框架 LLM-as-judge |
| [比较式 judge](/zh/evaluation/evaluators/comparative-judge) | pairwise、listwise、tournament | 框架比较流程 |
| [轨迹与工具](/zh/evaluation/evaluators/trajectory-and-tools) | tool-used、args、ordering、efficiency | 轨迹指标 + OTEL |
| [环境结果](/zh/evaluation/evaluators/environment-outcome) | 测试通过、DB/API/UI 状态 | 框架内 env verify + Softprobe EnvironmentVersion |
| [多轮与多智能体](/zh/evaluation/evaluators/multi-turn-and-multi-agent) | 对话质量、handoffs | 多轮框架套件 |
| [人工标注](/zh/evaluation/evaluators/human-annotation) | rubric、preference、adjudication | 人工工作流工具 / 框架钩子 |
| [生产与在线](/zh/evaluation/evaluators/production-online) | sampling、持续规则、backfill | Softprobe 在线策略 + 框架 runner |
| [鲁棒性与安全](/zh/evaluation/evaluators/robustness-and-security) | perturbation、red-team | 框架内安全套件 |
| [随机与重复](/zh/evaluation/evaluators/stochastic-and-repeated) | pass@k、variance | 框架 trials（见 [Trials](/zh/evaluation/concepts/trials-and-aggregates)） |
| [元评估](/zh/evaluation/evaluators/meta-evaluation) | judge 校准、leakage | 基于既有导出的独立框架套件 |

## Softprobe 在各方法族中的角色

```text
FrameworkDefinition + RunnerVersion + SubjectVersion + EnvironmentVersion
→ FrameworkAttempt → EvidenceArtifact → optional projection → GateDecision
```

## 扩展规则

添加或钉选已拥有该方法的 **framework runner**。**不要**添加 Softprobe Measurement schema 或 Softprobe scorer，除非你在构建内部控制面检查（完整性、脱敏、能力）——那些不属于评估编写。

## 相关

- [心智模型](/zh/evaluation/mental-model)
- [Framework runners](/zh/evaluation/reference/framework-adapters)
- [Capability descriptors](/zh/evaluation/reference/capability-descriptors)
