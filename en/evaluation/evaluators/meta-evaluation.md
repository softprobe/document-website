---
title: Meta-evaluation evaluators
---

# Meta-evaluation evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Meta-evaluators** judge other judges: calibration vs human labels, inter-rater agreement, position bias, benchmark leakage, and contamination detection.

They may consume prior result sets as datasets — still emit standard measurements with full provenance.

## What they measure

| Check | Purpose |
|-------|---------|
| Judge calibration | LLM judge vs human gold |
| Agreement | Cohen's kappa across raters |
| Position bias | Pairwise judge order effects |
| Leakage | Training/eval overlap detection |
| Contamination | Benchmark memorization signals |

## Required evidence

- Prior Run measurements and aggregates (by reference)
- Human gold labels on calibration splits
- Dataset lineage and split labels (`held_out_release`)

## Workflow

Meta-eval runs as a **separate FrameworkDefinition** over exported snapshots — not inline inside Softprobe subject rollout.

## Resembles

Judge evaluation literature, Braintrust meta-experiments, benchmark hygiene tooling.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
