---
sidebar_position: 6
sidebar_label: Web SDK
title: Web SDK Integration
description: Learn how to integrate Softprobe Web SDK for browser-based monitoring and analytics
---

# Web SDK Integration

:::info Note
The Quick Start demo environment already has the Web SDK (`@softprobe/web-inspector`) pre-installed and enabled. If you're following the Quick Start, you don't need to install it again.
This document is for integrating the SDK into your own frontend applications (React/Vue/Next.js, etc.).
:::

This guide covers the installation and usage of the Softprobe Web SDK (`@softprobe/web-inspector`).

## Features

The Softprobe Web SDK is designed to provide comprehensive insights into your web application's performance and user behavior. Key features include:

- **Automatic Performance Monitoring**: Automatically captures and reports key page load performance metrics.
- **User Interaction Tracking**: Records user interactions such as clicks, scrolls, and form submissions to help you understand user journeys.
- **Network Request Tracing**: Monitors all `fetch` and `XMLHttpRequest` requests to identify slow or failing API calls.
- **Intelligent Session Management**: Automatically generates a unique session when users open a browser tab, ensuring all operations within the same tab use the same session identifier for cross-request correlation.
- **Environment and Device Recording**: Gathers valuable context by recording browser, OS, and device information, and groups all events within a single user session.
- **Custom Instrumentation**: Provides a simple API to create custom spans for tracing specific business logic or user interactions.

## Session ID Generation and End-to-End Correlation

The Web SDK generates a unique sessionId for each browser tab and reuses it across navigation within the same tab. Opening a new tab creates a new sessionId; closing a tab ends the session. All frontend events, performance metrics, and network requests carry this sessionId so they can be correlated with backend traces and logs end-to-end.

Best practices:
- Propagate the sessionId to backend services via request headers (e.g., `X-Session-Id`) or tracing context.
- Record the sessionId in backend logs/telemetry to align requests, traces, and events from the same session.
- Combine frontend session data with server-side collection rules. See the Configuration Guide.

Learn more in the Web SDK guide: [/web-sdk](/web-sdk). Configuration details: [/configuration/config](/configuration/config). Deployment context: [/deployment/installation](/deployment/installation).

### Session and Context Propagation

- Per-tab generation: A new sessionId is created when a user opens a browser tab.
- In-tab reuse: Navigations and interactions within the same tab reuse the same sessionId.
- New tab behavior: Opening a new tab creates a new sessionId.
- Session termination: Closing the tab ends the session.
- Backend correlation: Pass the sessionId downstream via headers or context to enable end-to-end analysis.

## Installation

Install the package using your preferred package manager:

```bash
npm install @softprobe/web-inspector
```

## Usage

### Initialization

Initialize the inspector in your web application's entry point.

```typescript
import { initInspector } from "@softprobe/web-inspector";

// Only need to call register once
export function register() {
  // Initialize the client
  initInspector({
    publicKey: "",
    userId: "",
    serviceName: "YOUR_SERVICE_NAME",
    // Data collector endpoint: <INSPECTOR_COLLECTOR_URL>/v1/traces
    collectorEndpoint: process.env.INSPECTOR_COLLECTOR_URL!,
    // Automatically enables console logging in development
    env: "dev",
    // Optional: disable scroll observation
    observeScroll: false,
  })
    .then(({ provider }) => {
      console.log("Softprobe inspector initialized successfully.");
    })
    .catch((error) => {
      console.error("Failed to initialize Softprobe inspector:", error);
    });
}
```

### Creating Custom Spans (Optional)

You can create custom spans to trace specific business logic or user interactions.

```typescript
// Example in a React component (e.g., pages/index.tsx)
import { trace } from "@softprobe/web-inspector";

export default function Home() {
  const handleClick = () => {
    // Get a tracer instance
    const tracer = trace.getTracer("nextjs-tracer");

    // Start a new span
    const span = tracer.startSpan("checkout_process");

    try {
      // Your business logic here...
      // Example: processing items in a shopping cart

      // Add attributes to the span for context
      span.setAttribute("item_count", 3);
      span.setAttribute("user_tier", "gold");

      // Set the span status to OK on success
      span.setStatus({ code: trace.SpanStatusCode.OK });
    } catch (error) {
      // Set the span status to ERROR on failure
      span.setStatus({
        code: trace.SpanStatusCode.ERROR,
        message: error.message,
      });
    } finally {
      // End the span to record it
      span.end();
    }
  };

  return <button onClick={handleClick}>Start Checkout</button>;
}
```

## Prerequisites

To use the Softprobe Web SDK, you should have:

- A modern web application (React, Vue, Next.js, or plain JavaScript)
- Node.js 16+ and a bundler (e.g., Vite, Webpack)
- A Softprobe account and public key from [Account Setup](/getting-started/account-setup)
- Your collector endpoint (find it in Dashboard Settings), e.g. `<INSPECTOR_COLLECTOR_URL>/v1/traces`

## FAQ

- The SDK works in modern browsers. For legacy browsers, consider polyfills.
- CSP: ensure `connect-src` allows your collection endpoint.

---

## Next Steps

- Configure your server-side collection via [Configuration Reference](/configuration/config)
- Verify telemetry ingestion in [Softprobe Dashboard](https://dashboard.softprobe.ai)
- Explore advanced architecture in [Core Concepts](/advanced-guides/concepts)
