---
title: Concepts overview
---

# Concepts overview

Read these pages in order to understand the runner-first model.

## Recommended reading order

1. [Mental model](/en/evaluation/mental-model) — workflow and ownership
2. [Native model and framework runners](/en/evaluation/concepts/native-model-and-adapters)
3. [Framework adapters](/en/evaluation/reference/framework-adapters)
4. [Data model](/en/evaluation/concepts/data-model)
5. [Evidence and trajectories](/en/evaluation/concepts/evidence-and-trajectories)
6. [Scores and gates](/en/evaluation/concepts/scores-and-gates)
7. [How it works](/en/evaluation/how-it-works)

## By persona

### Framework owner

| Topic | Page |
|-------|------|
| First run | [Quick start](/en/evaluation/getting-started) |
| Runner packaging | [Prepare a framework run](/en/evaluation/guides/author-a-suite) |
| Promptfoo specifics | [Promptfoo integration](/en/evaluation/guides/promptfoo-integration) |
| Adapter semantics | [Framework adapters](/en/evaluation/reference/framework-adapters) |

### Platform operator

| Topic | Page |
|-------|------|
| Trust boundaries | [Trust boundaries](/en/evaluation/architecture/trust-boundaries) |
| Storage and retention | [Storage and thelake](/en/evaluation/architecture/storage-and-thelake) |
| Runtime model | [Kernel and hosts](/en/evaluation/architecture/kernel-and-hosts) |

### CI / release owner

| Topic | Page |
|-------|------|
| Compare and promote | [Compare and promote](/en/evaluation/guides/compare-and-promote) |
| Result status | [Result status](/en/evaluation/reference/result-status) |
| Events | [Events](/en/evaluation/reference/events) |

## Key principle

Softprobe owns the **outer workflow and environment**, frameworks own **inner evaluation semantics**.

```text
framework-native suite + subject + controlled environment
→ framework runner
→ native result bundle + evidence
→ Softprobe compare/gate/governance
```
