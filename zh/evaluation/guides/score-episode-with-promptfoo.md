---
title: 用 Promptfoo 给 episode 打分
---

# 用 Promptfoo 给 episode 打分

Promptfoo 仍是 **评估框架**。Softprobe 运行环境 episode，然后 **原生** 调用 Promptfoo，并保留完整原生结果包。

**不要**把原始历史 OTLP 当作一次评估。Softprobe 总会调用 Promptfoo；仅有历史 traces 永远不算已打分的运行。

## 何时用这条路径

| 你有… | 则… |
|-------|-----|
| 已完成的 episode（`finalOutput`、trajectory digest、可选 workspace digest） | 用 `@softprobe/promptfoo-adapter` 打分 |
| 只有旧的 OTLP 导出 | 打包 **trace export**，并用能映射它的框架 runner — 见 [在生产 OTEL traces 上跑 Promptfoo](/zh/evaluation/guides/promptfoo-online-otel) |
| RL / 训练循环 | 把 Promptfoo **排除在** `step()` 之外 — 之后再打分（[Gym 与训练](/zh/evaluation/guides/gym-and-training-rollouts)） |

## 示例：给 CRM 退款 episode 打分

```ts
import {
  executePromptfooEval,
  describeRunner,
  projectFrameworkResult,
} from "@softprobe/promptfoo-adapter";
import { validateFrameworkResultObject } from "@softprobe/agent";

// From your episode runner / LocalEpisodeRunner
const finalOutput = JSON.stringify({
  account_id: "A-42",
  action: "refund",
  amount_cents: 4200,
  note: "Refund A-42 for $42",
});
const trajectoryDigest = "sha256:9f2c…"; // digest of tool/fs steps
const sourceTraceId = "4bf92f3577b34da6a3ce929d0e0e4736";

console.log(describeRunner().trajectory_assertion_mapping);
// final_output_assertions: supported
// trajectory_step_assertions: supported
// historic_otlp_as_eval: unsupported

const { nativeBundle, frameworkResult } = await executePromptfooEval({
  attemptId: "fatt_crm_refund_001",
  finalOutput,
  trajectoryDigest,
  sourceTraceId,
  assertions: [
    { type: "contains", value: "A-42" },
    { type: "contains", value: "refund" },
    { type: "contains", value: trajectoryDigest },
  ],
  requestedMappings: ["final_output_assertions", "trajectory_step_assertions"],
});

validateFrameworkResultObject(frameworkResult);
// schema: softprobe.framework-result/v1

console.log(frameworkResult.findings[0]?.outcome); // passed | failed | …
console.log(frameworkResult.trace_links[0]);
// {
//   source_trace_id: "4bf92f…",
//   evaluator_trace_id: "…",
//   relation: "derived_from",
//   transform_digest: "sha256:…"
// }
```

## 你保留什么

| 产物 | 角色 |
|------|------|
| 原生 Promptfoo JSON 包 | 权威框架输出（分数、评分树、诊断） |
| `softprobe.framework-result/v1` | Softprobe 信封：attempt id、digests、findings、trace 链接 |
| 源 vs 评估器 traces | 用 `derived_from` 关联 — 从不改写成同一个 ID |

不支持的映射（例如请求 `historic_otlp_as_eval`）会抛出类型化错误 — Softprobe 不会静默改写 trace ID 来假装一次 Promptfoo 运行。

## 凭证

若 adapter 需要 Softprobe 云凭证，调用 `@softprobe/tracing` 辅助函数：

```ts
import {
  resolveSoftprobeConfigFromEnv,
  deriveOtlpEndpoint,
} from "@softprobe/promptfoo-adapter";
// re-exports from @softprobe/tracing — do not re-parse SOFTPROBE_* yourself
```

## 相关

- [Promptfoo 集成](/zh/evaluation/guides/promptfoo-integration)（工作流 / `sp eval` 路径）
- [录制与回放 agent 环境](/zh/evaluation/guides/record-replay-agent-environment)
- [框架 runners](/zh/evaluation/reference/framework-adapters)
