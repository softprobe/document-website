# sp health

**When agents use this:** Preflight before a long diagnosis session; CI smoke check.

## Synopsis

Check sp-boot availability.

## Usage

```bash
sp health --json
sp health --api-url https://sp.example.com --json
```

## JSON output

```json
{
  "ok": true,
  "command": "health",
  "data": {
    "status": "UP",
    "url": "http://127.0.0.1:8090"
  }
}
```

## REST mapping

| Method | Path |
|--------|------|
| GET | `/vi/health` |

No authentication required in default deployments (verify for your environment).

## Errors

| Situation | Exit |
|-----------|------|
| Connection refused | 1 |
| Non-200 HTTP | 1 |

## Related

- [Installation](/en/testing/installation/)
