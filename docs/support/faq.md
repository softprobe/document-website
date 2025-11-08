---
sidebar_position: 3
sidebar_label: FAQ
title: Getting Started FAQ
description: Common questions for account setup, public keys, and initial configuration
---

## FAQ

### Q1: What if I lose the minimal.yaml configuration file?

**A:** The `minimal.yaml` file is only downloaded once when you create a public key. If you lose it:

1. Delete the current public key from your dashboard
2. Create a new public key (this will generate a new `minimal.yaml` file)
3. Save the new configuration file immediately

### Q2: Is my public key a secret?

**A:** No, your public key is not a secret. It's designed to be publicly visible and can be safely stored in version control. Integrity and authenticity are guaranteed by asymmetric cryptography: telemetry is signed (or authenticated) using mechanisms tied to your tenant and verified server-side against known public keys. No sensitive private keys are stored in your Kubernetes configuration.

### Q3: Can a public key be reused across environments?

**A:** Yes, a public key can be used in multiple environments, but we recommend:

- Use separate public keys for production and non-production environments
- This allows for better access control and auditing
- Different environments may have different rate limits and permissions

### Q4: How do I manage multiple projects?

**A:** We recommend creating different tenant groups for different projects:

1. Create a separate tenant group for each project
2. Generate separate public keys for each project
3. Invite relevant team members to the corresponding tenant groups

### Q5: Are there usage limits for public keys?

**A:** Usage limits may include:

- Request rate limits based on your subscription plan
- Data storage quotas
- Feature permission restrictions
- Check your subscription plan for specific limits

### Q6: What if there is no data after configuration?

**A:** Please check:

1. If the `minimal.yaml` file was applied correctly with `kubectl apply -f minimal.yaml`
2. If the Istio service mesh is properly installed in your cluster
3. If the network connection is normal
4. If the application pods have been restarted after applying the configuration
5. If there are any error messages in the application logs

---

## Related Topics

- [Quick Start](/getting-started/quick-start)
- [Installation Guide](/deployment/installation)
- [Configuration Reference](/configuration/config)
- [Core Concepts](/advanced-guides/concepts)