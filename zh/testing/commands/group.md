---
title: sp group 与 sp grant：用户组与应用授权
---

# sp group 与 sp grant：用户组与应用授权

**AI 代理何时使用：** 访问控制的管理自动化（不是典型的诊断流程）。

## 子命令 {#subcommands}

### `sp group`

| 子命令 | 路径前缀 |
|------------|-------------|
| `list` | `/api/userGroup/list` |
| `my` | `/api/userGroup/my` |

### `sp grant`

| 子命令 | 路径 |
|------------|------|
| `list` | `GET /api/appGrant/list` |

`sp grant list` 必须带 `--app <appId>`。

所有命令都需要 `access-token`。

## 示例 {#examples}

```bash
sp group list --json
sp group my --json
sp grant list --app my-app --json
```

### JSON 输出（`group list`） {#json-output-group-list}

```json
{
  "ok": true,
  "command": "group list",
  "data": {
    "items": [
      {
        "id": "group-core-dev",
        "name": "Core Development",
        "description": "Core engineering team"
      }
    ]
  }
}
```

### JSON 输出（`grant list`） {#json-output-grant-list}

```json
{
  "ok": true,
  "command": "grant list",
  "data": {
    "items": [
      {
        "id": "grant-101",
        "appId": "my-app",
        "userGroupId": "group-core-dev",
        "permission": "READ"
      }
    ]
  }
}
```

## 相关文档 {#related}

- [app](/zh/testing/commands/app)
