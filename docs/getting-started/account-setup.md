---
sidebar_position: 4
---

# Account Setup Guide

This guide walks you through setting up your Softprobe account, from registration to API key generation, so you can start using SP-Istio Agent with your service mesh.

## 📋 Table of Contents

1. [Step 1: Register for a Softprobe Account](#step-1-register-for-a-softprobe-account)
2. [Step 2: Create a Tenant Group](#step-2-create-a-tenant-group)
3. [Step 3: Generate an API Key](#step-3-generate-an-api-key)
4. [Frequently Asked Questions](#faq)
5. [Technical Support](#technical-support)

---

## Step 1: Register for a Softprobe Account

### 1.1 Visit the Registration Page

1. Open your browser and go to [https://dashboard.softprobe.ai](https://dashboard.softprobe.ai)
2. Click the **"Sign Up"** button in the top right corner of the page

### 1.2 Fill in Your Registration Information

On the registration page, fill in the following information:

- **Email Address**: Used for login and receiving notifications
- **Password**: It is recommended to use a strong password (at least 8 characters, including letters, numbers, and special characters)
- **Confirm Password**: Re-enter your password to confirm

### 1.3 Verify Your Email

1. Click the **"Create Account"** button
2. Check your email for a verification message
3. Click the verification link in the email to complete email verification

### 1.4 Log In to Your Account

1. Return to [https://softprobe.ai](https://softprobe.ai)
2. Click the **"Sign In"** button
3. Enter your email and password
4. Click **"Sign In"** to complete the login

---

## Step 2: Create a Tenant Group

A Tenant Group is a core concept in Softprobe, used to manage team members and API access permissions.

### 2.1 Go to the Settings Page

1. After logging in, click on **"Settings"** in the left navigation bar
2. Find the **"Tenant Groups"** section on the settings page

### 2.2 Create Your First Tenant Group

If you don't have any tenant groups yet, you will see an empty state prompt:

```
No tenant groups
You are not part of any tenant groups yet. Create one to get started.
```

1. Click the **"Create Your First Group"** button
2. In the dialog box that appears, fill in:
   - **Group Name**: e.g., "My Development Team"
   - **Description**: e.g., "Tenant group for the main development team"
3. Click the **"Create"** button

### 2.3 Manage Team Members (Optional)

After creating a tenant group, you can invite team members:

1. Expand the tenant group card you created (click the dropdown arrow on the right)
2. Find the input box at the bottom of the **"Members"** section
3. Enter the member's email address
4. Click the **"Add"** button or press **Enter**

**Permission Descriptions:**
- **Owner**: Can manage members and create API Keys
- **Member**: Can view information and use API Keys

---

## Step 3: Generate an API Key

An API Key is the credential your application uses to communicate with the Softprobe service.

### 3.1 Create an API Key

1. In the tenant group card, find the **"API Keys"** section
2. Click the **"Add API Key"** button
3. In the dialog box that appears, fill in:
   - **API Key Name**: e.g., "Production API Key" or "Development API Key"
   - **Description** (optional): A description of the API Key's purpose
4. Click the **"Create API Key"** button

### 3.2 Create API Key and Download Configuration

When you click the **"Create API Key"** button, the system will automatically:

1. Generate a new API Key for your tenant group
2. **Automatically download** a `minimal.yaml` configuration file

### 3.3 Important: Save the Configuration File

⚠️ **Critical Reminder**: The `minimal.yaml` file will only be downloaded **once** when you create the API Key!

**About the `minimal.yaml` file:**
- This file contains the complete Kubernetes configuration for deploying SP-Istio WASM Plugin
- Your API Key is already embedded in this configuration file
- It includes all necessary settings for Istio service mesh integration
- Ready to use with `kubectl apply -f minimal.yaml`

**Important Notes:**
- ✅ **Save the file immediately** after download
- ⚠️ **No re-download option** - if you lose this file, you must create a new API Key
- 🔒 **Keep it secure** - the file contains your API Key credentials

### 3.4 API Key Format

The format for a Softprobe API Key is:
```
sk_live_[random_string]  # Production environment
sk_test_[random_string]  # Test environment
```

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