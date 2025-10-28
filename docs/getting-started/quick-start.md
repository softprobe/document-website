---
sidebar_position: 1
---

# Quick Start

Get started with SP-Istio Agent in minutes using a local Kubernetes cluster with Kind.

## Prerequisites

- **Operating System**: macOS (or Linux with Docker)
- **Required Tools**:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - [Kind](https://kind.sigs.k8s.io/) - `brew install kind`
  - [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/) - `brew install kubectl`
  - [Istio CLI](https://istio.io/latest/docs/setup/getting-started/#download) - `brew install istioctl`

### Install All Tools at Once

```bash
brew install kind kubectl istioctl
```

## Step 1: Get Your Configuration File

First, you need to obtain your personalized `minimal.yaml` configuration file:

1. Go to [Softprobe Dashboard](https://dashboard.softprobe.ai)
2. Follow the [Account Setup Guide](./account-setup.md) to create an account and generate an API key
3. When you create an API key, a `minimal.yaml` file will be automatically downloaded
4. **Important**: Save this file as it's a one-time download

## Step 2: Set up Kind Cluster with Istio

Create a Kind cluster and install Istio with OpenTelemetry Operator:

```bash
curl -L https://raw.githubusercontent.com/softprobe/sp-istio-wasm/refs/heads/main/scripts/cluster-setup.sh | sh
```

This script will:
- Create a local Kubernetes cluster using Kind
- Install Istio service mesh
- Install OpenTelemetry Operator for telemetry collection

## Step 3: Install the Travel Demo

Deploy the demo application with SP-Istio Agent:

```bash
# Install Softprobe Istio WASM Plugin with your configuration
kubectl apply -f minimal.yaml

# Install demo app
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio-wasm/refs/heads/main/examples/travel/apps.yaml

# Expose the demo
sleep 10 && kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80
```

## Step 4: Try the Demo

1. Open [`http://localhost:8080/`](http://localhost:8080/) in your browser
2. Select a **pair** of cities 
3. Search for flights
4. Complete a booking with any test information
5. Process a payment with fake details

## Step 5: View Results in Softprobe Dashboard

After generating some traffic:

1. Go to [Softprobe Dashboard](https://dashboard.softprobe.ai)
2. Navigate to **Travel View** in the left navigation menu
3. Explore the captured requests and business-level traces

### Demo Video

https://github.com/user-attachments/assets/dc8c68db-dd8b-4da8-a6e2-346adf6ecffb

## Cleanup

When you're done with the demo, clean up the Kind cluster:

```bash
kind delete cluster --name sp-demo-cluster
```

## Next Steps

- [Configuration Guide](./config.md) - Learn how to customize the agent
- [Production Installation](./installation) - Deploy to your production cluster
- [Development Guide](../deployment/development) - Learn how to build and modify the agent
- [Architecture](../architecture) - Understand how it works under the hood

