---
sidebar_position: 2
sidebar_label: GKE Autopilot + Istio 安装指南
title: GKE Autopilot + Istio 安装指南
description: 在 GKE Autopilot 环境中安装 Istio 并部署 Softprobe 的完整步骤与注意事项
---

# GKE Autopilot + Istio 安装指南

本文介绍在 **Google Kubernetes Engine (GKE) Autopilot** 模式下安装 **Istio**，并部署 **Softprobe** 的完整流程及注意事项。

## 前提条件

- 已开通 GCP 账户并创建 GKE Autopilot 集群
- 已安装 `gcloud` 与 `kubectl`
- 拥有集群管理员权限

## 步骤概览

1. 安装 Istio
2. 启用自动 Sidecar 注入
3. 部署 Softprobe 组件
4. 验证与排错

## 1. 安装 Istio

使用官方安装方式或 Operator 管理：

- 参见 [Istio 官方安装文档](https://istio.io/latest/docs/setup/install/)

## 2. 启用自动 Sidecar 注入

在目标命名空间配置标签：

```bash
kubectl label namespace <your-namespace> istio-injection=enabled
```

## 3. 部署 Softprobe

在启用 Sidecar 的命名空间部署 Softprobe 相关组件，并配置公钥认证与采样策略。

## 4. 验证

- 访问服务并观察请求链路
- 在 Softprobe 仪表盘查看服务依赖图与追踪样例
- 如无数据，检查 Sidecar 注入、WASM 插件与网格流量策略

## 常见问题

- Autopilot 下资源配额限制较严格，建议按需调优采样与队列
- 需确保 Istio 版本与 SP-Istio Agent 兼容

---

更多部署细节：
- 若你未使用 GKE，请参考 [生产安装指南](./installation)