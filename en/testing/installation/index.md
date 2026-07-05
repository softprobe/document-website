---
title: Install Softprobe
---

# Install Softprobe

Install Softprobe with the global installer:

```bash
curl -fsSL https://install.softprobe.ai/install.sh | bash
```

The default install updates the Softprobe CLI (`sp`), the Java agent, and the internal coding engine used by `sp code`.

After install:

```bash
sp setup
sp code
sp doctor
```

Component options such as `--product sp|agent|spcode|all` remain available for maintainer automation, but the primary user workflow is the `sp` command.

## Backend URL

For self-hosted or on-prem deployments, run:

```bash
sp setup
```

Enter the Softprobe backend URL, for example `http://127.0.0.1:8090`.

On Linux, `sp setup` can optionally install **Spcode Service** — a systemd unit for team browser access. See [Setup](./setup.md#spcode-service-linux-only).

## Next

- [Setup](/en/testing/installation/setup)
- [Launch coding](/en/testing/installation/code)
- [Doctor](/en/testing/installation/doctor)
- [Upgrade](/en/testing/installation/upgrade)
