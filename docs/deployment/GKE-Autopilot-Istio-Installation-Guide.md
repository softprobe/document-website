---
sidebar_position: 2
sidebar_label: GKE Autopilot Installation
title: GKE Autopilot Istio Installation Guide
description: Step-by-step guide to install and configure Istio on GKE Autopilot clusters, addressing hardened defaults like NET_ADMIN
---

# Complete Guide to Installing Istio on GKE Autopilot

## Overview

This guide provides detailed instructions on how to successfully install and configure Istio service mesh on Google Kubernetes Engine (GKE) Autopilot clusters. GKE Autopilot is Google's managed Kubernetes service that offers hardened defaults and a simplified management experience.

## Prerequisites

### System Requirements
- **GKE Cluster Version**: 1.27 or higher
- **gcloud CLI**: Installed and configured
- **kubectl**: Installed and configured
- **istioctl**: Istio command-line tool

### Permission Requirements
- Administrator access to the GKE cluster
- Permission to modify cluster configurations

## Core Issues and Solutions

### Problem Background
The main challenges when installing Istio on GKE Autopilot are:

1. **NET_ADMIN Permission Restrictions**: Autopilot disables `NET_ADMIN` Linux capability by default as part of hardened defaults
2. **CNI Component Limitations**: Cannot modify ConfigMaps in the `kube-system` namespace
3. **Managed Namespace Restrictions**: Certain system namespaces are managed and protected by Google

### Key Solution
**Enabling NET_ADMIN capability** is the key to solving Istio installation issues!

## Detailed Installation Steps

### Step 1: Check Cluster Version
```bash
# Check Kubernetes version
kubectl version --short

# Check cluster information
kubectl get nodes -o wide
```

Ensure the cluster version is 1.27 or higher.

### Step 2: Configure gcloud Project
```bash
# Set the correct project ID
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

### Step 3: Enable NET_ADMIN Capability for Cluster

#### New Cluster Creation (Recommended)
```bash
gcloud container clusters create-auto istio-cluster \
    --region=us-central1 \
    --workload-policies=allow-net-admin \
    --cluster-version=1.27.2-gke.1200
```

#### Existing Cluster Update
```bash
gcloud container clusters update CLUSTER_NAME \
    --region=REGION \
    --workload-policies=allow-net-admin
```

**Important Note**: The `--workload-policies=allow-net-admin` parameter is crucial for successful Istio installation!

### Step 4: Install Istio

#### 4.1 Download Istio
```bash
# Download latest version
curl -L https://istio.io/downloadIstio | sh -

# Or download specific version
export ISTIO_VERSION=1.27.1
curl -L https://istio.io/downloadIstio | TARGET_ARCH=$(uname -m) sh -

# Add to PATH
cd istio-*
export PATH=$PWD/bin:$PATH
```

#### 4.2 Install Istio Control Plane
```bash
# Use default profile with CNI component disabled
istioctl install --set profile=default --set components.cni.enabled=false -y
```

**Key Configuration Explanation**:
- `--set profile=default`: Uses production-recommended configuration
- `--set components.cni.enabled=false`: Disables CNI component to avoid kube-system permission issues

### Step 5: Verify Installation

#### 5.1 Check Istio Component Status
```bash
# Check Istio system components
kubectl get pods -n istio-system

# Expected output:
# NAME                                    READY   STATUS    RESTARTS   AGE
# istio-ingressgateway-xxx               1/1     Running   0          2m
# istiod-xxx                             1/1     Running   0          2m
```

#### 5.2 Verify CRD Installation
```bash
# Check Istio CRDs
kubectl get crd | grep istio

# Should see the following CRDs:
# - wasmplugins.extensions.istio.io
# - serviceentries.networking.istio.io
# - destinationrules.networking.istio.io
# - envoyfilters.networking.istio.io
# - etc...
```

### Step 6: Configure Namespaces

#### 6.1 Enable Sidecar Injection
```bash
# Enable automatic sidecar injection for target namespace
kubectl label namespace YOUR_NAMESPACE istio-injection=enabled

