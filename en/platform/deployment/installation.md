
# Server-side Agent (Istio WASM) & SESSIFY Installation

Deploy SP‑Istio Agent to your Istio service mesh, and integrate the SESSIFY for client-side enrichment.

::: tip Looking for user install?
Softprobe user installation, `sp setup`, `sp code`, `sp doctor`, and `sp upgrade` are documented under [Testing installation](/en/testing/installation/). This Platform page is for server/operator deployment.
:::


<div class="sp-link-buttons">
  <a class="button button--secondary" href="https://github.com/softprobe/softprobe" target="_blank" rel="noopener">SP‑Istio Agent on GitHub</a>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>SESSIFY</h3></div>
      <div class="card__body">
        Creates session-scoped context across routes and enriches traces with client metrics and interaction events.
      </div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>SP‑Istio Agent</h3></div>
      <div class="card__body">
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

::: info Using GKE Autopilot?
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

## Install SESSIFY (Client-Side Enrichment)

Add the Softprobe SESSIFY to your frontend to create session-scoped context and capture route changes. This provides full-context visibility without modifying server-side code.

### Install package

```bash
npm install @softprobe/sessify
```

### Initialize at Your App Entry Point

```jsx
// app/layout.tsx or your application's entry file
'use client'
import { useEffect } from 'react';
import { initSessify } from '@softprobe/sessify';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize the session management library
    // This is the necessary first step to use @softprobe/sessify
    initSessify({});
  }, []);

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

See the full [Sessify guide](/sessify) for framework-specific examples (React/Vue/Next.js) and advanced usage.

## Install Server-side Agent (Istio WasmPlugin)

Install SP‑Istio Agent using your personalized `minimal.yaml` file downloaded during [Account Setup](/en/platform/getting-started/account-setup). It contains your public key identifier and pre-configured settings.

```bash
# Use the minimal.yaml file downloaded from the Softprobe Dashboard
kubectl apply -f minimal.yaml
```

::: tip Namespace
If your `minimal.yaml` does not set `metadata.namespace`, specify a namespace explicitly:

```bash
kubectl apply -n <YOUR_NAMESPACE> -f minimal.yaml
```

Or set it in the YAML:

```yaml
metadata:
  namespace: <YOUR_NAMESPACE>
```

Choose the namespace that matches where Istio is installed and where you manage mesh‑wide resources in your cluster.
:::

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

::: tip Next: View Context View in Dashboard
After deploying SP‑Istio Agent and initializing the SESSIFY, generate some traffic in your app, then:

1. Open your Softprobe Dashboard → Context View
2. Select the time range and environment (env) matching your deployment
3. Filter by serviceName if needed; search by userId/sessionId/request_body_hash to locate sessions
4. Click a session to inspect the end‑to‑end graph, spans, client metrics, and interaction events

You do not need to change server‑side code to get full‑context visibility.
:::

<div class="sp-hero-buttons">
  <a class="button button--primary" href="../production/dashboard-user-guide/">Dashboard Guide</a>
  <a class="button button--secondary" href="../getting-started/account-setup/">Account Setup</a>
  <a class="button button--secondary" href="../support/faq/">FAQ</a>
</div>

<div class="sp-img">
  <img src="/img/docs/context-view.png" alt="Session Graph in Context View" />
  <p class="sp-caption">Explore end‑to‑end session graphs after installation.</p>
</div>

## Configuration

Softprobe’s default configuration captures HTTP traffic for all services in the mesh. To customize the capture scope, service identification, and advanced options, please refer to the full Configuration Guide: [Configuration Guide](/en/platform/configuration/config). You can start from the minimal example and gradually extend `collectionRules`, service discovery, and external communication settings based on your needs.

### Scoped Deployment

To deploy the agent to specific namespaces or workloads only, you can create a scoped WasmPlugin configuration. See the [Configuration Guide](/en/platform/configuration/config) for detailed configuration options.
