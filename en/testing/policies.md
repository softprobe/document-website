---
title: Policies
---

# Policies overview

Softprobe Testing uses **declarative YAML policies** (`apiVersion: softprobe.ai/v1`), merged by `metadata.priority` and applied by sp-boot at runtime.

Separate **how to run each phase** from **policy configuration**:

| Phase | Operations | Policy config |
|-------|------------|---------------|
| **1 · Record** | [How to record](/en/testing/recording) | [RecordingPolicy](#recording-policy) below |
| **2 · Replay** | [Replay and diff](/en/testing/replay-and-diff) | [MockPolicy](#mock-policy), [CompareRulePolicy](#compare-policy) below |

Field reference and full examples: [Policy YAML guide](/en/testing/policy-yaml-guide) · [CLI policies index](/en/cli/policies/)

## CLI quick reference

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
sp policy mock apply -f mock.yaml --json
sp policy compare apply -f compare.yaml --json
```

Higher **`metadata.priority`** wins on conflicts. Built-in priority-0 globals exist; use `priority > 0` on app policies.

## Lifecycle phases

| Phase | Kind | When to configure | CLI |
|-------|------|-------------------|-----|
| **1 · Record** | `RecordingPolicy` | Before traffic | `sp policy recording` |
| **2 · Replay** | `MockPolicy` | Before `sp replay run` | `sp policy mock` |
| **2 · Replay** | `CompareRulePolicy` | Before `sp replay run` | `sp policy compare` |

Full lifecycle: [Getting started](/en/testing/getting-started)

---

## RecordingPolicy {#recording-policy}

**Phase 1 · Before traffic**

Controls **what the agent records**: sampling, time window, operation include/exclude, serialize skip, record-time time mock.

- **Sampling** — `ratePerHundredSeconds` (`0` = no record), optional `machineCountLimit` (omit = unlimited)
- **Time window** — `daysOfWeek`, `from` / `to` (agent JVM local timezone)
- **Operations** — `exclude` globs; non-empty `include` switches to whitelist mode
- **Serialize skip** — `serializeSkip` by class and field names
- **`timeMock`** — fix `java.time.*` at record time

**Operational steps:** [How to record](/en/testing/recording)

**YAML fields and examples:** [Policy YAML guide · RecordingPolicy](/en/testing/policy-yaml-guide#recordingpolicy)

::: info Notes
- `spec.sensitiveData` is **not** applied on the agent record path yet; use `matchTolerance` for mock-key noise and `SensitivePolicy` for view-time masking (see YAML guide).
- Changing `operations` include/exclude updates **replay schedule** operation scope without a separate schedule edit.
:::

```bash
sp policy recording validate -f my-recording.yaml --json
```

---

## MockPolicy {#mock-policy}

**Phase 2 · Before replay**

Controls **whether dependencies are mocked** at replay, mock-key tolerance, cross-app dependencies, and fallback when no mock matches.

- **`mockByDefault`** — mock all deps by default (`skipMock` exceptions), or the inverse with `forceMock`
- **`Category:operationGlob`** — e.g. `HttpClient:/payment/**` (**not** entry types like `Servlet`)
- **`matchTolerance`** — ignore volatile headers, query params, body paths
- **`multiServiceDependencies`** — mock downstream apps from the same session
- **`fallback`** — `FAIL` (default), `PASS_THROUGH`, `RETURN_DEFAULT`

Global defaults **force-mock** `DynamicClass:SystemTime.**` and `RandomSource.**`; user `skipMock` has no effect.

**YAML fields and examples:** [Policy YAML guide · MockPolicy](/en/testing/policy-yaml-guide#mockpolicy)

[Full dependency category list](/en/testing/policy-yaml-guide#dependency-categories)

---

## CompareRulePolicy {#compare-policy}

**Phase 2 · Before replay**

Controls **diff noise** during replay comparison (not mock behavior).

- **`excludePaths` / `includePaths`** — JSON Pointer (with globs)
- **`defaults.timeToleranceMs`** and CEL **`validations`** — drop diffs by rule (including per-`category` rules)
- **`operationSpecs`** — per-entry-operation overlays (**do not** put operation names on `selector`)

**YAML fields and examples:** [Policy YAML guide · CompareRulePolicy](/en/testing/policy-yaml-guide#comparerulepolicy)

Use `sp replay diff` after replay, then tighten policy rather than changing application code.

---

## Dynamic classes (not RecordingPolicy)

Register methods in **dynamic class configuration** (dashboard/API), not in `RecordingPolicy`. Control replay mocking via **MockPolicy** `UserDynamic` / `DynamicClass` rules. See [Policy YAML guide · Related configuration](/en/testing/policy-yaml-guide#related-configuration).

## Related

- [How to record](/en/testing/recording)
- [Replay and diff](/en/testing/replay-and-diff)
- [Policy YAML guide](/en/testing/policy-yaml-guide)
- [CLI: policy command](/en/cli/commands/policy)
