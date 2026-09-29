---
title: 排查回放失败
---

# 排查回放失败

写给 AI 代理和脚本：从一个失败的回放计划，或者从订单号这类业务编号出发，找到失败请求的差异和日志。

## 准备 {#before-you-start}

```bash
export SP_API_URL=http://127.0.0.1:8090
export SP_TOKEN=<令牌>   # 部署要求登录时才需要
```

## 一条命令 {#in-one-command}

```bash
sp diagnose replay <planId> --out-dir .sp-work --json
```

它把失败用例的差异写成文件并返回汇总，文件路径在 `data.artifacts` 里。见 [sp diagnose](/zh/testing/commands/diagnose)。

## 分步排查 {#step-by-step}

### 1. 检查后端，找到应用 {#1-check-the-backend-and-find-the-app}

```bash
sp health --json
sp app list --json
```

从 `data.items[].appId` 取应用 ID。

### 2. 找到回放计划 {#2-find-the-plan}

已经有 `planId` 就跳过这一步：

```bash
sp app replays <appId> --limit 5 --json
```

### 3. 列出失败的用例 {#3-list-the-failed-cases}

```bash
sp replay case list --plan <planId> --failed --json
```

`data.items` 里每个用例记下 `replayId`、`traceId`、`operationId` 和 `diffResultCode`（`1` 表示有差异，`2` 表示回放失败）。要按时间查日志时，`recordTime` 和 `replayTime` 有用；`errorMessage` 说明回放失败的原因。

### 4. 获取差异 {#4-get-the-diffs}

```bash
sp diagnose replay <planId> --out-dir .sp-work --json
```

它把每个有差异的用例的可读差异写成 JSON 文件，路径列在 `data.artifacts` 里。另起一步读取这些文件，对比 `baseMsg`（录制时）和 `testMsg`（回放时）。回放失败的用例没有差异，从它的 `errorMessage` 和日志入手。

### 5. 查看这个请求的日志 {#logs}

用失败用例的 `traceId`。通过 HTTP 接口查询时，后端会自动选定时间窗：录制前后一段，这条 trace 每次回放前后各一段。

```bash
TRACE_ID=<失败用例的 traceId>
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&replay_id=<replayId>" \
  -H "Accept: application/json" -o .sp-work/logs-${TRACE_ID}.json

jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' .sp-work/logs-${TRACE_ID}.json
jq '.warnings' .sp-work/logs-${TRACE_ID}.json
jq -r '.rows[] | select(.severity=="ERROR" or .severity=="WARN") | "\(.timestamp) \(.source) \(.body)"' .sp-work/logs-${TRACE_ID}.json | head -30
```

带 `replay_id` 时，返回录制时的日志加上这一次回放的日志。不带时，后端扫描录制前后，以及这条 trace 最近 8 次回放前后的时间。先看 `warnings`：时间窗没能算出来或被截短时，它会说明。用 `sp logs` 查询时需要自己给时间窗：

```bash
sp logs --trace-id "$TRACE_ID" --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json > .sp-work/logs.json
```

想确认回放请求有没有真正打到你的服务，看 `backend` 日志里的 `Replay send start` / `done` / `failed`，见 [回放发送日志标记](/zh/testing/reference/replay-send-log-markers)。查不到日志时怎么判断，见 [sp logs — 怎么看结果](/zh/testing/commands/logs#triage)。

### 6. 可选：回放元数据 {#6-optional-replay-metadata}

```bash
sp replay metadata <replayId> --json
```

显示这次回放的 trace 和它对应的录制。

## 从业务编号开始排查 {#business-id}

用户说「订单 ORD-1234 回放失败了」，却给不出 trace ID 时，按业务字段查出 trace。前提是已经有 [提取规则](/zh/testing/commands/extraction-rule) 为这个字段建了索引：

```bash
sp trace find --app <appId> --attr-name orderId --attr-value ORD-1234 --json
```

查到多条 trace 时，逐条查看，留下时间和接口都对得上的那条：

```bash
sp trace get <traceId> --json
```

再看这条 trace 录下了什么：

```bash
sp record query --trace-id <traceId> --out-dir .sp-work --json
sp record completeness <traceId> --json
```

接下来按这个 `traceId` [查看日志](#logs)，或在回放计划里找它对应的回放用例。

已经有提取规则为用户的业务字段建了索引时，不要让用户去控制台找 trace ID，先用 `sp trace find`。

## 给技能用的提示词片段 {#prompt-snippet-for-a-skill}

```markdown
排查 SoftProbe 回放失败时：
1. `sp replay case list --plan <id> --failed --json`，取每个失败用例的 replayId 和 traceId
2. `sp diagnose replay <id> --out-dir .sp-work --json`，再读取 data.artifacts 里的文件；不要解析大段标准输出
3. 日志：执行 `curl "$SP_API_URL/api/recorder/logs?trace_id=<traceId>&replay_id=<replayId>"`；先看 warnings；按 source 统计行数；依次看 backend、agent、app 的 ERROR/WARN
4. 只有业务编号时，先执行 `sp trace find`
```

## 相关文档 {#related}

- [概念与编号](/zh/testing/agents/concepts#ids)
- [sp logs](/zh/testing/commands/logs)
- [sp replay diff](/zh/testing/commands/replay-diff)
- [sp trace](/zh/testing/commands/trace)
