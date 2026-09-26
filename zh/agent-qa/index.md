---
title: Softprobe Agent QA
---

# Softprobe Agent QA

**捕获真实 Agent 会话，审查步骤与 Findings，用生产证据改进 Agent。**

Agent QA 将编码 Agent（OpenCode 与 LangChain / LangGraph）接入 Softprobe，使每次对话轮次、模型调用与工具使用都以 Session 形式落入 Explorer，便于检查。

## Agent QA 能做什么

- **用 Explorer 里的一条提示完成安装** — 粘贴到 OpenCode，或粘贴到 Cursor / Codex / Claude Code（LangChain）
- **捕获完整 Session** — 用户轮次、生成、工具、重试与错误
- **在 Explorer 中审查** — Sessions、Steps、Findings，观察生产行为
- **可选 Slack** — 验证捕获成功后再绑定频道

## Agent QA 不是什么

| 产品 | 适用场景 |
|------|----------|
| **[Agent Evaluation](/zh/evaluation/)** | 离线 / CI 套件、评估器与发布门禁 |
| **[测试](/zh/testing/)** | Java 录制 / 回放回归（JVM Agent） |
| **[平台](/zh/platform/)** | Istio / SESSIFY 业务流可观测 |

Agent QA 是 AI Agent 的**在线捕获与审查**路径。Evaluation 消费证据；测试与平台覆盖非 LLM 服务。

## 从这里开始

1. [快速开始](/zh/agent-qa/getting-started) — 从 Explorer 连接
2. [OpenCode 安装](/zh/agent-qa/opencode) — 插件、凭证、排障
3. [LangChain 安装](/zh/agent-qa/langchain) — Callback Handler（Python / TypeScript）
4. [用编码 Agent 排查](/zh/agent-qa/coding-agent-skills) — 在 Cursor、Claude Code、Codex、OpenCode 中诊断 Session
5. [概念](/zh/agent-qa/concepts) — Session 与 observation 形态
