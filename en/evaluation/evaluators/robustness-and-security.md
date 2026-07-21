---
title: Robustness and security evaluators
---

# Robustness and security evaluators

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

- Generator lineage on derived CaseVersions
- Sandbox attestation and launch metadata
- Security incident artifacts when checks fail

## Resembles

Promptfoo red-team plugins, agent safety benchmarks, metamorphic testing literature.

## Extension rule

Case **Generators** produce variants; scorers grade outcomes in isolated EnvironmentVersion — never execute unbounded network in subject namespace.
