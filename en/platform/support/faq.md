
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

- [Quick Start](/en/platform/getting-started/quick-start)
- [Installation Guide](/en/platform/deployment/installation)
- [Configuration Reference](/en/platform/configuration/config)
- [Core Concepts](/en/platform/advanced-guides/concepts)


## Key Features at a Glance

- Dashboard: Modern responsive UI, real-time analytics, heatmaps, and user session recordings; built with React + Vite + TailwindCSS.
- OTEL Backend: Ingests traces/logs/metrics; BigQuery storage with indexed request_body_hash for fast lookups and correlation.
- Auth Service: Multi-tenant authentication/authorization; Public key lifecycle, JWT utilities, role-based access (OWNER/ADMIN/MEMBER).

::: info Why this matters
These components work together to deliver end-to-end observability with session correlation, efficient data lookup, and secure multi-tenant controls.
:::

## Precautions & Best Practices

- Environment separation: Use distinct tenants/public keys for prod vs. non-prod; start with conservative sampling and ramp up.
- Public key hygiene: Full keys are shown only at creation; store securely; rotate periodically; never commit secrets.
- Rate limits: Each Public key has hourly limits; design clients with retries/backoff and monitor usage counters.
- Data sensitivity: Avoid sending PII in attributes; rely on signing/verification and TLS; prefer hashed request bodies for correlation.
- Performance: BigQuery indexes grow with data; combine filters with request_body_hash; consider time partitions and cache if needed.
- Deployment: Use CI/CD (e.g., ArgoCD) with image tags; ensure dashboard release and backend schema changes are coordinated.

::: tip Best practice
Create separate tenant groups and public keys per project/environment to ease auditing and access control.
:::

::: warning Caution
Do not paste full Public keys into issue trackers or chat tools. Use masked previews in UI and rotate compromised keys immediately.
:::

## Plans & Quotas

- Storage quota per tenant: Configurable (e.g., storageQuotaGb in tenant settings). Usage should be monitored and alerted.
- API rate limits: Per-key hourly caps (rateLimitPerHour). Plan capacity around expected ingestion/query workloads.
- Multi-tenant boundaries: Resources (datasets/buckets) are scoped per tenant and environment for isolation.
- Enterprise options: Higher quotas, SLOs, and custom retention are available. Contact support@softprobe.ai for details.