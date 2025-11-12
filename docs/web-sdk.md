---
sidebar_position: 6
sidebar_label: Web SDK
title: Web SDK Integration
description: Learn how to integrate Softprobe Web SDK for browser-based monitoring and analytics
---

# Web SDK Integration

**Fast integration • Session-level context • End-to-end correlation**

<div class="sp-hero-buttons">
  <a class="button button--primary" href="/getting-started/quick-start/">Quick Start</a>
  <a class="button button--secondary" href="/getting-started/account-setup/">Account Setup</a>
</div>

:::info
The Quick Start environment already has the Web SDK (`@softprobe/web-inspector`) pre-installed and enabled. This document is for integrating the SDK into your own frontend applications (React/Vue/Next.js, etc.).
:::

## Prerequisites

- A modern web application (React, Vue, Next.js, or plain JavaScript)
- Node.js 16+ and a bundler (e.g., Vite, Webpack)
- A Softprobe account and public key — see [Account Setup](/getting-started/account-setup)
- Your collector endpoint (find it in Dashboard Settings), e.g. `<INSPECTOR_COLLECTOR_URL>/v1/traces`

## Installation

```bash
npm install @softprobe/web-inspector
```

## Initialization

```ts
import { initInspector } from '@softprobe/web-inspector'

initInspector({
  publicKey: 'YOUR_PUBLIC_KEY',
  serviceName: 'YOUR_SERVICE_NAME',
})
```

## Features

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>Automatic Performance Monitoring</h3></div>
      <div class="card__body">Automatically captures and reports key page load performance metrics.</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>User Interaction Tracking</h3></div>
      <div class="card__body">Tracks clicks, scrolls, and form submissions to reconstruct user journeys.</div>
    </div>
  </div>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>Network Request Tracing</h3></div>
      <div class="card__body">Monitors `fetch` and `XMLHttpRequest` timings and errors to pinpoint slow or failing APIs.</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>Intelligent Session Management</h3></div>
      <div class="card__body">One unique `sessionId` per browser tab, reused across in-tab navigation and interactions.</div>
    </div>
  </div>
</div>

<div class="row sp-card-grid">
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>Environment & Device Recording</h3></div>
      <div class="card__body">Records browser, OS, and device info, grouped by session for rich context.</div>
    </div>
  </div>
  <div class="col col--6">
    <div class="card">
      <div class="card__header"><h3>Custom Instrumentation</h3></div>
      <div class="card__body">Simple API to create custom spans for business logic and interactions.</div>
    </div>
  </div>
</div>

## Session and End-to-End Correlation

- Per-tab generation: A new `sessionId` is created when a user opens a browser tab.
- In-tab reuse: Navigations and interactions within the same tab reuse the same `sessionId`.
- New tab behavior: Opening a new tab creates a new `sessionId`.
- Session termination: Closing the tab ends the session.
- Backend correlation: Pass the `sessionId` downstream via headers or context to enable end-to-end analysis.

<div class="sp-link-buttons">
  <a class="button button--primary" href="/getting-started/quick-start/">Quick Start</a>
  <a class="button button--secondary" href="/getting-started/account-setup/">Account Setup</a>
</div>
