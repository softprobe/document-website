---
title: Platform documentation
---

# Softprobe Platform

**Zero code changes · Full-context visibility · Cost optimization**

::: info
Softprobe captures every user journey as a session graph—making interactions analyzable, automation-ready, and economical to retain.
:::

## Quick links

- [Quick Start](/en/platform/getting-started/quick-start)
- [Production Installation](/en/platform/deployment/installation)
- [SESSIFY](/en/platform/sessify)
- [Dashboard User Guide](/en/platform/production/dashboard-user-guide)

## Record and replay (Java)

For Java traffic capture, replay, and diff, see [Softprobe Testing](/en/testing/getting-started). Automate with the [CLI quickstart](/en/cli/guide/quickstart).

## How it works

- **Server-side:** Wasm plugin in Istio Envoy sidecar — [SP-Istio Agent on GitHub](https://github.com/softprobe/softprobe)
- **Client-side:** [SESSIFY](/en/platform/sessify) enriches sessions with routes, metrics, and interaction events

![Softprobe Architecture](/img/docs/how-it-work.png)

::: tip Currently available
- Data collection: SESSIFY and Istio/Envoy OpenTelemetry traces
- Visualization: Context View (session graph)
:::

![Session Graph](/img/docs/context-view.png)
