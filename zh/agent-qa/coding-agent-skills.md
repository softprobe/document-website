---
title: 用编码 Agent 排查
---

# 在编码 Agent 中使用 Blackbox MCP

将 Claude Code、Codex、Cursor、OpenCode 或 Antigravity（`agy`）连接到 Softprobe Explorer，在浏览器中使用现有 Explorer 账号完成登录。Blackbox MCP 可查询 Session、查看 Session 详情、列出和创建 Agent 应用，并在你明确请求时读取 Agent 的 Ingestion Key。

这与**捕获**（`@softprobe/web-record` 浏览器 SDK、OBI 或 AI 框架 SDK）不同。捕获负责记录 Session；Blackbox MCP 让编码 Agent **管理 Agent 并排查 Session**。

## 1. 添加 Blackbox MCP

选择你的编码 Agent，并将 Softprobe MCP 服务（`https://explorer.softprobe.ai/mcp`）添加为 `blackbox`：

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

:::

- **Cursor**：将上述 JSON 写入 `.cursor/mcp.json` 或 `~/.cursor/mcp.json`，或直接点击 [Add Blackbox to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Blackbox&config=eyJ1cmwiOiJodHRwczovL2V4cGxvcmVyLnNvZnRwcm9iZS5haS9tY3AifQ%3D%3D)。
- **Antigravity（`agy`）**：将上述 JSON 写入 `~/.gemini/config/mcp_config.json`（全局）或 `.agents/mcp_config.json`（工作区）。

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

随后可让编码 Agent 调用 `list_workspaces` 验证连接。

## 3. 向 Agent 提问

示例：

- 用 Blackbox：为什么 session `sess_…` 失败了？检查工具错误和最后一次 generation。
- Blackbox：列出过去 24 小时内 agent `my-agent` 有错误的 Session。
- Blackbox：打开 trace `…`，总结工具结果与模型最终回答是否一致。

Agent 可使用 `search_sessions`、`get_session` 与 `get_session_spans` 排查遥测数据，也可使用 `list_agents` 与 `create_agent` 管理 Agent 应用；仅在明确请求时通过 `get_agent_api_key` 获取 Agent 凭证。回答中请引用 `session_id` / `trace_id` / `span_id`，并附上 Explorer 链接：

`https://explorer.softprobe.ai?session=<session_id>`

## 可选：技能剧本（skill playbook）

```bash
npx skills add softprobe/softprobe-skills -g -y \
  -a cursor -a claude-code -a codex -a opencode \
  -s softprobe-agent-qa
```

来源：[github.com/softprobe/softprobe-skills](https://github.com/softprobe/softprobe-skills)（Apache-2.0）。

## 隐私

- 托管 MCP 使用你的 Softprobe 用户登录（OAuth）。令牌留在你的 MCP 客户端。
- Session、trace 与日志工具均为只读。
- Agent 管理工具基于你当前选择的工作区成员身份运行；`create_agent` 创建 Agent 应用，`get_agent_api_key` 仅在请求时返回对应密钥。
- Ingestion Key 仅限遥测写入（ingest-only），无法调用 MCP 或读取 Session。

## 排障

| 现象 | 处理 |
|------|------|
| 浏览器鉴权循环 | 在 Softprobe 同意页完成 Allow；确认已登录 Explorer |
| 工作区选择器 / 409 | 在 Explorer 选择工作区，或让 Agent 调用 `list_workspaces` / `select_workspace` |
| 缺少 MCP 工具 | 在客户端重新添加 `https://explorer.softprobe.ai/mcp`，并完成浏览器登录授权 |
| 与 OpenCode 捕获混淆 | 捕获使用连接 Agent 流程中的 `@softprobe/opencode-plugin`；MCP 用于管理 Agent 记录与排查 Session，不负责采集遥测 |

## 下一步

- [快速开始](/zh/agent-qa/getting-started) — 连接 Agent 并验证捕获
- [概念](/zh/agent-qa/concepts) — Session 与 observation 形态
- [Explorer](https://explorer.softprobe.ai)