# Verify label
kubectl describe namespace YOUR_NAMESPACE
```

#### 6.2 Apply Istio Configuration
```bash
# Apply your Istio resource configuration
kubectl apply -f your-istio-config.yaml
```

## Common Issues and Solutions

### Issue 1: NET_ADMIN Permission Denied
**Error Message**:
```
linux capability 'NET_ADMIN' on container 'istio-init' not allowed
```

**Solution**:
Ensure `--workload-policies=allow-net-admin` is enabled

### Issue 2: CNI Installation Failure
**Error Message**:
```
failed to update resource with server-side apply for obj ConfigMap/kube-system/istio-cni-config
```

**Solution**:
Use `--set components.cni.enabled=false` to disable CNI component

### Issue 3: Project Permission Issues
**Error Message**:
```
Kubernetes Engine API has not been used in project
```

**Solution**:
Ensure gcloud configuration points to the correct project ID

## Best Practices


### Performance Optimization
1. **Resource Limits**: Set appropriate resource limits for sidecar containers
2. **Monitoring**: Deploy Istio monitoring components (Prometheus, Grafana, Jaeger)
3. **Log Management**: Configure appropriate log levels and rotation policies

### Maintenance Recommendations
1. **Regular Updates**: Keep Istio versions up to date
2. **Configuration Backup**: Regularly backup Istio configurations
3. **Test Environment**: Validate in test environment before production

## Deployment Verification

### Deploy Test Application
```bash
# Deploy sample application to verify Istio functionality
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.27/samples/bookinfo/platform/kube/bookinfo.yaml

# Check sidecar injection
kubectl get pods -o="custom-columns=NAME:.metadata.name,CONTAINERS:.spec.containers[*].name"
```

### Test Traffic Management
```bash
# Create Gateway and VirtualService
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.27/samples/bookinfo/networking/bookinfo-gateway.yaml

# Get Ingress Gateway address
kubectl get svc istio-ingressgateway -n istio-system
```

## Summary

Key points for successfully installing Istio on GKE Autopilot:

1. ✅ **Enable NET_ADMIN capability**: This is the most important step
2. ✅ **Use correct configuration**: Disable CNI component to avoid permission issues
3. ✅ **Verify installation**: Ensure all components are running properly
4. ✅ **Configure namespaces**: Enable sidecar injection

By following this guide, you should be able to successfully deploy and run Istio service mesh on GKE Autopilot clusters.

## References

- [Istio Official Documentation](https://istio.io/latest/docs/)
- [GKE Autopilot Documentation](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview)
- [GKE Autopilot Hardened Defaults (Security)](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-security)

*This guide is based on actual deployment experience and is applicable to Istio 1.27+ and GKE 1.27+ versions.*


## Application Instrumentation on Autopilot (without Operator)

In some GKE Autopilot environments, installing cluster-wide operators (like OpenTelemetry Operator) can be constrained by security policies, private cluster firewall rules, or webhook requirements. If you can’t (or prefer not to) use the Operator, you can manually attach language-specific agents to your applications and export telemetry to an OTLP endpoint (Collector or Softprobe ingestion endpoint).

### General setup

- Choose an OTLP endpoint (Collector service or external ingestion URL)
- Set service metadata via environment variables
- Ensure egress from workloads to the OTLP endpoint (HTTP or gRPC)
- Prefer non-root containers and define resource requests/limits to comply with Autopilot

Common environment variables (adapt to your endpoint):

```bash
# Example (HTTP OTLP)
export OTEL_EXPORTER_OTLP_ENDPOINT="https://otel.example.com"      # base URL, the SDK will append /v1/traces /v1/metrics
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"                 # or "grpc"
export OTEL_SERVICE_NAME="your-service"
export OTEL_RESOURCE_ATTRIBUTES="service.namespace=production,service.version=1.0.0"
# Optional headers (e.g., auth token)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer YOUR_TOKEN"
```

You may set these variables directly in your Kubernetes Deployment under `env:`.

---

### Java (JVM)

Attach the OpenTelemetry Java agent by adding `-javaagent` and environment variables:

```dockerfile
# Add the agent to the image (recommendation: bake into your app image)
ADD opentelemetry-javaagent.jar /otel/javaagent.jar
```

```yaml
# Deployment snippet
spec:
  template:
    spec:
      containers:
        - name: app
          image: your-registry/your-java-app:latest
          env:
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: "https://otel.example.com"
            - name: OTEL_EXPORTER_OTLP_PROTOCOL
              value: "http/protobuf"
            - name: OTEL_SERVICE_NAME
              value: "your-service"
            - name: OTEL_RESOURCE_ATTRIBUTES
              value: "service.namespace=production,service.version=1.0.0"
            - name: OTEL_EXPORTER_OTLP_HEADERS
              value: "Authorization=Bearer YOUR_TOKEN"
            - name: JAVA_TOOL_OPTIONS
              value: "-javaagent:/otel/javaagent.jar"
          # or use command/args if you manage the JVM startup explicitly
