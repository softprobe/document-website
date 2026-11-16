---
title: Python SDK (softprobe-py)
---

# Python SDK (`softprobe-py`)

API reference for the `softprobe` Python package (version `0.1.0`, Python 3.10 or newer). Source lives in [`softprobe/softprobe-py`](https://github.com/softprobe/softprobe-py).

## Installation

```bash
pip install softprobe
```

Install optional extras when using LangChain or OpenAI:

```bash
pip install 'softprobe[langchain]'
pip install 'softprobe[openai]'
```

---

## `SoftprobeClient`

`softprobe.SoftprobeClient` initializes an OpenTelemetry `TracerProvider`, exports OTLP HTTP/protobuf spans, and sends evaluation scores.

### `SoftprobeClient.from_env(**overrides)`

Builds a client from `INGESTION_KEY`, `OTEL_EXPORTER_OTLP_*`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, and `SOFTPROBE_*` environment variables, applying any keyword `overrides`.

```python
from softprobe import SoftprobeClient

client = SoftprobeClient.from_env(service_name="my-agent")
```

### `SoftprobeClient(...)`

Keyword-only constructor options:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ingestion_key` | `str \| None` | `None` | Agent Ingestion Key (`spk_...`) |
| `base_url` | `str` | `"https://explorer.softprobe.ai/api/thelake"` | Score API base URL. Does not change the OTLP trace endpoint. |
| `otlp_endpoint` | `str \| None` | `None` | Legacy alias for `otlp["traces_endpoint"]` |
| `otlp` | `Mapping[str, Any] \| None` | `None` | Keys: `endpoint`, `traces_endpoint`, `protocol` (`"http/protobuf"`), `headers` |
| `resource_attributes` | `Mapping[str, Any] \| None` | `None` | Additional OpenTelemetry resource attributes |
| `service_name` | `str` | `"softprobe-app"` | OpenTelemetry `service.name` |
| `service_version` | `str \| None` | `None` | OpenTelemetry `service.version` |
| `environment` | `str \| None` | `None` | Sets `deployment.environment.name` |
| `release` | `str \| None` | `None` | Default release tag on observations |
| `session_id` | `str \| None` | `None` | Default `gen_ai.conversation.id` and `session.id` |
| `user_id` | `str \| None` | `None` | Default `user.id` |
| `tags` | `list[str] \| None` | `None` | Default tags on observations |
| `redact_keys` | `list[str] \| None` | `default_redact_keys()` | Keys replaced with `[REDACTED]` |
| `timeout_ms` | `int` | `10_000` | HTTP timeout in milliseconds |
| `headers` | `Mapping[str, str] \| None` | `None` | Extra HTTP headers for OTLP and score requests |
| `use_simple_processor` | `bool` | `False` | Use `SimpleSpanProcessor` instead of `BatchSpanProcessor` |

### Context managers and starters

Use `observation`, `generation`, `async_observation`, or `async_generation` for automatic span lifecycle and exception recording:

```python
with client.observation(name="agent", as_type="agent", session_id="thread-1") as agent:
    with client.generation(
        name="llm-call",
        parent=agent,
        model="gpt-4o-mini",
        provider="openai",
        input={"messages": [{"role": "user", "content": "hi"}]},
        output={"content": "hello"},
        usage={"input_tokens": 10, "output_tokens": 5},
    ):
        pass
```

Manual start methods return an `Observation` or `Generation` that you end explicitly with `.end()`:

- `start_observation(*, name, as_type="span", attributes=None, input=None, output=None, session_id=None, user_id=None, release=None, tags=None, metadata=None, version=None, trace_name=None, parent=None, trace_context=None, start_time=None) -> Observation`
- `start_generation(*, name, **kwargs) -> Generation`
- `start_agent(*, name, **kwargs) -> Observation`
- `start_tool(*, name, tool_name=None, tool_call_id=None, kind=None, status=None, index=None, mcp_server=None, mcp_tool=None, attributes=None, **kwargs) -> Observation`
- `start_chain`, `start_retriever`, `start_evaluator`, `start_embedding`, `start_guardrail`, `start_event`

Supported `OBSERVATION_TYPES`: `"span"`, `"event"`, `"generation"`, `"agent"`, `"tool"`, `"chain"`, `"retriever"`, `"evaluator"`, `"embedding"`, `"guardrail"`.

### Scores and lifecycle

- `create_score(*, score_id, name, data_type, source, timestamp=None, trace_id=None, span_id=None, session_id=None, numeric_value=None, string_value=None, boolean_value=None, comment=None, config_id=None, author_id=None, metadata=None) -> None`
- `force_flush(timeout_millis=30_000) -> bool` (alias `flush`)
- `shutdown() -> None`
- `client.tracer` exposes the underlying OpenTelemetry `Tracer`.

---

## `Observation` and `Generation`

Returned by `SoftprobeClient` context managers and `start_*` methods.

### `Observation` (`softprobe.observation.Observation`)

- Properties: `span_id: str`, `trace_id: str`, `otel_span: Span`.
- `update(*, attributes=None, input=None, output=None, status_message=None, session_id=None, user_id=None, release=None, tags=None) -> Observation`
- `set_attributes(attributes) -> Observation`
- `add_event(name, attributes=None) -> Observation`
- `add_content_event(name, content) -> Observation`
- `record_exception(error) -> Observation`
- `end(*, attributes=None, input=None, output=None, status_message=None, end_time=None) -> None`
- `attach() -> None`

### `Generation` (`softprobe.observation.Generation`)

Extends `Observation`. `update(...)` and `end(...)` accept these additional keyword arguments:

- `model`, `response_model`, `provider`, `operation_name`
- `temperature`, `max_tokens`
- `usage` (`{"input_tokens": int, "output_tokens": int, "total_tokens": int}`)
- `cost` (`{"input": float, "output": float, "total": float}`)
- `completion_start_time`, `response_id`, `finish_reasons`
- `prompt`, `prompt_event`, `completion_event`, `inference_details`

---

## OpenAI and Gemini (`softprobe.openai`)

Wrap an `OpenAI` client with `observe_openai` to record `generation` spans for `client.chat.completions.create(...)`:

```python
from openai import OpenAI
from softprobe import SoftprobeClient
from softprobe.openai import observe_openai

sp = SoftprobeClient.from_env(service_name="openai-service")
client = observe_openai(OpenAI(), softprobe_client=sp, session_id="thread-1")

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "What is 1+1?"}],
    name="math-task",
)
print(client.last_generation_trace_id, client.last_generation_span_id)
sp.force_flush()
```

### Functions

- `observe_openai(client, *, softprobe_client, generation_name="OpenAI-generation", session_id=None, user_id=None, tags=None, release=None)`
  - Accepts Softprobe per-call kwargs on `create(...)`: `name`, `session_id`, `user_id`, `metadata`, `tags`, `release`, `softprobe_prompt`.
  - Exposes `last_generation_span_id` and `last_generation_trace_id` on the wrapped client.
- `create_openai_client(*, api_key=None, base_url=None, **kwargs)`
- `create_gemini_openai_client(*, api_key=None, model="gemini-2.5-flash", **kwargs)` (targets `https://generativelanguage.googleapis.com/v1beta/openai/`)

