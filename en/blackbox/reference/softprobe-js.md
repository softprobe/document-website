---
title: JavaScript and TypeScript SDK (softprobe-js)
---

# JavaScript and TypeScript SDK (`softprobe-js`)

API reference for the `@softprobe/*` npm packages at version `0.2.5`. Packages run on Node.js 20 or newer, and `@softprobe/e2e` requires Node.js 22.13 or newer.

| Package | Purpose | Source |
|---------|---------|--------|
| `@softprobe/tracing` | Core OpenTelemetry tracer, observations, generations, OpenAI wrapper, and scores | [`softprobe-js/packages/tracing`](https://github.com/softprobe/softprobe-js/tree/main/packages/tracing) |
| `@softprobe/web-record` | Browser rrweb DOM recording, live semantic UI action spans, same-origin HTTP tracing, and JSON body capture | [`softprobe-js/packages/web-record`](https://github.com/softprobe/softprobe-js/tree/main/packages/web-record) |
| `@softprobe/vercel-ai-sdk` | Vercel AI SDK telemetry integration and HTTP context propagation | [`softprobe-js/packages/vercel-ai-sdk`](https://github.com/softprobe/softprobe-js/tree/main/packages/vercel-ai-sdk) |
| `@softprobe/langchain` | LangChain and LangGraph auto-instrumentation and `CallbackHandler` | [`softprobe-js/packages/langchain`](https://github.com/softprobe/softprobe-js/tree/main/packages/langchain) |
| `@softprobe/opencode-plugin` | OpenCode coding-agent plugin | [`softprobe-js/packages/opencode-plugin`](https://github.com/softprobe/softprobe-js/tree/main/packages/opencode-plugin) |
| `@softprobe/e2e` | Full-stack `@playwright/test` and `e2e` fixtures, W3C distributed-trace assertions, and Blackbox session compilation on Node.js 22.13 or newer | [`softprobe-js/packages/e2e`](https://github.com/softprobe/softprobe-js/tree/main/packages/e2e) |

## `@softprobe/tracing`

Install the core package:

```bash
npm install @softprobe/tracing
```

### `SoftprobeClient`

`SoftprobeClient` configures an OpenTelemetry `NodeTracerProvider`, exports OTLP HTTP/protobuf spans with automatic retries, and sends scores to the Softprobe API.

#### `SoftprobeClient.fromEnv(overrides?)`

Builds a client from standard OpenTelemetry and Softprobe environment variables, merged with optional `overrides` (`Partial<SoftprobeClientOptions>`). Throws `MissingSoftprobeCredentialsError` if no Ingestion Key is found in `overrides.ingestionKey`, `INGESTION_KEY`, `OTEL_EXPORTER_OTLP_TRACES_HEADERS`, or `OTEL_EXPORTER_OTLP_HEADERS`.

```ts
import { SoftprobeClient } from "@softprobe/tracing";

const client = SoftprobeClient.fromEnv({ serviceName: "my-agent" });
```

#### `new SoftprobeClient(options)`

Creates a client from an explicit `SoftprobeClientOptions` object.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ingestionKey` | `string` | Required | Agent Ingestion Key (`spk_...`) |
| `baseUrl` | `string` | `https://explorer.softprobe.ai/api/thelake` | Score API base URL. Does not change the OTLP trace endpoint. |
| `otlp` | `OtlpExportOptions` | `{}` | `{ endpoint?, tracesEndpoint?, protocol?, headers? }` |
| `otlpEndpoint` | `string` | Production traces URL | Legacy alias for `otlp.tracesEndpoint` |
| `resourceAttributes` | `Record<string, ResourceAttributeValue>` | `{}` | Additional OpenTelemetry resource attributes |
| `serviceName` | `string` | `"softprobe-app"` | Sets OpenTelemetry `service.name` |
| `serviceVersion` | `string` | `undefined` | Sets OpenTelemetry `service.version` |
| `environment` | `string` | `undefined` | Sets `deployment.environment.name` |
| `release` | `string` | `undefined` | Default release tag on observations |
| `sessionId` | `string` | `undefined` | Default `gen_ai.conversation.id` and `session.id` |
| `userId` | `string` | `undefined` | Default `user.id` |
| `tags` | `string[]` | `undefined` | Default tags on observations |
| `redactKeys` | `string[]` | `defaultRedactKeys()` | Keys replaced with `[REDACTED]` in captured payloads |
| `timeoutMs` | `number` | `10000` | HTTP timeout in milliseconds |
| `headers` | `Record<string, string>` | `{}` | Additional headers merged into OTLP and score requests |
| `useSimpleProcessor` | `boolean` | `false` | Use `SimpleSpanProcessor` instead of `BatchSpanProcessor` |
| `retryExport` | `boolean` | `true` | Wrap the OTLP exporter in `RetryingSpanExporter` |

`OtlpExportOptions`:

| Field | Type | Description |
|-------|------|-------------|
| `tracesEndpoint` | `string` | Full OTLP HTTP traces URL, used as written |
| `endpoint` | `string` | Generic OTLP base URL. The SDK appends `/v1/traces`. |
| `protocol` | `"http/protobuf"` | Softprobe exporters support `http/protobuf` |
| `headers` | `Record<string, string>` | Additional OTLP request headers (not sent to the score API) |

#### Observation and generation methods

- `startObservation(options: StartObservationOptions): Observation`
- `startGeneration(options: StartGenerationOptions): Generation`
- `startAgent(options)` (sets `asType: "agent"`)
- `startTool(options: StartToolOptions)` (sets `asType: "tool"` and tool attributes such as `toolName`, `toolCallId`, `kind`, `status`, `index`, `mcpServer`, `mcpTool`)
- `startChain(options)`, `startRetriever(options)`, `startEvaluator(options)`, `startEmbedding(options)`, `startGuardrail(options)`, `startEvent(options)`
- `withObservation(options, fn)` and `withGeneration(options, fn)` run `fn` inside the active span context, record any thrown error, and end the span automatically.

`StartObservationOptions` supports `name`, `asType` (`"span" | "event" | "generation" | "agent" | "tool" | "chain" | "retriever" | "evaluator" | "embedding" | "guardrail"`), `attributes`, `input`, `output`, `sessionId`, `userId`, `release`, `tags`, `metadata`, `version`, `traceName`, `parent`, `parentSpanContext` (`{ traceId, spanId }`), `root` (detach from ambient OpenTelemetry context), and `startTime`.

`StartGenerationOptions` adds `model`, `modelParameters` (`{ temperature?, maxTokens? }`), `provider`, `operationName`, `usage` (`{ inputTokens?, outputTokens?, totalTokens? }`), `cost` (`{ input?, output?, total? }`), `completionStartTime`, `prompt`, `promptEvent`, `completionEvent`, and `inferenceDetails`.

#### Context, scores, and lifecycle

- `withAttributes(attributes, fn)` propagates `sessionId`, `userId`, `tags`, `metadata`, `version`, `release`, and `traceName` across async calls via `AsyncLocalStorage`.
- `createScore(options: CreateScoreOptions): Promise<void>` sends a score (`scoreId`, `name`, `dataType`, `source`, `traceId?`, `spanId?`, `sessionId?`, `numericValue?`, `stringValue?`, `booleanValue?`, `comment?`, `configId?`, `authorId?`, `metadata?`) to `baseUrl`.
- `forceFlush(): Promise<void>` (alias `flush()`) flushes pending spans.
- `shutdown(): Promise<void>` flushes and closes the `NodeTracerProvider`.

### `Observation` and `Generation`

- Properties: `spanId`, `traceId`, `otelSpan`.
- `update(options)` updates `attributes`, `input`, `output`, `statusMessage`, or `endTime`. `Generation.update` also accepts `model`, `responseModel`, `modelParameters`, `provider`, `usage`, `cost`, `completionStartTime`, `responseId`, `finishReasons`, `prompt`, `promptEvent`, `completionEvent`, and `inferenceDetails`.
- `setAttributes(attributes)`, `addEvent(name, attributes?)`, `addContentEvent(name, content)`, `recordException(error)`, and `end(options?)`.

### `observeOpenAI(client, config)`

Wraps an OpenAI JS client instance (`client.chat.completions.create`) to emit `generation` spans automatically.

```ts
import OpenAI from "openai";
import { SoftprobeClient, observeOpenAI } from "@softprobe/tracing";

const sp = SoftprobeClient.fromEnv({ serviceName: "openai-app" });
const openai = observeOpenAI(new OpenAI(), {
  softprobeClient: sp,
  sessionId: "sess-1",
});
```

`ObserveOpenAIConfig`: `softprobeClient` (required), `generationName`, `sessionId`, `userId`, `tags`, `release`. Individual `create()` calls can also pass `name`, `sessionId`, `userId`, `metadata`, `tags`, and `release`.

### Utility exports

- `withAttributes(attributes, fn)` and `getPropagatedAttributes()`
- `defaultRedactKeys()` and `redactValue(value, redactKeys, placeholder?)`
- `normalizeToolDefinitions(tools)`, `normalizeToolCalls(toolCalls)`, `recordToolDefinitions(obs, tools)`, `recordToolCalls(obs, toolCalls)`, `toolResultEventPayload(...)`, `accumulateToolCallDeltas(...)`, `finalizeToolCallDeltas(...)`
- `resolveSoftprobeConfigFromEnv(env?)`, `resolveSoftprobeConfigFromObject(obj)`, `deriveOtlpEndpoint(base)`

---

## `@softprobe/web-record`

Browser SDK that records rrweb DOM events, captures live DOM semantic user actions as `softprobe.ui.action` OTLP spans, traces `fetch` and `XMLHttpRequest` calls with W3C `traceparent` propagation, and captures redacted JSON bodies.

```bash
npm install @softprobe/web-record
```

### `RecordSdk.init(options)`

Initializes browser capture once and returns a `WebRecordController`.

```ts
import { RecordSdk } from "@softprobe/web-record";

const recorder = RecordSdk.init({
  ingestionKey: "spk_REPLACE_WITH_INGESTION_KEY",
  serviceName: "my-web",
  otlp: {
    tracesEndpoint: "https://explorer.softprobe.ai/api/thelake/v1/traces",
    protocol: "http/protobuf",
  },
  resourceAttributes: {
    "deployment.environment.name": "production",
  },
});
```

You can also load the UMD bundle in HTML `<head>` with either `data-softprobe-options` for full JSON options or `data-ingestion-key`, along with optional `data-capture-semantic-actions="true"` and `data-input-capture="secrets-only"` attributes:

```html
<script
  src="https://unpkg.com/@softprobe/web-record/dist/browser.js"
  data-softprobe-options='{"ingestionKey":"spk_REPLACE_WITH_INGESTION_KEY","serviceName":"my-web"}'
  defer
></script>
```

#### `WebRecordInitOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ingestionKey` | `string` | Required | Ingest-only key (`spk_...`). Never place user passwords, cookies, or account tokens in browser code. |
| `serviceName` | `string` | `"softprobe-web"` | OpenTelemetry `service.name` for browser spans |
| `otlp` | `OtlpExportOptions` | Production traces URL | Set `otlp.tracesEndpoint` (full URL) or `otlp.endpoint` (base URL) and `protocol: "http/protobuf"` |
| `resourceAttributes` | `ResourceAttributes` | `{}` | Extra resource attributes such as `deployment.environment.name` |
| `environment` | `string` | `undefined` | Shorthand for `deployment.environment.name` |
| `sessionId` | `string` | Auto-detected | Explicit session ID. When omitted, adopts IDs from `sessionStorage`, `/sessions/:id` URLs, or `/sessions` JSON responses. |
| `userId` | `string` | `undefined` | End-user identifier on spans |
| `apiOrigins` | `string[]` | `window.location.origin` | Exact HTTP(S) origins to trace and inject `traceparent` headers into |
| `httpBodyCapture` | `boolean \| HttpBodyCaptureOptions` | `true` | Captures same-origin JSON request and response bodies on a `softprobe.http.body.capture` child span. Pass `false` to disable. |
| `interval` | `number` | `5000` | rrweb flush interval in milliseconds (minimum `5000`) |
| `manual` | `boolean` | `false` | When `true`, do not start rrweb until `recorder.record()` is called |
| `captureSemanticActions` | `boolean` | `false` | Captures live DOM semantic user actions including `navigate`, `click`, `dblclick`, `contextmenu`, `hover`, `fill`, `select`, `check`, `press`, `upload`, `drag`, `scroll`, `dialog`, and `resize` as `softprobe.ui.action` OTLP spans with `sp.observation.type: "ui_action"`, `sp.ui.action.schema: "sp-ui-action-1"`, WAI-ARIA target descriptors, `rrweb` mirror node IDs, causal `causedTraces`, and settled `endAnchors` and `goneAnchors`. Also supported on `<script>` with `data-capture-semantic-actions="true"`. |
| `inputCapture` | `"masked" \| "secrets-only" \| "unmasked"` | `"masked"`, or `"secrets-only"` when `maskAllInputs` is `false` or when `captureSemanticActions` is `true` without `maskAllInputs: true` | Controls input value capture on semantic actions and defaults `maskAllInputs` to `false` when `"secrets-only"` or `"unmasked"` is active unless you pass `maskAllInputs` explicitly. Under `"secrets-only"`, password, payment-card, one-time-code, token, secret, and `secretSlots` inputs emit `{ kind: "secret", slot }` tokens without exporting plaintext values. Also supported on `<script>` with `data-input-capture="secrets-only"`. |
| `secretSlots` | `Readonly<Record<string, string>>` | `undefined` | Maps CSS selectors such as `'input[name="apiKey"]'` to named secret slots such as `"API_KEY"`, consumed as `process.env.SP_SECRET_<SLOT>` in compiled tests |
| `maskAllInputs` | `boolean` | `true`, or `false` when `inputCapture` is `"secrets-only"` or `"unmasked"` | Mask all HTML `<input>` values in DOM recordings |
| `maskTextSelector` | `string` | `undefined` | CSS selector for visible text masked by rrweb |
| `blockSelector` | `string` | `undefined` | CSS selector for DOM regions excluded from rrweb |
| `tags` | `Tags` | `{}` | Browser metadata tags (`userId`, `clientId`, `email`, `phoneNo`, or custom string keys) |
| `softDisable` | `boolean` | `true` | Disable quietly when credentials are incomplete instead of throwing |
| `onUploadStatus` | `(status) => void` | `undefined` | Callback receiving `"idle" | "pending" | "uploaded" | "failed" | "incomplete"` |

#### `HttpBodyCaptureOptions` and `HttpBodyCaptureRoute`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxBodyBytes` | `number` | `65536` | Bodies larger than this byte limit are omitted |
| `routes` | `HttpBodyCaptureRoute[]` | `undefined` | Optional route allowlist. Omit to capture JSON bodies on all traced `apiOrigins`. |

Each `HttpBodyCaptureRoute` accepts:

- `method` (`string`): HTTP method such as `"POST"`.
- `path` (`string`): Relative path (`"/agent/api/sessions/*/messages"`, wildcard `*` segments supported) or full HTTP(S) URL without query string or fragment.
- `origin` (`string`, optional): Exact origin for cross-origin relative paths.
- `redactJsonPaths` (`string[]`, optional): JSONPath expressions such as `["$.paymentDetails.cardNumber"]`. Built-in redaction already replaces `cardNumber`, `cvv`, `cvc`, `password`, and `secret` anywhere in JSON with `[REDACTED]`.

#### `WebRecordController`

`RecordSdk.init()` returns a `WebRecordController` with:

- `enabled` (`boolean`) and `sessionId` (`string`) and `uploadStatus` (`RecordingUploadStatus`)
- `record(opts?: { tags?: Tags }): RecordingHandle | null`
- `stop(): void`
- `setTags(tags: Tags, override?: boolean): void`
- `setSessionId(sessionId: string): void | Promise<void>`
- `flush(): Promise<boolean>`

---

## `@softprobe/vercel-ai-sdk`

Integrates Vercel AI SDK `generateText`, `streamText`, and tool calls with Softprobe and propagates W3C `traceparent` and session IDs across Node.js HTTP requests.

```bash
npm install @softprobe/vercel-ai-sdk @softprobe/tracing
```

### `initVercelAiTelemetry(options?)`

Creates a `SoftprobeVercelAiSdkIntegration`, installs incoming/outgoing HTTP context propagation, and registers the integration with the `ai` package (`registerTelemetry`).

```ts
import { initVercelAiTelemetry } from "@softprobe/vercel-ai-sdk";

const telemetry = initVercelAiTelemetry({
  ingestionKey: "spk_REPLACE_WITH_INGESTION_KEY",
  serviceName: "travel-agent",
});
```

#### `SoftprobeVercelAiSdkIntegrationOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ingestionKey` | `string` | `INGESTION_KEY` or OTLP header | Agent Ingestion Key (`spk_...`) |
| `serviceName` | `string` | `OTEL_SERVICE_NAME` or `"softprobe-app"` | OpenTelemetry `service.name` for the AI server |
| `otlp` | `OtlpExportOptions` | Env OTLP vars or production URL | Trace exporter endpoint, protocol, and headers |
| `resourceAttributes` | `ResourceAttributes` | Env `OTEL_RESOURCE_ATTRIBUTES` | Additional OpenTelemetry resource attributes |
| `environment` | `string` | `SOFTPROBE_ENVIRONMENT` | Sets `deployment.environment.name` |
| `baseUrl` | `string` | `SOFTPROBE_BASE_URL` | Optional score API base URL |
| `tracer` | `Tracer` | Created from `SoftprobeClient` | Bring-your-own OpenTelemetry `Tracer` |
| `useSimpleProcessor` | `boolean` | `false` | Flush spans synchronously when each span ends |

#### Other exports

- `SoftprobeVercelAiSdkIntegration`: Class with `forceFlush()`, `shutdown()`, `executeTool()`, `executeLanguageModelCall()`, and AI SDK lifecycle hooks (`onStart`, `onStepStart`, `onLanguageModelCallStart`, `onLanguageModelCallEnd`, `onToolExecutionStart`, `onToolExecutionEnd`, `onEnd`, `onAbort`, `onError`).
- `SoftprobeVercelAiSpanProcessor`: OpenTelemetry `SpanProcessor` that normalizes Vercel AI spans (`ai.*`) into Softprobe `agent`, `generation`, `tool`, `embedding`, and `retriever` observations.
- `installIncomingHttpContextPropagation(options?)`: Patches Node `http`, `https`, and `fetch` to extract incoming `traceparent`, `baggage`, and session headers (`x-softprobe-session-id`, `x-session-id`, `x-conversation-id`, `x-thread-id`, `x-chat-id`) and forward `traceparent` on outgoing downstream calls (skipping OTLP collector URLs).
- `createSoftprobeObservationAttributes(params)`: Builds Softprobe observation attributes for custom AI SDK telemetry delegates.

---

## `@softprobe/langchain`

LangChain and LangGraph tracing for TypeScript and Node.js. See the [LangChain install guide](/en/blackbox/langchain) for setup steps.

```bash
npm install @softprobe/langchain @softprobe/tracing @langchain/core
```

Importing `@softprobe/langchain` calls `autoInstrumentFromEnv()` automatically when OTLP credentials are present, unless `SOFTPROBE_LANGCHAIN` is `0`, `false`, `off`, or `no`.

### Exports

- `instrument(params?: CallbackHandlerParams): CallbackHandler`: Registers a LangChain configure hook so all runs in the async context are traced.
- `uninstrument(): void`: Clears the active LangChain hook handler.
- `isInstrumented(): boolean` and `getHandler(): CallbackHandler | null`.
- `autoInstrumentFromEnv(params?, env?): CallbackHandler | null`.
- `CallbackHandler`: Extends `@langchain/core/callbacks/base` `BaseCallbackHandler`.
  - Constructor `CallbackHandlerParams`: `softprobeClient?`, `sessionId?`, `userId?`, `tags?`, `metadata?`, `version?`, `parentSpanContext?`.
  - `handler.flush(): Promise<void>` flushes pending spans.
  - `handler.lastTraceId` exposes the most recent trace ID.

---

## `@softprobe/opencode-plugin`

OpenCode plugin that sends coding-agent turns, model generations, tool calls, and sub-agent tasks to Softprobe. See the [OpenCode install guide](/en/blackbox/opencode) for `opencode.json` and `opencode-softprobe.json` configuration.

---

## `@softprobe/e2e`

Full-stack UI testing SDK for `@playwright/test` and `e2e` on Node.js 22.13 or newer. Correlates browser requests through W3C `traceparent` headers, asserts outgoing backend `CLIENT` HTTP calls through `BlackboxSink`, and compiles recorded Blackbox sessions into runnable test suites. For workflow steps, see [Softprobe UI Testing](/en/ui-testing/) and [How to generate UI tests from recorded sessions](/en/ui-testing/from-sessions).

Blackbox session and trace lookups use `SOFTPROBE_API_KEY`, a Softprobe API Key with read access to the session workspace. The Agent Ingestion Key is for sending telemetry and cannot read sessions.

```bash
npm install -D @softprobe/e2e @playwright/test
```

For `e2e` suites, also install `e2e@0.24.0`, `@e2e-dev/web@0.16.1`, and `zod`.

### Core exports

- `softprobeWeb(options?)` wraps `@e2e-dev/web` with Playwright `browser.route` W3C `traceparent` correlation, preserving existing `@softprobe/web-record` headers or minting a fallback header, and binds the `trace` test fixture.
- `softprobeReporter()` writes verified trace summaries to `.e2e/softprobe-traces.json` under `schemaVersion: "softprobe-traces-1"`.
- `softprobeCachedAgent(options?)` returns an `AgentConfig` that replays pre-seeded `.e2e/cache/` `trace-1` entries with zero model calls and forwards uncached `agent.act` steps when you pass `options.model`.
- Re-exported `e2e` bindings include `test`, `describe`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`, `expect`, `credentials`, `secrets`, `unique`, `AgentError`, and `isAgentError`.

#### `SoftprobeWebOptions`

Extends `@e2e-dev/web` `WebOptions`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sink` | `SoftprobeSinkConfig` | Resolved from options and env | Explicit Blackbox sink `{ kind: "blackbox", endpoint, softprobeApiKey?, workspaceId?, explorerUrl? }` |
| `endpoint` | `string` | `SOFTPROBE_SINK_ENDPOINT`, `SOFTPROBE_TRACE_ENDPOINT`, `SOFTPROBE_URL`, or `https://explorer.softprobe.ai/api/thelake` | Blackbox trace query base URL |
| `softprobeApiKey` | `string` | `SOFTPROBE_API_KEY` | Softprobe API Key for Blackbox session and trace queries |
| `workspaceId` | `string` | `undefined` | Optional `X-Workspace-Id` header for self-hosted Blackbox endpoints; hosted API keys resolve their workspace |
| `explorerUrl` | `string` | `SOFTPROBE_EXPLORER_URL` or derived from `endpoint` | Base URL for `explorerTraceUrl` links |
| `apiOrigins` | `readonly (string \| RegExp)[]` | `[app.url]` | Origins matched by `browser.route` for `traceparent` correlation |
| `pollTimeoutMs` | `number` | `30000` | Maximum milliseconds to poll for the backend `SERVER` span and matching `CLIENT` call, also accepted as `traceTimeoutMs` |
| `pollIntervalMs` | `number` | `250` | Delay in milliseconds between Blackbox trace polls |
| `settleMs` | `number` | `150` | Post-`SERVER` observation window in milliseconds for `trace.expectNoOutboundHttp` |

### `TraceScope` fixture and errors

- `trace.outboundHttp(query)` waits for the backend `SERVER` entry span of the latest browser request matching `query.triggeredBy`, then polls until an outgoing `CLIENT` HTTP span matches `url`, optional `method`, optional `status`, and optional `serviceName`.
- `trace.expectNoOutboundHttp(query?)` confirms that every matching browser request reached its backend `SERVER` span and produced zero matching outgoing `CLIENT` HTTP calls after `settleMs`.
- `trace.window(fn)` runs `fn` and returns a child `TraceScope` restricted to browser requests captured while `fn` ran.
- `TraceInstrumentationError` and `isTraceInstrumentationError(value)` report `code: "TRACE_INSTRUMENTATION_MISSING"` when the backend `SERVER` span does not arrive within `pollTimeoutMs`.
- `TraceAssertionError` and `isTraceAssertionError(value)` report `code: "TRACE_ASSERTION_FAILED"` when the backend `SERVER` span arrived and the outbound HTTP assertion failed, exposing captured spans in `observedCalls`.
- `isTraceId(value)` and `isSpanId(value)` validate 32-character lowercase hex `TraceId` values and 16-character lowercase hex `SpanId` values.

### `@softprobe/e2e/playwright` exports

Import from `@softprobe/e2e/playwright` to attach the `trace` fixture in `@playwright/test` suites over `context.route` without colliding with Playwright's built-in `use.trace` option:

- `test` and `expect` provide an extended `@playwright/test` test runner with `{ trace, softprobeTrace, softprobe }` fixtures and Playwright's `expect`.
- `extendPlaywrightTest(base?, defaultOptions?)` extends a custom Playwright `TestType` with the `softprobe` option and `trace` fixture.
- `createPlaywrightTraceScope(target, options?)` attaches `traceparent` route correlation directly to a Playwright `BrowserContext` or `Page` and returns `{ trace, dispose() }`.
- `SoftprobePlaywrightOptions` and `SoftprobePlaywrightFixtures` type `use.softprobe` in `playwright.config.ts`, accepting `sink`, `endpoint`, `softprobeApiKey`, `workspaceId`, `explorerUrl`, `apiOrigins`, `baseUrl`, `pollTimeoutMs`, `traceTimeoutMs`, `pollIntervalMs`, `settleMs`, and `env`.

### `@softprobe/e2e/session-compiler` exports

`@softprobe/e2e/session-compiler` compiles recorded `softprobe.ui.action` spans and correlated backend traces into runnable test suites:

- `extractSessionBundleFromSpans(rawInput, options?)` normalizes OTLP or Blackbox session spans into an ordered `CompiledSessionBundle` with inferred dynamic label patterns, `secretSlots`, and `backendTraces`.
- `fetchSessionSpansFromBlackbox(options)` queries session spans and correlated traces from Blackbox Explorer or TheLake.
- `compileSessionToPlaywright(bundle, options?)` emits a `@playwright/test` `.spec.ts` file and optional `playwright.config.ts` wired to `@softprobe/e2e/playwright`.
- `compileSessionToE2E(bundle, options?)` emits a `.e2e.ts` spec, `e2e.config.ts`, and pre-seeded `.e2e/cache/<sha256>.json` `trace-1` cache entries.
- `softprobeCachedAgent(options?)` configures zero-LLM `.e2e/cache/` replay and is also re-exported from `@softprobe/e2e`.

### `softprobe-compile-session` CLI

`@softprobe/e2e` ships the `softprobe-compile-session` executable at `@softprobe/e2e/bin/compile-session.js`:

```bash
npx --package=@softprobe/e2e softprobe-compile-session --session-id <id> --runner playwright
```

For hosted Blackbox queries, export `SOFTPROBE_API_KEY` before running the command. The key resolves the workspace; you do not need to supply a workspace ID.

| Flag | Default | Description |
|------|---------|-------------|
| `--session-id <id>` | None | Blackbox session ID to fetch and compile |
| `--session-file <path>` | None | Local session spans JSON file to compile offline |
| `--runner <playwright\|e2e>` | `"playwright"` | Target test runner |
| `--out <dir>` | `"."` | Output directory for generated files |
| `--target-url <url>` | Session origin or `"http://127.0.0.1:3000"` | Base URL of the application under test |
| `--endpoint <url>` | `SOFTPROBE_SINK_ENDPOINT` or `https://explorer.softprobe.ai/api/thelake` | Blackbox Explorer or TheLake API endpoint |
| `--workspace-id <id>` | None | Optional `X-Workspace-Id` header for self-hosted Blackbox endpoints |
| `--project-id <id>` | `"softprobe-compiled-e2e"` | `e2e` `projectId` when `--runner` is `e2e` |
| `--app-identity <name>` | `"softprobe-recorded-app"` | `e2e` `app.identity` when `--runner` is `e2e` |
| `--force` | `false` | Overwrites existing test and configuration files, while content-addressed `.e2e/cache/<sha256>.json` entries always refresh idempotently |
| `--json` | `false` | Writes a JSON summary containing `ok`, `runner`, `sessionId`, `actionCount`, `outboundAssertionCount`, `filesWritten`, and `cacheFilesWritten` to stdout |

---

## Environment variables

All Node.js packages (`@softprobe/tracing`, `@softprobe/vercel-ai-sdk`, `@softprobe/langchain`, `@softprobe/opencode-plugin`) share these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `INGESTION_KEY` | Agent Ingestion Key for OTLP trace ingestion and score submissions | Parsed from `Authorization` header if omitted |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Full OTLP HTTP traces URL, used as written | `https://explorer.softprobe.ai/api/thelake/v1/traces` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base OTLP URL; `/v1/traces` is appended | None |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | Comma-separated `key=value` headers (for example `Authorization=Bearer spk_...`) | Overrides `OTEL_EXPORTER_OTLP_HEADERS` |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` | OTLP protocol (`http/protobuf`) | `http/protobuf` |
| `OTEL_SERVICE_NAME` | OpenTelemetry `service.name` (`SOFTPROBE_SERVICE_NAME` also accepted) | `"softprobe-app"` |
| `OTEL_RESOURCE_ATTRIBUTES` | Comma-separated resource attributes (for example `deployment.environment.name=staging`) | None |
| `SOFTPROBE_BASE_URL` | REST API base for `createScore` only. Does not change trace routing. | `https://explorer.softprobe.ai/api/thelake` |
| `SOFTPROBE_ENVIRONMENT` | Sets `deployment.environment.name` | None |
| `SOFTPROBE_SESSION_ID` | Fallback session ID when no run or request session ID is present | None |
| `SOFTPROBE_USER_ID` | Fallback user ID | None |
| `SOFTPROBE_LANGCHAIN` | Set to `0`, `false`, `off`, or `no` to disable `@softprobe/langchain` auto-instrumentation | Enabled when credentials exist |
