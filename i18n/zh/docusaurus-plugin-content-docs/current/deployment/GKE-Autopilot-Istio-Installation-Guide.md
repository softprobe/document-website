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

## 在 Autopilot 环境进行应用程序插桩（不使用 Operator）

在部分 GKE Autopilot 场景下，集群级 Operator（如 OpenTelemetry Operator）可能受安全策略、私有集群防火墙或 Webhook 要求限制。若无法（或不希望）使用 Operator，可在应用侧手动挂载/启用各语言的 OpenTelemetry Agent，并将数据导出到 OTLP 端点（Collector 或 Softprobe 接入端点）。

### 通用配置

- 选择 OTLP 端点（Collector 服务或外部接入地址）
- 通过环境变量设置服务元数据（service.name、namespace、version 等）
- 确保工作负载到 OTLP 端点的 egress（HTTP 或 gRPC）连通性
- 遵循 Autopilot 规范：尽量使用非 root 容器，并为所有容器设置合理的资源请求/限制

常用环境变量（按需替换为你的端点）：

```bash
# 禁用导出（仅采集，不上报）
export OTEL_TRACES_EXPORTER=none
export OTEL_METRICS_EXPORTER=none
export OTEL_LOGS_EXPORTER=none

# 如需开启上报，请改为：
# export OTEL_TRACES_EXPORTER=otlp
# export OTEL_METRICS_EXPORTER=otlp
# export OTEL_LOGS_EXPORTER=otlp
# 并配置 OTLP 端点与协议：
# export OTEL_EXPORTER_OTLP_ENDPOINT="https://otel.example.com"
# export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"  # 或 "grpc"
# export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer YOUR_TOKEN"
# export OTEL_SERVICE_NAME="your-service"
# export OTEL_RESOURCE_ATTRIBUTES="service.namespace=production,service.version=1.0.0"
```

可以在 Kubernetes Deployment 的 `env:` 中直接设置以上变量。

---

### Java（JVM）

通过 `-javaagent` 挂载 OpenTelemetry Java Agent 并设置环境变量：

```dockerfile
# 建议将 Agent 直接打包进镜像
ADD opentelemetry-javaagent.jar /otel/javaagent.jar
```

```yaml
# Deployment 片段（默认仅采集，不上报）
spec:
  template:
    spec:
      containers:
        - name: app
          image: your-registry/your-java-app:latest
          env:
            - name: OTEL_TRACES_EXPORTER
              value: "none"
            - name: OTEL_METRICS_EXPORTER
              value: "none"
            - name: OTEL_LOGS_EXPORTER
              value: "none"
            - name: OTEL_RESOURCE_ATTRIBUTES
              value: "service.namespace=production,service.version=1.0.0"
            - name: OTEL_INSTRUMENTATION_HTTP_SERVER_CAPTURE_REQUEST_HEADERS
              value: "x-request-id,authorization"
            - name: OTEL_INSTRUMENTATION_HTTP_SERVER_CAPTURE_RESPONSE_HEADERS
              value: "content-type,content-length"
            - name: JAVA_TOOL_OPTIONS
              value: "-javaagent:/otel/javaagent.jar"
          # 如需开启上报，请将上面 three exporter 改为 otlp，并补充以下 OTLP 配置：
          # - name: OTEL_EXPORTER_OTLP_ENDPOINT
          #   value: "https://otel.example.com"
          # - name: OTEL_EXPORTER_OTLP_PROTOCOL
          #   value: "http/protobuf"  # 或 "grpc"
          # - name: OTEL_EXPORTER_OTLP_HEADERS
          #   value: "Authorization=Bearer YOUR_TOKEN"
          # - name: OTEL_SERVICE_NAME
          #   value: "your-service"
```

---

### Node.js

使用 NodeSDK + auto-instrumentations：

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

创建启动前置文件（例如 `otel.js`）：

```js
// otel.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const exporter = new OTLPTraceExporter({
  // 对 HTTP 导出器，URL 会自动追加 /v1/traces
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
    ? Object.fromEntries(process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map(h => h.split('=')))
    : undefined,
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

以预加载方式启动：

```bash
# 方式一：require 启动前置
node -r ./otel.js app.js
# 方式二：通过 NODE_OPTIONS
export NODE_OPTIONS="--require ./otel.js" && node app.js
```

将通用环境变量配置到 Deployment 即可。

---

### Python

使用 Python Distro 与 CLI 插桩：

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap --action=install
```

