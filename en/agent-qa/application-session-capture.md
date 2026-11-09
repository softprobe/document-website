# Capture a web app session with HTTP bodies

Add the browser SDK to your website and run the official OBI on the Linux host that runs your backend. The browser and backend use the same Agent key. OBI sends the HTTP request and response bodies you allow in its configuration.

This guide uses Softprobe's official Travel OTA demo, published as the [`docker.io/softprobe/demo-ota:v1.3.1` image](https://hub.docker.com/r/softprobe/demo-ota). See the [source repository on GitHub](https://github.com/softprobe/demo-ota). The app is a demo; you can use your own app instead. Replace the website address, API origins, and HTTP routes in the examples with your app's values.

In the demo, a search, booking, and payment appear in one Session, with their backend and airline requests in the Session's **Graph**.

## Before you start

You need:

- An Agent for your app in Explorer and its ingest-only API key (`spk_...`).
- The API address the browser calls.
- The Linux backend host, its listening port, and the HTTP paths to capture.
- Permission to run OBI with `sudo` on that host.

The Agent API key is strictly ingest-only (`POST https://explorer.softprobe.ai/api/thelake/v1/traces`). Because it can only ingest telemetry and returns `403` on read or management endpoints, it is safe to pass directly to `RecordSdk.init({ apiKey })` in browser code. Do not use a password, cookie, or admin key in the browser. To inspect captured Sessions from a coding agent, use Softprobe MCP (`https://explorer.softprobe.ai/mcp`) with your Explorer OAuth account.

## 1. Add the browser SDK

Install the published SDK and import `RecordSdk` only:

```sh
npm install @softprobe/web-record
```

Initialize it once in the shared layout or startup file that runs before the app makes API calls. Replace the example key and API address with yours. With one API address, name each body route by method and path.

```ts
import { RecordSdk } from "@softprobe/web-record";

RecordSdk.init({
  apiKey: "<Agent API key>",
  serviceName: "travel-ota-web",
  apiOrigins: ["https://travel.example.com"],
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

The SDK creates a Session ID and keeps it in this tab across page loads. List every browser API origin in `apiOrigins`. The SDK sends `traceparent` only to those origins. If your API has a different address from your website, allow `traceparent` in the API's CORS settings. If your site has a Content Security Policy, allow `https://explorer.softprobe.ai` in `connect-src`.

The SDK captures JSON bodies for the listed routes up to 64 KiB. It replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` with `[REDACTED]` anywhere in the JSON, including inside arrays. Add `redactJsonPaths` on a route for any other exact object path, such as `$.payment.token`. Other content types and larger bodies are omitted. OpenTelemetry records the browser request as a span named `POST`. The JSON is stored on its child span, `softprobe.http.body.capture`, as `http.request.body.content` and `http.response.body.content`. The Session ID is `session.id` and `sp.session.id` on those spans. Input masking applies to the page recording. It does not redact HTTP bodies.

## 2. Install the official OBI

On the Linux backend host, download the official OBI release. Set `ARCH` to `amd64` for Intel/AMD Linux or `arm64` for ARM Linux.

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

Save this as `obi.yaml`. Replace the Agent key and change `open_ports` to the port your backend listens on. The example includes the flight app's browser routes and its outgoing airline routes; replace these paths with the exact paths your app uses.

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
              open_ports: "8080"
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
