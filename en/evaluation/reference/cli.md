---
title: CLI reference
---

# CLI reference

Agent Evaluation commands extend the **`sp`** CLI with the same `--json` envelope as Testing. All commands resolve or execute against a **RunManifest**.

## Commands

| Command | Purpose |
|---------|---------|
| `sp eval validate` | Compile suite → manifest; lint imports (Promptfoo, etc.) |
| `sp eval run` | Execute manifest locally or against managed host |
| `sp eval compare` | Diff measurements/aggregates across runs |
| `sp eval publish` | Upload local JSONL bundle to thelake (managed) |
| `sp eval import promptfoo` | Translate `tests.yaml` / config → manifest fragment |

## Validate (Phase 0)

```bash
sp eval validate --import promptfoo \
  --config softprobe-code/packages/softprobecode-eval/tests.yaml \
  --json
```

Returns typed diagnostics for unsupported assertions, lossy mappings, and digest pins — **no model spend**.

## Run

```bash
sp eval run --manifest .sp-work/manifest.json \
  --out-dir .sp-work/runs/latest \
  --json
```

Local execution writes JSONL events plus content-addressed artifacts. Exit code `1` when **GateDecision** fails (unless `--no-gate`).

## Compare

```bash
sp eval compare --baseline run-a --candidate run-b \
  --gate-policy sha256:... \
  --json
```

Emits paired deltas, aggregate diffs, and gate outcome for promotion workflows.

## JSON envelope

Same contract as [Testing output contract](/en/testing/agents/output-contract):

```json
{
  "ok": true,
  "command": "eval run",
  "data": { "run_id": "...", "gate": "pass" }
}
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success; gate passed (if evaluated) |
| 1 | API/kernel error or gate failed |
| 2 | Usage / invalid manifest |
| 3 | Auth / tenant context missing |

See [Result status](/en/evaluation/reference/result-status) for per-evaluator attempt statuses (distinct from CLI exit codes).
