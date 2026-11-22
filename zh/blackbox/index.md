---
title: Softprobe Blackbox
---

# Softprobe Blackbox

**捕获全栈 Web 与 Agent 会话，审查步骤、HTTP 消息体与 Findings，用生产证据改进应用与 Agent。**

Blackbox 将 Web 应用（`@softprobe/web-record` 与官方 OpenTelemetry OBI）和 AI Agent（OpenCode、LangChain / LangGraph 与 Vercel AI）接入 Softprobe Explorer，使每次浏览器请求、后端 span、模型调用与工具使用都以关联 Session 形式落入 Explorer，便于检查。

## Blackbox 能做什么

- **用 Explorer 里的一条提示完成安装** — 粘贴到编码 Agent（Cursor、Claude Code、Codex 或 OpenCode）
- **捕获完整 Session** — 浏览器活动、OBI 后端 HTTP 消息体，以及用户轮次、生成、工具、重试与错误
- **在 Explorer 中审查** — Sessions、Graph、Trajectory、Findings，观察生产行为
- **通过 Blackbox MCP 排查** — 在编码 Agent 中通过 OAuth 直接查询 Session、span 与 trace
- **可选 Slack** — 验证捕获成功后再绑定频道

## Blackbox 不是什么

| 产品 | 适用场景 |
|------|----------|
| **[Lisa](/zh/lisa/)** | 需要 AI QA Agent 按已批准策略评估会话并跟踪告警 |
| **[Arex](/zh/arex/)** | Java 录制 / 回放回归（JVM Agent） |

Blackbox 是 Web 应用与 AI Agent 的**在线会话捕获与审查**路径。Evaluation 消费证据；测试与平台覆盖各自流程。

## 从这里开始

1. [快速开始](/zh/blackbox/getting-started) — 从 Explorer 连接
2. [OpenCode 安装](/zh/blackbox/opencode) — 插件、凭证、排障
3. [LangChain 安装](/zh/blackbox/langchain) — Callback Handler（Python / TypeScript）
4. [用编码 Agent 排查](/zh/blackbox/coding-agent-skills) — 在 Cursor、Claude Code、Codex、OpenCode 中诊断 Session
5. [概念](/zh/blackbox/concepts) — Session 与 observation 形态
6. **[从录制的会话生成端到端测试](/zh/blackbox/e2e-testing)。** 将录制的浏览器会话编译为 `@playwright/test` 或 `e2e` 测试并校验后端出站 HTTP 调用。
