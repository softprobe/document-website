---
title: Trials and aggregates
---

# Trials and aggregates

Stochastic agents need **trials**, **aggregates**, and honest uncertainty — but those semantics stay **framework-native** (or appear only as optional Softprobe projections). Softprobe does not ship Softprobe reducers or Softprobe trial orchestration as product features.

## Framework-owned trials

Promptfoo, DeepEval, and similar tools may repeat cases, vary seeds, and compute pass@k inside their own runners. Softprobe treats that as **one FrameworkAttempt** whose native result bundle already contains trial detail.

```yaml
# Example: stays in Promptfoo / framework config — not Softprobe Suite YAML
# (illustrative)
trials:
  count: 5
  seed: 42
```

Softprobe stores the native bundle + outer status. It does not invent Softprobe `CaseRun` IDs for each framework-internal trial.

## Aggregates Softprobe may see

Optional **score projection** may lift selected framework-reported aggregates for query:

| Aggregate (framework-reported) | Softprobe use |
|--------------------------------|---------------|
| pass rate / failed count | Gate input if explicitly selected |
| pass@k / variance | Query projection when available |
| paired deltas | Compare workflows when projected |

Native aggregate detail remains in the result bundle. Softprobe gate policies must not pretend Softprobe recomputed framework assertions.

## Comparative / tournament judges

Pairwise and listwise judges live in the **framework** (or a specialized runner). Softprobe’s role is the same: pin runner + environment, capture evidence, gate on outer status and selected fields.

## Flaky detection

Repeat WorkflowRuns of a hermetic FrameworkDefinition. Large flips in outer status or selected native summaries indicate infrastructure or subject instability before promotion — Softprobe compares workflow runs, not Softprobe-owned reducer state.

## Related

- [Scores and gates](/en/evaluation/concepts/scores-and-gates)
- [Ecosystem method families](/en/evaluation/evaluators/)
- [Result status](/en/evaluation/reference/result-status)
