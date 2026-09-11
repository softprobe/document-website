---
title: Capability descriptors
---

# Capability descriptors

Every **RunnerVersion** and **EnvironmentVersion** declares a **capability descriptor** so Softprobe can reject incompatible WorkflowVersions at **plan/validate** time (`unsupported`) — never as a silent gate pass.

Descriptors are **not** Softprobe evaluator ABIs. Softprobe does not ship a Softprobe scorer plugin surface.

## Descriptor fields

| Field | Description |
|-------|-------------|
| Protocol / implementation version | Runner or environment ABI level |
| Runtime | `oci`, `process`, … |
| Result-bundle schema | Declared native output contract / size limits |
| Required mounts / network / secrets | Least-privilege grants |
| Determinism / reproducibility class | Hermetic / pinned_external / recorded_external / live |
| Resources | CPU, memory, GPU, time, cost budgets |
| Residency | Data sensitivity and region constraints |

## Protocol evolution

- Additive within a major version.
- **Minimum/maximum kernel protocol** on every descriptor.
- **Required capability IDs** — host executes only when all recognized.
- **Optional opaque extensions** preserved byte-for-byte.
- Unknown optional fields ignored; unknown **required** capabilities → `unsupported` at validate.

## What attaches descriptors

RunnerVersion · EnvironmentVersion · (host placement constraints)

SubjectVersion pins digests and model/tool identity; it does not declare Softprobe evaluator topologies.

## Conformance

The corpus includes old-host/new-manifest, new-host/old-manifest, downgrade refusal, extension round-trip, and unknown-capability fixtures.

## Related

- [Extension model](/en/evaluation/architecture/plugin-model)
- [Framework runners](/en/evaluation/reference/framework-adapters)
- [Result status](/en/evaluation/reference/result-status)
