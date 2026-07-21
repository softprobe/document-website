---
title: Deterministic evaluators
---

# Deterministic evaluators

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
- Optional reference text from CaseVersion
- Environment state snapshots when rules target oracle fields

## Example measurements

| Measurement | Evaluator |
|-------------|-----------|
| `router.skill_match` | `icontains` → `billing-support` |
| `confidentiality.no_internal_terms` | `not-icontains` → `internal_db_schema` |

Promptfoo `icontains` / `not-icontains` map to builtin deterministic evaluators. See [Promptfoo field mapping](/en/evaluation/reference/promptfoo-mapping).

## Resembles

Promptfoo assertions, Langfuse CODE evaluators, Braintrust custom scorers with pure functions.

## Extension rule

Add a new deterministic scorer plugin — not a new core Measurement schema.
