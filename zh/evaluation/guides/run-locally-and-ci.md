---
title: 本地与 CI 运行
---

# 本地与 CI 运行

## 本地运行

```bash
sp eval pack --dir ./promptfoo-suite --out .softprobe/definition.json
sp eval validate \
  --definition .softprobe/definition.json \
  --runner promptfoo-runner@2.1.0 \
  --out .softprobe/workflow.resolved.json
sp eval run --workflow .softprobe/workflow.resolved.json --out-dir .softprobe/runs/$RUN_ID
```

产物：

| 文件 | CI 用途 |
|------|---------|
| 原生 JUnit / Markdown（来自框架） | 测试报告摄入 |
| `events.jsonl` | Softprobe 审计 / 回放 |
| `artifacts/` | 证据下钻（含原生结果包） |

## GitHub Actions 模式

```yaml
- name: Pack and validate framework suite
  run: |
    sp eval pack --dir ./promptfoo-suite --out .softprobe/definition.json
    sp eval validate --definition .softprobe/definition.json --runner promptfoo-runner@2.1.0 --out .softprobe/workflow.json

- name: Run prompt-only eval
  run: sp eval run --workflow .softprobe/workflow.json --gate routing-v1 --out-dir run-output

- name: Upload eval artifacts
  uses: actions/upload-artifact@v4
  with:
    name: eval-${{ github.sha }}
    path: run-output/
    retention-days: 14
```

## Fork 安全

不可信的 fork PR：

- 始终运行 `sp eval validate`
- 仅在无密钥 / fixture subjects 上运行 `sp eval run` — 无实况提供商密钥

受信分支用固定提供商对比，并带录制的随机性裁决。

## 门禁失败行为

**GateDecision** 失败时非零退出。证据与事件保留供调试 — 门禁在新策略下重算，不会被删除。

参见 [对比与晋升](/zh/evaluation/guides/compare-and-promote)。
