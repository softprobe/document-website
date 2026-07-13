---
title: Compare rules in the Web UI
---

# Compare rules in the Web UI

Compare rules decide which replay differences **don't count**. The principle: *what you configure is skipped; everything else is compared strictly.*

This page covers setting rules in the **visual editor** — pick a rule type, fill in a field or two, click add. The same rules can be written in YAML (see [Policy YAML guide](/en/testing/policy-yaml-guide)); the visual editor is the friendlier path for day-to-day use.

## Where to configure rules

There are two places, for two scopes:

| | Global default rules | Application rules |
|---|---|---|
| Open from | Settings → Compare Rules | Workbench → Configuration → Compare Rules |
| Applies to | Every application | The current application only |
| Rule types | All types, in six tabs | The three common types plus per-endpoint overlays; the rest via YAML |

An application panel links to the global defaults at the top, so you always see what else is in effect.

![The application compare-rules panel](/img/docs/replay/compare-rules-panel.png)

The global page groups the rule types into six tabs — one per type below.

![The six rule-type tabs](/img/docs/replay/rules-global-tabs.png)

## Ignore a field by path

**The most common rule — stop comparing a field.** Ideal for volatile fields: timestamps, trace IDs, random tokens. The field, and everything under it, is removed from the comparison.

**How to add it:** open the **Ignore by path** tab, type the field path in **Ignore fields**, and click **Add**.

![The path tab](/img/docs/replay/rule-exclude-path.png)

**What to type:** a field path. Both `data.traceId` (dot form) and `/data/traceId` (JSON Pointer) work. Use `*` for one level and `**` for any depth, e.g. `/data/*/updatedAt`.

::: tip The whitelist input (rarely needed)
The same tab has an **Include paths (whitelist)** input at the top. Add anything here and **only** those paths are compared, everything else ignored — the opposite of the ignore list. Leave it empty (the normal case) to compare everything.
:::

## Ignore an entire dependency type

**A coarse switch — drop all differences from one kind of downstream call.** For example, ignore every Redis difference, or every difference from one database query.

**How to add it:** open the **Dependency types** tab. Enter the **type** (e.g. `Redis`, `Database`, `Dubbo`, `HttpClient`) and, optionally, a specific dependency **name**. Leave the name empty to ignore the whole type.

![The dependency types tab](/img/docs/replay/rule-ignore-category.png)

In a run, a call ignored this way shows an **"Entire category ignored"** chip instead of per-field strikethroughs — the whole call is dropped at once.

## Ignore by a condition (CEL)

**The most flexible rule — ignore a difference when a condition is true.** Use it when matching by path or field name isn't enough, e.g. "ignore any field whose recorded and replayed values are both timestamps." After the comparison runs, each difference is tested against your condition; if it matches, the difference is dropped.

**How to add it:** open the **Ignore by condition (CEL)** tab, click **Add rule**, optionally name it, and write the condition. A template picker offers ready-made conditions.

![The CEL rules tab with example rules](/img/docs/replay/rule-cel.png)

Variables you can use: `left` / `right` (recorded / replayed value), `path` / `pointer` (field path), `fieldName`, `category`, `time_tolerance_ms`. Helpers: `isUUID`, `isIP`, `isTimestamp`, `toTimestamp`, `toNumber`.

Examples:

- Both values are timestamps: `isTimestamp(left) && isTimestamp(right)`
- A generated ID: `fieldName == "requestId" && isUUID(right)`

## Normalize a value before comparing

**Round or reshape a value so noise doesn't register** — e.g. round a float so precision differences don't count.

**How to add it:** open the **Value transform** tab, enter the field **path** and a CEL **expression** on the value (`value` is the field's original value), then click **Add transform**.

![The value transform tab](/img/docs/replay/rule-transform.png)

Example — round to two decimals: path `/data/orders/*/total`, expression `math.round(value * 100) / 100`.

## Decode an encoded field before comparing

**Decode base64/gzip JSON so the comparison sees real data**, instead of reporting "these two encoded strings differ."

**How to add it:** open the **Decompress** tab, enter the field **path**, and pick the **codec** (`Base64 + JSON`, `Gzip + Base64 + JSON`, or `Plain JSON`).

![The decompress tab](/img/docs/replay/rule-decompress.png)

## Match array elements when order varies

**Compare an unordered array as a set, not by position.** By default arrays are compared by index — when element order changes between record and replay, that produces false "missing / new element" differences.

**How to add it:** open the **Array matching** tab, enter the array **path**, pick a **strategy**, and (for `By key`) enter the **key field(s)**. Click **Add array config**.

![The array matching tab](/img/docs/replay/rule-arrays.png)

| Strategy | When to use |
|---|---|
| By index | Default — compare position by position. |
| By key | Pair elements by a key field (enter the key, e.g. `orderId`). |
| By LCS | Longest common subsequence — best-effort alignment without a key. |

## Apply rules to specific endpoints only

The rules above apply to every endpoint. To add rules for just some endpoints, use the **Per-endpoint** section in an application panel. Click **Add endpoint rules**, enter the endpoints to match — exact names and/or glob patterns like `/api/order/*` — then fill in that group's own rule table.

## Where quick rules from the diff go

When you [ignore a field in a run](/en/testing/review-diffs-in-the-web-ui#ignore-a-field), it writes into one of these rule types:

| Diff action | Becomes |
|---|---|
| Ignore this field's differences | An ignore-by-path rule |
| Ignore all "…" fields | A CEL rule matching that field name |
| Set as array key | An array rule (By key) |

Scoped to an endpoint, it lands in a per-endpoint group; scoped to the whole app, at the top level.

## Related

- [Review diffs in the Web UI](/en/testing/review-diffs-in-the-web-ui) — where these rules come from
- [Policy YAML guide](/en/testing/policy-yaml-guide) — every rule field, in YAML
- [Mock and compare policies](/en/testing/policies#mock-policy)
