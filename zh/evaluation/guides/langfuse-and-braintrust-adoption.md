---
title: Langfuse 与 Braintrust 迁移
---

# Langfuse 与 Braintrust 迁移

从 Langfuse 或 Braintrust 迁过来的团队，尽可能保留熟悉的 **框架** 工作流。Softprobe 补充可移植的 WorkflowVersion、统一的本地/托管执行、证据保管与受治理的 prod-to-eval — 而不是替换评估 DSL。

## 从 Langfuse

| 你现在有 | Softprobe 路径 |
|----------|----------------|
| Datasets / prompt 套件 | 保留为 **FrameworkDefinition**（或导出到 Promptfoo/DeepEval） |
| Evaluator 模板 | 留在框架内；Softprobe 固定 **RunnerVersion** |
| 数据集上的实验 | **`sp eval run`**，同一 WorkflowVersion，本地或托管 |
| Trace 上的分数 | 可选：从框架上报结果做 **分数投影** |
| 在线评估规则 | Softprobe **在线策略** + 框架 runner |
| 标注队列 | 框架 / 外部队列做评分工作流；Softprobe 存证据。为 Softprobe LLM 捕获打标，见 [标注](/zh/evaluation/concepts/annotation)（分数绑定到 **span** / observation，带 **trace** 与 **session** id）。 |

相对仅 Langfuse 流程的改进：

- 不可变 **WorkflowVersion**，而非可变的任务配置行
- 显式 `missing_evidence` / `unsupported`，而非静默映射缺口
- 一套内核覆盖本地 CI 与托管 worker

## 从 Braintrust

| 你现在有 | Softprobe 路径 |
|----------|----------------|
| `Eval(data, task, scores)` | 公开 API：`framework suite + subject + environment + runner` |
| Experiments | **WorkflowRun** + 账本 |
| 在线打分规则 | 在线策略 + 框架 runner |
| Logs → dataset | [生产到评估闭环](/zh/evaluation/guides/production-to-eval-loop)，需审批 |

改进：

- **EnvironmentVersion** 隔离一等公民
- 工作流与事件包可移植导出
- 联邦 worker 支持私有数据驻留

## 并行运行

过渡期间，你可以把 Braintrust 或 Promptfoo 作为 **固定版本框架 runners** 运行，同时由 Softprobe 拥有工作流身份、证据与门禁。

参见 [生态映射](/zh/evaluation/concepts/ecosystem-mapping)。
