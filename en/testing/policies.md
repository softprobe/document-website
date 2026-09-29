---
title: Recording and replay settings
---

# Recording and replay settings

What gets recorded, which dependencies are answered from the recording during replay, which classes need special handling, and which fields are masked when you view them — all of this is set under **Config** in the console's left sidebar, per application. Without any configuration the built-in defaults apply, and recording and replay work out of the box.

| Page | Controls |
|------|----------|
| [Recording](#recording) | Which machines record, how many requests per minute, when, and which endpoints are left out |
| [Replay](#replay) | Which dependencies are answered from the recording and which make real calls; how many requests per second each instance receives |
| [Dynamic classes](#dynamic-classes) | Class methods that need special handling during recording and replay |
| [Diff rules](/en/testing/compare-rules-web-ui)<a id="compare-policy"></a> | Which differences don't count |
| [Redact](#sensitive) | Which fields are masked when you view recordings in the console |

The **Replay**, **Diff rules** and **Redact** pages switch between **Visual** and **YAML**; recording settings and dynamic classes are edited on the page only. YAML fields are described in [Policy YAML reference](/en/testing/policy-yaml-guide); to keep these settings in Git, see [Manage policies in Git](/en/testing/examples/gitops-policies).

Click **Save** and you're done — no restart of the service under test. The agent picks up the change the next time it loads its configuration.

## Recording {#recording}

<a id="recording-policy"></a>

![Recording settings](/img/docs/testing/en/config-recording.png)

### Sampling rules {#sampling-rules}

Which machines record and how much. Rules match machines by environment tag, **top to bottom, and the first match wins**; machines that match no rule use the **Default rule** at the bottom.

Each rule has:

| Setting | Meaning |
|---------|---------|
| Active environments | Matches machines by environment tag, such as `env=prod`; several values separated by commas (`env=fat1,fat2`) match any of them. Set the tag with `-Dsp.tags.env=prod` in the agent's start flags |
| Sample rate (per minute) | Roughly how many entry requests per endpoint each machine records per minute. 0 means machines matching this rule don't record |
| Max recording machines | How many machines in the environment may record at the same time; unlimited by default |
| Recording time window | The weekdays and hours when recording is allowed |

The **Default rule** can't be deleted; by default it records one per minute, all day. To stop machines that match no rule from recording, set its sample rate to 0.

Move rules up or down to change the order: higher rules match first.

::: warning Be careful with a machine limit of 1
With a limit of 1, when the machine holding the slot goes offline the slot may stay taken for a while, and the other machines keep showing that they don't record. Usually leave it unset, or set it to at least the number of instances.
:::

### App-wide settings {#app-wide}

Apply to every machine of the application, regardless of the rules above.

**Coverage packages**: package prefixes of your business code, comma-separated, such as `com.example.order,com.example.payment`. Calls to local caches (`@Cacheable`, Caffeine, Guava) are only recorded under these packages; without them, those cache calls aren't recorded.

### Endpoint filter {#operation-filter}

- **Blacklist** (default): record every endpoint except the ones you select.
- **Whitelist**: record nothing except the ones you select.

The list comes from endpoints already recorded; you can also type an endpoint name and add it. The endpoint filter also limits which endpoints can be chosen for replay.

## Replay {#replay}

<a id="mock-policy"></a>

![Replay settings](/img/docs/testing/en/config-replay.png)

### Dependency mock {#mock}

During replay, whether external dependencies (databases, caches, third-party endpoints …) are answered with the recorded data or call the real service.

- **Default mock**: when on, every dependency is answered from the recording and real services aren't touched; when off, dependencies call the real service by default.
- **Exceptions**: with default mock on, set individual dependencies to make real calls (**Real-request exceptions**); with it off, set individual dependencies to be mocked (**Mock exceptions**). Set them per type (such as all Redis) or per dependency.
- **Mock miss strategy**: what happens when a call has no matching result in the recording. The default, **Mark failed (default, safest)**, is the safest; you can also **Call real service** (may really reach external systems — only in an isolated test environment) or **Return preset response** (an HTTP status code and body).

Calls for system time and random numbers are always answered from the recording; exceptions and the default mock switch don't apply to them.

**Force all dependencies to make real calls for this run**, when ticked in a replay plan, overrides these settings for that run.

### Send rate {#rate}

**Per-instance QPS cap**: the most requests per second each target instance receives during replay; 5 by default, preferably no more than 20. Each target address in a replay plan counts as one instance. A single run can override it under **Advanced options** in the replay plan.

## Dynamic classes {#dynamic-classes}

Some methods return something different every time or depend on the environment: reading the clock, generating random numbers, local caches, encryption. Registered as dynamic classes, their return values are recorded, and during replay the recorded value is returned, so replay follows the same code path as the recording.

Click **Add** and fill in:

| Field | Meaning |
|-------|---------|
| Full class name | Such as `com.example.MyClass` |
| Method | The method name |
| Parameter types | Fully qualified, separated by `@`, such as `java.lang.String@int`; empty means any |
| Key formula | Optional; tells different calls of the same method apart |
| Base class | When ticked, the rule applies to every subclass as well |

System time and random numbers are built in: you don't need to add them, and replay always returns the recorded values.

## Redact {#sensitive}

Masks sensitive fields such as ID numbers and phone numbers when you **view** recordings and comparison results in the console. Redaction only affects what's displayed: the database keeps the full, encrypted payload, because replay needs the original. Storage encryption: [Data protection and retention](/en/testing/installation/data-protection#encryption).

![Redact rules](/img/docs/testing/en/config-sensitive.png)

- **System defaults**: built in, for every application, with a set of field name rules and content rules.
- **App rules**: for the current application only, added on top of the defaults; a rule with the same pattern as a default overrides the default's masking type.

Each rule is a regular expression plus a label (name, phone, email, ID card, passport, generic, or no masking):

- **Field name rules** match JSON field names, such as `(?i)^password$`.
- **Content rules** match field values.

Redaction only works on JSON payloads; payloads longer than about one million characters, or that fail to process, are shown as they are. The system defaults are edited under **Settings → Redact rules**.

## Related {#related}

- [Policy YAML reference](/en/testing/policy-yaml-guide): the YAML fields of every setting
- [sp policy](/en/testing/commands/policy): export, validate and apply settings from the command line
- [Manage policies in Git](/en/testing/examples/gitops-policies)