```

If you control the startup script, you can also add: `-javaagent:/otel/javaagent.jar` to the JVM arguments.

---

### Node.js

Use the Node SDK and auto-instrumentations:

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

Create a bootstrap file (e.g., `otel.js`):

```js
// otel.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const exporter = new OTLPTraceExporter({
  // The OTLP exporter appends /v1/traces automatically for HTTP
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

Start your app with the bootstrap required:

```bash
# Option 1: require bootstrap
node -r ./otel.js app.js
# Option 2: via NODE_OPTIONS
export NODE_OPTIONS="--require ./otel.js" && node app.js
```

Set env variables in your Deployment as shown in the General setup section.

---

### Python

Use the Python distro and the CLI instrumentation:

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap --action=install
```

Run the application with instrumentation:

```bash
# Set env vars (as in General setup) then
opentelemetry-instrument python app.py
```

Alternatively, configure the SDK in code and use OTLP exporters.

---

### .NET

For .NET, you can use SDK-based instrumentation or auto-instrumentation (native profiler). SDK-based is simpler to adopt:

```csharp
// Program.cs (example)
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
            // For HTTP/protobuf, ensure protocol matches; set headers if needed
        });
});

var app = builder.Build();
app.MapGet("/", () => "Hello World!");
app.Run();
```

If you need auto-instrumentation, mount the auto-instrumentation files and set the profiler env vars (`CORECLR_ENABLE_PROFILING`, `CORECLR_PROFILER`, `CORECLR_PROFILER_PATH`, and relevant `OTEL_*` variables) in the Deployment.

---

### Go

Go commonly uses SDK-based instrumentation in code:

```go
// Example outline
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

For eBPF-based HTTP telemetry in Go environments without code changes, consider a separate DaemonSet like Beyla. In Autopilot, ensure it complies with non-privileged policies.

---

### Troubleshooting on Autopilot

- Verify egress to the OTLP endpoint and TLS/cert requirements
- Define resource requests/limits for all containers
- Avoid privileged flags and root-only file paths
- Prefer baking agents into images instead of initContainers if your policy restricts them
- Check logs on both application and the OTLP backend/Collector to confirm export success

### Disable exporting (collect-only / no-export mode)
Sometimes you may want to enable instrumentation but temporarily disable exporting (e.g., for smoke tests in Autopilot). You can turn off exporters while keeping instrumentation active.

- Cross-language (environment variables):
  ```bash
  export OTEL_TRACES_EXPORTER=none
  export OTEL_METRICS_EXPORTER=none
  export OTEL_LOGS_EXPORTER=none
  ```
  This disables all exporters. The SDK will still create spans/metrics/logs according to instrumentation, but they will not be sent to any backend.

- Java (OpenTelemetry Java Agent):
  ```bash
  JAVA_TOOL_OPTIONS="-javaagent:/otel/opentelemetry-javaagent.jar \
    -Dotel.traces.exporter=none \
    -Dotel.metrics.exporter=none \
    -Dotel.logs.exporter=none \
    -Dotel.resource.attributes=service.name=sp-storage \
    -Dotel.instrumentation.http.server.capture-request-headers=tracestate \
    -Dotel.instrumentation.http.server.capture-response-headers=tracestate"
  ```
  Or add these system properties directly to your JVM start command:
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

Note:
- Disabling exporters reduces external traffic and is useful for validation; however, instrumentation overhead still exists because spans/metrics/logs are created. For production, restore the desired exporters (e.g., set OTEL_TRACES_EXPORTER=otlp).
- Ensure resource attributes (service.name, namespace, version) remain configured so you can easily switch exporting back on later without needing to change application manifests.