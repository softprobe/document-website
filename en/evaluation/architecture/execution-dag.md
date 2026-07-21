---
title: Execution DAG
---

# Execution DAG

The compiler builds a **content-addressed DAG** — not a fixed “task then scores” loop.

## Full DAG

```text
resolve versions → generate/choose cases → allocate/reset environment
 → run subject trials → flush/wait for trace snapshot → normalize trajectory
 → materialize evidence → run item evaluators
 → run pair/group evaluators → human adjudication (optional)
 → aggregate + uncertainty → gates → publish/export
```

```mermaid
flowchart TB
  R[Resolve versions]
  G[Generate / choose cases]
  E[Allocate / reset environment]
  S[Run subject trials]
  T[Flush / wait trace snapshot]
  N[Normalize trajectory]
  V[Materialize evidence]
  I[Item evaluators]
  P[Pair / group evaluators]
  H[Human adjudication optional]
  A[Aggregate + uncertainty]
  GT[Gates]
  Pub[Publish / export]
  R --> G --> E --> S --> T --> N --> V --> I --> P --> H --> A --> GT --> Pub
```

## Parallelism model

```mermaid
flowchart TB
  subgraph perCase [Per case run parallelizable]
    CR1[CaseRun 1]
    CR2[CaseRun 2]
    CR3[CaseRun N]
  end
  subgraph serial [Serial within case run]
    S1[Subject rollout]
    S2[Evidence snapshot]
    S3[Evaluators depend on evidence]
  end
  CR1 --> S1 --> S2 --> S3
```

Case runs may execute concurrently subject to suite budgets; evaluators within a case run wait for evidence materialization.

## Node identity

Nodes are content-addressed where practical. Deterministic cache keys cover input digests, implementation digest, parameters, seed, and external-state fingerprint.

Cache hits are explicit reuse — never copied scores with rewritten provenance.

## Cache policy

| Node kind | Default cache |
|-----------|---------------|
| Pure hermetic | Eligible |
| Pinned external | Opt-in with response fingerprint scope |
| Live / human / side-effecting | Non-cacheable |

## Events per stage

Each stage emits typed events (`case.started`, `rollout.completed`, `evaluation.attempted`, …). See [Events](/en/evaluation/reference/events).

```mermaid
flowchart LR
  E1[run.planned]
  E2[case.started]
  E3[rollout.completed]
  E4[artifact.committed]
  E5[evaluation.attempted]
  E6[measurement.emitted]
  E7[gate.decided]
  E8[run.completed]
  E1 --> E2 --> E3 --> E4 --> E5 --> E6 --> E7 --> E8
```
