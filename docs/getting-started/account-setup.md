---
sidebar_position: 1
sidebar_label: Account Setup
title: Account Setup & Public Key Management
description: Learn how to create your Softprobe account, set up tenant groups, and manage public keys for secure authentication
---

# Account Setup & Public Key Management

Set up your Softprobe account and manage public keys for secure authentication.

:::info Prerequisites
- A valid email address
- Access to the Softprobe Dashboard
:::

## Overview

This guide walks you through:

- Creating a Softprobe account
- Setting up your tenant group
- Generating and managing public keys
- Downloading configuration files


### Step 1: Create Your Account

1. Visit [Softprobe Dashboard](https://dashboard.softprobe.ai)
2. Click **"Sign Up"** to create a new account
3. Fill in your details:
   - **Email address** (will be your login username)
   - **Password** (minimum 8 characters)
4. Verify your email address by clicking the link sent to your inbox

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/sign-up.png" alt="Sign Up in Dashboard" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

### Step 2: Access Settings and Create Tenant Groups

After email verification and login, you can access the Settings page to manage tenant groups:

1. Navigate to the **[Settings](https://dashboard.softprobe.ai/settings)** page
2. **Create your first tenant group**
   - Click the "Create Group" button
   - **Tenant Group Name**: Choose a unique name for your organization
     - This will be used to organize your services and data
     - Example: `my-company-prod`, `acme-corp`, `team-alpha`
   - **Description** (optional): Add a brief description of your group
3. Click **"Create Tenant Group"**

:::tip
Choose your tenant group name carefully as it cannot be changed later. Use a name that clearly identifies your organization or team.
:::

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/create-tenant.png" alt="Create Tenant Group" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

### Step 3: Generate Public Key

Once your tenant group is created:

1. Navigate to **"Public Keys"** in the dashboard sidebar
2. Click **"Generate New Public Key"**
3. Provide the following information:
   - **Key Name**: A descriptive name (e.g., `production-cluster`, `dev-environment`)
   - **Environment**: Select the appropriate environment type
4. Click **"Generate Key"**

:::caution Important
Softprobe uses **public key authentication** instead of traditional API keys. This means:

- Your configuration contains only a public identifier, not a secret
- No sensitive credentials are stored in your Kubernetes configuration
- Public keys can be easily rotated without service disruption
- Uses asymmetric cryptography for authentication
:::

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/create-key.png" alt="Generate Public Key" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

## 📁 Configuration File

When you generate a public key, a `minimal.yaml` file is automatically downloaded. This file contains:

- Your public key identifier (not a secret)
- Pre-configured endpoints
- Default collection rules
- All necessary Kubernetes resources

<div style={{textAlign: 'center', margin: '24px 48px'}}>

<img src="/img/docs/download-yaml.png" alt="Download Yaml after Create Public Key" style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />

</div>

### File Structure

The downloaded `minimal.yaml` includes:

```yaml
# WasmPlugin configuration with your public key
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
spec:
  pluginConfig:
    public_key: "your-public-key-identifier"
    # ... other secure configurations
```

## 🔧 Next Steps

After completing account setup:

1. **For Quick Testing**: Follow the [Quick Start Guide](/getting-started/quick-start)
2. **For Production**: Follow the [Production Installation Guide](/deployment/installation)
3. **For Custom Configuration**: Review the [Configuration Reference](/configuration/config)

## ❓ Troubleshooting

### Common Issues

**Can't access the dashboard?**

- Check your internet connection
- Verify the URL: `https://dashboard.softprobe.ai`
- Try clearing your browser cache

**Email verification not received?**

- Check your spam/junk folder
- Ensure the email address is correct
- Contact support if the issue persists

**Public key generation failed?**

- Ensure your tenant group is properly set up
- Check that you have the necessary permissions
- Try refreshing the page and generating again

### Getting Help

If you encounter issues during account setup:

- **Documentation**: Check our [Troubleshooting Guide](/support/faq)
- **Support**: Contact our support team through the dashboard
- **Community**: Join our community discussions for peer help

---

## FAQ

> Common questions have been moved to a separate page:
> - [Getting Started FAQ](/support/faq)

---

## Technical Support

If you encounter any problems during use, you can get help in the following ways:

### 📧 Contact Support

- **Email**: support@softprobe.ai
- **Response Time**: Within 24 hours on business days

### 📚 Documentation Resources

- **API Documentation**: [https://docs.softprobe.ai](https://docs.softprobe.ai)
- **Developer Guide**: [Core Concepts](/advanced-guides/concepts)

### 🐛 Problem Feedback

If you find a bug or have a feature suggestion:

1. Log in to the Dashboard
2. Click the feedback button in the top right corner
3. Describe the problem or suggestion in detail
4. We will follow up in a timely manner

---

## 🎉 Get Started

Congratulations! You have completed the basic configuration of Softprobe. Now you can:

1. **Deploy to your cluster** using the downloaded configuration
2. **Monitor application performance** in real-time
3. **Analyze business flows** and user interactions
4. **Collaborate with your team** on observability insights

Start exploring the powerful features of Softprobe and gain deep insights into your applications!

---

_Last updated: January 2024_
_Version: v2.0_

> Note: Refer to the Configuration Reference for details on config file fields.

See also:
- [Configuration Reference](/configuration/config)

---

## Next Steps

- Proceed to [Quick Start](/getting-started/quick-start) for a local demo
- Deploy to production with [Installation Guide](/deployment/installation)
- Add browser visibility via [Web SDK Integration](/web-sdk)
