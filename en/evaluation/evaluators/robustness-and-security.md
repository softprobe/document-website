---
title: Robustness and security evaluators
---

# Robustness and security evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Robustness evaluators** use perturbation, metamorphic tests, fuzzing, and red-team case generators with lineage, budgets, and safety sandboxes.

## What they measure

- Behavior under input perturbations
- Metamorphic relations (e.g. paraphrase invariance)
- Fuzz-generated edge cases
- Red-team success rate (jailbreak, exfiltration)

## Security test examples

Episode suites may include cases for:

- Prompt injection resistance
- Exfiltration of tenant secrets
- Malicious repo content handling
- Forbidden outbound network access

## Required evidence

- Generator lineage on derived framework cases
- Sandbox attestation and launch metadata
- Security incident artifacts when checks fail

## Resembles

Promptfoo red-team plugins, agent safety benchmarks, metamorphic testing literature.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
