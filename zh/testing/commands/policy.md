---
title: sp policy：策略管理
---

# sp policy：策略管理

**AI 代理何时使用：** 校验并应用 YAML 策略变更；CI 里用 `gate`。

## 概要 {#synopsis}

管理声明式策略：**录制**、**Mock**、**对比**。

## 结构 {#structure}

```text
sp policy <kind> <action>
```

`<kind>`：`recording` | `mock` | `compare`

| 操作 | 说明 |
|--------|-------------|
| `list` | 列出策略文档 |
| `get <id>` | 按 id 获取策略 |
| `apply` | 创建或更新（`-f` 文件或标准输入） |
| `delete <id>` | 删除策略 |
| `validate` | 只校验不保存（`-f`） |
| `export <id>` | 输出 YAML 到 stdout 或 `-o` |
| `import` | 导入 YAML 文件（`-f`） |
| `diff` | 比较本地文件与服务端导出（`-f`、`--against <id>`） |
| `gate` | 校验一个目录下的全部 YAML 文件（CI） |

## 示例 {#examples}

```bash
sp policy recording list --json
sp policy recording validate -f policies/recording-prod.yaml --json
cat policies/recording-prod.yaml | sp policy recording validate -f - --json
sp policy recording apply -f policies/recording-prod.yaml --json
sp policy recording diff -f policies/recording-prod.yaml --against <policy-id> --json
sp policy gate --dir policies/ --json
sp policy gate --changed-only policies/recording-prod.yaml policies/mock-prod.yaml --json
sp policy recording delete <policy-id> --confirm --json
sp policy mock export policy-id-1 -o mock.yaml
sp policy compare get compare-global --json
```

### JSON 输出（`validate`） {#json-output-validate}

```json
{
  "ok": true,
  "command": "policy recording validate",
  "data": {
    "valid": true,
    "details": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

只要后端有应答，`validate` 就以 `0` 退出，策略不合法时也是如此；`ok: true` 只表示校验执行了。请看 `data.valid`。

### JSON 输出（`gate`） {#json-output-gate}

在 CI/CD 流水线中校验所有改动过或新提交的策略文件：

```json
{
  "ok": true,
  "command": "policy gate",
  "data": {
    "valid": true,
    "files": [
      {
        "path": "policies/recording-prod.yaml",
        "kind": "recording",
        "valid": true
      },
      {
        "path": "policies/mock-prod.yaml",
        "kind": "mock",
        "valid": true
      }
    ]
  }
}
```

有策略文件校验失败时，`policy gate` 以退出码 1 退出。结果照样写到标准输出，`ok` 仍为 `true`，并带上校验详情：

```json
{
  "ok": true,
  "command": "policy gate",
  "data": {
    "valid": false,
    "files": [
      {
        "path": "policies/recording-prod.yaml",
        "kind": "recording",
        "valid": false,
        "details": {
          "valid": false,
          "errors": ["unsupported filter key 'invalidField'"]
        }
      }
    ]
  }
}
```

### JSON 输出（`apply`） {#json-output-apply}

```json
{
  "ok": true,
  "command": "policy recording apply",
  "data": {
    "id": "rec-policy-prod",
    "version": 1,
    "status": "applied"
  }
}
```

### JSON 输出（`diff`） {#json-output-diff}

比较本地策略文件与服务端当前状态：

```json
{
  "ok": true,
  "command": "policy recording diff",
  "data": {
    "against": "rec-policy-prod",
    "file": "policies/recording-prod.yaml",
    "added": ["includeOperations[1]"],
    "changed": ["samplingRate"],
    "removed": [],
    "unchanged": false
  }
}
```

### JSON 输出（`list`） {#json-output-list}

```json
{
  "ok": true,
  "command": "policy recording list",
  "data": {
    "policies": {
      "items": [
        {
          "id": "rec-policy-prod",
          "name": "Production Recording",
          "version": 1
        }
      ]
    }
  }
}
```

## REST 接口对照 {#rest-mapping}

### Recording（`/api/recording-policies`） {#recording-apirecording-policies}

| 操作 | 方法 | 路径 |
|--------|--------|------|
| `list` | GET | `/policies` |
| `get` | GET | `/policies/{id}` |
| `apply`（JSON） | POST | `/policies` |
| `apply`（YAML） | POST | `/policies/yaml`（`Content-Type: text/yaml`） |
| `delete` | DELETE | `/policies/{id}` |
| `validate` | POST | `/policies/validate` |
| `export` | GET | `/policies/{id}/yaml` |

### Mock（`/api/mock-policies`） {#mock-apimock-policies}

`/api/mock-policies` 下的路径模式相同。

### Compare（`/api/compare-rules`） {#compare-apicompare-rules}

| 操作 | 方法 | 路径 |
|--------|--------|------|
| `list` | GET | `/policies` |
| `get` | GET | `/policies/{id}` |
| `apply` | POST | `/policies` |
| `validate` | POST | `/validate` |
| `export` | GET | `/policies/{id}/export`（返回带 `yaml` 字段的 JSON，CLI 从中取出 YAML 写入文件） |
| templates | GET | `/templates`、`/functions`（v2 辅助接口） |

## 数据结构 {#schema}

见 [CLI 策略](/zh/testing/policies) 和 [策略 YAML 指南](/zh/testing/policy-yaml-guide)。

## 相关文档 {#related}

- [用 Git 管理策略](/zh/testing/examples/gitops-policies)，其中包括 [在 CI 中校验](/zh/testing/examples/gitops-policies#ci-validation)
