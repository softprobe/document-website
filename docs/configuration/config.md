---
sidebar_position: 1
sidebar_label: Configuration Reference
title: Configuration Guide
description: Complete reference for configuring SP-Istio Agent, including collection rules, service discovery, and advanced options
---

# Configuration Guide

Learn how to configure SP-Istio Agent for your specific use cases.

:::info Before You Begin
- Complete [Account Setup](/getting-started/account-setup) to get your public key
- Have your `minimal.yaml` configuration file ready
- Basic understanding of YAML and regular expressions
:::

## Overview

This guide covers:

- Understanding the configuration structure
- Setting up collection rules
- Configuring service discovery
- Advanced configuration options

## Configuration Structure

The SP-Istio Agent configuration is defined in a `minimal.yaml` file that contains three main components:

### 1. WasmPlugin Resource

The core component that loads the SP-Istio Agent into Istio's Envoy proxies:

```yaml
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
  namespace: istio-system
spec:
  url: oci://docker.io/softprobe/softprobe:latest
  pluginConfig:
    # Your configuration goes here
```

### 2. EnvoyFilter Resource

Configures Envoy proxy settings for optimal performance:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: sp-istio-agent-config
  namespace: istio-system
spec:
  configPatches:
    # Envoy-specific configurations
```

### 3. Network Resources

Defines network policies and service discovery settings.

## Core Configuration Options

### Basic Settings

| Field            | Type   | Description                     | Default                  |
| ---------------- | ------ | ------------------------------- | ------------------------ |
| `public_key`     | string | Your Softprobe public key       | Required                 |
| `sp_backend_url` | string | Softprobe collection endpoint   | `https://o.softprobe.ai` |
| `service_name`   | string | Override service name detection | Auto-detected            |

### Example Basic Configuration

```yaml
pluginConfig:
  public_key: "your-public-key-here"
  sp_backend_url: "https://o.softprobe.ai"
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        - path: ".*"
```

:::tip
Always start with the basic configuration and gradually add collection rules based on your specific needs.
:::

## 🎯 Collection Rules

Collection rules define what traffic to capture and analyze. They support both `SERVER` (inbound) and `CLIENT` (outbound) modes through the `traffic_direction` setting.

### Rule Structure

**For SERVER mode (inbound traffic):**

```yaml
pluginConfig:
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        - path: ".*" # Regex pattern for URL paths
```

**For CLIENT mode (outbound traffic):**

```yaml
pluginConfig:
  traffic_direction: "client"
  collectionRules:
    http:
      client:
        - host: ".*" # Regex pattern for hostnames
          paths: [".*"] # List of regex patterns for paths
```

### SERVER Mode Rules

Capture inbound requests to your services:

```yaml
pluginConfig:
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        # Capture all API endpoints
        - path: "/api/.*"
        # Capture specific endpoints
        - path: "/health"
        - path: "/metrics"
        - path: "/api/v1/users"
```

### CLIENT Mode Rules

Capture outbound requests from your services:

```yaml
pluginConfig:
  traffic_direction: "client"
  collectionRules:
    http:
      client:
        # Capture all outbound requests to any host
        - host: ".*"
          paths: [".*"]
        # Capture specific API calls to external services
        - host: ".*\\.googleapis\\.com"
          paths: ["/maps/api/.*", "/drive/v3/files"]
        # Capture requests to specific service
        - host: "my-api\\.com"
          paths: ["/api/.*"]
```

---

## Collection Rules Explained (`collectionRules`)

`collectionRules` is the most central and flexible configuration item in the SP-Istio Agent. It allows you to precisely define which HTTP traffic to collect, thus avoiding unnecessary data reporting, saving costs, and improving efficiency.

### Using Regular Expressions

In all collection rules, the values of the `path`, `host`, and `paths` fields are **regular expressions (Regex)**. This provides you with powerful matching capabilities.

- To match everything, use `.*`.
- For an exact match, write the string directly, for example, `"/api/users"`.
- To match a specific pattern, use regex syntax, for example, `"/api/v[0-9]+/items"` can match `/api/v1/items` and `/api/v2/items`.


## Service Discovery: Automatically Identifying Your Services

In a complex microservices environment, accurately identifying each service is crucial. The SP-Istio Agent achieves this through an `EnvoyFilter` named `inject-app-name-header`.

This `EnvoyFilter` executes a small piece of Lua script before processing each request. The sole purpose of this script is to **find the name of the current service** and add it to a special HTTP header, `x-sp-service-name`.

**How does it work?**

The script sequentially attempts to get the service name from several common Kubernetes environment variables, such as `OTEL_SERVICE_NAME`, `APP_NAME`, `SERVICE_NAME`, or by parsing it from `POD_NAME`. This multi-source approach greatly improves the accuracy of automatic service identification, and **you usually do not need any additional configuration**.

---

## External Communication: Connecting to the Softprobe Backend

To enable the SP-Istio Agent to send data to `o.softprobe.ai`, we need to explicitly authorize this external communication in Istio. This is done through two resources: `ServiceEntry` and `DestinationRule`.

- **`ServiceEntry`**: Adds `o.softprobe.ai` to Istio's service registry, making it a legitimate external service.
- **`DestinationRule`**: Configures TLS encryption for traffic to `o.softprobe.ai`, ensuring secure data transmission.

In short, these two resources together open a secure channel for the SP-Istio Agent to the Softprobe backend.

We hope this detailed guide helps you better understand and use the SP-Istio Agent. If you have any questions, please feel free to contact us!

## Who should use this guide

This guide is intended for:

- Platform/SRE engineers managing Kubernetes + Istio deployments
- Dev teams needing fine-grained collection rules
- Anyone customizing Softprobe to match business flows

## Next Steps

- Deploy or update your cluster with the [Installation Guide](/deployment/installation)
- Verify data in the [Softprobe Dashboard](https://dashboard.softprobe.ai)
- Add client-side visibility via the [Web SDK](/web-sdk)

---

## Related Topics

- [Quick Start Guide](/getting-started/quick-start)
- [Core Concepts](/advanced-guides/concepts)
- [FAQ / Troubleshooting](/support/faq)
