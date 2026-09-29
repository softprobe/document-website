---
title: 用 Git 管理策略
---

# 用 Git 管理策略

把录制、Mock 和对比策略作为 YAML 文件放在代码仓库里：在合并请求中评审改动，在 CI 中校验，合并后再应用到服务端。字段说明见 [策略 YAML 参考](/zh/testing/policy-yaml-guide)，命令说明见 [sp policy](/zh/testing/commands/policy)。

## 仓库结构

```text
policies/
├── recording-staging.yaml
├── recording-prod.yaml
├── mock-staging.yaml
└── compare-global.yaml
```

## 从服务端导出现有策略

```bash
sp policy recording list --json
sp policy recording export <policy-id> -o policies/recording-prod.yaml
```

## 每个环境一个配置

```jsonc
// ~/.config/softprobe/config.jsonc
{
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

```bash
sp --profile staging policy recording apply -f policies/recording-staging.yaml --json
sp --profile prod policy recording apply -f policies/recording-prod.yaml --json
```

## 在 CI 中校验 {#ci-validation}

每个合并请求都校验全部策略文件，只在合并到主分支后才应用。`sp policy gate` 发现任何一个文件不合法都会以 `1` 退出，任务随之失败；每个文件的校验结果仍写在标准输出的 `data.files` 里。

```yaml
jobs:
  policy-validate:
    runs-on: ubuntu-latest
    env:
      SP_API_URL: https://sp-staging.example.com
      SP_TOKEN: ${{ secrets.SP_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Install sp
        run: |
          curl -fsSL -o sp "${SP_DOWNLOAD_URL:-https://install.softprobe.ai/artifacts/sp/latest}/sp-linux-amd64"
          chmod +x sp && sudo mv sp /usr/local/bin/
      - name: Validate all policies
        run: sp policy gate --dir policies/ --json
      - name: Apply policies
        if: github.ref == 'refs/heads/main'
        run: |
          sp policy recording apply -f policies/recording-prod.yaml --json
          sp policy mock apply -f policies/mock-staging.yaml --json
```

执行任务的 runner 需要能访问后端。`SP_TOKEN` 放在 CI 的密钥库中，不要写进仓库。

## 检查与服务端是否一致

比较仓库中的文件和服务端当前的策略：

```bash
sp policy recording diff -f policies/recording-prod.yaml --against <policy-id> --json
```

## 由 AI 代理修改策略时

1. 先在预发后端上校验。用 `sp policy gate` 时看退出码；用 `sp policy <类型> validate` 时看 `data.valid`，这个命令在策略不合法时也以 `0` 退出。
2. 提交 YAML 并发起合并请求。
3. 不要把 `SP_TOKEN` 写进仓库文件。

策略校验不等于按回放结果决定能否发版；后者见 [发版后自动回放](/zh/testing/webhook-and-ci)。
