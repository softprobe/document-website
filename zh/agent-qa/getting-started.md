---
title: 快速开始
---

# 快速开始

在 Softprobe Explorer 中创建 Blackbox Agent，在编码 Agent 中连接 Blackbox MCP，应用设置提示或将现有 OpenTelemetry Exporter 指向 Blackbox，并验证首个采集到的 Session。

## 流程

```mermaid
flowchart LR
  explorer["Explorer · 创建 Blackbox Agent"]
  mcp["添加 Blackbox MCP + OAuth"]
  prompt["复制设置提示"]
  paste["粘贴到编码 Agent"]
  verify["检查连接"]
  explorer --> mcp --> prompt --> paste --> verify
```

## 1. 创建 Blackbox Agent

在 Softprobe Explorer 打开 **Agents**，点击 **+ Connect agent**。命名 Agent、选择环境，并选择应用集成类型（**Traditional web app**、**LangChain**、**Vercel AI** 或 **OpenCode**）。

Softprobe 会签发一把仅限遥测写入的 **Ingestion Key**（`spk_...`）。该密钥可向 `https://explorer.softprobe.ai/api/thelake/v1/traces` 上报 OTLP 遥测数据，无法读取 Session 或管理 Agent。

## 2. 添加 Blackbox MCP 并登录

按照 Explorer 中显示的命令，在 Claude Code、Codex、Cursor、OpenCode 或 Antigravity（`agy`）中将 `https://explorer.softprobe.ai/mcp` 添加为 `blackbox`，随后完成 Explorer OAuth 登录。编码 Agent 通过该 OAuth 连接调用 `list_workspaces`、`search_sessions` 与 `get_session_spans`。

客户端安装命令详见 [用编码 Agent 排查](/zh/agent-qa/coding-agent-skills)。

## 3. 配置遥测采集

从 Agent 的 **Actions** 菜单中选择 **Copy Blackbox setup prompt**，或从 **Connect Blackbox Agent** 页面复制 Blackbox 设置提示，再将其粘贴到应用仓库中的编码 Agent。该提示包含 Ingestion Key、`@softprobe/web-record` 浏览器配置、官方 OpenTelemetry OBI v1.0.0（`obi.yaml`）后端配置，以及各层具有独立 OpenTelemetry `service.name` 的 AI 框架埋点：

| 应用集成 | 设置提示配置的内容 |
|----------|--------------------|
| **Traditional web app** | 浏览器入口中的 `@softprobe/web-record`（设置浏览器 `serviceName`）与后端官方 OpenTelemetry OBI v1.0.0（每个后端设置 `OTEL_SERVICE_NAME`） |
| **LangChain** | 浏览器与 OBI 采集，外加 Python `softprobe[langchain]` 或 TypeScript `@softprobe/langchain` |
| **Vercel AI** | 浏览器与 OBI 采集，外加 `@softprobe/vercel-ai-sdk` 与 `@softprobe/tracing`（设置 AI 服务 `serviceName`） |
| **OpenCode** | 浏览器与 OBI 采集，外加 `@softprobe/opencode-plugin` |
| **OpenTelemetry GenAI、OpenInference 或 OpenLLMetry** | 标准 OTLP HTTP 追踪直接上报至 Blackbox，配置 `OTEL_SERVICE_NAME`，无需自定义 Softprobe 属性 |

### 现有 OpenTelemetry 应用直接导出 OTLP

如果服务已使用 OpenTelemetry GenAI（`gen_ai.*`）、Arize OpenInference（`openinference.*`）或 Traceloop OpenLLMetry（`traceloop.*`）生成 span，可将标准 OTLP HTTP Exporter 直接指向 Blackbox，无需添加自定义 span 属性：

```sh
export OTEL_SERVICE_NAME="my-agent"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer spk_REPLACE_WITH_AGENT_KEY"
```

请在 Agent 或请求 span 上设置 `gen_ai.conversation.id` 或 `session.id` 以按会话归组轮次，并为浏览器应用、AI Agent 与后端服务分别设置不同的 `serviceName` 或 `OTEL_SERVICE_NAME`，以便 **Graph** 与 **Span Detail** 清晰区分各个服务。

完整说明见 [OpenCode 安装](/zh/agent-qa/opencode) 与 [LangChain 安装](/zh/agent-qa/langchain)。

## 4. 验证采集

在应用中运行一次合成旅程，然后让编码 Agent 通过 Blackbox MCP 验证采集到的 Session，或在 Explorer 点击 **Check connection**。Explorer 会检查服务 span 是否出现在 **Graph** 中，并在 AI 应用中检查 `agent`、`generation` 与 `tool` 步骤是否出现在 **Trajectory** 中。

## 下一步

- [OpenCode 安装](/zh/agent-qa/opencode)
- [LangChain 安装](/zh/agent-qa/langchain)
- [概念](/zh/agent-qa/concepts)
