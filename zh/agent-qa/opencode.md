---
title: OpenCode
---

# OpenCode 安装

通过 `@softprobe/opencode-plugin` 为 [OpenCode](https://opencode.ai) 安装 Softprobe Agent QA。优先使用 Explorer 中的**复制粘贴提示**（见 [快速开始](/zh/agent-qa/getting-started)）；本页为完整参考。该提示会要求编码 Agent 直接完成配置步骤，仅在卡住时再查阅文档或检查包 / 二进制。

OpenCode 官方支持两种插件加载方式：配置中列出的 **npm 包**，或 plugins 目录下的**本地文件**。Softprobe 使用 npm 路径。参见 OpenCode 文档：

- [Config](https://opencode.ai/docs/config/) — `opencode.json` / `opencode.jsonc`、合并顺序、位置
- [Plugins](https://opencode.ai/docs/plugins/) — npm `plugin` 字段、启动时 Bun 安装、本地插件目录

## 1. 启用插件

合并进现有 OpenCode 配置（**JSON 或 JSONC**）。若有项目配置优先用项目文件，否则用全局配置：

| 范围 | 文件 |
|------|------|
| 项目 | `./opencode.json` 或 `./opencode.jsonc` |
| 全局 | `~/.config/opencode/opencode.json` 或 `~/.config/opencode/opencode.jsonc` |

OpenCode 会**合并**各配置源（后出现的源覆盖冲突键）。保留已有键；若已有 `plugin`，把 `@softprobe/opencode-plugin@latest` 追加到该数组。

```json
{
  "experimental": {
    "openTelemetry": true
  },
  "plugin": ["@softprobe/opencode-plugin@latest"]
}
```

OpenCode 启动时会用 Bun 自动安装 npm 插件（缓存于 `~/.cache/opencode/node_modules/`）。改配置后请重启 OpenCode。

## 2. 凭证

在 OpenCode 配置目录创建 `opencode-softprobe.json`（这是 **Softprobe** 凭证文件，不属于 OpenCode schema）：

- 默认：`$XDG_CONFIG_HOME/opencode`（或 `~/.config/opencode`）
- 可用 `OPENCODE_CONFIG_DIR` 覆盖目录

```json
{
  "publicKey": "<agent-api-key>",
  "baseUrl": "https://explorer.softprobe.ai/api/thelake",
  "otlpEndpoint": "https://explorer.softprobe.ai/api/thelake/v1/traces",
  "environment": "Production"
}
```

| 字段 | 必填 | 含义 |
|------|------|------|
| `publicKey` | 是 | Explorer **Agents → + Connect agent** 中的 Agent API key（`spk_…`） |
| `baseUrl` | 是 | `https://explorer.softprobe.ai/api/thelake` |
| `otlpEndpoint` | 否 | 默认为 `{baseUrl}/v1/traces` |
| `environment` | 否 | 与 Explorer 中 Agent 环境一致的标签（如 `Production`） |
| `userId` | 否 | 可选，写入 span 的终端用户 id |

也可设置环境变量（同时设置了 key 与 base URL 时，环境变量优先）：

```bash
export SOFTPROBE_PUBLIC_KEY="spk_…"
export SOFTPROBE_BASE_URL="https://explorer.softprobe.ai/api/thelake"
export SOFTPROBE_OTLP_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export SOFTPROBE_ENVIRONMENT="Production"
```

「连接 Agent」安装提示会嵌入你的 Agent API key 与上述 URL。不要把凭证提交到源码库。

## 3. 验证

1. **由你**重启 OpenCode（必须，以便插件加载到交互会话中）。重启是用户步骤——连接 Agent 粘贴提示不会要求编码 Agent 去重启。
2. 确认已有 Session 被追踪：安装提示会让 OpenCode 执行 `opencode run "What is 1+2?"`，或你自己跑一轮真实对话（若使用工具则带上工具）。
3. 在 Explorer 打开 **Agents → + Connect agent** 并 **Check connection**，或在 **Sessions** 中查看新 Session（时间范围默认最近 7 天）。

Session 通过 Agent API key（`publicKey`）匹配到 Explorer Agent；凭证中无需设置 Agent 名称。

## 会追踪什么

- 用户轮次（`opencode.turn` / agent）及提示文本
- 模型生成（补全、用量、成本）
- 工具执行（参数与结果）
- 重试、推理、压缩事件
- 失败步骤与 session 错误 / 中止
- 子 Agent（`task`）工作嵌在父轮次下（同一产品 session id；
  在关联明确时，span 父级指向派发该 task 的节点）

## 排障

| 现象 | 检查 |
|------|------|
| 没有 Session | `opencode.json` / `opencode.jsonc` 中已列出插件，`experimental.openTelemetry` 为 true，已重启 OpenCode，并执行了 `opencode run "What is 1+2?"` 或一轮真实对话 |
| 鉴权 / 接入错误 | `publicKey` 与 `baseUrl` 与连接 Agent 一致；轮换 key 后已更新文件 |
| 改错 OpenCode 配置文件 | 编辑你实际在用的文件（项目或 `~/.config/opencode` 下的 `opencode.json` / `opencode.jsonc`）；见 [OpenCode config](https://opencode.ai/docs/config/) |
| Softprobe 凭证路径不对 | 确认 `~/.config/opencode/opencode-softprobe.json`（或 `OPENCODE_CONFIG_DIR`）；同时设置了 key 与 base URL 时环境变量覆盖文件 |
| 追踪不完整 | 确保进程存活足够久以 flush；无服务器 / 短生命周期主机可能需要显式 flush |

包来源：[`@softprobe/opencode-plugin`](https://www.npmjs.com/package/@softprobe/opencode-plugin)。
