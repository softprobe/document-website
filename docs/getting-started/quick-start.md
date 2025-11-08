---
sidebar_position: 2
sidebar_label: Quick Start
title: Quick Start Guide
description: Get started with Softprobe in minutes using our quick start guide with Kind and Istio
---

# Quick Start Guide

:::info Important
The Quick Start demo environment already has the Web SDK (`@softprobe/web-inspector`) pre-installed and enabled, so you don't need to install it again.
If you want to integrate the SDK into your own frontend app, see [Web SDK Integration](/web-sdk).
:::

Get started with SP-Istio Agent in minutes using a local Kubernetes cluster with Kind.

:::info Time Estimate
- Setup: 10-15 minutes
- Demo exploration: 5-10 minutes
:::

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

## Step 1: Set up Kind Cluster with Istio

Create a Kind cluster and install Istio with OpenTelemetry Operator:

```bash
curl -L https://raw.githubusercontent.com/softprobe/sp-istio-wasm/main/scripts/cluster-setup.sh | sh
```

:::tip
This script will automatically:

- Create a local Kubernetes cluster using Kind
- Install Istio service mesh
- Install OpenTelemetry Operator for telemetry collection
:::

## Step 2: Install the Travel Demo

Deploy the demo application with SP-Istio Agent:

:::note Important
Use the `minimal.yaml` file you downloaded from the [Account Setup](/getting-started/account-setup) guide.
:::

```bash
# Install Softprobe Istio WASM Plugin (using the minimal.yaml downloaded from Account Setup)
kubectl apply -f minimal.yaml

# Install demo app
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio-wasm/main/examples/travel/apps.yaml

# Expose the demo
sleep 10 && kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80
```

## Step 3: Try the Demo

1. Open [`http://localhost:8080/`](http://localhost:8080/) in your browser
2. Select a **pair** of cities
3. Search for flights
4. Complete a booking with any test information
5. Process a payment with fake details

:::tip
Generate at least 5-10 bookings to see meaningful data in the dashboard.
:::

## Step 4: View Results in Softprobe Dashboard

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

:::success Congratulations!
You've successfully set up Softprobe and seen it in action! Next steps:

- [Production Deployment](/deployment/installation) - Deploy to your production cluster
- [Configuration Guide](/configuration/config) - Customize collection rules
- [Advanced Concepts](/advanced-guides/concepts) - Learn how Softprobe works
:::
