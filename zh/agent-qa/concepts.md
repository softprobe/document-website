---
title: 概念
---

# 概念

Softprobe Blackbox 中 Session、Step 与 OpenTelemetry 追踪采集的核心术语。

## Session

**Session** 是 Explorer 中看到的一次用户或 Agent 旅程，按会话身份、时间范围与有序 **Steps** 对 span 进行归组。

Blackbox 从 OpenTelemetry `gen_ai.conversation.id` 或 `session.id` 解析 Session 身份，并通过相同的 W3C `trace_id` 关联 OpenTelemetry eBPF Instrumentation（OBI）采集的后端 HTTP span。OpenCode 将一次编码 Agent 对话及关联的嵌套子 Agent 任务映射为一个 Session。LangChain 与 LangGraph 使用应用自身的 thread、chat 或 session ID（例如 `configurable.thread_id`），当应用已提供会话 ID 时，Softprobe 不会另行生成替代 UUID。

## Observation 与 Step

Blackbox 将遥测存储为 OTLP span，并在界面中显示为 Steps。每个 Step 保留上报方的 OpenTelemetry `service.name` 与 span kind（`INTERNAL`、`SERVER`、`CLIENT`、`PRODUCER` 或 `CONSUMER`）：

| 类型 | 作用 |
|------|------|
| **Agent** | 轮次或 Agent 编排根节点（`invoke_agent`、`opencode.turn`） |
| **Generation** | 携带消息、模型元数据与 token 用量的模型调用（`chat`、`generate_content`） |
| **Tool** | 携带参数与结果的工具执行（`execute_tool`） |
| **Chain、Retriever、Embedding、Guardrail、Evaluator** | 工作流、检索、向量、安全护栏与评分 span |

典型 Agent 轮次按 `agent` 到 `generation` 再到 `tool` 组织，工具 span 根据框架挂在 generation 或 agent 轮次之下。

Session 的 token 总量仅汇总叶子级用量 span，不会重复累加父级 Agent 汇总值。当推理模型返回的 `total_tokens` 大于 `input_tokens + output_tokens` 时，Blackbox 会保留上报的 `total_tokens`。浏览器 DOM 录制与 HTTP 消息体捕获 span 仅附加回放与负载上下文，不计入 Session 的步骤数。

## OpenTelemetry GenAI 原生兼容

Blackbox 在 `https://explorer.softprobe.ai/api/thelake/v1/traces` 原生接收标准 OTLP HTTP 追踪数据，无需添加自定义 Softprobe span 属性：

- **OpenTelemetry GenAI 语义约定（`gen_ai.*`）。** 自动识别 `gen_ai.operation.name`、`gen_ai.agent.name`、`gen_ai.conversation.id`、`gen_ai.request.model`、`gen_ai.provider.name`、`gen_ai.tool.name`、`gen_ai.usage.*`、`session.id` 与 `user.id`。
- **Arize OpenInference（`openinference.*`）。** 自动识别 `openinference.span.kind`（`AGENT`、`LLM`、`TOOL`、`CHAIN`、`RETRIEVER`、`EMBEDDING`、`GUARDRAIL`、`EVALUATOR`）、`llm.*` 模型与 token 属性、`session.id` 与 `user.id`。
- **Traceloop OpenLLMetry（`traceloop.*`）。** 自动识别 `traceloop.span.kind`（`workflow`、`agent`、`task`、`tool`）、`traceloop.entity.*`、`traceloop.association.properties.*` 与 `gen_ai.*` 模型属性。
- **Softprobe 与主流框架 SDK。** 可与 `@softprobe/opencode-plugin`、`softprobe[langchain]`、`@softprobe/langchain`、`@softprobe/vercel-ai-sdk`（以及 Vercel AI `ai.*` span）、`@softprobe/web-record` 和官方 OBI 配合使用。

请为浏览器前端、AI Agent 服务与后端服务分别设置独立的 `serviceName` 或 `OTEL_SERVICE_NAME`，以便 Explorer 的 **Graph** 与 **Span Detail** 视图清晰区分各服务层级与外部调用目标。

## Finding

**Finding** 是附加在 Session 或其内部 Steps 上的策略或审查信号。为 Agent 绑定 Slack 频道后，Findings 可自动发送至该频道。

## Agent

在 Explorer 中，**Agent** 是你连接的命名采集目标，包含集成类型、环境标签、采集状态、可选 Slack 频道、已绑定策略，以及仅限写入的 API key（`spk_...`）。

## 相关指南

- [Agent Evaluation](/zh/evaluation/)。基于采集证据运行离线与 CI 评估套件及发布门禁。
- [OpenCode 安装](/zh/agent-qa/opencode)。配置 OpenCode 插件会话采集。
- [LangChain 安装](/zh/agent-qa/langchain)。配置 LangChain 与 LangGraph 回调或 OpenTelemetry 采集。
- [用编码 Agent 排查](/zh/agent-qa/coding-agent-skills)。在 Cursor、Claude Code、Codex、OpenCode 或 Antigravity 中诊断 Session。
