---
sidebar_position: 2
sidebar_label: OTLP 接入与查询
title: OTLP 接入与查询
description: Softprobe 对 OTLP（OpenTelemetry Protocol）数据的接入与查询：端点、格式（Protobuf/JSON）与常见问题。
---

# OTLP 接入与查询

Softprobe 支持 OTLP Protobuf 与 OTLP JSON 的接入与查询，方便复用现有的 OpenTelemetry 生态。

## 接入端点
- /v1/traces — 接收 OTLP Traces（Protobuf 或 JSON）
- /v1/metrics — 接收 OTLP Metrics（Protobuf 或 JSON）
- /v1/logs — 接收 OTLP Logs（Protobuf 或 JSON）

请求需携带认证信息（如 public key）。内容协商决定解析格式。

## 查询端点
- /v1/traces — 查询 Trace 数据（支持 Protobuf/JSON 响应）
- /v1/inject — 注入或模拟 Trace 数据用于测试与演示

## 示例：通过 cURL 发送 OTLP JSON
```bash
curl -X POST "https://o.softprobe.ai/v1/traces" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "x-sp-public-key: <your-public-key>" \
  --data '{"resourceSpans": []}'
```

## 与 SP‑Istio Agent 配合
- 可仅使用 OTLP 端点，或与 SP‑Istio Agent 联合，实现服务端零侵入 HTTP 采集
- 在 Kubernetes + Istio 环境中，Agent 通过 Wasm 插件注入到 Envoy，用于捕获请求/响应与业务上下文

## 配置与环境
- 后端默认地址：https://o.softprobe.ai
- 在 Agent 配置中设置 `sp_backend_url` 与 `public_key` 以启用安全传输