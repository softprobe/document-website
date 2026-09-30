---
title: Recordings
---

# Recordings

Once the agent is attached, the service's requests are recorded automatically according to the sampling rules: the entry request and response, plus every call made to databases, caches and downstream endpoints while handling it. These recordings are the cases that replays use. This page covers browsing recordings in the console, and what to check when nothing is recorded.

No service attached yet? See [Your first record and replay](/en/testing/getting-started) or [Attach the Java agent](/en/testing/java-agent).

## How much is recorded {#sampling}

Recording is sampled, not exhaustive: by default **about one entry request per minute, per service instance, per endpoint**. Each recorded entry request brings along every dependency call it triggered. Health-check requests aren't recorded by default.

To record more or less, only at certain times or in certain environments, or to leave out some endpoints, change **Config → Recording**; see [Recording and replay settings](/en/testing/policies#recording). No restart is needed: the agent picks up the change the next time it loads its configuration.

Recordings are deleted automatically when they pass the retention period, which you set under **Settings → Data retention**. To keep a recording for good, [pin it](/en/testing/pinned-cases).

## By endpoint {#by-endpoint}

Select the application at the top and open **Recordings → Rolling recordings**.

![Rolling recordings, summed per endpoint](/img/docs/testing/en/recording-overview.png)

The top shows how many recordings and active endpoints there are in the period. The list sums recordings per endpoint:

- **With recordings**: by default only endpoints with recordings in the period are listed; turn it off to see all.
- **Time range**: last 7 days by default.
- **Tags** and **Category**: filter by endpoint tag (such as read or write endpoints) or category (such as Servlet or Dubbo).
- **Search**: by endpoint name, description or tag.

Hover over an endpoint to **Add description** (one sentence on what it does; Enter saves) or **Add tag**. Descriptions and tags can also be searched and filtered when you pick endpoints for a replay plan.

## Recordings of one endpoint {#by-case}

Click an endpoint to list its recordings with trace ID and time. Each row has four actions:

| Action | What it does |
|--------|--------------|
| View trace recording | Opens the call chain of this recording |
| Copy traceId | Copies the trace ID, for log lookups or command-line queries |
| AI diagnose | Asks AI to analyse this recording |
| Delete this recording | Deletes this one |

**Delete endpoint recordings** at the top right deletes all recordings of the endpoint.

![Viewing recorded data](/img/docs/testing/en/view-recorded-data.gif)

## A recording's call chain {#trace}

The recording detail lists every step of the request in call order: the entry (such as `SERVLET /order/price`) and the databases, Redis, HTTP downstreams, dynamic classes and so on it called. Each step expands to show the request and response. **Recording complete** at the top means all of the request's calls were captured.

![The call chain of one recording](/img/docs/testing/en/recording-trace.png)

Buttons at the top right:

| Button | What it does |
|--------|--------------|
| Pin | Keeps this recording for good; see [Pinned cases](/en/testing/pinned-cases) |
| Replay this one | Creates a replay plan with just this recording |
| AI diagnose | Asks AI to analyse this recording |
| Delete this recording | Deletes it |

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

Above the call chain you can search spans by name, category or service.

</Interface>
<Interface id="cli">

```bash
sp record case list --app <appId> --since -1h --json          # recordings from the last hour
sp record query --trace-id <traceId> --out-dir .sp-work --json  # full data of one recording
sp record completeness <traceId> --json                         # whether it is complete
```

</Interface>
</InterfaceTabs>

## Nothing recorded? {#troubleshooting}

| Symptom | Check first |
|---------|-------------|
| The application isn't **Agent online** in Applications | The agent didn't start or can't reach the backend: look for lines starting with `[SoftProbe]` in the service's startup output, and make sure the `-Dsp.api.url` address is reachable. See [Attach the Java agent](/en/testing/java-agent) |
| Online, but no recordings at all | In **Config → Recording**: whether the rule that matches this machine has a sample rate of 0, whether you're outside the recording time window, whether the endpoint is excluded, and whether **Max recording machines** is already used up by other instances |
| Fewer recordings than expected | The default is about one per endpoint per minute; raise the sample rate |
| One endpoint never shows up | Whether it's excluded under **Endpoint filter**, and whether its entry framework is supported ([Supported frameworks](/en/testing/supported-frameworks)) |
| A kind of dependency call is missing | Whether that client is supported; local caches (@Cacheable, Caffeine, Guava) are only recorded after you set **Coverage packages** in **Config → Recording** |

## Keep recording and replay environments apart {#separate-environments}

| Environment | Recording | Why |
|-------------|-----------|-----|
| Production, staging | On | Collect real traffic as cases |
| Test, replay targets | Off or very low | Don't record the replayed requests all over again |

When several environments share one application, tag each environment's instances (for example `-Dsp.tags.env=prod`) and give each environment its own sampling rule under **Config → Recording**. Replay plans can also filter cases by tag.

## Next {#next}

- [Pinned cases](/en/testing/pinned-cases): keep important recordings
- [Run and schedule replays](/en/testing/replay-and-diff)
