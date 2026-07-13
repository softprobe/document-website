---
layout: home
title: Softprobe
titleTemplate: false
hero:
  name: Softprobe
  text: 录制真实流量，用自动 Mock 回放，无需编写测试即可对比
  tagline: 零代码改动 · 全上下文可见性 · 成本优化
  actions:
    - theme: brand
      text: 从测试开始
      link: /zh/testing/getting-started
    - theme: alt
      text: 工作原理
      link: /zh/testing/how-it-works
    - theme: alt
      text: 业务观测
      link: /zh/platform/getting-started/quick-start
features:
  - title: 我是开发者
    details: 给服务挂上 Java Agent，录制真实流量，把它作为回归测试回放，依赖自动 Mock。
    link: /zh/testing/getting-started
    linkText: 接入你的应用
  - title: 我负责平台 / CI
    details: 用 Helm 安装 Softprobe 服务端，在 CI 中对回放做卡点，用 sp CLI 让 AI 编码 Agent 驱动整个流程。
    link: /zh/testing/webhook-and-ci
    linkText: 自动化与 AI 代理
  - title: 我需要可观测性
    details: Istio Wasm 代理与 SESSIFY 会话上下文汇入业务流仪表盘 —— 按平台指南部署到 GKE。
    link: /zh/platform/getting-started/quick-start
    linkText: 业务观测
---

::: info
同一站点包含 **测试**（Java 录制/回放和 `sp` 自动化）与 **业务观测**（Istio/SESSIFY）两类产品区域，请按上方角色选择路径。
:::
