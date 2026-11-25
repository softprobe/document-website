---
title: 用编码 Agent 排查
---

# 在编码 Agent 中使用 Blackbox

通过 Softprobe 插件市场（[`softprobe/softprobe-plugin`](https://github.com/softprobe/softprobe-plugin)）安装 Blackbox 插件（`softprobe-blackbox@softprobe`），即可将你的 AI 编码 Agent 连接到 Softprobe Explorer，并在浏览器中使用现有 Explorer 账号完成登录。Blackbox 为编码 Agent 提供 19 个 MCP 工具与排查技能，可用于查询 Session、检查 Span 与 Trace、查看关联日志、读取紧凑的语义动作时间线、管理 Agent 应用，以及在明确请求时获取 Ingestion Key。

这与**捕获**（`@softprobe/web-record` 浏览器 SDK、OBI 或 AI 框架 SDK）不同。捕获负责记录 Session。Blackbox 插件与 MCP 工具让编码 Agent **管理 Agent 并排查 Session**。

## 1. 安装 Blackbox 插件（推荐）

`softprobe/softprobe-plugin` 是 Softprobe 的多产品插件市场（MIT 协议）。安装 `softprobe-blackbox@softprobe` 会同时配置 Blackbox 技能与托管 MCP 服务（`https://explorer.softprobe.ai/mcp`）。

::: code-group

```text [Claude Code]
/plugin marketplace add softprobe/softprobe-plugin
/plugin install softprobe-blackbox@softprobe
```

```bash [OpenCode]
opencode plugin @softprobe/opencode-blackbox -g
```

```bash [Gemini CLI]
gemini extensions install https://github.com/softprobe/softprobe-plugin
```

```bash [Cursor]
npx skills add softprobe/softprobe-plugin -g -y -a cursor
```

```bash [Codex]
npx skills add softprobe/softprobe-plugin -g -y -a codex
```

```bash [Antigravity]
npx skills add softprobe/softprobe-plugin -g -y -a antigravity
```

:::

- **Claude Code**：在 Claude Code 中依次运行 `/plugin marketplace add softprobe/softprobe-plugin` 与 `/plugin install softprobe-blackbox@softprobe`。
- **Cursor**：在 **Settings → Plugins** 中添加 `softprobe/softprobe-plugin` 并安装 `softprobe-blackbox@softprobe`，或运行 `npx skills add softprobe/softprobe-plugin -g -y -a cursor` 安装技能。若当前 Cursor 版本未自动挂载插件自带的 MCP 服务，请同时参考下方的[手动回退：直连托管 MCP](#手动回退直连托管-mcp)。
- **OpenAI Codex CLI**：在 Codex 插件配置中从 `softprobe/softprobe-plugin` 启用 `softprobe-blackbox@softprobe`，或运行 `npx skills add softprobe/softprobe-plugin -g -y -a codex` 并配置下方的[手动回退：直连托管 MCP](#手动回退直连托管-mcp)。
- **VS Code / GitHub Copilot**：在 VS Code 中将 `softprobe/softprobe-plugin` 添加为 Agent 插件市场并安装 `softprobe-blackbox@softprobe`，或通过下方的[手动回退：直连托管 MCP](#手动回退直连托管-mcp) 将 `https://explorer.softprobe.ai/mcp` 写入 `.vscode/mcp.json`。
- **Gemini CLI**：在终端运行 `gemini extensions install https://github.com/softprobe/softprobe-plugin`。
- **Antigravity（`agy`）**：从 `softprobe/softprobe-plugin` 安装 `softprobe-blackbox@softprobe`，或运行 `npx skills add softprobe/softprobe-plugin -g -y -a antigravity`，并确认 `~/.gemini/config/mcp_config.json` 或 `.agents/mcp_config.json` 中已配置 `blackbox`。
- **OpenCode**：在终端运行 `opencode plugin @softprobe/opencode-blackbox -g`。
- **Windsurf**：从 `softprobe/softprobe-plugin` 安装 `softprobe-blackbox@softprobe`，或通过下方的[手动回退：直连托管 MCP](#手动回退直连托管-mcp) 将 `https://explorer.softprobe.ai/mcp` 写入 `~/.codeium/windsurf/mcp_config.json`。

## 2. 登录并验证访问权限

通过浏览器使用 Explorer 账号完成 OAuth 认证：

::: code-group

```text [Claude Code]
/mcp
```

```bash [Codex]
codex mcp login blackbox
```

```bash [Cursor]
agent mcp enable blackbox && agent mcp login blackbox
```

```bash [OpenCode]
opencode mcp auth blackbox
```

```text [Antigravity]
/mcp
```

:::

- **Claude Code**：在 Claude Code 中运行 `/mcp`，在浏览器中使用 Explorer 账号登录并选择 **Allow**。
- **Codex**：运行 `codex mcp login blackbox` 并在浏览器中完成 Explorer 登录授权。
- **Cursor**：在终端运行 `agent mcp enable blackbox && agent mcp login blackbox`（或在 Cursor 编辑器中打开 **Customize → MCPs** 并点击 **Sign in**）。你可以通过 `agent mcp` 在终端管理与测试 MCP 服务：

| 命令 | 用途 |
|------|------|
| `agent mcp list` | 查看已配置的 MCP 服务、传输类型与当前状态 |
| `agent mcp list-tools blackbox` | 列出 Blackbox MCP 暴露的所有工具与参数 |
| `agent mcp login blackbox` | 通过外部 OAuth 流程完成 Blackbox MCP 认证 |
| `agent mcp enable blackbox` | 批准并挂载 Blackbox MCP 供 Agent 使用 |
| `agent mcp disable blackbox` | 卸载 Blackbox MCP 使其不再加载 |

- **OpenCode**：运行 `opencode mcp auth blackbox` 并在浏览器中完成 Explorer 登录授权。
- **Antigravity（`agy`）**：在 `agy` 中运行 `/mcp`，选中 `blackbox` 并选择 **Authenticate** 在浏览器中完成登录授权（或在 Antigravity 桌面应用与 IDE 的 **MCP Servers** 中完成认证）。
- **VS Code / GitHub Copilot、Gemini CLI 与 Windsurf**：触发任意 Blackbox MCP 工具或打开客户端的 MCP 面板，按提示在浏览器中完成 OAuth 登录授权。

随后可让编码 Agent 调用 `whoami` 或 `list_workspaces` 验证连接。如果有多个工作区，可让 Agent 调用 `select_workspace` 并传入目标 `workspace_id` 进行切换。

## 3. 可用的 Blackbox MCP 工具

Blackbox 提供 19 个 MCP 工具，涵盖账号与工作区、遥测排查、E2E 测试生成与 Agent 管理：

| 分类 | 工具 | 用途 |
|------|------|------|
| **账号与工作区** | `whoami`、`list_workspaces`、`select_workspace` | 查看当前登录用户、列出可用工作区、切换当前工作区 |
| **Session 与 E2E 测试** | `search_sessions`、`get_session`、`get_session_spans`、`get_session_semantic_actions` | 按 Agent、状态或时间范围检索 Session，读取 Session 元数据与 Span，并读取带定位器与触发 `trace_id` 的紧凑语义动作时间线以生成 E2E 测试 |
| **Span 与 Trace 排查** | `search_spans`、`get_span`、`search_traces`、`get_trace`、`list_trace_tags`、`list_trace_tag_values` | 筛选 GenAI、工具调用与 HTTP Span，查看完整分布式 Trace，并发现 Trace 标签键与标签值 |
| **日志排查** | `logs_by_session`、`logs_by_trace` | 读取与指定 Session 或 Trace 关联的结构化日志 |
| **Agent 与密钥管理** | `list_agents`、`create_agent`、`get_ingestion_key`、`bootstrap_project` | 列出 Agent 应用、创建新 Agent 应用、在明确请求时读取 Agent 的 Ingestion Key，并生成项目接入配置提示词 |

## 4. 向 Agent 提问

示例：

- 用 Blackbox：为什么 session `sess_…` 失败了？检查工具错误、关联日志和最后一次 generation。
- Blackbox：列出过去 24 小时内 agent `my-agent` 有错误的 Session。
- Blackbox：打开 trace `…`，总结工具结果与模型最终回答是否一致。
- Blackbox：对会话 `sess_…` 调用 `get_session_semantic_actions`，用 `get_trace` 检查订票与支付链路，剔除多余点击并编写断言确认邮件调用的 `@playwright/test` + `@softprobe/e2e` 测试。
- Blackbox：创建一个名为 `checkout-bot` 的 Agent 应用并输出它的 Ingestion Key。

Agent 会在回答中引用 `session_id`、`trace_id` 或 `span_id`，并附上 Explorer 链接：

`https://explorer.softprobe.ai?session=<session_id>`

## 手动回退：直连托管 MCP

如果当前客户端或环境不支持原生插件安装，可直接将托管 MCP 服务（`https://explorer.softprobe.ai/mcp`）添加为 `blackbox`：

::: code-group

```bash [Claude Code]
claude mcp remove blackbox 2>/dev/null; claude mcp add --transport http blackbox https://explorer.softprobe.ai/mcp
```

```bash [Codex]
codex mcp add blackbox --url https://explorer.softprobe.ai/mcp
```

```json [Cursor]
{
  "mcpServers": {
    "blackbox": {
      "url": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

```json [VS Code / Copilot]
{
  "servers": {
    "blackbox": {
      "type": "http",
      "url": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

```json [Gemini CLI]
{
  "mcpServers": {
    "blackbox": {
      "httpUrl": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

```bash [OpenCode]
opencode mcp add blackbox --global --url https://explorer.softprobe.ai/mcp
```

```json [Antigravity]
{
  "mcpServers": {
    "blackbox": {
      "url": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

```json [Windsurf]
{
  "mcpServers": {
    "blackbox": {
      "serverUrl": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

:::

- **Cursor**：将上述 JSON 写入 `.cursor/mcp.json` 或 `~/.cursor/mcp.json`，或直接点击 [Add Blackbox to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Blackbox&config=eyJ1cmwiOiJodHRwczovL2V4cGxvcmVyLnNvZnRwcm9iZS5haS9tY3AifQ%3D%3D)。
- **VS Code / GitHub Copilot**：将上述 JSON 写入 `.vscode/mcp.json`（工作区）或 VS Code 用户级 `mcp.json`。
- **Gemini CLI**：将上述 JSON 写入 `~/.gemini/settings.json` 或 `.gemini/settings.json`。
- **Antigravity（`agy`）**：将上述 JSON 写入 `~/.gemini/config/mcp_config.json`（全局）或 `.agents/mcp_config.json`（工作区）。
- **Windsurf**：将上述 JSON 写入 `~/.codeium/windsurf/mcp_config.json`。

### Staging / 开发环境（`blackbox-staging`）

如需同时连接 staging 与生产环境而不覆盖生产环境登录态，可将 `https://explorer-staging.softprobe.ai/mcp` 注册为 `blackbox-staging`：

::: code-group

```bash [Claude Code]
claude mcp remove blackbox-staging 2>/dev/null; claude mcp add --transport http blackbox-staging https://explorer-staging.softprobe.ai/mcp
```

```bash [Codex]
codex mcp add blackbox-staging --url https://explorer-staging.softprobe.ai/mcp
```

```json [Cursor]
{
  "mcpServers": {
    "blackbox-staging": {
      "url": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

```json [VS Code / Copilot]
{
  "servers": {
    "blackbox-staging": {
      "type": "http",
      "url": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

```json [Gemini CLI]
{
  "mcpServers": {
    "blackbox-staging": {
      "httpUrl": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

```bash [OpenCode]
opencode mcp add blackbox-staging --global --url https://explorer-staging.softprobe.ai/mcp
```

```json [Antigravity]
{
  "mcpServers": {
    "blackbox-staging": {
      "url": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

```json [Windsurf]
{
  "mcpServers": {
    "blackbox-staging": {
      "serverUrl": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

:::

使用相同的客户端命令并以 `blackbox-staging` 作为服务名完成登录授权（例如 `codex mcp login blackbox-staging`、`opencode mcp auth blackbox-staging`，或在 Claude Code、Antigravity 中运行 `/mcp`）。

## 隐私

- 托管 MCP 使用你的 Softprobe 用户登录（OAuth）。令牌留在你的 MCP 客户端。
- Session、Span、Trace 与日志工具均为只读。
- Agent 管理工具基于你当前选择的工作区成员身份运行。`create_agent` 创建 Agent 应用，`get_ingestion_key` 仅在请求时返回对应 Agent 的 Ingestion Key。
- Ingestion Key 仅限遥测写入（ingest-only），无法调用 MCP 或读取 Session。

## 排障

| 现象 | 处理 |
|------|------|
| 浏览器鉴权循环 | 在 Softprobe 同意页完成 Allow，并确认已登录 Explorer |
| 工作区选择器 / 409 | 在 Explorer 侧边栏底部选择工作区，或让 Agent 调用 `list_workspaces` 与 `select_workspace` |
| 缺少 MCP 工具 | 从 `softprobe/softprobe-plugin` 重新安装 `softprobe-blackbox@softprobe`，或手动添加 `https://explorer.softprobe.ai/mcp` 并完成浏览器登录授权 |
| 与 OpenCode 捕获混淆 | 捕获使用连接 Agent 流程中的 `@softprobe/opencode-plugin`。Blackbox（`@softprobe/opencode-blackbox` 与 MCP）负责管理 Agent 记录与排查 Session，不负责采集遥测 |

## 下一步

- [快速开始](/zh/blackbox/getting-started)：连接 Agent 并验证捕获
- [概念](/zh/blackbox/concepts)：Session 与 observation 形态
- [Explorer](https://explorer.softprobe.ai)
