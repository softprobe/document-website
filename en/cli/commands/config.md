# sp config

Manage local Softprobe configuration.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `init` | Create the XDG config directory and default config files |
| `show` | Print resolved profile, URL, sources, and token status |
| `set-url <url>` | Set the active profile backend URL in shared config |
| `set-profile <name>` | Switch the active shared profile |

## Examples

```bash
sp config init
sp config show --json
sp config set-url http://127.0.0.1:18090
sp config set-profile staging
```

Shared backend and auth values live in:

```text
${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc
```

Use `sp setup --backend-url ...` for first-time setup. Use environment
variables such as `SP_API_URL`, `SP_TOKEN`, and `SP_PROFILE` only when you need
a temporary override.

See [Configuration](/en/cli/guide/configuration.md) for the user-facing guide.
