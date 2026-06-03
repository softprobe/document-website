# Quickstart

End-to-end record-and-replay flow. All examples use `--json`; omit it for human-readable tables when the CLI supports them.

## Prerequisites

- `sp` on `PATH`
- sp-boot running at `http://127.0.0.1:8090`
- Valid `SP_TOKEN` or ability to log in
- `sp-agent.jar` available to attach to the Java service under test
- A Java service you can start with JVM flags and send traffic to

## 1. Setup

```bash
export SP_API_URL=http://127.0.0.1:8090
sp config init
sp auth login --email you@example.com --code 123456 --json
# or: export SP_TOKEN=<jwt-from-ui>
sp setup doctor --json
```

## 2. Create an app

Register the service under test:

```bash
sp app create order-service --json
```

Save `data.appId`. The same id must be used by the Java agent as `sp.app.id`.

## 3. List the app

Confirm the app exists:

```bash
sp app list --json
```

Example `data` shape:

```json
{
  "items": [
    { "appId": "a1b2c3d4e5f67890", "appName": "my-app", "agentStatus": "online" }
  ]
}
```

## 4. Set recording policy

Apply recording policy before starting the app with the agent:

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
```

On success, `data.valid` is `true`. On validation errors, exit `1` with structured `error` details.

If users will search by business identifiers such as `orderId`, configure extraction rules before generating traffic:

```bash
sp extraction-rule apply --app a1b2c3d4e5f67890 -f extraction-rules.yaml --json
```

## 5. Install the agent

Download the jar version bundled with your sp-boot release (default path under XDG data home):

```bash
sp agent download --json
# writes ${XDG_DATA_HOME:-~/.local/share}/softprobe/agent/sp-agent.jar
```

Or build locally from `sp-agent-java/sp-agent-jar/` and pass `--agent-jar`.

## 6. Run the app with the agent in record mode

Get copy-paste JVM flags (or use `--format shell` for a multiline script only):

```bash
sp agent command --app a1b2c3d4e5f67890 --app-jar target/order-service.jar --json
```

Use `data.startCommand` or `data.startCommandMultiline` from the envelope. Override storage/API hostnames when storage is not colocated with sp-boot:

```bash
sp agent command --app a1b2c3d4e5f67890 \
  --storage-host storage.example.com \
  --config-host storage.example.com \
  --json
```

Check that the backend sees the agent heartbeat, then send representative traffic through the running service:

```bash
sp app status a1b2c3d4e5f67890 --json
curl -sS http://127.0.0.1:8080/api/orders/ORD-123
```

Expected `data.status`: `online`.

## 7. List recorded cases

List cases recorded for the app and time window:

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --json
```

If extraction rules are configured, you can also find a recorded case by business id:

```bash
sp trace find \
  --app a1b2c3d4e5f67890 \
  --attr-name orderId \
  --attr-value ORD-123 \
  --json
```

Use the returned `traceId` to inspect the recording:

```bash
sp record trace <traceId> --json
sp record completeness --trace-id <traceId> --json
```

## 8. Set replay policy

Mock policy controls which dependencies are mocked during replay. Compare policy controls which differences matter.

```bash
sp policy mock validate -f mock.yaml --json
sp policy mock apply -f mock.yaml --json
sp policy compare validate -f compare.yaml --json
sp policy compare apply -f compare.yaml --json
```

## 9. Create a replay plan

Now that recorded cases exist and replay policy is set, create a replay plan. The CLI checks for recorded cases in the window first; if none exist, it fails with `NO_RECORDED_CASES` unless you pass `--allow-empty`:

```bash
sp replay run \
  --app a1b2c3d4e5f67890 \
  --env http://your-service:8080 \
  --from -24h \
  --enable-mock \
  --json
```

Capture `data.planId` (or `data.replayPlanId`) from the response.

## 10. Check replay results

```bash
sp replay status plan-abc123 --watch --json
sp replay case list --plan plan-abc123 --json
```

`--watch` polls until terminal state (`FINISHED`, `FAILED`, `CANCELLED`).

For failed cases in one step:

```bash
sp diagnose replay plan-abc123 --failed-only --out-dir .sp-work --json
```

Or manually: `sp replay case list --plan plan-abc123 --failed --json` then `sp replay diff get <diffId> --out-dir .sp-work --json`.

Full walkthrough: [Diagnose replay failure](/en/cli/examples/agent-diagnose-replay.md).
