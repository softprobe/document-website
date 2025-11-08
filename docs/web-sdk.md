---
sidebar_position: 6
---

# Web Plugin Installation

This guide covers the installation and usage of the Softprobe Web SDK (`@softprobe/web-inspector`).

## Features

The Softprobe Web SDK is designed to provide comprehensive insights into your web application's performance and user behavior. Key features include:

- **Automatic Performance Monitoring**: Automatically captures and reports key page load performance metrics.
- **User Interaction Tracking**: Records user interactions such as clicks, scrolls, and form submissions to help you understand user journeys.
- **Network Request Tracing**: Monitors all `fetch` and `XMLHttpRequest` requests to identify slow or failing API calls.
- **Environment and Session Recording**: Gathers valuable context by recording browser, OS, and device information, and groups all events within a single user session.
- **Custom Instrumentation**: Provides a simple API to create custom spans for tracing specific business logic or user interactions.

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
    apiKey: "",
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
