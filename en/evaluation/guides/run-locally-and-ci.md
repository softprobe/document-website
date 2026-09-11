---
title: Run locally and in CI
---

# Run locally and in CI

## Local run

```bash
sp eval pack --dir ./promptfoo-suite --out .softprobe/definition.json
sp eval validate \
  --definition .softprobe/definition.json \
  --runner promptfoo-runner@2.1.0 \
  --out .softprobe/workflow.resolved.json
sp eval run --workflow .softprobe/workflow.resolved.json --out-dir .softprobe/runs/$RUN_ID
```

Artifacts:

| File | CI use |
|------|--------|
| Native JUnit / Markdown (from framework) | Test report ingestion |
| `events.jsonl` | Softprobe audit / replay |
| `artifacts/` | Evidence drill-down (incl. native result bundle) |

## GitHub Actions pattern

```yaml
- name: Pack and validate framework suite
  run: |
    sp eval pack --dir ./promptfoo-suite --out .softprobe/definition.json
    sp eval validate --definition .softprobe/definition.json --runner promptfoo-runner@2.1.0 --out .softprobe/workflow.json

- name: Run prompt-only eval
  run: sp eval run --workflow .softprobe/workflow.json --gate routing-v1 --out-dir run-output

- name: Upload eval artifacts
  uses: actions/upload-artifact@v4
  with:
    name: eval-${{ github.sha }}
    path: run-output/
    retention-days: 14
```

## Fork safety

Untrusted fork PRs:

- Run `sp eval validate` (always)
- Run `sp eval run` only with secret-free / fixture subjects — no live provider secrets

Trusted branches run pinned-provider comparison with recorded stochastic adjudication.

## Gate failure behavior

Non-zero exit when **GateDecision** fails. Evidence and events remain for debugging — the gate is recomputed under a new policy, not deleted.

See [Compare and promote](/en/evaluation/guides/compare-and-promote).
