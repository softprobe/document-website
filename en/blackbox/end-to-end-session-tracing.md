---
title: End-to-end session tracing with payloads
---

# End-to-end session tracing with payloads

Trace a complete user journey across a browser frontend, a Vercel AI Node.js server, and a Java backend into one correlated Session with HTTP request and response payloads in [Softprobe Explorer](https://explorer.softprobe.ai).

The [Travel OTA demo (`softprobe/demo-ota`)](https://github.com/softprobe/demo-ota) keeps its application source uninstrumented on `main`. Its [`compose.blackbox.yml`](https://github.com/softprobe/demo-ota/blob/main/compose.blackbox.yml) overlay attaches Softprobe browser recording, Vercel AI telemetry, and OpenTelemetry eBPF Instrumentation (OBI) at startup so you can run the full-stack demo on macOS or Linux in one command.

## Architecture and instrumentation seams

A traveler chats in the browser web app (`travel-web`), which calls the Vercel AI Node.js server (`travel-agent`), which calls the Java backend (`travel-ota`) and an external airline NDC API:

<div class="sp-arch-diagram" role="img" aria-label="Travel OTA demo architecture with three components: Web App in Browser JS, Vercel AI Server in Node.js, and Java Backend in Spring Boot, with Softprobe instrumentation points.">
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
        <span class="sp-arch-port">:4310/agent</span>
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
        <span class="sp-arch-port">:4310</span>
      </div>
      <div class="sp-arch-title">2. Vercel AI Server</div>
      <div class="sp-arch-runtime">Node.js Backend</div>
      <div class="sp-arch-desc">Runs the AI agent and tool calls</div>
      <div class="sp-arch-badges" aria-label="Instrumentation">
        <span class="sp-inst-badge sp-inst-sdk">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="3" fill="currentColor" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.5 2" />
          </svg>
          @softprobe/vercel-ai-sdk
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
        <span class="sp-arch-port">:8080</span>
      </div>
      <div class="sp-arch-title">3. Java Backend</div>
      <div class="sp-arch-runtime">Spring Boot Service</div>
      <div class="sp-arch-desc">Handles flight search and booking</div>
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
      <strong>SDK Instrumentation</strong>: JS packages for DOM replay, browser HTTP, and AI agent turns
    </span>
    <span class="sp-arch-legend-item">
      <span class="sp-inst-dot sp-inst-dot-ebpf"></span>
      <strong>OBI (eBPF)</strong>: Zero-code Linux kernel capture for Java inbound and outbound HTTP traffic
    </span>
  </div>
</div>

All three tiers export telemetry using the same Ingestion Key (`spk_...`) and join into a single Session through `gen_ai.conversation.id`, `session.id`, and the W3C `traceparent` header. Each tier uses a distinct OpenTelemetry `service.name` (`travel-web`, `travel-agent`, `travel-ota`) so Explorer's **Graph** and **Span Detail** separate every service and outbound peer target.

## Run the demo with Docker Compose

You need Docker with Compose, a [Softprobe Explorer](https://explorer.softprobe.ai) workspace, and a Google Gemini API key. Use only synthetic travel details in this demo.

### 1. Create an Agent in Explorer

In [Explorer](https://explorer.softprobe.ai), open **Agents** and click **+ Connect agent**. Name the Agent `travel-ota-demo`, choose **Vercel AI**, set the environment to **demo**, and copy its Ingestion Key (`spk_...`).

### 2. Clone `demo-ota` and start the Blackbox overlay

```sh
git clone --depth 1 https://github.com/softprobe/demo-ota.git
cd demo-ota
export INGESTION_KEY="spk_REPLACE_WITH_INGESTION_KEY"
export GOOGLE_GENERATIVE_AI_API_KEY="YOUR_GEMINI_API_KEY"
docker compose -f compose.blackbox.yml up --build
```

For staging Explorer, also export:

```sh
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://explorer-staging.softprobe.ai/api/thelake/v1/traces"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment.name=staging"
export SOFTPROBE_ENVIRONMENT="staging"
```

### 3. Run a journey and inspect the Session Graph

Open [`http://127.0.0.1:4310/agent`](http://127.0.0.1:4310/agent), select your configured Gemini model, and complete a synthetic search, booking, and ticket-issuance flow:

1. Search for a flight:
   ```text
   Find a one-way economy flight from LHR to CDG for next Tuesday.
   ```
2. Select an offer (or reply `Prepare offer 1 for Alex Demo`), then click **Confirm booking** when the review card appears.
3. Click **Pay ... and issue ticket** with the prefilled demo card.

In [Softprobe Explorer](https://explorer.softprobe.ai), open **Sessions**, filter for `travel-ota-demo`, and open the newest Session. Switch to **Graph** and click nodes to inspect **Span Detail** across all three tiers:

- **Web app (`travel-web`).** RRWeb DOM replay and browser `POST` client spans with `url.template` route patterns and redacted JSON payloads.
- **Vercel AI server (`travel-agent`).** `invoke_agent` root spans, `chat` generation spans, and `execute_tool` spans (`travel_search`, `travel_prepare`, `travel_book`, `travel_order`) linked by `gen_ai.conversation.id`.
- **Java backend (`travel-ota`).** Inbound `POST /api/flights/search`, `/api/flights/book`, `/api/flights/orders/query`, and `/api/flights/payandissue` server spans with `[REDACTED]` card details, plus outbound `POST /ndc/v21.3/*` client spans to the external NDC airline host.

Press `Ctrl+C` or run `docker compose -f compose.blackbox.yml down` when finished.

## How each tier is instrumented

The `blackbox/` directory in `demo-ota` wires all three tiers without modifying the uninstrumented application source:

### Browser (`@softprobe/web-record`)

[`blackbox/entrypoint.sh`](https://github.com/softprobe/demo-ota/blob/main/blackbox/entrypoint.sh) loads `@softprobe/web-record/dist/browser.js` via `<script data-softprobe-options='...' defer>` in `index.html` and allows the OTLP origin in `Content-Security-Policy`:

- Sets `serviceName: "travel-web"` and exports OTLP traces and rrweb DOM recordings (`maskAllInputs: true`).
- Configures [`httpBodyCapture.routes`](/en/blackbox/reference/softprobe-js#httpbodycaptureoptions-and-httpbodycaptureroute) with wildcard `*` segments to trace business `POST` calls while skipping 1-second `GET /agent/api/sessions/:id` polling.
- Captures JSON bodies up to 64 KiB and replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` with `[REDACTED]`.
- Adopts `ses_*` session IDs automatically from `/agent/api/sessions` responses, `/sessions/:id` URLs, and `sessionStorage`.

See [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) and [`WebRecordInitOptions`](/en/blackbox/reference/softprobe-js#webrecordinitoptions) for every option.

### Vercel AI server (`@softprobe/vercel-ai-sdk`)

[`blackbox/init-vercel-ai.mjs`](https://github.com/softprobe/demo-ota/blob/main/blackbox/init-vercel-ai.mjs) runs via `NODE_OPTIONS="--import /opt/blackbox/init-vercel-ai.mjs"` before `src/start.mjs` starts:

```js
import { initVercelAiTelemetry } from "@softprobe/vercel-ai-sdk";

initVercelAiTelemetry({
  serviceName: process.env.SOFTPROBE_AI_SERVICE_NAME || "travel-agent",
});
```

[`initVercelAiTelemetry`](/en/blackbox/reference/softprobe-js#initvercelaitelemetry-options) extracts W3C `traceparent` and `ses_*` session IDs from incoming browser requests, records `agent`, `generation`, and `tool` spans, and forwards `traceparent` on outgoing `fetch`, `http`, and `https` calls to the Java backend.

### Java backend (OpenTelemetry OBI)

[`blackbox/Dockerfile.obi`](https://github.com/softprobe/demo-ota/blob/main/blackbox/Dockerfile.obi) installs official OpenTelemetry OBI `v1.0.0` in a sidecar container sharing the app's PID and network namespace. [`blackbox/obi.yaml`](https://github.com/softprobe/demo-ota/blob/main/blackbox/obi.yaml) selects the Java `travel-ota` process (`OTEL_SERVICE_NAME=travel-ota`), propagates W3C `headers`, redacts `$.paymentDetails.cardNumber` and `$.paymentDetails.cvv` on `/api/flights/payandissue`, and extracts JSON bodies for `/api/flights/*` and `/ndc/v21.3/*`.

See the [OBI distributed traces guide](https://opentelemetry.io/docs/zero-code/obi/distributed-traces/) and [Config v2 reference](https://opentelemetry.io/docs/zero-code/obi/configure/config-v2/) for Linux kernel and container deployment details.

## Use your own app

To apply this pattern to your own stack, assign a distinct OpenTelemetry `service.name` to each tier:

1. **Web app.** For bundled apps (Vite, Next.js, Webpack), install [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) and call [`RecordSdk.init`](/en/blackbox/reference/softprobe-js#recordsdk-init-options) (`{ ingestionKey, serviceName: 'my-web' }`). For plain HTML pages without a bundler, add `<script src="https://unpkg.com/@softprobe/web-record/dist/browser.js" data-softprobe-options='{"ingestionKey":"spk_...","serviceName":"my-web"}' defer></script>` to `<head>` and allow your OTLP endpoint origin in `connect-src`. Use [`httpBodyCapture`](/en/blackbox/reference/softprobe-js#httpbodycaptureoptions-and-httpbodycaptureroute) to scope routes or add `redactJsonPaths`.
2. **AI agent server.** Install [`@softprobe/vercel-ai-sdk`](/en/blackbox/reference/softprobe-js#softprobe-vercel-ai-sdk) and [`@softprobe/tracing`](/en/blackbox/reference/softprobe-js#softprobe-tracing), then call [`initVercelAiTelemetry`](/en/blackbox/reference/softprobe-js#initvercelaitelemetry-options) at server startup. For Python, OpenAI, LangChain, OpenCode, or standard OpenTelemetry GenAI (`gen_ai.*`), see the [Python SDK (`softprobe-py`)](/en/blackbox/reference/softprobe-py) and [JavaScript / TypeScript SDK (`softprobe-js`)](/en/blackbox/reference/softprobe-js) references.
3. **Backend services.** Set `OTEL_SERVICE_NAME` on each backend process or Kubernetes workload and run OBI with your process selector (`cmd_args_glob` or `open_ports`) and `url_path_patterns` allowlist.

## API references

- [JavaScript / TypeScript SDK (`softprobe-js`)](/en/blackbox/reference/softprobe-js) for [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record), [`@softprobe/vercel-ai-sdk`](/en/blackbox/reference/softprobe-js#softprobe-vercel-ai-sdk), and [`@softprobe/tracing`](/en/blackbox/reference/softprobe-js#softprobe-tracing)
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
