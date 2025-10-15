---
sidebar_position: 2
---

# Deployment Guide

Detailed guide for deploying SP-Istio Agent to your Istio service mesh.

## Deployment Options

SP-Istio Agent can be deployed in different scopes:

1. **Global Deployment** - Applies to all workloads in the mesh
2. **Namespace-Scoped** - Applies to specific namespaces
3. **Workload-Scoped** - Applies to specific services or deployments

## Global Deployment

For production environments, deploy the agent globally across all services:

```bash
kubectl apply -f deploy/sp-istio-agent.yaml
```

This manifest includes:
- WasmPlugin resource in `istio-system` namespace
- ServiceEntry for Softprobe backend connectivity
- Appropriate RBAC configurations

## Scoped Deployment

### Deploy to Specific Namespace

To apply the agent to a specific namespace, create a WasmPlugin resource in that namespace:

```yaml
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
  namespace: my-app-namespace
spec:
  selector:
    matchLabels:
      app: my-app
  url: oci://docker.io/softprobe/sp-istio-wasm:latest
  phase: AUTHN
```

### Test with Bookinfo (Scoped)

For safe testing with Istio's Bookinfo demo, use the scoped test manifest:

```bash
# Enable Istio injection
kubectl label namespace default istio-injection=enabled --overwrite

# Deploy Bookinfo
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/platform/kube/bookinfo.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/networking/bookinfo-gateway.yaml

# Apply scoped SP-Istio Agent (targets only productpage)
kubectl apply -f deploy/test-bookinfo.yaml
```

Generate traffic and verify:

```bash
export GATEWAY_URL=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -sf "http://${GATEWAY_URL}/productpage" >/dev/null
kubectl get wasmplugin -A
```

## Configuration Files

### deploy/sp-istio-agent.yaml

Global WasmPlugin manifest for production deployment. Includes:
- Global scope (applies to entire mesh)
- OCI image reference
- ServiceEntry for Softprobe backend
- Default plugin configuration

### deploy/test-bookinfo.yaml

Scoped test manifest for Bookinfo demo. Includes:
- Workload-specific selectors
- ServiceEntry for external connectivity
- Test-specific configuration

### test/envoy.yaml

Local Envoy configuration for development testing. Used with:
```bash
make integration-test
```

## Plugin Configuration

The WasmPlugin resource accepts the following configuration parameters:

```yaml
spec:
  phase: AUTHN              # Plugin execution phase
  priority: 10              # Execution priority
  url: oci://...            # WASM module location
  imagePullPolicy: Always   # Image pull policy
  pluginConfig:             # Plugin-specific config
    # Add custom configuration here
```

## Network Requirements

### ServiceEntry for Softprobe

The agent requires connectivity to Softprobe backend:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: softprobe-external
  namespace: istio-system
spec:
  hosts:
    - o.softprobe.ai
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
```

Ensure your cluster's egress policies allow connections to `o.softprobe.ai`.

## Verify Deployment

### Check WasmPlugin Status

```bash
kubectl get wasmplugin -A
```

### Check Envoy Configuration

Verify that the WASM module is loaded in Envoy:

```bash
kubectl exec -n <namespace> <pod-name> -c istio-proxy -- curl localhost:15000/config_dump | grep sp-istio
```

### View Logs

Check that the plugin is processing requests:

```bash
kubectl logs -n <namespace> <pod-name> -c istio-proxy | grep "SP"
```

## Rollback

To remove the agent:

```bash
# Delete specific WasmPlugin
kubectl delete wasmplugin sp-istio-agent -n istio-system

# Or delete the entire manifest
kubectl delete -f deploy/sp-istio-agent.yaml
```

Envoy will automatically unload the WASM module and resume normal operation.

## Performance Considerations

- **Streaming Processing**: Bodies are processed in a streaming fashion; responses are forwarded as chunks arrive (no full-body blocking)
- **Memory Overhead**: Optional buffering for analytics increases memory/CPU usage. Apply size caps and sampling for high-traffic services
- **Async Storage**: Asynchronous storage keeps tail latency low; only lightweight work happens on the hot path
- **Resource Limits**: Consider setting appropriate resource limits for workloads with the agent enabled

## Next Steps

- [Troubleshooting](./troubleshooting) - Common deployment issues
- [Architecture](../architecture) - Understand the request flow
- [Development Guide](./development) - Build and customize the agent

