# Capture a web app session with HTTP bodies

This source walkthrough shows how a developer adds all three capture paths to an app: browser recording with `@softprobe/web-record`, Vercel AI spans with `@softprobe/vercel-ai-sdk`, and backend HTTP spans and selected bodies with official OpenTelemetry eBPF Instrumentation (OBI). With the prerequisites ready, the code changes take about five minutes; the first dependency install and build can take longer.

The official Travel OTA demo is also published as the [`docker.io/softprobe/demo-ota:v1.3.1` image](https://hub.docker.com/r/softprobe/demo-ota). This guide checks out the [`v1.3.1 source on GitHub`](https://github.com/softprobe/demo-ota/tree/v1.3.1) so you can add the SDKs to the app code. The published image is plain and has no Softprobe instrumentation. This is a demo; you can use your own app by replacing its site origin, routes, and OBI process selector with your app's values.

## Instrument and run the source demo

For the full browser, Vercel AI, and OBI journey, run the Node gateway and Java service on the same supported Linux host so OBI can trace requests through both processes. OBI requires Linux. If the host has a desktop, open the demo there in Chrome or Chromium. For a remote Linux host, forward port `4310` to your workstation and open the forwarded `127.0.0.1` address in your local browser.

You need Node.js 22 or newer, Java 21, Maven, Chrome or Chromium, a Softprobe Explorer workspace, and a Google Gemini API key. Model-provider charges may apply. Use only synthetic travel details in this demo.

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

### 3. Instrument the browser app

The demo's frontend is a classic JavaScript script, so keep the npm import in a small module and bundle it with esbuild. Create `travel-agent-demo/src/session-capture.mjs` with this code, replacing the placeholder with the Agent's ingest-only key:

```js
import { RecordSdk } from '@softprobe/web-record';

const storedSessionId = window.sessionStorage.getItem('demo-ota.travel.sessionId');
const sessionId = /^ses_[A-Za-z0-9_-]+$/.test(storedSessionId ?? '')
  ? storedSessionId
  : undefined;

window.softprobeCapture = RecordSdk.init({
  apiKey: 'spk_REPLACE_WITH_AGENT_KEY',
  serviceName: 'demo-ota-web',
  environment: 'demo',
  sessionId,
  maskAllInputs: true,
  httpBodyCapture: {
    routes: [{ method: 'POST', path: '/agent/api/sessions' }],
  },
});
```

The SDK records the page and same-origin requests. It starts with the demo's saved conversation ID after a reload. When the app creates its first conversation, the browser recorder needs that new ID too. In `travel-agent-demo/public/app.js`, find `storeSession(created.id)` in the async message handler and add this immediately after it:

```js
await window.softprobeCapture?.setSessionId(created.id);
```

The capture bundle exposes the controller returned by `RecordSdk.init()` so the demo's classic script can call the SDK directly. Awaiting `setSessionId()` lets the SDK finish pending exports and switch to the same `ses_*` ID the backend uses before the app sends its next request. The optional call also lets the demo's existing UI tests run without the capture bundle. The example captures the JSON body only when the browser creates a conversation. Input masking protects the recording; it does not redact HTTP bodies.

In `travel-agent-demo/public/index.html`, add the capture script immediately before the existing `/agent/app.js` script so the SDK controller is available before the app runs:

```html
<script src="/agent/capture.js" defer></script>
```

In `travel-agent-demo/src/server.mjs`, add this entry to the existing `STATIC` map so `/agent/capture.js` serves the browser bundle:

```js
'/capture.js': ['capture.bundle.js', 'text/javascript; charset=utf-8'],
```

Also add the Explorer origin to the existing `connect-src` directive in the Content Security Policy:

```text
connect-src 'self' https://explorer.softprobe.ai;
```

The bundled browser SDK uses this permission to send spans and recordings to Explorer. The website itself remains same-origin. Although the Agent key is in the browser bundle, it is an ingest-only key; never put a user password, cookie, or account token there, and do not commit your local key value.

### 4. Instrument the Vercel AI backend

The demo already registers the Vercel AI integration when `SOFTPROBE_PUBLIC_KEY` and `SOFTPROBE_BASE_URL` are set. In `travel-agent-demo/src/start.mjs`, replace the current contents of that `if` block with this code:

```js
const [
  { context },
  { AsyncLocalStorageContextManager },
  { registerTelemetry },
  { SoftprobeClient },
  { SoftprobeVercelAiSdkIntegration },
] = await Promise.all([
  import('@opentelemetry/api'),
  import('@opentelemetry/context-async-hooks'),
  import('ai'),
  import('@softprobe/tracing'),
  import('@softprobe/vercel-ai-sdk'),
]);

context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
softprobeClient = SoftprobeClient.fromEnv({ serviceName: 'demo-ota-travel-agent' });
registerTelemetry(new SoftprobeVercelAiSdkIntegration({ tracer: softprobeClient.tracer }));
engine.softprobeClient = softprobeClient;
```

The async context manager carries the current trace across model and tool calls. The Vercel AI integration creates the generation and tool spans; the Softprobe client provides a parent Agent observation with the app's conversation ID.

In `travel-agent-demo/src/engine.mjs`, find the `this.generateText({ ... })` call in the message handler. Change it to `const runModel = () => this.generateText({ ... })`, and set the telemetry options as shown:

```js
telemetry: {
  includeRuntimeContext: { sessionId: true },
  recordInputs: false,
  recordOutputs: false,
},
```

After that call closes, before `session.busy = true`, add the parent observation:

```js
const call = this.softprobeClient
  ? this.softprobeClient.withObservation(
      {
        name: 'travel-agent.turn',
        asType: 'agent',
        sessionId: id,
      },
      runModel,
    )
  : runModel();
```

The observation makes each app turn a Session Graph parent. Inputs and outputs stay disabled in Vercel AI telemetry; the demo's selected HTTP bodies are configured separately in the browser SDK and OBI.

### 5. Build and start the app

From the `demo-ota` repository root, build the Java service and the browser bundle:

```sh
mvn -B -DskipTests -Dmaven.build.cache.enabled=false package
cd travel-agent-demo
npx esbuild src/session-capture.mjs --bundle --format=iife --outfile=public/capture.bundle.js
cd ..
```

Open two terminals at the `demo-ota` repository root. Start the Java service in the first:

```sh
java -jar travel-ota/target/travel-ota-1.0-SNAPSHOT.jar --server.port=8080
```

In the second terminal, start the Node gateway. Set your Agent key and model-provider key:

```sh
cd travel-agent-demo
export SOFTPROBE_PUBLIC_KEY='spk_REPLACE_WITH_AGENT_KEY'
export SOFTPROBE_BASE_URL='https://explorer.softprobe.ai/api/thelake'
export GOOGLE_GENERATIVE_AI_API_KEY='YOUR_MODEL_PROVIDER_KEY'
export TRAVEL_AGENT_PORT=4310
export TRAVEL_OTA_BASE_URL='http://127.0.0.1:8080'
npm start
```

Use a model ID supported by your provider in the app's model selector. The browser uses the same Agent key you added to `src/session-capture.mjs`. The Node SDK and OBI read it from `SOFTPROBE_PUBLIC_KEY`.

### 6. Add OBI on the Linux backend host

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

### 7. Search and open the Session Graph

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
- Install [`@softprobe/vercel-ai-sdk`](https://www.npmjs.com/package/@softprobe/vercel-ai-sdk) and [`@softprobe/tracing`](https://www.npmjs.com/package/@softprobe/tracing) in the Vercel AI server. Pass your existing conversation ID to the browser SDK and the per-turn Agent span.
- Run official OBI with your backend process selector and exact HTTP routes. Keep the default body action `exclude`, then include only routes you want to inspect and redact sensitive fields.

Replace the website origin, backend process selector, and HTTP paths in the examples with your app's values. Do not use a password, cookie, or account token as the Agent key.
