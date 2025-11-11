---
sidebar_position: 1
sidebar_label: Production Installation
title: Production Installation Guide
description: Complete guide for deploying Softprobe in production environments with Istio and Kubernetes
---

# Server-side Agent (Istio WASM) & Web SDK Installation

Deploy SP‑Istio Agent to your Istio service mesh, and integrate the Web SDK for client-side enrichment.


<div className="sp-link-buttons">
  <a className="button button--secondary" href="https://github.com/softprobe/sp-istio-wasm" target="_blank" rel="noopener">SP‑Istio Agent on GitHub</a>
</div>

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Web SDK</h3></div>
      <div className="card__body">
        Creates session-scoped context across routes and enriches traces with client metrics and interaction events.
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>SP‑Istio Agent</h3></div>
      <div className="card__body">
        Lightweight Wasm plugin in Istio’s Envoy sidecar capturing HTTP traffic and business flows, emitting native OpenTelemetry traces.
      </div>
    </div>
  </div>
</div>


## Prerequisites

Before installing SP-Istio Agent in production, ensure you have:

- A running Kubernetes cluster
- Istio installed and configured
- kubectl access with appropriate permissions
- Network connectivity to Softprobe endpoints

:::info Using GKE Autopilot?
If your cluster runs on GKE Autopilot, be aware of these common installation/permission constraints (summary from the full guide):
- NET_ADMIN capability is disabled by default, which can break istio-init/iptables steps
- You cannot modify the CNI ConfigMap in the kube-system namespace (managed namespace restrictions)
- Some system namespaces are managed/protected and certain resources cannot be changed

Quick fixes:
- Enable workload policies when creating or updating the cluster: `--workload-policies=allow-net-admin`
- Disable the Istio CNI component during installation: `--set components.cni.enabled=false`

Read the full step-by-step guide, verification, and troubleshooting:
[GKE Autopilot Istio Installation Guide →](./GKE-Autopilot-Istio-Installation-Guide.md)
:::

## Install Web SDK (Client-Side Enrichment)

Add the Softprobe Web SDK to your frontend to create session-scoped context and capture route changes. This provides full-context visibility without modifying server-side code.

### Install package

```bash
npm install @softprobe/web-inspector
```

### Initialize in your app entry

```typescript
import { initInspector } from "@softprobe/web-inspector";

export function register() {
  initInspector({
    publicKey: "<YOUR_PUBLIC_KEY>",
    userId: "<OPTIONAL_USER_ID>",
    serviceName: "<YOUR_SERVICE_NAME>",
    // Data collector endpoint: <INSPECTOR_COLLECTOR_URL>/v1/traces
    collectorEndpoint: process.env.INSPECTOR_COLLECTOR_URL!,
    env: process.env.NODE_ENV === "production" ? "prod" : "dev",
    observeScroll: false,
  })
    .then(() => console.log("Softprobe inspector initialized"))
    .catch((error) => console.error("Inspector init failed", error));
}
```

See the full [Web SDK guide](/web-sdk) for framework-specific examples (React/Vue/Next.js) and advanced usage.

## Install Server-side Agent (Istio WasmPlugin)

Install SP‑Istio Agent using your personalized `minimal.yaml` file downloaded during [Account Setup](/getting-started/account-setup). It contains your public key identifier and pre-configured settings.

```bash
# Use the minimal.yaml file downloaded from the Softprobe Dashboard
kubectl apply -f minimal.yaml
```

This deploys the WasmPlugin globally across your Istio service mesh.

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
## View Context View in Dashboard
If you enabled sidecar injection on a namespace just now, restarting ensures pods are recreated with the updated sidecar and configuration.

:::success Next: View Context View in Dashboard
After deploying SP‑Istio Agent and initializing the Web SDK, generate some traffic in your app, then:

1. Open your Softprobe Dashboard → Context View
2. Select the time range and environment (env) matching your deployment
3. Filter by serviceName if needed; search by userId/sessionId/request_body_hash to locate sessions
4. Click a session to inspect the end‑to‑end graph, spans, client metrics, and interaction events

You do not need to change server‑side code to get full‑context visibility.
:::

<div className="sp-hero-buttons">
  <a className="button button--primary" href="/production/dashboard-user-guide">Dashboard Guide</a>
  <a className="button button--secondary" href="/getting-started/account-setup">Account Setup</a>
  <a className="button button--secondary" href="/support/faq">FAQ</a>
</div>

<div className="sp-img">
  <img src="/img/docs/context-view.png" alt="Session Graph in Context View" />
  <p className="sp-caption">Explore end‑to‑end session graphs after installation.</p>
</div>

## Configuration

Softprobe’s default configuration captures HTTP traffic for all services in the mesh. To customize the capture scope, service identification, and advanced options, please refer to the full Configuration Guide: [Configuration Guide](/configuration/config). You can start from the minimal example and gradually extend `collectionRules`, service discovery, and external communication settings based on your needs.

### Scoped Deployment

To deploy the agent to specific namespaces or workloads only, you can create a scoped WasmPlugin configuration. See the [Configuration Guide](/configuration/config) for detailed configuration options.
