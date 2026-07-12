---
sidebar_label: Compare Rules Reference
sidebar_position: 3
title: Compare Rules Reference
description: Every compare-rule type — exclude paths, include paths, ignore categories, CEL rules, decompress, transforms, arrays, defaults, and per-endpoint overlays — documented field by field, for both the visual and YAML editors.
---

# Compare Rules Reference

Compare rules decide which replay differences **do not count**. The guiding principle: *what you configure is not compared; everything else is compared strictly.* This page documents every rule type down to each field.

## Two places to edit rules

| | Global default rules | Application rules |
| --- | --- | --- |
| **Where** | Settings → Compare Rules (`/sp/settings/compare-rules`) | Workbench → Configuration → Compare Rules |
| **Scope** | All applications | The current application only |
| **Editors** | Visual only | **Visual and YAML** (toggle at the top right) |
| **Covers** | All rule types, in six tabs | Exclude paths, CEL rules, ignore categories, and per-endpoint overlays visually; everything else in YAML |

Every application shows a link to the global defaults at the top of its panel (*"N global default rules apply to all applications"*), so you always know what else is in effect.

<div className="sp-img">
  <img src="/img/docs/replay/compare-rules-panel.png" alt="The application compare-rules panel" />
  <p className="sp-caption">The application compare-rules panel: the header links to the global defaults, the application-level section lists rules that apply to every endpoint, and the per-endpoint section holds overlays.</p>
</div>


:::info Visual vs YAML coverage
The application **visual** editor covers the three most common rule types — exclude paths, CEL rules, and ignore categories — plus per-endpoint overlays. The other types (include paths, decompress, transforms, arrays, defaults) are edited in **YAML** mode. The global defaults page exposes all types across its six tabs. Everything on this page is available in YAML.
:::

## The policy structure

Rules live in a single `CompareRulePolicy` document per application. Its `spec` holds every rule dimension:

```yaml
apiVersion: softprobe.ai/v1
kind: CompareRulePolicy
metadata:
  name: my-app-compare
  description: Compare rules for my-app
  priority: 100
selector:
  appIds: ["my-app"]        # global default policy uses matchAll: true instead
spec:
  excludePaths: []          # ignore by path
  includePaths: []          # whitelist paths
  ignoreCategories: []      # ignore by dependency type
  validations: []           # CEL rules (required key, may be empty)
  decompress: []            # decode before comparing
  transforms: []            # normalize values before comparing
  arrays: []                # array matching strategy
  defaults: {}              # time tolerance, ignored headers
  operationSpecs: []        # per-endpoint overlays
```

