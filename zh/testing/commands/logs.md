---
title: sp logs：按 trace 查日志
---

# sp logs：按 trace 查日志

按 `trace_id` 查出一次请求在被测服务、Java Agent 和 sp-backend 上留下的日志。回放失败后，用它同时看录制时和回放时发生了什么。

后端需要开启统一日志：单机部署默认开启，Kubernetes 部署见 [Kubernetes 部署（Helm）— 统一日志管道](/zh/testing/installation/server#unified-log-pipeline)。统一日志没开或不可用时，查询会直接报错，不会返回空结果。

`trace_id` 从哪里拿：[概念与编号 — 编号](/zh/testing/agents/concepts#ids)。

## 用法 {#synopsis}

```bash
sp logs --trace-id <id> --since <时间> --until <时间> [--json]
```

## 参数 {#flags}

| 参数 | 必填 | 说明 |
|------|------|------|
| `--trace-id` | 是 | 请求的 W3C trace ID |
| `--since` | 是 | 时间窗起点（含），ISO-8601 UTC 格式，如 `2026-06-27T10:00:00Z` |
| `--until` | 是 | 时间窗终点（不含），ISO-8601 UTC 格式 |
| `--json` | 否 | 输出标准 JSON 信封，供脚本和 AI 代理使用 |

三个查询参数都必须给。没有 `--limit`，结果多时重定向到文件再在本地过滤。`sp logs` 没有其他过滤参数；要按某次回放或录制/回放阶段过滤，请直接调用下面的 HTTP 接口。

## 示例 {#examples}

```bash
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  --json > /tmp/trace-logs.json

jq '.data.rows | length' /tmp/trace-logs.json
jq -r '.data.rows[] | select(.severity=="ERROR") | "\(.timestamp) \(.source) \(.body)"' /tmp/trace-logs.json | head -20
```

不带 `--json` 时，每行日志输出一行：时间、级别、`source`、`service_name` 和日志内容。

## HTTP 接口 {#http-api}

```http
GET /api/recorder/logs?trace_id=<id>[&since=<ts>&until=<ts>][&replay_id=…][&plan_id=…][&plan_item_id=…][&mode=record|replay][&source=…]
```

接口比命令多几项能力：

- **`since`、`until` 可以不传，但要么都传，要么都不传。** 都不传时，后端根据这条 trace 自己算时间窗，每段前后各留 2 分钟：录制前后一段；带了 `replay_id` 时加上这次回放前后一段，不带时加上这条 trace **最近 8 次**回放前后各一段（更早的回放会跳过，并给出提示）。只传其中一个会被拒绝。
- **时间窗太宽时会换掉。** 传入的时间窗超过 3 小时时，如果能根据 trace 算出时间窗，就改扫算出来的时间窗；算不出来时按传入的范围扫描（并给出提示），超过 7 天则直接拒绝。
- **耗时很长的请求只扫两头。** 根据 trace 算出的时间窗本身超过 3 小时时，只扫描两头各 90 分钟（并给出提示）。
- 实际扫描的时间窗都列在 `lookup.windows` 里。
- **可选过滤条件：**

| 参数 | 作用 |
|------|------|
| `replay_id` | 保留这次回放的日志，以及录制时的日志（录制日志没有 `replay_id`）。再加 `mode=replay` 可去掉录制日志 |
| `plan_id`、`plan_item_id` | 只保留这个回放计划或计划中这个接口的日志 |
| `mode` | `record` 或 `replay` |
| `source` | `agent`、`app` 或 `backend` |

其他参数会被拒绝，不会被忽略。

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:8090}"
TRACE_ID=2057ad46a7ce03d3955385f2a4142d29

# 由后端决定时间窗
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}" \
  -H "Accept: application/json" -o /tmp/trace-logs.json

# 只看某一次回放
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&replay_id=<replayId>&mode=replay" \
  -H "Accept: application/json" -o /tmp/trace-logs-replay.json
```

接口返回的内容在顶层（`.rows`）；`sp logs --json` 把同样的内容放在 `.data` 下（`.data.rows`）。

### 后端算不出时间窗时 {#explicit-windows}

<a id="case-scoped-lookup-dual-windows"></a>

回放在第一次调用依赖之前就失败时，后端没法定位回放的时间窗。带了 `replay_id` 时，`warnings` 里会说明；不带时没有提示，所以找不到回放时间窗不代表没有回放日志。应用和后端的时钟相差较大时，算出来的时间窗也可能落错位置。这些情况下，把录制和回放**分开**查，各自指定时间窗：

1. 从 `sp replay case list --plan <planId> --failed --json` 取这个用例的 `recordTime`（录制时间）和 `requestDateTime`（回放请求发出的时间，为空时用 `replayTime`），都是毫秒时间戳。`recordTime` 为空时，用控制台「录制 → 滚动录制」里这条 trace 的录制时间。
2. 在两个时间点前后各查约 2 分钟，带上 `replay_id` 排除其他回放。两段时间有重叠时合成一段查，避免同一行日志查到两次。每次响应里的时间窗和提示都保留下来。

把下面的内容存成脚本（例如 `case-logs.sh`），用 `bash` 运行：

```bash
#!/usr/bin/env bash
TRACE_ID=<traceId>; REPLAY_ID=<replayId>
RECORD_MS=<recordTime>; REPLAY_MS=<requestDateTime>
PAD=120000   # two minutes either side
iso() { s=$(( $1 / 1000 )); date -u -d "@$s" +%FT%TZ 2>/dev/null || date -u -r "$s" +%FT%TZ; }
for T in "$RECORD_MS" "$REPLAY_MS"; do
  case "$T" in ''|*[!0-9]*|0) echo "missing timestamp: '$T'" >&2; exit 1;; esac
