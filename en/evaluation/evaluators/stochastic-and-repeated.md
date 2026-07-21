---
title: Stochastic and repeated evaluators
---

# Stochastic and repeated evaluators

**Stochastic evaluators** use trial groups and reducers: pass@k, pass^k, best-of-n, variance, and stability metrics.

## What they measure

| Aggregate | Meaning |
|-----------|---------|
| pass@k | Success if any of k trials passes |
| pass^k | Success only if all k trials pass |
| best-of-n | Best measurement across n samples |
| Variance / CI | Stability across trials |

## Configuration

SuiteVersion declares trial count, seed derivation, and reducer bindings. Each trial is a distinct CaseRun with shared manifest pinning.

Promptfoo `--repeat` maps to kernel trial policy. See [Trials and aggregates](/en/evaluation/concepts/trials-and-aggregates).

## spcode note

Routing eval defaults to deterministic single-trial. Episode eval may use paired repeated trials when SubjectVersion has temperature &gt; 0.

## Resembles

Code generation pass@k benchmarks, Braintrust repeated experiment runs, Verifiers group scoring.

## Extension rule

Trial groups + Reducer plugins — measurements remain per-trial facts; aggregates are separate ledger records.
