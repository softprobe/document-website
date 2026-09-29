---
title: 输出契约
---

# 输出契约

`sp eval` 命令遵循与 Testing 相同的 **`--json` 信封**。Agent 解析 stdout；面向人时可不加 `--json`。

## 成功信封

```json
{
  "ok": true,
  "command": "eval run",
  "data": {
    "run_id": "01J...",
    "manifest_digest": "sha256:abc...",
    "gate": "pass",
    "summary": {
      "cases_total": 8,
      "cases_passed": 8,
      "measurements_emitted": 16
    }
  }
}
```

## 失败信封（stderr，退出码 1）

```json
{
  "ok": false,
  "command": "eval validate",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unsupported assert type: javascript",
    "diagnostics": [
      {
        "path": "tests[3].assert[0]",
        "code": "unsupported_assert",
        "detail": "No kernel evaluator mapping for type javascript"
      }
    ]
  }
}
```

## Validate 响应

`sp eval validate --json` 返回 manifest 片段与诊断，不执行：

```json
{
  "ok": true,
  "command": "eval validate",
  "data": {
    "manifest": { },
    "diagnostics": [],
    "lossy_mappings": []
  }
}
```

任一 **required** 映射失败时为 `ok: false`；警告可出现在 `lossy_mappings` 中且仍为 `ok: true`。

## 制品

大型输出（完整事件流、trace bundle）写入 `--out-dir`：

```json
{
  "ok": true,
  "command": "eval run",
  "data": {
    "run_id": "01J...",
    "artifact": ".sp-work/runs/01J.../events.jsonl",
    "summary": { "gate": "pass" }
  }
}
```

## 退出码

与 Testing 相同——见 [退出码](/zh/testing/agents/output-contract#exit-codes)。Eval 特有：运行本身成功但 **GateDecision** 失败时退出码为 `1`。

## Agent 规则

1. 每次工具调用只发起一次 `sp eval`——不要依赖交互式提示。
2. 导入 Promptfoo 或更改 suite YAML 时，先 **validate** 再 **run**。
3. 不要从 measurement 数量推断通过/失败——读取 `gate` 或运行 `sp eval compare`。
4. Attempt 的 **result status** 不是 CLI 退出码——见 [Result status](/zh/evaluation/reference/result-status)。

Testing 信封细节：[Testing 输出契约](/zh/testing/agents/output-contract)。
