---
title: sp config：CLI 配置
---

# sp config：CLI 配置

**AI 代理何时使用：** 每个会话开始时验证一次连通性；CI 中用环境变量代替 `init`。

## 概要 {#synopsis}

管理基于 XDG 的 Softprobe 配置、配置档案和后端 URL。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `init` | 创建 `${XDG_CONFIG_HOME}/softprobe/config.jsonc` 和 `sp.jsonc` |
| `show` | 打印解析后的配置来源、当前配置档案、URL 和脱敏后的 token |
| `set-url <url>` | 设置当前 `sp` 配置档案的 URL |
| `set-profile <name>` | 切换当前 `sp` 配置档案 |
| `agent load --app <appId>` | 像 Agent 那样为应用调用一次配置加载接口；应用不存在时通常会自动注册。主要用于测试环境 |

## 示例 {#examples}

```bash
sp config init
sp config show --json
sp config set-url http://127.0.0.1:8090
sp config set-profile staging
```

### 文件布局 {#file-layout}

`sp` 使用全局 XDG 命名空间 `softprobe`：

```text
${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc  # 共享的 Softprobe 连接配置
${XDG_CONFIG_HOME:-~/.config}/softprobe/sp.jsonc      # sp CLI 专属配置
${XDG_CONFIG_HOME:-~/.config}/softprobe/spcode.jsonc  # spcode AI 助手专属配置
.softprobe/                                           # 项目级本地配置目录
${XDG_CACHE_HOME:-~/.cache}/softprobe/                # 缓存
${XDG_DATA_HOME:-~/.local/share}/softprobe/           # 持久数据、Agent jar
${XDG_STATE_HOME:-~/.local/state}/softprobe/          # 日志和状态
```

`config.jsonc` 与其他 Softprobe 工具共享。`sp.jsonc` 只供本 CLI 使用，会覆盖共享配置中的同名项。`spcode.jsonc`（全局的和项目级 `.softprobe/` 里的）由 `spcode` AI 助手引擎单独解析。


### JSON 输出（`init`） {#json-output-init}

```json
{
  "ok": true,
  "command": "config init",
  "data": {
    "path": "~/.config/softprobe/sp.jsonc",
    "sharedPath": "~/.config/softprobe/config.jsonc",
    "spPath": "~/.config/softprobe/sp.jsonc"
  }
}
```

### JSON 输出（`show`） {#json-output-show}

```json
{
  "ok": true,
  "command": "config show",
  "data": {
    "profile": "default",
    "url": "http://127.0.0.1:8090",
    "path": "~/.config/softprobe/sp.jsonc",
    "sharedPath": "~/.config/softprobe/config.jsonc",
    "sources": [
      "~/.config/softprobe/config.jsonc",
      "~/.config/softprobe/sp.jsonc"
    ],
    "tokenConfigured": true,
    "tokenMasked": "eyJhbGciOi...[masked]",
    "tenantConfigured": false,
    "tenantApiKeyConfigured": false,
    "tenantApiKeyMasked": "",
    "agentJarConfigured": false
  }
}
```

### JSON 输出（`set-url`） {#json-output-set-url}

```json
{
  "ok": true,
  "command": "config set-url",
  "data": {
    "url": "http://127.0.0.1:8090",
    "profile": "default"
  }
}
```

### JSON 输出（`set-profile`） {#json-output-set-profile}

```json
{
  "ok": true,
  "command": "config set-profile",
  "data": {
    "profile": "staging"
  }
}
```

## 优先级 {#precedence}

越靠后的来源优先级越高，会覆盖前面的：

1. 默认值。
2. `${XDG_CONFIG_HOME}/softprobe/config.jsonc`。
3. `${XDG_CONFIG_HOME}/softprobe/sp.jsonc`。
4. 设置了 `SP_CONFIG` 时，来自它的额外配置。
5. 设置了 `--config` 时，来自它的额外配置。
6. 选中的配置档案。档案选择优先级为 `--profile`、`SP_PROFILE`、
   合并后的 `profile`，最后才是 `default`。
7. 环境变量：`SP_API_URL`、`SP_TOKEN`、`SP_TENANT_ID`、`SP_TENANT_API_KEY`。
8. 全局参数：`--api-url`、`--token`。

Java Agent jar 的路径由 `sp agent command` 单独查找：先看 `--agent-jar`，再看 `SP_AGENT_JAR`，最后用默认安装路径，见 [sp agent](./agent)。

没有配置文件不算错误：此时使用默认值和环境变量。`sp config init` 会创建配置文件。

显式指定了不存在的配置档案时，直接以 `PROFILE_NOT_FOUND` 失败，
不会静默回退到 `default`。

## REST 接口对照 {#rest-mapping}

配置类子命令**只在本地执行**（不发 HTTP），唯一例外是 `config agent load`，它调用 `POST /api/config/agent/load`。

旧的 `sp config legacy` 命令组已经移除。录制、Mock 和对比设置请用 `sp policy`。

## 错误 {#errors}

| 错误码 | 退出码 | 原因 |
|------|------|-------|
| `PROFILE_NOT_FOUND` | 2 | 配置档案名不存在 |
| `CONFIG_PARSE_ERROR` | 1 | 配置文件存在，但不是合法的 JSONC |
| `CONFIG_WRITE_ERROR` | 1 | 配置文件写入失败 |

## 相关文档 {#related}

- [配置指南](/zh/testing/installation/configuration)
- [auth](./auth)
