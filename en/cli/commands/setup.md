# sp setup

**When agents use this:** Configure the self-hosted Softprobe backend URL before `sp code`, record/replay, or agent workflows.

## Synopsis

`sp setup` writes the backend URL into the existing Softprobe config namespace. Bare `sp setup` launches an interactive wizard; pass `--backend-url` to set the URL non-interactively.

```bash
sp setup
sp setup --backend-url http://127.0.0.1:8090
```

Model provider setup stays with `sp code` or the internal coding engine. Use `sp doctor` for install health checks.

## Related

- [Doctor](/en/testing/installation/doctor) — `sp doctor` backend and internal-engine checks
- [agent](./agent.md) — download and JVM flags
- [Quickstart](/en/cli/guide/quickstart.md)
- [health](./health.md)
