---
sidebar_label: Compare Rules Reference
sidebar_position: 3
title: Compare Rules Reference
description: Configure which replay differences don't count — set every rule type from the visual editor, field by field, with screenshots.
---

# Compare Rules Reference

Compare rules decide which replay differences **don't count**. The principle is simple: *what you configure is skipped; everything else is compared strictly.*

You configure them in the **visual editor** — pick a rule type, fill in a field or two, click add. This page walks through every rule type the way you set it up in the UI. (There is also a YAML view for automation; it's summarized at the end.)

## Where to configure rules

There are two places, for two scopes:

| | Global default rules | Application rules |
| --- | --- | --- |
| **Open it from** | Settings → Compare Rules | Workbench → Configuration → Compare Rules |
| **Applies to** | Every application | The current application only |
| **Rule types** | All types, in six tabs | The three common types plus per-endpoint overlays; the rest via the YAML view |

Whichever you open, an application panel shows a link to the global defaults at the top, so you always see what else is in effect.

<div className="sp-img">
  <img src="/img/docs/replay/compare-rules-panel.png" alt="The application compare-rules panel" />
  <p className="sp-caption">An application's Compare Rules panel: the header links to the global defaults; the application-level section lists rules that apply to every endpoint; the per-endpoint section holds overlays.</p>
</div>

The global page groups the rule types into six tabs — one per type below:

<div className="sp-img">
  <img src="/img/docs/replay/rules-global-tabs.png" alt="The six rule-type tabs on the global compare-rules page" />
  <p className="sp-caption">The six rule-type tabs on the global compare-rules page.</p>
</div>

---

## Ignore a field by path

**The most common rule — stop comparing a field.** Ideal for volatile fields: timestamps, trace IDs, random tokens. The field, and everything under it, is removed from the comparison.

**How to add it:** open the **Ignore by path** tab, type the field path in **Ignore fields (not compared on replay)**, and click **Add**.

<div className="sp-img">
  <img src="/img/docs/replay/rule-exclude-path.png" alt="The path tab with the include (whitelist) and ignore (exclude) inputs" />
  <p className="sp-caption">The path tab. The bottom input, "Ignore fields", is the common one; the top input is the whitelist (see below).</p>
</div>

**What to type:** a field path. Both `data.traceId` (dot form) and `/data/traceId` (JSON Pointer) work — dot form is normalized for you. Use `*` for one level and `**` for any depth, e.g. `/data/*/updatedAt` or `/response/body/data/**/timestamp`.

:::note The whitelist input (rarely needed)
The same tab has an **Include paths (whitelist)** input at the top. When you add anything here, **only** those paths are compared and everything else is ignored — the opposite of the ignore list. Leave it empty (the normal case) to compare everything. Reach for it only when you care about a small, fixed set of fields.
:::

---

## Ignore an entire dependency type {#ignore-categories-by-dependency-type}

**A coarse switch — drop all differences from one kind of downstream call.** For example, ignore every Redis difference, or every difference from one database query. Independent of the field-level rules.

**How to add it:** open the **Dependency types** tab. Enter the **type** (e.g. `Redis`, `Database`, `Dubbo`, `HttpClient`) and, optionally, a specific dependency **name**. Leave the name empty to ignore the whole type. Adds and removes take effect immediately.

<div className="sp-img">
  <img src="/img/docs/replay/rule-ignore-category.png" alt="The dependency types tab" />
  <p className="sp-caption">The Dependency types tab. In an application panel, the type and name fields autocomplete from the dependencies actually seen in your recordings.</p>
</div>

**What to fill:**

| Field | Required | What to enter |
| --- | --- | --- |
| Type | Yes | The dependency type. In an application, it autocompletes from your recordings. |
| Name | No | A specific dependency under that type. Empty = the whole type. |

In the trace view, a call ignored this way shows an **"Entire category ignored"** chip instead of per-field strikethroughs — the whole call is dropped at once.

---

## Ignore by a condition (CEL)

**The most flexible rule — ignore a difference when a condition is true.** Use it when matching by path or field name isn't enough, for example "ignore any field whose recorded and replayed values are both timestamps." After the comparison runs, each difference is tested against your condition; if it matches, the difference is dropped.

**How to add it:** open the **Ignore by condition (CEL)** tab, click **Add rule**, optionally name it, and write the condition. A **template picker** offers ready-made conditions, and **Available functions** lists the helpers you can call.

<div className="sp-img">
  <img src="/img/docs/replay/rule-cel.png" alt="The CEL rules tab with example rules" />
  <p className="sp-caption">The CEL tab, with built-in example rules (ignore UUID-shaped values, IP addresses, timestamps within tolerance). Each rule has a toggle to enable/disable it and can be deleted.</p>
</div>

**Variables you can use in the condition:**

| Variable | Meaning |
| --- | --- |
| `left` / `right` | The recorded value / the replayed value |
| `path` / `pointer` | The full field path (dot form / JSON Pointer form) |
| `fieldName` | The leaf field name |
| `category` | The dependency type |
| `time_tolerance_ms` | The configured time tolerance (default `60000`) |

**Helper functions:** `isUUID`, `isIP`, `isTimestamp`, `toTimestamp`, `toNumber`, plus the standard CEL, strings, and math libraries.

Examples (all available as templates):

- Ignore values that are both timestamps: `isTimestamp(left) && isTimestamp(right)`
- Ignore a generated ID: `fieldName == "requestId" && isUUID(right)`
- Skip the raw SQL body on database calls: `category == "DATABASE" && fieldName == "body"`

---

## Normalize a value before comparing

**Round or reshape a value so noise doesn't register.** For example, round a float so precision differences don't count as a difference. The value is transformed before the comparison sees it.

**How to add it:** open the **Value transform** tab, enter the field **path** and a CEL **expression** on the value (the variable `value` is the field's original value), then click **Add transform**.

<div className="sp-img">
  <img src="/img/docs/replay/rule-transform.png" alt="The value transform tab" />
  <p className="sp-caption">The Value transform tab: a path input and a CEL expression input, where <code>value</code> is the field's original value.</p>
</div>

Example — round to two decimals: path `/response/body/data/orders/*/total`, expression `math.round(value * 100) / 100`.

---

## Decode an encoded field before comparing

**Decode base64/gzip JSON so the comparison sees real data.** When a field holds an encoded blob, decode it first — otherwise the comparison just reports "these two encoded strings differ" instead of the meaningful difference inside.

**How to add it:** open the **Decompress** tab, enter the field **path**, and pick the **codec**.

<div className="sp-img">
  <img src="/img/docs/replay/rule-decompress.png" alt="The decompress tab" />
  <p className="sp-caption">The Decompress tab: a path input and a codec dropdown.</p>
</div>

**Codec options:** `Base64 + JSON`, `Gzip + Base64 + JSON`, or `Plain JSON`.

---

## Match array elements when order varies

**Compare an unordered array as a set, not by position.** By default arrays are compared by index — when element order changes between recording and replay, that produces false "missing / new element" differences. Configure a matching strategy instead.

**How to add it:** open the **Array matching** tab, enter the array **path**, pick a **strategy**, and (for `By key`) enter the **key field(s)**. Click **Add array config**.

<div className="sp-img">
  <img src="/img/docs/replay/rule-arrays.png" alt="The array matching tab" />
  <p className="sp-caption">The Array matching tab: a path input, a strategy dropdown, and (for By key) a comma-separated key-fields input.</p>
</div>

**Strategy options:**

| Strategy | When to use |
| --- | --- |
| By index | Default — compare position by position. |
| By key | Pair elements by a key field (enter the key, e.g. `orderId`). |
| By LCS | Longest common subsequence — best-effort alignment without a key. |

:::note Foreign keys
Arrays can also declare a **foreign key** to another array (so nested references line up). This is set via the "declare foreign key" quick action in the diff, or in the YAML view — there's no dedicated visual control for it.
:::

---

## Apply rules to specific endpoints only

**Layer extra rules onto certain endpoints.** The rules above apply to every endpoint in the application. When you need rules for just some endpoints, add a **per-endpoint** group — the top-level rules stay the base, and the group's rules are added on top for the endpoints it matches.

**How to add it:** in an application panel, the **Per-endpoint** section. Click **Add endpoint rules**, enter the endpoints to match — **exact names** (comma- or newline-separated) and/or **glob patterns** like `/api/order/*` — then fill in that group's own rule table (path, CEL, and category rules, just like the top level).

**What to fill:**

| Field | What to enter |
| --- | --- |
| Exact match | Endpoint names, e.g. `/api/order/list, /api/order/detail` |
| Glob match | Endpoint patterns, e.g. `/api/order/*` |
| Rules | The rules to apply only to those endpoints |

---

## Time tolerance and ignored headers

Two settings live on the policy defaults rather than in a tab:

- **Time tolerance** — two time values within this many milliseconds don't count as a difference (default `60000`). You can also set it via the quick action in the diff.
- **Ignored headers** — header **names** (by name, not value) to skip, as glob patterns. New applications default to `sp-*` and `x-sp-*` to mask SoftProbe's own headers.

These are edited in the YAML view (or, for time tolerance, the diff quick action).

---

## Where quick rules from the diff go

When you [ignore a field in the trace view](/replay/trace-view#ignoring-a-field), it writes into one of the rule types above:

| Diff action | Becomes |
| --- | --- |
| Ignore this field's differences | An **ignore-by-path** rule |
| Ignore all "`{name}`" fields | A **CEL** rule matching that field name |
| Set as array key | An **array** rule (By key) |
| Declare foreign key | An array **foreign key** |

Scoped to an endpoint, it lands in a per-endpoint group; scoped to the whole app, at the top level.

---

## The YAML view (for automation)

Every rule above maps to a field in a `CompareRulePolicy` document, which the application panel can show and edit as YAML. This is mainly for automation and for generating rules with AI — the visual editor is the friendlier path for day-to-day use. The mapping:

| Rule type | YAML key under `spec` | Key fields |
| --- | --- | --- |
| Ignore by path | `excludePaths` | list of path strings |
| Whitelist | `includePaths` | list of path strings |
| Dependency type | `ignoreCategories` | `operationType`, `operationName` |
| CEL | `validations` | `expression`, `action: DROP`, `enabled` |
| Value transform | `transforms` | `path`, `expression` |
| Decompress | `decompress` | `path`, `codec` |
| Array matching | `arrays` | `path`, `strategy`, `keys`, `references` |
| Time tolerance / headers | `defaults` | `timeToleranceMs`, `ignoreHeaderPatterns` |
| Per-endpoint | `operationSpecs` | `operationNames`, `operationNamePatterns`, `spec` |

A compact example:

```yaml
spec:
  excludePaths: ["/data/traceId", "/data/*/updatedAt"]
  ignoreCategories:
    - operationType: Redis
  validations:
    - expression: 'isTimestamp(left) && isTimestamp(right)'
      action: DROP
      enabled: true
  operationSpecs:
    - operationNames: ["/api/order/list"]
      spec:
        excludePaths: ["/data/recommendList"]
```
