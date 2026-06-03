---
title: Policy YAML guide
---

# Policy YAML guide

Softprobe Testing uses **declarative YAML policies** (`apiVersion: softprobe.ai/v1`) for recording, replay mocking, and diff comparison. Policies are versioned resources scoped to apps (and optionally environments and operations), merged by priority, and applied by sp-boot at runtime.

Manage the three CLI-supported kinds with:

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
sp policy mock apply -f mock.yaml --json
sp policy compare apply -f compare.yaml --json
```

| Kind | What it controls | CLI |
|------|------------------|-----|
| `RecordingPolicy` | Sampling, time windows, operation include/exclude, serialize skip, time mock | `sp policy recording` |
| `MockPolicy` | Skip/force mock, lookup tolerance, cross-app deps, fallback | `sp policy mock` |
| `CompareRulePolicy` | Ignore paths, decompress, transforms, array matchers, CEL validations | `sp policy compare` |

JSON schemas live in the backend module `sp-policy-rules` (`src/main/resources/schema/`). Use them in your editor via `# yaml-language-server: $schema=...` for completions.

## Shared document shape

Every policy has the same outer structure:

```yaml
apiVersion: softprobe.ai/v1
kind: RecordingPolicy   # or MockPolicy / CompareRulePolicy
metadata:
  name: my-app-recording
  priority: 100
  description: "optional"
  enabled: true         # RecordingPolicy / MockPolicy only
selector:
  appIds: [my-app-id]
  envTags:
    env: [prod]
spec:
  # kind-specific
```

### Common fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `apiVersion` | string | yes | Must be `softprobe.ai/v1` |
| `kind` | string | yes | One of the three kinds above |
| `metadata.name` | string | yes | Unique id (lowercase-dash) |
| `metadata.priority` | integer | no | Default `0`. Higher merges later and wins conflicts |
| `metadata.description` | string | no | Free text |
| `metadata.enabled` | boolean | no | Recording/Mock only; default `true` |
| `selector.matchAll` | boolean | no | Apply to every app (system defaults use this at priority 0) |
| `selector.appIds` | string[] | one of\* | Exact app ids |
| `selector.appIdPattern` | string | one of\* | Glob, e.g. `order-*` |
| `selector.excludeAppIds` | string[] | no | Subtract from match |
| `selector.envTags` | map | no | Tag key → list of allowed values, e.g. `env: [prod, staging]`. Matches agent tags from `-Dsp.mocker.tags=env=prod`. Conjunctive: every declared key must match. Omitted = all environments |
| `selector.operationNames` | string[] | no | Exact operation names. **Recording and Mock only** — rejected on CompareRulePolicy selector |
| `selector.operationNamePatterns` | string[] | no | Globs, e.g. `/api/order/*`. **Recording and Mock only** |

\*Selector must include at least one of `matchAll`, `appIds`, or `appIdPattern`.

**Selector dimensions** are conjunctive: app match AND (optional) env match AND (optional) operation match. Empty operation constraints mean “all operations for matched apps.”

### Merging

Multiple policies matching the same app are merged in **priority ascending** (higher number applied last):

| Kind | Merge behavior |
|------|----------------|
| **Compare** | Scalars overridden; lists/maps unioned; last-write-wins on keys |
| **Recording** | Scalars overridden; lists unioned; `timeMock` sticky-true (any policy sets true → true); `serializeSkip` merged by `className` + field name union |
| **Mock** | Scalars overridden; `skipMock`/`forceMock` unioned; `matchTolerance` and `multiServiceDependencies` keyed by pattern/app with last-write-wins |

Priority-0 `default-global-*-policy.yaml` files ship inside sp-boot; set `priority > 0` on your policies to override.

### Runtime pipeline

```text
YAML → parse → validate → Mongo → resolve + merge → compile → PolicyCache (fresh 60s, stale 24h)
```

If the cache cannot load from Mongo in time, callers degrade safely (recording: do not record; mock: pass-through).

### Authoring tips

1. Use JSON Schema in your editor for inline validation.
2. Avoid `matchAll: true` in app-specific policies unless you intend a global rule — defaults already provide a floor.
3. Comment the **why** in YAML; the schema documents the **what**.

---

## RecordingPolicy

Controls **what the agent records**: sampling, schedule, operation filters, optional scrubbing metadata, serialization skips, and record-time time mock.

### `spec` fields

