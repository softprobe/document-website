---
layout: home
title: Softprobe
titleTemplate: false
hero:
  name: Softprobe
  text: 面向 AI Agent 的绩效审查
  tagline: 捕获 Session · 审查 Steps · 改进关键所在
  actions:
    - theme: brand
      text: 连接你的 Agent
      link: /zh/agent-qa/getting-started
    - theme: alt
      text: 用编码 Agent 排查
      link: /zh/agent-qa/coding-agent-skills
    - theme: alt
      text: 测试
      link: /zh/testing/getting-started
features:
  - title: 我在生产中做 AI Agent QA
    details: 用一条可粘贴提示连接 OpenCode 或 LangChain，捕获 Session 与 Steps，审查 Findings，并可选择把告警路由到 Slack。
    link: /zh/agent-qa/
    linkText: Agent QA
  - title: 我做 AI Agent 评估
    details: 编写套件，在 CI 中跑确定性与基于结果的评估，对比运行并设置发布门禁 — 兼容 Promptfoo 导入，清单由内核拥有，存储走 thelake。
    link: /zh/evaluation/
    linkText: Agent Evaluation
  - title: 我是开发者
    details: 给服务挂上 Java Agent，录制真实流量，把它作为回归测试回放，依赖自动 Mock。
    link: /zh/testing/getting-started
    linkText: 接入你的应用
  - title: 我负责平台 / CI
    details: 用 Helm 部署 Softprobe 服务端。新版本发布到测试环境后，由流水线自动回放，并根据结论决定是否继续。
    link: /zh/testing/webhook-and-ci
    linkText: 发版后自动回放
  - title: 我需要可观测性
    details: Istio Wasm 代理与 SESSIFY 会话上下文汇入业务流仪表盘 —— 按平台指南部署到 GKE。
    link: /zh/platform/getting-started/quick-start
    linkText: 业务观测
---
