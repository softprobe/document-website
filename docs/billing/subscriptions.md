---
sidebar_position: 2
sidebar_label: Billing & Subscriptions
title: Billing & Subscriptions
description: Subscription lifecycle, billing cycles, usage, cancellation, and plan changes.
---

# Billing & Subscriptions

This page explains the subscription lifecycle, billing cycles and usage, cancellation and resumption, and how plan changes affect your account.

## Subscription Lifecycle

Common states:
- ACTIVE — the subscription is active; billed by cycle or usage
- SUSPENDED — the subscription is paused; service is restricted or stopped
- CANCELLED — the subscription is cancelled; service stops after the current period (or immediately, depending on settings)

Typical transitions:
- Payment failure or insufficient balance triggers SUSPENDED
- User‑initiated cancellation, or “cancel at period end”
- Risk controls may degrade or stop service

## Billing Cycle & Usage

- Fixed plans: a fixed monthly fee; not affected by usage within the cycle
- Usage‑based: usage is aggregated monthly and billed at the end of the cycle
- Usage records and billing history are available for reconciliation and reporting

## Cancellation & Resumption

- Cancellation: choose “cancel immediately” or “cancel at the end of the period”
- Resumption: pay outstanding balances or complete payment to restore ACTIVE state
- Data retention: data is typically retained during suspension or cancellation; may be cleaned up after grace periods (see Terms)

## Plan Changes (Upgrade / Downgrade / Switch Billing Models)

- Free → Pro (Business): upgrade supported; can take effect immediately or at the next billing cycle
- Pro (Business) → Pay‑as‑you‑go (Enterprise): switch supported; you may configure usage caps and alerts
- Downgrade policy: if you downgrade from a higher‑quota plan, over‑quota data may be restricted or require migration
- Proration: mid‑cycle plan changes may trigger proration

## Risk Controls & Spending Limits

- Balance threshold alerts (e.g., reminder at $10, urgent at $5)
- Service degradation strategies: RESTRICTED (strict limits), SUSPENDED (stop service)
- Daily/monthly spending caps and automatic stop‑service protections to prevent unexpected costs

## Stripe Integration & Price Mapping

- Each plan maps to Stripe products and prices (fixed and metered)
- Subscriptions are billed based on these mappings
- Price changes take effect in the next billing period or are prorated based on settings

## Common Actions

- View current subscription and billing cycle: Dashboard → Subscription panel
- Change plan: Dashboard → Subscription panel (Pro/Business, Pay‑as‑you‑go)
- View usage and cost estimates: Dashboard → Usage & Cost
- Cancel or pause: Dashboard → Subscription panel (supports cancel at period end)

## Support

- Enterprise customization: support@softprobe.ai
- Technical questions: see API documentation and FAQ (Support section)