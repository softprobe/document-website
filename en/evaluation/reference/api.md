---
title: REST API
---

# REST API

Managed Agent Evaluation exposes a versioned REST API on **sp-backend** (same tenancy and auth as Testing). Local runs use JSONL bundles; publishing validates and appends through the ingestion transaction.

## Resource groups

| Group | Operations |
|-------|------------|
| **Manifests** | Resolve, get by digest, validate |
| **Runs** | Create (from manifest), get, list, cancel |
| **Measurements** | Query by run, case_run, target, evaluator |
| **Aggregates** | Get reducer outputs for a run |
| **Gates** | Evaluate GatePolicyVersion against run; get decision |
| **Artifacts** | Get metadata by digest; fetch bytes (signed URL) |
| **Events** | Append-only stream read (cursor pagination) |
| **Policies** | EvaluationPolicyVersion CRUD (online eval) |

## Public compile API

The ergonomic entry compiles user intent to a manifest:

```http
POST /api/v1/eval/compile
Content-Type: application/json

{
  "data": { "dataset_version": "sha256:..." },
  "subject": { "version": "sha256:..." },
  "evaluators": [{ "version": "sha256:..." }],
  "environment": { "version": "sha256:..." }
}
```

Response: fully resolved **RunManifest** with reproducibility class and capability negotiation result.

## Start a run (managed)

```http
POST /api/v1/eval/runs
Content-Type: application/json

{ "manifest_digest": "sha256:..." }
```

Returns `run_id` and streams events to the tenant eval ledger. Local CLI (`sp eval run`) uses the same manifest semantics without this HTTP hop.

## Score writes (v2)

```http
POST /api/v2/scores
```

Accepts canonical `target_type` + `target_id`:

`span | trace | session | rollout | case_run | run | comparison_group`

**Eval run measurements** are emitted only by the kernel during `evaluation.attempted` — public clients do not synthesize scorer output. The v2 write API remains for legacy telemetry, human-annotation ingest, and non-eval score paths; eval automation should use `sp eval run` / publish + query APIs instead.

v1 APIs remain for span/trace/session only. See [Score targets](/en/evaluation/reference/score-targets) and [Trust boundaries](/en/evaluation/architecture/trust-boundaries).

## Auth

Same API keys and JWT tenancy as Testing. Federated workers use short-lived credentials and signed event publication (Phase 5B).

## Clients

OpenAPI-generated clients ship with managed Phase 3. Until then, use `sp eval publish` and `sp eval compare --json` for automation.
