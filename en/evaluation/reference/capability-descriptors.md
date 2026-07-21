---
title: Capability descriptors
---

# Capability descriptors

Every **EvaluatorVersion** declares a **capability descriptor** — the kernel's future-proofing mechanism. Unknown methods fail at **plan** time with `unsupported`, not at gate time with silent pass.

## Descriptor fields

| Field | Description |
|-------|-------------|
| Protocol / implementation version | Evaluator ABI level |
| Runtime | `wasm`, `oci`, `process`, `remote`, `builtin` |
| Topology | `item`, `pair`, `group`, `stream`, `aggregate` |
| Evidence selectors | Required artifacts; MIME/schema versions |
| Output schema | Measurement names, types, target scopes |
| Determinism | Hermetic / pinned_external / recorded_external / live |
| Seed support | Whether reducer/trial seeds apply |
| Batchability | Can score N items in one invocation |
| Cache policy | Eligibility for deterministic cache |
| Resources | Network, secrets, filesystem, GPU, model, budgets |
| Residency | Data sensitivity and region constraints |

## Protocol evolution

- Additive within a major version.
- **Minimum/maximum kernel protocol** on every descriptor.
- **Required capability IDs** — host executes only when all recognized.
- **Optional opaque extensions** (`Any` with type URL) preserved byte-for-byte.
- Unknown optional fields ignored; unknown **required** capabilities → `unsupported` at validate.

## Plugin roles

Descriptors attach to plugin kinds:

Generator · Subject · Environment · EvidenceAdapter · Evaluator · Reducer · Gate · Reporter

See [Plugin model](/en/evaluation/architecture/plugin-model).

## Conformance

The corpus includes old-host/new-manifest, new-host/old-manifest, downgrade refusal, extension round-trip, and unknown-capability fixtures.

## Related

- [Evaluator taxonomy](/en/evaluation/evaluators/)
- [Result status](/en/evaluation/reference/result-status)
