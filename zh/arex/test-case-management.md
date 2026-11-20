---
title: 测试用例管理
---

# 统一管理测试用例与需求覆盖率

Softprobe Arex 使用统一的 `arex.test-case/v1` 用例目录管理流量录制用例、AI 编写的功能测试、外部自动化测试报告和手工测试步骤。你可以通过 `sp case` 与 `sp mcp` 编写或派生用例，通过 `sp test` 导入 JUnit XML 或 CTRF JSON 报告，在流水线中按需求覆盖率设置质量门禁，并在 GitHub、Jira、Linear 或 GitLab 中提交缺陷。

## 用例类型与来源 {#kinds-and-origins}

目录中的每条用例都带有 `"schemaVersion": "arex.test-case/v1"`，归属于某个 `appId` 和可选的分层目录 `suitePath`（例如 `flights/baggage/vip-tier`），并按 `kind` 分为三类：

| `kind` | 配置字段 | 含义 |
|--------|----------|------|
| `AREX` | `arexSpec` | 包含入口请求、可选参考输出、依赖桩数据、用例级依赖注入规则和 Google CEL 断言，直接发往挂载了 Java Agent 的目标服务执行 |
| `EXTERNAL_AUTOMATED` | `externalSpec` | 由 Playwright、Pytest、JUnit、Vitest 或 Go 运行，并通过 CTRF JSON 或 JUnit XML 导入的外部自动化测试 |
| `MANUAL` | `manualSpec` | 包含前置条件（`preconditions`）、操作步骤（`steps`）和预期结果（`expectedOutcome`）的手工测试规范 |

`origin` 字段记录用例的产生方式：

- `CAPTURED`：由 Java Agent 从线上或测试环境流量自动采样录制。
- `AI_FORKED`：从脱敏后的录制基线（`parentCaseId`）克隆并按新需求调整而成。
- `AI_SYNTHETIC`：针对尚无历史流量的新 HTTP 路由、RPC 接口或消息消费逻辑直接编写的合成用例。
- `MANUAL`：结构化手工测试用例。

生命周期状态 `status` 支持 `DRAFT`、`ACTIVE`、`FLAKY` 和 `DEPRECATED`。

## 编写与派生 `AREX` 用例 {#author-arex-cases}

一条 `AREX` 用例在 `arexSpec` 中包含五个明确部分：

1. **`input`**：入口调用请求（`category`、`operationName`、`method`、`path`、`headers`、`body` 以及可选的 `attributes`）。
2. **`expectedOutput`**：用于未变更字段对比的可选参考响应；完全由 CEL 断言验证契约时可设为 `null` 或省略。
3. **`injectionRules`**：仅对该用例生效的依赖 Mock 规则：
   - `mockByDefault`：默认是否拦截外部依赖调用（设为 `true` 时，除 `skipMock` 外的受支持依赖全部走 Mock）。
   - `operations.forceMock` 与 `operations.skipMock`：按操作模式精确指定强制 Mock 或放行真实调用（例如 `"HttpClient:/ndc/servicelist"`、`"Database:loyalty_member*"`）。除非明确需要访问测试沙箱，否则切勿把支付、邮件或消息队列操作加入 `skipMock`。
   - `matchTolerance`：请求匹配容差规则（`operationPattern`、`ignoreBodyPaths`、`ignoreHeaders`、`matchStrategy`）。
   - `fallback.strategy`：未命中桩数据时的处理策略（设为 `"FAIL"` 时立即失败并返回桩模板）。
4. **`assertionRules`**：用例级结构对比设置（`diffSpec`，如 `{"ignoreAllDependencies": true}`）与布尔型 Google CEL 断言列表 `assertions`，可对 `response.status`、`response.headers`、`response.body` 和下游调用 `calls` 编写断言表达式。
5. **`dependencies`**：与该用例绑定的依赖桩数据列表（`category`、`operationName`、可选 `matchStrategy`、`request` 和 `response`）。

从已有录制记录派生一条脱敏基线用例并输出为 JSON 文件：

```bash
sp case fork \
  --app travel-ota \
  --from rec-9001 \
  --id tc-baggage-vip-01 \
  --suite flights/baggage/vip-tier \
  --title "白金会员首件托运行李免费" \
  --out case.json \
  --json
```

