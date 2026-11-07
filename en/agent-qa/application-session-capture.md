# Capture a web app session with HTTP bodies

Add the browser SDK to your website and run the official OBI on the Linux host that runs your backend. The browser and backend use the same Agent key. OBI sends the HTTP request and response bodies you allow in its configuration.

This example uses a Java flight app. A search, booking, and payment appear in one Session, with their backend and airline requests in the Session's **Graph**.

## Before you start

You need:

- An Agent for your app in Explorer and its ingest-only API key.
- The website address and the API address the browser calls.
- The Linux backend host, its listening port, and the HTTP paths to capture.
- Permission to run OBI with `sudo` on that host.

The browser key is visible in your site code. Use only an Agent ingest key; do not use a password, cookie, or admin key.

## 1. Add the browser SDK

Install the published SDK. It bundles the official OpenTelemetry browser SDK and Fetch/XHR instrumentation. `RecordSdk.init()` configures those components internally, so your app imports only `RecordSdk`:

```sh
npm install @softprobe/web-record
```

Initialize it once in the shared layout or startup file that runs before the app makes API calls. Replace the example key and address with yours. This example assumes the website and API share an address.

```ts
import { RecordSdk } from "@softprobe/web-record";

RecordSdk.init({
  apiKey: "<Agent API key>",
  baseUrl: "https://explorer.softprobe.ai/api/thelake",
  serviceName: "travel-ota-web",
  environment: "production",
  apiOrigins: ["https://travel.example.com"],
  httpBodyCapture: {
    maxBodyBytes: 65536,
    routes: [
      { origin: "https://travel.example.com", method: "POST", path: "/api/flights/search" },
      { origin: "https://travel.example.com", method: "POST", path: "/api/flights/book" },
      {
        origin: "https://travel.example.com",
        method: "POST",
        path: "/api/flights/payandissue",
        redactJsonPaths: ["$.paymentDetails.cardNumber", "$.paymentDetails.cvv"],
      },
    ],
  },
});
```

The SDK creates a Session ID and keeps it in this tab across page loads. Add every browser API origin to `apiOrigins` and to the matching body rule. If your API has a different address from your website, allow `traceparent` and `tracestate` in the API's CORS settings. If your site has a Content Security Policy, allow `https://explorer.softprobe.ai` in `connect-src`.

The SDK captures JSON bodies for the listed routes up to 64 KB. It replaces the listed payment fields with `[REDACTED]`. Other content types and larger bodies are omitted. OpenTelemetry's browser instrumentation creates the HTTP spans and provides the hooks used by body capture; Softprobe attaches the captured bodies to `softprobe.http.body.capture` child spans. OTel's standard `session.id` and Softprobe's `sp.session.id` compatibility attribute carry the same browser Session ID. Input masking applies to the page recording; it does not redact HTTP bodies.

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
