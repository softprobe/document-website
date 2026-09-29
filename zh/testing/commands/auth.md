---
title: sp auth：登录与令牌
---

# sp auth：登录与令牌

**AI 代理何时使用：** `SP_TOKEN` 未设置或已过期时。

## 概要 {#synopsis}

认证并查看当前身份。

## 子命令 {#subcommands}

| 子命令 | 参数 | 说明 |
|------------|-------|-------------|
| `login` | `--email`、`--code`、`--guest`、`--no-save` | 获取 JWT |
| `whoami` | — | 从 token 中读取当前用户 |
| `refresh` | `--user`、`--no-save` | 刷新 token |

## 示例 {#examples}

```bash
sp auth login --email ops@corp.com --code 848291 --json
sp auth login --email ops@corp.com --code 848291 --no-save --json
sp auth whoami --json
export SP_TOKEN="$(sp auth login ... --no-save --json | jq -r '.data.token')"
```

默认情况下，`login` 和 `refresh` 会把 token 写入共享配置文件
`${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc`。带 `--no-save` 时，token
只在 JSON 中返回，不改动任何配置、缓存、数据或状态文件。

### JSON 输出（`login`） {#json-output-login}

```json
{
  "ok": true,
  "command": "auth login",
  "data": {
    "token": "eyJhbGciOi...",
    "userName": "ops@corp.com"
  }
}
```

### JSON 输出（`whoami`） {#json-output-whoami}

```json
{
  "ok": true,
  "command": "auth whoami",
  "data": {
    "userName": "ops@corp.com"
  }
}
```

### JSON 输出（`refresh`） {#json-output-refresh}

```json
{
  "ok": true,
  "command": "auth refresh",
  "data": {
    "token": "eyJhbGciOi...",
    "userName": "ops@corp.com"
  }
}
```

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `login`（邮箱） | POST | `/api/login/verify` |
| `login`（访客） | POST | `/api/login/loginAsGuest` |
| `refresh` | GET | `/api/login/refresh/{userName}` |
| `whoami` | — | 本地解码 JWT；profile 接口实现后改为调用它 |

verify 的请求体：`VerifyRequestType`（`userName`、`verifyCode` 等）。

## 替代关系 {#replaces}

无（新增命令）。CI 直接使用 `SP_TOKEN`。

## 相关文档 {#related}

- [认证指南](/zh/testing/agents/authentication)
