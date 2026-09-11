---
title: REST API
---

# REST API

Managed Agent Evaluation exposes a versioned REST API on **sp-backend** (same tenancy and auth as Testing). Local runs use JSONL bundles; publishing validates and appends through the ingestion transaction.

## Resource groups

| Group | Operations |
|-------|------------|
| **Workflows** | Resolve WorkflowVersion, get by digest, validate |
| **Runs** | Create (from WorkflowVersion), get, list, cancel |
| **Attempts** | FrameworkAttempt status and linkage |
| **Artifacts** | Get metadata by digest; fetch bytes (signed URL) |
| **Gates** | Get GateDecision for a WorkflowRun |
| **Events** | Append-only stream read (cursor pagination) |
| **Scores** | Query optional projected measurements |
| **Online policies** | CRUD for production sampling / backfill policies |

## Public resolve API

The ergonomic entry resolves user intent to a WorkflowVersion:

```http
POST /api/v1/eval/resolve
Content-Type: application/json

{
  "framework_definition": { "digest": "sha256:..." },
  "runner": { "version": "sha256:..." },
  "subject": { "version": "sha256:..." },
  "environment": { "version": "sha256:..." },
  "gate_policy": { "version": "sha256:..." }
}
```

Response: fully resolved **WorkflowVersion** with reproducibility class and capability negotiation result.

## Start a run (managed)

```http
POST /api/v1/eval/runs
Content-Type: application/json

{ "workflow_version_digest": "sha256:..." }
```

Returns `workflow_run_id` and streams events to the tenant eval ledger. Local CLI (`sp eval run`) uses the same WorkflowVersion semantics without this HTTP hop.

## Score writes (v2)

```http
POST /api/v2/scores
```

Accepts canonical `target_type` + `target_id`:

`span | trace | session | workflow_run | framework_attempt`

**Eval projections** during a WorkflowRun are emitted only by trusted hosts after a FrameworkAttempt — public clients do not synthesize Softprobe scorer output. The v2 write API remains for legacy telemetry, human-annotation ingest, and non-eval score paths; eval automation should use `sp eval run` / publish + query APIs instead.

v1 APIs remain for span/trace/session only. See [Score targets](/en/evaluation/reference/score-targets) and [Trust boundaries](/en/evaluation/architecture/trust-boundaries).

## Auth

Same API keys and JWT tenancy as Testing. Federated workers use short-lived credentials and signed event publication (Phase 5B).

## Clients

OpenAPI-generated clients ship with managed Phase 3. Until then, use `sp eval publish` and `sp eval compare --json` for automation.
