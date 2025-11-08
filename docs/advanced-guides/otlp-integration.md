---
sidebar_position: 2
sidebar_label: OTLP Ingestion & Query
title: OTLP Ingestion & Query
description: How Softprobe accepts and serves OTLP (OpenTelemetry Protocol) data — endpoints, formats (Protobuf/JSON), and common questions.
---

# OTLP Ingestion & Query

Softprobe supports both OTLP Protobuf and OTLP JSON for ingestion and query, allowing you to reuse your existing OpenTelemetry ecosystem.

## Ingestion Endpoints

- /v1/traces — accepts OTLP Traces (Protobuf or JSON)
- /v1/metrics — accepts OTLP Metrics (Protobuf or JSON)
- /v1/logs — accepts OTLP Logs (Protobuf or JSON)

Requests must carry authentication (e.g., public key or Public Key). Content negotiation determines the parsing format.

## Query Endpoints

- /v1/traces — query trace data (Protobuf or JSON responses)
- /v1/inject — inject (or synthesize) trace data for testing and demos

## Content Negotiation & Formats

- Content-Type and Accept headers decide whether Protobuf or JSON is used
- In JSON, some enum values may appear as strings or integers for compatibility

## Example: Send OTLP JSON via cURL

```bash
curl -X POST "https://o.softprobe.ai/v1/traces" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "x-sp-public-key: <your-public-key>" \
  --data '{"resourceSpans": []}'
```

## Working with SP‑Istio Agent

- You can use only OTLP endpoints, or combine them with the SP‑Istio Agent for zero‑intrusion HTTP traffic capture on the server side
- In Kubernetes + Istio environments, the Agent is injected into Envoy via a Wasm plugin to capture request/response and business context

## Configuration & Environment

- Backend endpoint (default): https://o.softprobe.ai
- In the Agent configuration, set `sp_backend_url` and `public_key` to enable secure transport

## Frequently Asked Questions

- Does Softprobe support OTLP JSON? Yes, with compatibility for common parsing differences
- Can I query traces by session or business flow? Yes — the Dashboard provides session views and cross‑service call trees
- Do I need to deploy a Collector? Optional. You can push directly to Softprobe, or aggregate via a Collector and forward