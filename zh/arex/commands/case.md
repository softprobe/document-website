---
title: sp case、sp test 与 sp mcp
---

# sp case、sp test 与 sp mcp

统一测试用例（`arex.test-case/v1`）编排与执行（`sp case`）、外部报告导入导出与覆盖率统计及缺陷提单（`sp test`），以及 stdio MCP 服务（`sp mcp`）的命令参考。完整使用流程见 [测试用例管理](/zh/arex/test-case-management)。

## 退出码与大报文产物 {#output-behavior}

所有访问后端接口的子命令均支持 `--json`，并遵循统一的 [输出约定](/zh/arex/agents/output-contract)：

- `0`：命令执行成功（对于 `sp case run` 和 `sp test coverage --gate`，表示全部检查通过）。
- `1`：后端接口报错、存在未通过的测试用例（`sp case run` 返回 `passed == false`），或需求覆盖率门禁未通过（`sp test coverage --gate` 发现未覆盖或失败需求）。
- `2`：本地命令行参数缺失，或 `arex.test-case/v1` 结构校验失败。
- `3`：缺少认证凭据或凭据被拒绝（HTTP `401` 或 `403`）。

未传 `--out` 时，若紧凑 JSON 响应超过 8 KiB（`8192` 字节），命令行会自动将完整内容写入 `--out-dir` 目录，并在标准输出中返回带 `data.artifact` 路径的摘要对象。

## `sp case` {#sp-case}

创建、派生、查询、执行和删除统一的 `arex.test-case/v1` 用例。

| 子命令 | 说明 |
|--------|------|
| `sp case list` | 按条件分页列出应用的统一测试用例 |
| `sp case get <caseId>` | 按用例编号获取完整定义 |
| `sp case export` | 从录制链路导出脱敏后的基线 `TestCase`（不落库） |
| `sp case fork` | 从录制链路派生并保存一条 `AI_FORKED` 用例 |
| `sp case apply` | 从 JSON 文件或标准输入创建或更新 `TestCase` |
| `sp case run` | 向目标服务根地址发起单个用例或目录套件验证 |
| `sp case delete <caseId>` | 删除指定用例及其关联桩数据 |

### `sp case list`

```bash
sp case list --app <appId> [--suite <prefix>] [--kind <kind>] [--status <status>] [--tag <tag>] [--page <n>] [--limit <n>] --json
```

| 参数 | 必填 | 取值与默认值 |
|------|------|--------------|
| `--app` | 是 | 应用 ID |
| `--suite` | 否 | 目录路径前缀（`suitePath`） |
| `--kind` | 否 | `AREX`、`EXTERNAL_AUTOMATED` 或 `MANUAL` |
| `--status` | 否 | `DRAFT`、`ACTIVE`、`FLAKY` 或 `DEPRECATED` |
| `--tag` | 否 | 标签精确过滤 |
| `--page` | 否 | 页码（大于等于 `1`，默认 `1`） |
| `--limit` | 否 | 每页条数（`1` 至 `200`，默认 `50`） |

### `sp case get`

```bash
sp case get <caseId> [--out <file>] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `<caseId>` | 是 | 目标测试用例 ID |
| `--out` | 否 | 将格式化后的 `arex.test-case/v1` JSON 写入指定文件 |

### `sp case export`

```bash
sp case export --app <appId> --record-id <recordId> [--out <file>] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--app` | 是 | 应用 ID |
| `--record-id` | 是 | 源录制记录或链路 ID |
| `--out` | 否 | 将导出的 `arex.test-case/v1` JSON 写入指定文件 |

### `sp case fork`

```bash
sp case fork --app <appId> --from <recordId> [--id <newCaseId>] [--suite <suitePath>] [--title <title>] [--description <markdown>] [--out <file>] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--app` | 是 | 应用 ID |
| `--from` | 是 | 源录制记录或链路 ID |
| `--id` | 否 | 指定新用例 ID（省略时自动生成） |
| `--suite` | 否 | 目标目录路径（`suitePath`） |
| `--title` | 否 | 用例标题 |
| `--description` | 否 | Markdown 格式说明 |
| `--out` | 否 | 将派生后的 `arex.test-case/v1` JSON 写入指定文件 |

### `sp case apply`

```bash
sp case apply --file <path|-> --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `-f`, `--file` | 是 | `arex.test-case/v1` JSON 文件路径，或 `-`（从标准输入读取） |

