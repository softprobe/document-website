---
sidebar_position: 1
---

# Troubleshooting

Common issues and solutions for SP-Istio Agent deployment and operation.

## 📋 Overview

This guide helps you diagnose and resolve common issues with SP-Istio Agent, including:
- Installation and deployment problems
- Configuration issues
- Runtime errors
- Performance problems

## 🚨 Common Issues

### 1. WASM Plugin Loading Issues

#### Problem: Plugin Not Loading

**Symptoms:**
- No telemetry data appearing in Softprobe Dashboard
- Envoy logs show WASM loading errors
- Services behave normally but no monitoring data

**Diagnostic Commands:**
```bash
# Check if WasmPlugin resource exists
kubectl get wasmplugin -A

# Check Envoy logs for WASM errors
kubectl logs -l app=<your-app> -c istio-proxy | grep -i wasm

# Check plugin configuration
kubectl describe wasmplugin sp-istio-agent -n istio-system
```

**Common Solutions:**

1. **Verify Plugin Resource:**
   ```bash
   # Ensure WasmPlugin is created correctly
   kubectl get wasmplugin sp-istio-agent -n istio-system -o yaml
   ```

2. **Check Image URL:**
   ```yaml
   spec:
     url:  oci://docker.io/softprobe/sp-istio-wasm:latest  # Correct format
   ```

3. **Restart Affected Pods:**
   ```bash
   # Restart pods to reload WASM plugin
   kubectl rollout restart deployment/<your-deployment>
   ```

#### Problem: SHA256 Hash Mismatch

**Symptoms:**
- Error message: "WASM plugin failed to load: SHA256 hash mismatch"
- Plugin loading fails during Envoy startup

**Solution:**
```bash
# Delete and recreate the WasmPlugin to fetch latest image
kubectl delete wasmplugin sp-istio-agent -n istio-system
kubectl apply -f minimal.yaml
```

### 2. Network Connectivity Issues

#### Problem: Cannot Reach Softprobe Backend

**Symptoms:**
- No data appearing in dashboard
- Network timeout errors in logs
- Agent appears to be running but no telemetry

**Diagnostic Commands:**
```bash
# Test connectivity from within cluster
kubectl run test-pod --image=curlimages/curl -it --rm -- \
  curl -v https://o.softprobe.ai/health

# Check network policies
kubectl get networkpolicy -A

# Verify DNS resolution
kubectl run test-dns --image=busybox -it --rm -- \
  nslookup o.softprobe.ai
```

**Solutions:**

1. **Check Firewall Rules:**
   - Ensure outbound HTTPS (443) traffic is allowed
   - Whitelist `o.softprobe.ai` domain

2. **Verify Network Policies:**
   ```bash
   # Check if NetworkPolicy blocks egress
   kubectl get networkpolicy -A -o yaml | grep -A 10 -B 10 egress
   ```

3. **Corporate Proxy Configuration:**
   ```yaml
   # Add proxy configuration to WasmPlugin
   pluginConfig:
     proxy:
       http_proxy: "http://proxy.company.com:8080"
       https_proxy: "http://proxy.company.com:8080"
   ```

### 3. Configuration Issues

#### Problem: API Key Authentication Failure

**Symptoms:**
- HTTP 401/403 errors in logs
- "Invalid API key" error messages
- Data not reaching Softprobe backend

**Diagnostic Steps:**
```bash
# Check API key in configuration
kubectl get wasmplugin sp-istio-agent -n istio-system -o yaml | grep api_key

# Verify API key format (should start with sk_live_ or sk_test_)
echo "API Key format check needed"
```

**Solutions:**

1. **Regenerate API Key:**
   - Go to Softprobe Dashboard
   - Generate new API key
   - Update configuration with new key

2. **Verify Key Format:**
   ```yaml
   pluginConfig:
     api_key: "sk_live_your_actual_key_here"  # Correct format
   ```

#### Problem: Collection Rules Not Working

**Symptoms:**
- Some services not monitored
- Expected traffic not captured
- Partial data collection

**Diagnostic Commands:**
```bash
# Check current collection rules
kubectl get wasmplugin sp-istio-agent -n istio-system -o yaml | grep -A 20 collectionRules

# Test regex patterns
echo "/api/users" | grep -E "^/api/.*"  # Should match
```

**Solutions:**

1. **Verify Rule Syntax:**
   ```yaml
   collectionRules:
     - mode: "SERVER"
       path: "/api/.*"     # Regex pattern
       # OR
       paths:              # Exact paths
         - "/api/users"
         - "/api/orders"
   ```

