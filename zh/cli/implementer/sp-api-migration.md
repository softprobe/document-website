# sp_api → sp migration

Map for updating `@spcode/plugin` skills from `sp_api endpoint=…` to `sp` argv.

| sp_api `endpoint` | Planned `sp` command | REST (primary) |
|-------------------|----------------------|----------------|
| `list_applications` | `sp app list --json` | `GET /api/applications/list` |
| `agent_status` | `sp app status <appId> --json` | `GET /api/applications/{appId}/agent-status` |
| `recent_replays` | `sp app replays <appId> --json` | `GET /api/applications/{appId}/replays/recent` |
| `find_traces_by_attr` | `sp trace find … --json` | `POST /api/traces/find-by-attr` |
| `get_trace_summary` | `sp trace get <traceId> --json` | `GET /api/traces/{traceId}/summary` |
| `query_replay_metadata` | `sp replay metadata <replayId> --json` | storage/schedule metadata |
| `query_plan_fail_cases` | `sp replay case list --plan <id> --failed --json` | report APIs |
| `query_replay_case` | `sp replay case list … --json` | report/storage |
| `diff_detail` | `sp replay diff get <diffId> --out-dir … --json` | `GET /api/report/queryDiffMsgById/{id}` |
| `compare_result` | `sp replay compare … --json` | schedule/report compare |
| `record_data` | `sp record query … --json` | `POST /api/storage/record/query` |
| `download_record_logs` | `sp record logs download … --json` | `/api/record-logs/download` |
| `record_log_overview` | `sp record logs overview … --json` | `/api/record-logs/overview` |
| `download_replay_logs` | `sp replay logs download … --json` | `/api/replay-logs/download` |
| `replay_log_overview` | `sp replay logs overview … --json` | `/api/replay-logs/overview` |
| `app_config` | `sp config agent load --app <id> --json` | `POST /api/config/agent/load` |
| `multi_service_config` | `sp config legacy multiservice load …` | `GET /api/getMultiServiceConfig` |

## Behavioral differences

| Topic | sp_api (today) | sp (target) |
|-------|----------------|-------------|
| Output | Mixed text + files under `.sp-code/` | JSON envelope + `artifact` path |
| Scope directory | Plugin manages `.sp-code/{scope}/` | `--out-dir` flag explicit |
| Auth | Plugin `resolveSpUrls` + config | `SP_TOKEN` + profiles |
| Permissions | `ctx.ask` (partially disabled) | Host tool policy |

## Source tools (not in public `sp`)

| spcode tool | Public `sp` |
|-------------|-------------|
| `sp_read` | **Not exposed** — proprietary source; use internal tooling only |
| `sp_grep` | **Not exposed** — same |
| `diagnose` | Skill composing `sp replay *` + `sp record *` |

## Migration checklist for skill authors

1. Replace `sp_api` shell snippets with `sp … --json`
2. Parse `ok` / `data` envelope; read artifacts from `data.artifact`
3. Set `SP_API_URL` and `SP_TOKEN` in agent host config
4. Remove hardcoded endpoint enum lists from skill markdown
