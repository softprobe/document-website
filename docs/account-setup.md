---
sidebar_position: 4
---

# Account Setup

Set up your Softprobe account and generate API keys for SP-Istio Agent.

## 📋 Overview

This guide walks you through:
- Creating a Softprobe account
- Setting up your tenant group
- Generating API keys
- Downloading configuration files

## 🚀 Getting Started

### Step 1: Create Your Account

1. Visit [Softprobe Dashboard](https://dashboard.softprobe.ai)
2. Click **"Sign Up"** to create a new account
3. Fill in your details:
   - **Email address** (will be your login username)
   - **Password** (minimum 8 characters)
4. Verify your email address by clicking the link sent to your inbox

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

### Step 3: Generate API Key

Once your tenant group is created:

1. Navigate to **"API Keys"** in the dashboard sidebar
2. Click **"Generate New API Key"**
3. Provide the following information:
   - **Key Name**: A descriptive name (e.g., `production-cluster`, `dev-environment`)
4. Click **"Generate Key"**

:::warning Important
- Your API key will be displayed **only once**
- Copy and store it securely immediately
- The `minimal.yaml` configuration file will be automatically downloaded
- You cannot retrieve the key again after closing the dialog
:::

## 📁 Configuration File

When you generate an API key, a `minimal.yaml` file is automatically downloaded. This file contains:

- Your personalized API key
- Pre-configured endpoints
- Default collection rules
- All necessary Kubernetes resources

### File Structure

The downloaded `minimal.yaml` includes:

```yaml
# WasmPlugin configuration with your API key
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
spec:
  pluginConfig:
    api_key: "your-generated-api-key"
    # ... other configurations
```

## 🔐 Security Best Practices

### API Key Management

- **Store securely**: Keep API keys in secure credential management systems
- **Rotate regularly**: Generate new keys periodically and retire old ones
- **Use descriptive names**: Name keys based on their purpose and environment
- **Monitor usage**: Check the dashboard for API key activity


This allows for better tracking and security isolation.

## 🔧 Next Steps

After completing account setup:

1. **For Quick Testing**: Follow the [Quick Start Guide](./getting-started/quick-start)
2. **For Production**: Follow the [Production Installation Guide](./getting-started/installation)
3. **For Custom Configuration**: Review the [Configuration Guide](./config.md)

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

**API key generation failed?**
- Ensure your tenant group is properly set up
- Check that you have the necessary permissions
- Try refreshing the page and generating again

### Getting Help

If you encounter issues during account setup:

- **Documentation**: Check our [troubleshooting guide](./deployment/troubleshooting)
- **Support**: Contact our support team through the dashboard
- **Community**: Join our community discussions for peer help

---
## FAQ

### Q1: What if I lose the minimal.yaml configuration file?

**A:** The `minimal.yaml` file is only downloaded once when you create an API Key. If you lose it:
1. Delete the current API Key from your dashboard
2. Create a new API Key (this will generate a new `minimal.yaml` file)
3. Save the new configuration file immediately

### Q2: What if I forget to save my API Key?

**A:** With the new system, you don't need to manually copy the API Key. It's automatically embedded in the `minimal.yaml` file that downloads when you create the key. Just make sure to save that file securely.

### Q3: Can an API Key be reused?

**A:** Yes, an API Key can be used in multiple environments, but it is recommended to:
- Use a separate API Key for the production environment
- Use a separate API Key for development/testing environments
- Rotate API Keys periodically to improve security

### Q4: How do I manage multiple projects?

**A:** It is recommended to create different tenant groups for different projects:
1. Create a separate tenant group for each project
2. Generate a separate API Key for each project
3. Invite the relevant team members to the corresponding tenant groups

### Q5: Are there usage limits for an API Key?

**A:** Usage limits for an API Key include:
- Request rate limits
- Data storage quotas
- Feature permission restrictions
- Please check your subscription plan for specific limits

### Q6: What if there is no data after configuration?

**A:** Please check:
1. If the `minimal.yaml` file was applied correctly with `kubectl apply -f minimal.yaml`
2. If the Istio service mesh is properly installed in your cluster
3. If the network connection is normal
4. If the application pods have been restarted after applying the configuration
5. If there are any error messages in the application logs

---

## Technical Support

If you encounter any problems during use, you can get help in the following ways:

### 📧 Contact Support

- **Email**: support@softprobe.ai
- **Response Time**: Within 24 hours on business days

### 📚 Documentation Resources

- **API Documentation**: [https://docs.softprobe.ai](https://docs.softprobe.ai)
- **Developer Guide**: [https://developers.softprobe.ai](https://developers.softprobe.ai)
- **FAQ**: [https://softprobe.ai/faq](https://softprobe.ai/faq)

### 🐛 Problem Feedback

If you find a bug or have a feature suggestion:
1. Log in to the Dashboard
2. Click the feedback button in the top right corner
3. Describe the problem or suggestion in detail
4. We will follow up in a timely manner

---

## 🎉 Get Started

Congratulations! You have completed the basic configuration of Softprobe. Now you can:

1. **Monitor application performance**: View the running status of your application in real-time
2. **Analyze user behavior**: Understand user habits through heatmaps
3. **Optimize user experience**: Optimize your product based on data analysis
4. **Team collaboration**: Invite team members to analyze data together

Start exploring the powerful features of Softprobe and let data drive your product decisions!

---

*Last updated: January 2024*
*Version: v1.0*