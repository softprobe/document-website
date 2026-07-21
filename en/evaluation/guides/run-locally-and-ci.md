---
title: Run locally and in CI
---

# Run locally and in CI

## Local run

```bash
sp eval validate --manifest suite.json --out manifest.resolved.json
sp eval run --manifest manifest.resolved.json --out-dir .softprobe/runs/$RUN_ID
```

Artifacts:

| File | CI use |
|------|--------|
| `junit.xml` | Test report ingestion |
| `report.md` | Human review |
| `events.jsonl` | Audit / replay |
| `artifacts/` | Evidence drill-down |

## GitHub Actions pattern

```yaml
- name: Validate eval suite
  run: sp eval validate --import promptfoo --config promptfooconfig.yaml --tests tests.yaml --out manifest.json

- name: Run prompt-only eval
  run: sp eval run --manifest manifest.json --gate routing-v1 --out-dir run-output

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
- Run `sp eval run --subject fixture:mock` only — no live provider secrets

Trusted branches run pinned-provider comparison with recorded stochastic adjudication.

## Gate failure behavior

Non-zero exit when **GatePolicyVersion** fails. Measurements and events remain for debugging — gate is recomputed, not deleted.

See [Compare and promote](/en/evaluation/guides/compare-and-promote).
