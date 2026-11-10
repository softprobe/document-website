# Capture a web app session with HTTP bodies

Start with the five-minute demo to capture one synthetic flight search and open its Session Graph. The guide then shows how to add the browser SDK and OBI to your own app so browser and backend spans, plus selected HTTP bodies, appear together.

The demo uses Softprobe's official Travel OTA [`docker.io/softprobe/demo-ota:v1.3.1` image](https://hub.docker.com/r/softprobe/demo-ota); its [v1.3.1 source is on GitHub](https://github.com/softprobe/demo-ota/tree/v1.3.1). The image is uninstrumented. The quick start loads the browser SDK into one local browser tab for a test; it does not modify the image or integrate the SDK into the app. You can replace the demo with your own app by following the integration steps below and changing the website origin, API origin, and HTTP routes to match your app.

## Five-minute demo: capture one search

You need Docker, a Chromium-based browser, and access to a Softprobe Explorer workspace. The quick start works on macOS, Windows, and Linux. It captures a browser span; the optional Linux OBI setup below adds backend spans. Docker's first image download can add time, depending on your connection.

### 1. Create a demo Agent

In Explorer, open **Agents** and click **+ Connect agent**. Create a Blackbox Agent named `travel-ota-demo`, choose **Web**, set the environment to **Development**, and enter this exact website origin:

```text
http://127.0.0.1:8080
```

Continue to the setup screen and click **Copy setup prompt**. Use the value after `Agent API key:` (`spk_...`) in the copied text. The origin must match exactly, including `127.0.0.1` and port `8080`; `localhost` is a different origin.

### 2. Start the official demo image

Run this command in a terminal and leave it running:

```sh
docker run --rm --init --name softprobe-demo-ota \
  --publish 127.0.0.1:8080:8080 \
  docker.io/softprobe/demo-ota:v1.3.1
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080) in Chrome. This binds the demo to your local machine.

### 3. Load browser capture in this tab

Open Chrome DevTools (**View → Developer → JavaScript Console**). If Chrome asks you to enable console pasting, type `allow pasting` and press **Enter**. Paste the snippet below, replacing `sp_REPLACE_WITH_DEMO_AGENT_KEY` with the key from the Agent setup prompt. It imports the [published browser SDK](https://www.npmjs.com/package/@softprobe/web-record), captures the demo's search request, and flushes before the demo navigates to its results page.

```js
(async () => {
  const { RecordSdk } = await import("https://esm.sh/@softprobe/web-record@0.1.12?bundle");
  if (window.__softprobeDemoSession) {
    console.info("Softprobe demo capture is already loaded.");
    return;
  }

  const session = RecordSdk.init({
    apiKey: "sp_REPLACE_WITH_DEMO_AGENT_KEY",
    environment: "demo",
    serviceName: "travel-ota-web",
    apiOrigins: [location.origin],
    maskAllInputs: true,
    httpBodyCapture: {
      routes: [{ method: "POST", path: "/api/flights/search" }],
    },
  });
  window.__softprobeDemoSession = session;

  const sdkFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const request = args[0] instanceof Request ? args[0] : null;
    const url = new URL(request?.url ?? String(args[0]), location.href);
    const method = String(args[1]?.method ?? request?.method ?? "GET").toUpperCase();
    const response = await sdkFetch(...args);

    if (url.origin === location.origin && method === "POST" && url.pathname === "/api/flights/search") {
      const uploaded = await session.flush();
      console.info("Softprobe demo search upload", { uploaded, sessionId: session.sessionId });
    }
    return response;
  };

  console.info("Softprobe demo capture is ready. Search requests will be sent to Explorer.", {
    sessionId: session.sessionId,
  });
})();
```

The Agent key is ingest-only and is visible in browser code. Use the demo Agent key here; never paste an account password, cookie, or admin key. The snippet runs only in this tab, so reload the homepage and paste it again if you close or reload the tab before searching. Use only synthetic search values: input masking does not redact HTTP bodies.

### 4. Make a synthetic search

Choose **London Heathrow (LHR)** as the departure airport and **Paris Charles de Gaulle (CDG)** as the arrival airport. Pick tomorrow's date and click **Search**. The console should log `Softprobe demo search upload` with `uploaded: true` and a Session ID.

### 5. Open the Session Graph

In Explorer, open **Sessions**, filter by `travel-ota-demo`, and open the newest Session. Select **Graph**. The quick start shows the browser's `POST /api/flights/search` span; open its `softprobe.http.body.capture` child span to inspect the synthetic search request and response. To add the Java backend and airline spans to the graph, run OBI on the Linux Docker host as described below, then reload the demo homepage, paste the snippet again, and repeat the search.

When you finish, stop the demo container with **Ctrl+C** in the terminal where it is running.

## Before integrating your app

The browser and backend use the same Agent key. OBI sends only the HTTP request and response bodies allowed by its configuration. Keep the Agent key for that Agent; use an Explorer OAuth account (or Blackbox MCP at `https://explorer.softprobe.ai/mcp`) to inspect Sessions, since the Agent key cannot read them.

For the Travel OTA demo, the public Node gateway listens on port `8080` and forwards requests to a Java service on port `8081`. OBI must target the Java process, not the Node gateway. OBI requires a Linux host with eBPF support; Docker Desktop on macOS or Windows can run the quick start, but not this backend capture step.

