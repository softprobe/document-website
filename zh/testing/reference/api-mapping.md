---
title: 命令与后端接口对照
---

# 命令与后端接口对照

每条 `sp` 命令调用的是哪个后端 HTTP 接口。自己写程序对接后端、或排查命令行为时查这张表。

::: info 本页保留英文
表中的接口路径和命令名与程序逐字对应，因此保留英文。
:::

后端默认端口为 **8090**。除特别注明外，控制台接口需要带 `access-token` 请求头。

**分类**：`platform`（平台）、`investigation`（排查）、`admin`（管理）、`—`（不对外开放）。

## Auth

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET | `/api/login/getVerificationCode/{userName}` | (precursor to login) | platform |
| POST | `/api/login/verify` | `sp auth login` | platform |
| GET | `/api/login/refresh/{userName}` | `sp auth refresh` | platform |
| POST | `/api/login/loginAsGuest` | `sp auth login --guest` | platform |
| POST | `/api/login/oauthLogin` | — | — |
| GET | `/api/login/userProfile/{userName}` | `sp auth whoami` (future) | investigation |

## Applications

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET | `/api/applications/list` | `sp app list` | platform |
| POST | `/api/applications/create` | `sp app create` | platform |
| GET | `/api/applications/{appId}/agent-status` | `sp app status` | platform |
| GET | `/api/applications/{appId}/replays/recent` | `sp app replays` | platform |
| GET | `/api/applications/{appId}/extraction-rules` | `sp extraction-rule list` | investigation |
| PUT | `/api/applications/{appId}/extraction-rules` | `sp extraction-rule apply` | investigation |
| POST | `/api/extraction-rules/preview` | `sp extraction-rule preview` | investigation |
| GET | `/api/agent/extraction-rules` | — (agent) | — |

## Policies

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET | `/api/recording-policies/policies` | `sp policy recording list` | platform |
| GET | `/api/recording-policies/policies/{id}` | `sp policy recording get` | platform |
| POST | `/api/recording-policies/policies` | `sp policy recording apply` | platform |
| POST | `/api/recording-policies/policies/yaml` | `sp policy recording apply -f` | platform |
| DELETE | `/api/recording-policies/policies/{id}` | `sp policy recording delete` | platform |
| POST | `/api/recording-policies/policies/validate` | `sp policy recording validate` | platform |
| GET | `/api/recording-policies/policies/{id}/yaml` | `sp policy recording export` | platform |
| * | `/api/mock-policies/*` | `sp policy mock …` | platform |
| * | `/api/compare-rules/*` | `sp policy compare …` | platform |

## Replay control (schedule)

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| POST | `/api/createPlan` | `sp replay run` (`targetEnv` = service base URL) | platform |
| GET | `/api/createPlan` | — (webhook only) | — |
| GET | `/api/progress` | `sp replay status` | platform |
| GET | `/api/stopPlan` | `sp replay stop` | platform |
| POST | `/api/reRunPlan` | `sp replay rerun` | platform |
| POST | `/api/createRealTimePlan` | `sp replay realtime create` | investigation |
| GET | `/api/queue/control/*` | `sp replay realtime queue …` | investigation |
| POST | `/api/compareCase` | `sp replay compare` | investigation |
| GET | `/api/queryNoise` | `sp replay noise query` | investigation |
| POST | `/api/excludeNoise` | `sp replay noise exclude` | investigation |

## Traces

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| POST | `/api/traces/find-by-attr` | `sp trace find` | investigation |
| GET | `/api/traces/{traceId}/summary` | `sp trace get` | investigation |
| POST | `/api/traces/attr-rule-statistics` | `sp trace stats` | investigation |

## Storage record (read)

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| POST | `/api/storage/record/query` | `sp record query` | investigation |
| GET | `/api/storage/record/trace/{traceId}` | `sp record trace` | investigation |
| GET | `/api/storage/record/completeness` | `sp record completeness` | investigation |
| POST | `/api/storage/record/save` | — | — |
| * | `/api/storage/replay/query/*` | `sp replay case list` (partial) | investigation |
| GET | `/api/storage/replay-mock-tree/{replayId}` | `sp replay mock-tree` | investigation |

## Logs

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET | `/api/recorder/logs` | `sp logs` | investigation |

旧的 `/api/record-logs/*` 和 `/api/replay-logs/*` 接口以及 `sp record logs` / `sp replay logs` 命令已移除，见 [sp logs](/zh/testing/commands/logs)。

## Reports (subset)

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET | `/api/report/queryDiffMsgById/{id}` | `sp replay diff get`, `sp diagnose replay` | investigation |
| POST | `/api/report/queryPlanFailCase` | `sp replay case list --plan` (without `--plan-item`), `sp diagnose replay` | investigation |
| POST | `/api/report/queryReplayCase` | `sp replay case list --plan-item`, `sp replay case get` | investigation |
| POST | `/api/report/queryPlanStatistics` | `sp replay statistics` | investigation |
| POST | `/api/report/queryPlanStatistic` | `sp replay report` | investigation |
| POST | `/api/report/init` | — (not exposed) | investigation |
| * | `/api/report/*` (others) | — (not exposed) | investigation |

## Agent config

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| POST | `/api/config/agent/load` | `sp config agent load` | investigation |
| POST | `/api/config/agent/agentStatus` | — or `sp app status` | investigation |

## Legacy config

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET/POST | `/api/config/{resource}/*` | — (not exposed; `sp config legacy` was removed) | investigation |

## User groups

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| * | `/api/userGroup/*` | `sp group …` | investigation |
| * | `/api/appGrant/*` | `sp grant …` | investigation |

## Health & ops

| Method | Path | CLI | Category |
|--------|------|-----|-------|
| GET | `/vi/health` | `sp health` | platform |
| GET | `/vi/storage/*` | `sp ops storage …` | investigation |
| GET | `/vi/schedule/monitor` | `sp ops schedule monitor` | investigation |

## Not exposed

| Method | Path | Reason |
|--------|------|--------|
| POST | `/v1/traces` | OTLP |
| POST | `/api/storage/record/save` | Agent write |
| * | `/api/replay/local/*` | Local runner |

Controller 源码： `sp-tr-api/sp-web-api`, `sp-storage/sp-storage-web-api`, `sp-replay-schedule/sp-schedule-web-api`.
