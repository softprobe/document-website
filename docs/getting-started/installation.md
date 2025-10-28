---
sidebar_position: 2
---

# Production Installation

Deploy SP-Istio Agent to your production Istio service mesh.

## 📋 Overview

This guide covers production deployment of SP-Istio Agent, including:
- Prerequisites and requirements
- Installation steps
- Verification procedures
- Configuration options

## ⚡ Prerequisites

Before installing SP-Istio Agent in production, ensure you have:

- **Kubernetes cluster** (v1.20+) with sufficient resources
- **Istio installed and configured** (v1.15+)
- **kubectl access** with cluster-admin permissions
- **Network connectivity** to Softprobe endpoints `https://o.softprobe.ai`
- **API key** from your Softprobe account ([Account Setup Guide](./account-setup))

## 🚀 Installation

Install SP-Istio Agent using your personalized configuration:

```bash
# Apply the minimal.yaml file downloaded from your account setup
kubectl apply -f minimal.yaml
```

:::info
The `minimal.yaml` file should be the one automatically downloaded when you generated your API key in the [Account Setup](./account-setup.md) step. This file contains your personalized API key and pre-configured settings.
:::

This will deploy the WasmPlugin globally across your Istio service mesh.

:::tip Custom Configuration
If you need to customize the configuration (such as collection rules, endpoints, etc.), please refer to the [Configuration Guide](./config.md) for detailed instructions.
:::

## ✅ Verify Installation

Check that the WasmPlugin has been created successfully:

```bash
kubectl get wasmplugin -A
```

You should see the SP-Istio Agent plugin listed:

```
NAMESPACE      NAME              AGE
istio-system   sp-istio-agent    30s
```

### Verify Plugin Loading

Check Envoy logs to ensure the plugin is loading correctly:

```bash
# Get a pod with Istio sidecar
kubectl get pods -l app=<your-app> -o name | head -1 | xargs kubectl logs -c istio-proxy | grep -i wasm
```

## ⚙️ Configuration

The default configuration captures HTTP traffic for all services in the mesh. While the default settings are a great starting point, you will likely want to customize the collection rules to fit your specific needs.

For a detailed guide on all configuration options, including how to set up collection rules, service discovery, and more, please refer to our [**Configuration Guide**](./config.md).

### Scoped Deployment

To deploy the agent to specific namespaces or workloads only, you can create a scoped WasmPlugin configuration. See the [Configuration Guide](./config.md) for examples.

## 🧪 Testing with Bookinfo Demo

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

- [Troubleshooting](../deployment/troubleshooting) - Common issues and solutions
- [Architecture](../architecture) - Learn how the agent works
