---
title: 'Before you deploy: resources and network'
---

# Before you deploy: resources and network

What to prepare before a self-hosted deployment: the machine, the account and the network rules. This page is written for the single-server install (All-in-One). Resources for Kubernetes are listed in [Kubernetes deployment (Helm)](/en/testing/installation/server#resources); the network rules are the same.

Two kinds of machine are involved:

- **Platform server**: the VM Softprobe is installed on.
- **Application servers**: the servers running the services you test, where the Java agent is attached.

## Checklist {#checklist}

| # | What | Notes |
|---|---|---|
| 1 | Platform server | One Linux VM: 8 cores, 16 GB memory, 100 GB disk (4 cores minimum) |
| 2 | Account | root or passwordless sudo. A regular account also works, with the [rootless install](/en/testing/installation/all-in-one#rootless) |
| 3 | Network rules | The three rules below |
| 4 | Restart windows for the services under test | Attaching the agent means changing start-up flags and restarting once; removing it later means one more restart |
| 5 | Memory headroom on the services under test | About 512 MB for the agent |

## Platform server {#server}

| Item | Requirement | Why |
|---|---|---|
| CPU | 8 cores recommended, 4 minimum | Replay and comparison run in parallel with the core count; the backend, database and AI diagnosis all run on this machine |
| Memory | 16 GB | The backend heap is capped at 3 GB and the database cache and the cache service at 2 GB each; each process uses a little more than its cap. Add AI diagnosis on top. Without AI diagnosis, 8 GB is enough |
| Disk | 100 GB | The package is about 1.1 GB and about 4 GB unpacked; the rest holds recordings and logs. Recordings are deleted automatically by [retention period](/en/testing/installation/data-protection#retention). Very large payloads, many endpoints or a raised sampling rate need more |
| Operating system | Linux, x86_64 or arm64 | Packages are built per CPU architecture; check with `uname -m`, as a mismatched package won't install. Tested on Kylin V10 |
| Account | root or passwordless sudo | Installing Docker and registering system services needs root. With only a regular account, use the rootless install; it has a few system requirements you can check before installing, see [Rootless install](/en/testing/installation/all-in-one#rootless) |

You don't need to prepare:

- **Docker**: the package includes offline Docker and Docker Compose. An existing Docker installation is used as is.
- **Database or cache**: included with the platform.
- **Internet access**: neither installation nor operation needs it. Only replay notifications to DingTalk or Feishu do; see [Optional rules](#optional).

## Network rules {#network}

All three are one-way: open them in the direction shown. Return traffic on established connections must be allowed, which stateful firewalls do by default.

| # | Source | Destination | Port | Purpose | If it's closed |
|---|---|---|---|---|---|
| 1 | Application servers | Platform server | TCP 8090 | The agent uploads recordings, fetches configuration and reports status; during replay it fetches recorded results | Nothing is recorded and nothing can be replayed |
| 2 | Platform server | Application servers | The service's own port, such as 8080 | Replay: recorded requests are sent to the service | Every replay request fails |
| 3 | Users' office computers or subnet | Platform server | TCP 8090 | Open the console in a browser | The console doesn't load |

- Rule 2 uses the port the service already serves on. If the platform reaches the service through a load balancer or gateway, use the address and port the platform actually connects to. Replay has no dedicated port.
- Rule 3: the console shows recorded business payloads. Open it only to the people who need it, not to the whole office network.

Not needed:

- **No new ports on the application servers.** The agent doesn't listen on any port; it only connects out to port 8090 on the platform server.
- **Keep the platform server's other ports closed.** The bundled database and cache only talk to each other inside the platform; the platform only serves on 8090, plus 8443 if you enable it.
- **No new access from the services to databases or third parties for replay.** Dependency calls made while handling a replayed request are answered by the agent from the recording by default. The service's own start-up and background jobs still reach their dependencies as before, so keep existing network rules unchanged.

### Optional rules {#optional}

Open these only for the features that need them:

| Source | Destination | Port | When |
|---|---|---|---|
| Office computers | Platform server | TCP 8443 (HTTPS) | When using the [desktop client](/en/testing/installation/deployment#desktop). Browsers only let HTTPS pages talk to a local program |
| Platform server | Your model service | The model service's port | For [AI diagnosis](/en/testing/installation/ai-diagnosis) |
| Platform server | Your code repositories | SSH 22 or HTTPS 443 | For AI diagnosis to read code |
| Platform server | DingTalk or Feishu | HTTPS 443 (internet access) | To send [replay notifications](/en/testing/notifications) |
| CI servers | Platform server | TCP 8090 | To [trigger replays from a pipeline](/en/testing/webhook-and-ci). These endpoints are off by default, don't authenticate callers, and share port 8090 with the console, so a port-based firewall rule can't limit them to your CI servers. Agree on access control before turning them on |

### Firewalls and network devices {#firewall}

- **The agent talks to the platform on 8090; don't open only 8443.** 8090 is plain HTTP and stays inside your network. 8443 uses a certificate the platform signs itself, which the agent doesn't trust by default. To encrypt traffic between agent and platform, give the platform a trusted certificate and import it into the Java trust store of the services you test.
- **Allow enough sessions.** Each service process opens up to 200 connections to upload recordings, plus a few for logs and metrics. If a firewall or NAT device between them limits sessions, leave headroom per process; otherwise recordings are lost now and then, which is hard to notice.
- **Set idle timeouts to 60 seconds or more.** The agent recycles idle connections itself; a device that drops idle connections sooner causes occasional upload failures.

## Services under test {#target}

| Item | Notes |
|---|---|
| JDK | 8, 11, 17 or 21. JDK 17 and 21 need a set of `--add-opens` flags, see [Attach the Java agent](/en/testing/java-agent#jdk17) |
| Frameworks and middleware | See [Supported Java versions and frameworks](/en/testing/supported-frameworks) |
| Restart window | Attaching the agent adds a few start-up flags and needs one restart; removing it takes those flags out and needs another. Book the windows through your change process |
| Server access | Someone must copy `sp-agent.jar` to the application server and change the start-up flags |
| Memory | The agent shares the JVM's memory. Leave about 512 MB; more for very large (MB-sized) payloads or a raised sampling rate |

## Next {#next}

- [Single-server install (All-in-One)](/en/testing/installation/all-in-one)
- [Kubernetes deployment (Helm)](/en/testing/installation/server)