以 CLI 插桩运行：

```bash
# 先按“通用配置”设置环境变量，然后：
opentelemetry-instrument python app.py
```

也可以在代码中直接初始化 SDK 并配置 OTLP 导出。

---

### .NET

可以使用 SDK 方式进行插桩（更易落地），或启用自动插桩（Native Profiler）。下面示例为 SDK 方式：

```csharp
// Program.cs（示例）
using OpenTelemetry;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry().WithTracing(tracerProviderBuilder =>
{
    tracerProviderBuilder
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(options =>
        {
            options.Endpoint = new Uri(Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT") ?? "https://otel.example.com");
            // 若使用 HTTP/protobuf，请确保协议匹配；需要时设置 headers
        });
});

var app = builder.Build();
app.MapGet("/", () => "Hello World!");
app.Run();
```

如需 .NET 自动插桩，请挂载自动插桩文件并在 Deployment 中设置相关 Profiler 环境变量（`CORECLR_ENABLE_PROFILING`、`CORECLR_PROFILER`、`CORECLR_PROFILER_PATH` 以及对应的 `OTEL_*` 变量）。

---

### Go

Go 通常在代码中使用 SDK 初始化：

```go
// 示意代码
import (
  "go.opentelemetry.io/otel"
  "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
  "go.opentelemetry.io/otel/sdk/resource"
  "go.opentelemetry.io/otel/sdk/trace"
)

func initTracer() (*trace.TracerProvider, error) {
  exporter, err := otlptracehttp.New(context.Background(), otlptracehttp.WithEndpoint(os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")))
  if err != nil { return nil, err }

  tp := trace.NewTracerProvider(
    trace.WithBatcher(exporter),
    trace.WithResource(resource.Default()),
  )
  otel.SetTracerProvider(tp)
  return tp, nil
}
```

若需要无代码方式采集 HTTP（eBPF），可考虑单独的 DaemonSet（如 Beyla）。在 Autopilot 下需确保其符合非特权限制。

---

### Autopilot 场景排错建议

- 验证到 OTLP 端点的 egress 连通性以及 TLS/证书要求
- 为所有容器定义资源请求/限制（resource requests/limits）
- 避免使用特权标志与仅 root 可写路径
- 若策略限制 initContainer，尽量将 Agent 直接打包进镜像
- 同时查看应用与后端/Collector 的日志，确认是否成功导出

### 禁用导出（仅采集，不上报）

在某些场景（例如 Autopilot 冒烟测试）中，可以保留插桩但暂时关闭导出。这样会创建本地的 span/metric/log，但不会向后端发送。

- 跨语言（环境变量）：
  ```bash
  export OTEL_TRACES_EXPORTER=none
  export OTEL_METRICS_EXPORTER=none
  export OTEL_LOGS_EXPORTER=none
  ```
  如上将禁用所有导出器，插桩仍会创建数据，但不会对外发送。

- Java（OpenTelemetry Java Agent）示例：
  ```bash
  JAVA_TOOL_OPTIONS="-javaagent:/otel/opentelemetry-javaagent.jar \
    -Dotel.traces.exporter=none \
    -Dotel.metrics.exporter=none \
    -Dotel.logs.exporter=none \
    -Dotel.resource.attributes=service.name=sp-storage \
    -Dotel.instrumentation.http.server.capture-request-headers=tracestate \
    -Dotel.instrumentation.http.server.capture-response-headers=tracestate"
  ```
  或直接在 JVM 启动命令追加系统属性：
  ```bash
  java -javaagent:/otel/opentelemetry-javaagent.jar \
    -Dotel.traces.exporter=none \
    -Dotel.metrics.exporter=none \
    -Dotel.logs.exporter=none \
    -Dotel.resource.attributes=service.name=sp-storage \
    -Dotel.instrumentation.http.server.capture-request-headers=tracestate \
    -Dotel.instrumentation.http.server.capture-response-headers=tracestate \
    -jar app.jar
  ```

注意：
- 关闭导出后可减少外部流量，便于验证；但插桩的开销仍然存在（会创建数据）。生产环境请恢复所需导出（例如设置 `OTEL_TRACES_EXPORTER=otlp`）。
- 建议始终配置好服务资源属性（service.name、namespace、version 等），以便后续随时开启导出，无需改动应用清单。