编辑 `case.json`，补充需求链接、依赖桩和 Google CEL 断言：

```json
{
  "schemaVersion": "arex.test-case/v1",
  "id": "tc-baggage-vip-01",
  "appId": "travel-ota",
  "suitePath": "flights/baggage/vip-tier",
  "title": "Platinum member gets first checked bag free",
  "kind": "AREX",
  "origin": "AI_FORKED",
  "parentCaseId": "rec-9001",
  "status": "ACTIVE",
  "requirementLinks": [
    { "provider": "jira", "externalId": "OTA-892" }
  ],
  "arexSpec": {
    "input": {
      "category": "Servlet",
      "method": "POST",
      "path": "/api/flights/baggage/purchase",
      "headers": { "Content-Type": "application/json" },
      "body": { "orderId": "ORD-9001", "bagCount": 1 }
    },
    "injectionRules": {
      "mockByDefault": true,
      "operations": {
        "forceMock": ["HttpClient:/ndc/servicelist", "Database:loyalty_member*"]
      },
      "fallback": { "strategy": "FAIL" }
    },
    "assertionRules": {
      "diffSpec": { "ignoreAllDependencies": true },
      "assertions": [
        {
          "id": "status-200",
          "expression": "response.status == 200",
          "message": "Expected HTTP 200 OK"
        },
        {
          "id": "vip-zero-fee",
          "expression": "response.body.totalCharge == 0",
          "message": "Platinum tier waives the first checked bag fee"
        }
      ]
    },
    "dependencies": [
      {
        "category": "HttpClient",
        "operationName": "/ndc/servicelist",
        "request": {
          "attributes": { "HttpMethod": "POST", "ContentType": "application/json" },
          "body": "{\"orderId\":\"ORD-9001\"}"
        },
        "response": {
          "status": 200,
          "headers": { "Content-Type": "application/json" },
          "body": "{\"services\":[{\"serviceCode\":\"BAG1\",\"amount\":50}]}"
        }
      },
      {
        "category": "Database",
        "operationName": "loyalty_member@SELECT",
        "request": { "body": "SELECT tier FROM loyalty_member WHERE order_id = ?" },
        "response": { "body": "[{\"tier\":\"PLATINUM\"}]", "javaType": "java.util.ArrayList" }
      }
    ]
  }
}
```

校验 Schema 与 CEL 表达式并写入用例库：

```bash
sp case apply --file case.json --json
```

## 执行用例与四分类失败归因 {#run-and-triage}

指定单个或多个用例，或者按 `suitePath` 前缀向正在运行的目标服务（`targetEnv`）发起验证：

```bash
sp case run \
  --app travel-ota \
  --env http://127.0.0.1:8081 \
  --suite flights/baggage \
  --git-sha "$(git rev-parse HEAD)" \
  --json
```

`sp case run` 会向标准输出打印 JSON 信封，只要存在未通过用例（`passed == false`）就以退出码 `1` 结束。`results[]` 中的每条结果都带有四分类 `failureCategory`，便于工程师和 AI 编码代理区分环境或桩缺失问题与真实业务缺陷：

| `failureCategory` | 含义与处理方式 |
|-------------------|----------------|
| `NONE` | 结构对比与全部 CEL 断言均通过 |
| `MOCK_MISS_OR_DRIFT` | 业务代码调用了未命中桩数据的依赖。读取 `unmockedCalls[].stubTemplate` 填充合理的 `response` 数据并追加到 `arexSpec.dependencies`，严禁通过删改 `assertionRules` 放行失败用例 |
| `TEST_AUTHORING_ERROR` | 请求字段、路径或 CEL 表达式类型有误。对照接口契约或源码修正用例输入与断言 |
| `ENV_OR_AGENT_ERROR` | 目标服务不可达或 Java Agent 离线。先用 `sp app status <appId> --json` 和 `sp doctor --json` 检查运行状态 |
| `REAL_APPLICATION_BUG` | 依赖桩正常命中但返回结果违反了 CEL 断言或预期输出。使用结果中的 `logWindow` 查询关联日志（`sp logs --trace-id <traceId> --since <since> --until <until> --json`）定位根因 |

## 导入 CTRF JSON 与 JUnit XML 报告 {#external-results}