保存前会校验 `schemaVersion`（`"arex.test-case/v1"`）、`appId`、`kind`、可选 `status`，以及 `arexSpec.assertionRules.assertions` 中的 Google CEL 表达式语法。

### `sp case run`

```bash
sp case run --app <appId> --env <targetUrl> [--case <caseId>...] [--suite <suitePath>] [--git-sha <sha>] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--app` | 是 | 应用 ID |
| `--env` | 是 | 目标服务根地址（`targetEnv`），例如 `http://127.0.0.1:8081` |
| `--case` | 否 | 待执行的用例 ID（可重复传入或用逗号分隔） |
| `--suite` | 否 | 待执行的目录前缀（`suitePath`） |
| `--git-sha` | 否 | 记录在本次测试运行上的 Git 提交 SHA |

返回 `runId`、`appId`、`passed`、`total`、`passedCount`、`failedCount` 和 `results[]`。当 `passed == false` 时退出码为 `1`。

### `sp case delete`

```bash
sp case delete <caseId> --app <appId> --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `<caseId>` | 是 | 待删除的测试用例 ID |
| `--app` | 是 | 应用 ID |

## `sp test` {#sp-test}

导入与导出外部自动化测试结果、统计需求覆盖率并创建缺陷单。

| 子命令 | 说明 |
|--------|------|
| `sp test import-results` | 将 CTRF JSON 或 JUnit XML 报告导入统一用例目录 |
| `sp test export-results` | 将某次测试运行导出为 JUnit XML 或 CTRF JSON |
| `sp test coverage` | 查询需求测试覆盖率并支持流水线门禁校验 |
| `sp test bug create` | 创建关联到测试用例的问题追踪系统缺陷单 |

### `sp test import-results`

```bash
sp test import-results --app <appId> --file <path|-> [--format <junit|ctrf>] [--runner <name>] [--suite <suitePath>] [--git-sha <sha>] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--app` | 是 | 应用 ID |
| `-f`, `--file` | 是 | 报告文件路径（`.xml` 或 `.json`），或 `-`（从标准输入读取） |
| `--format` | 否 | `junit` 或 `ctrf`（省略时根据扩展名或首字符自动识别） |
| `--runner` | 否 | 测试执行器标识（`playwright`、`pytest`、`junit`、`vitest` 或 `go`） |
| `--suite` | 否 | 目标目录路径（`suitePath`） |
| `--git-sha` | 否 | Git 提交 SHA |

### `sp test export-results`

```bash
sp test export-results --run <runId> [--format <junit|ctrf>] [--out <file>] [--json]
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--run` | 是 | 测试运行 ID |
| `--format` | 否 | 导出格式：`junit` 或 `ctrf`（默认 `junit`） |
| `--out` | 否 | 将导出内容写入指定文件 |

未传 `--json` 和 `--out` 且内容不超过 8 KiB 时，直接向标准输出打印原始 XML 或 JSON。

### `sp test coverage`

```bash
sp test coverage --app <appId> [--provider <provider>] [--scope <scope>] [--gate] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--app` | 是 | 应用 ID |
| `--provider` | 否 | 问题追踪平台：`github`、`jira`、`linear` 或 `local` |
| `--scope` | 否 | 里程碑、Epic、标签或迭代过滤条件 |
| `--gate` | 否 | 当 `summary.untested > 0` 或 `summary.failing > 0` 时以退出码 `1` 结束 |

### `sp test bug create`

```bash
sp test bug create --app <appId> --case <caseId> --provider <provider> --project <owner/repo|PROJ> [--result <resultId>] [--title <title>] [--notes <notes>] --json
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `--app` | 是 | 应用 ID |
| `--case` | 是 | 测试用例 ID |
| `--provider` | 是 | `github`、`jira`、`linear` 或 `gitlab` |
| `--project` | 是 | 目标仓库（`owner/repo`）或项目键（`PROJ`） |
| `--result` | 否 | 失败运行结果 ID（`resultId`） |
| `--title` | 否 | 自定义缺陷标题 |
| `--notes` | 否 | 附加到缺陷正文的诊断说明 |

