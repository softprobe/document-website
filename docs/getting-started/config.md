---
sidebar_position: 3
---

# SP-Istio Agent - Configuration Guide

Welcome to the SP-Istio Agent! This document serves as a detailed guide to help you understand and configure the `sp-istio-agent`. Our goal is to make it easy for you to deploy and use our agent to collect and analyze traffic in your service mesh.

This document primarily explains the configuration in the `minimal.yaml` file, which is the core of deploying the SP-Istio Agent.

## Table of Contents

1.  [**Quick Start: `minimal.yaml` Overview**](#quick-start-minimalyaml-overview)
2.  [**Core Component: WasmPlugin**](#core-component-wasmplugin)
3.  [**Collection Rules Explained (`collectionRules`)**](#collection-rules-explained-collectionrules)
    - [Collection in SERVER Mode](#collection-in-server-mode)
    - [Collection in CLIENT Mode](#collection-in-client-mode)
    - [Using Regular Expressions](#using-regular-expressions)
4.  [**Service Discovery: Automatically Identifying Your Services**](#service-discovery-automatically-identifying-your-services)
5.  [**External Communication: Connecting to the Softprobe Backend**](#external-communication-connecting-to-the-softprobe-backend)

---

## Quick Start: `minimal.yaml` Overview

The `minimal.yaml` file contains all the configuration you need to get started with the SP-Istio Agent. It defines how the agent is injected into your service mesh and how it will collect data.

The file consists of three main parts:

1.  **WasmPlugin (SERVER and CLIENT modes)**: Configures the agent to monitor and collect traffic flowing in and out of your services.
2.  **EnvoyFilter**: An auxiliary component that automatically detects and tags your service names, which is crucial for correctly identifying and classifying data in the Softprobe platform.
3.  **Network Resources (`ServiceEntry` and `DestinationRule`)**: Ensures that your service mesh can securely send the collected data to the Softprobe backend.

Next, we will delve into each part.

---

## Core Component: WasmPlugin

`WasmPlugin` is a custom resource in Istio that allows us to dynamically load the SP-Istio Agent (a WebAssembly module) into your service's proxy (Envoy). This way, we can achieve traffic monitoring and data collection without making any changes to your application code.

In `minimal.yaml`, we define two `WasmPlugin` instances: one for SERVER mode and one for CLIENT mode.

### Common Configuration Options

| Key | Description | Example |
| :--- | :--- | :--- |
| `sp_backend_url` | **Softprobe Backend URL**. The agent sends the collected data to this URL. Usually, no change is needed. | `https://o.softprobe.ai` |
| `api_key` | **Your Organization's API Key**. Used for authentication to ensure data is securely sent to your account. | `"your-real-api-key"` |
| `traffic_direction` | **Traffic Direction**. Explicitly specifies whether the agent handles `server` (inbound) or `client` (outbound) traffic. | `"server"` or `"client"` |
| `collectionRules` | **Collection Rules**. The core configuration for precisely controlling what data to collect. See the next section for details. | |

---

## Collection Rules Explained (`collectionRules`)

`collectionRules` is the most central and flexible configuration item in the SP-Istio Agent. It allows you to precisely define which HTTP traffic to collect, thus avoiding unnecessary data reporting, saving costs, and improving efficiency.

### Using Regular Expressions

In all collection rules, the values of the `path`, `host`, and `paths` fields are **regular expressions (Regex)**. This provides you with powerful matching capabilities.

-   To match everything, use `.*`.
-   For an exact match, write the string directly, for example, `"/api/users"`.
-   To match a specific pattern, use regex syntax, for example, `"/api/v[0-9]+/items"` can match `/api/v1/items` and `/api/v2/items`.

**Note**: If an invalid regular expression is provided, the system will automatically fall back to **exact string matching**.

### Collection in SERVER Mode

When `traffic_direction` is set to `server`, the agent collects **inbound** traffic. In this case, you need to configure `collectionRules.http.server`.

```yaml
# ...
pluginConfig:
  traffic_direction: "server"
  collectionRules:
    http:
      server:
        - path: ".*"  # This is a collection rule
```

-   **`server`**: An array containing multiple collection rules.
-   **`path`**: A regular expression used to match the **URL path** of inbound requests.

**How it works**: For each request entering your service, the agent gets its URL path (e.g., `/api/users/123`) and matches it against the regular expression defined in the `path` field. If the match is successful, the request and its corresponding response are collected.

**Examples**:

```yaml
# Collect only requests under /api/v1/
collectionRules:
  http:
    server:
      - path: "/api/v1/.*"

# Collect requests related to users and orders
collectionRules:
  http:
    server:
      - path: "/users/[^/]+$"  # Matches /users/some-id
      - path: "/orders/[0-9]+" # Matches /orders/12345
```

### Collection in CLIENT Mode

When `traffic_direction` is set to `client`, the agent collects **outbound** traffic. In this case, you need to configure `collectionRules.http.client`.

```yaml
# ...
pluginConfig:
  traffic_direction: "client"
  collectionRules:
    http:
      client:
        - host: ".*\.external-service\.com"
          paths: ["/api/data/.*", "/api/auth"]
```

-   **`client`**: An array containing multiple collection rules.
-   Each rule contains `host` and `paths` fields.
-   **`host`**: A regular expression used to match the **target hostname** of outbound requests.
-   **`paths`**: An array of strings, where each string is a regular expression used to match the **URL path** of outbound requests.

**How it works**: For each request sent from your service, the agent will:

1.  **Determine the target host and path**: The agent attempts to extract the target hostname and path from HTTP headers such as `Referer`, `Origin`, or `Host`.
2.  **Match `host`**: Matches the extracted target hostname against the regular expression in the `host` field.
3.  **Match `paths`**: If the hostname matches, the agent continues to match the extracted URL path against **any one** of the regular expressions in the `paths` array.

**Only when both the `host` and at least one path rule in `paths` are successfully matched, the outbound request and its corresponding response will be collected.**

**Examples**:

```yaml
# Collect all outbound requests to my-api.com, regardless of the path
collectionRules:
  http:
    client:
      - host: "my-api\.com"
        paths: [".*"]

# Collect specific API calls to googleapis.com
collectionRules:
  http:
    client:
      - host: ".*\.googleapis\.com"
        paths: ["/maps/api/.*", "/drive/v3/files"]
```

---

## Service Discovery: Automatically Identifying Your Services

In a complex microservices environment, accurately identifying each service is crucial. The SP-Istio Agent achieves this through an `EnvoyFilter` named `inject-app-name-header`.

This `EnvoyFilter` executes a small piece of Lua script before processing each request. The sole purpose of this script is to **find the name of the current service** and add it to a special HTTP header, `x-sp-service-name`.

**How does it work?**

The script sequentially attempts to get the service name from several common Kubernetes environment variables, such as `OTEL_SERVICE_NAME`, `APP_NAME`, `SERVICE_NAME`, or by parsing it from `POD_NAME`. This multi-source approach greatly improves the accuracy of automatic service identification, and **you usually do not need any additional configuration**.

---

## External Communication: Connecting to the Softprobe Backend

To enable the SP-Istio Agent to send data to `o.softprobe.ai`, we need to explicitly authorize this external communication in Istio. This is done through two resources: `ServiceEntry` and `DestinationRule`.

-   **`ServiceEntry`**: Adds `o.softprobe.ai` to Istio's service registry, making it a legitimate external service.
-   **`DestinationRule`**: Configures TLS encryption for traffic to `o.softprobe.ai`, ensuring secure data transmission.

In short, these two resources together open a secure channel for the SP-Istio Agent to the Softprobe backend.

We hope this detailed guide helps you better understand and use the SP-Istio Agent. If you have any questions, please feel free to contact us!