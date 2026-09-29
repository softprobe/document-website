---
title: Single-server install (All-in-One)
---

# Single-server install (All-in-One)

Install the whole SoftProbe platform on one Linux VM: backend, console, database, cache and log components all run on that machine under Docker. The package is fully offline, so it also works on internal networks without internet access.

Before you start, prepare the machine and network rules as described in [Before you deploy](/en/testing/installation/preparation).

## The package {#package}

The package is a self-extracting shell script, built per CPU architecture and supplied by SoftProbe. It's named like `softprobe-linux-amd64-<build time>.sh` and is about 1.1 GB. It contains:

- The SoftProbe platform image, plus the MongoDB, Redis and log component images
- Offline Docker and Docker Compose, installed automatically if the machine has no Docker
- Start and stop scripts
- What the rootless install needs

Check the platform server's architecture with `uname -m`: `x86_64` takes the amd64 package, `aarch64` the arm64 package.

**Copy the package in binary mode**, for example with `scp`. Avoid Xshell's `rz`, FTP text mode or web relays, which easily corrupt large files. The installer checks the file size and SHA256 first and stops on a damaged package; copy it again if that happens.

## Install {#install}

1. Put the package in a directory you'll keep, for example `/opt/softprobe`. It unpacks a `softprobe/` directory **next to itself**, and you'll start, stop and upgrade from there later. Don't use `/tmp`: many systems clear it on reboot.

2. Run the package as root, passing the platform server's address:

   ```bash
   cd /opt/softprobe
   sudo env PUBLIC_BACKEND_HOST=10.0.0.5 bash softprobe-linux-amd64-<build time>.sh
   ```

   `PUBLIC_BACKEND_HOST` is the address (IP or host name) that the services under test and browsers use to reach the platform. Always set it: left unset, the script guesses, and on machines with several network cards or NAT it often guesses wrong. The console then looks fine, but no recordings arrive from your services. The value is saved in `softprobe/.env`, so you only pass it once.

3. The installer verifies the package, unpacks it, installs Docker offline if needed, loads the images, starts the services and waits up to 7 minutes for every health check to pass. On success it prints:

   ```text
   =========================================
    All services are up and healthy.
   =========================================

     Frontend (UI + agent download): http://10.0.0.5:8090
   ```

