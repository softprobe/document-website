---
title: 选择部署方式
---

# 选择部署方式

SoftProbe 由两部分组成：装在一处的**平台**（后端、控制台、数据库），以及挂在每个被测服务上的 **Java Agent**。Agent 的接入方式只有一种；平台有三种部署方式，按你们的环境选一种。

| 部署方式 | 适合 | 装在哪 | 看哪页 |
|---------|------|--------|--------|
| **SoftProbe Cloud** | 先试用；被测服务能访问公网 | 不用装，平台由 SoftProbe 托管 | [第一次录制回放](/zh/testing/getting-started) |
| **单机部署（All-in-One）** | 私有化的常见选择；POC；数据不能出内网 | 一台 Linux 虚拟机，离线安装包自带 Docker、数据库和缓存 | [单机部署（All-in-One）](/zh/testing/installation/all-in-one) |
| **Kubernetes 部署（Helm）** | 已有 Kubernetes 集群；要接已有的 MongoDB、Redis 或对象存储 | 你们的 Kubernetes 集群 | [Kubernetes 部署（Helm）](/zh/testing/installation/server) |

拿不准时：没有现成的 Kubernetes 集群，或者只是 POC，用单机部署；已经有 Kubernetes 集群和运维流程，用 Helm。

## 三种方式有什么不同 {#compare}

| | SoftProbe Cloud | 单机部署 | Kubernetes 部署 |
|---|---|---|---|
| 录制数据存在哪 | SoftProbe 的云上 | 这台虚拟机上 | 集群里的 MongoDB 或你们已有的 MongoDB |
| 是否需要访问互联网 | 需要 | 不需要，可以完全离线安装和运行 | 不需要；镜像要能从你们的镜像仓库拉取 |
| 回放目标在内网时 | 用 [`sp tunnel`](/zh/testing/commands/tunnel) 或桌面客户端 | 直接回放 | 直接回放 |
| 扩容与高可用 | 由 SoftProbe 负责 | 单台机器，不做高可用 | 按集群能力扩容 |

## 桌面客户端 {#desktop}

桌面客户端装在办公电脑上，连接到上面任意一种平台，登录后看到的是同一套应用和数据。以下两种情况需要它：

- 平台是 SoftProbe Cloud，回放目标只在公司内网：在内网的办公电脑上用桌面客户端发起「立即回放」。
- 代码仓库在公司内网，平台访问不到：桌面客户端在本机读代码做 AI 诊断，代码不离开这台电脑。

在控制台右上角点下载按钮获取。私有化部署时，办公电脑要能访问平台服务器的 `8443` 端口，见 [部署前准备](/zh/testing/installation/preparation#optional)。

## 部署之后 {#next}

1. [接入 Java Agent](/zh/testing/java-agent)：在被测服务的启动参数里挂上 Agent。
2. [第一次录制回放](/zh/testing/getting-started)：录几条请求，回放一次，看懂报告。
3. 按需要：[配置 AI 诊断与代码仓库](/zh/testing/installation/ai-diagnosis)、[数据保护与保留期](/zh/testing/installation/data-protection)。
4. 日常维护：[平台维护与故障排查](/zh/testing/installation/operations)。

::: info 业务观测
站内「业务观测」部分的部署（基于 Istio 的网格流量采集）只适用于 SoftProbe Cloud，与这里的录制回放平台无关。
:::
