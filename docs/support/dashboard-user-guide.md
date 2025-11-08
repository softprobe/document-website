---
sidebar_label: Dashboard Guide
sidebar_position: 2
title: Softprobe Dashboard User Guide
description: Learn how to navigate Softprobe Dashboard, manage tenants and members, view metrics, and operate configurations
---

# Softprobe Dashboard User Guide

Welcome to Softprobe Dashboard. This guide helps you quickly understand the interface, manage tenants and members, and operate key features consistently.

## 🚀 Quick Start

### 1. Registration & Login
- Visit the homepage and click “Sign Up” (top right)
- Enter email and password, complete email verification
- Log in to start using the system

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/sign-up.png" alt="Sign Up in Dashboard" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

:::tip
Account setup and public key management are covered in the [Account Setup Guide](/getting-started/account-setup).
:::

### 2. Interface Overview
After logging in, you will see:
- **Left Navigation**: Quick access to modules
- **Top Bar**: User info and tenant switching
- **Main Area**: Operational interface for current module

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/main-board.png" alt="Main Board in Dashboard" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

## 📊 Core Features

### 1. Dashboard Homepage
Real-time monitoring of core system metrics

#### Data Overview Cards
- **Database Usage**: Current storage usage (GB), usage percentage, color indicators
- **Data Entry Statistics**: Total records, filter by time range, historical comparison
- **Session Statistics**: Active sessions, total sessions in selected period, trend charts
- **Performance Metrics**: Average response time, P95 metrics, system health indicators

:::tip
For end-to-end user journey correlation, install the [Web SDK](/web-sdk) on your frontend and propagate sessionId through your service mesh.
:::

#### Operations
- Data loads once on page entry (no auto-refresh)
- To update: switch time range, switch tenant, or refresh page

### 2. Tenant Management
Resource isolation and management in multi-tenant environments

#### Tenant Switching
- Use the tenant selector in the top bar (search and filter supported)
- Click target tenant to switch
- Create new tenant via “+” button and fill basic info
<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/tenant.png" alt="Tenant Management in Dashboard" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

#### Tenant Settings
- Basic info: name, description, icon
- Member management: add/remove, roles and permissions
- Public keys: create/manage keys and validity
- Danger zone: delete tenant, export backup, clear data

### 3. Team Member Management
Permission control and collaborative management
<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/member.png" alt="Team Member Management in Dashboard" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

#### Adding Members
- Go to Tenant Settings → Member Management
- Click “Add Member”, enter email, choose role
- Roles: **Administrator**, **Editor**, **Viewer**

#### Role Permissions
- **Administrator**: Full control, manage members/settings, Public keys, dangerous ops
- **Editor**: Operate data and monitoring configs, cannot manage members/settings
- **Viewer**: Read-only access, suitable for report viewers


## ❓ FAQ

## ⚠️ Common Limits & Best Practices

- Data refresh: Homepage does not auto-refresh; change time range or tenant, or manually refresh to update.
- Roles & safety: Use least-privilege roles; avoid granting Administrator globally; review member list regularly.
- Public keys: Full key is displayed only at creation; store securely and rotate periodically; never commit secrets.
- Rate limits: Each Public key has hourly caps; design clients with retries/backoff and monitor usage counters in Dashboard.
- PII handling: Do not send sensitive personal data in attributes; use hashed request bodies for correlation.
- Multi-environment: Create separate tenants and public keys per environment (prod/staging/dev) for isolation and auditability.
- Performance tips: Combine time filters with request_body_hash; use partitions and caching strategies when datasets grow.

:::tip Quick reminder
If you need higher quotas or custom retention, contact support@softprobe.ai with your tenant id and expected workload.
:::

See the [FAQ](/support/faq) for common questions, including data storage and security, mobile access, and export options.

## ➡️ Next Steps
- Learn core concepts: [Understanding Concepts](/advanced-guides/concepts)
- Deploy to production: [Installation Guide](/deployment/installation)
- Configure advanced rules: [Configuration Guide](/configuration/config)

---
Last Updated: December 2024