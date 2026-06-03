::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# Configuration

`sp` uses the XDG Base Directory Specification and the global namespace
`softprobe`.

## Files

| Purpose | Default path |
|---------|--------------|
| Shared Softprobe config | `${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc` |
| `sp` CLI settings & schema | `${XDG_CONFIG_HOME:-~/.config}/softprobe/sp.jsonc` |
| `spcode` AI settings & schema | `${XDG_CONFIG_HOME:-~/.config}/softprobe/spcode.jsonc` |
| Local Project config dir | `.softprobe/` (at project/repository root) |
| Cached downloads | `${XDG_CACHE_HOME:-~/.cache}/softprobe/` |
| Durable local data, including agent jars | `${XDG_DATA_HOME:-~/.local/share}/softprobe/` |
| Logs and transient state | `${XDG_STATE_HOME:-~/.local/state}/softprobe/` |

The shared configuration file (`config.jsonc`) is for values used by both Softprobe tools, such as the backend API URL and auth token. Tool-specific overrides and profiles are stored inside `sp.jsonc` (Go CLI) and `spcode.jsonc` (AI assistant engine) respectively.


Later sources override earlier sources in order:

1. Built-in defaults.
2. Global Shared Config: `${XDG_CONFIG_HOME}/softprobe/config.jsonc`
3. Global Tool Config: `${XDG_CONFIG_HOME}/softprobe/sp.jsonc` (or `spcode.jsonc` for `spcode`)
4. Project Walk-up Shared Config: `.softprobe/config.jsonc` (and `.softprobe/spcode.jsonc` for `spcode`)
5. Extra config file from `SP_CONFIG`, when set.
6. Extra config file from `--config`, when set.
7. Selected profile from the merged files. Profile selection priority is
   `--profile`, then `SP_PROFILE`, then the merged `profile`, then `default`.
8. Scalar environment variables such as `SP_API_URL`, `SP_TOKEN`, and
   `SP_AGENT_JAR`.
9. Scalar CLI flags such as `--api-url`, `--token`, and `--agent-jar`.


An explicitly requested profile must exist. For example, `sp --profile prod ...`
fails with `PROFILE_NOT_FOUND` when `prod` is absent. The CLI may use defaults
only when no explicit profile is requested.

## Shared config

```jsonc
// ~/.config/softprobe/config.jsonc
// yaml-language-server: $schema=https://softprobe.ai/schemas/softprobe-config.schema.json
{
  "profile": "staging",
  "api_url": "https://sp-staging.example.com",
  "profiles": {
    "staging": {
      "api_url": "https://sp-staging.example.com"
    },
    "prod": {
      "api_url": "https://sp.example.com"
    }
  }
}
```

## sp CLI overrides

```jsonc
// ~/.config/softprobe/sp.jsonc
// yaml-language-server: $schema=https://softprobe.ai/schemas/sp-config.schema.json
{
  "profile": "local",
  "profiles": {
    "local": {
      "api_url": "http://127.0.0.1:8090",
      "agent_jar": "~/.local/share/softprobe/agent/sp-agent.jar"
    }
  },
  "record": {
    "default_since": "-1h"
  },
  "replay": {
    "enable_mock": true
  }
}
```

In this example, `sp` uses the `local` profile because `sp.jsonc` overrides the
shared `profile`. `spcode` should put its OpenCode-specific settings in
`spcode.jsonc` instead of `sp.jsonc`.

## Environment overrides

| Variable | Overrides |
|----------|-----------|
| `SP_API_URL` | Resolved backend API URL |
| `SP_TOKEN` | Resolved auth token |
| `SP_PROFILE` | Active profile name |
| `SP_CONFIG` | Extra config file path, loaded after `sp.jsonc` and before `--config` |
| `SP_AGENT_JAR` | Agent jar path for `sp agent command` |

CLI flags take precedence over environment:

```bash
SP_API_URL=https://sp-staging.example.com \
  sp --api-url http://localhost:8090 --profile local app list --json
```

## Commands

| Command | Action |
|---------|--------|
| `sp config init` | Create `${XDG_CONFIG_HOME}/softprobe/config.jsonc` and `sp.jsonc` if missing |
| `sp config show` | Print resolved config, source paths, active profile, URL, and masked token |
| `sp config set-url <url>` | Update the active profile URL in `sp.jsonc` |
| `sp config set-profile <name>` | Switch the active `sp` profile |

## Migration from spcode

Older `spcode` builds may have stored shared values in `~/.spcode/config.jsonc`
or `$XDG_CONFIG_HOME/spcode/config.jsonc`. `sp config init` imports shared
SoftProbe values such as `api_url` into
`${XDG_CONFIG_HOME}/softprobe/config.jsonc` and leaves app-specific OpenCode
settings in `spcode.jsonc`. `sp` never writes to legacy spcode files.

## Security

- Config files containing tokens are written with mode `0600`.
- Prefer `SP_TOKEN` in CI over writing tokens to disk.
- `sp auth login --no-save` and `sp auth refresh --no-save` must not create or
  modify config files.
- `sp config show` must never print the full token.

## Related & Cross-Repository Links

- [Authentication](./authentication.md)
- [config command](/en/cli/commands/config.md)
- **Global Softprobe Master Configuration Reference**: [`../../../softprobe-code/docs/softprobe-config.md`](../../../softprobe-code/docs/softprobe-config.md)
- **Backend-Specific Configuration Guide**: [`../softprobe-config.md`](../softprobe-config.md)