done
# Two windows, or one if they overlap, so no log line is fetched twice
A=$(( RECORD_MS < REPLAY_MS ? RECORD_MS : REPLAY_MS )); B=$(( RECORD_MS < REPLAY_MS ? REPLAY_MS : RECORD_MS ))
if [ $(( B - PAD )) -le $(( A + PAD )) ]; then WINDOWS=("$((A - PAD)):$((B + PAD))")
else WINDOWS=("$((A - PAD)):$((A + PAD))" "$((B - PAD)):$((B + PAD))"); fi
i=0; FILES=()
for W in "${WINDOWS[@]}"; do
  i=$((i+1)); out="/tmp/logs-${TRACE_ID}-${i}.json"; FILES+=("$out")
  curl -sf "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&replay_id=${REPLAY_ID}&since=$(iso "${W%%:*}")&until=$(iso "${W##*:}")" \
    -H "Accept: application/json" -o "$out" || { echo "request $i failed" >&2; exit 1; }
  jq -e 'has("rows")' "$out" >/dev/null || { echo "request $i: $(jq -c . "$out")" >&2; exit 1; }
done
# Keep every window, warning and row
jq -s '{windows: [.[].lookup.windows[]?], warnings: [.[].warnings[]?], rows: ([.[].rows[]] | sort_by(.timestamp))}' "${FILES[@]}"
```

应用和后端的时钟相差超过一两分钟时，把时间窗按差值平移，或者放宽。请求本身持续了几个小时的，分成连续的多段查询，每段不超过 3 小时，不要只查开始和结束两个时刻。

不要传一个从录制时间一直跨到回放时间的时间窗：中间每一分钟都要扫，查询很慢，甚至会被拒绝。

## 输出 {#output}

| 字段 | 含义 |
|------|------|
| `lookup` | `type`（`trace`）、`value`（trace ID）和 `windows`（实际扫描的时间窗） |
| `rows` | 按时间排序的日志行，字段见 [日志查询字段](./log-query-fields) |
| `warnings` | 没有让查询失败、但可能意味着结果**不完整**的提示：时间窗没能算出来、跳过了部分回放、时间窗被换掉或截短。判断「没有日志」之前先看它 |

```json
{
  "ok": true,
  "command": "logs",
  "data": {
    "lookup": {
      "type": "trace",
      "value": "2057ad46a7ce03d3955385f2a4142d29",
      "windows": [
        { "since": "2026-06-27T10:00:00Z", "until": "2026-06-27T10:05:00Z" }
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
        "replay_id": "6891fd300c676b31",
        "effective_mode": "replay"
      }
    ],
    "warnings": []
  }
}
```

## 怎么看结果 {#triage}

<a id="troubleshooting-failed-replays"></a>

```bash
# 各来源的行数
jq '[.data.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json
# 提示信息
jq '.data.warnings' /tmp/trace-logs.json
# 先看后端的错误，再看 Agent，最后看应用
jq -r '.data.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20
```

| 现象 | 可能的原因 | 下一步 |
|------|-----------|--------|
| 没有日志，`warnings` 不为空 | 时间窗没能算出来，或后端读日志的程序和存储格式对不上 | 看提示内容；手动传 `since`/`until`，或升级 sp-backend |
| 没有日志，也没有提示 | `trace_id` 不对、时间窗不对，或日志还没写进去 | 用失败回放用例上的 `trace_id`；放宽时间窗；过几分钟再查 |
| 只有 `backend` 的日志 | Agent 没有上报日志，或应用在这次请求中没打日志 | 确认 Agent 已挂上、能访问后端；检查应用的日志级别 |
| `agent`、`app`、`backend` 都有 | 日志链路正常 | 先看 ERROR/WARN，再用 [sp diagnose](./diagnose) 看差异 |

想确认后端有没有把回放请求真正发到你的服务，筛选 `backend` 日志里的 `Replay send start` / `done` / `failed`，见 [回放发送日志标记](/zh/testing/reference/replay-send-log-markers)。

## 错误 {#errors}

参数错误和后端错误都用标准的 stderr 信封输出（见 [输出约定](/zh/testing/agents/output-contract#cli-envelope-stderr-on-failure-exit-1)）：

```json
{
  "ok": false,
  "command": "logs",
  "error": {
    "code": "API_ERROR",
    "message": "API error 1: log pipeline is disabled",
    "httpStatus": 200,
    "backend": { "responseCode": 1, "responseDesc": "log pipeline is disabled" }
  }
}
```

可能出现的错误信息：`trace_id is required`、`since is required`、`until is required`、`since must be before until`、`since and until must be ISO-8601 UTC timestamps`、`unsupported logs query parameter: <参数名>`、`log pipeline is disabled`、`log pipeline is unavailable`。

## 已移除的命令 {#legacy}

以下旧的日志命令和接口已经不存在：

| 已移除 | 改用 |
|--------|------|
| `sp recorder logs`、`sp recorder query`、`sp recorder info`、`sp query` | `sp logs`，或上面的 HTTP 接口 |
| `sp record logs overview`、`sp record logs download` | `sp logs … > 文件` |
| `sp replay logs`（包括 `--overview`） | `sp logs`，或带 `replay_id` 调用接口 |
| `--include-recording-log` | 不再需要：录制和回放共用同一个 `trace_id` |
| 响应里的 `source_summary` | 用 `jq` 按 `source` 分组（见上文） |
| `GET /api/record-logs/*`、`GET /api/replay-logs/*` | `GET /api/recorder/logs?trace_id=…` |

## 相关文档 {#related}

- [日志查询字段](./log-query-fields)
- [概念与编号](/zh/testing/agents/concepts#ids)
- [排查回放失败](/zh/testing/examples/agent-diagnose-replay)
- [sp diagnose](./diagnose)
