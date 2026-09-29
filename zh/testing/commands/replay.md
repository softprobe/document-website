---
title: sp replay：回放计划
---

# sp replay：回放计划

**AI 代理何时使用：** 发起并盯回放计划。失败用例和差异见 [replay case](./replay-case) 和 [replay diff](./replay-diff)。

## 概要 {#synopsis}

基于已录制的用例，创建、盯进度、停止和重跑回放计划。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `run` | 创建回放计划（`POST /api/createPlan`） |
| `status <planId>` | 轮询进度（`GET /api/progress`） |
| `statistics <planId> --app <appId>` | 回放计划的汇总行，含各类用例数 |
| `report <planId> --app <appId>` | 回放计划的统计报告 |
| `stop <planId>` | 停止计划 |
| `rerun <planId>` | 重跑计划 |

用例列表、差异和元数据见 [replay case](./replay-case) 和 [replay diff](./replay-diff)。

## 参数（`run`） {#flags-run}

| 参数 | API 字段 | 说明 |
|------|-----------|-------------|
| `--app` | `appId` | 应用 id（必填） |
| `--env` | `targetEnv` | **回放目标的 base URL**（必填），不是环境别名。必须带 `http://` 或 `https://` 和主机名，如 `http://travel-ota:8080`。CLI 会拒绝 `staging`、`dev` 这类值。 |
| `--suite` | — | 用例集。设为 `Pinned` 时只回放手动固化的用例。`AutoPinned` 不可选。 |
| `--from` | `caseSourceFrom` | 滚动选取的起始时间（时长如 `-24h`，或 RFC3339）。`--suite Pinned` 时忽略。 |
| `--to` | `caseSourceTo` | 滚动选取的结束时间（默认：现在）。`--suite Pinned` 时忽略。 |
| `--limit` | `caseCountLimit` | 最大用例数 |
| `--name` | `planName` | 显示名 |
| `--operation` | `operationIds` | 可重复；按接口过滤 |
| `--enable-mock` | `enableMock` | 回放时 Mock（默认 true） |
| `--no-mock` | `enableMock` | 关闭 Mock（`enableMock=false`；覆盖 `--enable-mock`） |
| `--allow-empty` | — | 窗口内没有录制用例时也创建滚动计划（默认 false）。它不能让空的 `Pinned` 用例集跑起来。 |
| `--watch` | — | `run` 时：创建计划后轮询到结束；`status` 时：轮询已有计划 |

## 示例 {#examples}

```bash
sp record case list --app my-app --since -24h --json   # 先确认有用例
sp replay run --app my-app --env http://travel-ota:8080 --from -24h --enable-mock --json
sp replay run --app my-app --env http://travel-ota:8080 --suite Pinned --watch --json
sp replay run --app my-app --env http://travel-ota:8080 --from -24h --no-mock --watch --json
sp replay status plan-xyz --watch --json
sp replay stop plan-xyz --json
sp replay rerun plan-xyz --json
```

### 用例选择 {#case-selection}

默认选择方式是**滚动**：从 `--from`/`--to` 时间窗里选用例（不带这两个参数时，默认窗口是最近 24 小时）。

`--suite Pinned` 选择该应用手动固化的用例集。它不是时间窗查询，所以 `--from` 和 `--to` 会被忽略。用例滑出正常录制时间窗后仍然可回放。自动管理的 `AutoPinned` 用例不包含在内。

```bash
sp replay run \
  --app my-app \
  --env http://travel-ota:8080 \
  --suite Pinned \
  --watch \
  --json
```

### 预检（`run`，滚动计划） {#preflight-run-rolling}

在 `POST /api/createPlan` 之前，CLI 会用相同的 `--app`、`--from`、`--to` 窗口先查一次 `POST /api/storage/replay/query/replayCase`。如果没有入口用例且没带 `--allow-empty`：

```json
{
  "ok": false,
  "command": "replay run",
  "error": {
    "code": "NO_RECORDED_CASES",
    "message": "no recorded cases for app …; run the app with the agent and send traffic first, or use --allow-empty"
  }
}
```

`--suite Pinned` 时，CLI 改为检查手动固化的用例集。为空则以 `NO_PINNED_CASES` 失败；`--allow-empty` 不能跳过这个安全检查。

### JSON 输出（`run`） {#json-output-run}

```json
{
  "ok": true,
  "command": "replay run",
  "data": {
    "planId": "plan-xyz",
    "result": 1,
    "desc": "success"
  }
}
```

### JSON 输出（`run --watch`） {#json-output-run---watch}

带 `--json` 时，stdout 是按行分隔的封装：

1. 一条计划创建成功的封装（`command`：`replay run`）。
2. 一条或多条进度封装（`command`：`replay status`）。
3. 最后一条进度封装的 `data` 里带 `"finished": true`。

### JSON 输出（`status`） {#json-output-status}

```json
{
  "ok": true,
  "command": "replay status",
  "data": {
    "planId": "plan-xyz",
    "status": "RUNNING",
    "percent": 42,
    "finished": false
  }
}
```

### JSON 输出（`stop`） {#json-output-stop}

```json
{
  "ok": true,
  "command": "replay stop",
  "data": {
    "result": 1,
    "desc": "success"
  }
}
```

### `statistics` 和 `report` {#statistics-and-report}

两个命令都要同时给回放计划 ID 和 `--app`：

```bash
sp replay statistics <planId> --app <appId> --json
sp replay report <planId> --app <appId> --json
```

`statistics` 从应用的回放计划列表里取出这个计划的那一行。它只查第一页（20 个计划），更早的计划会报 `no statistics for plan <planId>`。`report` 原样返回后端对这个计划的统计报告。

流水线用来判断能否发版的结论（`findings.state`）来自 [Open API](/zh/testing/reference/replay-openapi)，不是这两个命令。

### JSON 输出（`rerun`） {#json-output-rerun}

```json
{
  "ok": true,
  "command": "replay rerun",
  "data": {
    "planId": "plan-xyz-rerun",
    "result": 1,
    "desc": "success"
  }
}
```

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `run` | POST | `/api/createPlan` |
| `run`（webhook 风格） | GET | `/api/createPlan?appId=…`（CLI 不建议用；请用 POST） |
| `status` | GET | `/api/progress?planId=` |
| `stop` | GET | `/api/stopPlan?planId=` |
| `rerun` | POST | `/api/reRunPlan` |
| `statistics` | POST | `/api/report/queryPlanStatistics` |
| `report` | POST | `/api/report/queryPlanStatistic` |

`run` 的请求体：`BuildReplayPlanRequest`（schedule 模块）。

响应封装：`CommonResponse`（`result`、`desc`、`data`）。

## 相关文档 {#related}

- [replay case](./replay-case)
- [replay diff](./replay-diff)
- [诊断回放失败](/zh/testing/examples/agent-diagnose-replay)
