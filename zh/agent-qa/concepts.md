---
title: 概念
---

# 概念

Softprobe Agent QA 中 Session 与 observation 的简要词汇。

## Session

**Session** 是 Explorer 中看到的一次 Agent 运行：身份（Agent 名称、环境）、时间线，以及有序的 **Steps**。OpenCode 将一次编码 Agent 对话（含已关联的嵌套子 Agent）映射为一个 Session。LangChain / LangGraph 使用**你自己的** thread / chat / session id（例如 LangGraph `configurable.thread_id`）——Softprobe 不会另行生成。

## Observation / Step

遥测以 OTLP span 存储，在界面中显示为 Steps。Softprobe LLM 形态：

| 类型 | 作用 |
|------|------|
| **Agent** | 轮次 / 编排根（`opencode.turn`） |
| **Generation** | 模型调用（含输入 / 输出与用量） |
| **Tool** | 工具调用（含参数与结果） |

典型拓扑：**agent → generation → tool**（工具可能挂在 generation 下，也可能挂在 agent 轮次下，取决于框架）。

## Finding

**Finding** 是挂在 Session（或其内部 Steps）上的策略或审查信号。为 Agent 绑定 Slack 频道后，Findings 可路由到该频道。

## Agent（产品实体）

在 Explorer 中，**Agent** 是你连接的命名捕获源：框架（如 OpenCode 或 LangChain）、环境、捕获状态、可选 Slack 频道、已分配策略，以及按 Agent 签发的 API key（`spk_…`）。

## 相关产品

- [Agent Evaluation](/zh/evaluation/) — 基于证据的离线 / CI 套件与门禁
- [OpenCode 安装](/zh/agent-qa/opencode) — OpenCode 插件捕获
- [LangChain 安装](/zh/agent-qa/langchain) — LangChain / LangGraph callback 捕获
- [用编码 Agent 排查](/zh/agent-qa/coding-agent-skills) — 在 Cursor、Claude Code、Codex、OpenCode 中诊断 Session
