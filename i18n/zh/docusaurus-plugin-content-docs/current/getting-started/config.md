---
sidebar_position: 3
---

# 配置指南

本指南详细介绍如何配置 SP-Istio Agent 以满足您的特定需求。

## 基本配置

SP-Istio Agent 通过 `minimal.yaml` 配置文件进行配置，该文件在创建 API 密钥时自动生成。

### 配置文件结构

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sp-istio-config
  namespace: istio-system
data:
  config.yaml: |
    api_key: "your-api-key-here"
    endpoint: "https://api.softprobe.ai"
    sampling_rate: 1.0
    filters:
      - path: "/health"
        method: "GET"
        exclude: true
```

## 高级配置选项

### 采样率配置

控制数据收集的采样率：

```yaml
sampling_rate: 0.1  # 收集 10% 的请求
```

### 过滤器配置

排除特定的请求路径：

```yaml
filters:
  - path: "/health"
    method: "GET"
    exclude: true
  - path: "/metrics"
    method: "GET"
    exclude: true
```

### 自定义端点

如果您使用私有部署：

```yaml
endpoint: "https://your-private-instance.com"
```

## 环境特定配置

### 生产环境

```yaml
api_key: "sk_live_..."
sampling_rate: 0.1
log_level: "warn"
```

### 开发环境

```yaml
api_key: "sk_test_..."
sampling_rate: 1.0
log_level: "debug"
```

## 故障排除

### 常见配置问题

1. **API 密钥无效**
   - 检查密钥格式是否正确
   - 确认密钥未过期

2. **连接问题**
   - 验证网络连接
   - 检查防火墙设置

3. **数据未显示**
   - 确认采样率设置
   - 检查过滤器配置