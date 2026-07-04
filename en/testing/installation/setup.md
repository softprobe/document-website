---
title: Setup
---

# Setup

`sp setup` configures the self-hosted or on-prem Softprobe backend URL.

```bash
sp setup
```

The setup wizard only owns the backend URL in this release. Model provider configuration belongs to `sp code` and the internal coding engine.

For non-interactive setup:

```bash
sp setup --backend-url http://127.0.0.1:8090
```

The URL is stored in the existing Softprobe XDG configuration namespace.