With only a regular account and no root, see [Rootless install](#rootless).

## Verify {#verify}

1. Open `http://<platform server>:8090` in a browser on an office computer; the console loads.
2. On the platform server, check the containers:

   ```bash
   docker ps --format 'table {{.Names}}\t{{.Status}}'
   ```

   `sp-allinone`, `sp-mongodb`, `sp-redis`, `sp-vector` and `sp-parquet-s3` are running, and all but `sp-parquet-s3` show `(healthy)`.

3. On an application server, confirm it can reach the platform:

   ```bash
   curl -fsS -o /dev/null -w '%{http_code}\n' http://<platform server>:8090/api/agent/sp-agent.jar
   ```

   `200` means network rule 1 is open.

Next, [attach the Java agent](/en/testing/java-agent).

## Start and stop {#start-stop}

In the `softprobe/` directory:

```bash
COMPOSE_PROFILES=bundled docker compose -f docker-compose.yml down   # stop every service; data is kept
./start.sh                                                           # start the services
```

::: warning Don't stop with stop.sh
In current packages, `./stop.sh` only stops the platform container; the database, cache and log components keep running. Use the command above instead.
:::

The Docker installed by the package starts on boot, and the platform containers restart with Docker: after a reboot the platform comes back on its own, without `./start.sh`. Services stopped with the command above stay stopped.

## Configure {#configure}

Settings live in `softprobe/.env`. Run `./start.sh` once after editing it. The ones you're most likely to change:

| Setting | What it does |
|---------|--------------|
| `PUBLIC_BACKEND_HOST` | The platform's address. Change it if the platform server's IP changes |
| `SP_DISABLE_AI=1` | Don't start the AI service, to save memory. Useful without a model service; AI entries still appear in the console but don't work |
| `SP_REPLAY_OPENAPI=true` | Turn on the replay trigger endpoints for pipelines, see [Replay after deployment](/en/testing/webhook-and-ci). They don't authenticate callers, so only turn them on when port 8090 is reachable from your internal network alone |
| `SP_MONGO_CACHE_GB`, `SP_MONGO_MEM_LIMIT` | Database cache and memory limit, 2 GB and 4 GB by default |
| `SP_REDIS_MAXMEMORY`, `SP_REDIS_MEM_LIMIT` | Cache data cap and memory limit, 2 GB and 3 GB by default. Recordings used during replay are held here, so raise both for heavy replay |
| `SP_ALLINONE_MEM_LIMIT` | Memory limit of the platform container (backend, console and AI service), 8 GB by default |

If the limits together exceed physical memory, they no longer isolate anything. With less than 16 GB, scale them down or turn off the AI service.

## Upgrade {#upgrade}

1. Put the new package in **the same directory as the original one**, the parent of `softprobe/`.
2. Run it the same way:

   ```bash
   cd /opt/softprobe
   sudo bash softprobe-linux-amd64-<new build time>.sh
   ```

When `softprobe/` already exists, the installer upgrades: images and scripts are replaced; `docker-compose.yml`, `.env` and the certificate directory `ssl/` are kept as they are; recordings and the model and Git account settings from the console live in Docker volumes and are untouched. Afterwards, run through [Verify](#verify) again.

Back up first; see [Maintenance — Backup and restore](/en/testing/installation/operations#backup).

## Rootless install {#rootless}

With only a regular account, run the package the same way, without `sudo`:

```bash
PUBLIC_BACKEND_HOST=10.0.0.5 bash softprobe-linux-amd64-<build time>.sh
```

When there's no root and no usable Docker, the installer switches to the rootless install: Docker runs as the current account, nothing is written to `/usr` or `/etc`, no system services are registered, and programs and data stay in that account's home directory. This is Docker's officially supported rootless mode; the whole platform only has that account's permissions.

### Check first {#rootless-check}

The rootless install has a few system requirements, and fixing them needs root. Run the read-only check before installing:

```bash
softprobe/rootless/sp-rootless-up.sh --check
```

If the package isn't on the server yet, ask SoftProbe for the standalone check script `sp-rootless-precheck-<arch>-<build time>.sh` (a small file of about 15 KB) and run `bash sp-rootless-precheck-*.sh --check`.

It prints PASS or FAIL for each item. The main ones:

| Requirement | If it fails |
|-------------|-------------|
| The kernel lets regular users create user namespaces (`max_user_namespaces` above 0) | Disabled in the kernel: the rootless install can't be used |
| Ubuntu 23.10+ and Debian 12+: AppArmor doesn't restrict unprivileged user namespaces | Needs root: `sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` |
| `uidmap` is installed (`newuidmap` and `newgidmap` with setuid) | Needs root to install |
| `/etc/subuid` and `/etc/subgid` give the account at least 65536 IDs | Needs root to add |
| Hard limit on open files is at least 64000 | Needs root to change `/etc/security/limits.conf` |
| The home directory's partition isn't mounted `noexec` | Use another directory with `SP_ROOTLESS_ROOT=/var/tmp/sp-rootless` |
| At least 10 GB free disk (18 GB if `/dev/fuse` is unavailable) | Free up space or use another disk |
| Ports 8090 and 8443 are free | Change the port mapping or free the ports |

### Day to day {#rootless-ops}

The rootless install runs from `~/.sp-rootless`. Use the scripts there:

```bash
source ~/.sp-rootless/sp-rootless-env.sh    # point docker in this terminal at the rootless Docker
docker ps

~/.sp-rootless/sp-rootless-down.sh          # stop the services; data is kept
~/.sp-rootless/sp-rootless-up.sh            # start the services
```

After the first successful start, everything needed has been copied into `~/.sp-rootless`, and you can delete the package and the unpacked `softprobe/` directory. Recordings live under `~/.sp-rootless/data`; don't delete it.

Settings live in `~/.sp-rootless/deploy/.env`, with the same options as [Configure](#configure) except the memory limits. Run `~/.sp-rootless/sp-rootless-up.sh` once after editing it.

To upgrade, stop everything first, then run the new package as the same account:

```bash
~/.sp-rootless/sp-rootless-down.sh --all    # stop Docker as well
PUBLIC_BACKEND_HOST=10.0.0.5 bash softprobe-linux-amd64-<new build time>.sh
```

Recordings and loaded images are kept.

### Logging out and rebooting {#rootless-linger}

With no system service behind it, two things need care:

- **Logging out**: when the account's last session ends, the system may remove the account's runtime directory, and `docker` can no longer connect. The start script tries to enable linger for the account (`loginctl enable-linger`); if it can't, it says so. Then ask an administrator to run `sudo loginctl enable-linger <account>`, or keep a `tmux` or `screen` session open.
- **Rebooting**: nothing starts automatically. With linger enabled, add a cron entry:

  ```bash
  (crontab -l 2>/dev/null; echo "@reboot $HOME/.sp-rootless/sp-rootless-up.sh >> $HOME/.sp-rootless/boot.log 2>&1") | crontab -
  ```

### Differences from the root install {#rootless-limits}

- No memory limits: the memory settings in `.env` have no effect.
- Networking goes through a user-space stack and is slower than the root install; don't use it as a load-testing baseline.
- The AI service inside the container only sees `/home`, limited to that account's permissions.

### Uninstall {#rootless-uninstall}

```bash
~/.sp-rootless/sp-rootless-down.sh --purge
```

This removes the data volumes and images, stops Docker and deletes the runtime directory, in that order. **Recordings are deleted and can't be recovered.**

Don't `rm -rf ~/.sp-rootless` directly: some files created inside containers belong to mapped user IDs the account can't delete, and `rm` would first remove the programs needed to clean up. If you've already deleted half of it, ask an administrator to run `sudo rm -rf ~/.sp-rootless`.

## Uninstall {#uninstall}

For the root install, in the `softprobe/` directory:

```bash
COMPOSE_PROFILES=bundled docker compose -f docker-compose.yml down -v   # remove containers and data volumes
docker image rm sp-allinone:1.0 mongo:7.0 redis:7-alpine timberio/vector:0.56.0-debian rclone/rclone:1.68
```

**`down -v` deletes every recording, permanently.** Then delete the `softprobe/` directory and the package. Docker installed by the package isn't removed; handle it according to your own policy if you no longer need it.

The agent on the services under test is removed separately; see [Attach the Java agent — Remove](/en/testing/java-agent#remove).
