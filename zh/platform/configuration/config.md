
# 配置指南

了解如何为您的特定用例配置 SP-Istio Agent。

## 📋 概述

本指南涵盖：

- 理解配置结构
- 设置采集规则
- 配置服务发现
- 高级配置选项

## 🏗️ 配置结构

SP-Istio Agent 配置在 `minimal.yaml` 文件中定义，该文件包含三个主要组件：

### 1. WasmPlugin 资源

将 SP-Istio Agent 加载到 Istio 的 Envoy 代理中的核心组件：

```yaml
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
  namespace: istio-system
spec:
  url: oci://docker.io/softprobe/softprobe:latest
  pluginConfig:
    # 您的配置在此处
```

### 2. EnvoyFilter 资源

配置 Envoy 代理设置以实现最佳性能：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: sp-istio-agent-config
  namespace: istio-system
spec:
  configPatches:
    # Envoy 特定配置
```

### 3. 网络资源

定义网络策略和服务发现设置。

## ⚙️ 核心配置选项

### 基本设置

| 字段             | 类型   | 描述                    | 默认值                   |
| ---------------- | ------ | ----------------------- | ------------------------ |
| `api_key`        | string | 您的 Softprobe API 密钥 | 必填                     |
| `sp_backend_url` | string | Softprobe 采集端点      | `https://o.softprobe.ai` |
| `service_name`   | string | 覆盖服务名称检测        | 自动检测                 |

### 基本配置示例

```yaml
pluginConfig:
  api_key: "您的 API 密钥"
  sp_backend_url: "https://o.softprobe.ai"
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        - path: ".*"
```

## 🎯 采集规则

采集规则定义要捕获和分析的流量。它们通过 `traffic_direction` 设置支持 `SERVER`（入站）和 `CLIENT`（出站）两种模式。

### 规则结构

**对于 SERVER 模式（入站流量）：**

```yaml
pluginConfig:
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        - path: ".*" # URL 路径的正则表达式模式
```

**对于 CLIENT 模式（出站流量）：**

```yaml
pluginConfig:
  traffic_direction: "client"
  collectionRules:
    http:
      client:
        - host: ".*" # 主机名的正则表达式模式
          paths: [".*"] # 路径的正则表达式模式列表
```

### SERVER 模式规则

捕获到您服务的入站请求：

```yaml
pluginConfig:
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        # 捕获所有 API 端点
        - path: "/api/.*"
        # 捕获特定端点
        - path: "/health"
        - path: "/metrics"
        - path: "/api/v1/users"
```

### CLIENT 模式规则

捕获从您服务发出的出站请求：

```yaml
pluginConfig:
  traffic_direction: "client"
  collectionRules:
    http:
      client:
        # 捕获所有到任何主机的出站请求
        - host: ".*"
          paths: [".*"]
        # 捕获到外部服务的特定 API 调用
        - host: ".*\\.googleapis\\.com"
          paths: ["/maps/api/.*", "/drive/v3/files"]
        # 捕获到特定服务的请求
        - host: "my-api\\.com"
          paths: ["/api/.*"]
```

---

## 采集规则说明 (`collectionRules`)

`collectionRules` 是 SP-Istio Agent 中最核心和灵活的配置项。它允许您精确定义要收集哪些 HTTP 流量，从而避免不必要的数据报告，节省成本并提高效率。

### 使用正则表达式

在所有采集规则中，`path`、`host` 和 `paths` 字段的值都是**正则表达式 (Regex)**。这为您提供了强大的匹配能力。

- 要匹配所有内容，请使用 `.*`。
- 对于精确匹配，请直接写入字符串，例如 `"/api/users"`。
- 要匹配特定模式，请使用正则表达式语法，例如 `"/api/v[0-9]+/items"` 可以匹配 `/api/v1/items` 和 `/api/v2/items`。

**注意**：如果提供了无效的正则表达式，系统将自动回退到**精确字符串匹配**。

### SERVER 模式下的采集

当 `traffic_direction` 设置为 `server` 时，Agent 会收集**入站**流量。在这种情况下，您需要配置 `collectionRules.http.server`。

```yaml
# ...
pluginConfig:
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        - path: ".*" # 这是一个采集规则
```

