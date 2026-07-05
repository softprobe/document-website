---
title: Doctor
---

# Doctor

Use `sp doctor` to check a self-hosted Softprobe installation:

```bash
sp doctor
sp doctor --json
```

The doctor surface reports backend reachability and internal coding engine installation with remediation for failures.

When **`spcode-web.service`** is registered (Spcode Service installed via [`sp setup --install-spcode-service`](/en/cli/commands/setup.md)), `sp doctor` also runs a **`spcode-service`** check against `/root/.config/softprobe/config.jsonc` and the service unit.
