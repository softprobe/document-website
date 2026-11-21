---
title: sp test：全栈端到端测试
---

# sp test：全栈端到端测试

将录制的 Blackbox 会话编译为测试用例，并运行 `@playwright/test` 与 `@softprobe/e2e` 浏览器及分布式链路测试的命令参考。完整的编写步骤、会话编译与 `.e2e/cache/` 缓存用法见 [编写全栈 AI 端到端测试](/zh/arex/fullstack-e2e-testing)。

## 概要 {#synopsis}

在受检的 Node.js 子进程中初始化、从录制会话编译、运行并交互式探索全栈端到端测试工程。

```bash
sp test init [--dir <dir>] [--force] [--json]
sp test run [args...] [--dir <dir>] [--json]
sp test explore [args...] [--dir <dir>]
sp test from-session [session-id] [--runner playwright|e2e] [--out <dir>] [--dir <dir>] [--target-url <url>] [--endpoint <url>] [--workspace-id <id>] [--project-id <id>] [--app-identity <id>] [--session-file <path>] [--force] [--json]
```

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `init` | 在目标目录生成缺失的 `e2e.config.ts` 和 `tests/example.e2e.ts` |
| `run [args...]` | 通过 `./node_modules/e2e` 执行 `@softprobe/e2e` 用例 |
| `explore [args...]` | 启动交互式 `e2e explore` 会话 |
| `from-session [session-id]` | 将录制的 Blackbox 会话编译为 `@playwright/test` 或 `@softprobe/e2e` 测试套件 |

## 参数 {#flags}

### `init`

| 参数 | 说明 |
|------|-------------|
| `--dir <string>` | 测试工程目录（默认当前工作目录） |
| `--force` | 覆盖已存在的 `e2e.config.ts` 和 `tests/example.e2e.ts` |

### `run` 与 `explore`

| 参数 | 说明 |
|------|-------------|
| `--dir <string>` | 包含 `e2e.config.ts` 和 `node_modules/e2e` 的工程目录（默认当前工作目录） |

`sp test run` 和 `sp test explore` 会剥离 `sp` 全局参数（`--json`、`--quiet`、`--confirm`、`--profile`、`--api-url`、`--token`、`--config`、`--out-dir`、`--page`、`--limit`）以及 `--dir`，其余参数原样转发给底层的 `e2e` CLI。如需原样透传参数，请在参数前加 `--`。

### `from-session`

| 参数 | 说明 |
|------|-------------|
| `--runner <string>` | 目标测试运行器，可选 `"playwright"` 或 `"e2e"`（默认 `"playwright"`） |
| `--out <string>` | 生成测试文件的输出目录（默认取 `--dir` 或当前工作目录） |
| `--dir <string>` | 包含 `node_modules/@softprobe/e2e` 的工程目录（默认当前工作目录） |
| `--target-url <string>` | 被测应用的基础 URL |
| `--endpoint <string>` | Blackbox、Explorer 或 TheLake API 地址（默认使用已配置的 `api_url`） |
| `--workspace-id <string>` | 查询 Explorer 或 TheLake 时发送的工作区请求头（`X-Workspace-Id`，默认读取 `SOFTPROBE_WORKSPACE_ID` 或 `SP_WORKSPACE_ID`） |
| `--project-id <string>` | 选择 `--runner e2e` 时写入的 `e2e` `projectId` |
| `--app-identity <string>` | 选择 `--runner e2e` 时写入的 `e2e` `app.identity` |
| `--session-file <string>` | 从本地会话 spans JSON 文件离线编译，不请求远程 API |
| `--force` | 覆盖已存在的生成文件 |

执行时请传入 `[session-id]` 或 `--session-file <path>`。

## 运行时与环境变量 {#runtime-and-environment}

`e2e` 与 `@softprobe/e2e` 要求 Node.js 版本满足 `^22.22.3 || >=24.8.0`。在 Bun 下直接加载 `e2e/runner` 会抛出 `NODE_UNSUPPORTED`。启动 `./node_modules/e2e` 前，`sp test` 会从 `SP_E2E_NODE_BIN` 或 `PATH` 中的 `node` 解析兼容的 Node.js 可执行文件。

`sp test from-session` 同样从 `SP_E2E_NODE_BIN` 或 `PATH` 解析满足 `^22.22.3 || >=24.8.0` 的 Node.js，启动 `./node_modules/@softprobe/e2e/dist/bin/compile-session.js`，并通过 `SOFTPROBE_API_KEY` 与 `SP_TOKEN` 环境变量传递 Bearer 凭据，而不把密钥放进命令行参数。传入或从环境变量解析出 `--workspace-id` 时，还会向子进程注入 `SOFTPROBE_WORKSPACE_ID`。

运行测试前可先检查 Node.js 环境：

```bash
sp doctor --e2e --json
```

`sp doctor --e2e` 会在常规健康检查之外增加 `e2e-node` 检查项（设置了 `SP_E2E_NODE_BIN` 时也会自动执行该项检查）。

启动 `e2e` 或会话编译器子进程时，`sp test` 会自动注入以下环境变量：

