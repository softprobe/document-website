---
title: 策略 YAML 指南
---

# 策略 YAML 指南

SoftProbe 测试通过**声明式 YAML 策略**（`apiVersion: softprobe.ai/v1`）控制录制、回放 Mock 与差异对比。策略按应用（及可选的环境、操作）匹配，按优先级合并，由 sp-backend 在运行时生效。

三种策略类型都通过 CLI 管理：

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
sp policy mock apply -f mock.yaml --json
sp policy compare apply -f compare.yaml --json
```

| Kind | 控制内容 | CLI |
|------|----------|-----|
| `RecordingPolicy` | 采样、时间窗口、操作包含/排除、序列化跳过、录制时时间 Mock | `sp policy recording` |
| `MockPolicy` | 跳过/强制 Mock、查找容差、跨应用依赖、无 Mock 时的回退 | `sp policy mock` |
| `CompareRulePolicy` | 忽略路径、解压、转换、数组匹配、CEL 校验 | `sp policy compare` |

JSON Schema 位于后端模块 `sp-policy-rules`（`src/main/resources/schema/`）。在 YAML 顶部添加 `# yaml-language-server: $schema=...`，编辑器即可提供补全与校验。

## 文档通用结构

每种策略的外层结构相同：

```yaml
apiVersion: softprobe.ai/v1
kind: RecordingPolicy   # 或 MockPolicy / CompareRulePolicy
metadata:
  name: my-app-recording
  priority: 100
  description: "可选说明"
  enabled: true         # 仅 RecordingPolicy / MockPolicy
selector:
  appIds: [my-app-id]
  envTags:
    env: [prod]
spec:
  # 各 kind 专有字段
```

### 通用字段 {#common-fields}

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `apiVersion` | string | 是 | 必须为 `softprobe.ai/v1` |
| `kind` | string | 是 | 上表三种之一 |
| `metadata.name` | string | 是 | 唯一标识（小写连字符） |
| `metadata.priority` | integer | 否 | 默认 `0`；数值越大越晚合并，冲突时优先 |
| `metadata.description` | string | 否 | 自由文本 |
| `metadata.enabled` | boolean | 否 | 仅录制/Mock；默认 `true` |
| `selector.matchAll` | boolean | 否 | 匹配所有应用（系统默认在 priority 0 使用） |
| `selector.appIds` | string[] | 三选一\* | 精确应用 ID |
| `selector.appIdPattern` | string | 三选一\* | Glob，如 `order-*` |
| `selector.excludeAppIds` | string[] | 否 | 从匹配结果中排除 |
| `selector.envTags` | map | 否 | 标签键 → 允许值列表，如 `env: [prod, staging]`。与 Agent 上报的标签匹配（用 `-Dsp.tags.env=prod` 设置）。**合取**：声明的每个键都必须满足；省略 = 所有环境 |
| `selector.operationNames` | string[] | 否 | 精确操作名。**仅录制与 Mock** — CompareRulePolicy 的 selector 不允许 |
| `selector.operationNamePatterns` | string[] | 否 | Glob，如 `/api/order/*`。**仅录制与 Mock** |

\*`selector` 至少包含 `matchAll`、`appIds`、`appIdPattern` 之一。

**选择器维度**为合取：应用匹配 AND（可选）环境匹配 AND（可选）操作匹配。未约束操作维度时表示「匹配应用下的所有操作」。

### 合并规则

多条策略匹配同一应用时，按 **priority 升序**合并（数值大的后应用）：

| Kind | 合并行为 |
|------|----------|
| **Compare** | 标量覆盖；列表/映射合并；同键后者覆盖 |
| **Recording** | 标量覆盖；列表合并；`timeMock` 任一为 true 则 true；`serializeSkip` 按 `className` + 字段名合并 |
| **Mock** | 标量覆盖；`skipMock`/`forceMock` 合并；`matchTolerance`、`multiServiceDependencies` 按 pattern/应用键后者覆盖 |

sp-backend 内置 priority 0 的 `default-global-*-policy.yaml`；用户策略请设置 `priority > 0` 以覆盖内置策略。

