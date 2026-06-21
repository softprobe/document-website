# Installation

## One-line install

```bash
curl -fsSL https://install.softprobe.ai | bash
```

This installs or updates the `sp` CLI, `sp-agent.jar`, and `spcode` by default. Binaries are installed under `~/.local/share/softprobe/bin`, the Java agent under `${XDG_DATA_HOME:-~/.local/share}/softprobe/agent`, and CLI binaries are symlinked into `~/.local/bin`. It seeds `~/.config/softprobe/config.jsonc` with `api_url` → `https://api.softprobe.ai`.

By default, the installer uses the `latest` alias for all products.

Options (pass after `bash -s --`):

```bash
curl -fsSL https://install.softprobe.ai | bash -s -- --product sp
curl -fsSL https://install.softprobe.ai | bash -s -- --product agent
curl -fsSL https://install.softprobe.ai | bash -s -- --product spcode
curl -fsSL https://install.softprobe.ai | bash -s -- --version v4.3.5
curl -fsSL https://install.softprobe.ai | bash -s -- --version 4.3.5
curl -fsSL https://install.softprobe.ai | bash -s -- --api-url https://api.softprobe.ai
```

`install.softprobe.ai` is served by a Cloudflare Worker in the `deployment-k8s` repo (`cloudflare/install-worker/`) that proxies public installer and artifact URLs without redirecting the browser to GCS.

### Verify

```bash
sp version
sp health --json    # requires sp-boot running (when implemented)
```

## Product artifacts

Per-version releases are served as:

```text
https://install.softprobe.ai/artifacts/<product>/<version>/<artifact>
```

Supported platforms: `linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`, `windows/amd64`, `windows/arm64`.

Manual install example (Linux amd64):

```bash
curl -fsSL -o sp "https://install.softprobe.ai/artifacts/sp/<version>/sp-linux-amd64"
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

## `spcode` AI Engine CLI

Installed by default in the [one-line install](#one-line-install), or explicitly with `--product spcode`. For local AI against a **self-hosted** SoftProbe UI, use the host-specific installer from the web UI (`curl <host>/spcode/install | bash`).

See the [spcode CLI guide](./spcode.md) for commands and configuration.

## Maintainers

Product release workflows upload handoff artifacts first, then call `softprobe/dev/.github/workflows/publish-install-artifacts.yml@main` with the product and version, for example:

```yaml
with:
  product: sp
  version: v4.3.5
```

Do not document or use local release commands for public install artifacts. The standard GitHub Actions workflow owns the final GCS layout and the `latest` alias.

Redeploy the Worker only when `deployment-k8s/cloudflare/install-worker/` changes.

```bash
cd deployment-k8s/cloudflare/install-worker && wrangler deploy
```
