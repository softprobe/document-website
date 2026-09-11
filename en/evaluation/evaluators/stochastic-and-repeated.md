---
title: Stochastic and repeated evaluators
---

# Stochastic and repeated evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Stochastic evaluators** use trial groups and reducers: pass@k, pass^k, best-of-n, variance, and stability metrics.

## What they measure

| Aggregate | Meaning |
|-----------|---------|
| pass@k | Success if any of k trials passes |
| pass^k | Success only if all k trials pass |
| best-of-n | Best measurement across n samples |
| Variance / CI | Stability across trials |

## Configuration

Trial count and reducers stay in the **framework** suite. Softprobe records one FrameworkAttempt whose native bundle may contain trial detail.

Promptfoo `--repeat` maps to kernel trial policy. See [Trials and aggregates](/en/evaluation/concepts/trials-and-aggregates).

## Note

Prompt-only suites default to deterministic single-trial. Environment-backed eval may use paired repeated trials when SubjectVersion has temperature &gt; 0.

## Resembles

Code generation pass@k benchmarks, Braintrust repeated experiment runs, Verifiers group scoring.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