### 运行时流水线

```text
YAML → 解析 → 校验 → Mongo → 解析合并 → 编译 → PolicyCache（fresh 60s，stale 24h）
```

Mongo 加载超时时安全降级（录制：不录；Mock：透传）。

### 编写建议

1. 在编辑器中启用 JSON Schema 做行内校验。
2. 应用级策略避免滥用 `matchAll: true` — 系统默认已提供兜底。
3. YAML 注释写**原因**；字段含义以 schema 为准。

---

## RecordingPolicy {#recordingpolicy}

录制策略。

控制 **Agent 录什么**：采样、时段、操作过滤、脱敏元数据、序列化跳过、录制时时间 Mock。

### `spec` 字段

| 区块 | 字段 | 类型 | 语义 |
|------|------|------|------|
| `sampling` | `ratePerHundredSeconds` | integer ≥ 0 | 每台机器、每个接口每分钟最多录制的请求数，即页面上的「采样率（次/分钟）」；字段名是沿用下来的，单位不是 100 秒。`0` = 不录 |
| `sampling` | `machineCountLimit` | integer ≥ 1 或省略 | 同环境组内同时录制的实例上限。**省略 = 不限**。慎用 `1`（容易导致单个实例长期占用录制名额） |
| `timeWindow` | `daysOfWeek` | `MON`…`SUN` 或 `*` | 省略整段 = 7×24 |
| `timeWindow` | `from` / `to` | `HH:mm` | 必须成对；`from` 严格早于 `to`。Agent 使用 JVM 本地时区 |
| `operations` | `exclude` | string[] | 不录制的操作 Glob（黑名单） |
| `operations` | `include` | string[] | 非空时为**白名单**：只录这些；`exclude` 仍在 `include` 之后生效 |
| `sensitiveData` | `headers` | string[] | HTTP 头名（见下方说明） |
| `sensitiveData` | `bodyPaths` | string[] | JSONPath，必须以 `$` 开头 |
| `sensitiveData` | `queryParams` | string[] | 查询参数名 |
| `sensitiveData` | `placeholder` | string | 替换占位符，默认 `***` |
| `serializeSkip` | `className` | string | Java 类名 |
| `serializeSkip` | `fieldNames` | string[] | 跳过的字段 |
| | `timeMock` | boolean | 录制时 Mock `java.time.*` |
| | `extras` | map | 原样下发到 Agent `extendField` |

::: warning 录制路径上的 `sensitiveData`
后端会把 `sensitiveData` 写入 Agent 线协议，但 **Java Agent 尚未在录制时执行脱敏**。回放 Mock 键噪音请用 `MockPolicy.spec.matchTolerance`；查看/查询时脱敏请用 `SensitivePolicy`（REST，暂无 `sp policy` CLI）。
:::

修改录制策略的包含/排除列表会影响调度服务构建的回放范围，无需单独改调度文档。

### 完整示例

```yaml
apiVersion: softprobe.ai/v1
kind: RecordingPolicy
metadata:
  name: order-service-prod
  description: "生产录制 — 50 次/100s，工作时间，脱敏元数据"
  priority: 100
  enabled: true
selector:
  appIds: [order-service]
  envTags:
    env: [prod]
  operationNamePatterns:
    - "/api/order/*"
spec:
  sampling:
    ratePerHundredSeconds: 50
    machineCountLimit: 3
  timeWindow:
    daysOfWeek: [MON, TUE, WED, THU, FRI]
    from: "09:00"
    to: "18:00"
  operations:
    exclude:
      - "/health"
      - "/metrics/**"
      - "/actuator/**"
  sensitiveData:
    headers: [authorization, cookie, x-api-key]
    bodyPaths:
      - "$.password"
      - "$.user.phone"
    queryParams: [token, sessionId]
    placeholder: "***"
  serializeSkip:
    - className: com.example.order.domain.Order
      fieldNames: [internalNote]
  timeMock: false
  extras: {}
```