如果仓库中还运行单元测试、集成测试或浏览器端测试，可以把 CTRF JSON（`.json`）或 JUnit XML（`.xml`）报告导入同一个用例目录：

```bash
sp test import-results \
  --app travel-ota \
  --file playwright-ctrf.json \
  --runner playwright \
  --suite checkout/ui \
  --git-sha "$(git rev-parse HEAD)" \
  --json
```

后端会自动创建或更新 `EXTERNAL_AUTOMATED` 用例（记录 `externalSpec.runner`、`externalSpec.canonicalName` 和 `externalSpec.fileRef`），写入本次 `runId` 的通过、失败和跳过统计，并提取测试名称或属性中的需求单号。

也可以把任意一次测试运行导出为标准 JUnit XML 或 CTRF JSON 供其他流水线消费：

```bash
sp test export-results --run <runId> --format junit --out results/arex-junit.xml --json
sp test export-results --run <runId> --format ctrf --out results/arex-ctrf.json --json
```

## 管理 `MANUAL` 手工测试用例 {#manual-cases}

将 `"kind": "MANUAL"` 与 `manualSpec` 写入 JSON 并执行 `sp case apply`，即可在同一目录树下追踪手工测试：

```json
{
  "schemaVersion": "arex.test-case/v1",
  "id": "tc-hardware-pos-01",
  "appId": "travel-ota",
  "suitePath": "airport/kiosk",
  "title": "验证自助值机热敏打印机缺纸降级提示",
  "kind": "MANUAL",
  "origin": "MANUAL",
  "status": "ACTIVE",
  "requirementLinks": [
    { "provider": "github", "externalId": "softprobe/demo-ota#142" }
  ],
  "manualSpec": {
    "preconditions": "自助机模拟器已连接并触发缺纸传感器。",
    "steps": [
      "扫描有效值机二维码。",
      "确认屏幕在 3 秒内弹出电子登机牌短信降级提示。"
    ],
    "expectedOutcome": "旅客收到电子登机牌链接，终端记录打印机告警。"
  }
}
```

## 需求覆盖率统计与发布门禁 {#requirement-coverage}

通过 `requirementLinks` 把用例关联到 GitHub Issues、Jira 单号、Linear 任务或本地需求编号后，可跨 `AREX`、`EXTERNAL_AUTOMATED` 和 `MANUAL` 用例汇总需求验证覆盖率：

```bash
sp test coverage --app travel-ota --provider jira --scope Sprint-42 --gate --json
```

每条需求都会返回 `coverageStatus`（`VERIFIED`、`FAILING` 或 `UNTESTED`）、关联用例列表 `cases` 以及未关闭缺陷 `openBugs`。传入 `--gate` 时，一旦存在未覆盖（`summary.untested > 0`）或验证失败（`summary.failing > 0`）的需求，命令就会返回退出码 `1`。

## 提交与关联缺陷单 {#bug-filing}

排查确认属于 `REAL_APPLICATION_BUG` 后，可直接向 GitHub、Jira、Linear 或 GitLab 创建缺陷单并自动写回用例的 `bugLinks`：

```bash
sp test bug create \
  --app travel-ota \
  --case tc-baggage-vip-01 \
  --result res-7712 \
  --provider github \
  --project acme/travel-ota \
  --notes "白金会员首件行李仍被收取 35 美元费用" \
  --json
```

## 通过 `sp mcp` 接入 AI 编码代理 {#mcp-agents}

在项目根目录执行 `sp mcp setup --client cursor --dir .`（或 `--client claude | antigravity | codex`），即可通过标准输入输出（stdio）向编码代理开放全部 8 个统一测试工具（`arex_discover_context`、`arex_list_cases_and_coverage`、`arex_export_baseline`、`arex_apply_test_case`、`arex_run_test_case`、`arex_import_external_results`、`arex_link_or_file_issue` 和 `arex_query_logs`）。配合 `softprobe/softprobe-plugin` 市场中的 `softprobe-arex` 插件即可启用五步闭环功能测试技能。

## 相关文档 {#related}

- [sp case、sp test 与 sp mcp 命令参考](/zh/arex/commands/case)
- [录制回放如何工作](/zh/arex/how-it-works)
- [概念与编号](/zh/arex/agents/concepts)
- [策略 YAML 参考](/zh/arex/policy-yaml-guide)
