---
title: Choose a deployment
---

# Choose a deployment

Softprobe has two parts: the **platform** (backend, console and database), installed in one place, and the **Java agent**, attached to every service you test. The agent is attached the same way everywhere. The platform can be deployed in three ways; pick the one that fits your environment.

| Deployment | Good for | Where it runs | Read next |
|-----------|----------|---------------|-----------|
| **Softprobe Cloud** | Trying Softprobe out; services that can reach the internet | Nothing to install: Softprobe hosts the platform | [Your first record and replay](/en/testing/getting-started) |
| **Single server (All-in-One)** | The usual choice for self-hosting; POCs; data that must stay on your network | One Linux VM. The offline package brings Docker, the database and the cache | [Single-server install (All-in-One)](/en/testing/installation/all-in-one) |
| **Kubernetes (Helm)** | You already run Kubernetes, or want to use an existing MongoDB, Redis or object store | Your Kubernetes cluster | [Kubernetes deployment (Helm)](/en/testing/installation/server) |

If you're unsure: with no Kubernetes platform in place, or for a POC, use the single-server install. If you already run Kubernetes with an operations process around it, use Helm.

## How they differ {#compare}

| | Softprobe Cloud | Single server | Kubernetes |
|---|---|---|---|
| Where recordings are stored | Softprobe's cloud | That VM | MongoDB in the cluster, or your existing MongoDB |
| Internet access | Required | Not required: install and run fully offline | Not required once images can be pulled from your registry |
| Replay targets on your internal network | Use [`sp tunnel`](/en/testing/commands/tunnel) or the desktop client | Replay directly | Replay directly |
| Scaling and high availability | Handled by Softprobe | One machine, no high availability | Whatever your cluster provides |

## Desktop client {#desktop}

The desktop client runs on an office computer and connects to any of the platforms above; after signing in you see the same applications and data. You need it when:

- The platform is Softprobe Cloud and the replay target is only reachable inside your network: start **Run replay now** from the desktop client on a machine inside that network.
- Your code repositories can't be reached from the platform: the desktop client reads the code on your computer for AI diagnosis, and the code never leaves that machine.

Download it from the button at the top right of the console. On a self-hosted platform, office computers must reach port `8443` on the platform server; see [Before you deploy](/en/testing/installation/preparation#optional).

## After deployment {#next}

1. [Attach the Java agent](/en/testing/java-agent) to the services you test.
2. [Your first record and replay](/en/testing/getting-started): record a few requests, replay them and read the report.
3. As needed: [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis), [Data protection and retention](/en/testing/installation/data-protection).
4. Day to day: [Maintenance and troubleshooting](/en/testing/installation/operations).

::: info Business observability
The **Business observability** deployment on this site (mesh traffic capture with Istio) applies to Softprobe Cloud only and is unrelated to the record-and-replay platform described here.
:::
