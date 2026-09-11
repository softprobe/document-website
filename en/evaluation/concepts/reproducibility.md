---
title: Reproducibility
---

# Reproducibility

Every WorkflowRun records an honest **reproducibility class** — Softprobe does not overclaim bit-for-bit replay of opaque hosted models.

## Classes

| Class | Meaning |
|-------|---------|
| **hermetic** | All inputs, runtimes, models, seeds, env snapshots content-addressed; network disabled |
| **pinned_external** | Immutable provider/model requested; raw responses captured; provider infra external |
| **recorded_external** | Mutable/opaque dependency; request/response + timestamp captured for audit |
| **live** | Production state intentionally participates; re-score captured evidence only |

## Recorded metadata

WorkflowVersion and events record:

- FrameworkDefinition digest and closed file set
- RunnerVersion package/lockfile/image digests
- SubjectVersion and EnvironmentVersion digests
- seed derivation (when declared), locale, timezone
- concurrency, retries, redaction policy
- content hashes of EvidenceArtifacts

**Temperature 0 is not labeled deterministic** for LLM judges unless a hermetic fixture or recorded response scope applies.

## Cache eligibility

Opaque framework runners are **non-cacheable by default**. Pure Softprobe control-plane checks may cache when hermetic. Live/human/mutable-remote nodes are non-cacheable unless a verified reuse scope is declared.

## Fork PR CI

Untrusted forks run secret-free deterministic fixtures for kernel plumbing — live provider comparison runs only on trusted branches with recorded adjudication of stochastic diffs.
