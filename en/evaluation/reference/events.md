---
title: Events
---

# Events

The evaluation kernel appends **typed events** to an immutable ledger. Local runs write JSONL; managed runs append to thelake atomically with state transitions.

Canonical names (design contract):

```text
workflow.validated
framework.attempted
artifact.committed
framework.result.accepted
gate.decided
workflow.completed
```

Other pages must link here — do not invent parallel Softprobe event vocabularies.

## Core event types

| Event | When |
|-------|------|
| `workflow.validated` | WorkflowVersion validated; outer attempt may start |
| `framework.attempted` | FrameworkAttempt began or progressed (payload carries status) |
| `artifact.committed` | Content-addressed bytes verified and registered |
| `framework.result.accepted` | Native result bundle accepted against declared schema/limits |
| `gate.decided` | Gate policy applied → GateDecision |
| `workflow.completed` | WorkflowRun reached a terminal state |

Framework-internal case/trial events stay inside the **native result bundle**.

Optional projected measurements may appear as ledger/projection records after `framework.result.accepted`; they are not Softprobe evaluator attempts.

## Event envelope

Each event includes:

- `event_id`, `workflow_run_id`, monotonic sequence
- `type`, `timestamp`, `schema_version`
- Payload specific to type (artifact digests, status, gate reasons)
- Tenant/project context on managed ingestion

## Consistency

- **Artifact bytes** must be uploaded and hash-verified before `artifact.committed`.
- **Authoritative transaction** appends kernel event + ledger transition atomically.
- **Projectors** (score/run views) consume events asynchronously — may lag but cannot become source of truth.

## Local bundle layout

```text
.sp-work/runs/<workflow_run_id>/
  events.jsonl
  artifacts/<digest>/...
  workflow.resolved.json
```

Publishing validates signatures, WorkflowVersion identity, and artifact hashes before managed append.

## Related

- [Storage and thelake](/en/evaluation/architecture/storage-and-thelake)
- [How it works](/en/evaluation/how-it-works)
- [Result status](/en/evaluation/reference/result-status)
