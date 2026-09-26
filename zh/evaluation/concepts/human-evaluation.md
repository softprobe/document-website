---
title: 人工评估
---

# 人工评估

**Agent Evaluation 工作流** 中的人工评审保持 **框架原生或外部**。Softprobe **不**提供 Softprobe 人工评估器运行时、Softprobe 标注队列，或 Softprobe 暂停 / 恢复评分器状态。

在该路径上，Softprobe 的职责是保管与治理：钉死框架 / 人工工作流产物、捕获 digest、投影可选测量，并应用发布门禁。

另外，Softprobe LLM **Session 标注** 允许评审者在 thelake 中为已捕获的 **observation**（span）附加不可变 **分数** — 见 [标注](/zh/evaluation/concepts/annotation)（词汇与绑定）。该路径是给生产流量打标签；它不是 Softprobe scorer DSL，也不是 Agent Evaluation 评分器运行时。

## Softprobe 角色

```mermaid
flowchart LR
  Human[Human / external review tool]
  Native[Framework-native or export artifacts]
  Ev[EvidenceArtifact digests]
  Gate[GateDecision / promote]
  Human --> Native --> Ev --> Gate
```

| Softprobe 会做 | Softprobe 不会做 |
|----------------|--------------------|
| 存储已批准的人工结果产物 + 来源 | 拥有分配、租约、盲评 UI |
| 对已标注字段做可选分数投影 | Softprobe「人工评估器」插件 ABI |
| Digest 绑定的批准 / 发布 / 激活 | 由提议的 AI Agent 自我批准 |

## 典型模式

1. **框架内人工步骤** — Promptfoo / DeepEval / 标注产品在原生结果包中记录标签；Softprobe 通过钉死的 runner 运行该套件。
2. **外部评审导出** — 评审工具导出已签名 / 已标注产物；Softprobe 将其提交为 EvidenceArtifact，并可投影选定字段。
3. **受治理晋升** — 人工批准 FrameworkDefinition / WorkflowVersion / 门禁策略 digest（见 [生产到评估闭环](/zh/evaluation/guides/production-to-eval-loop)）。

## AI 提议 vs 人工批准

AI Agent 可以 **提议** 框架定义或策略变更。**批准、发布与门禁激活** 需要配置的人工或独立策略授权 — digest 绑定、服务端强制的 RBAC。

## 相关

- [标注](/zh/evaluation/concepts/annotation) — 已捕获 LLM 流量上的 session / span 分数
- [生态方法族：人工标注](/zh/evaluation/evaluators/human-annotation)
- [分数与门禁](/zh/evaluation/concepts/scores-and-gates)