### 仅白名单录制示例

```yaml
apiVersion: softprobe.ai/v1
kind: RecordingPolicy
metadata:
  name: order-service-whitelist
  priority: 110
selector:
  appIds: [order-service]
spec:
  sampling:
    ratePerHundredSeconds: 100
  operations:
    include:
      - "/api/order/**"
    exclude:
      - "/api/order/internal/**"
```

---

## MockPolicy {#mockpolicy}

Mock 策略。

控制**回放时**依赖 Mock：哪些调用用录制数据、哪些走真实下游、Mock 键容差、跨应用依赖、无匹配 Mock 时的行为。

### `spec` 字段

| 区块 | 字段 | 类型 | 语义 |
|------|------|------|------|
| | `mockByDefault` | boolean | 默认 `true`：除 `skipMock` 外全部 Mock；`false`：除 `forceMock` 外走真实下游 |
| `operations` | `skipMock` | string[] | `Category:operationGlob` — 不 Mock，调真实下游 |
| `operations` | `forceMock` | string[] | `Category:operationGlob` — 必须 Mock；优先于 `skipMock` |
| `matchTolerance` | `operationPattern` | string | 入口操作 Glob |
| `matchTolerance` | `ignoreHeaders` | string[] | Mock 指纹中忽略的请求头 |
| `matchTolerance` | `ignoreQueryParams` | string[] | 忽略的查询参数 |
| `matchTolerance` | `ignoreBodyPaths` | string[] | 忽略的 body 路径 |
| `multiServiceDependencies` | `downstreamApp` | string | 下游应用 ID |
| `multiServiceDependencies` | `operations` | string[] | 精确下游操作 |
| `multiServiceDependencies` | `operationPatterns` | string[] | Glob（`operations` 与 `operationPatterns` 至少填一项） |
| `fallback` | `strategy` | enum | `FAIL`（默认）、`PASS_THROUGH`、`RETURN_DEFAULT` |
| `fallback` | `defaultResponse` | object | `RETURN_DEFAULT` 时必填：`statusCode`、`contentType`、`body`、`headers` |

### `skipMock` / `forceMock` 的依赖分类 {#mock-categories}

必须使用 **`Category:operationGlob`** — 无前缀的裸 Glob 会被**拒绝**。

| Category | 典型 `operationGlob` |
|----------|----------------------|
| `HttpClient` | `/payment/charge`、`/internal/**` |
| `Database` | `select_*`、`*` |
| `Redis` | `GET user:*` |
| `DubboConsumer` | `com.foo.Service#method` |
| `SofaConsumer` | RPC 操作名 |
| `DubboStreamProvider` | 流式操作 |
| `QMessageProducer` | 主题或消息 ID |
| `ConfigFile` | 配置键 |
| `UserDynamic` | `com.foo.Cache.get`（用户配置的动态类） |
| `DynamicClass` | `SystemTime.**`、`RandomSource.**`（内置；全局默认强制 Mock，用户 `skipMock` 无效） |
| `Encryption` | `com.foo.Crypto.encrypt` |
| `IbmMQ` | MQ 目的地 |
| `SoapClient` | SOAP 操作 |
| `DSR` | DSR 操作 |

操作段 Glob：`*`（单段）、`**`（多段）、`?`（单字符）。

::: warning 分类键是依赖类型
不要在 Mock 规则中使用 `Servlet`、`DubboProvider` 等**入口**类型 — 仅上表**依赖**分类有效。
:::

### 完整示例

```yaml
apiVersion: softprobe.ai/v1
kind: MockPolicy
metadata:
  name: order-service-replay
  description: "order-service 回放默认"
  priority: 100
  enabled: true
selector:
  appIds: [order-service]
  envTags:
    env: [staging, prod]
spec:
  mockByDefault: true
  operations:
    skipMock:
      - "HttpClient:/health"
      - "HttpClient:/internal/admin/**"
    forceMock:
      - "HttpClient:/payment/charge"
      - "Database:*"
  matchTolerance:
    - operationPattern: "/api/order/**"
      ignoreHeaders: [x-request-id, x-trace-id, x-b3-*]
      ignoreQueryParams: [_t, timestamp]
  multiServiceDependencies:
    - downstreamApp: payment-service
      operations: ["/charge", "/refund"]
    - downstreamApp: inventory-service
      operationPatterns: ["/reserve", "/release"]
  fallback:
    strategy: FAIL
```

