---
sidebar_position: 1
slug: /
title: Softprobe Documentation
description: Softprobe Documentation - Business-Level Distributed Tracing and Analytics Platform with zero code changes required
---

# Softprobe Documentation

**Business-Level Distributed Tracing and Analytics Platform**

Zero-code changes required • Complete request visibility • Advanced troubleshooting

## Welcome to Softprobe

Softprobe is a comprehensive observability platform designed for modern applications and microservices. It provides deep insights into application behavior, user interactions, and system performance without requiring code changes on the server side.

### How Softprobe Works

Softprobe collects and analyzes data through a multi-layered approach:

- **Server-Side Collection**: A lightweight WebAssembly (Wasm) plugin runs inside Istio's Envoy sidecars to capture HTTP traffic and business flows
- **Client-Side Enrichment**: Optional browser SDK records performance metrics and user interactions
- **Secure Data Pipeline**: All data is encrypted and sent to Softprobe's backend using your public key for authentication

### Key Benefits

- **🔍 Complete Visibility**: Capture comprehensive application data and user interactions
- **🚀 Faster Troubleshooting**: Business-level insights reduce debugging time from hours to minutes
- **📊 Advanced Analytics**: Rich insights into usage patterns, performance metrics, and business flows
- **⚡ Zero Code Changes**: Deploy without modifying existing application code
- **☸️ Kubernetes-Native**: Deep integration with Kubernetes and Istio for seamless deployment

## Getting Started

### For New Users

If you're new to Softprobe, follow this learning path:

1. **👤 [Account Setup & Public Key Management](/getting-started/account-setup)** - Create your account and manage public keys
2. **🚀 [Quick Start Guide](/getting-started/quick-start)** - Set up a local demo environment with Kind
3. **📋 [Understanding Softprobe Concepts](/advanced-guides/concepts)** - Learn how Softprobe works and its architecture

### For Production Deployment

Ready for production? Follow this deployment path:

1. **⚙️ [Production Installation Guide](/deployment/installation)** - Deploy to your production Kubernetes cluster
2. **🎯 [Configuration Guide](/configuration/config)** - Customize collection rules and settings
3. **🌐 [Web SDK Integration](/web-sdk)** - Add client-side monitoring to your web applications

### Specialized Environments

- **☁️ [GKE Autopilot Installation](/deployment/GKE-Autopilot-Istio-Installation-Guide)** - Deploy on Google Kubernetes Engine Autopilot


## Support & Resources

- **📚 [API Documentation](https://docs.softprobe.ai)** - Complete API reference
- **🛠️ [Troubleshooting Guide](/support/faq)** - Common issues and solutions
- **💬 [Community Support](https://community.softprobe.ai)** - Get help from other users
- **📧 [Enterprise Support](mailto:support@softprobe.ai)** - Direct support for enterprise customers
- **🖥️ [Dashboard User Guide](/support/dashboard-user-guide)** - Learn how to navigate the dashboard, manage tenants, and view metrics

## Need Help?

- **First-time user?** Start with our [Quick Start Guide](/getting-started/quick-start)
- **Production deployment?** Check the [Production Installation Guide](/deployment/installation)
- **Technical questions?** Visit our [API Documentation](https://docs.softprobe.ai)
