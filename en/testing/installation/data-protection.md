---
title: Data protection and retention
---

# Data protection and retention

Recordings are real business requests and responses, and can contain customer details, amounts or ID numbers. This page covers where that data lives on a self-hosted deployment, how it's encrypted, who can see it and how long it's kept.

## What's collected {#what}

| Data | Contents | Stored in |
|------|----------|-----------|
| Recordings | Entry requests and responses, plus the arguments and results of database, cache and downstream calls made while handling them | The platform's MongoDB |
| Replay results | Responses and dependency calls during replay, and comparison results | The platform's MongoDB |
| Instance information | JVM system properties and environment variables of the service, sent when the agent first connects, used to identify instances | The platform's MongoDB |
| Logs | Platform and agent logs from recording and replay | Single server: a log volume on the platform server; Kubernetes: the log pipeline's storage (a volume in the cluster or your object store) |

On the single-server and Kubernetes deployments all of this stays on your network. Content only leaves it when you turn on [AI diagnosis](/en/testing/installation/ai-diagnosis) or [replay notifications](/en/testing/notifications), and then only to the model service or notification channel you configured.

::: warning Instance information isn't encrypted
JVM system properties and environment variables are outside the payload encryption below. If the service's start-up flags or environment variables contain passwords or tokens, deal with that before attaching the agent, for example by reading them from a configuration center or a file instead.
:::

## Payload encryption {#encryption}

Recorded requests and responses, and both sides' payloads saved for replay comparison, are encrypted with AES-256-GCM before they're written to the database. This is on by default. Replay needs the original payloads, so the database holds the encrypted originals and decrypts them on read.

**Keys**:

- **Single server**: the package ships with a default key that is the same in every package. **Replace it with your own key before the first recording is written**, as described below.
- **Kubernetes**: installation requires `encryption.secretKey` in your values; see [Kubernetes deployment (Helm)](/en/testing/installation/server).

### Replace the single-server key {#change-key}

1. Generate a new key (32 bytes, Base64):

   ```bash
   openssl rand -base64 32
   ```

2. In `softprobe/docker-compose.yml`, add a line under `environment` of the `sp-allinone` service:

   ```yaml
       environment:
         AES256_ENCRYPTION_SECRET_KEY: "<the key from step 1>"
   ```

3. Run `./start.sh` in `softprobe/`; the container is recreated with the new setting.

Upgrades don't overwrite `docker-compose.yml`, so the key stays in place.

::: danger Lose the key, lose the data
- Back the key up on its own, separately from database backups.
- Changing the key after recordings exist makes the earlier ones unreadable: their payloads show up empty and can't be replayed. Only change it on a fresh installation with no data yet.
:::

### SM4 {#sm4}

The platform can encrypt payloads with the Chinese national standard SM4 (SM4-GCM) instead of AES; only one of the two is used. If you need SM4, contact Softprobe before installing.

### Encryption in transit {#tls}

By default the agent talks to the platform over plain HTTP on port 8090, inside your network. To encrypt that traffic, give the platform a trusted certificate and import it into the Java trust store of the services under test. The platform's built-in port 8443 uses a self-signed certificate that the agent doesn't trust by default, so don't point the agent at 8443 directly.

## Masking in the console {#masking}

Configure field rules under **Config → Redact**. When the console shows recorded or replayed payloads, matching fields are masked. See [Recording and replay settings — Redact](/en/testing/policies#sensitive).

Masking changes what's displayed, not what's stored:

- The database still holds the encrypted original payloads, and replay uses the originals.
- It only applies to JSON payloads. Other formats such as XML, and payloads longer than about one million characters, are shown as they are.

## Who can see it {#access}

A self-hosted deployment has no user accounts or permissions yet, and the platform's interfaces don't authenticate callers: anyone who can reach port 8090 on the platform server can see every application's recordings. Control access with network rules:

- Open port 8090 only to the people who use Softprobe and to the application servers; see [Before you deploy — Network rules](/en/testing/installation/preparation#network).
- Keep the platform server's other ports closed.
- The replay trigger endpoints (`SP_REPLAY_OPENAPI`) don't authenticate callers and are off by default; only turn them on when port 8090 is reachable from your internal network alone.

## Retention {#retention}

Set retention under **Settings → Data retention** at the top right of the console. It applies to all applications, and cleanup runs every hour.

| Data | Includes |
|------|----------|
| Recorded traffic | Recorded cases, call-chain relations and endpoint statistics |
| Logs | Logs collected during recording and replay |
| Replay diagnostics | Replay execution logs and mock decision records. Replay reports themselves are never cleaned up |

Each can be set to **System default**, **Keep forever** or **Custom days** (up to 10000). The system default for recorded traffic is 2 days.

- [Pin](/en/testing/pinned-cases) recordings you want to keep; pinned cases aren't affected by the recording retention period.
- Before choosing **Keep forever**, estimate disk use from your daily recording volume and check free space regularly; see [Maintenance](/en/testing/installation/operations#disk).

## Clean-up when you're done {#cleanup}

- **Services under test**: remove the agent's start-up flags and restart, then delete `sp-agent.jar` and its log directory; see [Attach the Java agent — Remove](/en/testing/java-agent#remove).
- **Platform**: delete the containers, data volumes, images and installation directory; see [Single-server install — Uninstall](/en/testing/installation/all-in-one#uninstall). Once the volumes are gone, recordings can't be recovered.
