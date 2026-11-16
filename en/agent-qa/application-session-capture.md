# Capture a web app session with HTTP bodies

This walkthrough shows how to capture a complete user journey across a browser frontend, a Vercel AI Node.js server, and a Java backend into a single Session in [Softprobe Explorer](https://explorer.softprobe.ai). With the prerequisites ready, the setup takes about five minutes.

The official Travel OTA demo is published as [`docker.io/softprobe/demo-ota:v1.3.2`](https://hub.docker.com/r/softprobe/demo-ota) and as [`v1.3.2` source on GitHub](https://github.com/softprobe/demo-ota/tree/v1.3.2). The published image is a plain application with no Softprobe instrumentation enabled. In this guide, you check out the source repository, instrument the browser web app and the Vercel AI server, and attach OpenTelemetry eBPF Instrumentation (OBI) on Linux.

## Demo architecture and instrumentation

The Travel OTA demo has three service components. A traveler chats in the browser web app, which calls the Vercel AI Node.js server, which in turn calls the Java backend to search and book flights:

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

All three components export telemetry with the same Ingestion Key and correlate into a single Session through `gen_ai.conversation.id`, `session.id`, W3C `baggage`, and the W3C `traceparent` header. Softprobe routes `POST /v1/traces` through its external OpenTelemetry Collector, which correlates spans sharing a trace or `baggage` session before writing to TheLake. Each tier sets a distinct OpenTelemetry `service.name`, using `travel-web` in the browser, `travel-agent` in the Node.js AI server, and `travel-ota` on the Java backend, so Explorer **Graph** and **Span Detail** views identify every service and outbound peer target separately.

## Instrument and run the source demo

Run the Java backend on a Linux host so OBI can observe the process. Run the Node server on the same host (or point it at the Java host). If the Linux host has a desktop, open the web app locally in Chrome or Chromium. If you use a remote Linux host on a private network, open `http://<host>:4310/agent` directly (or forward port `4310` with `ssh -L 4310:127.0.0.1:4310 user@host` and open `http://127.0.0.1:4310/agent`).

You need Node.js 22 or newer, Java 21, Maven, Chrome or Chromium, a [Softprobe Explorer](https://explorer.softprobe.ai) workspace, and a Google Gemini API key. Model-provider charges may apply. Use only synthetic travel details in this demo.

### 1. Create a demo Agent

In [Explorer](https://explorer.softprobe.ai), open **Agents** and click **+ Connect agent**. Name the Agent `travel-ota-source-demo`, choose **Vercel AI**, set the environment to **demo**, and create the Agent. Copy its Ingestion Key (`spk_...`).

### 2. Check out the demo source and install the SDKs

Clone the `v1.3.2` source tag and install the Softprobe packages in `travel-agent-demo`:

```sh
git clone --depth 1 --branch v1.3.2 https://github.com/softprobe/demo-ota.git
cd demo-ota/travel-agent-demo
npm install @softprobe/web-record @softprobe/tracing @softprobe/vercel-ai-sdk
npm install --save-dev esbuild
cd ..
```

### 3. Instrument the web app (Browser JS)

Add [`RecordSdk.init`](/en/agent-qa/reference/softprobe-js#recordsdk-initoptions) at line 1 of `travel-agent-demo/public/app.js` above the existing `(() => {` wrapper, replacing the placeholder with your Ingestion Key (see [`WebRecordInitOptions`](/en/agent-qa/reference/softprobe-js#webrecordinitoptions) and [`HttpBodyCaptureOptions`](/en/agent-qa/reference/softprobe-js#httpbodycaptureoptions-and-httpbodycaptureroute)):

```js
import { RecordSdk } from '@softprobe/web-record';

RecordSdk.init({
  ingestionKey: 'spk_REPLACE_WITH_INGESTION_KEY',
  serviceName: 'travel-web',
  httpBodyCapture: {
    routes: [
      { method: 'POST', path: '/agent/api/sessions' },
      { method: 'POST', path: '/agent/api/sessions/*/messages' },
      { method: 'POST', path: '/agent/api/sessions/*/approve' },
      { method: 'POST', path: '/agent/api/sessions/*/pay' },
      { method: 'POST', path: '/agent/api/sessions/*/cancel-booking' },
      { method: 'POST', path: '/agent/api/sessions/*/abort' },
    ],
  },
});

(() => {
  'use strict';
```

With this configuration, `@softprobe/web-record` performs the following actions:

- Sets OpenTelemetry `service.name` to `travel-web` and exports OTLP traces and DOM recordings to the configured Softprobe environment on a 1-second batch schedule (`pagehide` flushes buffered telemetry in both automatic and `manual: true` modes).
- Propagates W3C `traceparent` headers across all same-origin and configured `apiOrigins` requests even when a route is omitted from `httpBodyCapture.routes`, and injects W3C `baggage` (`sp.session.id`) on same-origin `fetch` and `XMLHttpRequest` calls without adding cross-origin CORS preflights.
- Clones JSON request and response bodies up to 64 KiB only on matched `httpBodyCapture.routes`, keeps low-cardinality HTTP client span names (`POST`), sets `url.template` such as `/agent/api/sessions/*/messages` when a wildcard `*` route matches, and replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` with `[REDACTED]`.
- Masks all HTML input elements with `maskAllInputs: true`.
- Adopts the demo's `ses_*` session ID from `/agent/api/sessions` responses, `/sessions/:id` request URLs, and `sessionStorage`, validating printable ASCII identifiers (`/^[!-~]{1,128}$/`).

Next, update `Content-Security-Policy` in `travel-agent-demo/src/server.mjs` so the browser can upload traces to `https://explorer.softprobe.ai`:

```js
'Content-Security-Policy':
  "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' https://explorer.softprobe.ai; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
```

The `spk_...` Ingestion Key can send telemetry from the browser and collector. Never place a user password, session cookie, or account token in browser code.

### 4. Instrument the Vercel AI server (Node.js)

Add [`initVercelAiTelemetry`](/en/agent-qa/reference/softprobe-js#initvercelaitelemetryoptions) at the top of `travel-agent-demo/src/start.mjs`, replacing the placeholder with the same Ingestion Key:

```js
import { initVercelAiTelemetry } from '@softprobe/vercel-ai-sdk';

initVercelAiTelemetry({
  ingestionKey: 'spk_REPLACE_WITH_INGESTION_KEY',
  serviceName: 'travel-agent',
});
```

`initVercelAiTelemetry` sets OpenTelemetry `service.name` to `travel-agent`, instruments Vercel AI SDK calls (`generateText`, `streamText`, and tool executions), propagates W3C `traceparent` headers onto outgoing Node `fetch`, `http`, and `https` requests to downstream services while excluding Softprobe OTLP trace uploads, and exports `agent`, `generation`, and `tool` spans to `https://explorer.softprobe.ai/api/thelake/v1/traces`:

- **From an instrumented browser.** `@softprobe/web-record` injects a W3C `traceparent` header on requests to the Node.js server. `initVercelAiTelemetry` extracts `traceparent` along with any conversation or session ID from `/sessions/:id` URLs, request headers, metadata, or baggage. It sets both `gen_ai.conversation.id` and `session.id` to that ID and forwards `traceparent` when tool calls or route handlers call the Java backend, so browser, Vercel AI, and Java spans join the same Session in Explorer.
- **Without an incoming conversation or session ID.** When a CLI script, cron job, or `curl` command runs without a session ID, `initVercelAiTelemetry` starts a new trace and leaves `gen_ai.conversation.id` and `session.id` unset instead of fabricating a conversation ID from `trace_id`. Pass `experimental_telemetry: { metadata: { sessionId } }` or `x-session-id` when you want standalone calls grouped into a Session.

### 5. Build and start the services

From the `demo-ota` repository root, package the Java backend and bundle `public/app.js`:

```sh
mvn -B -DskipTests -Dmaven.build.cache.enabled=false package
cd travel-agent-demo
npx esbuild public/app.js --bundle --outfile=public/app.js --allow-overwrite
cd ..
```

Open two terminals in `demo-ota`. In the first terminal, start the Java backend on port `8080` with `OTEL_SERVICE_NAME=travel-ota` and `OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=demo` so OBI assigns a distinct service identity and environment to the backend. Use `deployment.environment.name=staging` for the staging Explorer environment:

```sh
OTEL_SERVICE_NAME=travel-ota OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=demo java -jar travel-ota/target/travel-ota-1.0-SNAPSHOT.jar --server.port=8080
```

In the second terminal, start the Vercel AI Node.js server with your Gemini API key (`GOOGLE_GENERATIVE_AI_API_KEY`). The server listens on port `4310` and calls the Java backend at `http://127.0.0.1:8080` by default:

```sh
cd travel-agent-demo
export GOOGLE_GENERATIVE_AI_API_KEY='YOUR_MODEL_PROVIDER_KEY'
npm start
```

### 6. Instrument the Java backend with OBI

The Java backend requires no code changes or JVM agent flags. OBI discovers `OTEL_SERVICE_NAME=travel-ota` from the Java process environment (or from pod metadata on Kubernetes) and sets `service.name` on every captured backend server and client span. Install the official OBI `1.0.0` binary on the Linux host to trace the Java process's inbound REST endpoints and outbound NDC airline calls at the kernel level. Set `ARCH` to `amd64` or `arm64`:

```sh
VERSION=1.0.0
ARCH=amd64
curl -fLO "https://github.com/open-telemetry/opentelemetry-ebpf-instrumentation/releases/download/v$VERSION/obi-v$VERSION-linux-$ARCH.tar.gz"
curl -fLO "https://github.com/open-telemetry/opentelemetry-ebpf-instrumentation/releases/download/v$VERSION/SHA256SUMS"
sha256sum -c SHA256SUMS --ignore-missing
tar -xzf "obi-v$VERSION-linux-$ARCH.tar.gz"
sudo install -m 0755 obi /usr/local/bin/obi
obi --version
```

Set these values in the OBI process environment, then save the configuration below as `obi.yaml`. Config v2 expands the endpoint and Ingestion Key only where the YAML references them. It selects only the Java `travel-ota` process (avoiding duplicate or OTLP-upload HTTP spans from Node), propagates W3C trace headers across inbound and outbound HTTP calls, redacts payment card fields, and extracts JSON request and response bodies for flight search, booking, order verification, payment, and NDC airline endpoints:

```sh
export INGESTION_KEY='spk_REPLACE_WITH_INGESTION_KEY'
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT='https://explorer.softprobe.ai/api/thelake/v1/traces'
```

For staging, use `https://explorer-staging.softprobe.ai/api/thelake/v1/traces`
for `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` and open Explorer on the matching
staging host. Because this is the signal-specific traces endpoint, OBI uses the
URL as written; it does not append `/v1/traces`.

```yaml
file_format: "1.0"

tracer_provider:
  processors:
    - batch:
        exporter:
          otlp_http:
            endpoint: ${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT}
            encoding: protobuf
            headers:
              - name: Authorization
                value: "Bearer ${INGESTION_KEY}"
        schedule_delay: 5000

extensions:
  obi:
    version: "2.0"
    capture:
      policy:
        default_action: exclude
      rules:
        - action: include
          match:
            process:
              language_glob: ["java"]
              cmd_args_glob:
                - "*travel-ota-1.0-SNAPSHOT.jar*"
      instrumentation:
        http:
          enabled:
            traces: true
            metrics: false
          buffer_size: 65536
          payload_extraction:
            enabled: [enrichment]
            enrichment:
              policy:
                default_action:
                  headers: exclude
                  body: exclude
                obfuscation_string: "[REDACTED]"
              rules:
                - action: include
                  type: headers
                  scope: request
                  match:
                    patterns:
                      - baggage
                      - traceparent
                - action: obfuscate
                  type: body
                  scope: request
                  match:
                    url_path_patterns:
                      - /api/flights/payandissue
                    methods: [POST]
                    obfuscation_json_paths:
                      - $.paymentDetails.cardNumber
                      - $.paymentDetails.cvv
                - action: include
                  type: body
                  scope: all
                  match:
                    url_path_patterns:
                      - /api/flights/search
                      - /api/flights/book
                      - /api/flights/orders/query
                      - /api/flights/payandissue
                      - /ndc/v21.3/airshopping
                      - /ndc/v21.3/offerprice
                      - /ndc/v21.3/ordercreate
                      - /ndc/v21.3/orderretrieve
                      - /ndc/v21.3/orderchange
                    methods: [POST]
        sql:
          postgres:
            buffer_size: 0
          mysql:
            buffer_size: 0
      runtimes:
        java:
          enabled: true
      engine:
        propagation:
          context_propagation: headers
```

Validate `obi.yaml` and start OBI:

```sh
chmod 600 obi.yaml
obi config validate ./obi.yaml
sudo obi --config=./obi.yaml
```

See the [OBI distributed traces guide](https://opentelemetry.io/docs/zero-code/obi/distributed-traces/) and [Config v2 reference](https://opentelemetry.io/docs/zero-code/obi/configure/config-v2/) for Linux kernel and container deployment details.

### 7. Run a journey and inspect the Session Graph

Open [`http://127.0.0.1:4310/agent`](http://127.0.0.1:4310/agent), select your configured Gemini model, and complete a synthetic search, booking, and ticket-issuance flow:

1. Search for a flight:
   ```text
   Find a one-way economy flight from LHR to CDG for next Tuesday.
   ```
2. Select an offer (or reply `Prepare offer 1 for Alex Demo`), then click **Confirm demo booking** when the review card appears.
3. Click **Pay & issue ticket** with the prefilled demo card to complete payment and ticket issuance.

In [Softprobe Explorer](https://explorer.softprobe.ai), open **Sessions**, filter for `travel-ota-source-demo`, and select the newest Session. Sessions with HTTP and OBI spans and zero LLM generation spans open directly in **Graph** view; sessions with LLM turns open in **Trajectory** view, where you can switch to **Graph** and open **Span Detail** on individual nodes to inspect the unified trace across each distinct `service.name` and outbound peer target:

- **Web app (`travel-web`).** RRWeb DOM replay and browser `POST` client spans with `url.template` route patterns and captured JSON payloads.
- **Vercel AI server (`travel-agent`).** `invoke_agent` root spans, `chat` LLM generation spans, and `execute_tool` spans (`travel_search`, `travel_prepare`, `travel_book`, `travel_order`) linked by `gen_ai.conversation.id`.
- **Java backend (`travel-ota`).** Inbound `POST /api/flights/search`, `/api/flights/book`, `/api/flights/orders/query`, and `/api/flights/payandissue` server spans with `[REDACTED]` card details, alongside outbound `POST /ndc/v21.3/airshopping`, `/ndc/v21.3/offerprice`, `/ndc/v21.3/ordercreate`, `/ndc/v21.3/orderretrieve`, and `/ndc/v21.3/orderchange` client spans to the external NDC airline host. HTTP/1.1 routes include extracted JSON bodies, while OkHttp HTTP/2 `/ndc/v21.3/ordercreate` records route, status, and parent-span correlation without body buffers in OBI `v1.0.0`.

If a frontend `Content-Security-Policy`, an adblocker, or a standalone CLI request prevents browser OTLP spans from reaching Softprobe, backend OBI and Node.js spans are never dropped. Same-origin requests carry `sp.session.id` in W3C `baggage`, and `@softprobe/tracing` plus `softprobe` propagate `sp.session.id` across outgoing HTTP requests and child spans. When no session arrives within the 2-second collector correlation window, `thelake-collector` forwards the trace unmodified to stateless TheLake. Unassigned and orphan-parent backend traces appear under **Inspect -> Traces**, where you can run Tempo TraceQL queries such as `{ .sp.session.id !~ ".+" }` or `{ status = error }`, inspect Waterfall and E2E Graph views with captured HTTP request and response bodies, and read the **Browser span missing** diagnostic banner.

Stop OBI, the Node server, and the Java service with `Ctrl+C` when finished.

## Use your own app

To apply this pattern to your own stack, assign a distinct OpenTelemetry `service.name` to every tier:

1. **Web app.** Install [`@softprobe/web-record`](/en/agent-qa/reference/softprobe-js#softprobe-web-record) and call [`RecordSdk.init`](/en/agent-qa/reference/softprobe-js#recordsdk-initoptions) (`{ ingestionKey, serviceName: 'my-web' }`) in your browser entrypoint, or add `<script src="https://unpkg.com/@softprobe/web-record/dist/browser.js" data-softprobe-options='{"ingestionKey":"spk_...","serviceName":"my-web"}' defer></script>` to `<head>`. Pass [`httpBodyCapture: { routes: [...] }`](/en/agent-qa/reference/softprobe-js#httpbodycaptureoptions-and-httpbodycaptureroute) with wildcard `*` path segments to scope browser `fetch` and `XHR` capture to business routes, stamp low-cardinality `url.template` attributes, and add custom `redactJsonPaths` rules.
2. **AI agent server.** Install [`@softprobe/vercel-ai-sdk`](/en/agent-qa/reference/softprobe-js#softprobe-vercel-ai-sdk) and [`@softprobe/tracing`](/en/agent-qa/reference/softprobe-js#softprobe-tracing), then call [`initVercelAiTelemetry`](/en/agent-qa/reference/softprobe-js#initvercelaitelemetryoptions) (`{ ingestionKey, serviceName: 'my-agent' }`) at server startup. If your agent uses Python, OpenAI, LangChain, OpenCode, or standard OpenTelemetry GenAI (`gen_ai.*`), see the [Python SDK (`softprobe-py`)](/en/agent-qa/reference/softprobe-py) and [JavaScript / TypeScript SDK (`softprobe-js`)](/en/agent-qa/reference/softprobe-js) references, export OTLP HTTP traces with a distinct `OTEL_SERVICE_NAME`, and propagate your app's conversation ID in `gen_ai.conversation.id` or `session.id`.
3. **Backend services.** Set `OTEL_SERVICE_NAME` on each backend process or Kubernetes workload, then run OBI on your Linux host or node with your process selector (`cmd_args_glob` or `open_ports`) and route allowlist (`url_path_patterns`). OBI discovers `OTEL_SERVICE_NAME` from the target service so **Graph** and **Span Detail** show each backend and outbound peer target clearly.

## API references

- [JavaScript / TypeScript SDK (`softprobe-js`)](/en/agent-qa/reference/softprobe-js) for [`@softprobe/web-record`](/en/agent-qa/reference/softprobe-js#softprobe-web-record), [`@softprobe/vercel-ai-sdk`](/en/agent-qa/reference/softprobe-js#softprobe-vercel-ai-sdk), and [`@softprobe/tracing`](/en/agent-qa/reference/softprobe-js#softprobe-tracing)
- [Python SDK (`softprobe-py`)](/en/agent-qa/reference/softprobe-py) for `SoftprobeClient`, `observe_openai`, `softprobe.langchain`, and `softprobe.propagation`
- [Vercel AI SDK guide](/en/agent-qa/vercel-ai-sdk)
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
