---
title: Vercel AI SDK
---

# Vercel AI SDK

Instrument Node.js applications built with the [Vercel AI SDK](https://sdk.vercel.ai/) using [`@softprobe/vercel-ai-sdk`](/en/agent-qa/reference/softprobe-js#softprobe-vercel-ai-sdk).

Blackbox captures `agent`, `generation`, and `tool` spans from `generateText` and `streamText`, links them to incoming browser requests via W3C `traceparent`, and forwards `traceparent` on downstream `fetch`, `http`, and `https` calls.

## 1. Install

```bash
npm install @softprobe/vercel-ai-sdk @softprobe/tracing
```

## 2. Configure credentials

Set your Agent Ingestion Key (`spk_...`) and OpenTelemetry service name in the server environment, or pass options directly to [`initVercelAiTelemetry`](/en/agent-qa/reference/softprobe-js#initvercelaitelemetryoptions).

```bash
export INGESTION_KEY="spk_REPLACE_WITH_INGESTION_KEY"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer ${INGESTION_KEY}"
export OTEL_EXPORTER_OTLP_TRACES_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="my-vercel-ai-agent"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment.name=production"
```

For staging, set `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` to `https://explorer-staging.softprobe.ai/api/thelake/v1/traces`.

## 3. Initialize at startup

Call `initVercelAiTelemetry()` once before your server starts handling requests or importing AI routes:

```ts
import { initVercelAiTelemetry } from "@softprobe/vercel-ai-sdk";

const telemetry = initVercelAiTelemetry({
  serviceName: "my-vercel-ai-agent",
});
```

Enable telemetry on your `generateText` or `streamText` calls. Pass `sessionId` in `experimental_telemetry.metadata` (or send an `x-session-id` / `x-softprobe-session-id` header) so turns group into a Session:

```ts
import { generateText } from "ai";

const result = await generateText({
  model,
  prompt: "Find flights from LHR to CDG.",
  experimental_telemetry: {
    isEnabled: true,
    metadata: {
      sessionId: chatSessionId,
      userId: currentUserId,
    },
  },
});
```

In short-lived scripts or serverless handlers, flush before exiting:

```ts
await telemetry.forceFlush();
```

## Session and trace correlation

- **Browser to Node.js.** When `@softprobe/web-record` instruments the browser, it injects `traceparent` on API calls. `initVercelAiTelemetry()` extracts `traceparent` and session IDs from `/sessions/:id` paths, `x-session-id` / `x-softprobe-session-id` headers, or baggage, and forwards `traceparent` to downstream services.
- **Standalone calls.** When no incoming session ID or metadata `sessionId` is present, Blackbox starts a trace and leaves `gen_ai.conversation.id` and `session.id` unset instead of inventing a session ID from `trace_id`.

## API reference and related guides

- [`@softprobe/vercel-ai-sdk` API reference](/en/agent-qa/reference/softprobe-js#softprobe-vercel-ai-sdk)
- [`@softprobe/tracing` API reference](/en/agent-qa/reference/softprobe-js#softprobe-tracing)
- [Capture a web app session with HTTP bodies](/en/agent-qa/application-session-capture) for a full-stack walkthrough with `@softprobe/web-record` and OBI
