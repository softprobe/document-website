---
title: Concepts and IDs
---

# Concepts and IDs

The objects you meet when you script SoftProbe, and the IDs that tie recording, replay, diffs and logs together. For how record and replay work end to end, see [How it works](/en/testing/how-it-works).

## Application (`appId`) {#application-appid}

A service under test. Recordings, replays, policies and extraction rules all belong to one `appId`.

| Field | Role |
|-------|------|
| `appName` | The name you register with `sp app create <appName>` |
| `appId` | The application's ID. Configure the Java agent and the CLI with it |

`sp app create` returns a generated 16-character hex `appId`. That format is not required: the agent can also use any stable, non-empty name such as `order-service`, and an unknown `appId` is registered automatically the first time the agent loads its config (the app name is then the same as the ID). All instances of one service must use the same `appId`; if it changes between recording and replay, SoftProbe can't find the original cases.

**Agent status** comes from the agents' heartbeats:

| Status | Meaning |
|--------|---------|
| `online` | At least one instance sent a heartbeat within the threshold (60 seconds by default) |
| `degraded` | Online, but at least one fresh instance is rate-limited or degraded |
| `offline` | Heartbeats were seen before, but none within the threshold |
| `never` | No instance has ever reported |

Check it with `sp app status <appId>` or `sp app list --json`. Command reference: [sp app](/en/testing/commands/app).

## Java agent {#java-agent}

Attached to the service with `-javaagent:/path/to/sp-agent.jar`.

- While **recording**, it captures real requests and the calls they make to databases, caches and other services.
- While **replaying**, it answers those calls from the recording instead of the real dependency, according to the mock policy.
- It sends heartbeats, which is how `sp app status` knows whether the app is online.

How to attach it: [Attach the Java agent](/en/testing/java-agent).

## Replay target URL (`targetEnv`) {#replay-target-url-targetenv}

Replay does not take an environment label such as `staging` or `prod`. `targetEnv` is the **base URL of the running service** that receives the replayed requests, for example `http://order-service:8080` or `https://order-service.internal:8443`.

- `sp replay run --env <url>` sends it as `targetEnv`.
- It must include the scheme and host (and the port if it isn't the default). Without a host, plan creation fails with *requested target env unable load active instance*.
- It has nothing to do with `SP_API_URL`, which points at sp-backend.

Command reference: [sp replay](/en/testing/commands/replay).

## Policies {#policies}

Three kinds of declarative YAML policy:

| Kind | Controls | Commands |
|------|----------|----------|
| `RecordingPolicy` | What the agent records: sampling rate, which operations, time windows, serialization skips | `sp policy recording` |
| `MockPolicy` | What is mocked during replay, and how tolerant mock matching is | `sp policy mock` |
| `CompareRulePolicy` | How responses are compared: ignored fields, array matching, decoding | `sp policy compare` |

Several policies can match one app; they are merged by `metadata.priority`. Built-in defaults have priority `0`. Field reference: [Policy YAML reference](/en/testing/policy-yaml-guide).

## Replay plan {#replay-plan}

One replay run, identified by a `planId`. Created with `sp replay run` (or the console, a schedule, or the [Open API](/en/testing/reference/replay-openapi)) and followed with `sp replay status`. A plan replays cases that were already recorded, so an app that has never received traffic with the agent attached has nothing to replay. Cases come only from recording; you can't write them by hand.

## IDs {#ids}

<a id="trace-replay-and-plan-ids"></a>

| ID | What it identifies | Used for |
|----|--------------------|----------|
| `traceId` | One request flow (W3C trace ID). A replayed case reuses the recorded `traceId` | **Log lookup** ([sp logs](/en/testing/commands/logs)), trace and record queries |
| `replayId` | One replay of one case | Diffs and diagnosis; narrows a log lookup to one run |
| `planId` | A replay plan | Case lists, reports, diagnosis |
| `planItemId` | One interface inside a plan | Case lists |
| `diffId` | One comparison result | `sp replay diff get` |

### Where the IDs appear {#where-ids-appear}

| Command | Fields |
|---------|--------|
| `sp replay run --json` | `planId` |
| `sp replay case list --plan <planId> --failed --json` | `replayId`, `traceId`, `diffId`, plan item IDs, per case |
| `sp replay metadata <replayId> --json` | `traceId` and the linked recording |
| `sp record case list --app <appId> --since -24h --json` | `traceId` of each recorded entry request |
| `sp trace find --app <appId> --attr-name <rule> --attr-value <value> --json` | `traceId` for a business ID such as an order number |
| `sp diagnose replay <planId> --json` | Failed cases with their IDs |

### Which `traceId` to use for logs {#which-traceid}

For a failed replay, take the `traceId` from the **failed replay case**. Recording and replay of that case share it, so one lookup returns both sides. Don't take a trace from the newest recordings or from health-check traffic (`/`, `/index.html`) — those are unrelated requests.

If the user gives you a business ID (order number, policy number) instead of a trace, resolve it first — see [Start from a business ID](/en/testing/examples/agent-diagnose-replay#business-id).

`replayId`, `planId` and `planItemId` are not lookup keys for logs; on the HTTP API they are optional filters on top of `trace_id` ([sp logs — HTTP API](/en/testing/commands/logs#http-api)).

## Related

- [Choose how to integrate](./overview)
- [Command reference](/en/testing/commands/)
