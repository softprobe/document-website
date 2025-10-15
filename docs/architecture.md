---
sidebar_position: 3
---

# Architecture

Understanding how SP-Istio Agent works under the hood.

## Overview

SP-Istio Agent is a high-performance WebAssembly (WASM) plugin that runs inside Envoy proxies (Istio sidecars) to capture and analyze HTTP traffic at the business level.

## Technology Stack

- **Rust** - Memory-safe, high-performance systems programming
- **WebAssembly (WASM)** - Portable, sandboxed execution environment
- **Proxy-Wasm ABI** - Standard interface for Envoy proxy extensions
- **Protocol Buffers** - Efficient data serialization
- **OpenTelemetry** - Telemetry data collection and export

## Request Flow

The following diagram illustrates how requests flow through SP-Istio Agent:

```
┌─────────────┐         ┌──────────────────────────────────┐         ┌─────────────┐
│             │         │       Envoy Proxy (Sidecar)      │         │             │
│   Client    │────────▶│  ┌────────────────────────────┐  │────────▶│  Upstream   │
│             │         │  │   SP-Istio Agent (WASM)    │  │         │   Service   │
│             │◀────────│  └────────────────────────────┘  │◀────────│             │
└─────────────┘         └──────────────────────────────────┘         └─────────────┘
                                       │
                                       │ Async
                                       ▼
                               ┌───────────────┐
                               │   Softprobe   │
                               │    Backend    │
                               └───────────────┘
```

### Detailed Flow

1. **Request Interception**: 
   - Envoy proxy intercepts outgoing HTTP requests
   - SP-Istio Agent WASM plugin receives request headers and body

2. **Agent Lookup**: 
   - Plugin checks if cached response is available
   - Sends request metadata to Softprobe backend asynchronously

3. **Cache Hit (Agent Response)**:
   - If cached response exists, returns HTTP 200 with cached data
   - Original upstream service is not called
   - Significantly reduces latency and load

4. **Cache Miss (Agent Miss)**:
   - If no cache exists, returns HTTP 404
   - Request continues to upstream service normally
   - No impact on request path

5. **Response Storage**:
   - After successful upstream response, stores data asynchronously
   - Captures response headers, body, timing information
   - Sends to Softprobe for analytics and future caching

## Key Features

### Asynchronous Processing

The agent uses **non-blocking, asynchronous** processing to minimize performance impact:

- Request/response capture happens in the background
- Critical path (request forwarding) is not blocked
- Softprobe communication is fully asynchronous
- Minimal latency overhead (typically < 1ms)

### Streaming Body Processing

Bodies are processed in a **streaming fashion**:

- Responses forwarded as chunks arrive (no buffering)
- No full-body blocking or memory accumulation
- Configurable buffering for analytics needs
- Size caps and sampling for high-traffic scenarios

### Memory Safety

Built with **Rust** for guaranteed memory safety:

- No buffer overflows or memory leaks
- Thread-safe concurrent processing
- Efficient resource utilization
- Predictable performance characteristics

### Sandboxed Execution

Running in **WebAssembly** provides isolation:

- Cannot access host system resources
- Limited to Proxy-Wasm ABI capabilities
- Fault isolation from Envoy proxy
- Easy to update without proxy restarts

## Data Capture

### Request Data

The agent captures:
- HTTP method, path, query parameters
- Request headers
- Request body (with size limits)
- Client IP and metadata
- Timing information

### Response Data

The agent captures:
- HTTP status code
- Response headers
- Response body (with size limits)
- Upstream service information
- Processing time

### Business Context

The agent enriches data with:
- Service mesh topology
- Kubernetes metadata (namespace, pod, labels)
- Trace context (OpenTelemetry)
- Custom business tags

## Performance Characteristics

### Latency Impact

- **P50**: < 0.5ms added latency
- **P99**: < 2ms added latency
- **Async operations**: No impact on critical path

### Resource Usage

- **Memory**: ~10-20MB per sidecar
- **CPU**: < 5% overhead in typical workloads
- **Network**: Batched, compressed data transmission

### Scalability

- Handles **10,000+ requests/second** per pod
- Linear scaling with pod count
- No centralized bottlenecks
- Distributed architecture

## Security Considerations

### Data Privacy

- Sensitive data can be filtered before capture
- Configurable header/body redaction
- PII detection and masking
- Compliance with data regulations

### Network Security

- TLS-encrypted communication with Softprobe
- mTLS support within service mesh
- No unencrypted data transmission
- Authentication via API keys

### Access Control

- RBAC policies for Kubernetes resources
- Namespace-level isolation
- Workload-specific targeting
- Audit logging

## Deployment Modes

### Global Mode

- Applies to all workloads in the mesh
- Centralized configuration
- Uniform data capture
- Deployed in `istio-system` namespace

### Scoped Mode

- Targets specific namespaces or workloads
- Fine-grained control
- Gradual rollout capability
- Per-service configuration

### Hybrid Mode

- Combines global and scoped policies
- Override global settings per workload
- Flexible deployment strategy
- Priority-based rule application

## Integration Points

### Istio Service Mesh

- Uses Istio's WasmPlugin CRD
- Leverages Envoy's WASM runtime
- Integrates with Istio telemetry
- Works with existing Istio policies

### OpenTelemetry

- Exports traces, metrics, logs
- Compatible with OpenTelemetry Collector
- Supports distributed tracing
- Context propagation across services

### Kubernetes

- Uses Kubernetes metadata
- Integrates with RBAC
- Respects namespace boundaries
- Works with service discovery

## Next Steps

- [Development Guide](./deployment/development) - Build and extend the agent
- [Troubleshooting](./deployment/troubleshooting) - Debug issues
- [CI/CD Pipeline](./cicd/) - Automated testing and releases

