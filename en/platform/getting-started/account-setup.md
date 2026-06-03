
# Account Setup & Public Key Management

Set up your Softprobe account and manage public keys for secure authentication.

::: info Prerequisites
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

<div class="sp-img">
  <img src="/img/docs/sign-up.png" alt="Sign Up in Dashboard" />
  <p class="sp-caption">Sign Up in Dashboard.</p>
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

::: tip
Choose your tenant group name carefully as it cannot be changed later. Use a name that clearly identifies your organization or team.
:::

<div class="sp-img">
  <img src="/img/docs/create-tenant.png" alt="Create Tenant Group" />
  <p class="sp-caption">Create Tenant Group.</p>
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
Softprobe uses **public key authentication** instead of traditional Public keys. This means:

- Your configuration contains only a public identifier, not a secret
- No sensitive credentials are stored in your Kubernetes configuration
- Public keys can be easily rotated without service disruption
- Uses asymmetric cryptography for authentication
:::

<div class="sp-img">
  <img src="/img/docs/create-key.png" alt="Generate Public Key" />
  <p class="sp-caption">Generate Public Key.</p>
</div>

## 📁 Configuration File

When you generate a public key, a `minimal.yaml` file is automatically downloaded. This file contains:

- Your public key identifier (not a secret)
- Pre-configured endpoints
- Default collection rules
- All necessary Kubernetes resources

<div class="sp-img">
  <img src="/img/docs/download-yaml.png" alt="Download Yaml after Create Public Key" />
  <p class="sp-caption">Download Yaml.</p>
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


After completing account setup:

1. **For Quick Testing**: Follow the [Quick Start Guide](/en/platform/getting-started/quick-start)
2. **For Production**: Follow the [Production Installation Guide](/en/platform/deployment/installation)
3. **For Custom Configuration**: Review the [Configuration Reference](/en/platform/configuration/config)

## ❓ Troubleshooting

### Common Issues

**Can't access the dashboard?**

- Check your internet connection
- Verify the URL: `https://dashboard.softprobe.ai`
- Try clearing your browser cache


**Public key generation failed?**

- Ensure your tenant group is properly set up
- Check that you have the necessary permissions
- Try refreshing the page and generating again

---

## FAQ

> Common questions have been moved to a separate page:
> - [Getting Started FAQ](/en/platform/support/faq)


