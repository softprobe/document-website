# Configuration

Softprobe stores durable local settings under the XDG `softprobe` namespace.

| File | Purpose |
|------|---------|
| `${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc` | Shared backend URL and credentials |
| `${XDG_CONFIG_HOME:-~/.config}/softprobe/sp.jsonc` | `sp` CLI-only defaults |
| `${XDG_CONFIG_HOME:-~/.config}/softprobe/spcode.jsonc` | `spcode` AI/model/tool settings |

Run setup once to save the backend URL:

```bash
sp setup --backend-url http://127.0.0.1:18090
```

Then start the web UI through the `sp` launcher:

```bash
sp code web --port 4096
```

`sp code` passes the resolved shared config to the internal engine, so you do
not need to export `SPCODE_MODE` or `SP_API_URL` for normal local use.

Environment variables remain supported as overrides:

| Variable | Purpose |
|----------|---------|
| `SP_API_URL` | Backend URL override |
| `SP_STORAGE_URL` | Storage URL override |
| `SP_TOKEN` | Auth token override |
| `SP_PROFILE` | Active profile override |
| `SP_TENANT_ID` | Tenant id override |
| `SP_TENANT_API_KEY` | Tenant API key override |

The Java agent does not read JSONC files directly. Use
`sp agent command --app <appId> --json` to generate JVM flags and environment
values from the resolved shared config.

For the internal file ownership and precedence contract, see the workspace
configuration design document in the Softprobe development repo:
`docs/structure/configuration.md`.