### 透传回退示例

```yaml
apiVersion: softprobe.ai/v1
kind: MockPolicy
metadata:
  name: order-service-isolated-replay
  priority: 100
selector:
  appIds: [order-service]
spec:
  fallback:
    strategy: PASS_THROUGH
```

### `RETURN_DEFAULT` 回退示例

```yaml
apiVersion: softprobe.ai/v1
kind: MockPolicy
metadata:
  name: order-service-default-mock
  priority: 100
selector:
  appIds: [order-service]
spec:
  operations:
    forceMock:
      - "HttpClient:/legacy/ping"
  fallback:
    strategy: RETURN_DEFAULT
    defaultResponse:
      statusCode: 200
      contentType: application/json
      body: '{"status":"ok"}'
      headers:
        x-mock: "true"
```

---

## CompareRulePolicy {#comparerulepolicy}

对比策略。

控制回放**差异对比**中的噪音：忽略路径、解压、归一化、数组匹配、对比后 CEL 过滤。

::: warning 操作范围
**不要**在 `selector` 上写 `operationNames` 或 `operationNamePatterns` — 保存时会被拒绝。需要按操作区分的规则请用 `spec.operationSpecs[]`。
:::

### `spec` 字段

| 区块 | 字段 | 类型 | 语义 |
|------|------|------|------|
| `defaults` | `timeToleranceMs` | integer ≥ 0 | CEL 中 `time_tolerance_ms` 及时间类规则 |
| `defaults` | `ignoreHeaderPatterns` | string[] | 按字段名 Glob 忽略差异，常用于 HTTP 头字段；不限于请求头 |
| | `includePaths` | string[] | JSON Pointer 白名单；空 = 对比全部 |
| | `excludePaths` | string[] | JSON Pointer 黑名单（预过滤） |
| `decompress[]` | `path` | string | JSON Pointer 或 Glob |
| `decompress[]` | `codec` | enum | `PLAIN_JSON`、`BASE64_JSON`、`GZIP_BASE64_JSON`。**当前版本不生效**，见下方说明 |
| `transforms[]` | `path` | string | JSON Pointer |
| `transforms[]` | `expression` | string | 对比前归一化的 CEL。**当前版本不生效**，见下方说明 |
| `arrays[]` | `path` | string | 数组字段路径 |
| `arrays[]` | `strategy` | enum | `BY_INDEX`（默认）或 `BY_KEY`（需要非空的 `keys`）。`BY_LCS`（控制台里的「LCS 算法」）可以保存，但当前版本不生效，等同于 `BY_INDEX` |
| `arrays[]` | `keys` | string[] | `BY_KEY` 时必填 |
| `arrays[]` | `references[]` | object | `field`、`target`、`targetKey` |
| `validations[]` | `id` | string | 规则唯一 ID |
| `validations[]` | `name` | string | 显示名 |
| `validations[]` | `expression` | string | CEL，结果为 bool |
| `validations[]` | `action` | enum | 仅 `DROP`（丢弃该差异） |
| `validations[]` | `enabled` | boolean | 默认 `true` |
| `validations[]` | `message` | string | 说明 |
| `operationSpecs[]` | `operationNames` / `operationNamePatterns` | string[] | 覆盖的入口操作 |
| `operationSpecs[]` | `spec` | object | 与顶层 spec 相同的叶子字段（不可嵌套 `operationSpecs`） |

路径为 **JSON Pointer**（`/foo/bar`）。Glob：`*` 单段，`**` 任意深度。

::: warning decompress 和 transforms 暂不生效
后端目前没有注册 `decompress` 编码和 `transforms` 表达式的处理程序。这两类规则能通过校验、也能保存，但对比时会被跳过（后端日志里留一条记录），仍按原值对比。
:::

