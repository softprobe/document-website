---
title: Investigate with a coding agent
---

# Investigate with a coding agent

Ask Cursor, Claude Code, Codex, OpenCode, or another coding agent to diagnose Softprobe Agent QA Sessions and traces. Evidence stays in your Softprobe workspace; the skill is **read-only**.

This is separate from **capture** (Connect agent / OpenCode plugin). Capture records Sessions; this skill **investigates** them.

## 1. Install skill + MCP

```bash
npx skills add softprobe/softprobe-skills -g -y \
  -a cursor -a claude-code -a codex -a opencode \
  -s softprobe-agent-qa

bash ~/.agents/skills/softprobe-agent-qa/scripts/install-mcp.sh
```

`install-mcp.sh` registers the local stdio MCP server with the native CLIs:

```bash
cursor --add-mcp '{"name":"softprobe","command":"python3","args":["…/mcp_server.py"]}'
claude mcp add -s user softprobe -- python3 …/mcp_server.py
```

Expect the skills install to exit **0** under `~/.agents/skills/softprobe-agent-qa`.

If a bare `-g -y` (no `-a`) prints `Failed to install 1` for **PromptScript**, that is a [skills CLI bug](https://github.com/vercel-labs/skills/issues/1352), not a Softprobe packaging failure — re-run with the `-a` flags above so the install is clean.

Claude Code plugin (optional, same repository):

```bash
git clone https://github.com/softprobe/softprobe-skills.git
claude --plugin-dir ./softprobe-skills
```

Source: [github.com/softprobe/softprobe-skills](https://github.com/softprobe/softprobe-skills) (Apache-2.0).

## 2. Sign in (you, not the agent)

Coding agents must not run browser login. On your machine:

```bash
python3 ~/.agents/skills/softprobe-agent-qa/scripts/login.py
```

Explorer opens in your browser. After you sign in, credentials are stored under `~/.softprobe/explorer/` (not in your project repo). Never paste access tokens into chat.

If you belong to multiple workspaces, pick one in Explorer or let the skill / MCP ask you to select.

## 3. Ask your agent

Examples:

- Use Softprobe Agent QA: why did session `sess_…` fail? Check tool errors and the last generation.
- Softprobe Agent QA: list Sessions from the last 24 hours with errors for agent `my-agent`.
- Softprobe Agent QA: open trace `…` and summarize tool results vs the model’s final answer.

Prefer the **softprobe** MCP tools (`get_session`, `search_sessions`, `get_trace`, …). The agent should cite `session_id` / `trace_id` / `span_id` and can link Explorer:

`https://explorer.softprobe.ai?session=<session_id>`

## Privacy

- Credentials stay on your machine under `~/.softprobe/explorer/`.
- The skill / MCP only **reads** Sessions, observations, traces, and fixed log queries.
- It does not ingest telemetry or write scores.

## Troubleshoot

| Symptom | Fix |
|---------|-----|
| `Failed to install 1` / PromptScript | Known [skills CLI issue](https://github.com/vercel-labs/skills/issues/1352). Re-run with `-a cursor -a claude-code -a codex -a opencode` (see Install). Do not ignore a red failure — use the clean command. |
| Skill not found | Re-run the Install command above, or `./install.sh` from a clone |
| MCP tools missing | Re-run `install-mcp.sh`, or the `cursor --add-mcp` / `claude mcp add` one-liners in step 1 |
| Not logged in / expired | Run `login.py` again (human only) |
| Workspace picker / 409 | Select a workspace in Explorer, or `list_workspaces` then `select_workspace` |
| Confused with OpenCode capture | Capture uses `@softprobe/opencode-plugin` from Connect agent; this skill only investigates |

## Next

- [Quick start](/en/agent-qa/getting-started) — connect an agent and verify capture
- [Concepts](/en/agent-qa/concepts) — Session and observation shape
- [Explorer](https://explorer.softprobe.ai)
