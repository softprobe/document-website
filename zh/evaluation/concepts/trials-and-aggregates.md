---
title: Trial 与聚合
---

# Trial 与聚合

随机 Agent 需要 **trial**、**聚合** 与诚实的不确定性 — 但这些语义保持 **框架原生**（或仅作为可选 Softprobe 投影出现）。Softprobe 不把 Softprobe reducer 或 Softprobe trial 编排作为产品特性提供。

## 框架拥有的 Trial

Promptfoo、DeepEval 及类似工具可在各自 runner 内重复用例、变更种子并计算 pass@k。Softprobe 将其视为 **一次 FrameworkAttempt**，其原生结果包已包含 trial 细节。

```yaml
# Example: stays in Promptfoo / framework config — not Softprobe Suite YAML
# (illustrative)
trials:
  count: 5
  seed: 42
```

Softprobe 存储原生包 + 外层状态。它不会为每个框架内部 trial 发明 Softprobe `CaseRun` ID。

## Softprobe 可能看到的聚合

可选的 **分数投影** 可将选定的框架上报聚合提升供查询：

| 聚合（框架上报） | Softprobe 用途 |
|--------------------------------|---------------|
| 通过率 / 失败数 | 若显式选定，可作为门禁输入 |
| pass@k / 方差 | 可用时做查询投影 |
| 成对差值 | 投影后用于对比工作流 |

原生聚合细节留在结果包中。Softprobe 门禁策略不得假装 Softprobe 重新计算了框架断言。

## 对比 / 锦标赛评判

成对与列表式评判留在 **框架**（或专用 runner）中。Softprobe 的角色相同：钉死 runner + 环境、捕获证据、按外层状态与选定字段做门禁。

## 不稳定检测

对 hermetic FrameworkDefinition 重复 WorkflowRun。外层状态或选定原生摘要的大幅翻转，在晋升前表明基础设施或主体不稳定 — Softprobe 对比的是工作流运行，不是 Softprobe 自有的 reducer 状态。

## 相关

- [分数与门禁](/zh/evaluation/concepts/scores-and-gates)
- [生态方法族](/zh/evaluation/evaluators/)
- [结果状态](/zh/evaluation/reference/result-status)
