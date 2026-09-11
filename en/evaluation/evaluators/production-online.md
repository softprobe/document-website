---
title: Production and online method family
---

# Production and online method family

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Online** workflows select production traces (filters, stable sampling, watermarks, budgets) and launch the **same framework runner** Softprobe uses offline. Softprobe supplies the online policy and evidence snapshot; the framework supplies the grading.

## What teams measure

- Continuous quality on live traffic
- Regression detection on production spans
- Backfill re-scoring when framework suite versions change
- Filtered subsets (e.g. diagnosis traces only)

## Softprobe policy controls

| Control | Purpose |
|---------|---------|
| Stable sampling | `hash(target_id + policy_version)` |
| Watermarks | Wait for late spans before runner start |
| Rate/cost limits | Cap spend |
| Exclusion tags | Skip eval-execution traces (loop guard) |

See [Online evaluation](/en/evaluation/concepts/online-evaluation) and [Promptfoo on production OTEL](/en/evaluation/guides/promptfoo-online-otel).

## Resembles

Langfuse live LLM-as-a-judge, Braintrust online scoring rules, continuous eval pipelines — wired through Softprobe as runners + online policy, not Softprobe-native scorers.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
