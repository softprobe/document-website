---
title: sp ops：运维诊断
---

# sp ops：运维诊断

**AI 代理何时使用：** 面向 SRE 的存储与调度健康诊断。

## 概要 {#synopsis}

`/vi/storage` 和 `/vi/schedule` 下的运维接口。

## 子命令 {#subcommands}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `storage overview` | GET | `/vi/storage/overview` |
| `storage diagnostics` | GET | `/vi/storage/diagnostics` |
| `storage monitor` | GET | `/vi/storage/monitor` |
| `schedule monitor` | GET | `/vi/schedule/monitor` |

## 示例 {#examples}

```bash
sp ops storage overview --json
sp ops storage diagnostics --json
sp ops schedule monitor --json
```

### JSON 输出（`storage overview`） {#json-output-storage-overview}

```json
{
  "ok": true,
  "command": "ops storage overview",
  "data": {
    "status": "ok",
    "healthy": true
  }
}
```

### JSON 输出（`schedule monitor`） {#json-output-schedule-monitor}

```json
{
  "ok": true,
  "command": "ops schedule monitor",
  "data": {
    "jobs": 0,
    "status": "healthy"
  }
}
```