| Section | Field | Type | Semantics |
|---------|-------|------|-----------|
| `sampling` | `ratePerHundredSeconds` | integer ≥ 0 | Max requests recorded per 100-second window. `0` = no recording |
| `sampling` | `machineCountLimit` | integer ≥ 1 or omit | Max concurrent recording instances in the env group. **Omit = unlimited.** Avoid `1` unless you understand quota pinning |
| `timeWindow` | `daysOfWeek` | `MON`…`SUN` or `*` | Omit section = 24/7 |
| `timeWindow` | `from` / `to` | `HH:mm` | Both required together; `from` strictly before `to` (validator). Agent uses JVM local timezone |
| `operations` | `exclude` | string[] | Globs not recorded (deny list) |
| `operations` | `include` | string[] | When non-empty: **whitelist** — only these ops recorded; `exclude` still applies after include |
| `sensitiveData` | `headers` | string[] | Case-insensitive header names (see note below) |
| `sensitiveData` | `bodyPaths` | string[] | JSONPath; must start with `$` |
| `sensitiveData` | `queryParams` | string[] | Query parameter names |
| `sensitiveData` | `placeholder` | string | Replacement text; default `***` |
| `serializeSkip` | `className` | string | Java class |
| `serializeSkip` | `fieldNames` | string[] | Fields to skip in bytecode serialization |
| | `timeMock` | boolean | Mock `java.time.*` at record time for deterministic replays |
| | `extras` | map string→string | Forwarded to agent `extendField` |

::: warning `sensitiveData` on the record path
The backend forwards `sensitiveData` to the agent wire DTO, but the **Java agent does not apply scrubbing at record time yet**. For replay mock-key noise, use `MockPolicy.spec.matchTolerance`. For view/query-time masking, use `SensitivePolicy` (REST API; no `sp policy` CLI today).
:::

Replay schedules read include/exclude from the compiled recording policy when building operation scope — changing recording policy can change replay scope without editing the schedule document.

### Full example

