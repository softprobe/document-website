---
sidebar_position: 3
sidebar_label: SP-Istio Agent Architecture
title: SP-Istio Agent Architecture
description: A practical overview of how the SP‑Istio Agent works — data capture flow, configuration, performance, and security.
---

# SP-Istio Agent Architecture

This page explains the server-side collection component of Softprobe — the SP‑Istio Agent — including how it is injected, what data it captures, and how it transmits telemetry securely and efficiently.

## Overview

- Deployment: Injected into Istio's Envoy sidecar via WasmPlugin
- Implementation: Rust + WebAssembly (Wasm)
- Capture scope: HTTP request/response, context headers, status codes, latency, and custom tags
- Transmission: Asynchronous batched delivery to the Softprobe backend with retry and queueing

## How It Works

1. Request enters Envoy → the Wasm filter intercepts and parses key fields (method, path, status code, headers, etc.)
2. Collection rules (collectionRules) decide whether to capture the event
3. The event is built and appended to an internal buffer/queue
4. Batches are sent asynchronously to the backend (e.g., o.softprobe.ai), carrying your `public_key` for authentication
5. The backend stores and indexes data; the Dashboard provides session views and cross‑service call trees

## Configuration Highlights

- `traffic_direction`: choose `server` (inbound) or `client` (outbound)
- `collectionRules`: use regex for `host`/`path` to precisely control capture scope
- Service discovery: an EnvoyFilter (Lua) injects `x-sp-service-name` automatically
- External communication: use ServiceEntry + DestinationRule to authorize secure egress to the Softprobe backend

## Performance & Reliability

- Low overhead: Wasm runs inside Envoy with no language/framework intrusion
- Asynchronous delivery: minimizes impact on business requests; supports backpressure and retry
- Resource control: rate limiting and queue sizing to avoid peak pressure

## Security

- Transport encryption: TLS, with egress restricted to approved backend domains
- Authentication: public key or Public Key validates tenant identity
- Privacy & compliance: field masking/redaction and configurable capture scope

## Working with OTLP

- Use side‑by‑side: the Agent provides zero‑intrusion HTTP capture; OTLP receives data from SDKs/Collectors
- The backend unifies indexing and correlation, enabling session and trace views across data sources

## Next Steps

- Read the configuration guide and deploy the Agent in a test environment
- Validate data and observability in the Dashboard
- Expand collection rules and tagging progressively based on business scenarios