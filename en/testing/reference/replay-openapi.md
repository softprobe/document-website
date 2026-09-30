---
title: Replay trigger Open API
---

# Replay trigger Open API

The endpoints, fields and error codes used by automatic replays and result notifications. For wiring them into a pipeline, see [Replay after deployment](/en/testing/webhook-and-ci); for setting up notifications, see [Replay notifications](/en/testing/notifications).

::: warning No authentication — internal network only
These endpoints have no authentication. Anyone who can reach the backend can trigger replays and change notification channels, so only allow internal access and never expose them to the internet. They're available on self-hosted deployments only. On All-in-One, set `SP_REPLAY_OPENAPI=true` in the environment and restart; until then, requests get a 404, a 405 or an HTML page.
:::

## Endpoints {#endpoints}

All paths are relative to the backend, for example `http://sp-backend.internal:8090/openapi/v1/replay-triggers`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/openapi/v1/replay-triggers` | [Trigger a replay](#trigger) |
| `GET` | `/openapi/v1/replay-runs/{planId}` | [Get progress and findings](#run-status) |
| `GET` | `/openapi/v1/replay-runs/{planId}/diagnosis` | [Read the stored result and deployment details](#diagnosis) |
| `POST` | `/openapi/v1/replay-runs/{planId}/diagnosis` | Used by Softprobe's analysis service to write back results; you don't need to call it |
| `GET` | `/openapi/v1/notification-channels` | [List notification channels](#channels) |
| `POST` | `/openapi/v1/notification-channels` | [Create or update a channel](#channels) |
| `DELETE` | `/openapi/v1/notification-channels/{id}` | [Delete a channel](#channels) |
| `POST` | `/openapi/v1/notification-channels/{id}/test` | [Send a sample card to a channel](#channels) |

Requests and responses are JSON. Business errors still return HTTP 200, with `errorCode` and `errorMessage` explaining why; a `null` `errorCode` means success. Network and gateway errors use HTTP status codes as usual.

## Trigger a replay {#trigger}

`POST /openapi/v1/replay-triggers`

Returns immediately; the replay runs in the background.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `appId` | string | Yes | | The application's appId |
| `targetEnv` | string | Yes | | URL of the service under test, including `http://` or `https://` |
| `operations` | string[] | No | Whole application | Replay only these endpoints, by path as shown in the recording list, for example `/order/create`. Omit it or pass `[]` to replay the whole application |
| `caseSource` | string | No | `rolling` | `rolling` uses recent recordings; `pinned` uses pinned cases |
| `caseSourceHours` | integer | No | 24 | How many hours of recordings to use; must be positive. Doesn't apply to `pinned` |
| `caseCountLimit` | integer | No | Server setting | Maximum number of cases to replay per endpoint. A server-side setting may override it; the replay result shows the actual count |
| `caseTags` | object | No | | Filter cases by recording tags, for example `{"env": "prod"}`. Tags are the raw values the agent reported: `-Dsp.tags.env=prod` becomes `{"env": "prod"}` |
| `enableMock` | boolean | No | `true` | With `false`, downstream calls are made for real instead of returning recorded data |
| `passThreshold` | number | No | | Pass-rate threshold between 0 and 1. Only affects [`verdict`](#verdict), never `findings.state` |
| `attributes` | object | No | | Details about this deployment, stored as-is; the keys below appear on notification cards |

`attributes` keys follow the [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/). Notification cards use these:

| Key | Shown on the card as |
|---|---|
| `service.name` | The application name in the card title; defaults to the appId |
| `deployment.environment.name` | Environment |
| `cicd.pipeline.name`, `cicd.pipeline.run.id`, `cicd.pipeline.run.url.full` | Pipeline, clickable when a URL is given |
| `vcs.ref.head.name` | Branch |
| `vcs.ref.head.revision` | Commit, first 7 characters |

`passThreshold` and `attributes` are passed once, at trigger time, and can't be changed afterwards. `attributes` can be read back through [Read the stored result](#diagnosis); `passThreshold` is never returned by any query.

Example request:

```bash
curl -X POST http://sp-backend.internal:8090/openapi/v1/replay-triggers \
  -H 'Content-Type: application/json' \
  -d '{
    "appId": "order-service",
    "targetEnv": "http://order-service.test:8080",
    "operations": ["/order/create", "/order/pay"],
    "caseTags": {"env": "prod"},
    "attributes": {
      "deployment.environment.name": "test",
      "vcs.ref.head.name": "release/2026-10",
      "vcs.ref.head.revision": "9c3e1f2",
      "cicd.pipeline.run.id": "1643",
      "cicd.pipeline.run.url.full": "https://jenkins.example.com/job/order/1643/"
    }
  }'
```

Success:

```json
{
  "planId": "6abb8559e5eb34767296c557",
  "statusUrl": "/openapi/v1/replay-runs/6abb8559e5eb34767296c557",
  "errorCode": null,
  "errorMessage": null
}
```

Failure:

```json
{
  "planId": null,
  "statusUrl": null,
  "errorCode": "UNKNOWN_OPERATION",
  "errorMessage": "these operations are not registered under appId=order-service: [/order/cancel] ..."
}
```

### Error codes {#trigger-errors}

| `errorCode` | Cause |
|---|---|
| `MISSING_APP_ID` | `appId` is missing |
| `MISSING_TARGET_ENV` | `targetEnv` is missing |
| `INVALID_CASE_SOURCE_HOURS` | `caseSourceHours` isn't a positive number |
| `INVALID_CASE_SOURCE` | `caseSource` isn't `rolling` or `pinned` |
| `APP_NOT_REGISTERED` | `operations` was given, but the appId has no endpoints at all: the appId is wrong, or the application hasn't recorded traffic yet |
| `UNKNOWN_OPERATION` | `operations` contains paths that were never recorded; `errorMessage` lists them |
| `EMPTY_OPERATIONS` | `operations` was given but contains only blank strings. To replay the whole application, leave the field out |
| `REASON_<n>` | Creating the replay plan failed. Common values: `1` another replay is being created for the same application, try again later; `101` no endpoints found for the application; `200` no cases recorded in that time range |
| `PLAN_RUNNING_<n>` | Creating the replay plan was refused; see `errorMessage` |
| `CREATE_PLAN_FAILED` | Creating the replay plan failed; see `errorMessage` |
| `INTERNAL_ERROR` | Server error; check the server log |

## Get progress and findings {#run-status}

`GET /openapi/v1/replay-runs/{planId}`

Works for replays started from the web console too; those just don't send notifications.

| Field | Description |
|---|---|
| `status` | `PENDING` (not started), `RUNNING`, `COMPLETED` (finished, findings settled); `UNKNOWN` when the planId doesn't exist |
| `progress` | Progress, 0 to 1 |
| `verdict` | `PASS` or `FAIL`, based on the pass rate; see [below](#verdict) |
| `passRate` | Pass rate, 0 to 1 |
| `totalCases`, `successCases`, `failedCases` | Total, passed and failed cases |
| `reportUrl` | The replay's report page |
| `findings` | The replay findings; pipelines decide on its `state`, see [below](#findings-state) |
| `analysis` | Summary of the AI cause analysis, see [below](#analysis) |
| `errorCode` | `NOT_FOUND` when the planId doesn't exist |
| `errorMessage` | Error details; may also explain why a replay didn't finish normally |

Until the replay finishes, only `status` and `progress` are set. A finished response, with some fields removed:

```json
{
  "status": "COMPLETED",
  "progress": 1.0,
  "verdict": "FAIL",
  "passRate": 0.82,
  "totalCases": 50,
  "successCases": 41,
  "failedCases": 9,
  "reportUrl": "http://softprobe.internal/sp/workbench/order-service/runs/6aba9d1fe5eb34767296c3f9",
  "errorCode": null,
  "errorMessage": null,
  "findings": {
    "state": "NEEDS_ACTION",
    "scope": {
      "interfacesInScope": 3,
      "interfacesReplayed": 3,
      "interfacesUnchanged": 2,
      "requests": 50,
      "requestsWithoutResult": 0
    },
    "needsActionInterfaces": 1,
    "needsAction": [
      {
        "kind": "FIELD_VALUE",
        "subjects": ["payable"],
        "interfaces": [
          {"operationName": "/order/price", "affectedRequests": 9, "totalRequests": 22}
        ],
        "affectedRequests": 9,
        "totalRequests": 22
      }
    ],
    "toReviewInterfaces": 0,
    "toReview": [],
    "coverage": {"uncoveredInterfaces": 0, "mainOperationsConfigured": false, "uncoveredMainOperations": []},
    "excludedFieldCount": 3
  },
  "analysis": {
    "state": "DONE",
    "analyzedCases": 9,
    "failedCases": 9,
    "codeChangeCases": 9,
    "undeterminedCases": 0,
    "invalidCases": 0,
    "codeChanges": [
      {
        "shortTitle": "会员价改为向下取整，应付少 1 元",
        "operations": ["/order/price"],
        "affectedCases": 9,
        "location": {"file": "src/main/java/demo/PricingService.java", "line": 12},
        "consecutive": 8
      }
    ]
  }
}
```

### `findings.state` {#findings-state}

Evaluated from top to bottom; the first match wins:

| Order | `state` | Meaning |
|---|---|---|
| 1 | `NO_CASES` | No requests to replay |
| 2 | `INTERRUPTED` | The replay was interrupted or cancelled, or some requests produced no result |
| 3 | `ENVIRONMENT_FAILURE` | One kind of failure (the same status code, or the same connection failure) hit more than half of the endpoints, and at least 3. Usually a test environment problem |
| 4 | `NEEDS_ACTION` | There are problems to fix |
| 5 | `REVIEW_ONLY` | There are only differences for someone to review |
| 6 | `LOW_COVERAGE` | No problems found, but coverage is too low: with main endpoints registered, one of them wasn't replayed; without them, fewer than 10 endpoints or fewer than 30 requests were replayed |
| 7 | `CLEAN` | Verified, no problems found |

While the replay is running, the state is `RUNNING`. Only `CLEAN` counts as a pass.

Which differences need action and which need review:

| Group | Differences |
|---|---|
| Needs action (`needsAction`) | Field value, presence, type or array length differs; many fields differ in one request; empty response; response format changed; fewer downstream calls; 5xx (except 504) or 404; a new sensitive field |
| To review (`toReview`) | New fields; more downstream calls; unstructured content such as PDF or HTML differs; downstream request parameters differ; a 401, 403, 429, 504, timeout or connection failure on a few endpoints; differences that can't be classified; endpoints with failed cases but no difference details |

Each endpoint counts only toward its most severe group. Field differences that AI noise reduction suggested ignoring, and that nobody reverted, move down from "needs action" to "to review" — except new sensitive fields. Differences AI noise reduction already ignored automatically go through ignore rules and aren't in either group.

`findings` is computed on every request, so it changes as ignore rules are added or cases are marked passed.

### `verdict` and `passRate` {#verdict}

`verdict` looks only at the pass rate:

- If the replay didn't finish normally, had no cases, or had cases without a result, it's always `FAIL`.
- With `passThreshold` set at trigger time, it's `PASS` when the pass rate is at or above the threshold.
- Without it, it's `PASS` only when nothing failed.

`verdict` is computed when the replay finishes and stored; later queries read the stored value. Re-running the same planId computes it again.

The pass rate says nothing about what the replay actually covered. Decide on `findings.state`.

### `analysis` {#analysis}

A summary of the AI cause analysis — the same one shown in the report and on notification cards. It may be missing or `null` when there's no analysis. It never affects `verdict` or `findings.state`.

| Field | Description |
|---|---|
| `state` | `RUNNING`, `DONE`, `PARTIAL` (stopped partway) or `SKIPPED` (never started) |
| `reason` | Why it's `PARTIAL` or `SKIPPED`, for example `QUOTA_EXHAUSTED` (today's automatic analyses are used up), `NO_EXECUTOR` (the analysis service isn't connected), `MODEL_QUOTA` (the AI service is out of quota), `STALE` (the analysis was interrupted) |
| `analyzedCases` | Cases analyzed |
| `failedCases` | Cases that didn't pass |
| `codeChangeCases`, `undeterminedCases`, `invalidCases` | Cases in each tier: caused by code changes, cause not established, invalid. They add up to the failed cases |
| `markedCases` | How many of those were marked passed by someone. Marking doesn't reduce the original counts |
| `codeChangeInterfaces`, `undeterminedInterfaces`, `invalidInterfaces` | Endpoints in each tier; each endpoint counts only in its most severe tier |
| `codeChanges` | Each difference caused by code changes, see below |

Each item in `codeChanges`:

| Field | Description |
|---|---|
| `findingId` | ID of this difference |
| `title`, `shortTitle` | A one-sentence description, and the short title shown in the report (at most 20 characters). Written by the AI, in Chinese by default |
| `operations` | Endpoints involved |
| `affectedCases`, `replayedCases` | Cases affected, and cases replayed on these endpoints in total |
| `markedCases`, `markedAt` | How many were marked passed, and when the last one was (millisecond timestamp) |
| `sampleOperation` | An example endpoint |
| `location` | Code location: `file`, `line`, `symbol` |
| `inferred` | `true` when the cause was inferred from response data without locating the code: either no repository was read, or it was read but the code wasn't located |
| `consecutive` | How many replays in a row it has appeared in; `1` means first seen |

## Read the stored result {#diagnosis}

`GET /openapi/v1/replay-runs/{planId}/diagnosis`

Reads the stored result for this replay: `verdict`, `passRate`, case counts, the `attributes` passed at trigger time, and the written-back analysis text `summary`. `passThreshold` is not returned.

| `errorCode` | Meaning |
|---|---|
| `null` | A result is available |
| `NO_CONCLUSION_YET` | Triggered but not finished. `attributes` can already be read |
| `NOT_FOUND` | No stored result for this replay, for example because it wasn't triggered through the API |

A `POST` to the same path is how Softprobe's analysis service writes back its results. It doesn't start an analysis, and you don't need to call it. To have replays analyzed automatically, turn on **Replays triggered by CI** in [flow settings](/en/testing/replay-report#flow-settings).

## Notification channels {#channels}

### List channels

`GET /openapi/v1/notification-channels`

Returns `channels`, plus `supportedTypes`, the channel types this backend supports. For security, URLs and secrets are never returned; you get a masked `urlMasked` and a `secretConfigured` flag instead.

### Create or update a channel

`POST /openapi/v1/notification-channels`

| Field | Description |
|---|---|
| `id` | Pass it to update; leave it out to create |
| `name` | Name |
| `type` | `feishu_bot`, `dingtalk_bot` or `webhook` |
| `url` | URL, http or https only |
| `secret` | The chat bot's signing secret; for `webhook`, sent as-is in the `X-Webhook-Secret` header |
| `appIds` | Which applications' replays are sent here; an empty array means all |
| `onlyOnFailure` | When `true`, sends only when the state isn't `CLEAN` |
| `enabled` | Whether the channel is on |

Updates change only the fields you send; fields left out or set to `null` keep their values. So renaming a channel doesn't require sending the URL and secret again.

```bash
curl -X POST http://sp-backend.internal:8090/openapi/v1/notification-channels \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Dev team",
    "type": "feishu_bot",
    "url": "https://open.feishu.cn/open-apis/bot/v2/hook/<token>",
    "appIds": ["order-service"],
    "onlyOnFailure": true,
    "enabled": true
  }'
```

### Delete a channel and send a test

- `DELETE /openapi/v1/notification-channels/{id}` deletes the channel.
- `POST /openapi/v1/notification-channels/{id}/test` sends a sample message with every section filled in. On failure it returns `SEND_FAILED`; `errorMessage` includes at most the receiver's HTTP status, never its response body — see the server log for details. Test sends count toward the send rate limit.

### Error codes

| `errorCode` | Cause |
|---|---|
| `MISSING_TYPE` | `type` is missing |
| `UNKNOWN_TYPE` | `type` isn't in `supportedTypes` |
| `MISSING_URL` | `url` is missing |
| `UNSUPPORTED_SCHEME` | The URL isn't http or https |
| `NOT_FOUND` | The channel doesn't exist |
| `RATE_LIMITED` | Too many test sends; try again later |
| `SEND_FAILED` | The test send failed |

## Notification events {#events}

Webhook channels receive POST requests in [CloudEvents 1.0](https://cloudevents.io/) format.

| Field | Description |
|---|---|
| `specversion` | `1.0` |
| `id` | Event ID |
| `source` | `/softprobe/replay` |
| `type` | `ai.softprobe.replay.run.completed` (the result is in) or `ai.softprobe.replay.run.diagnosed` (the AI analysis has been written back) |
| `subject` | The planId |
| `time` | When it was sent, in UTC |
| `datacontenttype` | `application/json` |
| `data` | See below |

Fields in `data`:

| Field | Description |
|---|---|
| `appId`, `planId` | The application and the replay |
| `verdict`, `passRate`, `totalCases`, `successCases`, `failedCases` | As in the [polling endpoint](#run-status) |
| `reason` | Why `verdict` is `FAIL` |
| `summary` | The AI analysis text, when there is one |
| `reportUrl` | The report page |
| `attributes` | The deployment details passed at trigger time |
| `findings` | The replay findings, as in the [polling endpoint](#findings-state) |
| `analysis` | The AI analysis summary, as in the [polling endpoint](#analysis) |

When the verdict is `FAIL`, a few extra difference statistics (`clusterCount`, `topClusters` and so on) are included, for webhooks only. Fields that aren't available are left out.

Headers: `Content-Type: application/json; charset=utf-8`, plus `X-Webhook-Secret` when the channel has a secret. Any 2xx response counts as delivered.
