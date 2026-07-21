---
title: Trials and aggregates
---

# Trials and aggregates

Stochastic agents and models require **trials**, **aggregates**, and honest uncertainty — not single-shot pass/fail.

## Trials

A **trial** repeats the same case × subject with a derived seed policy:

```yaml
trials:
  count: 5
  seed: 42
  policy: derived_per_case_run
```

Each trial produces its own CaseRun, Rollout, and measurements. Trials enable pass@k, pass^k, variance, and flaky detection.

## Aggregates

**Reducers** combine measurements across trials, cases, subjects, or comparison groups:

| Aggregate | Use |
|-----------|-----|
| `mean`, `quantiles` | Central tendency and tail latency |
| `pass@k`, `pass^k` | Stochastic success rates |
| `paired_delta` + bootstrap CI | Candidate vs baseline with uncertainty |
| `inter_rater_agreement` | Human evaluation |

Aggregates are ledger records with reducer provenance — not overloaded into score metadata.

## Group evaluators

**Pairwise**, **listwise**, and **tournament** judges run at group topology: one evaluator invocation sees multiple candidates with position randomization to reduce bias.

## Gates on aggregates

Gate policies may reference aggregates (`routing.pass_rate >= 0.95`) as well as per-case measurements.

## Flaky detection

Repeated runs of deterministic cases with `<= 2%` outcome flip rate (configurable) flag infrastructure or subject instability before promotion.

See [Stochastic and repeated evaluators](/en/evaluation/evaluators/stochastic-and-repeated).
