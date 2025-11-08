---
sidebar_position: 1
sidebar_label: Production Installation
title: Production Installation Guide
description: Complete guide for deploying Softprobe in production environments with Istio and Kubernetes
---

# Istio WASM Plugin Installation

Deploy SP-Istio Agent to your production Istio service mesh.

## Prerequisites

Before installing SP-Istio Agent in production, ensure you have:

- A running Kubernetes cluster
- Istio installed and configured
- kubectl access with appropriate permissions
- Network connectivity to Softprobe endpoints

## Installation

Install SP-Istio Agent using your personalized `minimal.yaml` file, which you downloaded during the [Account Setup](/getting-started/account-setup) phase. This file contains your public key identifier and pre-configured settings.

```bash
# Ensure you are using the minimal.yaml file downloaded from the Softprobe Dashboard
kubectl apply -f minimal.yaml
```

This will deploy the WasmPlugin globally across your Istio service mesh.

## Verify Installation

Check that the WasmPlugin has been created successfully:

```bash
kubectl get wasmplugin -A
```

You should see the SP-Istio Agent plugin listed.

## Restart Workloads

After applying the WasmPlugin/EnvoyFilter, restart affected workloads to load the updated sidecar configuration:

```bash
# Restart all deployments in a namespace (replace <namespace>)
kubectl rollout restart deployment -n <namespace>

# Or restart a single deployment
kubectl rollout restart deployment <name> -n <namespace>
```

If you enabled sidecar injection on a namespace just now, restarting ensures pods are recreated with the updated sidecar and configuration.

## Configuration

The default configuration captures HTTP traffic for all services in the mesh. You can customize the behavior by modifying the WasmPlugin resource.

### Scoped Deployment

To deploy the agent to specific namespaces or workloads only, you can create a scoped WasmPlugin configuration. See the [Configuration Guide](/configuration/config) for detailed configuration options.

## Front-End Observability and Session Correlation (sessionId)

Softprobe's Web SDK generates a unique sessionId for each browser tab and reuses it across navigation within the same tab. Opening a new tab creates a new sessionId; closing a tab ends the session. All front-end events, performance metrics, and network requests are reported with this sessionId to enable end-to-end correlation with backend telemetry.

Best practices:
- Propagate the sessionId to backend services via request headers (e.g., `X-Session-Id`) or tracing context.
- Record the sessionId in backend logs/telemetry so that requests, traces, and events from the same session can be aligned.
- Configure collection behavior and headers in the WasmPlugin as needed. See the Configuration Guide.

Learn more in the Web SDK guide: [/web-sdk](/web-sdk). Configuration details: [/configuration/config](/configuration/config).

## Testing with Bookinfo Demo

To validate the installation using Istio's Bookinfo demo application:

```bash
# Enable Istio injection for default namespace
kubectl label namespace default istio-injection=enabled --overwrite

# Deploy Bookinfo application
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/platform/kube/bookinfo.yaml

# Deploy Bookinfo gateway
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/networking/bookinfo-gateway.yaml

# Apply scoped test configuration
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio-wasm/main/deploy/test-bookinfo.yaml
```

### Generate Test Traffic

```bash
# Get the ingress gateway URL
export GATEWAY_URL=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Generate some traffic
curl -sf "http://${GATEWAY_URL}/productpage" >/dev/null

# Verify the plugin is working
kubectl get wasmplugin -A
```

## Uninstallation

To remove SP-Istio Agent from your cluster:

```bash
kubectl delete wasmplugin -n istio-system sp-istio-agent
```

## Next Steps

- Tune collection behavior with the [Configuration Guide](/configuration/config)
- Add front-end visibility using the [Web SDK](/web-sdk)
- If you are testing locally, see the [Quick Start](/getting-started/quick-start)
- For GKE Autopilot clusters, see [GKE Autopilot Istio Installation Guide](/deployment/GKE-Autopilot-Istio-Installation-Guide)
