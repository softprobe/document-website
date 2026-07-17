> 本页翻译可能滞后于英文版，如有出入以[英文版](/en/testing/commands/logs)为准。

# sp logs

**Agent 何时使用：** 无需直接访问 Parquet 文件或存储凭据，即可在调用方提供的时间范围内，检索某个 W3C trace 的应用、agent 和 sp-backend 关联日志。

**前置条件：** 已启用统一日志管道（Vector 采集 + Parquet 存储 + 查询接线）。参见[安装 sp-backend（服务端）— 统一日志管道](/zh/testing/installation/server#unified-log-pipeline)和[日志关联 ID](/zh/testing/reference/log-correlation-ids)。

v1 **仅支持 trace-id、固定查询**——没有 SQL、没有即席查询语言、没有 `sp logs status` 健康检查命令，也没有 replay/plan 查询键。

**API：** sp-backend 上的 `GET /api/recorder/logs?trace_id=…&since=…&until=…`。顶层命令 **`sp logs`** 使用相同的契约。

---

## 概要

在调用方提供的时间窗口内，按 **`trace_id`** 查询统一日志行。

```bash
sp logs --trace-id <id> --since <time> --until <time> [--json]
```

## 标志

| Flag | 是否必填 | 说明 |
|------|----------|-------------|
| `--trace-id` | 是 | W3C trace id——**v1 唯一的查询键** |
| `--since` | 是 | 包含式下界——ISO-8601 UTC（例如 `2026-06-27T10:00:00Z`） |
| `--until` | 是 | 排除式上界——ISO-8601 UTC |
| `--json` | 否 | 用于自动化和 Agent Skills 的稳定 JSON 封装 |

规则：

- 每次查询都必须提供 **`--trace-id`**、**`--since`** 和 **`--until`**。时间范围是半开区间：`[since, until)`。
- v1 不提供 `--limit` 或行截断——请缩小时间窗口，或在本地过滤（`grep`、`tail`、重定向到文件）。
- 不支持的查询键（`--replay-id`、`--plan-id`、`--plan-item-id`、`--include-recording-log`）会在读取 Parquet 之前校验失败。
- 只要能访问到部署端点，v1 日志查询无需身份认证。
- 当日志管道被禁用或查询依赖不可用时，命令会快速失败并给出清晰的错误。它不会返回空的成功结果，也不会回退到旧版日志存储。

---

## 示例

```bash
# 回放失败后按 trace 范围查询（从 replay API 或 pytest 输出中获取 trace_id）
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  --json

# 人类可读输出
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z

# 结果较大——重定向或用管道（v1 没有 --limit）
sp logs --trace-id 2057ad46a7ce03d3955385f2a4142d29 --since … --until … > /tmp/trace.log
grep ERROR /tmp/trace.log | head -20
```

Agent Skills 工作流（CLI 或 API）：

```bash
# 标准 CLI
sp logs --trace-id "$TRACE_ID" --since "$SINCE" --until "$UNTIL" > .spcode/unified-logs-"$TRACE_ID".log
grep ERROR .spcode/unified-logs-"$TRACE_ID".log | head -20

# HTTP API（相同契约）
curl -s "$SP_API_URL/api/recorder/logs?trace_id=$TRACE_ID&since=$SINCE&until=$UNTIL" > .spcode/unified-logs-"$TRACE_ID".json
```

---

## 输出

**人类可读（默认）：** 按时间顺序的日志流——每行一条记录，包含时间戳、严重级别、`source`、`service_name` 和正文。

**`--json`：** 相同的逻辑数据，采用标准 CLI 封装（`ok`、`command`、`data`）。顶层 `data` 字段：

| Field | 含义 |
|-------|---------|
| `lookup` | 查询类型（`trace`）、查询值，以及调用方的 `[since, until)` 边界 |
| `rows` | 日志行——参见[日志查询字段](./log-query-fields) |
| `warnings` | 非致命的 schema 跳过或类似提示（可能为空） |

v1 响应**不**包含 `source_summary`，也不做按来源的行数分桶统计。

各行**不**包含 pytest 标签、套件名称或测试节点 id。

当发射端具备相应上下文时，可选的 Softprobe 标签（`replay_id`、`plan_id`、`plan_item_id`……）可能出现在个别行上——它们不是过滤键。

---

## 按 case 范围查询（双窗口） {#case-scoped-lookup-dual-windows}

在诊断某个**回放 case** 时，你通常会有两个时间戳：

- **`recordTime`**——case 最初被录制的时间（API 字段 `recordTime`；老 backend 没有该字段——退回 `requestDateTime` 会把录制窗锚偏，因为它是**回放请求发出时刻**，不是录制时刻）
- **`replayTime`**——回放运行执行的时间

**不要**在一次请求中从 `recordTime` 一直查询到 `replayTime`。那会跨越其间的每一个分钟分区，可能扫描数百个 Parquet 文件。

正确做法是运行**两次**窄范围查询（在每个锚点前后各 ±2 分钟），并在客户端合并各行：

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="<32-hex from replay case traceId>"
RECORD_TIME_MS=1714000000000   # recordTime from case row（requestDateTime 仅老 backend 降级用）
REPLAY_TIME_MS=1714046100000   # replayTime from case row
PADDING_MS=$((2 * 60 * 1000))

# Window 1: recording
RECORD_SINCE=$(date -u -d "@$(( (RECORD_TIME_MS - PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)
RECORD_UNTIL=$(date -u -d "@$(( (RECORD_TIME_MS + PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${RECORD_SINCE}&until=${RECORD_UNTIL}" \
  -H "Accept: application/json" -o /tmp/sp-logs-record.json

# Window 2: replay
REPLAY_SINCE=$(date -u -d "@$(( (REPLAY_TIME_MS - PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)
REPLAY_UNTIL=$(date -u -d "@$(( (REPLAY_TIME_MS + PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${REPLAY_SINCE}&until=${REPLAY_UNTIL}" \
  -H "Accept: application/json" -o /tmp/sp-logs-replay.json

# Merge and sort by timestamp (example with jq)
jq -s '[.[].rows[]] | sort_by(.timestamp)' /tmp/sp-logs-record.json /tmp/sp-logs-replay.json
```

SoftProbe 工作台的 **View case logs** 操作会自动使用相同的双窗口模式。两个窗口正常都应有行：录制窗为空意味着锚点错了（老 backend 上退回了 `requestDateTime`）或录制日志真的缺失——要排查，不能当正常现象。回放本身超过 ~2 分钟时，±2m 双窗会漏中段——改用显式 `since`/`until` 圈住整个回放期。

参见[日志查询字段](./log-query-fields)和[日志关联 ID](/zh/testing/reference/log-correlation-ids)。

---

## 排查回放失败 {#troubleshooting-failed-replays}

在 `sp diagnose replay` 或 pytest 失败之后使用。id 来源参见[日志关联 ID](/zh/testing/reference/log-correlation-ids)。

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="<32-hex from replay case traceId or pytest correlation block>"
SINCE="2026-06-27T10:00:00Z"
UNTIL="2026-06-27T10:05:00Z"

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o /tmp/sp-logs.json

jq '.rows | length' /tmp/sp-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/sp-logs.json
jq '.warnings' /tmp/sp-logs.json
jq -r '.rows[] | select(.source=="backend" and .severity=="ERROR") | .body' /tmp/sp-logs.json | head -20
```

| 现象 | 可能原因 |
|---------|----------------|
| 0 行 + `warnings` 非空 | Backend Parquet 读取器与 schema 不同步——重新构建 sp-backend 镜像 |
| 0 行，`warnings` 为空 | `trace_id`、时间窗口有误，或采集尚未刷盘 |
| 来自 `agent`、`app` 和 `backend` 的日志行 | 管道正常——检查 diff 制品，并查看日志 `body` 了解 compare/mock 时序 |

**Pytest：** 在失败输出中查看 **Softprobe correlation**（`trace_id`）和 **Unified logs**（行数/来源汇总）。

**Agent Skills：** 优先用 shell（`curl`、`jq`、`grep`）——不要在插件代码中实现 Parquet 读取器。

---

### JSON 输出

```json
{
  "ok": true,
  "command": "logs",
  "data": {
    "lookup": {
      "type": "trace",
      "value": "2057ad46a7ce03d3955385f2a4142d29",
      "windows": [
        {
          "since": "2026-06-27T10:00:00Z",
          "until": "2026-06-27T10:02:00Z"
        }
      ]
    },
    "rows": [
      {
        "timestamp": "2026-06-27T10:00:10.123Z",
        "severity": "WARN",
        "body": "Replay comparison mismatch",
        "service_name": "sp-backend",
        "source": "backend",
        "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
        "span_id": "8d10c94a2a6f4e11",
        "replay_id": "6891fd300c676b31"
      }
    ],
    "warnings": []
  }
}
```

### JSON 错误

校验和 API 失败使用标准 CLI stderr 封装：

```json
{
  "ok": false,
  "command": "logs",
  "error": {
    "code": "API_ERROR",
    "message": "API error 1: trace_id is required",
    "httpStatus": 200,
    "backend": {
      "responseCode": 1,
      "responseDesc": "trace_id is required"
    }
  }
}
```

校验消息示例：`trace_id is required`、`unsupported logs query parameter: replay_id`、`since is required`、`until is required`、`since must be before until`、`since and until must be ISO-8601 UTC timestamps`、`unsupported logs query parameter: <name>`、`log pipeline is disabled`、`log pipeline is unavailable`。

---

## REST 映射

| CLI | Method | Path |
|-----|--------|------|
| `--trace-id` | GET | `/api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>` |

与其他 `sp` 命令托管在同一个 sp-backend 基础 URL 上。只要能访问到部署端点，v1 日志查询无需身份认证。

---

## 已废弃命令（v1）

以下统一化之前的路径已被移除，且没有做兼容垫片：

| 已废弃 | 替代方案 |
|---------|-------------|
| `sp record logs overview` | `sp logs --trace-id <id> --since … --until …` |
| `sp record logs download` | `sp logs --trace-id <id> …`（重定向到文件）或 `--json` 配合 `jq` |
| `sp replay logs`（包括 `--overview`） | `sp logs --trace-id <id> …`（重定向到文件）或 `--json` 配合 `jq` |
| `sp logs --replay-id`、`--plan-id`、`--plan-item-id` | **拒绝**——仅使用 `--trace-id` |
| `--include-recording-log` | **已移除**——不支持 record-link 查询 |
| `GET /api/record-logs/*` | `GET /api/recorder/logs?trace_id=…` |
| `GET /api/replay-logs/*` | `GET /api/recorder/logs?trace_id=…` |

---

## 不在范围内（v1）

- `sp logs status` / 管道健康状态命令
- Replay-id、plan-id 或 plan-item-id 查询键
- 直接的 Parquet 路径、catalog URL、对象存储凭据或 SQL
- 查询结果中的 `sp.session_id`
- `--limit` / 行截断——请改为缩小时间边界或在本地过滤
- 日志查询的身份认证
- Record trace 表、metrics 表、回放读取迁移、历史回填，以及非回放路径的服务日志（dashboard、auth 等）——回放**数据**仍保留在旧版兼容回放的存储路径上

---

## 相关

- [日志查询字段](./log-query-fields)——行字段参考（FR-042）
- [日志关联 ID——查找并使用 id](/zh/testing/reference/log-correlation-ids)
- [sp replay case](./replay-case)
- [sp diagnose replay](./diagnose)
- [诊断回放失败示例](/zh/testing/examples/agent-diagnose-replay)
