---
title: sp tunnel
---

# sp tunnel

Opens a reverse tunnel from the backend to a service on your own machine, so a replay started on **Softprobe Cloud** can reach a service that only listens on `localhost`. Self-hosted backends that can reach the service directly don't need it.

```bash
sp tunnel --port 8080 --app <appId>
```

Keep it running in its own terminal while the replay runs; stop it with `Ctrl+C`. It reconnects on its own: 2 seconds after a connection drops, and every 5 seconds while it can't connect.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `8080` | Local port of the service that should receive replayed requests |
| `--app` | App from `sp demo start` | `appId` whose replay traffic goes through the tunnel |
| `--url` | Derived from the backend URL | Override the WebSocket tunnel URL, e.g. `ws://localhost:8090/api/ws/tunnel` |

The tunnel connects to `<backend URL>/api/ws/tunnel` with your login token: `ws://` for an `http://` backend, `wss://` for an `https://` one. For a local development console on port 3000 it uses `ws://localhost:8092/api/ws/tunnel`; pass `--url` to override.

## With the demo

`sp demo replay` against Softprobe Cloud needs the tunnel when the demo app runs on your machine:

```bash
sp demo start
sp tunnel --port 8080      # in a second terminal
sp demo replay
```

## Related

- [sp demo](./demo)
- [sp replay](./replay)
