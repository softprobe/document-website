
# SESSIFY Integration

**Lightweight • Zero-dependency • W3C-compliant distributed tracing**

SESSIFY is Softprobe's session lifecycle management and distributed tracing SDK, specifically designed for frontend application session management and request tracing. It automatically handles session creation, validation, keep-alive, and expiration logic, while injecting W3C-standard trace context into HTTP requests to achieve end-to-end session correlation.

Key benefits include automated session management, distributed tracing across microservices, security with Web Crypto API, and zero dependencies for minimal bundle size.

<div class="sp-hero-buttons">
  <a class="button button--primary" href="/en/platform/getting-started/quick-start">Quick Start</a>
  <a class="button button--secondary" href="/en/platform/getting-started/account-setup">Account Setup</a>
</div>

::: info
The Quick Start environment already has the SESSIFY (`@softprobe/sessify`) pre-installed and enabled. This document is for integrating the SDK into your own frontend applications (React/Vue/Next.js, etc.).
:::

## Prerequisites

- A modern web application (React, Vue, Next.js, or plain JavaScript)
- Node.js 16+ and a bundler (e.g., Vite, Webpack)

## Installation

```bash
# npm
npm install @softprobe/sessify

# yarn
yarn add @softprobe/sessify

# pnpm
pnpm add @softprobe/sessify
```

## Initialization

```ts
// React / Next.js Example
import { useEffect } from 'react';
import { initSessify } from '@softprobe/sessify';

useEffect(() => {
  // Initialize with default settings
  initSessify({
  });
}, []);

// Vanilla JS Example
import { initSessify } from '@softprobe/sessify';

initSessify({
});
```

## Key Features

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🔄 Automated Lifecycle Management</h3></div>
      <div class="card__body">Complete handling of session creation, validation, keep-alive, and expiration logic. No manual timer management required.</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🔌 W3C Trace Context Injection</h3></div>
      <div class="card__body">Automatically intercepts `fetch` requests to inject standard `tracestate` headers, carrying session context across microservices.</div>
    </div>
  </div>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>💾 Flexible Persistence Strategy</h3></div>
      <div class="card__body">Choose between ephemeral `sessionStorage` or persistent `localStorage` based on your security and UX requirements.</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🛡️ Enhanced Security</h3></div>
      <div class="card__body">Generates collision-resistant session IDs using the Web Crypto API (Timestamp + Cryptographically Secure Random String).</div>
    </div>
  </div>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>🖥️ SSR & Environment Ready</h3></div>
      <div class="card__body">Built-in environment detection ensures safe execution in browser environments while gracefully skipping Server-Side Rendering (SSR) contexts.</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>📦 Zero Dependencies</h3></div>
      <div class="card__body">Keep your bundle size minimal. No external bloat.</div>
    </div>
  </div>
</div>

## Core Usage

Once initialized, you can manage sessions anywhere in your application.

```javascript
import { getSessionId, startSession, endSession, isSessionActive } from '@softprobe/sessify';

// 1. Get Current Session
// If expired or missing, this automatically creates a new one.
const sessionId = getSessionId();
console.log('Active Session:', sessionId);

// 2. Check Status
if (isSessionActive()) {
  console.log('User is currently active');
}

// 3. Force Refresh (e.g., on Login)
// Invalidates the old session and starts a fresh one immediately.
const newSessionId = startSession();

// 4. Logout / Cleanup
// Clears storage and invalidates the session.
endSession();
```

## Configuration

The initSessify function accepts a configuration object to tailor behavior to your needs.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| customTraceState | object | {} | Custom key-value pairs to include in tracestate headers. If provided |
| sessionStorageType | session/local | 'session' | Controls persistence. 'local' survives browser restarts; 'session' clears when the tab closes. |

### Custom Trace State Example

Enhance your request tracing by adding context like environment or version:

```javascript
initSessify({
  sessionStorageType: 'local',
  customTraceState: {
    'x-sp-env': 'production',
    'x-sp-ver': '1.0.0',
    'x-sp-tier': 'premium'
  }
});
```

Resulting Header: tracestate: x-sp-session-id=...,x-sp-env=production,x-sp-ver=1.0.0...

## Technical Details

### Session Lifecycle Strategy

- **Creation**: Uses a base36 timestamp combined with a Web Crypto API random string for a ~16 character unique ID.

- **Validation**: Automatically checks for timeout on every access. If the timeout is exceeded, the old session is discarded and a new one is seamlessly generated.

### HTTP Interception

@softprobe/sessify monkey-patches the global fetch API (safely) to:
- Check if a session is active.
- Inject the tracestate header conforming to W3C standards.
- Append your siteName or customTraceState and the current session_id.

<div class="sp-link-buttons">
  <a class="button button--primary" href="/en/platform/getting-started/quick-start">Quick Start</a>
  <a class="button button--secondary" href="/en/platform/getting-started/account-setup">Account Setup</a>
</div>
