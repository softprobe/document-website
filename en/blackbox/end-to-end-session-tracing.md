---
title: End-to-end session tracing with payloads
---

# End-to-end session tracing with payloads

Trace a complete user journey across a browser frontend, an AI agent server, a Java backend, and PostgreSQL into one correlated Session with HTTP request and response payloads in [Softprobe Explorer](https://explorer.softprobe.ai).

The [Travel OTA demo (`softprobe/demo-ota`)](https://github.com/softprobe/demo-ota) keeps its application source uninstrumented on `main`. Pre-instrumented single-container images (`docker.io/softprobe/demo-ota:<flavor>-blackbox`) layer Softprobe browser recording, Node.js or Python agent telemetry, and OpenTelemetry eBPF Instrumentation (OBI) onto the plain app images so you can start the full stack in one `docker run` command without manual SDK setup.

## Architecture and instrumentation seams

Inside the container, Nginx listens on port `8080`, serves the chat web app (`travel-web`) at `/agent`, and proxies `/agent/api/*` to the AI agent server (`travel-agent` on `127.0.0.1:4311`), which calls the Spring Boot service (`travel-ota` on `127.0.0.1:8081`), PostgreSQL (`127.0.0.1:5432`), payment and notification sandboxes (`127.0.0.1:8082` and `127.0.0.1:8083`), and the external airline NDC API:

<div class="sp-arch-diagram" role="img" aria-label="Travel OTA single-container demo architecture with three traced tiers: Web App in Browser JS, AI Agent Server in Node.js or Python, and Java Backend in Spring Boot with PostgreSQL.">
  <div class="sp-arch-flow">
    <div class="sp-arch-card">
      <div class="sp-arch-card-head">
        <span class="sp-arch-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <circle cx="6.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="9.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span class="sp-arch-port">:8080/agent</span>
      </div>
      <div class="sp-arch-title">1. Web App</div>
      <div class="sp-arch-runtime">Browser JS</div>
      <div class="sp-arch-desc">Chat UI in the user's browser</div>
      <div class="sp-arch-badges" aria-label="Instrumentation">
        <span class="sp-inst-badge sp-inst-sdk">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="3" fill="currentColor" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2" />
          </svg>
          @softprobe/web-record
        </span>
      </div>
    </div>
    <div class="sp-arch-arrow" aria-hidden="true">
      <span class="sp-arch-arrow-label">HTTP</span>
      <svg viewBox="0 0 48 16" fill="none">
        <line x1="2" y1="8" x2="40" y2="8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        <path d="M35 3.5L41 8L35 12.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="sp-arch-card">
      <div class="sp-arch-card-head">
        <span class="sp-arch-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M12 12l8-4.5" />
            <path d="M12 12v9" />
            <path d="M12 12L4 7.5" />
          </svg>
        </span>
        <span class="sp-arch-port">:4311</span>
      </div>
      <div class="sp-arch-title">2. AI Agent Server</div>
      <div class="sp-arch-runtime">Node.js or Python</div>
      <div class="sp-arch-desc">Runs Vercel AI, LangGraph, or Google ADK tool calls</div>
      <div class="sp-arch-badges" aria-label="Instrumentation">
        <span class="sp-inst-badge sp-inst-sdk">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="3" fill="currentColor" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2" />
          </svg>
          softprobe-js / softprobe-py
        </span>
      </div>
    </div>
    <div class="sp-arch-arrow" aria-hidden="true">
      <span class="sp-arch-arrow-label">HTTP</span>
      <svg viewBox="0 0 48 16" fill="none">
        <line x1="2" y1="8" x2="40" y2="8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
        <path d="M35 3.5L41 8L35 12.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="sp-arch-card">
      <div class="sp-arch-card-head">
        <span class="sp-arch-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="6" rx="2" />
            <rect x="3" y="14" width="18" height="6" rx="2" />
            <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
            <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span class="sp-arch-port">:8081</span>
      </div>
      <div class="sp-arch-title">3. Java Backend</div>
      <div class="sp-arch-runtime">Spring Boot + PostgreSQL</div>
      <div class="sp-arch-desc">Handles flight search, policy holds, SQL, and payment</div>
      <div class="sp-arch-badges" aria-label="Instrumentation">
        <span class="sp-inst-badge sp-inst-ebpf">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M9 1.5L3.5 9H8L7 14.5L12.5 7H8L9 1.5Z" fill="currentColor" />
          </svg>
          OBI (eBPF)
        </span>
      </div>
    </div>
  </div>
  <div class="sp-arch-legend">
    <span class="sp-arch-legend-item">
      <span class="sp-inst-dot sp-inst-dot-sdk"></span>
      <strong>SDK Instrumentation</strong>: JS and Python packages for DOM replay, semantic UI actions, browser HTTP, and AI agent turns
    </span>
    <span class="sp-arch-legend-item">
      <span class="sp-inst-dot sp-inst-dot-ebpf"></span>
      <strong>OBI (eBPF)</strong>: Zero-code Linux kernel capture for Java HTTP bodies and PostgreSQL queries, with automatic OpenTelemetry Java agent fallback when eBPF is unavailable
    </span>
  </div>
</div>

All three tiers export telemetry using the same Ingestion Key (`spk_...`) and join into a single Session through `gen_ai.conversation.id`, `session.id`, and the W3C `traceparent` header. Each tier uses a distinct OpenTelemetry `service.name` (`travel-web`, `travel-agent`, `travel-ota`) so Explorer's **Graph** and **Span Detail** separate every service, database query, and outbound HTTP peer.

## Choose a published container flavor

`docker.io/softprobe/demo-ota` publishes both pre-instrumented `-blackbox` images and plain uninstrumented images:

| Pre-instrumented tag | Plain app tag | Included stack on `:8080` |
|----------------------|---------------|---------------------------|
| `vercel-ai-blackbox` (also `blackbox`) | `vercel-ai` (also `latest`) | Classic web app at `/`, chat web app at `/agent`, Node.js Vercel AI agent, Spring Boot Java 21 backend, PostgreSQL, and payment and notification sandboxes |
| `langgraph-py-blackbox` | `langgraph-py` | Same web apps and Java backend, powered by a Python LangGraph agent |
| `google-adk-py-blackbox` | `google-adk-py` | Same web apps and Java backend, powered by a Python Google ADK agent |
| `classic-blackbox` | `classic` | Traditional multi-page flight booking web app at `/` plus the Java backend, PostgreSQL, and sandboxes, used in the [UI Testing tutorial](/en/ui-testing/tutorial) |
| Not applicable | `java` | Headless Java backend, PostgreSQL, and sandboxes without static frontend assets |

## Run the demo in one Docker command

You need Docker, a [Softprobe Explorer](https://explorer.softprobe.ai) workspace, and a Google Gemini API key. Use only synthetic travel details in this demo.

### 1. Create an Agent in Explorer

In [Explorer](https://explorer.softprobe.ai), open **Agents** and click **+ Connect agent**. Name the Agent `travel-ota-demo`, choose **Vercel AI**, set the environment to **demo**, and copy its Ingestion Key (`spk_...`).

### 2. Start the pre-instrumented container

```sh
export INGESTION_KEY="spk_REPLACE_WITH_INGESTION_KEY"
export GOOGLE_GENERATIVE_AI_API_KEY="YOUR_GEMINI_API_KEY"

docker run --rm --privileged -p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	-e GOOGLE_GENERATIVE_AI_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY" \
	docker.io/softprobe/demo-ota:vercel-ai-blackbox
```

To try Python LangGraph or Google ADK instead of Vercel AI, replace `vercel-ai-blackbox` with `langgraph-py-blackbox` or `google-adk-py-blackbox`.

If you run [self-hosted Explorer](/en/blackbox/self-hosting) on Linux (`http://127.0.0.1:8787`), replace `-p 8080:8080` with `--network host -e OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://127.0.0.1:8787/api/thelake/v1/traces"` so both your host browser and the container export to `http://127.0.0.1:8787`. On Linux hosts `--privileged` enables zero-code OBI eBPF capture for Java HTTP payloads and PostgreSQL queries. On macOS or unprivileged runtimes where kernel `tracefs` is unavailable, the entrypoint falls back automatically to the bundled OpenTelemetry Java agent.

### 3. Run a journey and inspect the Session Graph

Open [`http://127.0.0.1:8080/agent`](http://127.0.0.1:8080/agent), confirm your selected Gemini model, and complete a synthetic search, booking, and ticket-issuance flow:

1. Search for a flight:
   ```text
   Find a one-way economy flight from LHR to CDG for next Tuesday.
   ```
2. Click **Choose** on an offer in **Flight & fare choices**, reply `Alex Demo` when prompted for the traveler name, and click **Confirm booking** when the review card appears.
3. Click **Pay ... and issue ticket** in the trip panel.

In [Softprobe Explorer](https://explorer.softprobe.ai), open **Sessions**, filter for `travel-ota-demo`, and open the newest Session. Switch to **Graph** and click nodes to inspect **Span Detail** across all three tiers:

- **Web app (`travel-web`).** RRWeb DOM replay, semantic `softprobe.ui.action` spans, and browser `POST` client spans with `url.template` route patterns and redacted JSON payloads.
- **AI agent server (`travel-agent`).** `invoke_agent` root spans, `chat` generation spans, and `execute_tool` spans (`travel_search`, `travel_prepare`, `travel_book`, `travel_order`) linked by `gen_ai.conversation.id`.
- **Java backend (`travel-ota`).** Inbound `/api/bookings/sessions/*` server spans, `SELECT`, `INSERT`, and `UPDATE` PostgreSQL spans against `ota_booking_sessions` and `ota_orders`, plus outbound `POST` client spans to `/ndc/v21.3/*`, `/v1/payments/authorize` (with `[REDACTED]` `cardNumber` and `cvv`), and `/v1/notifications/confirmation`.

Press `Ctrl+C` in your terminal when finished.

## How each tier is instrumented

The [`docker/blackbox/`](https://github.com/softprobe/demo-ota/tree/main/docker/blackbox) directory in `softprobe/demo-ota` wires all three tiers onto the plain flavor images without modifying any file under `apps/`, `agents/`, or `services/`:

### Browser (`@softprobe/web-record`)

[`docker/blackbox/10-blackbox.sh`](https://github.com/softprobe/demo-ota/blob/main/docker/blackbox/10-blackbox.sh) generates `/__softprobe/ota-init.js` and `/__softprobe/chat-init.js` at container startup and injects `<script src="/__softprobe/web-record.js"></script><script src="/__softprobe/chat-init.js"></script>` into HTML responses through Nginx `sub_filter`:

- Sets `serviceName: "travel-web"` (and `travel-ota-web` on `/`), enables `captureSemanticActions: true` and `inputCapture: "secrets-only"`, and exports OTLP traces and rrweb DOM recordings.
- Configures [`httpBodyCapture.routes`](/en/blackbox/reference/softprobe-js#httpbodycaptureoptions-and-httpbodycaptureroute) with wildcard `*` segments to trace business `POST` calls while skipping background `GET` polling.
- Captures JSON bodies up to 64 KiB and replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` with `[REDACTED]`.
- Adopts `ses_*` session IDs automatically from `/agent/api/sessions` responses and `sessionStorage`.

See [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) and [`WebRecordInitOptions`](/en/blackbox/reference/softprobe-js#webrecordinitoptions) for every option.

### AI agent server (`@softprobe/vercel-ai-sdk` and `softprobe-py`)

In `vercel-ai-blackbox`, [`docker/blackbox/init-vercel-ai.mjs`](https://github.com/softprobe/demo-ota/blob/main/docker/blackbox/init-vercel-ai.mjs) runs via `NODE_OPTIONS="--import /opt/softprobe/node/init-vercel-ai.mjs"` before `agents/vercel-ai/server.mjs` starts:

```js
import { context } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { initVercelAiTelemetry } from "@softprobe/vercel-ai-sdk";

context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());

initVercelAiTelemetry({
	serviceName: process.env.SOFTPROBE_AI_SERVICE_NAME || "travel-agent",
	useSimpleProcessor: true,
});
```

In `langgraph-py-blackbox` and `google-adk-py-blackbox`, [`docker/blackbox/sitecustomize.py`](https://github.com/softprobe/demo-ota/blob/main/docker/blackbox/sitecustomize.py) loads via `PYTHONPATH=/opt/softprobe/python`, attaches `SoftprobeClient.from_env(service_name="travel-agent", use_simple_processor=True)` and `softprobe.langchain.CallbackHandler`, and propagates W3C `traceparent` and `baggage` (`session.id` and `sp.session.id`) headers to `travel-ota`.

### Java backend (OpenTelemetry OBI)

[`docker/Dockerfile.classic-blackbox`](https://github.com/softprobe/demo-ota/blob/main/docker/Dockerfile.classic-blackbox) and the AI `-blackbox` Dockerfiles install official OpenTelemetry OBI `v1.0.0` inside the container. [`docker/blackbox/20-obi-post-start.sh`](https://github.com/softprobe/demo-ota/blob/main/docker/blackbox/20-obi-post-start.sh) renders [`docker/blackbox/obi.yaml.template`](https://github.com/softprobe/demo-ota/blob/main/docker/blackbox/obi.yaml.template), selects the `app.jar` Java process (`OTEL_SERVICE_NAME=travel-ota`), propagates W3C `headers`, enables PostgreSQL query capture, redacts `cardNumber` and `cvv` on payment routes, and extracts JSON bodies for `/api/flights/*`, `/api/bookings/*`, `/v1/payments/*`, `/v1/notifications/*`, and `/ndc/v21.3/*`.

See the [OBI distributed traces guide](https://opentelemetry.io/docs/zero-code/obi/distributed-traces/) and [Config v2 reference](https://opentelemetry.io/docs/zero-code/obi/configure/config-v2/) for Linux kernel and container deployment details.

## Use your own app

To apply this pattern to your own stack, assign a distinct OpenTelemetry `service.name` to each tier:

1. **Web app.** For bundled apps (Vite, Next.js, Webpack), install [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) and call [`RecordSdk.init`](/en/blackbox/reference/softprobe-js#recordsdk-init-options) with `ingestionKey` and `serviceName`. For plain HTML pages without a bundler, load `web-record.js` before your app script, call `window.RecordSdk.init(...)`, and allow your OTLP endpoint origin in `connect-src`. Use [`httpBodyCapture`](/en/blackbox/reference/softprobe-js#httpbodycaptureoptions-and-httpbodycaptureroute) to scope routes or add `redactJsonPaths`.
2. **AI agent server.** Install [`@softprobe/vercel-ai-sdk`](/en/blackbox/reference/softprobe-js#softprobe-vercel-ai-sdk) and [`@softprobe/tracing`](/en/blackbox/reference/softprobe-js#softprobe-tracing), then call [`initVercelAiTelemetry`](/en/blackbox/reference/softprobe-js#initvercelaitelemetry-options) at server startup. For Python, OpenAI, LangChain, LangGraph, Google ADK, OpenCode, or standard OpenTelemetry GenAI (`gen_ai.*`), see the [Python SDK (`softprobe-py`)](/en/blackbox/reference/softprobe-py) and [JavaScript and TypeScript SDK (`softprobe-js`)](/en/blackbox/reference/softprobe-js) references.
3. **Backend services.** Set `OTEL_SERVICE_NAME` on each backend process or Kubernetes workload and run OBI with your process selector (`cmd_args_glob` or `open_ports`) and `url_path_patterns` allowlist.

## API references

- [JavaScript and TypeScript SDK (`softprobe-js`)](/en/blackbox/reference/softprobe-js) for [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record), [`@softprobe/vercel-ai-sdk`](/en/blackbox/reference/softprobe-js#softprobe-vercel-ai-sdk), and [`@softprobe/tracing`](/en/blackbox/reference/softprobe-js#softprobe-tracing)
- [Python SDK (`softprobe-py`)](/en/blackbox/reference/softprobe-py) for `SoftprobeClient`, `observe_openai`, `softprobe.langchain`, and `softprobe.propagation`
- [Vercel AI SDK guide](/en/blackbox/vercel-ai-sdk)
- [OBI Config v2 reference](https://opentelemetry.io/docs/zero-code/obi/configure/config-v2/)

<style scoped>
.sp-arch-diagram {
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 14px;
  border: 1px solid var(--sp-border);
  background: var(--sp-surface);
}

.sp-arch-flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: stretch;
  gap: 0.75rem;
}

.sp-arch-card {
  display: flex;
  flex-direction: column;
  padding: 1.15rem 1.15rem 1rem;
  border-radius: 11px;
  border: 1px solid var(--sp-border);
  background: var(--sp-canvas);
  box-shadow: 0 2px 8px rgba(37, 31, 25, 0.04);
}

.sp-arch-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.sp-arch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--vp-c-brand-soft);
  color: var(--sp-brand);
}

.sp-arch-icon svg {
  width: 20px;
  height: 20px;
}

.sp-arch-port {
  font-family: var(--sp-font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--sp-muted);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--sp-border);
  background: var(--sp-surface);
}

.sp-arch-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--sp-ink);
  line-height: 1.3;
}

.sp-arch-runtime {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--sp-brand);
  margin-top: 0.15rem;
}

.sp-arch-desc {
  font-size: 0.84rem;
  color: var(--sp-body);
  line-height: 1.45;
  margin: 0.45rem 0 0.9rem;
}

.sp-arch-badges {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--sp-border);
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sp-inst-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.55rem;
  border-radius: 6px;
  font-family: var(--sp-font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.3;
}

.sp-inst-badge svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.sp-inst-sdk {
  background: rgba(184, 114, 78, 0.14);
  color: var(--sp-brand-dark);
  border: 1px solid rgba(184, 114, 78, 0.32);
}

.dark .sp-inst-sdk {
  color: var(--sp-brand-light);
}

.sp-inst-ebpf {
  background: rgba(45, 122, 118, 0.12);
  color: #21635f;
  border: 1px solid rgba(45, 122, 118, 0.3);
}

.dark .sp-inst-ebpf {
  background: rgba(78, 178, 172, 0.15);
  color: #79d2cc;
  border-color: rgba(78, 178, 172, 0.32);
}

.sp-arch-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--sp-muted);
  padding: 0 0.15rem;
}

.sp-arch-arrow-label {
  font-family: var(--sp-font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--sp-muted);
  margin-bottom: 0.15rem;
}

.sp-arch-arrow svg {
  width: 38px;
  height: 14px;
}

.sp-arch-legend {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--sp-border);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  font-size: 0.8rem;
  color: var(--sp-body);
}

.sp-arch-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.sp-inst-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sp-inst-dot-sdk {
  background: var(--sp-brand);
}

.sp-inst-dot-ebpf {
  background: #2d7a76;
}

.dark .sp-inst-dot-ebpf {
  background: #79d2cc;
}

@media (max-width: 820px) {
  .sp-arch-flow {
    grid-template-columns: 1fr;
  }

  .sp-arch-arrow {
    padding: 0.25rem 0;
  }

  .sp-arch-arrow svg {
    transform: rotate(90deg);
  }
}
</style>
