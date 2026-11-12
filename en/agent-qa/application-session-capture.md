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

All three components export telemetry with the same Agent key (`spk_...`) and correlate into a single Session via the conversation ID (`session.id`) and W3C `traceparent` header.

## Instrument and run the source demo

Run the Java backend on a Linux host so OBI can observe the process. Run the Node server on the same host (or point it at the Java host). If the Linux host has a desktop, open the web app locally in Chrome or Chromium. If you use a remote Linux host, forward port `4310` (`ssh -L 4310:127.0.0.1:4310 user@host`) and open `http://127.0.0.1:4310/agent` in your local browser.

You need Node.js 22 or newer, Java 21, Maven, Chrome or Chromium, a [Softprobe Explorer](https://explorer.softprobe.ai) workspace, and a Google Gemini API key. Model-provider charges may apply. Use only synthetic travel details in this demo.

### 1. Create a demo Agent

In [Explorer](https://explorer.softprobe.ai), open **Agents** and click **+ Connect agent**. Name the Agent `travel-ota-source-demo`, choose **Vercel AI**, set the environment to **demo**, and create the Agent. Copy its ingest-only API key (`spk_...`).

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

Add `RecordSdk.init` at line 1 of `travel-agent-demo/public/app.js` (outside and above the existing `(() => {` wrapper), replacing the placeholder with your Agent key:

```js
import { RecordSdk } from '@softprobe/web-record';

RecordSdk.init({
  apiKey: 'spk_REPLACE_WITH_AGENT_KEY',
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

With this configuration, `@softprobe/web-record`:

- Exports OTLP traces and DOM recordings to `https://explorer.softprobe.ai/api/thelake/v1/traces`.
- Traces only the listed business `POST` routes and injects W3C `traceparent` headers, skipping `/agent/api/status` health checks and 1-second `GET /agent/api/sessions/:id` polling requests.
- Captures JSON request and response bodies up to 64 KiB on matched routes and replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` with `[REDACTED]`.
- Masks all HTML input elements (`maskAllInputs: true`).
- Automatically adopts the demo's `ses_*` session ID from `/agent/api/sessions` responses, `/sessions/:id` request URLs, and `sessionStorage`.

Next, update `Content-Security-Policy` in `travel-agent-demo/src/server.mjs` so the browser can upload traces to `https://explorer.softprobe.ai`:

```js
'Content-Security-Policy':
  "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self' https://explorer.softprobe.ai; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
```

The `spk_...` key is an ingest-only Agent key designed for browser and collector use. Never place a user password, session cookie, or account token in browser code.

### 4. Instrument the Vercel AI server (Node.js)

Add `initVercelAiTelemetry` at the top of `travel-agent-demo/src/start.mjs`, replacing the placeholder with the same Agent key:

```js
import { initVercelAiTelemetry } from '@softprobe/vercel-ai-sdk';

initVercelAiTelemetry({
  apiKey: 'spk_REPLACE_WITH_AGENT_KEY',
});
```

With only `apiKey`, `initVercelAiTelemetry` automatically instruments Vercel AI SDK calls (`generateText`, `streamText`, and tool executions), propagates W3C `traceparent` headers onto outgoing Node `fetch` and `http`/`https` requests to downstream services (excluding Softprobe OTLP trace uploads), and exports `agent`, `generation`, and `tool` spans to `https://explorer.softprobe.ai/api/thelake/v1/traces`:

- **From an instrumented browser (`@softprobe/web-record`)**: The browser SDK injects a W3C `traceparent` header on requests to the Node.js server. `initVercelAiTelemetry` extracts `traceparent` (plus any `/sessions/:id` or `x-session-id` on the request) and forwards `traceparent` when tool calls or route handlers call the Java backend, so browser, Vercel AI, and Java spans correlate into the same Session in Explorer.
- **Without an incoming trace or session ID** (for example, a CLI script, cron job, or `curl` request): `initVercelAiTelemetry` starts a new trace and uses its `trace_id` as the fallback `session.id`, so each standalone run still appears as its own Session in Explorer.

### 5. Build and start the services

From the `demo-ota` repository root, package the Java backend and bundle `public/app.js`:

```sh
mvn -B -DskipTests -Dmaven.build.cache.enabled=false package
cd travel-agent-demo
npx esbuild public/app.js --bundle --outfile=public/app.js --allow-overwrite
cd ..
```

Open two terminals in `demo-ota`. In the first terminal, start the Java backend on port `8080`:

```sh
java -jar travel-ota/target/travel-ota-1.0-SNAPSHOT.jar --server.port=8080
```

In the second terminal, start the Vercel AI Node.js server with your Gemini API key (it listens on port `4310` and calls the Java backend at `http://127.0.0.1:8080` by default):

```sh
cd travel-agent-demo
export GOOGLE_GENERATIVE_AI_API_KEY='YOUR_MODEL_PROVIDER_KEY'
npm start
```

### 6. Instrument the Java backend with OBI

The Java backend (`travel-ota`) requires no code changes or JVM agent flags. Install the official OBI `1.0.0` binary on the Linux host to trace the Java process's inbound REST endpoints and outbound NDC airline calls at the kernel level. Set `ARCH` to `amd64` or `arm64`:

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

Save the following configuration as `obi.yaml` and replace the Agent key. It selects only the Java `travel-ota` process (avoiding duplicate or OTLP-upload HTTP spans from Node), propagates W3C trace headers across inbound and outbound HTTP calls, redacts payment card fields, and extracts JSON request and response bodies for flight search, booking, order verification, payment, and NDC airline endpoints:

```yaml
file_format: "1.0"

tracer_provider:
  processors:
    - batch:
        exporter:
          otlp_http:
            endpoint: "https://explorer.softprobe.ai/api/thelake/v1/traces"
            headers:
              - name: Authorization
                value: "Bearer spk_REPLACE_WITH_AGENT_KEY"
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

In [Softprobe Explorer](https://explorer.softprobe.ai), open **Sessions**, filter for `travel-ota-source-demo`, and select the newest Session. Switch to **Graph** to inspect the unified trace across all three components:

- **Web app**: RRWeb DOM replay and browser `POST /agent/api/sessions/*` spans with captured JSON payloads.
- **Vercel AI server**: `invoke_agent` root spans, `chat` LLM generation spans, and `execute_tool` spans (`travel_search`, `travel_prepare`, `travel_book`, `travel_order`).
- **Java backend**: Inbound `POST /api/flights/search`, `/api/flights/book`, `/api/flights/orders/query`, and `/api/flights/payandissue` server spans (with `[REDACTED]` card details) alongside outbound `POST /ndc/v21.3/airshopping`, `/ndc/v21.3/offerprice`, `/ndc/v21.3/ordercreate`, `/ndc/v21.3/orderretrieve`, and `/ndc/v21.3/orderchange` client spans. HTTP/1.1 routes include extracted JSON bodies, while OkHttp HTTP/2 `/ndc/v21.3/ordercreate` records route, status, and parent-span correlation without body buffers in OBI `v1.0.0`.

Stop OBI, the Node server, and the Java service with `Ctrl+C` when finished.

## Use your own app

To apply this pattern to your own stack:

1. **Web app**: Install [`@softprobe/web-record`](https://www.npmjs.com/package/@softprobe/web-record) and call `RecordSdk.init({ apiKey })` in your browser entrypoint, or add `<script src="https://unpkg.com/@softprobe/web-record/dist/browser.js" data-api-key="spk_..." defer></script>` to `<head>`. Pass `httpBodyCapture: { routes: [...] }` when you want to scope browser `fetch`/`XHR` span and body capture to specific route paths or add custom `redactJsonPaths` rules.
2. **Vercel AI server**: Install [`@softprobe/vercel-ai-sdk`](https://www.npmjs.com/package/@softprobe/vercel-ai-sdk) and [`@softprobe/tracing`](https://www.npmjs.com/package/@softprobe/tracing), and call `initVercelAiTelemetry({ apiKey })` at server startup.
3. **Backend services**: Run OBI on your Linux host or Kubernetes node with your process selector (`cmd_args_glob`) and route allowlist (`url_path_patterns`).

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