---

## LangChain and LangGraph (`softprobe.langchain`)

See the [LangChain install guide](/en/agent-qa/langchain) for setup and troubleshooting.

### Auto-instrumentation

Importing `softprobe.langchain` calls `auto_instrument_from_env()` automatically when OTLP credentials are set, unless `SOFTPROBE_LANGCHAIN` is `0`, `false`, `off`, or `no`.

- `instrument(**handler_kwargs) -> CallbackHandler`
- `uninstrument() -> None`
- `is_instrumented() -> bool`
- `get_handler() -> CallbackHandler | None`

### `CallbackHandler`

```python
CallbackHandler(
    *,
    softprobe_client: SoftprobeClient | None = None,
    session_id: str | None = None,
    user_id: str | None = None,
    tags: list[str] | None = None,
    metadata: Mapping[str, Any] | None = None,
    version: str | None = None,
    trace_context: Mapping[str, str] | None = None,
)
```

- `handler.flush(timeout_millis=30_000) -> bool`
- `handler.last_trace_id` (`str | None`)
- Resolves `session_id` from `config["configurable"]` or metadata keys `thread_id`, `threadId`, `session_id`, `sessionId`, `conversation_id`, `conversationId`, `chat_id`, and `chatId`.
- Resolves `user_id` from `user_id`, `userId`, and `user`.

