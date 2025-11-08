---
sidebar_position: 3
sidebar_label: SP‑Istio Agent 架构
title: SP‑Istio Agent 架构
description: SP‑Istio Agent 的工作原理——数据采集流程、配置要点、性能与安全。
---

# SP‑Istio Agent 架构

该页面介绍服务端采集组件 SP‑Istio Agent 的工作原理，包括如何注入、采集哪些数据、以及如何高效安全地传输遥测数据。

## 概览
- 部署：通过 WasmPlugin 注入到 Istio 的 Envoy sidecar
- 实现：Rust + WebAssembly (Wasm)
- 采集范围：HTTP 请求/响应、上下文头、状态码、延迟与自定义标签
- 传输：异步批量发送到 Softprobe 后端（带重试与队列）

## 工作流程
1. 请求进入 Envoy → Wasm 过滤器拦截并解析关键字段
2. `collectionRules` 决定是否采集事件
3. 构建事件并追加到内部缓冲/队列
4. 批量异步发送到后端，携带 `public_key` 进行认证
5. 后端存储与索引，仪表盘提供会话视图与跨服务调用树

## 配置要点
- `traffic_direction`：选择 `server`（入站）或 `client`（出站）
- `collectionRules`：使用正则匹配 `host`/`path` 精准控制采集范围
- 服务发现：通过 EnvoyFilter（Lua）自动注入 `x-sp-service-name`
- 外部通信：使用 ServiceEntry + DestinationRule 授权安全的 egress 到 Softprobe 后端

## 性能与可靠性
- 低开销：Wasm 在 Envoy 内运行，对业务代码无侵入
- 异步传输：最小化对请求的影响，支持背压与重试
- 资源控制：限速与队列配置，避免峰值压力

## 安全
- 传输加密：TLS，严格限制 egress 到允许的后端域名
- 认证：使用 public key 验证租户身份
- 隐私与合规：字段掩码/脱敏与可配置采集范围

## 与 OTLP 协作
- 可并行使用：Agent 提供零侵入 HTTP 采集；OTLP 接收来自 SDK/Collector 的数据
- 后端统一索引与关联，支持跨数据源的会话与追踪视图