---
sidebar_position: 1
---

# Development Guide

Learn how to build, test, and develop the SP-Istio Agent WASM extension.

## Prerequisites

Ensure you have the following tools installed:

- **Rust toolchain** with `wasm32-unknown-unknown` target
- **Protocol Buffers compiler** (`protobuf-compiler`)
- **kubectl** and **Istio** (for deployment testing)

### Install Development Tools

#### Install Rust WASM Target

```bash
rustup target add wasm32-unknown-unknown
```

#### Install Protocol Buffers Compiler

On Debian/Ubuntu:
```bash
sudo apt-get install protobuf-compiler
```

On macOS:
```bash
brew install protobuf
```

## Build the WASM Extension

Build the WASM binary for production:

```bash
make build
```

This command will:
- Build the WASM binary for the `wasm32-unknown-unknown` target
- Calculate the SHA256 hash
- Display commands to update Istio configurations

## Local Testing

### Test with Envoy and Docker

Run integration tests using a local Envoy instance:

```bash
make integration-test
```

This will:
- Validate the WASM binary
- Start a local Envoy proxy instance
- Test the extension functionality
- Display relevant logs for debugging

## Test in Istio (Kind Cluster)

### Set up Test Cluster

Use the Makefile to create a complete test environment:

```bash
# Create cluster, build + load local image, deploy plugin and demo app
make dev-quickstart

# In a separate terminal, expose the demo on http://localhost:8080
make forward

# Check status
make status
kubectl get wasmplugin -n istio-system
```

This setup:
- Creates a Kind cluster locally
- Builds the WASM module
- Loads the Docker image directly into Kind (no registry required)
- Deploys the plugin and demo application

### Clean up Test Cluster

```bash
make cluster-down
```

## Hot Reload Development Workflow

For rapid iteration without recreating the cluster:

```bash
make dev-reload
```

The `dev-reload` command:
1. Builds `target/wasm32-unknown-unknown/release/sp_istio_agent.wasm`
2. Copies it to the `sp-wasm-http` pod in the `istio-system` namespace
3. Patches the WasmPlugin `spec.url` with a cache-busting query parameter
4. Forces Envoy to re-fetch the module without pod restarts

This workflow significantly speeds up development by allowing you to test changes in seconds.

## Project Structure

```
.
├── src/                    # Rust source code
├── deploy/                 # Kubernetes manifests
│   ├── sp-istio-agent.yaml    # Global WasmPlugin manifest
│   └── test-bookinfo.yaml     # Scoped test manifest
├── test/                   # Test configurations
│   └── envoy.yaml             # Local Envoy test config
├── examples/               # Demo applications
├── scripts/                # Helper scripts
└── Makefile               # Build and deployment automation
```

## Building Custom Features

The SP-Istio Agent is built with Rust and uses the Proxy-Wasm SDK. Key files to modify:

- `src/lib.rs` - Main plugin logic
- `src/http.rs` - HTTP request/response handling
- `src/config.rs` - Plugin configuration

After making changes, rebuild with `make build` and test using the hot reload workflow.

## Debugging

### Enable Debug Logging

To see detailed logs from the WASM extension, add annotations to your pods:

```yaml
annotations:
  sidecar.istio.io/componentLogLevel: "wasm:debug"
```

### View Extension Logs

Check the Envoy proxy logs for SP-Istio Agent messages:

```bash
kubectl logs <pod-name> -c istio-proxy | grep "SP"
```

## Next Steps

- [Deployment Guide](./deployment) - Deploy your custom build to Istio
- [Architecture](../architecture) - Understand the internal workings
- [CI/CD Pipeline](../cicd/index) - Automated testing and releases

