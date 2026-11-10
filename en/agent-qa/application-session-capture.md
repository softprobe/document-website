# Capture a web app session with HTTP bodies

This five-minute quick start uses the Travel OTA source code to exercise all three capture paths: browser recording with `@softprobe/web-record`, Vercel AI spans with `@softprobe/vercel-ai-sdk`, and backend HTTP spans and selected bodies with official OpenTelemetry eBPF Instrumentation (OBI).

The official Travel OTA demo is also published as the [`docker.io/softprobe/demo-ota:v1.3.1` image](https://hub.docker.com/r/softprobe/demo-ota). This guide checks out the [`v1.3.1 source on GitHub`](https://github.com/softprobe/demo-ota/tree/v1.3.1) so you can add the SDKs to the app code. The published image is plain and has no Softprobe instrumentation. This is a demo; you can use your own app by replacing its site origin, routes, and OBI process selector with your app's values.

## Five-minute source demo

For the full browser, Vercel AI, and OBI journey, run the Node gateway and Java service on the same supported Linux host so OBI can trace requests through both processes. OBI requires Linux. Open the demo in Chrome or Chromium on that host at the `127.0.0.1` address below.

You need Node.js 22 or newer, Java 21, Maven, Chrome or Chromium, a Softprobe Explorer workspace, and a Google Gemini API key. Model-provider charges may apply. Use only synthetic travel details in this demo. For a remote Linux host, forward port `4310` to your workstation and keep the Agent website origin set to `http://127.0.0.1:4310`.

### 1. Create a demo Agent

In Explorer, open **Agents** and click **+ Connect agent**. Name the Agent `travel-ota-source-demo`, choose **Vercel AI**, set the environment to **demo**, and enter this exact website origin:

```text
http://127.0.0.1:4310
```

Create the Agent and copy its ingest-only API key (`spk_...`). The app uses port `4310`; `localhost` is a different origin from `127.0.0.1`.

### 2. Check out the demo source and install the SDKs

Run these commands in a terminal:

```sh
git clone --depth 1 --branch v1.3.1 https://github.com/softprobe/demo-ota.git
cd demo-ota/travel-agent-demo
npm install --save-exact @opentelemetry/api@1.9.1 @opentelemetry/context-async-hooks@1.30.1 @softprobe/tracing@0.1.13 @softprobe/vercel-ai-sdk@0.1.13 @softprobe/web-record@0.1.13
npm install --save-dev esbuild
cd ..
```

The Vercel AI integration already exists in `travel-agent-demo/src/start.mjs`; these commands update it to SDK `0.1.13` and add the browser SDK.

### 3. Apply the integration patch

From the `demo-ota` repository root, apply this patch. It bundles the browser SDK through esbuild, uses the app's existing chat ID for browser and Vercel AI spans, disables prompt and response recording, and allows the browser to send telemetry to Explorer.

```sh
git apply --unidiff-zero <<'PATCH'
diff --git a/travel-agent-demo/public/app.js b/travel-agent-demo/public/app.js
index e5e544c..32a5553 100644
--- a/travel-agent-demo/public/app.js
+++ b/travel-agent-demo/public/app.js
@@ -902,0 +903 @@
+        window.dispatchEvent(new CustomEvent('travel-agent:session-id', { detail: { sessionId: created.id } }));
diff --git a/travel-agent-demo/public/index.html b/travel-agent-demo/public/index.html
index 0e41eb4..a0437eb 100644
--- a/travel-agent-demo/public/index.html
+++ b/travel-agent-demo/public/index.html
@@ -9,0 +10 @@
+  <script src="/agent/capture.js" defer></script>
diff --git a/travel-agent-demo/src/engine.mjs b/travel-agent-demo/src/engine.mjs
index 1b5e9b6..ed769b9 100644
--- a/travel-agent-demo/src/engine.mjs
+++ b/travel-agent-demo/src/engine.mjs
@@ -212 +212 @@ export class VercelAIEngine {
-    const call = this.generateText({
+    const runModel = () => this.generateText({
@@ -226 +226,5 @@ export class VercelAIEngine {
-      telemetry: { includeRuntimeContext: { sessionId: true } },
+      telemetry: {
+        includeRuntimeContext: { sessionId: true },
+        recordInputs: false,
+        recordOutputs: false,
+      },
@@ -227,0 +232,10 @@ export class VercelAIEngine {
+    const call = this.softprobeClient
+      ? this.softprobeClient.withObservation(
+          {
+            name: 'travel-agent.turn',
+            asType: 'agent',
+            sessionId: id,
+          },
+          runModel,
+        )
+      : runModel();
diff --git a/travel-agent-demo/src/server.mjs b/travel-agent-demo/src/server.mjs
index f350929..896a98a 100644
--- a/travel-agent-demo/src/server.mjs
+++ b/travel-agent-demo/src/server.mjs
@@ -9 +9,6 @@ import { TRAVEL_POLICY } from './travel-policy.mjs';
-const STATIC = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'] };
+const STATIC = {
+  '/': ['index.html', 'text/html; charset=utf-8'],
+  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
+  '/capture.js': ['capture.bundle.js', 'text/javascript; charset=utf-8'],
+  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
+};
@@ -125 +130 @@ export function createGateway({ root, engine, store, internalToken, travel = new
-    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
+    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://explorer.softprobe.ai; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
diff --git a/travel-agent-demo/src/session-capture.mjs b/travel-agent-demo/src/session-capture.mjs
new file mode 100644
index 0000000..9d5ec97
--- /dev/null
+++ b/travel-agent-demo/src/session-capture.mjs
@@ -0,0 +1,23 @@
+import { RecordSdk } from '@softprobe/web-record';
+
+const storedSessionId = window.sessionStorage.getItem('demo-ota.travel.sessionId');
+const sessionId = /^ses_[A-Za-z0-9_-]+$/.test(storedSessionId ?? '')
+  ? storedSessionId
+  : undefined;
+
+const capture = RecordSdk.init({
+  apiKey: 'spk_REPLACE_WITH_AGENT_KEY',
+  serviceName: 'demo-ota-web',
+  environment: 'demo',
+  sessionId,
+  maskAllInputs: true,
+  httpBodyCapture: {
+    routes: [{ method: 'POST', path: '/agent/api/sessions' }],
+  },
+});
+
+window.addEventListener('travel-agent:session-id', (event) => {
+  if (typeof event.detail?.sessionId === 'string') {
+    capture.setSessionId(event.detail.sessionId);
+  }
+});
diff --git a/travel-agent-demo/src/start.mjs b/travel-agent-demo/src/start.mjs
index 78edc04..4f225e6 100644
--- a/travel-agent-demo/src/start.mjs
+++ b/travel-agent-demo/src/start.mjs
@@ -61 +61,9 @@ async function start() {
-    const [{ registerTelemetry }, { SoftprobeClient }, { SoftprobeVercelAiSdkIntegration }] = await Promise.all([
+    const [
+      { context },
+      { AsyncLocalStorageContextManager },
+      { registerTelemetry },
+      { SoftprobeClient },
+      { SoftprobeVercelAiSdkIntegration },
+    ] = await Promise.all([
+      import('@opentelemetry/api'),
+      import('@opentelemetry/context-async-hooks'),
@@ -65,0 +74 @@ async function start() {
+    context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
@@ -67,0 +77 @@ async function start() {
+    engine.softprobeClient = softprobeClient;
PATCH
```

Replace `spk_REPLACE_WITH_AGENT_KEY` in `travel-agent-demo/src/session-capture.mjs` with the Agent key you copied. The key is visible to browser visitors because it is in frontend code; use only this Agent's ingest-only key. Do not commit your local key.

### 4. Build and start the app

From the `demo-ota` repository root, build the Java service and the browser bundle:

```sh
mvn -B -DskipTests -Dmaven.build.cache.enabled=false package
cd travel-agent-demo
npx esbuild src/session-capture.mjs --bundle --format=iife --outfile=public/capture.bundle.js
cd ..
```

Start the Java service in one terminal:

```sh
cd demo-ota
java -jar travel-ota/target/travel-ota-1.0-SNAPSHOT.jar --server.port=8080
```

Start the Node gateway in another terminal. Set your Agent key and model-provider key:

```sh
cd demo-ota/travel-agent-demo
export SOFTPROBE_PUBLIC_KEY='spk_REPLACE_WITH_AGENT_KEY'
export SOFTPROBE_BASE_URL='https://explorer.softprobe.ai/api/thelake'
export GOOGLE_GENERATIVE_AI_API_KEY='YOUR_MODEL_PROVIDER_KEY'
export TRAVEL_AGENT_PORT=4310
export TRAVEL_OTA_BASE_URL='http://127.0.0.1:8080'
npm start
```

Use a model ID supported by your provider in the app's model selector. The browser uses the same Agent key from `session-capture.mjs`. The Node SDK and OBI read it from `SOFTPROBE_PUBLIC_KEY`.

### 5. Add OBI on the Linux backend host

Install the official OBI `1.0.0` release on the Linux host that runs both services. This version uses OBI Config v2. The config below targets only the demo's Node and Java processes. It lets OBI connect the browser request to the Java backend through Node's HTTP spans, while `@softprobe/vercel-ai-sdk` adds the Agent and model spans. The `OTEL_EBPF_EXCLUDE_OTEL_INSTRUMENTED_SERVICES` setting in the run command lets OBI add its HTTP spans to the Node process, which also exports Vercel AI spans. Set `ARCH` to `amd64` or `arm64`:

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

Save the following as `obi.yaml`, replacing the Agent key. It selects the source demo's Java and Node processes. It captures bodies only for synthetic flight search requests; all other bodies remain excluded.

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
              language_glob: ["java", "nodejs"]
              cmd_args_glob:
                - "*travel-ota-1.0-SNAPSHOT.jar*"
                - "*src/start.mjs*"
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
                  type: body
                  scope: all
                  match:
                    url_path_patterns:
                      - /api/flights/search
                      - /ndc/v21.3/airshopping
                    methods: [POST]
        sql:
          postgres:
            buffer_size: 0
          mysql:
            buffer_size: 0
      runtimes:
        java:
          enabled: true
        nodejs:
          enabled: true
      engine:
        propagation:
          context_propagation: headers
```

Keep the Agent key in a file readable only by the account running OBI:

```sh
chmod 600 obi.yaml
obi config validate ./obi.yaml
sudo env OTEL_EBPF_EXCLUDE_OTEL_INSTRUMENTED_SERVICES=false obi --config=./obi.yaml
```

Header propagation is enabled in this config. See the official [OBI distributed traces guide](https://opentelemetry.io/docs/zero-code/obi/distributed-traces/) for the supported context propagation modes and host requirements.

OBI requires a supported Linux kernel and elevated privileges. For Kubernetes or container deployments, follow the official [OBI setup guide](https://opentelemetry.io/docs/zero-code/obi/setup/) and [Config v2 reference](https://opentelemetry.io/docs/zero-code/obi/configure/config-v2/), and give OBI access to the app processes.

### 6. Search and open the Session Graph

Open [`http://127.0.0.1:4310/agent`](http://127.0.0.1:4310/agent). Select the configured model and send a synthetic request such as:

```text
Find a one-way economy flight from LHR to CDG for tomorrow for Alex Demo. Search only; do not book or pay.
```

In Explorer, open **Sessions**, filter for `travel-ota-source-demo`, and open the newest Session. Select **Graph**. You should see browser requests, the Vercel AI generation and tool spans, Java flight-search spans, and the outbound airline search. Refresh after a few seconds if OBI spans have not arrived yet.

The browser recording and Vercel AI Agent span use the demo's existing `ses_*` conversation ID. OBI's HTTP spans join through trace context. The quick start records synthetic search details only. Browser input masking does not redact HTTP bodies; keep the OBI body allowlist narrow when adapting this example.

Stop OBI, Node, and Java with Ctrl+C when you finish.

## Use your own app

The Travel OTA source is a demo. Replace it with your own app when you are ready to instrument a real workflow.

- Install [`@softprobe/web-record`](https://www.npmjs.com/package/@softprobe/web-record) in the browser app. Initialize `RecordSdk` before API calls, use the Agent's ingest-only key, and allow `https://explorer.softprobe.ai` in the page's `connect-src` policy.
- Install [`@softprobe/vercel-ai-sdk`](https://www.npmjs.com/package/@softprobe/vercel-ai-sdk) and [`@softprobe/tracing`](https://www.npmjs.com/package/@softprobe/tracing) in the Vercel AI server. Pass your existing conversation ID to the browser SDK and the per-turn Agent span, as the patch does.
- Run official OBI with your backend process selector and exact HTTP routes. Keep the default body action `exclude`, then include only routes you want to inspect and redact sensitive fields.

Replace the website origin, backend process selector, and HTTP paths in the examples with your app's values. Do not use a password, cookie, or account token as the Agent key.
