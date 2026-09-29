---
title: Command reference
---

# Command reference

Every public `sp` command. Use `--json` on API-backed commands; see [Output contract](/en/testing/agents/output-contract). `sp --help` and `sp <command> --help` list the same commands from the installed binary.

## Install and set up

| Command | Synopsis |
|---------|----------|
| `version` | Print the CLI version. `sp -v` and `sp --version` do the same; `sp version --json` gives an envelope |
| [setup](./setup) | Point `sp` at a backend; optionally install the shared web workbench (Linux) |
| `doctor` | Check the backend, the workbench engine and the shared web workbench — see [Install — check the installation](/en/testing/installation/#doctor) |
| `upgrade` | Upgrade the CLI, the Java agent and the workbench engine — see [Install — upgrade](/en/testing/installation/#upgrade) |
| `code` | Start the workbench in the terminal, or `sp code web` in the browser — see [Install — web workbench](/en/testing/installation/#web-ui) |

## Lifecycle (recommended)

Job-oriented commands that follow record-and-replay order:

| Command | Synopsis |
|---------|----------|
| [demo](./demo) | `start`, `traffic`, `replay`, `status`, `stop` — [Travel OTA demo](https://github.com/softprobe/demo-ota) stack |
| [agent](./agent) | `download`, `command` — install jar and JVM flags |
| [record](./record) | `case list` — recorded entry cases before replay |
| [diagnose](./diagnose) | `replay`, `trace` — bundled investigation workflows |

## Platform

Connect, authenticate, manage apps and policies, run replay plans.

| Command | Synopsis |
|---------|----------|
| [config](./config) | Profiles, URL, init |
| [auth](./auth) | Login, whoami, refresh |
| [app](./app) | List, create, agent status, recent replays |
| [policy](./policy) | Recording, mock, compare YAML policies |
| [replay](./replay) | Run, status, statistics, report, stop, rerun plans |
| [health](./health) | Cluster health |
| [tenant](./tenant) | Softprobe Cloud: tenant API key for agents |
| [tunnel](./tunnel) | Softprobe Cloud: reverse tunnel so replays reach a service on your machine |

## Investigation

Recorded data, traces, and replay failures.

| Command | Synopsis |
|---------|----------|
| [record](./record) | Query recordings and completeness |
| [trace](./trace) | Find traces by business attributes |
| [logs](./logs) | Correlated logs by `trace_id` — see [Concepts and IDs](/en/testing/agents/concepts#ids) |
| [replay case](./replay-case) | List cases, metadata, mock tree |
| [replay diff](./replay-diff) | Diff artifacts, compare results |
| [extraction-rule](./extraction-rule) | Business attribute extraction rules |

Investigation commands support `--out-dir`, `--page`, and `--limit` unless noted.

## Administration

Groups, system config, diagnostics.

| Command | Synopsis |
|---------|----------|
| [group](./group) | User groups and app grants |
| [grant](./group) | App grant listing (`grant list`) |
| [system](./system) | System config keys |
| [ops](./ops) | Storage and schedule diagnostics |

`sp recorder` and `sp config legacy` no longer exist; see [sp logs — removed commands](./logs#legacy) and [sp config](./config).

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
sp diagnose replay <planId> --out-dir .sp-work --json
```

## Related

- [Choose how to integrate](/en/testing/agents/overview)
- [Diagnose a failed replay](/en/testing/examples/agent-diagnose-replay)
- [CLI to backend API mapping](/en/testing/reference/api-mapping)
