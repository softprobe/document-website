---
title: CLI reference
---

# CLI reference

Agent Evaluation commands extend the **`sp`** CLI with the same `--json` envelope as Testing. Commands resolve or execute a **WorkflowVersion** (framework suite + subject + environment + runner).

## Commands

| Command | Purpose |
|---------|---------|
| `sp eval pack` | Close FrameworkDefinition (hash all file refs) |
| `sp eval validate` | Validate pins, runner capabilities, closed definition |
| `sp eval run` | Execute FrameworkAttempt locally or on managed host |
| `sp eval compare` | Diff selected fields / projections across WorkflowRuns |
| `sp eval publish` | Upload local JSONL bundle to thelake (managed) |
| `sp eval promote` | Record authorized workflow/gate promotion for release audit |

## Pack and validate

```bash
sp eval pack --dir ./promptfoo-suite --out .softprobe/definition.json --json

sp eval validate \
  --definition .softprobe/definition.json \
  --runner promptfoo-runner@2.1.0 \
  --subject support-router@sha256:... \
  --environment ci-noop@sha256:... \
  --out .softprobe/workflow.resolved.json \
  --json
```

Returns typed diagnostics for unpinned files, disallowed capabilities, and runner compatibility — **no assertion translation and no model spend**.

## Run

```bash
sp eval run --workflow .softprobe/workflow.resolved.json \
  --out-dir .sp-work/runs/latest \
  --json
```

Local execution writes JSONL events plus content-addressed artifacts (including the native result bundle). Exit code `1` when **GateDecision** fails (unless `--no-gate`).

## Compare

```bash
sp eval compare --baseline run-a --candidate run-b \
  --gate-policy sha256:... \
  --json
```

Emits selected field/projection deltas and gate outcome for promotion workflows.

## JSON envelope

Same contract as [Testing output contract](/en/testing/agents/output-contract):

```json
{
  "ok": true,
  "command": "eval run",
  "data": { "workflow_run_id": "...", "gate": "pass" }
}
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success; gate passed (if evaluated) |
| 1 | API/kernel error or gate failed |
| 2 | Usage / invalid workflow |
| 3 | Auth / tenant context missing |

See [Result status](/en/evaluation/reference/result-status) for FrameworkAttempt statuses (distinct from CLI exit codes).
