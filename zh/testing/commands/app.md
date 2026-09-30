---
title: sp app：应用管理
---

# sp app：应用管理

**AI 代理何时使用：** 解析 `appId`、检查 Agent 连通性、注册服务，或列出应用最近的回放计划。

## 概要 {#synopsis}

列出、创建和查看 Softprobe **应用**。应用就是一个已注册的服务；录制、回放和策略都按 `appId` 划分。见 [概念 —— 应用](/zh/testing/agents/concepts#application-appid)。

所有子命令都请带 `--json`。见 [输出约定](/zh/testing/agents/output-contract)。

## 子命令 {#subcommands}

| 子命令 | 参数 | 说明 |
|------------|------|-------------|
| `list` | — | 当前调用方可见的应用，附 Agent 状态 |
| `create` | `<appName>` | 注册新应用（`appId` 由服务端分配） |
| `status` | `<appId>` | 单个应用的 Agent 连通性 |
| `replays` | `<appId>` | 最近的回放计划（`--limit`） |

## `list`

```bash
sp app list --json
```

**REST：** `GET /api/applications/list`

带 `--json` 时需要有 token（未设置 `SP_TOKEN` 时 CLI 会以认证错误退出）。结果按用户组、归属关系和跨组授权过滤，见 [认证](/zh/testing/agents/authentication)。

### JSON 输出 {#json-output}

`data.items` 是列表行的数组。每行合并了应用配置和 Agent 实时状态（心跳阈值默认 60 秒，超时即为 `offline`）。

| 字段 | 说明 |
|-------|-------------|
| `appId` | 稳定的 id，用于 Agent 配置和其他 `sp` 命令 |
| `appName`、`name` | 显示名 |
| `agentStatus` | `online`、`degraded`、`offline` 或 `never`，含义见 [status](#status) |
| `lastSeenAt` | Unix 毫秒，最新一次实例心跳 |
| `agentVersion` | Agent 构建版本字符串 |
| `env` | 主环境标签，缺省为 `production` |
| `tags` | 打平后的标签值 |
| `worktreeDirectory` | 可选的工作区路径 |

```json
{
  "ok": true,
  "command": "app list",
  "data": {
    "items": [
      {
        "appId": "a1b2c3d4e5f67890",
        "appName": "order-service",
        "agentStatus": "online",
        "lastSeenAt": 1747564800000
      }
    ]
  }
}
```

## `create`

```bash
sp app create order-service-staging --json
```

**REST：** `POST /api/applications/create`

`appName` 必须唯一。CLI 发送 `{ "appName": "<arg>" }`；未提供 `owners` 时，服务端会从 JWT 中取当前用户填入。

### 请求体（REST） {#request-body-rest}

| 字段 | 必填 | 说明 |
|-------|----------|-------------|
| `appName` | 是 | 唯一名称（CLI 位置参数） |
| `owners` | 否 | 所有者用户名；默认为当前用户 |
| `visibilityLevel` | 否 | `0` 公开，`1` 私有 |
| `groupId`、`groupName` | 否 | 所属用户组 |

### JSON 输出 {#json-output-1}

| 字段 | 说明 |
|-------|-------------|
| `success` | 是否创建成功 |
| `appId` | 生成的 id —— 用于 Agent 配置和 `sp replay run --app` |
| `msg` | `success` 为 false 时的详情 |

```json
{
  "ok": true,
  "command": "app create",
  "data": {
    "success": true,
    "appId": "f3e2d1c0b9a87654"
  }
}
```

## `status`

```bash
sp app status f3e2d1c0b9a87654 --json
```

**REST：** `GET /api/applications/{appId}/agent-status`

汇总该应用各 JVM 实例的心跳。`status` 以**最新**的实例为准：

| 取值 | 含义 |
|-------|---------|
| `never` | 当前没有实例记录（实例记录在最后一次心跳约 3 分钟后过期） |
| `online` | 最新心跳在阈值内（默认 60 秒） |
| `degraded` | 在线，但至少有一个心跳正常的实例处于限流或降级状态 |
| `offline` | 有实例记录，但阈值内没有心跳 |

| 字段 | 说明 |
|-------|-------------|
| `appId` | 应用 ID |
| `status` | `never`、`online`、`degraded` 或 `offline` |
| `instanceCount` | 阈值内有心跳的实例数 |
| `lastSeenAt` | Unix 毫秒 |
| `agentVersion` | 来自最新的实例 |

```json
{
  "ok": true,
  "command": "app status",
  "data": {
    "appId": "f3e2d1c0b9a87654",
    "status": "online",
    "instanceCount": 2,
    "lastSeenAt": 1747564800000
  }
}
```

## `replays`

```bash
sp app replays f3e2d1c0b9a87654 --limit 10 --json
```

**REST：** `GET /api/applications/{appId}/replays/recent?limit=N`

| 参数 | 默认值 | 说明 |
|------|---------|-------------|
| `--limit` | `5` | 最大计划条数（CLI 拒绝小于 1 的值；大于 100 的值截断为 100；服务端同样截断到 1–100） |

`data` 是回放计划摘要的数组（`planId`、`planName`、`status`、用例数、`createTime`、`triggeredBy` 等）。拿到 `planId` 后可配合 [sp replay](replay.md) 和 [replay case](/zh/testing/commands/replay-case) 使用。

### JSON 输出 {#json-output-2}

```json
{
  "ok": true,
  "command": "app replays",
  "data": {
    "items": [
      {
        "planId": "plan-6644220011",
        "planName": "nightly-regression-20260904",
        "status": 3,
        "totalCaseCount": 42,
        "replayCaseCount": 42,
        "successCaseCount": 40,
        "failCaseCount": 2,
        "createTime": 1747564800000,
        "triggeredBy": "ci-pipeline"
      }
    ]
  }
}
```

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `list` | GET | `/api/applications/list` |
| `create` | POST | `/api/applications/create` |
| `status` | GET | `/api/applications/{appId}/agent-status` |
| `replays` | GET | `/api/applications/{appId}/replays/recent` |

请求头：`access-token: <JWT>`。

## 替代 `sp_api` {#replaces-sp_api}

| sp_api 接口 | sp 命令 |
|-----------------|------------|
| `list_applications` | `sp app list` |
| `agent_status` | `sp app status` |
| `recent_replays` | `sp app replays` |

## 相关文档 {#related}

- [概念 —— 应用](/zh/testing/agents/concepts#application-appid)
- [快速上手](/zh/testing/getting-started)
- [sp replay](replay.md)
- [诊断回放失败](/zh/testing/examples/agent-diagnose-replay)
- [输出约定 —— ApplicationListItem](/zh/testing/agents/output-contract#applicationlistitem)
- [API 对照](/zh/testing/reference/api-mapping)