The top-level `spec` applies to **all** endpoints in the application. `operationSpecs` layer extra rules onto **specific** endpoints — see [Per-endpoint overlays](#per-endpoint-overlays-operationspecs).

---

## Exclude paths

**Ignore a field, and everything under it, by path.** The most common rule. Anything listed here is removed from the comparison before it runs — ideal for volatile fields like timestamps, trace IDs, and random tokens.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| *(each element)* | string | — | A JSON Pointer path, e.g. `/data/traceId`. Supports `*` (single level) and `**` (any depth). Dot form typed in the UI (`data.traceId`) is normalized to `/data/traceId`. |

**Visual:** In the global page, the **Ignore by path (quick)** tab. In an application, add a **path** row in the rule table. **YAML:**

```yaml
spec:
  excludePaths:
    - /data/traceId
    - /data/*/updatedAt
    - /response/body/data/**/timestamp
```

---

## Include paths

**A whitelist.** When non-empty, **only** the listed paths are compared; everything else is ignored. Leave empty to compare everything (the normal case). Rarely needed — reach for it only when you care about a small, fixed set of fields.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| *(each element)* | string | — | A JSON Pointer path. `*` matches one level, `**` any depth. |

**Visual:** Global page only (the **Include paths (whitelist)** section). In an application, YAML only. **YAML:**

```yaml
spec:
  includePaths:
    - /response/body/data/**
```

---

## Ignore categories (by dependency type) {#ignore-categories-by-dependency-type}

**Ignore an entire downstream dependency type.** A coarse switch at *dependency granularity* — independent of field-path or value rules. Use it to drop all differences from, say, Redis or a specific database call.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `operationType` | string | Yes | The dependency type, e.g. `Database`, `Redis`, `Dubbo`, `HttpClient`. Values are not a fixed enum — the picker is populated from the dependency types actually seen in your recordings. |
| `operationName` | string | No | A specific dependency under that type. Leave empty to ignore the whole type. |

**Visual:** In the global page, the **Dependency types** tab (adds and removes take effect immediately). In an application, add a **category** row — the type and name fields autocomplete from the recorded dependencies. **YAML:**

```yaml
spec:
  ignoreCategories:
    - operationType: Redis                       # ignore all Redis differences
    - operationType: Database
      operationName: userDao.selectById          # ignore only this one DB call
```

In the trace view, a category-ignored call shows an **"Entire category ignored"** chip rather than per-field strikethroughs, because the whole call is dropped at once.

---

## CEL rules (validations)

**Ignore a difference by evaluating a condition.** After the comparison runs, each difference is tested against a [CEL](https://github.com/google/cel-spec) expression; if it matches, the difference is dropped. The most flexible rule type — use it when a path or field-name match is not enough (for example "ignore any field whose recorded and replayed values are both timestamps").

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `expression` | string | Yes | A CEL expression returning a boolean. When it evaluates true for a difference, the difference is dropped. |
| `action` | string | Yes | Currently always `DROP` (drop the matched difference). |
| `enabled` | boolean | Yes | Whether the rule is active. |
| `name` | string | No | A human label for the rule. |
| `priority` | number | No | Evaluation priority. |
| `message` | string | No | A note explaining the rule. |

**Variables available in the expression:**

| Variable | Type | Meaning |
| --- | --- | --- |
| `path` | string | Full field path in dot form. |
| `pointer` | string | Field path in JSON Pointer form. |
| `fieldName` | string | The leaf field name. |
| `category` | string | The dependency type. |
| `left` | string | The recorded value. |
| `right` | string | The replayed value. |
| `time_tolerance_ms` | int64 | The configured [time tolerance](#defaults), default `60000`. |

**Helper functions:** `isUUID`, `isIP`, `isTimestamp`, `toTimestamp`, `toNumber`, plus the CEL standard, strings, and math libraries.

**Visual:** In the global page, the **Ignore by condition (CEL)** tab (with a template picker and an "available functions" reference). In an application, add a **CEL** row. Both submit with `action: DROP` and `enabled: true`. **YAML:**

```yaml
spec:
  validations:
    - name: ignore-timestamps
      expression: 'isTimestamp(left) && isTimestamp(right)'
      action: DROP
      enabled: true
    - name: ignore-generated-ids
      expression: 'fieldName == "requestId" && isUUID(right)'
      action: DROP
      enabled: true
```

---

## Decompress

**Decode encoded fields before comparing.** When a field holds base64- or gzip-encoded JSON, decode it first so the comparison sees structured data instead of an opaque blob (and reports meaningful differences instead of "these two encoded strings differ").

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | Yes | The field path to decode. |
| `codec` | string | Yes | One of `base64+json`, `gzip+base64+json`, or `json`. |

**Visual:** Global page only (**Decompress** tab). In an application, YAML only. **YAML:**

```yaml
spec:
  decompress:
    - path: /response/body/data/payload
      codec: gzip+base64+json
```

---

## Transforms

**Normalize a value before comparing.** Runs a CEL expression on a field's value to remove noise — for example rounding a float so precision differences do not register.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | Yes | The target field path. |
| `expression` | string | Yes | A CEL expression; the variable `value` is the field's original value. |

**Visual:** Global page only (**Value transform** tab). In an application, YAML only. **YAML:**

```yaml
spec:
  transforms:
    - path: /response/body/data/orders/*/total
      expression: math.round(value * 100) / 100
```

---

## Arrays

**Match array elements when order is not stable.** By default arrays are compared by index. When element order varies between recording and replay, comparing by index produces false "missing / new element" differences. Configure a matching strategy to compare the array as a set.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | Yes | The array path. |
| `strategy` | string | No | `BY_INDEX` (default), `BY_KEY` (pair elements by a key field), or `BY_LCS` (longest common subsequence). |
| `keys` | string[] | No | The key field(s) used by `BY_KEY`. In the UI, entered comma-separated. |
| `references` | object[] | No | Foreign-key pairings — see below. |

Each entry in `references` links an element field to another array:

| Field | Type | Description |
| --- | --- | --- |
| `field` | string | The field in this array's elements that acts as a foreign key. |
| `target` | string | The path of the target array. |
| `targetKey` | string | The key field in the target array to pair against. |

**Visual:** Global page only (**Array matching** tab); `keys` is enabled only when the strategy is `BY_KEY`. The `references` field is not exposed in either visual editor — configure it in YAML or via the quick "declare foreign key" action in the diff. In an application, YAML only. **YAML:**

```yaml
spec:
  arrays:
    - path: /response/body/data/orders
      strategy: BY_KEY
      keys: [orderId]
    - path: /data/items
      strategy: BY_KEY
      references:
        - field: orderId          # items[].orderId is the foreign key
          target: /data/orders     # points to the orders array
          targetKey: id            # paired against orders[].id
```

---

## Defaults {#defaults}

**Global defaults for the comparison.**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `timeToleranceMs` | number | No | Time tolerance in milliseconds. Two time values within this window are not counted as a difference. Exposed to CEL rules as `time_tolerance_ms` (default `60000`). |
| `ignoreHeaderPatterns` | string[] | Yes | Glob patterns for header **names** to ignore (by name, not value). New application policies default to `["sp-*", "x-sp-*"]` to mask SoftProbe's own injected headers. |

**Visual:** Not exposed in either visual editor — edit in YAML, or set time tolerance via the quick action in the diff. **YAML:**

```yaml
spec:
  defaults:
    timeToleranceMs: 60000
    ignoreHeaderPatterns: ["sp-*", "x-sp-*", "date", "request-id"]
```

---

## Per-endpoint overlays (operationSpecs) {#per-endpoint-overlays-operationspecs}

**Apply extra rules to specific endpoints only.** The top-level `spec` applies to every endpoint; an overlay layers additional rules onto the endpoints it matches. When a request hits a matched endpoint, the top-level spec is the base and the matching overlay's rules are added on top (list fields are merged, scalar fields overridden).

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `operationNames` | string[] | No | Exact endpoint names to match. |
| `operationNamePatterns` | string[] | No | Glob patterns to match endpoint names. |
| `spec` | object | Yes | The rules that apply only to matched endpoints. Same shape as the top-level `spec`, **except** it cannot contain further `operationSpecs` (overlays are one level deep). |

**Visual:** Application panel only, in the **Per-endpoint** section — each group has its own copy of the rule table (exclude paths, CEL rules, ignore categories). Enter exact names and/or glob patterns (comma- or newline-separated). **YAML:**

```yaml
spec:
  excludePaths: ["/data/serverIp"]          # applies to every endpoint
  operationSpecs:
    - operationNames: ["/api/order/list"]
      spec:
        excludePaths: ["/data/recommendList"]
    - operationNamePatterns: ["/api/report/**"]
      spec:
        validations:
          - expression: 'fieldName == "cost"'
            action: DROP
            enabled: true
```

:::note Endpoint scope goes in operationSpecs, not selector
The `selector` also has `operationNames` / `operationNamePatterns` fields, but they are **not allowed** on a compare-rule policy — endpoint scoping always goes through `operationSpecs`. See [Scope](#scope-selector).
:::

---

## Scope (selector) {#scope-selector}

The `selector` decides which applications a policy applies to. You normally do not edit it directly — the entry point sets it (the global page uses `matchAll: true`; an application panel fixes `appIds` to the current app).

| Field | Type | Description |
| --- | --- | --- |
| `matchAll` | boolean | `true` = the global default policy, applies to all applications. |
| `appIds` | string[] | The application IDs this policy applies to. |
| `appIdPattern` | string | Glob for application IDs. |
| `excludeAppIds` | string[] | Application IDs to exclude. |
| `envTags` | object | Tag key → allowed values; fail-closed. |
| `operationNames` / `operationNamePatterns` | string[] | **Not allowed** on compare-rule policies — use `operationSpecs`. |

`metadata.priority` orders overlapping policies (application policies default to `100`, the global default to `0`).

---

## Quick rules from the diff

The ignore actions in the [trace view](/replay/trace-view#ignoring-a-field) write into these same dimensions. Knowing the mapping helps when you later find a rule in the reference and want to know where it came from:

| Diff action | Writes into |
| --- | --- |
| Ignore this field's differences | `excludePaths` (by full path) |
| Ignore all "`{name}`" fields | `validations` (a CEL rule matching that leaf name) |
| Set as array key | `arrays` with `strategy: BY_KEY` |
| Declare foreign key | `arrays[].references` |
| (Quick time tolerance) | `defaults.timeToleranceMs` |

When the action is scoped to an endpoint, the rule lands in the matching `operationSpecs` overlay; scoped to the whole app, it lands in the top-level `spec`.

## Field summary

| Dimension | `spec` key | Element fields | Visual editor |
| --- | --- | --- | --- |
| Exclude paths | `excludePaths` | JSON Pointer strings | Global + application |
| Include paths (whitelist) | `includePaths` | JSON Pointer strings | Global only |
| Ignore categories | `ignoreCategories` | `operationType` (req), `operationName` | Global + application |
| CEL rules | `validations` | `expression` (req), `action` (req), `enabled` (req), `name`, `priority`, `message` | Global + application |
| Decompress | `decompress` | `path` (req), `codec` (req) | Global only |
| Transforms | `transforms` | `path` (req), `expression` (req) | Global only |
| Arrays | `arrays` | `path` (req), `strategy`, `keys`, `references` | Global only (no `references`) |
| Defaults | `defaults` | `timeToleranceMs`, `ignoreHeaderPatterns` (req) | YAML / quick action only |
| Per-endpoint overlays | `operationSpecs` | `operationNames`, `operationNamePatterns`, `spec` (req) | Application only |
