---
title: Demo quickstart (5 minutes)
---

# Travel OTA demo quickstart

Try Softprobe record-and-replay in about five minutes using the bundled **Travel OTA** demo. You run the app locally with Docker; recordings and replay plans live in **your tenant** on app.softprobe.ai.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Docker Compose v2)
- [sp CLI](/en/cli/guide/installation) installed (`curl -fsSL https://install.softprobe.ai | sh`)
- Logged in to [app.softprobe.ai](https://app.softprobe.ai) (or `sp auth login`)
- For SaaS: `SP_API_URL`, `SP_TOKEN`, and `SP_TENANT_ID` configured (token from your session; tenant id from org switcher)
- Run once: `sp tenant key ensure --json` — creates a **tenant API key** for the Java agent (stored as `tenant_api_key` in sp.jsonc)

```bash
export SP_API_URL=https://api.softprobe.ai
export SP_TOKEN=<your-token>
export SP_TENANT_ID=<numeric-tenant-id>
sp tenant key ensure --json
sp setup doctor --json
```

## 1. Start the demo stack

```bash
sp demo start --watch --json
```

This command:

1. Creates (or reuses) app **travel-ota** in your tenant
2. Applies default recording, mock, and compare policies
3. Downloads `sp-agent.jar` and demo JARs (first run)
4. Starts **sp-airline** (:8081) and **travel-ota** (:8080) via Docker

When `--watch` is set, the CLI waits until the agent reports **online**.

## 2. Generate traffic

Open [http://localhost:8080](http://localhost:8080) and complete one booking: search → book → pay.

Or send automated sample traffic:

```bash
sp demo traffic --json
```

Verify recordings:

```bash
sp record case list --app <appId> --since -1h --json
```

(`appId` is printed by `sp demo start`.)

## 3. Run replay

```bash
sp demo replay --watch --json
```

Replay sends recorded cases to `http://localhost:8080` with dependency mocking enabled. Open the workbench **Runs** tab on app.softprobe.ai to inspect pass/fail diffs.

## Other commands

| Command | Purpose |
|---------|---------|
| `sp demo status --json` | Stack health, agent status, case count |
| `sp demo stop` | Stop Docker stack (keeps tenant app + recordings) |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `docker is not running` | Start Docker Desktop |
| Demo JAR download fails | Check [demo-ota releases](https://github.com/softprobe/demo-ota/releases); delete cached JARs under `~/.local/share/softprobe/demo/data/` and retry |
| Agent stays offline | Run `sp tenant key ensure`, then `sp demo stop` and `sp demo start --watch`. The agent uses your **tenant API key** (not your user JWT). Check `docker logs sp-demo-ota-travel-ota-1` |
| `NO_RECORDED_CASES` on replay | Wait a few seconds after traffic, or run `sp demo traffic` |
| Port 8080 in use | `sp demo start --ota-port 18080 --airline-port 18081` |

## Next steps

- [Testing getting started](/en/testing/getting-started) — full lifecycle for your own Java app
- [CLI quickstart](/en/cli/guide/quickstart) — command reference
- [Java agent](/en/testing/java-agent) — attach SP Agent to production services
