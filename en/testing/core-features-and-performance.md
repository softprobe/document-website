---
title: Core Features and Performance
---

# Core Features and Performance

> This document is written for system users and decision makers. It answers four questions: what the system does, how large it scales, how fast it processes, and how many resources it needs.

---

## 1. What the system does

SoftProbe is a traffic record-and-replay testing platform. It "records" real production requests together with everything they touch — databases, caches, downstream services — and later "replays" that real traffic during version upgrades, system refactoring, or new-environment validation, automatically diffing the two runs to surface any inconsistencies.

It solves two common problems:

1. **Insufficient test coverage**: hand-written test cases rarely cover the parameter combinations and edge cases that actually occur in production.
2. **Manual regression checking**: after an upgrade, teams often have to compare old and new results by hand to find which endpoints changed behavior.

Using real traffic instead of hand-crafted test cases is the core value of the system.

---

## 2. Core features

### 2.1 Traffic recording (no business code changes)

Add a single agent flag to the JVM startup arguments of the application under test and recording begins — no business code changes, no in-code instrumentation.

During recording, the system automatically captures two kinds of data:

- **Inbound traffic**: complete requests and responses at HTTP endpoints, Dubbo services, message consumers, and other entries.
- **Outbound dependencies**: full request parameters and return values when the application calls databases, Redis, HTTP downstreams, or RPC services.

This means a recording contains not just "what the endpoint returned", but also "which data the endpoint queried, which services it called, and what each of them returned" — a complete call chain.

**Supported frameworks** (covering the mainstream Java stack):

| Category | Supported |
|---|---|
| Application entries | Servlet, Spring Boot, Spring Cloud Gateway, Dubbo Provider, Netty |
| HTTP clients | Apache HttpClient, OkHttp, Feign, RestTemplate, WebClient |
| Databases | MyBatis, MyBatis-Plus, Hibernate, MongoDB |
| Caches | Jedis, Lettuce, Redisson, Spring Data Redis, Caffeine, Guava |
| RPC | Apache Dubbo / Alibaba Dubbo |
| Others | Apollo config center, thread pools, system time, Spring Security / Shiro, etc. |

### 2.2 Traffic replay (no real dependency environment)

During replay, the system replaces external dependencies with recorded data: database queries return the recorded results, downstream calls return the recorded responses — the real database and real downstreams are never touched.

Benefits:

- Replay does not require a full test environment (databases and dependent services can be omitted).
- Production traffic can be replayed repeatedly and in bulk for stress or regression validation.

### 2.3 Automatic result diffing

The recorded and replayed results are compared field by field. Values that change every time but carry no business meaning — timestamps, UUIDs, random numbers, IP addresses — are ignored automatically.

Diff outcomes are classified as: matched, different, extra calls during replay, or missing calls during replay, with each difference pinpointed to a specific endpoint and field.

### 2.4 Replay reports and issue localization

Every replay produces a report showing pass rate, failures, and diff details, with daily trend views. Cases with differences link directly to the endpoint, showing the exact differences between the old and new payloads.

### 2.5 Sensitive data protection

Two layers of protection for sensitive fields (ID numbers, phone numbers, bank card numbers, etc.) in recorded data:

- **Display masking**: sensitive fields are masked in viewing pages.
- **Field encryption**: sensitive fields are encrypted at rest, supporting AES-256 and the SM4 national cryptographic algorithm.

### 2.6 Replay failure diagnosis

When a replay shows differences or failures, the system can automatically collect the case's request, response, dependency calls, and logs, then produce a root-cause judgment after comparison — reducing manual investigation.

### 2.7 Management and collaboration

A web console provides application management, replay plan management, record/replay policy configuration (with import/export), user and permission management, and report dashboards.

---

## 3. Performance and scale

### 3.1 Agent impact on the business system

The agent runs inside the application under test, so customers care most about its overhead. Conclusions:

| Concern | Conclusion |
|---|---|
| Attach method | One JVM startup flag, no code changes |
| Overhead under normal load | Imperceptible for ordinary business at 10k-level QPS; per-request extra cost on recorded endpoints is in the microseconds-to-tens-of-milliseconds range |
| Data upload | Asynchronous batched upload, does not block business requests |
| Protection mechanisms | Automatic slowdown when host CPU/memory exceeds thresholds; buffer overflow discards data instead of affecting the business |

One clarification: "microseconds to tens of milliseconds" applies to ordinary payloads. For very large payloads (tens of MB per request/response), serialization itself introduces noticeable cost; such scenarios need targeted tuning at onboarding (limit recorded payload size, adjust sampling rate, etc.). Built-in payload truncation protection caps gateway-entry requests at 1 MB and responses at 10 MB.

### 3.2 Recording throughput

| Metric | Value | Notes |
|---|---|---|
| Per-record persistence latency | ~2 ms | Design baseline for a single write |
| Ingestion mode | Batched concurrent writes | The agent uploads asynchronously in batches; the backend persists concurrently with multiple threads |
| Agent-side sampling / rate limiting | Configurable | Per-endpoint rate limits and ratio-based sampling to control ingestion volume |

Recorded data first enters an in-memory buffer on the agent side and is uploaded asynchronously by background threads, never blocking business requests.

### 3.3 Replay throughput

| Metric | Value | Notes |
|---|---|---|
| Replay pressure | Configurable | Delivered default 5 QPS/instance, speed gears from 0.25x to 4x |
| Real-time replay processing | ~1 s/batch | ~800 cases per batch (8-core, shard-warmed scenario) |

Replay pressure is controlled: the system ramps up in steps, only advancing after consecutive successes and backing off automatically on failure, so the target system is never overwhelmed.

### 3.4 Scale limits

The system has been validated and evaluated at the following scales:

- **Million-level QPS gateway scenario**: integrated with Spring Cloud Gateway, handling large payloads (~1 MB requests, ~10 MB responses). That figure is the gateway's business traffic; recording fans out per request — one request produces an entry record plus one record per dependency call — and is full-volume by default. Onboarding at this scale requires agent tuning (shorter internal context retention, optional sampling-rate configuration), with automatic degradation as a backstop when host resources exceed thresholds; after tuning the system runs stably.
- **Massive data volume**: estimated at 500k records/s and ~5 KB per record, data writes reach ~2.5 GB/s, or ~216 TB/day (worst-case estimate without sampling); the storage layer supports sharding and scales horizontally.

---

## 4. Resource requirements

### 4.1 Agent side: near-zero extra resources

The agent runs inside the application's own JVM and needs no dedicated server. Extra footprint:

- A small amount of memory for buffering and class instrumentation (Metaspace).

The agent uploads data through its own dedicated connection pool, never sharing business thread pools or connection pools.

### 4.2 Backend: a single ordinary server is enough to start

The backend offers an All-in-One monolithic deployment that combines configuration, storage, scheduling, and reporting into a single process with a single external port. Default JVM memory starts at 2 GB, max 3 GB — a single ordinary server is enough, with minimal deployment dependencies.
