---
title: Execution DAG
---

# Execution DAG

The compiler builds a **content-addressed DAG** — not a fixed “task then scores” loop.

```text
resolve versions → generate/choose cases → allocate/reset environment
 → run subject trials → flush/wait for trace snapshot → normalize trajectory
 → materialize evidence → run item evaluators
 → run pair/group evaluators → human adjudication (optional)
 → aggregate + uncertainty → gates → publish/export
```

```mermaid
flowchart LR
  R[Resolve] --> G[Cases] --> E[Env] --> S[Subject]
  S --> T[Snapshot] --> N[Normalize] --> V[Evidence]
  V --> I[Item eval] --> P[Group eval] --> A[Aggregate]
  A --> GT[Gates] --> Pub[Publish]
```

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