## Before you start

For your own app's backend capture, you need:

- An Agent for your app in Explorer and its ingest-only API key (`spk_...`).
- The Linux backend host, its listening port, and the HTTP paths to capture.
- Permission to run OBI with `sudo` on that host.

The Agent API key is strictly ingest-only and is required by `RecordSdk.init({ apiKey })` in browser code. Because visitors can see browser code, use only an Agent key there. Do not use a password, cookie, or admin key.

## 1. Add the browser SDK

Install the published SDK and import `RecordSdk` only:

```sh
npm install @softprobe/web-record
```

Initialize it once in the shared layout or startup file that runs before the app makes API calls. Replace the example key and routes with yours.

```ts
import { RecordSdk } from "@softprobe/web-record";

RecordSdk.init({
  apiKey: "<Agent API key>",
  serviceName: "travel-ota-web",
  httpBodyCapture: {
    routes: [
      { method: "POST", path: "/api/flights/search" },
      { method: "POST", path: "/api/flights/book" },
      { method: "POST", path: "/api/flights/payandissue" },
    ],
  },
});
```

That call uploads to `https://explorer.softprobe.ai/api/thelake/v1/traces`. To upload to a local or staging Explorer, pass `baseUrl` set to that Explorer's `/api/thelake` root, and pass `environment` when you want it on the span. `environment` does not choose the host.

The SDK creates a Session ID and keeps it in this tab across page loads. It automatically traces and sends W3C `traceparent` headers for same-origin requests and for any origin declared in `httpBodyCapture.routes`. If a route calls a different host from your website, pass a full URL in `path` (such as `"https://api.travel.example.com/api/flights/search"`) or set `origin` on the route entry, and allow `traceparent` in that API's CORS settings. Pass `apiOrigins` only when the browser calls additional cross-origin API hosts without HTTP body capture. If your site has a Content Security Policy, allow `https://explorer.softprobe.ai` in `connect-src`.

The SDK captures JSON bodies for the listed routes up to 64 KiB. It replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` with `[REDACTED]` anywhere in the JSON, including inside arrays. Add `redactJsonPaths` on a route for any other exact object path, such as `$.payment.token`. Other content types and larger bodies are omitted. OpenTelemetry records the browser request as a span named `POST`. The JSON is stored on its child span, `softprobe.http.body.capture`, as `http.request.body.content` and `http.response.body.content`. The Session ID is `session.id` and `sp.session.id` on those spans. Input masking applies to the page recording. It does not redact HTTP bodies.

## 2. Install the official OBI

On the Linux host that runs your backend, download the official OBI release. For the demo in Docker, this is the Linux Docker host. Set `ARCH` to `amd64` for Intel/AMD Linux or `arm64` for ARM Linux.

```sh
VERSION=1.0.0
ARCH=amd64
wget "https://github.com/open-telemetry/opentelemetry-ebpf-instrumentation/releases/download/v${VERSION}/obi-v${VERSION}-linux-${ARCH}.tar.gz"
wget "https://github.com/open-telemetry/opentelemetry-ebpf-instrumentation/releases/download/v${VERSION}/SHA256SUMS"
sha256sum -c SHA256SUMS --ignore-missing
tar -xzf "obi-v${VERSION}-linux-${ARCH}.tar.gz"
sudo install -m 0755 obi /usr/local/bin/obi
obi --version
```

These steps use OpenTelemetry's official OBI release, not a Softprobe fork. For Docker or Kubernetes, use the official [OBI setup guide](https://opentelemetry.io/docs/zero-code/obi/setup/).

## 3. Choose backend and outgoing bodies

Save this as `obi.yaml`. Replace the Agent key. The process filter below targets the demo's Java `app.jar`; for your own app, change `language_glob` and `cmd_args_glob` to match its backend process. The example includes the flight app's browser routes and outgoing airline routes; replace these paths with the exact paths your app uses.

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
                value: "Bearer <Agent API key>"
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
              cmd_args_glob: ["*app.jar*"]
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
                    url_path_patterns: [/api/flights/payandissue]
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
                      - /api/flights/payandissue
                      - /ndc/v21.3/airshopping
                      - /ndc/v21.3/offerprice
                      - /ndc/v21.3/ordercreate
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

The default body action is `exclude`; only the listed method and path combinations include bodies. The `obfuscate` rule redacts card number and CVV from the payment request before OBI sends it. OBI matches by HTTP method and path, so include every backend and outgoing path you want to inspect.

Validate the file, then start OBI on the backend host:

```sh
obi config validate ./obi.yaml
sudo obi --config=./obi.yaml
```

OBI needs elevated privileges to observe the backend process. Keep the file readable only by the account that runs OBI because it contains the Agent key.

## 4. Check the Session

1. Open your website and complete a task that calls the routes you listed.
2. In Explorer, open the resulting Session and select **Graph**.
3. Confirm the browser request and backend activity appear in the same Session.
4. If the backend activity is not visible yet, refresh after a few seconds. Open the HTTP spans and check their request and response bodies. Confirm the configured payment values show `[REDACTED]`.

For the flight example, search, booking, and payment appear as three trace branches in one Session. The backend branches include the matching airline calls.
