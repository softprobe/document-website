---
title: Score an episode with Promptfoo
---

# Score an episode with Promptfoo

Promptfoo remains the **evaluation framework**. Softprobe runs the environment episode, then invokes Promptfoo **natively** and keeps the full native result bundle.

Do **not** treat raw historic OTLP as an evaluation. Softprobe always invokes Promptfoo; historic traces alone never count as a graded run.

## When to use this path

| You have… | Then… |
|-----------|--------|
| A finished episode (`finalOutput`, trajectory digest, optional workspace digest) | Score with `@softprobe/promptfoo-adapter` |
| Only an old OTLP export | Package a **trace export** and use a framework runner that maps it — see [Promptfoo on production OTEL traces](/en/evaluation/guides/promptfoo-online-otel) |
| An RL / training loop | Keep Promptfoo **out** of `step()` — score afterward ([Gym and training](/en/evaluation/guides/gym-and-training-rollouts)) |

## Example: grade a CRM refund episode

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

## What you keep

| Artifact | Role |
|----------|------|
| Native Promptfoo JSON bundle | Authoritative framework output (scores, grading tree, diagnostics) |
| `softprobe.framework-result/v1` | Softprobe envelope: attempt id, digests, findings, trace links |
| Source vs evaluator traces | Linked with `derived_from` — never rewritten into one ID |

Unsupported mappings (for example requesting `historic_otlp_as_eval`) throw a typed error — Softprobe will not silently rewrite trace IDs to fake a Promptfoo run.

## Credentials

If the adapter needs Softprobe cloud credentials, call `@softprobe/tracing` helpers:

```ts
import {
  resolveSoftprobeConfigFromEnv,
  deriveOtlpEndpoint,
} from "@softprobe/promptfoo-adapter";
// re-exports from @softprobe/tracing — do not re-parse SOFTPROBE_* yourself
```

## Related

- [Promptfoo integration](/en/evaluation/guides/promptfoo-integration) (workflow / `sp eval` path)
- [Record and replay an agent environment](/en/evaluation/guides/record-replay-agent-environment)
- [Framework runners](/en/evaluation/reference/framework-adapters)
