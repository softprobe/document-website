---
title: Attach the Java agent
---

<script setup>
import { onMounted, ref } from 'vue'

const agentVersions = ref([])
const agentVersionError = ref('')

onMounted(async () => {
  try {
    const response = await fetch('https://install.softprobe.ai/artifacts/agent/versions.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = await response.json()
    agentVersions.value = Array.isArray(body.versions) ? body.versions : []
  } catch {
    agentVersionError.value = 'Version list is temporarily unavailable.'
  }
})
</script>

# Attach the Java agent

The SoftProbe Java agent is a jar file (`sp-agent.jar`) that starts with the service under test through the `-javaagent` flag. During recording it captures entry requests and dependency calls; during replay it answers dependency calls from the recording. Attaching it doesn't change your code: you add start-up flags and restart the service once.

::: info Not the mesh agent
Istio/Envoy-based capture for business observability is covered in [Platform agent architecture](/en/platform/advanced-guides/agent-architecture) and is unrelated to this page.
:::

## Before you start {#prerequisites}

- JDK 8, 11, 17 or 21. Framework support: [Supported Java versions and frameworks](/en/testing/supported-frameworks).
- The service's host can reach the SoftProbe backend (port `8090` on the platform server for a single-server install).
- About 512 MB of memory headroom for the service; the agent shares the JVM's memory.
- You can change start-up flags and restart the service. In production, book a window through your change process first.

## Get the agent {#download}

**Self-hosted**: the platform serves the agent. Download it on the application server:

```bash
curl -fL -o sp-agent.jar http://<platform address>:8090/api/agent/sp-agent.jar
```

You can also download it from the wizard under **Applications → Connect new application** in the console.

**With internet access**, you can also download it from SoftProbe:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

`latest` always points at the newest release. In production, pin a version by replacing `latest`:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

Available versions:

<ul v-if="agentVersions.length">
  <li v-for="version in agentVersions" :key="version">
    <a :href="`https://install.softprobe.ai/artifacts/agent/${version}/sp-agent.jar`">{{ version }}</a>
  </li>
</ul>
<p v-else-if="agentVersionError">{{ agentVersionError }}</p>
<p v-else>Loading versions...</p>

The same list for scripts: `curl -fsSL https://install.softprobe.ai/artifacts/agent/versions.json`.

## Start-up flags {#startup-command}

Add these to the service's start command:

```bash
java \
  -javaagent:/opt/softprobe/sp-agent.jar \
  -Dsp.app.id=order-service \
  -Dsp.api.url=http://10.0.0.5:8090 \
  -jar order-service.jar
```

| Flag | Notes |
|------|-------|
| `-javaagent` | Path to `sp-agent.jar` |
| `-Dsp.app.id` | Application ID. Pick a stable name and use it on every instance of the service, in both the recording and the replay environment. An ID the backend hasn't seen is registered automatically when the agent first loads its configuration; see [Concepts and IDs](/en/testing/agents/concepts#application-appid) |
| `-Dsp.api.url` | Backend URL, including `http://` or `https://`. Recording, replay and log upload all use it |

The backend URL is looked up in this order: `-Dsp.api.url`, the `SP_API_URL` environment variable, then `sp.api.url` built into the jar. If none is found, the agent reports that it failed to start and neither records nor replays; the service runs as usual. Always set `-Dsp.api.url` explicitly.

::: details The old sp.api.service.host flag
The agent source now converts the old `-Dsp.api.service.host` flag into `sp.api.url` when neither `-Dsp.api.url` nor `SP_API_URL` is set, but that change isn't released yet (as of 4.3.36). Use `sp.api.url`.
:::

### JDK 17 and 21 {#jdk17}

From JDK 16, reflective access to JDK internals is denied by default, so JDK 17 and 21 need these flags as well. JDK 8 doesn't; JDK 11 runs without them and only prints warnings.

```bash
--add-opens java.base/java.lang=ALL-UNNAMED
--add-opens java.base/java.lang.reflect=ALL-UNNAMED
--add-opens java.base/java.util=ALL-UNNAMED
--add-opens java.base/java.util.concurrent=ALL-UNNAMED
--add-opens java.base/java.math=ALL-UNNAMED
--add-opens java.base/java.net=ALL-UNNAMED
--add-opens java.base/java.time=ALL-UNNAMED
--add-opens java.base/sun.net.util=ALL-UNNAMED
--add-opens java.base/jdk.internal.loader=ALL-UNNAMED
--add-opens java.xml/com.sun.org.apache.xerces.internal.jaxp.datatype=ALL-UNNAMED
```

Without the `java.lang` line, the agent fails with an error at start-up. Without the others, the service starts normally but some recording and replay features stop working without any warning (for example, downstream HTTP status codes come out wrong during replay, or some collection types fail to serialize). Add the whole set.

### Tomcat and other application servers {#app-server}

Add the flags to the application server's JVM options, for example in Tomcat's `bin/setenv.sh`:

```bash
CATALINA_OPTS="$CATALINA_OPTS -javaagent:/opt/softprobe/sp-agent.jar -Dsp.app.id=order-service -Dsp.api.url=http://10.0.0.5:8090"
```

WebLogic, TongWeb and others each have their own place for JVM options. The `JAVA_TOOL_OPTIONS` environment variable also works, but it applies to every Java process on the machine, so make sure it doesn't reach unrelated programs.

### Containers and Kubernetes {#container}

Put `sp-agent.jar` in the image or mount it into the container, and pass the flags with `JAVA_TOOL_OPTIONS` or the start command:

```yaml
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-javaagent:/opt/softprobe/sp-agent.jar -Dsp.app.id=order-service -Dsp.api.url=http://10.0.0.5:8090"
```

## Check that it's connected {#verify}

1. The service's start-up log has lines starting with `[SoftProbe]` and no errors.
2. The application appears under **Applications** in the console with **Agent online**. From the command line: `sp app status order-service --json` returns `online`.
3. Send the service a few requests. By default about one request per endpoint per minute is recorded; after a minute or two, open **Recordings → Rolling recordings** and look for that endpoint.
4. Open a recording: besides the entry call, the call chain shows database, cache and downstream calls. If a kind of call is missing, see [Recordings — Nothing recorded?](/en/testing/recording#troubleshooting).

Statuses under **Applications**:

| Status | Meaning |
|--------|---------|
| Agent online | At least one instance sent a heartbeat in the last 60 seconds |
| Agent throttled | Online, but at least one instance is rate-limited or degraded; see [Protecting production](#production-safety) |
| Agent offline | Instances are on record, but none has sent a heartbeat for 60 seconds |
| Never connected | No current instance record. Records expire about 3 minutes after the last heartbeat, so an application whose agent stopped long ago also shows this |

## Environment tags {#environment-tags}

When several environments share one application ID, tag each environment's instances:

```bash
-Dsp.tags.env=prod
```

Each `-Dsp.tags.<key>=<value>` adds one tag; add as many as you need (for example `-Dsp.tags.region=east` as well). Recordings carry these tags: under **Recording** you can give each environment its own sampling rules, and when creating a replay plan you can filter cases by tag. Don't set `sp.mocker.tags` yourself: the agent builds it from `sp.tags.*` and overwrites your value.

## Agent on the replay environment {#replay-side-agent}

The test instances that receive replay requests need the same agent with the same application ID: during replay it answers dependency calls from the recording. Turn recording off or down to a minimum there, so replayed requests aren't recorded again.

## Remove the agent {#remove}

1. Take `-javaagent`, the `-Dsp.*` flags and the `--add-opens` flags you added for the agent out of the start-up flags, and restart. The service is back to how it was before.
2. Delete `sp-agent.jar`, the `logs` directory next to it, and the `sp` directory under the system temp directory.

The agent doesn't modify any of the service's files and leaves no resident process on the server.

## Protecting production {#production-safety}

A background thread uploads recorded data, so business requests don't wait for the network. When uploads can't keep up or the backend has problems, the agent records less and slows down rather than holding up requests.

### When the recording queue is full {#queue-overflow}

1. Recorded data goes into a bounded in-memory ring buffer: 2048 slots by default, holding up to 2047 batches (a batch is one group of recorded calls handed to the uploader). `-Dsp.buffer.size` can raise it; smaller values still get 2048.
2. When the buffer is full, the new batch is dropped and its case is marked invalid, and the agent switches to **fast-reject**: new recordings are dropped, apart from about one probe per second.
3. After 30 seconds it leaves fast-reject and records again, at a lower rate.
4. It checks after 5 minutes, then every 10 minutes, whether uploads keep up: the check passes when nothing was queued in the period, or when fewer than 3 batches were rejected and at least 99% of batches waited in the queue for no more than 3 seconds. If it passes, the configured rate is restored; if not, the rate is lowered again.

Each reduction takes the current rate of each interface, caps it at 20 per minute and uses 80% of that, but never goes below 0.03 per minute (about once every 33 minutes). For example, 100 per minute becomes 16.

When the queue is full, the agent drops the current batch instead of waiting for space.

### When the backend fails {#storage-health}

1. If sending recorded data fails 10 times in a row, or more than 80% of at least 30 sends within 10 seconds fail, the agent switches to fast-reject.
2. After 5 seconds it lowers the sampling rate, checks after 3 minutes, then every 10 minutes, lowering the rate again each time until the backend recovers.
3. If the agent can't load its configuration from the backend, it stops recording until the configuration loads again.

High CPU or memory on the host also switches the agent to fast-reject and lowers the rate, until usage drops.

## Advanced flags {#advanced}

### Running alongside other agents {#coexistence}

If SoftProbe conflicts with another `-javaagent` such as OpenTelemetry, tell it to skip that agent's classes:

```bash
-Dsp.ignore.type.prefixes=io.opentelemetry
-Dsp.ignore.classloader.prefixes=io.opentelemetry
```

Separate several prefixes with commas.

### Debug logging {#debug}

```bash
-Dsp.enable.debug=true
```

Remove it when you're done; debug logging is very verbose.

### Send logs straight to Vector {#vector}

By default the agent's logs go through the backend (`{sp.api.url}/v1/logs`) to the log pipeline, with nothing extra to configure. To bypass the backend and send them to Vector directly:

```bash
-Dsp.otel.exporter.otlp.log.endpoint=http://<vector-host>:4320/v1/logs
```

It doesn't replace `-Dsp.api.url`: without a backend URL the agent still won't start.

### Execution-path deduplication {#execution-path-dedup}

By default, recordings of an endpoint are kept according to sampling, and identical requests are each recorded. With execution-path deduplication on, the agent records which methods and branches each request actually ran within the packages you list, and the backend keeps one case per distinct execution path for each application and endpoint: later requests along the same path are dropped, and requests that take a new path are kept.

It's on only when both flags are set:

```bash
-Dsp.dedup.enabled=true
-Dsp.coverage.packages=com.example.orders,com.example.payments
```

- `sp.dedup.enabled`: the switch, `false` by default.
- `sp.coverage.packages`: package prefixes of your business code whose execution paths are recorded, comma-separated. Empty means off.

Duplicates are judged by execution path, not by request content: different inputs that take the same path count as duplicates, and identical inputs that hit different branches are kept separately. Requests carrying `sp-force-record` bypass deduplication. The flags are read when the JVM starts, so restart the service after changing them.

### Configuration built into the jar {#agent-conf}

`META-INF/sp/sp.agent.conf` inside the jar can carry a built-in backend URL:

```properties
sp.api.url=http://10.0.0.5:8090
```

It has lower priority than `-Dsp.api.url` and the `SP_API_URL` environment variable.

## Next {#next}

- [Recordings](/en/testing/recording)
- [Your first record and replay](/en/testing/getting-started)
