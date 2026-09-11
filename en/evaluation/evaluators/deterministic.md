---
title: Deterministic evaluators
---

# Deterministic evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Deterministic evaluators** compare artifacts with exact rules: `equals`, `contains`, `not-contains`, regex, JSON Schema, AST match, policy rules, and unit tests.

They are pure scorers over typed artifacts — fast, hermetic, and ideal for CI.

## What they measure

| Check | Example |
|-------|---------|
| Exact match | Output equals expected string |
| Contains / not-contains | Skill name appears in routing response |
| Regex | Structured field matches pattern |
| JSON Schema | Tool args validate against schema |
| Policy rules | Forbidden strings absent |

## Required evidence

- Model output text or structured JSON
- Optional reference text from the framework case
- Environment state snapshots when rules target oracle fields

## Example measurements

| Measurement | Evaluator |
|-------------|-----------|
| `router.skill_match` | `icontains` → `billing-support` |
| `confidentiality.no_internal_terms` | `not-icontains` → `internal_db_schema` |

Promptfoo `icontains` / `not-icontains` stay in the **FrameworkDefinition**. Softprobe runs them via a pinned runner — it does not re-author them as Softprobe evaluators. See [Framework runners](/en/evaluation/reference/framework-adapters).

## Resembles

Promptfoo assertions, Langfuse CODE evaluators, Braintrust custom scorers with pure functions.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