- **`server`**: 包含多个采集规则的数组。
- **`path`**: 用于匹配入站请求的 **URL 路径** 的正则表达式。

**工作原理**：对于进入您服务的每个请求，Agent 会获取其 URL 路径（例如，`/api/users/123`）并将其与 `path` 字段中定义的正则表达式进行匹配。如果匹配成功，则收集该请求及其相应的响应。

**示例**：

```yaml
# 仅收集 /api/v1/ 下的请求
collectionRules:
  http:
    server:
      - path: "/api/v1/.*"

# 收集与用户和订单相关的请求
collectionRules:
  http:
    server:
      - path: "/users/[^/]+$"  # 匹配 /users/some-id
      - path: "/orders/[0-9]+" # 匹配 /orders/12345
```

### CLIENT 模式下的采集

当 `traffic_direction` 设置为 `client` 时，Agent 会收集**出站**流量。在这种情况下，您需要配置 `collectionRules.http.client`。

```yaml
# ...
pluginConfig:
  traffic_direction: "client"
  collectionRules:
    http:
      client:
        - host: ".*\\.external-service\\.com"
          paths: ["/api/data/.*", "/api/auth"]
```

- **`client`**: 包含多个采集规则的数组。
- 每个规则包含 `host` 和 `paths` 字段。
- **`host`**: 用于匹配出站请求的**目标主机名** 的正则表达式。
- **`paths`**: 字符串数组，其中每个字符串都是用于匹配出站请求的**URL 路径** 的正则表达式。

**工作原理**：对于从您服务发出的每个请求，Agent 将：

1.  **确定目标主机和路径**：Agent 尝试从 HTTP 头部（例如 `Referer`、`Origin` 或 `Host`）中提取目标主机名和路径。
2.  **匹配 `host`**：将提取的目标主机名与 `host` 字段中的正则表达式进行匹配。
3.  **匹配 `paths`**：如果主机名匹配，Agent 将继续将提取的 URL 路径与 `paths` 数组中的**任何一个**正则表达式进行匹配。

**只有当 `host` 和 `paths` 中的至少一个路径规则都成功匹配时，才会收集出站请求及其相应的响应。**

**示例**：

```yaml
# 收集所有到 my-api.com 的出站请求，无论路径如何
collectionRules:
  http:
    client:
      - host: "my-api\\.com"
        paths: [".*"]

# 收集到 googleapis.com 的特定 API 调用
collectionRules:
  http:
    client:
      - host: ".*\\.googleapis\\.com"
        paths: ["/maps/api/.*", "/drive/v3/files"]
```

---

## 服务发现：自动识别您的服务

在复杂的微服务环境中，准确识别每个服务至关重要。SP-Istio Agent 通过一个名为 `inject-app-name-header` 的 `EnvoyFilter` 实现这一点。

此 `EnvoyFilter` 在处理每个请求之前执行一小段 Lua 脚本。该脚本的唯一目的是**查找当前服务的名称**并将其添加到特殊的 HTTP 头部 `x-sp-service-name` 中。

**它是如何工作的？**

该脚本按顺序尝试从几个常见的 Kubernetes 环境变量（例如 `OTEL_SERVICE_NAME`、`APP_NAME`、`SERVICE_NAME`）获取服务名称，或者通过从 `POD_NAME` 中解析它。这种多源方法大大提高了自动服务识别的准确性，并且**您通常不需要任何额外的配置**。

---

## 外部通信：连接到 Softprobe 后端

为了使 SP-Istio Agent 能够将数据发送到 `o.softprobe.ai`，我们需要在 Istio 中明确授权此外部通信。这通过两个资源完成：`ServiceEntry` 和 `DestinationRule`。

- **`ServiceEntry`**: 将 `o.softprobe.ai` 添加到 Istio 的服务注册表中，使其成为合法的外部服务。
- **`DestinationRule`**: 为到 `o.softprobe.ai` 的流量配置 TLS 加密，确保安全数据传输。

简而言之，这两个资源共同为 SP-Istio Agent 打开了一个到 Softprobe 后端的安全通道。

我们希望这份详细指南能帮助您更好地理解和使用 SP-Istio Agent。如果您有任何问题，请随时联系我们！
