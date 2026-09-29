---
title: 命令参考
---

# 命令参考

所有公开的 `sp` 命令。调用后端接口的命令请带 `--json`，输出格式见 [输出约定](/zh/testing/agents/output-contract)。`sp --help` 和 `sp <命令> --help` 会列出已安装版本的同一组命令。

## 安装与设置 {#install-and-set-up}

| 命令 | 说明 |
|---------|----------|
| `version` | 显示命令行版本。`sp -v`、`sp --version` 效果相同；`sp version --json` 输出带信封的 JSON |
| [setup](./setup) | 设置后端地址；在 Linux 上可顺带安装共享网页工作台 |
| `doctor` | 检查后端、工作台引擎和共享网页工作台，见 [安装 — 检查安装](/zh/testing/installation/#doctor) |
| `upgrade` | 升级命令行、Java Agent 和工作台引擎，见 [安装 — 升级](/zh/testing/installation/#upgrade) |
| `code` | 在终端里打开工作台，或用 `sp code web` 在浏览器里打开，见 [安装 — 网页工作台](/zh/testing/installation/#web-ui) |

## 生命周期命令（推荐） {#lifecycle-recommended}

下面的命令面向具体任务，按「录制 → 回放」的顺序排列：

| 命令 | 说明 |
|---------|----------|
| [demo](./demo) | `start`、`traffic`、`replay`、`status`、`stop` —— [Travel OTA 演示](https://github.com/softprobe/demo-ota) 全套环境 |
| [agent](./agent) | `download`、`command` —— 安装 jar、生成 JVM 启动参数 |
| [record](./record) | `case list` —— 回放前查看已录制的入口用例 |
| [diagnose](./diagnose) | `replay`、`trace` —— 一键排查 |

## 平台 {#platform}

连接、认证、管理应用和策略、运行回放计划。

| 命令 | 说明 |
|---------|----------|
| [config](./config) | 配置档案、URL、初始化 |
| [auth](./auth) | 登录、whoami、刷新 |
| [app](./app) | 列表、创建、Agent 状态、最近回放 |
| [policy](./policy) | 录制、Mock、对比 YAML 策略 |
| [replay](./replay) | 运行、查看进度、统计、报告、停止、重跑回放计划 |
| [health](./health) | 集群健康检查 |
| [tenant](./tenant) | 仅 SoftProbe Cloud：Agent 使用的租户 API 密钥 |
| [tunnel](./tunnel) | 仅 SoftProbe Cloud：反向隧道，让回放请求能到达你本机的服务 |

## 排查 {#investigation}

录制数据、trace 和回放失败。

| 命令 | 说明 |
|---------|----------|
| [record](./record) | 查询录制数据和完整性 |
| [trace](./trace) | 按业务字段查找 trace |
| [logs](./logs) | 按 `trace_id` 查关联日志 —— 见 [概念与编号](/zh/testing/agents/concepts#ids) |
| [replay case](./replay-case) | 列出用例、元数据、Mock 树 |
| [replay diff](./replay-diff) | 差异产物、对比结果 |
| [extraction-rule](./extraction-rule) | 业务字段提取规则 |

除非另有说明，排查类命令都支持 `--out-dir`、`--page` 和 `--limit`。

## 管理 {#administration}

用户组、系统配置、诊断。

| 命令 | 说明 |
|---------|----------|
| [group](./group) | 用户组与应用授权 |
| [grant](./group) | 应用授权列表（`grant list`） |
| [system](./system) | 系统配置项 |
| [ops](./ops) | 存储与调度诊断 |

`sp recorder` 和 `sp config legacy` 已经移除，见 [sp logs — 已移除的命令](./logs#legacy) 和 [sp config](./config)。

## 全局参数 {#global-flags}

```text
--json          机器可读的 stdout（AI 代理必传）
--profile       配置档案名
--api-url       覆盖后端 URL
--token         覆盖 JWT（否则用 SP_TOKEN 或配置）
--config        额外配置文件（JSONC 覆盖）
--quiet         不输出非错误的 stderr
--out-dir       产物文件目录
--page          页码（排查类列表命令）
--limit         每页条数 / 最大条数
```

## 速查表 {#cheat-sheet}

```bash
sp config init && sp auth login --email u@c.com --code 123456 --json
sp doctor --json
sp app create my-svc --json
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
sp agent command --app <appId> --agent-jar ./sp-agent.jar --json   # 把 startCommand 复制到你的启动脚本里
sp record case list --app <appId> --since -1h --json
sp replay run --app <appId> --env http://your-service:8080 --from -24h --json
sp replay status <planId> --watch --json
sp diagnose replay <planId> --out-dir .sp-work --json
```

## 相关文档 {#related}

- [选择接入方式](/zh/testing/agents/overview)
- [排查回放失败](/zh/testing/examples/agent-diagnose-replay)
- [命令与后端接口对照](/zh/testing/reference/api-mapping)
