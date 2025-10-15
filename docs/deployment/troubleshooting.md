---
sidebar_position: 3
---

# Troubleshooting

Common issues and solutions for SP-Istio Agent.

## WASM Loading Issues

### Problem: WASM Module Not Loading

**Symptoms:**
- WasmPlugin resource exists but not functioning
- No logs from SP-Istio Agent
- Requests not being captured

**Solution:**

1. Check Envoy logs for WASM-related errors:
```bash
kubectl logs <pod-name> -c istio-proxy | grep -i wasm
```

2. Verify the WasmPlugin resource is created:
```bash
kubectl get wasmplugin -A
kubectl describe wasmplugin sp-istio-agent -n istio-system
```

3. Check that Envoy can pull the WASM module:
```bash
kubectl logs <pod-name> -c istio-proxy | grep -i "wasm.*download"
```

### Problem: SHA256 Hash Mismatch

**Symptoms:**
- Envoy logs show hash verification failures
- WASM module repeatedly re-downloading

**Solution:**

Verify the SHA256 hash matches between binary and configuration:

```bash
# Calculate local hash
shasum -a 256 target/wasm32-unknown-unknown/release/sp_istio_agent.wasm

# Compare with configuration
kubectl get wasmplugin sp-istio-agent -n istio-system -o yaml | grep sha256
```

Update the WasmPlugin manifest if hashes don't match.

## Agent Not Capturing Traffic

### Problem: No Data in Softprobe Dashboard

**Symptoms:**
- Agent appears to be running
- No traces or sessions in Softprobe Dashboard
- Envoy logs show no errors

**Solution:**

1. **Enable debug logging** by adding the annotation to your workload:

```yaml
annotations:
  # Uncomment to enable WASM debug logging
  sidecar.istio.io/componentLogLevel: "wasm:debug"
```

2. **Restart the pod** to apply the annotation:
```bash
kubectl rollout restart deployment/<your-deployment>
```

3. **Check extension logs** for SP-specific messages:
```bash
kubectl logs <pod-name> -c istio-proxy | grep "SP"
```

4. **Verify Softprobe endpoint connectivity**:
```bash
kubectl exec <pod-name> -c istio-proxy -- curl -v https://o.softprobe.ai
```

5. **Check ServiceEntry configuration**:
```bash
kubectl get serviceentry -A
```

Ensure a ServiceEntry exists for `o.softprobe.ai`.

## Network Connectivity Issues

### Problem: Cannot Reach Softprobe Backend

**Symptoms:**
- Logs show connection timeouts or refused connections
- Error messages mentioning `o.softprobe.ai`

**Solution:**

1. **Verify DNS resolution**:
```bash
kubectl exec <pod-name> -c istio-proxy -- nslookup o.softprobe.ai
```

2. **Check egress policies**:
```bash
kubectl get serviceentry -A
kubectl get virtualservice -A | grep softprobe
```

3. **Test connectivity**:
```bash
kubectl exec <pod-name> -c istio-proxy -- curl -v https://o.softprobe.ai/health
```

4. **Review network policies**:
```bash
kubectl get networkpolicy -A
```

Ensure policies allow egress to external HTTPS endpoints.

## Performance Issues

### Problem: Increased Latency After Installing Agent

**Symptoms:**
- Response times increased
- High CPU usage in Envoy sidecars

**Solution:**

1. **Check resource limits**:
```bash
kubectl top pod <pod-name>
```

2. **Review buffering configuration** - Large response bodies may cause memory pressure. Consider:
   - Implementing sampling for high-traffic endpoints
   - Setting size caps for body capture
   - Using streaming mode without buffering

3. **Enable profiling** to identify bottlenecks:
```bash
kubectl exec <pod-name> -c istio-proxy -- curl localhost:15000/stats/prometheus | grep wasm
```

4. **Adjust resource limits** for the sidecar:
```yaml
annotations:
  sidecar.istio.io/proxyCPU: "500m"
  sidecar.istio.io/proxyMemory: "512Mi"
```

## Configuration Issues

### Problem: Plugin Not Applying to Specific Workloads

**Symptoms:**
- Global plugin works for some services but not others
- Inconsistent behavior across the mesh

**Solution:**

1. **Verify selector matches**:
```bash
kubectl get wasmplugin sp-istio-agent -o yaml
```

Check that selectors match your workload labels.

2. **Check Istio injection**:
```bash
kubectl get namespace <namespace> -o yaml | grep istio-injection
```

Ensure the namespace has Istio injection enabled.

3. **Verify pod has sidecar**:
```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].name}'
```

Should include `istio-proxy`.

4. **Check Envoy configuration**:
```bash
kubectl exec <pod-name> -c istio-proxy -- pilot-agent request GET config_dump | grep wasm
```

## Debugging Tips

### Enable Verbose Logging

Add this annotation to your deployment for detailed logs:

```yaml
metadata:
  annotations:
    sidecar.istio.io/componentLogLevel: "wasm:debug,http:debug"
```

### View Real-time Logs

Follow logs with filtering:

```bash
kubectl logs -f <pod-name> -c istio-proxy | grep -E "SP|wasm|error"
```

### Check Request/Response Flow

Use Envoy admin interface:

```bash
kubectl exec <pod-name> -c istio-proxy -- curl localhost:15000/stats | grep sp_istio
```

### Validate WASM Binary

Ensure the binary is valid:

```bash
wasm-validate target/wasm32-unknown-unknown/release/sp_istio_agent.wasm
```

## Getting Help

If you continue to experience issues:

1. Collect diagnostic information:
   - WasmPlugin YAML: `kubectl get wasmplugin -A -o yaml`
   - Envoy logs: `kubectl logs <pod-name> -c istio-proxy`
   - Pod description: `kubectl describe pod <pod-name>`

2. Check the [GitHub Issues](https://github.com/softprobe/sp-istio-wasm/issues)

3. Contact Softprobe support with your diagnostic information

## Next Steps

- [Architecture](../architecture) - Understand how the agent works
- [Development Guide](./development) - Debug and customize the agent
