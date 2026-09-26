---
title: 环境结果评估器
---

# 环境结果评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**环境结果评估器**在 rollout 之后调用 `harness verify (framework-owned)`：测试通过、DB/API/UI 状态、沙箱 oracle、任务完成。

## 设计原则

**结果优于转录**——有 oracle 时优先用 oracle。看起来合理但未通过 fixture 的回答仍算失败。

## 度量内容

- Fixture 仓库中单元/集成测试通过
- API 或 DB 状态匹配 oracle 快照
- UI 或沙箱校验器成功
- Harness 给出的任务完成标志

## 所需证据

- `verify` 之后的环境状态产物
- 可选：测试日志与 diff 产物
- 便于下钻的 rollout 关联 ID

## 示例测量

| Measurement | Oracle |
|-------------|--------|
| `task.tests_pass` | 沙箱中集成测试全绿 |
| `task.root_cause_correct` | 匹配 fixture 失败分类体系 |

早期套件常使用 **no-op** 环境（仅提示词）。基于环境的套件会钉选 fixture 仓库与桩工具，使 oracle 无需访问周围生产环境即可运行。参见 [仅提示词 vs 环境评估](/zh/evaluation/guides/eval-modes)。

## 类似能力

Prime Intellect Verifiers Stateful environments、SWE-bench 风格测试 oracle、Braintrust `task` + postconditions。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。

## 相关 Softprobe 环境指南

- [环境包与依赖磁带](/zh/evaluation/concepts/environment-bundles)
- [录制并回放 Agent 环境](/zh/evaluation/guides/record-replay-agent-environment)
- [Gym 回合与训练 rollouts](/zh/evaluation/guides/gym-and-training-rollouts)
