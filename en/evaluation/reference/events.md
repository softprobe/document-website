---
title: Events
---

# Events

The evaluation kernel appends **typed events** to an immutable ledger. Local runs write JSONL; managed runs append to thelake atomically with state transitions.

## Core event types

| Event | When |
|-------|------|
| `run.planned` | Manifest validated; DAG scheduled |
| `case.started` | CaseRun begins |
| `rollout.completed` | Subject finished; trace finalized |
| `artifact.committed` | Content-addressed bytes verified and registered |
| `evaluation.attempted` | Evaluator attempt finished (see [Result status](/en/evaluation/reference/result-status)) |
| `measurement.emitted` | Typed measurement recorded |
| `aggregate.emitted` | Reducer output recorded |
| `gate.decided` | GatePolicyVersion applied |
| `run.completed` | Terminal run state |

## Event envelope

Each event includes:

- `event_id`, `run_id`, monotonic sequence
- `type`, `timestamp`, `schema_version`
- Payload specific to type (e.g. measurement refs, artifact digests)
- Tenant/project context on managed ingestion

## Consistency

- **Artifact bytes** must be uploaded and hash-verified before `artifact.committed`.
- **Authoritative transaction** appends kernel event + ledger transition atomically.
- **Projectors** (score/run views) consume events asynchronously — may lag but cannot become source of truth.

## Local bundle layout

```text
.sp-work/runs/<run_id>/
  events.jsonl
  artifacts/<digest>/...
  manifest.resolved.json
```

Publishing validates signatures, manifest identity, and artifact hashes before managed append.

## Related

- [Storage and thelake](/en/evaluation/architecture/storage-and-thelake)
- [How it works](/en/evaluation/how-it-works)
