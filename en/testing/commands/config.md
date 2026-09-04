# sp config

**When agents use this:** Once per session to verify connectivity; CI uses env vars instead of `init`.

## Synopsis

Manage XDG-backed SoftProbe config, profiles, and backend URL.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `init` | Create `${XDG_CONFIG_HOME}/softprobe/config.jsonc` and `sp.jsonc` |
| `show` | Print resolved config sources, active profile, URL, and masked token |
| `set-url <url>` | Set URL for the active `sp` profile |
| `set-profile <name>` | Switch the active `sp` profile |

## Examples

```bash
sp config init
sp config show --json
sp config set-url http://127.0.0.1:8090
sp config set-profile staging
```

### File layout

`sp` uses the global XDG namespace `softprobe`:

```text
${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc  # shared Softprobe connectivity config
${XDG_CONFIG_HOME:-~/.config}/softprobe/sp.jsonc      # sp CLI-specific config
${XDG_CONFIG_HOME:-~/.config}/softprobe/spcode.jsonc  # spcode AI assistant-specific config
.softprobe/                                           # local project config directory
${XDG_CACHE_HOME:-~/.cache}/softprobe/                # caches
${XDG_DATA_HOME:-~/.local/share}/softprobe/           # durable data, agent jars
${XDG_STATE_HOME:-~/.local/state}/softprobe/          # logs and state
```

`config.jsonc` is shared with other Softprobe tools. `sp.jsonc` is only for this CLI and overrides shared values. `spcode.jsonc` (global and inside project-level `.softprobe/`) is parsed separately by the `spcode` AI assistant engine.


### JSON output (`init`)

```json
{
  "ok": true,
  "command": "config init",
  "data": {
    "path": "~/.config/softprobe/sp.jsonc",
    "sharedPath": "~/.config/softprobe/config.jsonc",
    "spPath": "~/.config/softprobe/sp.jsonc"
  }
}
```

### JSON output (`show`)

```json
{
  "ok": true,
  "command": "config show",
  "data": {
    "profile": "default",
    "url": "http://127.0.0.1:8090",
    "path": "~/.config/softprobe/sp.jsonc",
    "sharedPath": "~/.config/softprobe/config.jsonc",
    "sources": [
      "~/.config/softprobe/config.jsonc",
      "~/.config/softprobe/sp.jsonc"
    ],
    "tokenConfigured": true,
    "tokenMasked": "eyJhbGciOi...[masked]",
    "tenantConfigured": false,
    "tenantApiKeyConfigured": false,
    "tenantApiKeyMasked": "",
    "agentJarConfigured": false
  }
}
```

### JSON output (`set-url`)

```json
{
  "ok": true,
  "command": "config set-url",
  "data": {
    "url": "http://127.0.0.1:8090",
    "profile": "default"
  }
}
```

### JSON output (`set-profile`)

```json
{
  "ok": true,
  "command": "config set-profile",
  "data": {
    "profile": "staging"
  }
}
```

## Precedence

Later sources override earlier sources:

1. Defaults.
2. `${XDG_CONFIG_HOME}/softprobe/config.jsonc`.
3. `${XDG_CONFIG_HOME}/softprobe/sp.jsonc`.
4. Extra config from `SP_CONFIG`, when set.
5. Extra config from `--config`, when set.
6. Selected profile. Profile selection priority is `--profile`, `SP_PROFILE`,
   merged `profile`, then `default`.
7. Scalar env overrides: `SP_API_URL`, `SP_TOKEN`, `SP_AGENT_JAR`.
8. Scalar CLI flags: `--api-url`, `--token`, `--agent-jar`.

Explicit unknown profiles fail closed with `PROFILE_NOT_FOUND`; they never
silently fall back to `default`.

## REST mapping

Config subcommands are **local only** (no HTTP), except `config agent load` in [config legacy](./config-legacy).

## Errors

| Code | Exit | Cause |
|------|------|-------|
| `CONFIG_MISSING` | 2 | No config file; run `init` |
| `PROFILE_NOT_FOUND` | 2 | Unknown profile name |
| `CONFIG_PARSE_ERROR` | 2 | Invalid JSONC |
| `CONFIG_WRITE_ERROR` | 2 | Config file could not be written |

## Related

- [Configuration guide](/en/testing/installation/configuration)
- [auth](./auth)
