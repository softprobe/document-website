::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# Installation

## `sp` binary

Release builds are produced by [`build.sh`](../../build.sh) (`build_sp_cli`) and uploaded as:

```text
gs://softprobe-published-files/sp/<version>/sp-{os}-{arch}
```

Supported platforms (release): `linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`, `windows/amd64`, `windows/arm64`.

### Install on PATH

```bash
# Example: Linux amd64
curl -fsSL -o sp "https://<your-distribution-host>/sp/1.0.0/sp-linux-amd64"
chmod +x sp
sudo mv sp /usr/local/bin/
sp version
```

Exact download URLs depend on your organization's artifact hosting.

### Verify

```bash
sp version
sp health --json    # requires sp-boot running (when implemented)
```

## Backend prerequisite

API commands need **sp-boot** reachable at the configured URL (default `http://127.0.0.1:8090`).

```bash
curl -s http://127.0.0.1:8090/vi/health
```

## Configuration file

On first use (when `sp config init` is implemented):

```bash
sp config init
# creates ~/.config/softprobe/config.jsonc and ~/.config/softprobe/sp.jsonc
```

See [Configuration](./configuration.md).

## `spcode` AI Engine CLI

The local autonomous AI engine and developer companion.

### Installation Options

#### Homebrew (macOS & Linux)
```bash
brew install softprobe-ai/tap/spcode
```

#### Node Package Manager (NPM or Bun)
```bash
npm install -g softprobe-ai@latest
# or using Bun
bun install -g softprobe-ai@latest
```

#### Curl Shell Installer (macOS & Linux)
```bash
curl -fsSL https://softprobe.ai/install | bash
```

Once installed, verify the installation:
```bash
spcode --version
```

See the [spcode CLI guide](./spcode.md) for detailed configuration and command references.
