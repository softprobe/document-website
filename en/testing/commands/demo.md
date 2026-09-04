# demo

Run the bundled [Travel OTA](https://github.com/softprobe/demo-ota) demo locally with Docker.

## Commands

| Command | Description |
|---------|-------------|
| `sp demo start [--watch]` | Create app, apply policies, start Docker stack |
| `sp demo traffic` | Send sample booking traffic |
| `sp demo replay [--watch]` | Create replay plan against localhost OTA |
| `sp demo status` | Stack + agent + recording status |
| `sp demo stop` | Stop Docker stack |

## Examples

```bash
sp demo start --watch --json
sp demo traffic --json
sp demo replay --watch --json
sp demo status --json
sp demo stop --json
```

## `demo start`

Creates the demo application, sets default policies, and launches the Travel OTA containers with the Java recording agent attached.

### JSON output (`start`)

```json
{
  "ok": true,
  "command": "demo start",
  "data": {
    "appId": "travel-ota-app-1",
    "appName": "travel-ota",
    "demoUrl": "http://127.0.0.1:8080",
    "replayTarget": "http://travel-ota:8080",
    "workbenchUrl": "https://app.softprobe.ai/apps/travel-ota-app-1",
    "agentStatus": "online",
    "nextSteps": [
      "Send sample booking traffic: sp demo traffic --json",
      "Run replay: sp demo replay --watch --json"
    ]
  }
}
```

## `demo traffic`

Sends realistic flight search, booking, and payment traffic through the local Travel OTA service.

### JSON output (`traffic`)

```json
{
  "ok": true,
  "command": "demo traffic",
  "data": {
    "bookings": 5,
    "demoUrl": "http://127.0.0.1:8080",
    "appId": "travel-ota-app-1",
    "nextSteps": [
      "sp record case list --app travel-ota-app-1 --since -1h --json",
      "sp demo replay --watch --json"
    ]
  }
}
```

## `demo replay`

Creates a replay plan against the local Travel OTA instance and evaluates differences.

### JSON output (`replay`)

```json
{
  "ok": true,
  "command": "demo replay",
  "data": {
    "planId": "plan-travel-ota-101",
    "status": "FINISHED",
    "percent": 100,
    "finished": true,
    "totalCaseCount": 5,
    "successCaseCount": 5,
    "failCaseCount": 0,
    "workbenchUrl": "https://app.softprobe.ai/apps/travel-ota-app-1?tab=runs"
  }
}
```

## `demo status`

Reports demo container status, agent connectivity, recorded cases, and last replay plan.

### JSON output (`status`)

```json
{
  "ok": true,
  "command": "demo status",
  "data": {
    "appId": "travel-ota-app-1",
    "appName": "travel-ota",
    "demoUrl": "http://127.0.0.1:8080",
    "workbenchUrl": "https://app.softprobe.ai/apps/travel-ota-app-1",
    "stackRunning": true,
    "agentStatus": "online",
    "recordedCases": 5,
    "lastReplayPlanId": "plan-travel-ota-101"
  }
}
```

## `demo stop`

Stops the Docker stack while preserving recorded cases and application configuration in your tenant.

### JSON output (`stop`)

```json
{
  "ok": true,
  "command": "demo stop",
  "data": {
    "stopped": true,
    "appId": "travel-ota-app-1",
    "workbenchUrl": "https://app.softprobe.ai/apps/travel-ota-app-1",
    "nextSteps": [
      "Recordings remain in your tenant; restart with: sp demo start --watch"
    ]
  }
}
```

See [Getting Started](/en/testing/getting-started) for the full walkthrough.
