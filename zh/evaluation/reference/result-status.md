---
title: Result status
---

# Result status

每个 **FrameworkAttempt** 以带类型的 **result status** 结束。Status 不是分数——错误绝不会隐式变成 0 分。

## Status 取值

| Status | 含义 |
|--------|------|
| `succeeded` | Runner 已完成；之后可能有零个或多个投影测量值 |
| `invalid_input` | Definition、result bundle 或能力输入被拒绝 |
| `missing_evidence` | 缺少必需制品——显式失败，而非静默跳过 |
| `unsupported` | 在 plan 或 runtime 未识别该能力 |
| `timed_out` | Attempt 超出预算 |
| `cancelled` | WorkflowRun 已取消 |
| `resource_exhausted` | 配额、内存或成本上限触达 |
| `runner_error` | Framework runner 运行时失败 |
| `subject_error` | Subject 在 runner 完成前失败 |

## 规则

1. **`succeeded` 且无测量值**是合法的（投影可选；原生 bundle 仍可能很丰富）。
2. **切勿把错误映射为 score 0**——gate policy 必须显式处理缺失/失败的 attempt。
3. **外层重试**创建不可变的 FrameworkAttempt 记录，并关联到同一 WorkflowRun 槽位；确定性 result key 防止投影测量值重复。
4. 框架内部的重试/trial 留在 **原生 result bundle** 内——Softprobe 不会为它们发明 CaseRun ID。

## 与门禁的交互

Gate policy 引用外层 status，以及**显式选定**的 runner 上报字段或投影字段。常见模式：

```text
framework_attempt.status = succeeded
AND native.summary.failedCount = 0
```

## 诊断

`invalid_input`、`missing_evidence` 与 `unsupported` 会在事件 ledger 中包含结构化诊断（pack 阶段失败时也会出现在 `--json` validate 输出中）。

## 相关

- [事件](/zh/evaluation/reference/events)
- [CLI](/zh/evaluation/reference/cli)
- [分数与门禁](/zh/evaluation/concepts/scores-and-gates)
