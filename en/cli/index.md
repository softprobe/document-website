---
layout: home

hero:
  name: SoftProbe CLI
  text: "`sp` — record/replay testing from the command line"
  tagline: Setup, create an app, list it, set recording policy, run the app with the Java agent, list recorded cases, set replay policy, replay, and inspect results.
  actions:
    - theme: brand
      text: For AI agents
      link: /guide/overview
    - theme: alt
      text: Quickstart
      link: /guide/quickstart

features:
  - title: Java-agent lifecycle
    details: Create an app, list it, set recording policy, install `sp-agent.jar`, run the app with a stable `sp.app.id`, and list recorded cases before replay.
  - title: Auto mock and compare
    details: Replay uses recorded dependency data to mock configured calls and compare replay behavior against the original recording.
  - title: JSON-first automation
    details: Stable `--json` output, exit codes, and artifact paths let AI coding agents and CI jobs script replay diagnosis without parsing tables.
---

## What is `sp`?

`sp` is the SoftProbe command-line interface. SoftProbe records real traffic from Java services through a `-javaagent`, stores those cases, then replays them later with automatic dependency mocking and response comparison.

It is designed **primarily for AI agents** that automate app setup, policy changes, recording verification, replay diagnosis, and CI gates. Humans and shell scripts use the same commands.

All public commands are **HTTP clients to sp-boot** (default `http://127.0.0.1:8090`). The Java agent separately talks to backend services to pull config, send heartbeats, and upload recording/replay data.

## Command areas

| Area | Commands |
|------|----------|
| **Platform** | config, auth, app, policy, replay, health |
| **Investigation** | record, trace, replay case/diff, extraction-rule |
| **Administration** | group, system, ops |

See [Commands overview](commands/).

## Related tools

- **[Policy YAML guide](/en/testing/policy-yaml-guide)** — schema and examples for recording, mock, and compare policies
- **`spcode` / `@spcode/plugin`** — OpenCode integration; migrates from `sp_api` endpoints to `sp` subcommands
