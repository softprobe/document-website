---
title: Meta-evaluation evaluators
---

# Meta-evaluation evaluators

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

Meta-eval runs as separate SuiteVersion over exported ledger snapshots — not inline during subject rollout.

## Resembles

Judge evaluation literature, Braintrust meta-experiments, benchmark hygiene tooling.

## Extension rule

Evaluators reading prior results use evidence selectors on ledger exports — no hidden reward channel bypassing Measurements.