```yaml
apiVersion: softprobe.ai/v1
kind: RecordingPolicy
metadata:
  name: order-service-prod
  description: "Prod recording — 50 reqs/100s, business hours, scrub metadata."
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
    # include:
    #   - "/api/order/create"
    #   - "/api/order/pay"
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

### Whitelist-only recording example

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

Controls **replay-time** dependency mocking: which calls use recorded data vs real downstream, mock-key tolerance, multi-app dependency maps, and behavior when no mock exists.

### `spec` fields

| Section | Field | Type | Semantics |
|---------|-------|------|-----------|
| | `mockByDefault` | boolean | Default `true`: mock all dependencies except `skipMock`. `false`: call real downstream except `forceMock` |
| `operations` | `skipMock` | string[] | `Category:operationGlob` — bypass mock, hit real downstream |
| `operations` | `forceMock` | string[] | `Category:operationGlob` — must mock; wins over `skipMock` |
| `matchTolerance` | `operationPattern` | string | Glob on **entry** operation |
| `matchTolerance` | `ignoreHeaders` | string[] | Dropped from mock fingerprint |
| `matchTolerance` | `ignoreQueryParams` | string[] | Dropped from mock fingerprint |
| `matchTolerance` | `ignoreBodyPaths` | string[] | JSON paths ignored in mock lookup |
| `multiServiceDependencies` | `downstreamApp` | string | Other app id |
| `multiServiceDependencies` | `operations` | string[] | Exact downstream ops to mock from session |
| `multiServiceDependencies` | `operationPatterns` | string[] | Globs (one of `operations` or `operationPatterns` required) |
| `fallback` | `strategy` | enum | `FAIL` (default), `PASS_THROUGH`, `RETURN_DEFAULT` |
| `fallback` | `defaultResponse` | object | Required when `RETURN_DEFAULT`: `statusCode`, `contentType`, `body`, `headers` |

### Dependency categories for `skipMock` / `forceMock` {#dependency-categories}

Use **`Category:operationGlob`** — bare globs without a category prefix are **rejected**.

| Category | Typical `operationGlob` examples |
|----------|----------------------------------|
| `HttpClient` | `/payment/charge`, `/internal/**` |
| `Database` | `select_*`, `*` |
| `Redis` | `GET user:*` |
| `DubboConsumer` | `com.foo.Service#method` |
| `SofaConsumer` | RPC operation names |
| `DubboStreamProvider` | Stream ops |
| `QMessageProducer` | Topic or message id |
| `ConfigFile` | Config keys |
| `UserDynamic` | `com.foo.Cache.get` (user-configured dynamic class) |
| `DynamicClass` | `SystemTime.**`, `RandomSource.**` (built-in; global default force-mocks these — user `skipMock` has no effect) |
| `Encryption` | `com.foo.Crypto.encrypt` |
| `IbmMQ` | MQ destinations |
| `SoapClient` | SOAP actions |
| `DSR` | DSR operations |

Glob in the operation segment: `*` (one path segment), `**` (multiple segments), `?` (single character).

::: warning Entry types are not mock policy keys
Do not use `Servlet`, `DubboProvider`, or other **entry** categories in mock rules — only **dependency** categories above.
:::

### Full example

```yaml
apiVersion: softprobe.ai/v1
kind: MockPolicy
metadata:
  name: order-service-replay
  description: "Replay defaults for order-service"
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

### Pass-through fallback example

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

### `RETURN_DEFAULT` fallback example

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

Controls **diff noise** during replay comparison: ignored paths, decompression, transforms, array matching, and post-diff CEL filters.

::: warning Operation scope
Do **not** put `operationNames` or `operationNamePatterns` on `selector` — the validator rejects them. Use `spec.operationSpecs[]` for per-operation overlays.
:::

### `spec` fields

| Section | Field | Type | Semantics |
|---------|-------|------|-----------|
| `defaults` | `timeToleranceMs` | integer ≥ 0 | Used by CEL `time_tolerance_ms` and timestamp rules |
| `defaults` | `ignoreHeaderPatterns` | string[] | Header name globs skipped in compare |
| | `includePaths` | string[] | JSON Pointer whitelist; empty = compare all |
| | `excludePaths` | string[] | JSON Pointer blacklist (pre-filter) |
| `decompress[]` | `path` | string | JSON Pointer or glob (`/data/**`) |
| `decompress[]` | `codec` | enum | `PLAIN_JSON`, `BASE64_JSON`, `GZIP_BASE64_JSON` |
| `transforms[]` | `path` | string | JSON Pointer |
| `transforms[]` | `expression` | string | CEL expression to normalize value before compare |
| `arrays[]` | `path` | string | Array field path |
| `arrays[]` | `strategy` | enum | `BY_INDEX` (default) or `BY_KEY` |
| `arrays[]` | `keys` | string[] | Required when `BY_KEY` |
| `arrays[]` | `references[]` | object | `field`, `target`, `targetKey` for FK-style array linking |
| `validations[]` | `id` | string | Unique rule id |
| `validations[]` | `name` | string | Display name |
| `validations[]` | `expression` | string | CEL; must evaluate to bool |
| `validations[]` | `action` | enum | `DROP` only (ignore this diff) |
| `validations[]` | `enabled` | boolean | Default `true` |
| `validations[]` | `message` | string | Human-readable reason |
| `operationSpecs[]` | `operationNames` / `operationNamePatterns` | string[] | Which entry ops this overlay applies to |
| `operationSpecs[]` | `spec` | object | Same leaf fields as top-level spec (no nested `operationSpecs`) |

Paths use **JSON Pointer** syntax (`/foo/bar`). Globs: `*` = one segment, `**` = any depth.

### CEL variables and helpers

Available in `validations` and `transforms`:

| Name | Type | Meaning |
|------|------|---------|
| `left` | string | Recorded value |
| `right` | string | Replay value |
| `path` | string | JSON Pointer path |
| `pointer` | string | Alias for path |
| `fieldName` | string | Leaf field name |
| `category` | string | Dependency category, e.g. `DATABASE` |
| `time_tolerance_ms` | int | From `defaults.timeToleranceMs` |
| `isTimestamp(s)` | function | True if string is a known timestamp format |
| `toTimestamp(s)` | function | Epoch millis |
| `matches` | method | Regex on strings |

### Full example (app defaults + per-operation overlay)

```yaml
apiVersion: softprobe.ai/v1
kind: CompareRulePolicy
metadata:
  name: order-service-compare
  description: "Compare rules for order-service"
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
      name: Ignore UUID pairs
      expression: >-
        left.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
        && right.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
      action: DROP
      enabled: true
      message: Both sides are UUIDs
    - id: ignore-db-body
      name: Skip raw SQL body on DATABASE
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

## Related configuration {#related-configuration}

### Dynamic classes

**Not** part of `RecordingPolicy`. Configure methods in **Dynamic class configuration** (dashboard or storage API). At replay, they appear under `UserDynamic` or built-in `DynamicClass` (e.g. `SystemTime.*`, `RandomSource.*`). Control mock behavior with `MockPolicy` `forceMock` / `skipMock`, not recording policy.

Matching at replay: exact parameter match first, then fuzzy match by signature.

### SensitivePolicy

Fourth policy kind for **query/view-time** PII masking (REST API; no `sp policy` CLI). Separate from `RecordingPolicy.spec.sensitiveData`.

| Field | Notes |
|-------|-------|
| `spec.fieldNameRules[]` | `pattern` (Java regex), `type`: `NAME`, `ID_CARD`, `PHONE`, `EMAIL`, `PASSPORT`, `DEFAULT`, `NONE` |
| `spec.contentRules[]` | Same shape; matches field **values** |

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

## Related

- [Policies overview](/en/testing/policies)
- [Replay and diff](/en/testing/replay-and-diff)
- [CLI: policy command](/en/cli/commands/policy)
