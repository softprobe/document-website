---
sidebar_position: 20
sidebar_label: Java agent diagnosis
title: Diagnose Java agent init and wrap conflicts
description: Find Softprobe Java agent transform, wrap, and peer signals with sp logs and sp metrics (no replay trace_id required).
---

# Diagnose Java agent init and wrap conflicts

When Softprobe is attached but recording looks incomplete—or another APM agent may be wrapping the same servlet streams—use **agent diagnostic logs** (primary) and **R4 metrics** (secondary). These signals do **not** require a replay `trace_id`.

## Filter by process identity

Every Softprobe agent export carries:

| Filter key | Meaning |
|------------|---------|
| `service_name` | Service name (often same as Softprobe app id) |
| `sp_app_id` | Softprobe app id |
| `host_name` | Runtime hostname |

```bash
sp logs --source agent --since "$SINCE" --until "$UNTIL" \
  -f sp_app_id="$APP" -f host_name="$HOST"
```

## Transform class inventory

Successful and failed instrumentation transforms export one log per event. The **full class name is in the log body** (not as a high-cardinality attribute).

```bash
sp logs --source agent --since "$SINCE" --until "$UNTIL" \
  -f logger_name=agent.transform.success

sp logs --source agent --since "$SINCE" --until "$UNTIL" \
  -f logger_name=agent.transform.error

sp metrics --metric-name sp.agent.transform --since "$SINCE" --until "$UNTIL" \
  -f result=success
```

## Wrap conflicts and peer agents

```bash
sp logs --source agent --since "$SINCE" --until "$UNTIL" \
  -f logger_name=agent.wrap.conflict

sp logs --source agent --since "$SINCE" --until "$UNTIL" \
  -f logger_name=agent.peer.detected

sp metrics --metric-name sp.agent.wrap --since "$SINCE" --until "$UNTIL"
sp metrics --metric-name sp.agent.peer.agents --since "$SINCE" --until "$UNTIL"
```

Foreign servlet wrappers are skipped by default so peer agents are less likely to hit `ClassCastException`.
