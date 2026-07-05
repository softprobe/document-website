---
title: Launch Coding
---

# Launch Coding

Use `sp code` to start the Softprobe coding experience:

```bash
sp code
```

Arguments after `sp code` pass through to the internal engine unchanged:

```bash
sp code web --port 4096
```

If the internal engine is missing, not executable, or incompatible, `sp code` fails before launch and tells you to repair or upgrade the Softprobe install.

`sp code web` starts the Softprobe web UI in Softprobe mode and passes the
resolved backend URL from shared config to the internal engine.
