# Commands

Reference for public `sp` subcommands. Use `--json` on API-backed commands. See [Output contract](/en/cli/guide/output-contract.md).

## Lifecycle (recommended)

Job-oriented commands that follow record-and-replay order:

| Command | Synopsis |
|---------|----------|
| [setup](./setup.md) | Configure the self-hosted backend URL |
| [demo](./demo.md) | `start`, `traffic`, `replay`, `status`, `stop` — [Travel OTA demo](https://github.com/softprobe/demo-ota) stack |
| [agent](./agent.md) | `download`, `command` — install jar and JVM flags |
| [record](./record.md) | `case list` — recorded entry cases before replay |
| [diagnose](./diagnose.md) | `replay`, `trace` — bundled investigation workflows |

## Platform

Connect, authenticate, manage apps and policies, run replay plans.

| Command | Synopsis |
|---------|----------|
| [config](./config.md) | Profiles, URL, init |
| [auth](./auth.md) | Login, whoami, refresh |
| [app](./app.md) | List, create, agent status, recent replays |
| [policy](./policy.md) | Recording, mock, compare YAML policies |
| [replay](./replay.md) | Run, status, stop, rerun plans |
| [health](./health.md) | Cluster health |
| `version` | CLI version string |

## Investigation

Recorded data, traces, and replay failures.

| Command | Synopsis |
|---------|----------|
| [record](./record.md) | Query recordings and completeness |
| [trace](./trace.md) | Find traces by business attributes |
| [logs](./logs.md) | Correlated logs by `trace_id` — see [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) |
| [replay case](./replay-case.md) | List cases, metadata, mock tree |
| [replay diff](./replay-diff.md) | Diff artifacts, replay logs |
| [extraction-rule](./extraction-rule.md) | Business attribute extraction rules |

Investigation commands support `--out-dir`, `--page`, and `--limit` unless noted.

## Administration

Groups, system config, diagnostics, legacy APIs.

| Command | Synopsis |
|---------|----------|
| [group](./group.md) | User groups and app grants |
| [grant](./group.md) | App grant listing (`grant list`) |
| [system](./system.md) | System config keys |
| [ops](./ops.md) | Storage and schedule diagnostics |
| [config legacy](./config-legacy.md) | Legacy `/api/config/*` (deprecated) |

## Global flags

```text
--json          Machine-readable stdout (required for agents)
--profile       Config profile name
--api-url       Override backend URL
--token         Override JWT (else SP_TOKEN / config)
--config        Extra config file (JSONC overlay)
--quiet         Suppress non-error stderr
--out-dir       Directory for artifact files
--page          Page number (investigation list commands)
--limit         Page size / max items
```

## Cheat sheet

```bash
sp config init && sp auth login --email u@c.com --code 123456 --json
sp doctor --json
sp app create my-svc --json
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
sp agent command --app <appId> --agent-jar ./sp-agent.jar --json   # copy startCommand into your run script
sp record case list --app <appId> --since -1h --json
sp replay run --app <appId> --env http://your-service:8080 --from -24h --json
sp replay status <planId> --watch --json
sp diagnose replay <planId> --failed-only --out-dir .sp-work --json
```

## Related

- [Quickstart](/en/cli/guide/quickstart.md)
- [For AI agents](/en/cli/guide/overview.md)
- [Examples](/en/cli/examples/agent-diagnose-replay.md)
- [API mapping](/en/cli/reference/api-mapping.md)
