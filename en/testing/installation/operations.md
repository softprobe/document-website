---
title: Maintenance and troubleshooting
---

# Maintenance and troubleshooting

Day-to-day upkeep of a single-server install (All-in-One): health checks, disk, backup and restore, upgrades, and how to troubleshoot common problems. Run the commands on the platform server; on a rootless install, run `source ~/.sp-rootless/sp-rootless-env.sh` first. For Kubernetes, see [Kubernetes deployment (Helm)](/en/testing/installation/server).

## Health checks {#health-check}

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

| Check | How | Healthy when |
|-------|-----|--------------|
| Containers | The `docker ps` command above | All 5 containers are running, and all but `sp-parquet-s3` show `(healthy)` |
| Platform | `curl -s http://127.0.0.1:8090/vi/health` | The JSON response has `responseDesc` set to `success` |
| Services under test | **Applications** in the console | Applications show **Agent online** |
| Disk | `df -h /var/lib/docker` | At least 20% free |
| Memory | `docker stats --no-stream` | No container sits at its memory limit for long |
| Cache evictions | `docker exec sp-redis redis-cli info stats \| grep evicted_keys` | `evicted_keys:0` |

A non-zero `evicted_keys` means the cache is too small: recordings used during replay are held in the cache, and cases whose data is evicted are marked invalid. Raise `SP_REDIS_MAXMEMORY` and `SP_REDIS_MEM_LIMIT` in `.env`; see [Single-server install — Configure](/en/testing/installation/all-in-one#configure).

Versions are shown under **Settings → General → About** at the top right of the console.

## Disk {#disk}

Most space goes to two data volumes:

| Volume | Contents |
|--------|----------|
| `sp-mongodb-data` | Recordings, replay results, configuration |
| `sp-parquet` | Logs collected during recording and replay |

`docker system df -v` shows the size of each volume.

When space runs low:

1. Shorten retention under **Settings → Data retention**; see [Data protection and retention](/en/testing/installation/data-protection#retention). Cleanup runs every hour.
2. Lower sampling rates under **Recording**, or exclude endpoints you don't need.

The database reuses space freed by deleted data for new data before returning it to the operating system, so free space reported by `df` may not grow right away.

## Backup and restore {#backup}

What to back up:

| What | Where | Notes |
|------|-------|-------|
| Database | The `sp-mongodb` container | Recordings, replay results and all configuration |
| Encryption key | `softprobe/docker-compose.yml` | If you replaced the key, backed-up payloads can't be read without it. Keep it separately; see [Replace the key](/en/testing/installation/data-protection#change-key) |
| Configuration | `softprobe/.env`, `softprobe/docker-compose.yml` | |

The cache doesn't need a backup: it only holds temporary data and is emptied on every restart anyway.

### Back up the database {#backup-db}

```bash
docker exec sp-mongodb mongodump --archive --gzip > sp-backup-$(date +%F).archive.gz
```

The platform keeps running during the backup. For a fully consistent backup, pause the platform with `docker stop sp-allinone` first and `docker start sp-allinone` afterwards; while it's paused, uploads from the services under test fail, the agent slows down, and it recovers once the platform is back.

### Restore the database {#restore-db}

A restore **overwrites** matching data in the current database:

```bash
docker stop sp-allinone
docker exec -i sp-mongodb mongorestore --archive --gzip --drop < sp-backup-2026-09-29.archive.gz
docker start sp-allinone
```

To restore on another machine, install the same platform version there with **the same encryption key as the backup** first, then restore.

## Upgrade {#upgrade}

1. Back up the database as above.
2. Upgrade the platform: [Single-server install — Upgrade](/en/testing/installation/all-in-one#upgrade).
3. Check afterwards: all containers are running and all but `sp-parquet-s3` show `(healthy)`; the versions under **Settings → General → About** have changed; applications are back online under **Applications**; a small manual replay completes and produces a report.

The agent is upgraded separately from the platform; see [Attach the Java agent](/en/testing/java-agent).

## Troubleshooting {#troubleshooting}

Start with the logs:

```bash
docker logs --tail 300 sp-allinone     # backend, console and AI service
docker logs --tail 300 sp-mongodb      # database
```

Detailed backend logs are in `/logs/storage.log` inside the container and are kept for 2 days.

| Symptom | Check first |
|---------|-------------|
| The console doesn't load | The network rule from office computers to port 8090; whether `sp-allinone` is running in `docker ps` |
| The console shows no applications, or pages keep loading and queries time out | Whether the database is healthy: look for `Too many open files` or an exited process in `docker logs sp-mongodb`. When the database fails, what you see in the console rarely points to it |
| An application never comes online | The network from the application server to port 8090; the agent's `-Dsp.api.url`; lines starting with `[Softprobe]` in the service's start-up log. See [Attach the Java agent](/en/testing/java-agent) |
| The application is online but recordings go missing now and then | Whether a firewall or NAT device limits sessions or idle time, see [Before you deploy](/en/testing/installation/preparation#firewall); whether the agent's upload queue filled up, see [Attach the Java agent — Protecting production](/en/testing/java-agent#queue-overflow) |
| Every replay request fails | The network from the platform server to the service's port; the target address in the replay plan. See [Replay send log markers](/en/testing/reference/replay-send-log-markers) |
| Many cases are marked invalid during replay | Whether the cache is evicting data: see `evicted_keys` under [Health checks](#health-check) |
| **View case logs** says the log pipeline is unavailable | Whether the `sp-vector` and `sp-parquet-s3` containers are running |
| The report says the analysis service isn't connected | Whether `SP_DISABLE_AI=1` is set; whether the AI service was killed for lack of memory: search `docker logs sp-allinone` for `opencode`, and raise `SP_ALLINONE_MEM_LIMIT` if needed |
| Model settings disappeared after an upgrade | Early packages mounted the configuration directory wrongly; newer start scripts fix it and say so. Enter the settings once more and they'll stay |

## When you contact Softprobe {#support}

- The package file name (it includes the build time), and the console and backend versions under **Settings → General → About**
- The output of `docker ps -a`
- Logs from around the problem: `docker logs --since 2h sp-allinone > sp-allinone.log 2>&1`, plus `sp-mongodb` logs for database problems
- For agent problems: the service's start-up flags (with passwords and other secrets removed), and the agent log from the `logs` directory next to `sp-agent.jar`
- The application ID, trace ID, replay plan ID and time window involved; see [Concepts and IDs](/en/testing/agents/concepts#ids)

Don't include encryption keys or business payloads when you report a problem. If payloads are really needed, agree on how to transfer them with Softprobe first.
