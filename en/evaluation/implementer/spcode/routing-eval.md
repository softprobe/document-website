---
title: Routing eval
---

# Softprobe Code routing eval

Routing eval tests production **`diagnose.txt`** skill selection and confidentiality — the same boundary as today's Promptfoo suite in `packages/softprobecode-eval`.

## What it measures

| Measurement | Method |
|-------------|--------|
| `routing.skill_match` | Output contains expected skill (`sp-diagnosis`, `sp-agent-onboarding`, …) |
| `confidentiality.no_internal_storage` | Output excludes prohibited internal terms |

## What it does not measure

- Whether OpenCode loads the skill
- Whether tools are called correctly
- Whether diagnosis finds root cause

Those require [Troubleshooting episodes](/en/evaluation/guides/spcode/troubleshooting-episodes).

## Example case (from tests.yaml)

```yaml
- description: Route replay failure diagnostics to sp-diagnosis
  vars:
    system_prompt: "file://../spcode-plugin/src/prompts/diagnose.txt"
    user_query: "Why did my replay of travel-ota fail with unexpected diffs?"
  assert:
    - type: icontains
      value: "sp-diagnosis"
    - type: not-icontains
      value: "sp_storage_db"
```

## Subject (Phase 1)

```text
SubjectVersion:
  prompt_digest: sha256:diagnose.txt…
  provider: vertex:gemini-2.5-flash
  temperature: 0
  instruction_template: routing_confirmation  # asks model to name skill only
EnvironmentVersion: noop
```

## Commands

```bash
# Lint / compile (no model cost)
sp eval validate --import promptfoo \
  --config promptfooconfig.yaml --tests tests.yaml --out manifest.json

# Offline CI (fixture subject)
sp eval run --manifest manifest.json --subject fixture:mock-routing --out-dir run/

# Trusted branch live provider
sp eval run --manifest manifest.json --out-dir run/ --gate routing-v1
```

## Parity with Promptfoo

Run Promptfoo and kernel side-by-side until [Promptfoo integration exit gates](/en/evaluation/guides/promptfoo-integration#coexistence-during-migration) pass. Promptfoo remains rollback path via workflow config revert.

See [Promptfoo integration](/en/evaluation/guides/promptfoo-integration).
