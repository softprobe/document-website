---
title: Upgrade
---

# Upgrade

Upgrade Softprobe with:

```bash
sp upgrade
```

The command uses the global installer lifecycle so the CLI, Java agent, and internal coding engine update as one Softprobe install. Partial component failures are reported visibly.

If **Spcode Service** is installed (`spcode-web.service`), restart after upgrading `sp` or `spcode`:

```bash
sudo systemctl restart spcode-web.service
journalctl -u spcode-web -n 20 --no-pager
```
