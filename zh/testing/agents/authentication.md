---
title: 认证
---

# 认证

控制台 API 要求带 HTTP 头：

```http
access-token: <JWT>
```

（在 sp-tr-api 中定义为 `Constants.ACCESS_TOKEN`。）

## 非交互登录（AI 代理与 CI） {#non-interactive-login-agents-ci}

### 邮箱验证码流程 {#email-verification-flow}

1. 请求验证码（人工操作，或交给单独的自动化流程）：

   ```http
   GET /api/login/getVerificationCode/{userName}
   ```

2. 用验证码换 token：

   ```bash
   sp auth login --email user@corp.com --code 123456 --json
   ```

   **REST：** `POST /api/login/verify`，请求体 `{ "userName", "verifyCode", ... }`

3. 除非带 `--no-save`，CLI 会把 token 写入共享配置文件
   `${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc`。


### CI 与代理宿主 {#ci-agent-hosts}

**CLI**（录制、回放、应用管理）使用你的用户 JWT：

```bash
export SP_TOKEN="eyJ..."
sp app list --json
```

**Java Agent** 在 Softprobe Cloud 上使用**租户 API key**（长期有效，仅该组织可用）：

```bash
export SP_TENANT_API_KEY="…"   # 来自 sp tenant key ensure 或控制台的设置
export SP_TENANT_ID="35"
sp agent command --app <appId> --json
```

不要把 token 或 API key 提交进 git。泄露后立刻轮换。

### 刷新 token {#token-refresh}

```bash
sp auth refresh --user user@corp.com --json
```

**REST：** `GET /api/login/refresh/{userName}`

代理或 CI 任务只拿 token、不碰本地配置时，加 `--no-save`：

```bash
export SP_TOKEN="$(sp auth refresh --user user@corp.com --no-save --json | jq -r .data.token)"
```

## 访客登录 {#guest-login}

服务端开启时：

```bash
sp auth login --guest --json
```

**REST：** `POST /api/login/loginAsGuest`

## OAuth

OAuth 流程走浏览器。代理应使用预先备好的 `SP_TOKEN`，而不是自己去走 OAuth 流程。

给人看的文档：`GET /api/login/oauthInfo/{oauthType}`、`POST /api/login/oauthLogin`。

## 查看当前身份 {#who-am-i}

```bash
sp auth whoami --json
```

解码 JWT 中的 `userName`；profile 接口实现后会改为调用它。

## 错误 {#errors}

| 情况 | 退出码 |
|-----------|-----------|
| 带 `--json` 但没有 token | `3`（`AUTH_REQUIRED`） |
| token 过期或无效 | `1`（`API_ERROR`） |

## 相关文档 {#related}

- [配置](/zh/testing/installation/configuration)
- [auth 命令](/zh/testing/commands/auth)
