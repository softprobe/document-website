---
sidebar_position: 5
---

# Architecture

Understanding the SP-Istio Agent architecture and how it integrates with your service mesh.

## 📋 Overview

SP-Istio Agent is a WebAssembly-based observability solution that integrates seamlessly with Istio service mesh to provide:

- **Non-intrusive monitoring** - No code changes required
- **Real-time traffic analysis** - Capture and analyze HTTP/gRPC traffic
- **Service dependency mapping** - Automatic service topology discovery
- **Performance insights** - Latency, throughput, and error rate metrics

## 🏗️ Architecture Components

### Core Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | WebAssembly (WASM) | Secure, portable execution environment |
| **Integration** | Proxy-Wasm ABI | Standard interface for Envoy proxy extensions |
| **Language** | Rust | High-performance, memory-safe implementation |
| **Serialization** | Protocol Buffers | Efficient data serialization |
| **Telemetry** | OpenTelemetry | Industry-standard observability framework |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Softprobe Dashboard                      │
│                 (dashboard.softprobe.ai)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/TLS
                      │ (Telemetry Data)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Softprobe Backend                           │
│                 (o.softprobe.ai)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/TLS
                      │ (Encrypted Telemetry)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Kubernetes Cluster                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Istio Service Mesh                   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              Service Pod                    │   │   │
│  │  │  ┌─────────────┐  ┌─────────────────────┐   │   │   │
│  │  │  │     App     │  │    Envoy Proxy      │   │   │   │
│  │  │  │ Container   │  │  ┌───────────────┐  │   │   │   │
│  │  │  │             │  │  │ SP-Istio Agent│  │   │   │   │
│  │  │  │             │  │  │    (WASM)     │  │   │   │   │
│  │  │  └─────────────┘  │  └───────────────┘  │   │   │   │
│  │  │                   └─────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┐   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### 1. Request Interception

When a request enters your service mesh:

```
Client Request → Istio Gateway → Envoy Proxy → SP-Istio Agent → Application
```

1. **Incoming Request**: Client sends HTTP/gRPC request to your service
2. **Envoy Interception**: Istio's Envoy proxy intercepts the request
3. **WASM Execution**: SP-Istio Agent (WASM module) processes the request
4. **Data Collection**: Agent extracts relevant telemetry data
5. **Request Forwarding**: Request continues to your application

### 2. Agent Processing

The SP-Istio Agent performs several operations:

#### Request Analysis
- **URL Path Matching**: Applies collection rules to determine if request should be captured
- **Header Extraction**: Captures relevant HTTP headers and metadata
- **Timing Measurement**: Records request start time and duration
- **Service Identification**: Automatically detects source and destination services

#### Data Processing
- **Serialization**: Converts telemetry data to Protocol Buffer format
- **Batching**: Groups multiple requests for efficient transmission
- **Compression**: Reduces payload size for network efficiency
- **Encryption**: Secures data before transmission

### 3. Data Transmission

Collected telemetry data flows through secure channels:

```
SP-Istio Agent → Softprobe Backend → Softprobe Dashboard
```

1. **Secure Transmission**: Data sent via HTTPS/TLS to `o.softprobe.ai`
2. **Authentication**: API key validates the data source
3. **Processing**: Backend processes and stores telemetry data
4. **Visualization**: Dashboard provides real-time insights and analytics

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

