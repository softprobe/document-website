# spcode-web

Deploy the Softprobe **sp-web UI** (`spcode-web`) after [sp-backend](./sp-backend-helm.md) is healthy.

The container runs **nginx + spcode only** — no MongoDB, Redis, or embedded `sp-boot`. Nginx proxies `/api`, `/storage`, `/vi`, and related paths to your separate sp-backend. Opening the UI in a browser should **not** redirect to `app.softprobe.ai` for login.

```
┌─────────────────────┐         ┌──────────────────────────────┐
│  spcode-web host    │  HTTP   │  sp-backend                  │
│  :8090 sp-web UI    │ ──────► │  :8090  sp-boot + datastores │
└─────────────────────┘         └──────────────────────────────┘
```

## Pull spcode-web

```bash
# GCR login on the host running Docker (use pull key JSON from Softprobe)
cat softprobe-registry-puller.json | docker login -u _json_key --password-stdin https://gcr.io

# Self-hosted split image (nginx + spcode, external sp-backend).
# Pin a release tag or use latest. Do NOT use 1.0.21 — old all-in-one SaaS image.
IMAGE=gcr.io/cs-poc-sasxbttlzroculpau4u6e2l/spcode-web:latest
docker pull "$IMAGE"
```

::: tip Kubernetes only
To pull the same image inside a cluster, create a pull secret instead — see [sp-backend (Helm)](./sp-backend-helm.md#2-gcr-pull-secret).
:::

## Configure

Create a working directory (for example `~/softprobe-web`) with `.env`:

```bash
# Required — sp-backend base URL (must be reachable from inside the spcode-web container)
SP_API_URL=http://<sp-backend-host>:8090

# Required — public hostname or IP where users open the sp-web UI (this Docker host)
SP_FRONTEND_HOST=<sp-web-host>
```

| Variable | Example (Docker on same machine as sp-backend) | Purpose |
|----------|-----------------------------------------------|---------|
| `SP_API_URL` | `http://host.docker.internal:18090` | nginx upstream to sp-backend |
| `SP_FRONTEND_HOST` | `203.0.113.10` or `localhost` | Public **sp-web UI** address — baked into the agent JAR and HTTPS certificate |

`SP_FRONTEND_HOST` is **not** the sp-backend address. Set it to the host name or IP where developers open the workbench and download `sp-agent.jar` (usually the machine running this `spcode-web` container).

## Start (docker run)

```bash
set -a && source .env && set +a

docker rm -f spcode-web 2>/dev/null || true

docker run -d --name spcode-web \
  --restart unless-stopped \
  -p 8090:8090 -p 8443:8443 \
  --add-host=host.docker.internal:host-gateway \
  -e SP_API_URL \
  -e PUBLIC_BACKEND_HOST="$SP_FRONTEND_HOST" \
  -v sp-opencode-config:/workspace/.config/opencode \
  -v sp-opencode-data:/workspace/.local/share/opencode \
  "$IMAGE"
```

On Apple Silicon hosts, add `--platform linux/amd64` if the image has no arm64 manifest.

## Verify

```bash
# sp-backend reachable through nginx
curl -sf http://127.0.0.1:8090/vi/health

# sp-web UI loads
curl -sI http://127.0.0.1:8090/ | head -1

# Self-hosted mode injected (prevents SaaS login redirect)
curl -s http://127.0.0.1:8090/ | grep -q 'sp.deploy-mode","selfhost"' && echo "ok — selfhost injection present"

# Agent JAR uses SP_FRONTEND_HOST
curl -sI "http://${SP_FRONTEND_HOST}:8090/api/agent/sp-agent.jar" | head -3

# Split image only — no embedded sp-boot
docker top spcode-web | grep -E 'sp-boot|java' && echo "unexpected" || echo "ok — no embedded backend"
```

Open in a browser:

- **HTTP:** `http://<SP_FRONTEND_HOST>:8090`
- **HTTPS (self-signed):** `https://<SP_FRONTEND_HOST>:8443` — needed for local spcode desktop from a remote browser (Chrome PNA)

The workbench should load without redirecting to `https://app.softprobe.ai/login`.

## Java agent on app servers

Point instrumented JVM apps at **sp-backend**, not the sp-web UI host:

```text
-Dsp.api.url=http://<sp-backend-host>:8090
```

Developers download the agent from the **sp-web UI** host:

```text
http://<SP_FRONTEND_HOST>:8090/api/agent/sp-agent.jar
```

## Ports

| Port | Purpose |
|------|---------|
| 8090 | sp-web UI, spcode proxy, API proxy to sp-backend |
| 8443 | HTTPS sp-web UI (self-signed cert) |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Redirected to `app.softprobe.ai/login` | Wrong image (use split `spcode-web:latest` or `0.0.7+`, not `1.0.21`). Clear browser localStorage. `curl -s http://127.0.0.1:8090/ \| grep selfhost` |
| UI loads, API 502 | `SP_API_URL` reachable from web container: `docker exec spcode-web curl -sf "$SP_API_URL/actuator/health"` |
| Agent JAR has wrong host | `SP_FRONTEND_HOST` must be the sp-web UI host clients use — recreate the container after fixing |
| spcode desktop won't connect | Use HTTPS on :8443 or access from same machine |
| Health check stuck | sp-backend `/vi/health` must respond through nginx upstream |

## Stop

```bash
docker stop spcode-web && docker rm spcode-web
```
