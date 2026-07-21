---
title: Promptfoo integration
---

# Promptfoo integration

Promptfoo remains a **supported authoring ecosystem**. Softprobe owns orchestration, storage, comparison, and gates.

## Three integration modes

### 1. Importer / compiler (primary)

`sp eval validate --import promptfoo` translates supported definitions into a **RunManifest**:

- Preserves adapter version, source-config digest, framework lockfile/runtime digests
- Emits typed warnings for lossy mappings
- Rejects unsupported assertions with specified diagnostics — never silent pass

Use in CI before model spend. Maps `tests.yaml` → CaseVersion + EvaluatorVersion — see [Promptfoo field mapping](/en/evaluation/reference/promptfoo-mapping).

### 2. Sandboxed evaluator component

The kernel invokes Promptfoo (or a subset) as **one DAG node**:

- Method-specific evaluation inside the node
- Returns measurements + native diagnostics as artifacts
- **May not** expand suite matrix, schedule trials, retry, or publish authoritative gates

### 3. Opaque legacy-run importer

Import a whole Promptfoo run as one non-cacheable external node:

- Framework-native IDs are provenance only
- No claim of item-level kernel portability unless adapter proves it

## Coexistence during migration

Phase 1–2 keep Promptfoo and kernel jobs **side-by-side** until:

- 8/8 cases import with parity
- 20 consecutive CI runs or 14-day soak at 100% deterministic-fixture parity
- 5+ trusted live-provider comparisons adjudicated

Only then may spcode retire duplicated internal Promptfoo CI — the **public adapter** remains a product feature.

## What Softprobe adds beyond Promptfoo

| Promptfoo | Softprobe |
|-----------|-----------|
| Matrix eval + local SQLite | Portable manifest + thelake ledger |
| Assertion library | Same + outcome verifiers + trajectory + gates |
| `promptfoo view` | Artifacts + API + managed compare |

## External pass/fail

Promptfoo pass/fail may be retained as a **measurement** or diagnostic. **GateDecision** always comes from kernel **GatePolicyVersion**.
