# demo

使用 Docker 在本地运行内置的 [Travel OTA](https://github.com/softprobe/demo-ota) 演示。

## Commands

| Command | Description |
|---------|-------------|
| `sp demo start [--watch]` | 创建应用、应用策略并启动 Docker 栈 |
| `sp demo traffic` | 发送示例预订流量 |
| `sp demo replay [--watch]` | 针对 localhost OTA 创建回放计划 |
| `sp demo status` | 栈、agent 及录制状态 |
| `sp demo stop` | 停止 Docker 栈 |

## 示例

```bash
sp demo start --watch --json
sp demo traffic --json
sp demo replay --watch --json
sp demo status --json
sp demo stop --json
```

## `demo start`

创建演示应用，配置默认策略，并启动挂载了 Java 录制 agent 的 Travel OTA 容器栈。

### JSON 输出 (`start`)

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

向本地 Travel OTA 服务发送真实的航班搜索、预订和支付流量。

### JSON 输出 (`traffic`)

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

对本地 Travel OTA 实例发起回放计划并比对差异。

### JSON 输出 (`replay`)

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

查看演示容器状态、agent 连接状态、已录制用例数及最近的回放计划。

### JSON 输出 (`status`)

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

停止本地 Docker 容器栈，租户中的应用及录制数据仍将保留。

### JSON 输出 (`stop`)

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

完整操作流程参见[快速开始](/zh/testing/getting-started)。
