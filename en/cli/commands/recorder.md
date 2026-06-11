# Recorder Commands

Recorder commands query newly captured application logs from the Softprobe Recorder lakehouse. They are designed for humans, CI, and AI agents through the normal `sp` CLI JSON contract.

Phase one is logs-only. Traces, metrics, replay read migration, historical backfill, and direct lakehouse access are not part of this command surface.

## `sp recorder info`

Show Recorder product health without exposing catalog or object-store credentials.

```bash
sp recorder info --json
```

Example JSON shape:

```json
{
  "ok": true,
  "command": "recorder info",
  "data": {
    "healthy": true,
    "profile": "onprem-helm",
    "helmEnabled": true,
    "vector": "ready",
    "ingest": "ready",
    "query": "ready",
    "catalog": "ready",
    "storage": "ready",
    "maintenance": "ready"
  }
}
```

## `sp recorder logs`

Retrieve bounded log rows by correlation fields.

```bash
sp recorder logs --trace-id trace-123 --since 1h --limit 500 --json
sp recorder logs --replay-id replay-456 --limit 500 --json
```

Results are ordered by event time and include available trace, span, replay, session, and service metadata.

## `sp query`

Run a bounded read-only query against Recorder logs.

```bash
sp query 'SELECT timestamp, severity_text, body FROM logs WHERE trace_id = ? ORDER BY timestamp' \
  --param trace-123 \
  --limit 500 \
  --json
```

## `sp recorder query`

Use the explicit Recorder namespace for the same safe query contract.

```bash
sp recorder query \
  --sql 'SELECT timestamp, body FROM logs WHERE trace_id = ? ORDER BY timestamp' \
  --param trace-123 \
  --limit 500 \
  --json
```

## Safety Rules

- Use `--json` for AI agents and automation.
- Queries are read-only and limited to supported Recorder log tables in phase one.
- Mutating SQL, unsupported tables, missing bounds, and broad scans fail closed.
- CLI users and spcode never configure catalog URLs, object-store keys, or standalone query tools.
- On-prem deployment is enabled through the existing Softprobe Helm chart; production/SaaS manifests are not part of phase one.
