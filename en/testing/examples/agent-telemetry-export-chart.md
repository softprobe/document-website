---
title: Agent telemetry export + chart
---

# Agent telemetry export + chart

Softprobe agents can investigate logs and metrics with the existing `sp` CLI, write bound JSON exports under the workspace, and optionally chart them for Softprobe chat.

## Flow

1. Load the **`sp-telemetry`** skill (diagnose L0 router for missing agent logs, ingest/export metrics, init/wrap signals).
2. Resolve identity + `[since, until)` — fail fast if either is missing (no unbounded scans).
3. Discover filters when needed:

   ```bash
   sp logs schema --since <ISO> --until <ISO> --json
   sp metrics schema --since <ISO> --until <ISO> --json
   ```

4. Query with `--json` and write under `.spcode/{scope}/telemetry/` (for example `metrics-…json`, `logs-…json`).
5. When a plot is useful, load **`sp-chart`**: tabular data → PNG/SVG via host tooling → markdown `![…](relative/path.png)`.
6. Softprobe chat renders workspace-relative images inline — see [Launch Softprobe Web UI](/en/testing/installation/code.md#local-images-in-softprobe-chat).

## Related commands

- [`sp logs`](/en/testing/commands/logs.md)
- [`sp metrics`](/en/testing/commands/metrics.md)
