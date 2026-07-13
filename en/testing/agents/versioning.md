# Versioning and stability

## Binary version

`sp version` prints the CLI build version (semver). Agents may log this on every session for support correlation.

## Command argv stability

| Change type | Policy |
|-------------|--------|
| New subcommand | Allowed anytime |
| New optional flag | Allowed anytime |
| Renaming subcommand or flag | Deprecate for one minor release; print stderr warning |
| Removing subcommand or flag | Major version bump only |

Document deprecations in release notes and in command `--help` text.

## JSON field stability

| Change type | Policy |
|-------------|--------|
| New fields in `data` | Allowed; agents must ignore unknown fields |
| Renaming or removing fields | Major version bump, or add `dataVersion` in envelope |
| Changing field types | Major version bump |

Recommended: include `"schemaVersion": 1` in the CLI envelope in a future release.

## API backend compatibility

The CLI targets **sp-boot** unified deployment. Backend URL is configurable; the CLI does not pin to separate storage/schedule hostnames (those are internal to sp-boot).

When backend APIs change, update [API mapping](/en/testing/reference/api-mapping) in the same PR as the CLI implementation.