---

## Context and propagation (`softprobe.propagation`)

Propagate session identity and W3C `traceparent` / `baggage` headers across async boundaries and HTTP services:

- `propagate_attributes(*, session_id=None, user_id=None, tags=None, metadata=None, version=None, release=None, trace_name=None)`: Context manager that attaches attributes to nested observations and stamps W3C `baggage` with `sp.session.id`.
- `inject_trace_headers(headers=None, *, context=None) -> dict[str, str]`: Injects `traceparent`, `tracestate`, and `baggage` (`sp.session.id=...`).
- `extract_trace_headers(headers) -> Generator[Context, None, None]`: Context manager that activates extracted incoming W3C trace and baggage headers.
- `get_baggage_session_id(context=None) -> str | None`
- `BaggageSessionSpanProcessor`: OpenTelemetry `SpanProcessor` (attached by `SoftprobeClient`) that stamps `sp.session.id` and `gen_ai.conversation.id` onto spans from active W3C baggage when no explicit session ID is set.
- `BAGGAGE_SESSION_KEY = "sp.session.id"`

---

## Tool, redaction, and score helpers

- `default_redact_keys() -> list[str]` returns `["password", "api_key", "authorization", "secret", "token"]`.
- `redact_value(value, redact_keys, placeholder="[REDACTED]")`
- `normalize_tool_definitions(tools)`, `normalize_tool_calls(tool_calls)`, `record_tool_definitions(observation, tools)`, `record_tool_calls(observation, tool_calls)`
- `tool_result_event_payload(*, name, content, tool_call_id=None, role="tool")`
- `accumulate_tool_call_deltas(state, deltas)` and `finalize_tool_call_deltas(state)`
- `build_score_request(...)`

---

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `INGESTION_KEY` | Bearer token for OTLP trace export and score API | Parsed from `Authorization` header if omitted |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Full OTLP HTTP traces URL, used as written | `https://explorer.softprobe.ai/api/thelake/v1/traces` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base OTLP URL; `/v1/traces` is appended | None |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | Comma-delimited `key=value` headers | Overrides `OTEL_EXPORTER_OTLP_HEADERS` |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` | OTLP protocol (`http/protobuf`) | `http/protobuf` |
| `OTEL_SERVICE_NAME` | OpenTelemetry `service.name` (`SOFTPROBE_SERVICE_NAME` also accepted) | `"softprobe-app"` |
| `OTEL_RESOURCE_ATTRIBUTES` | Comma-delimited resource attributes (for example `deployment.environment.name=staging`) | None |
| `SOFTPROBE_BASE_URL` | REST API base for `create_score` only. Does not change trace routing. | `https://explorer.softprobe.ai/api/thelake` |
| `SOFTPROBE_ENVIRONMENT` | Sets `deployment.environment.name` | None |
| `SOFTPROBE_SESSION_ID` | Fallback session ID when no run or context session ID is set | None |
| `SOFTPROBE_USER_ID` | Fallback user ID | None |
| `SOFTPROBE_LANGCHAIN` | Set to `0`, `false`, `off`, or `no` to disable `softprobe.langchain` auto-instrumentation | Enabled when credentials exist |
