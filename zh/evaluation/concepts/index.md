---
title: 概念概览
---

# 概念概览

按顺序阅读这些页面，理解 runner 优先模型。

## 推荐阅读顺序

1. [心智模型](/zh/evaluation/mental-model) — 工作流与所有权
2. [原生模型与框架 runner](/zh/evaluation/concepts/native-model-and-adapters)
3. [框架 runner](/zh/evaluation/reference/framework-adapters)
4. [数据模型](/zh/evaluation/concepts/data-model)
5. [证据与轨迹](/zh/evaluation/concepts/evidence-and-trajectories)
6. [分数与门禁](/zh/evaluation/concepts/scores-and-gates)
7. [标注](/zh/evaluation/concepts/annotation) — 为捕获的 Session 打标签（span / trace / session）
8. [环境包与依赖 tape](/zh/evaluation/concepts/environment-bundles) — Agent 评估的可执行世界
9. [工作原理](/zh/evaluation/how-it-works)

## 按角色

### 框架负责人

| 主题 | 页面 |
|------|------|
| 首次运行 | [快速开始](/zh/evaluation/getting-started) |
| Runner 打包 | [准备一次框架运行](/zh/evaluation/guides/author-a-suite) |
| Promptfoo 细节 | [Promptfoo 集成](/zh/evaluation/guides/promptfoo-integration) |
| Runner 语义 | [框架 runner](/zh/evaluation/reference/framework-adapters) |

### 平台运维

| 主题 | 页面 |
|------|------|
| 信任边界 | [信任边界](/zh/evaluation/architecture/trust-boundaries) |
| 存储与保留 | [存储与 thelake](/zh/evaluation/architecture/storage-and-thelake) |
| 运行时模型 | [内核与主机](/zh/evaluation/architecture/kernel-and-hosts) |

### CI / 发布负责人

| 主题 | 页面 |
|------|------|
| 对比与晋升 | [对比与晋升](/zh/evaluation/guides/compare-and-promote) |
| 结果状态 | [结果状态](/zh/evaluation/reference/result-status) |
| 事件 | [事件](/zh/evaluation/reference/events) |

## 关键原则

Softprobe 拥有 **外层工作流与环境**，框架拥有 **内部评估语义**。

```text
framework suite + subject + environment + runner
→ WorkflowVersion → framework runner
→ native result bundle + evidence
→ Softprobe compare/gate/governance
```