## `sp mcp` {#sp-mcp}

通过标准输入输出（stdio）启动 Softprobe Arex MCP 服务（`softprobe-arex-mcp`，支持协议版本 `2024-11-05` 与 `2025-03-26`），或生成客户端配置文件。

```bash
sp mcp
sp mcp setup --client <cursor|claude|antigravity|codex> [--dir <path>] [--json]
```

| 子命令与参数 | 必填 | 说明 |
|--------------|------|------|
| `sp mcp` | 无必选参数 | 在 stdin 与 stdout 上启动 JSON-RPC 2.0 MCP 服务 |
| `sp mcp setup --client` | 是 | 目标编码客户端：`cursor`（写入 `.cursor/mcp.json`）或 `claude`、`antigravity`、`codex`（写入 `.mcp.json`） |
| `sp mcp setup --dir` | 否 | 在该目录创建或合并 MCP 配置文件；省略时仅打印配置片段 |

### `sp mcp` 提供的 MCP 工具 {#mcp-tools}

| 工具名 | 必填参数 | 用途 |
|--------|----------|------|
| `arex_discover_context` | `appId` | 获取 Agent 心跳状态、已录制依赖操作映射表以及统一用例列表 |
| `arex_list_cases_and_coverage` | `appId` | 分页查询用例（支持 `suitePath`、`kind`、`status`、`tag`、`page`、`pageSize`）及需求覆盖率（支持 `provider`、`scope`） |
| `arex_export_baseline` | `appId`、`recordId` | 从已有录制记录导出脱敏后的 `arex.test-case/v1` 基线（不落库） |
| `arex_apply_test_case` | `appId`、`kind` | 校验并保存 `arex.test-case/v1` 用例（支持 `arexSpec`、`externalSpec` 或 `manualSpec`） |
| `arex_run_test_case` | `appId`、`targetEnv` | 执行 `caseIds`、`caseId` 或 `suitePath`，返回四分类 `failureCategory` 与 `unmockedCalls[].stubTemplate` |
| `arex_import_external_results` | `appId` | 从本地 `filePath` 或原始 `content` 导入 CTRF JSON 或 JUnit XML 报告 |
| `arex_link_or_file_issue` | `appId`、`caseId`、`provider` | 在 `repositoryOrProject` 中新建缺陷单，或关联已有的 `externalUrl` |
| `arex_query_logs` | `traceId`、`since`、`until` | 查询指定 UTC ISO-8601 时间窗口内的关联应用日志 |

## 后端接口对照 {#rest-mapping}

| 命令 | HTTP 方法 | 路径 |
|------|-----------|------|
| `sp case list` | GET | `/api/test-cases` |
| `sp case get <caseId>` | GET | `/api/test-cases/{caseId}` |
| `sp case export` | POST | `/api/test-cases/export-baseline` |
| `sp case fork` | POST | `/api/test-cases/fork` |
| `sp case apply` | PUT | `/api/test-cases` |
| `sp case delete <caseId>` | DELETE | `/api/test-cases/{caseId}` |
| `sp case run` | POST | `/api/test-runs/execute` |
| `sp test import-results` | POST | `/api/test-runs/import` |
| `sp test export-results` | GET | `/api/test-runs/{runId}/export` |
| `sp test coverage` | GET | `/api/issue-trackers/coverage` |
| `sp test bug create` | POST | `/api/issue-trackers/bugs` |

## 相关文档 {#related}

- [测试用例管理](/zh/arex/test-case-management)
- [sp record](./record)
- [sp logs](./logs)
- [输出约定](/zh/arex/agents/output-contract)
