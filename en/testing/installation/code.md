---
title: Launch Softprobe Web UI Manually
---

# Launch Softprobe Web UI Manually

Most testing work happens in the **Softprobe web UI** in your browser — record, replay, and inspect traces there.

This page is for starting that UI **on your own dev machine** when you want a private session on your laptop or workstation. It is not the same as a **shared web workbench** that your team opens from one URL on the network; that optional server install is covered under [Spcode Service](./#spcode-service) on the install page.

## Start the UI on your dev box

```bash
sp code web --port 4096
```

Then open `http://127.0.0.1:4096` (or the host and port you chose). The UI uses **your** Softprobe config and backend URL from `sp setup`.

You can also open the terminal coding experience without the browser:

```bash
sp code
```

If Softprobe cannot start the web UI, run `sp doctor` and follow the remediation, or run `sp upgrade` if the install is out of date.

## Dev machine vs shared workbench

| | On your dev box (this page) | Shared web workbench (optional) |
|--|-------------------------------|----------------------------------|
| **Who** | You, on your machine | Your organization, one URL for the team |
| **Typical use** | Local testing while you develop | Colleagues in the same network open the same workbench |
| **How** | `sp code web` in your shell | `sp setup --install-spcode-service` during install ([Spcode Service](./#spcode-service)) |
| **Config** | Your personal settings from `sp setup` | Separate service settings, managed at install time |

Use the dev-box flow when you are the only person on that machine. Choose the shared workbench when several people need browser access without each running their own process.
