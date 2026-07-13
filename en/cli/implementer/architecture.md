# CLI architecture (recommended)

Not implemented yet — target layout for extending [sp-cli](../../sp-cli/main.go).

## Package layout

```text
sp-cli/
├── main.go                 # Cobra root; register API command trees only
├── cmd/
│   ├── root.go
│   ├── config/
│   ├── auth/
│   ├── app/
│   ├── policy/
│   ├── replay/
│   ├── health/
│   └── …                   # v2 packages
├── internal/
│   ├── client/             # HTTP, auth header, envelopes
│   ├── config/             # profiles, env overrides
│   ├── output/             # JSON envelope, tables, artifacts
│   └── api/                # typed request/response per domain
└── testdata/               # golden JSON
```

No `cmd/code` or embedded VFS in the **public** binary — see [Non-goals](./non-goals).

## HTTP client

- Base URL from profile + `SP_API_URL`
- Default header: `access-token: <token>`
- Timeout: 30s default; `--timeout` override
- Parse two envelopes:
  - `Response` (tr-api): `responseStatusType.responseCode == 0` → success
  - `CommonResponse` (schedule): `result == 1` → success (verify against server)

## Artifacts

- Threshold: responses > 64 KiB → write file under `--out-dir`
- Always artifact: `replay diff get`, `logs download`, `record query` with full payload
- Return CLI envelope with `data.artifact` + `data.summary`

## Build

`build_sp_cli` in `build.sh` should produce a **public** CLI without embedded proprietary source. Any internal source-access binary must be a separate artifact name and distribution channel.

## OpenAPI (future)

Generate from controllers or hand-maintain `reference/openapi.yaml` — until then [API mapping](/en/cli/reference/api-mapping) is authoritative.