| 变量 | 值 |
|----------|-------|
| `E2E_TELEMETRY_DISABLED` | 固定为 `"1"`，关闭上游遥测输出，保持 `--json` 模式下 stderr 干净 |
| `SPCODE_MODE` | `"true"` |
| `SP_API_URL` | 从 `--api-url`、`SP_API_URL` 或 `~/.config/softprobe/config.jsonc` 解析出的后端地址 |
| `SP_TOKEN` | 已配置的访问令牌 |
| `SOFTPROBE_API_KEY` | 执行 `sp test from-session` 时注入的已解析访问令牌 |
| `SOFTPROBE_WORKSPACE_ID` | 执行 `sp test from-session` 时注入的已解析工作区 ID |
| `SP_TENANT_ID` | 已配置的租户 ID |
| `SP_TENANT_API_KEY` | 已配置的租户 API 密钥 |

## 示例 {#examples}

```bash
sp doctor --e2e --json
sp test init --dir ./e2e --json
sp test from-session ses_01j8x9m2v4 --runner playwright --out ./e2e-playwright --json
sp test from-session ses_01j8x9m2v4 --runner e2e --out ./e2e --json
sp test run tests/workspace-invite.e2e.ts --dir ./e2e --json
sp test explore --dir ./e2e
```

## JSON 输出 {#json-output}

### `sp test init --json`

```json
{
  "ok": true,
  "command": "test init",
  "data": {
    "dir": "/workspace/app/e2e",
    "created": [
      "e2e.config.ts",
      "tests/example.e2e.ts"
    ],
    "skipped": []
  }
}
```

### `sp test run --json`

传入 `--json` 时，`sp test run` 会向子进程追加 `--reporter json`，合并 `e2e` 运行报告与 `softprobeReporter()` 生成的 `.e2e/softprobe-traces.json`，并在标准输出打印单个 JSON 信封。

```json
{
  "ok": true,
  "command": "test run",
  "data": {
    "dir": "/workspace/app/e2e",
    "runId": "run_01j8x9m2v4",
    "status": "passed",
    "discovered": 2,
    "selected": 2,
    "executed": 2,
    "passed": 2,
    "failed": 0,
    "skipped": 0,
    "flaky": 0,
    "interrupted": 0,
    "modelCalls": 0,
    "modelTokens": 0,
    "verifiedTraces": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "sinkKind": "blackbox",
        "sinkUrl": "http://127.0.0.1:8091",
        "mode": "outboundHttp",
        "targetName": "local-explorer",
        "testId": "test_invite_email",
        "title": "workspace invitations > sends invite email",
        "file": "tests/workspace-invite.e2e.ts",
        "triggeredBy": {
          "method": "POST",
          "url": "http://localhost:5179/api/workspaces/ws-1/invites",
          "pathname": "/api/workspaces/ws-1/invites",
          "headerSource": "minted"
        },
        "outboundCall": {
          "spanId": "00f067aa0ba902b7",
          "method": "POST",
          "url": "http://127.0.0.1:9025/v1/account/invite/submit",
          "status": 200,
          "serviceName": "softprobe-explorer"
        },
        "explorerTraceUrl": "http://localhost:5179/?traceId=4bf92f3577b34da6a3ce929d0e0e4736",
        "verifiedAt": "2026-11-21T09:30:00.000Z"
      }
    ],
    "failures": []
  }
}
```

### 信封字段说明（`test run`） {#envelope-fields}

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| `dir` | `string` | 测试工程的绝对路径 |
| `runId` | `string` | `e2e` 运行 ID（生成报告后返回） |
| `status` | `string` | `e2e` 运行状态（`"passed"`、`"failed"` 或 `"unknown"`） |
| `passed` | `number` | 通过的用例数 |
| `failed` | `number` | 失败的用例数 |
| `skipped` | `number` | 跳过的用例数 |
| `flaky` | `number` | 重试后通过的用例数 |
| `interrupted` | `number` | 中断的用例数 |
| `modelCalls` | `number` | 本次运行中所有尝试的模型调用总次数（命中 `.e2e/cache/` 缓存回放时为 `0`） |
| `modelTokens` | `number` | 本次运行消耗的模型 Token 总数 |
| `verifiedTraces` | `array` | `softprobeReporter()` 为 `trace.outboundHttp` 和 `trace.expectNoOutboundHttp` 记录的已验证链路摘要 |
| `failures` | `array` | 失败用例或运行级错误列表（含 `testId`、`file`、`title`、`code`、`message`） |

用例失败时，`sp test run --json` 输出 `"ok": false` 与 `error.code: "E2E_FAILED"`，`data` 字段仍保留完整汇总，并以子进程的非零退出码退出。

### `sp test from-session <session-id> --runner playwright --json`

```json
{
  "ok": true,
  "command": "test from-session",
  "data": {
    "ok": true,
    "runner": "playwright",
    "sessionId": "ses_01j8x9m2v4",
    "actionCount": 4,
    "outboundAssertionCount": 1,
    "filesWritten": [
      "/workspace/app/e2e/tests/recorded-session.spec.ts",
      "/workspace/app/e2e/playwright.config.ts"
    ],
    "cacheFilesWritten": []
  }
}
```

当指定 `--runner e2e` 时，`cacheFilesWritten` 会列出随 `.e2e.ts` 用例与 `e2e.config.ts` 一并生成的 `.e2e/cache/<sha256>.json` 预置 `trace-1` 缓存文件路径。

## 相关文档 {#related}

- [编写全栈 AI 端到端测试](/zh/arex/fullstack-e2e-testing)
- [sp trace：链路查询](/zh/arex/commands/trace)
- [安装 sp 命令行](/zh/arex/installation/#doctor)
