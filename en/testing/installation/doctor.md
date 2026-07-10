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

When **`spcode-web.service`** is registered (Spcode Service installed via [`sp setup --install-spcode-service`](/en/testing/installation/#spcode-service)), `sp doctor` also checks that the service is healthy and can reach the configured Softprobe backend.
