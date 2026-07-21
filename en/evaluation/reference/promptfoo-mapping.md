---
title: Promptfoo field mapping
---

# Promptfoo field mapping

This page moved. Softprobe does **not** maintain a complete Promptfoo-to-JSON field mapping — that approach does not scale as frameworks add assertion types.

**Read instead:**

- [Native model and adapters](/en/evaluation/concepts/native-model-and-adapters) — the product contract
- [Framework adapters](/en/evaluation/reference/framework-adapters) — how imports work, supported subset, diagnostics
- [Promptfoo integration](/en/evaluation/guides/promptfoo-integration) — coexistence during migration

**Author natively:**

```yaml
# suites/support-router-v1.yaml
cases:
  - id: billing_double_charge
    input:
      user_query: "I was charged twice for my subscription"
evaluators:
  - id: router.skill_match
    capability: builtin/deterministic/contains@1
    params: { pattern: billing-support }
environment:
  type: noop
```

See [Quick start](/en/evaluation/getting-started).