2. **Test Rules Incrementally:**
   ```yaml
   # Start with broad rule, then narrow down
   collectionRules:
     - mode: "SERVER"
       path: ".*"  # Capture everything first
   ```

### 4. Performance Issues

#### Problem: High Latency Impact

**Symptoms:**
- Increased response times after agent deployment
- Performance degradation in services
- High CPU usage in sidecars

**Diagnostic Commands:**
```bash
# Monitor resource usage
kubectl top pods -l app=<your-app>

# Check agent-specific metrics
kubectl logs -l app=<your-app> -c istio-proxy | grep sp-istio

# Compare latency before/after
kubectl exec -it <pod-name> -c istio-proxy -- \
  curl -w "@curl-format.txt" http://localhost:15000/stats
```

**Solutions:**

1. **Optimize Collection Rules:**
   ```yaml
   # Reduce collection scope
   collectionRules:
     - mode: "SERVER"
       paths:
         - "/api/critical"  # Only critical endpoints
   ```

2. **Adjust Batching Settings:**
   ```yaml
   pluginConfig:
     batch_size: 100      # Increase batch size
     flush_interval: 5s   # Increase flush interval
   ```

3. **Resource Limits:**
   ```yaml
   # Add resource limits to sidecars
   spec:
     containers:
     - name: istio-proxy
       resources:
         limits:
           cpu: 200m
           memory: 256Mi
   ```

## 🔍 Debugging Tools

### 1. Log Analysis

**Envoy Proxy Logs:**
```bash
# Get detailed WASM logs
kubectl logs <pod-name> -c istio-proxy --tail=100 | grep -i wasm

# Filter for SP-Istio Agent logs
kubectl logs <pod-name> -c istio-proxy | grep sp-istio
```

**Application Logs:**
```bash
# Check if application is affected
kubectl logs <pod-name> -c <app-container>
```

### 2. Configuration Validation

**WasmPlugin Validation:**
```bash
# Validate YAML syntax
kubectl apply --dry-run=client -f minimal.yaml

# Check resource status
kubectl describe wasmplugin sp-istio-agent -n istio-system
```

**Network Connectivity:**
```bash
# Test from within cluster
kubectl run debug-pod --image=nicolaka/netshoot -it --rm -- bash
# Then run: curl -v https://o.softprobe.ai/health
```

### 3. Monitoring Commands

**Resource Usage:**
```bash
# Monitor CPU/Memory usage
kubectl top pods -n <namespace> --containers

# Check Envoy admin interface
kubectl port-forward <pod-name> 15000:15000
# Visit http://localhost:15000/stats
```

**Traffic Analysis:**
```bash
# Check Istio traffic
istioctl proxy-status
istioctl proxy-config cluster <pod-name>
```

## 📞 Getting Help

### 1. Collect Diagnostic Information

Before contacting support, gather:

```bash
# System information
kubectl version
istioctl version

# Agent configuration
kubectl get wasmplugin -A -o yaml > wasmplugin-config.yaml

# Recent logs
kubectl logs -l app=<your-app> -c istio-proxy --tail=200 > envoy-logs.txt

# Resource status
kubectl describe pods -l app=<your-app> > pod-status.txt
```

### 2. Support Channels

- **Documentation**: Check our [configuration guide](../config.md)
- **Dashboard**: Use the help section in Softprobe Dashboard
- **Community**: Join our community discussions
- **Support**: Contact technical support with diagnostic information

### 3. Known Limitations

- **Istio Version**: Requires Istio 1.15 or later
- **Kubernetes Version**: Requires Kubernetes 1.20 or later
- **Protocol Support**: Currently supports HTTP/1.1, HTTP/2, and gRPC
- **TLS**: Works with both mTLS and plain HTTP traffic

## 🔄 Recovery Procedures

### Complete Reset

If issues persist, perform a complete reset:

```bash
# 1. Remove WasmPlugin
kubectl delete wasmplugin sp-istio-agent -n istio-system

# 2. Restart all affected pods
kubectl rollout restart deployment -n <namespace>

# 3. Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=<your-app> --timeout=300s

# 4. Reapply configuration
kubectl apply -f minimal.yaml

# 5. Verify deployment
kubectl get wasmplugin -A
kubectl logs -l app=<your-app> -c istio-proxy | grep -i wasm
```

### Gradual Rollout

For production environments, use gradual rollout:

```bash
# 1. Deploy to single namespace first
kubectl apply -f minimal.yaml -n test-namespace

# 2. Verify functionality
# Test and monitor for issues

# 3. Expand to production
kubectl apply -f minimal.yaml -n production
```

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
