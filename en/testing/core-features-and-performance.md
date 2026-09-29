---
title: Capabilities, scope and resources
---

# Capabilities, scope and resources

For people evaluating SoftProbe: what it does, what kind of systems it fits, how it affects the service under test, and what the platform needs.

## What it does {#features}

| Capability | Description |
|------------|-------------|
| Traffic recording | Add the agent to a Java service's start flags — no code changes — to record entry requests and responses, plus calls to databases, caches and downstream services |
| Traffic replay | Send recorded requests to a new version in a test environment; dependency calls can be answered from the recording, so the test environment doesn't need every dependency |
| Automatic comparison | Compares recorded and replayed results field by field; diff rules ignore fields that change every time, such as timestamps and random IDs |
| Replay report | A verdict, and failed cases grouped by cause; with a large language model connected, an analysis of whether each difference comes from a code change, pointing to the code. Exports to Excel and PDF |
| Pinned cases | Keep important recordings for good and replay them again and again |
| Scheduled and pipeline replays | Replay automatically every day; or trigger a replay from your pipeline after a deploy, gate the release on the verdict, and send the result to Feishu, DingTalk or your own system |
| Data protection | Recorded payloads are encrypted in the database; masked by rule when viewed |
| Several ways in | Web console, the `sp` command line, and the replay trigger Open API; AI agents can drive the command line |

## Scope {#scope}

- **Language**: Java, JDK 8, 11, 17 and 21.
- **Frameworks and middleware**: common web frameworks, HTTP clients, database access, caches and RPC frameworks are supported; the full list is in [Supported frameworks](/en/testing/supported-frameworks). Frameworks outside the list are assessed and adapted before onboarding.
- **Replay entry points**: HTTP/HTTPS, and RPC entry points such as Dubbo.
- **Deployment**: SoftProbe Cloud, or self-hosted on a single server (All-in-One) or on Kubernetes; self-hosted can run fully offline.

## Impact on the service under test {#impact}

| Concern | What to expect |
|---------|----------------|
| Onboarding | Add `-javaagent` and a few flags to the start command and restart; no code changes, no extra servers |
| Memory | The agent shares the JVM's memory; leave about 512 MB of headroom, more for very large (MB-sized) payloads or higher sampling |
| Volume | By default about one request per minute, per instance, per endpoint — not everything; adjustable under **Config → Recording** |
| Upload | A background thread uploads recorded data, so business requests don't wait for the network; a full buffer drops data instead of waiting for space |
| When the platform fails | Pending data sits in a bounded in-memory buffer; when it's full, new data is dropped rather than piling up. Repeated upload failures lower the sampling rate automatically, and recording recovers when the platform does — no restart. Details: [Attach the Java agent — production safety](/en/testing/java-agent#queue-overflow) |
| High CPU or memory | The agent goes into a protective state and lowers the sampling rate until usage drops |
| Rollback | Remove the added flags and restart |

## Load on the replay target {#replay-load}

- By default each online instance receives at most 5 requests per second; a whole replay plan runs at about that times the number of instances. Change the default under **Config → Replay**.
- A single run can use Standard (slows down on errors), Serial (one case at a time), or Fixed total RPS (for load tests). Standard mode takes a speed multiplier from 0.25× to 4×.

## Platform resources {#platform-resources}

**Single-server deployment (All-in-One)**: the whole platform on one Linux server (x86_64 or arm64):

| Item | Recommended | Notes |
|------|-------------|-------|
| CPU | 8 cores, at least 4 | More cores handle more replays and comparisons at once |
| Memory | 16 GB | 8 GB is enough without AI diagnosis |
| Disk | 100 GB | Mostly recordings and logs, cleaned up by retention period; very large payloads, many endpoints or high sampling need more |

Resources and configuration for **Kubernetes**: [Deploy the backend](/en/testing/installation/server).

## Data security {#data-security}

- Recorded request and response payloads are encrypted before they're written to the database, with AES-GCM or SM4-GCM. The standard image and the Helm chart turn it on by default; the key is set at deployment.
- Redaction only affects display: payloads are masked by rule when viewed in the console. The database keeps the full, encrypted payload, because replay needs the original.
- When self-hosted, data stays on your own servers; without AI diagnosis and notifications, the platform needs no internet access.
