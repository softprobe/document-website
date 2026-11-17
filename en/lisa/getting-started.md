# Getting started with Lisa

Run Lisa locally with PostgreSQL, the Python service, and the built-in React frontend.

## Prerequisites

- Python 3.12+ and `uv`
- Node.js 22+
- Docker (or a local PostgreSQL instance with PGMQ support)

## 1. Install dependencies

From the `lisa/` repository root:

```sh
cp .env.example .env
uv sync --extra test
npm --prefix frontend ci
```

## 2. Provision the database and start Lisa

Provision the PostgreSQL schema and roles, then start the FastAPI service:

```sh
uv run python scripts/provision_lisa.py
uv run uvicorn lisa.app:app --reload --app-dir src --port 8082
```

Open `http://127.0.0.1:8082/` to access the Lisa UI and API on the same origin.

## 3. Push a session trace

Push a complete OTLP JSON session bundle to the private intake endpoint:

```sh
curl -X POST http://127.0.0.1:8082/internal/v1/session-traces \
  -H "Content-Type: application/json" \
  -d @session-otlp.json
```

Lisa returns `202 Accepted` once both filesystem persistence and PGMQ queue insertion succeed.

## Container build

To build the self-contained service image (which bundles the frontend):

```sh
docker build -t lisa:local .
```
