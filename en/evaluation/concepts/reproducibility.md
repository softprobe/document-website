---
title: Reproducibility
---

# Reproducibility

Every run records an honest **reproducibility class** — Softprobe does not overclaim bit-for-bit replay of opaque hosted models.

## Classes

| Class | Meaning |
|-------|---------|
| **hermetic** | All inputs, runtimes, models, seeds, env snapshots content-addressed; network disabled |
| **pinned_external** | Immutable provider/model requested; raw responses captured; provider infra external |
| **recorded_external** | Mutable/opaque dependency; request/response + timestamp captured for audit |
| **live** | Production state intentionally participates; re-score captured evidence only |

## Recorded metadata

RunManifest and events record:

- lockfiles and image digests
- evaluator prompts and model parameters
- seed derivation, locale, timezone
- concurrency, retries, redaction policy
- content hashes of artifacts

**Temperature 0 is not labeled deterministic** for LLM judges unless a hermetic fixture or recorded response scope applies.

## Cache eligibility

Only pure hermetic DAG nodes cache by default. Pinned-external nodes may opt in with validity scope including provider response identity. Live/human/mutable-remote nodes are non-cacheable unless a verified reuse scope is declared.

## Fork PR CI

Untrusted forks run secret-free deterministic fixtures for kernel plumbing — live provider comparison runs only on trusted branches with recorded adjudication of stochastic diffs.
