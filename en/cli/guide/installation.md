# Installation

## One-line install (`sp` + `spcode`)

```bash
curl -fsSL https://install.softprobe.ai | bash
```

This installs both binaries under `~/.local/share/softprobe/bin` and symlinks into `~/.local/bin`. It seeds `~/.config/softprobe/config.jsonc` with `api_url` → `https://api.softprobe.ai`.

Options (pass after `bash -s --`):

```bash
curl -fsSL https://install.softprobe.ai | bash -s -- --version latest --api-url https://api.softprobe.ai
curl -fsSL https://install.softprobe.ai | bash -s -- --skip-spcode   # sp CLI only
```

`install.softprobe.ai` is served by a Cloudflare Worker in the `deployment-k8s` repo (`cloudflare/install-worker/`) that proxies `gs://softprobe-published-files/install/latest/` without redirecting the browser to GCS.

### Verify

```bash
sp version
sp health --json    # requires sp-boot running (when implemented)
```

## `sp` binary only

Per-version releases are also published as:

```text
gs://softprobe-published-files/sp/<version>/sp-{os}-{arch}
```

Supported platforms: `linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`, `windows/amd64`, `windows/arm64`.

Manual install example (Linux amd64):

```bash
curl -fsSL -o sp "https://storage.googleapis.com/softprobe-published-files/sp/<version>/sp-linux-amd64"
chmod +x sp
sudo mv sp /usr/local/bin/
sp version
```

Replace `<version>` with your release tag. Enterprise mirrors may host the same layout on an internal URL.

## Backend setup and configuration

Softprobe supports **Softprobe Cloud (SaaS)** and **self-hosted / enterprise** deployments.

### Softprobe Cloud (SaaS)

- No local backend is required. API commands default to `https://api.softprobe.ai`.
- Run `sp auth login` to initialize config directories and store your token.

### Self-hosted / enterprise

- Ensure **sp-boot** is reachable (often `http://127.0.0.1:8090` on the same network).
- Run `sp auth login` and choose **Self-Hosted** to set your API URL. Private networks may not require a token.

```bash
curl -s http://127.0.0.1:8090/vi/health
```

### Manual configuration

```bash
sp config init
# creates ~/.config/softprobe/config.jsonc and ~/.config/softprobe/sp.jsonc
```

See [Configuration](./configuration.md).

## Spcode Service (Linux, optional)

On Linux, `sp setup` can optionally install **Spcode Service** — a systemd unit that runs the team web UI (`spcode serve --hostname 0.0.0.0`) as root for corp-network browser access. See [sp setup](/en/cli/commands/setup.md) for flags, operations, and uninstall.

```bash
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
systemctl status spcode-web.service
```

Default listen port is **4096**. Service config lives at `/root/.config/softprobe/` and is independent from your personal config.

After upgrading `sp` or `spcode`, restart the service if needed: `systemctl restart spcode-web.service`, then check `journalctl -u spcode-web`.

## `spcode` AI Engine CLI

Included in the [one-line install](#one-line-install-sp--spcode) above. For local AI against a **self-hosted** SoftProbe UI, use the host-specific installer from the web UI (`curl <host>/spcode/install | bash`).

See the [spcode CLI guide](./spcode.md) for commands and configuration.

## Maintainers

Publish more platforms from the `backend` repo:

```bash
./scripts/manual-publish-install.sh latest darwin-arm64 linux-arm64 linux-x64
```

Uploads to `gs://softprobe-published-files/install/<version>/`. Redeploy the Worker only when `cloudflare/install-worker/` changes:

```bash
cd deployment-k8s/cloudflare/install-worker && wrangler deploy
```
