# sp setup

**When agents use this:** Configure the self-hosted Softprobe backend URL before `sp code`, record/replay, or agent workflows. On **Linux**, optionally install **Spcode Service** (team web UI via systemd).

## Synopsis

```bash
sp setup
sp setup --backend-url https://sp-backend.example:8090
sp setup --backend-url https://sp-backend.example:8090 --install-spcode-service
sp setup --install-spcode-service --spcode-service-port 5000
sp setup --uninstall-spcode-service
sp setup doctor
```

| Flag | Description |
|------|-------------|
| `--backend-url` | Softprobe backend URL (prompts when omitted) |
| `--install-spcode-service` | Install `spcode-web.service` after backend URL step (**Linux only**) |
| `--uninstall-spcode-service` | Stop and remove `spcode-web.service` |
| `--spcode-service-port` | Listen port when installing (default `4096`) |

`--install-spcode-service` and `--uninstall-spcode-service` cannot be combined.

## Backend URL

`sp setup` writes the backend URL to your **personal** XDG config at `~/.config/softprobe/config.jsonc`. It does not configure model providers, tenant keys, or agent settings.

Bare `sp setup` launches an interactive wizard; pass `--backend-url` to set the URL non-interactively.

```bash
sp setup --backend-url https://sp-backend.example:8090 --json
```

Model provider setup stays with `sp code` or the internal coding engine.

## Spcode Service (Linux only)

**Spcode Service** is an optional long-running systemd unit (`spcode-web.service`) that runs `spcode serve --hostname 0.0.0.0` as **root** for team browser access on the corp network. Manual developer UI launch remains [`sp code web`](/en/cli/guide/spcode.md).

### Install paths

```bash
# Interactive: backend URL → opt-in → port prompt (default 4096)
sp setup

# Non-interactive
sp setup --backend-url https://sp-backend.example:8090 --install-spcode-service
sp setup --install-spcode-service   # when personal config already has a valid backend URL

# Automation without TTY (entire command elevated)
sudo sp setup --backend-url https://sp-backend.example:8090 --install-spcode-service
```

Personal config stays in the invoking user's `~/.config/softprobe/`. Service config is written once at install to `/root/.config/softprobe/config.jsonc` via internal `sudo`. Changing personal `sp setup --backend-url` later does **not** update the service config — uninstall and reinstall to change the service backend URL.

### Operations

| Task | Command |
|------|---------|
| Status | `systemctl status spcode-web.service` |
| Stop / start | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| Logs | `journalctl -u spcode-web -n 50 --no-pager` |
| Service data | `/root/.local/share/softprobe/` |
| Service config | `/root/.config/softprobe/config.jsonc` |

If start fails, inspect `journalctl -u spcode-web` before retrying.

### Uninstall

```bash
sp setup --uninstall-spcode-service
sudo sp setup --uninstall-spcode-service   # non-interactive
```

Removes the unit and systemd registration. Leaves `/root/.config/softprobe/` on disk.

### JSON fields

Successful setup may include:

| Field | Values |
|-------|--------|
| `spcodeServiceStatus` | `skipped`, `installed`, `not_installed`, `removed`, `failed` |
| `spcodeServicePort` | Present when `installed` |

## `setup doctor`

```bash
sp setup doctor --json
```

Legacy setup doctor (config + agent jar).

Top-level [`sp doctor`](/en/testing/installation/doctor) also checks backend reachability, `spcode` binary, and — when `spcode-web.service` is registered — **`spcode-service`** health from `/root/.config/softprobe/`.

## Related

- [Doctor](/en/testing/installation/doctor) — `sp doctor` backend, internal-engine, and Spcode Service checks
- [Installation guide](/en/cli/guide/installation.md)
- [Configuration](/en/cli/guide/configuration.md)
- [spcode / Spcode Service](/en/cli/guide/spcode.md)
- [agent](./agent.md) — download and JVM flags
- [Quickstart](/en/cli/guide/quickstart.md)
- [health](./health.md)
