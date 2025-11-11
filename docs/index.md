---
sidebar_position: 1
slug: /
title: Softprobe Documentation
description: Softprobe Documentation - Business-Level Distributed Tracing and Analytics Platform with zero code changes required
---

# Softprobe Documentation

**Zero code changes • Full-context visibility • Cost optimization**


<div className="sp-hero-buttons">
  <a className="button button--primary" href="./getting-started/quick-start/">Get Started</a>
  <a className="button button--secondary" href="./deployment/installation/">Production Deployment</a>
</div>

:::info
Softprobe fixes observability’s “missing context” by capturing every user journey as a session graph—making interactions analyzable, automation-ready, and economical to retain.
:::

## Problem
Traditional logs and observability tools center on costly indexing. Teams compensate by sampling heavily, which discards context and slows troubleshooting and support.

## Solution
- Session Graph: Group events by user session to form one coherent, end-to-end record
- Cost Restructuring: Replace expensive indexing with session context so 100% of data can be retained and queried more efficiently
- AI-Ready: Rich session context powers automated root-cause analysis, issue prediction, and smarter support

## How it works
- Server-Side Collection: A lightweight Wasm plugin in Istio’s Envoy sidecar captures HTTP traffic and business flows, emitting native OpenTelemetry trace data <a className="sp-link-pill" href="https://github.com/softprobe/sp-istio-wasm" target="_blank" rel="noopener">GitHub</a>
- Client-Side Enrichment: The Web SDK creates sessions spanning multiple traces and adds route changes, performance metrics, and interaction events

<div className="sp-link-buttons">
  <a className="button button--secondary" href="https://github.com/softprobe/sp-istio-wasm" target="_blank" rel="noopener">SP‑Istio Agent on GitHub</a>
</div>

<div className="sp-img">
  <img src="/img/docs/how-it-work.png" alt="Softprobe Architecture" />
</div>

## Product roadmap

<div className="row sp-card-grid sp-roadmap">
  <div className="col col--4">
    <div className="card">
      <div className="card__header"><h3>1. Context View</h3></div>
      <div className="card__body">
        Visualize end-to-end user journeys as a session graph.
        <div style={{marginTop:'8px'}}>
          <span className="badge badge--success">Current</span>
        </div>
      </div>
    </div>
  </div>
  <div className="col col--4">
    <div className="card">
      <div className="card__header"><h3>2. ETL</h3></div>
      <div className="card__body">
        Export and transform session data for downstream analytics and long-term retention.
        <div style={{marginTop:'8px'}}>
          <span className="badge badge--primary">Next</span>
        </div>
      </div>
    </div>
  </div>
  <div className="col col--4">
    <div className="card">
      <div className="card__header"><h3>3. Troubleshooting</h3></div>
      <div className="card__body">
        Guided workflows for root-cause diagnosis and resolution across services.
        <div style={{marginTop:'8px'}}>
          <span className="badge badge--primary">Planned</span>
        </div>
      </div>
    </div>
  </div>
</div>


:::success Today
Currently available:
- Data collection: Web SDK (session-level context) and Wasm plugin on Istio/Envoy producing native OpenTelemetry traces — SP‑Istio Agent is open‑source: [github.com/softprobe/sp-istio-wasm](https://github.com/softprobe/sp-istio-wasm)
- Visualization: Context View (session graph across services)
:::

<div className="sp-img">
  <img src="/img/docs/context-view.png" alt="Session Graph in Context View" />
  <p className="sp-caption">Current: Context View — session graph across services.</p>
</div>

## Compatibility & Isolation
- Native OTEL compatibility: If your application already uses OpenTelemetry, Softprobe does not interfere and will not modify your application’s OTEL data

<div className="sp-img">
  <img src="/img/docs/trace-isolated.png" alt="Softprobe and user traces are isolated" />
  <p className="sp-caption">Softprobe traces and user traces are mutually isolated</p>
</div>

## Core Outcomes

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Full-context visibility</h3></div>
      <div className="card__body">
        Capture 100% of interaction details by session, eliminating blind spots caused by sampling.
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Cost optimization</h3></div>
      <div className="card__body">
        Retain full data while reducing overall observability cost.
      </div>
    </div>
  </div>
</div>

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Kubernetes-Native</h3></div>
      <div className="card__body">
        Deep integration with Kubernetes/Istio for seamless production deployment.
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Zero Code Changes</h3></div>
      <div className="card__body">
        Go live without modifying server-side code.
      </div>
    </div>
  </div>
</div>