### CEL 变量与函数

用于 `validations` 与 `transforms`：

| 名称 | 类型 | 含义 |
|------|------|------|
| `left` | string | 录制侧值 |
| `right` | string | 回放侧值 |
| `path` | string | JSON Pointer |
| `pointer` | string | 同 `path` |
| `fieldName` | string | 叶子字段名 |
| `category` | string | 依赖分类，如 `DATABASE` |
| `time_tolerance_ms` | int | 来自 `defaults.timeToleranceMs` |
| `isTimestamp(s)` | 函数 | 是否为可识别时间戳 |
| `toTimestamp(s)` | 函数 | 转为 epoch 毫秒 |
| `matches` | 方法 | 字符串正则 |

按分类忽略差异（如整类 `DATABASE` 的 `body`）用 **CEL `validations`** 实现，没有单独的「按分类忽略」字段。

### 完整示例（应用默认 + 按操作覆盖）

```yaml
apiVersion: softprobe.ai/v1
kind: CompareRulePolicy
metadata:
  name: order-service-compare
  description: "order-service 对比规则"
  priority: 100
selector:
  appIds: [order-service]
spec:
  defaults:
    timeToleranceMs: 60000
    ignoreHeaderPatterns: [x-request-id, x-b3-*]
  excludePaths:
    - "/response/headers/date"
    - "/response/body/metadata/generatedAt"
  decompress:
    - path: "/response/body/payload"
      codec: GZIP_BASE64_JSON
  arrays:
    - path: "/response/body/items"
      strategy: BY_KEY
      keys: [skuId]
  validations:
    - id: ignore-uuids
      name: 忽略 UUID 对
      expression: >-
        left.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
        && right.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
      action: DROP
      enabled: true
      message: 两侧均为 UUID
    - id: ignore-db-body
      name: DATABASE 类忽略 body
      expression: 'category == "DATABASE" && fieldName == "body"'
      action: DROP
      enabled: true
  operationSpecs:
    - operationNamePatterns: ["/api/order/export"]
      spec:
        excludePaths:
          - "/response/body/exportJobId"
        validations:
          - id: export-timestamp-tolerance
            expression: >-
              isTimestamp(left) && isTimestamp(right)
              && math.abs(toTimestamp(left) - toTimestamp(right)) <= time_tolerance_ms
            action: DROP
            enabled: true
```

---

## 相关配置 {#related-configuration}

### 动态类

**不属于** `RecordingPolicy`。在控制台的「动态类」页（或存储 API）中登记方法。回放时分类为 `UserDynamic` 或内置 `DynamicClass`（如 `SystemTime.*`）。用 **MockPolicy** 的 `forceMock` / `skipMock` 控制行为。

回放匹配顺序：先按请求参数**精确**匹配，未命中时再按方法签名**模糊**匹配。

### SensitivePolicy（敏感数据策略）

第四种策略，用于**查询/查看时**脱敏（REST API；暂无 `sp policy` CLI）。与 `RecordingPolicy.spec.sensitiveData` 分离。

| 字段 | 说明 |
|------|------|
| `spec.fieldNameRules[]` | `pattern`（Java 正则）、`type`：`NAME`、`ID_CARD`、`PHONE`、`EMAIL`、`PASSPORT`、`DEFAULT`、`NONE` |
| `spec.contentRules[]` | 同上，匹配字段**值** |

```yaml
apiVersion: softprobe.ai/v1
kind: SensitivePolicy
metadata:
  name: order-service-sensitive
  priority: 100
selector:
  appIds: [order-service]
spec:
  fieldNameRules:
    - pattern: "(?i)^password$"
      type: NAME
  contentRules:
    - pattern: "^1[3-9]\\d{9}$"
      type: PHONE
```

## 相关文档

- [策略概览](/zh/testing/policies)
- [回放与对比](/zh/testing/replay-and-diff)
- [CLI：policy 命令](/zh/testing/commands/policy)
