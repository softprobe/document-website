---
title: 平台文档
---

# Softprobe 平台

**零代码改动 · 全上下文可见性 · 成本优化**

::: info
Softprobe 将每一次用户旅程捕获为会话图谱——让交互可分析、可自动化，并能经济地长期留存。
:::

## 快速链接

- [快速入门](/zh/platform/getting-started/quick-start)
- [生产部署](/zh/platform/deployment/installation)
- [SESSIFY](/zh/platform/sessify)
- [仪表盘用户指南](/zh/platform/production/dashboard-user-guide)

## 录制与回放（Java）

Java 流量的捕获、回放与差异比对，请参见 [Softprobe 测试](/zh/testing/getting-started)。使用 [CLI 快速入门](/zh/testing/getting-started) 进行自动化。

## 工作原理

- **服务端：** Istio Envoy sidecar 中的 Wasm 插件 —— [SP-Istio Agent（GitHub）](https://github.com/softprobe/softprobe)
- **客户端：** [SESSIFY](/zh/platform/sessify) 以路由、指标与交互事件丰富会话

![Softprobe 架构](/img/docs/how-it-work.png)

::: tip 当前可用
- 数据采集：SESSIFY 与 Istio/Envoy OpenTelemetry 链路
- 可视化：Context View（会话图谱）
:::

![会话图谱](/img/docs/context-view.png)
