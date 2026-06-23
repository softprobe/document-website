# spcode-web

Deploy the Softprobe web UI (`spcode-web`) after [sp-backend](./sp-backend-helm.md) is healthy. The UI proxies API calls to sp-backend and serves the per-host Java agent JAR.

## Pull spcode-web

```bash
# GCR login on the host running Docker (use pull key JSON from Softprobe)
cat softprobe-registry-puller.json | docker login -u _json_key --password-stdin https://gcr.io

IMAGE=gcr.io/cs-poc-sasxbttlzroculpau4u6e2l/spcode-web:1.0.21
docker pull "$IMAGE"
```

::: tip Kubernetes only
To pull the same image inside a cluster, create a pull secret instead — see [sp-backend (Helm)](./sp-backend-helm.md#2-gcr-pull-secret).
:::

## Configure

Create a working directory (for example `~/softprobe-web`) with `.env`:

```bash
# Required — upstream sp-backend (non-localhost triggers external mode)
SP_API_URL=http://<softprobe-sp-backend-host>

# Required — public IP or DNS clients use to open the UI and download Java agent
PUBLIC_BACKEND_HOST=<softprobe-sp-backend-host>
```

`PUBLIC_BACKEND_HOST` is baked into the per-host agent JAR at container start. Use the address your developers' machines can reach, not an internal-only hostname.

## Start (docker run)

```bash
set -a && source .env && set +a

docker rm -f spcode-web 2>/dev/null || true

docker run -d --name spcode-web \
  --restart unless-stopped \
  -p 8090:8090 -p 8443:8443 \
  --add-host=host.docker.internal:host-gateway \
  -e SP_API_URL \
  -e PUBLIC_BACKEND_HOST \
  -v sp-opencode-config:/workspace/.config/opencode \
  -v sp-opencode-data:/workspace/.local/share/opencode \
  "$IMAGE"
```

## Verify

```bash
# Container health (nginx probes backend via /vi/health)
curl -sf http://127.0.0.1:8090/vi/health

# UI loads
curl -sI http://127.0.0.1:8090/ | head -1
```

## Java agent on app servers

Point instrumented apps at the **backend** storage API, not the web host:

```text
-Dsp.api.url=http://<softprobe-sp-backend-host>:8090
```

Developers download the agent from the **web** host:

```text
http://<public-web-host>:8090/api/agent/sp-agent.jar
```

## Ports

| Port | Purpose |
|------|---------|
| 8090 | Web UI, spcode proxy, API proxy to backend |
| 8443 | HTTPS UI (self-signed cert) |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| UI loads, API 502 | `SP_API_URL` reachable from web container: `docker exec spcode-web curl -sf "$SP_API_URL/actuator/health"` |
| Agent JAR has wrong host | `PUBLIC_BACKEND_HOST` — recreate container after fixing |
| spcode desktop won't connect | Use HTTPS on :8443 or access from same machine |
| Health check stuck | Backend `/vi/health` must respond through nginx upstream |

## Stop

```bash
docker stop spcode-web && docker rm spcode-web
```
