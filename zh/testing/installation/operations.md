---
title: 平台维护与故障排查
---

# 平台维护与故障排查

本页是单机部署（All-in-One）的日常维护手册：巡检、磁盘、备份恢复、升级，以及常见故障的排查方法。命令都在平台服务器上执行；免 root 部署先执行 `source ~/.sp-rootless/sp-rootless-env.sh`。Kubernetes 部署的对应操作见 [Kubernetes 部署（Helm）](/zh/testing/installation/server)。

## 日常巡检 {#health-check}

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
```

| 检查什么 | 怎么查 | 正常情况 |
|---------|--------|---------|
| 容器状态 | 上面的 `docker ps` 命令 | 5 个容器都在运行，除 `sp-parquet-s3` 外都是 `(healthy)` |
| 平台健康 | `curl -s http://127.0.0.1:8090/vi/health` | 返回的 JSON 里 `responseDesc` 为 `success` |
| 被测服务 | 控制台「应用管理」 | 应用状态为「Agent 在线」 |
| 磁盘 | `df -h /var/lib/docker` | 可用空间不低于 20% |
| 内存 | `docker stats --no-stream` | 各容器没有长期贴着内存上限 |
| 缓存淘汰 | `docker exec sp-redis redis-cli info stats \| grep evicted_keys` | `evicted_keys:0` |

`evicted_keys` 不为 0，说明缓存上限不够：回放时用到的录制数据暂存在缓存里，被淘汰的用例会被判为无效。调大 `.env` 里的 `SP_REDIS_MAXMEMORY` 和 `SP_REDIS_MEM_LIMIT`，见 [单机部署 — 修改配置](/zh/testing/installation/all-in-one#configure)。

版本号在控制台右上角「设置 → 通用 → 关于」里查看。

## 磁盘 {#disk}

占用空间的主要是两个数据卷：

| 数据卷 | 内容 |
|-------|------|
| `sp-mongodb-data` | 录制数据、回放结果、配置 |
| `sp-parquet` | 录制和回放过程中采集的日志 |

用 `docker system df -v` 查看每个数据卷的大小。

空间不够时：

1. 在「设置 → 数据保留期」里缩短保留天数，见 [数据保护与保留期](/zh/testing/installation/data-protection#retention)。清理任务每小时执行一次。
2. 在「录制配置」里降低采样率，或排除不需要录的接口。

数据库删除数据后，腾出的空间优先留给新数据复用，不一定会马上归还给操作系统，所以 `df` 看到的可用空间可能不会立即增加。

## 备份与恢复 {#backup}

需要备份的：

| 内容 | 在哪 | 说明 |
|------|------|------|
| 数据库 | `sp-mongodb` 容器 | 录制数据、回放结果、全部配置 |
| 加密密钥 | `softprobe/docker-compose.yml` | 换过密钥的，没有密钥就无法读取备份里的报文。单独保存，见 [更换密钥](/zh/testing/installation/data-protection#change-key) |
| 配置文件 | `softprobe/.env`、`softprobe/docker-compose.yml` | |

缓存不需要备份：它只存放临时数据，重启后本来就会清空。

### 备份数据库 {#backup-db}

```bash
docker exec sp-mongodb mongodump --archive --gzip > sp-backup-$(date +%F).archive.gz
```

备份期间平台照常运行。想要一份完全一致的备份，先执行 `docker stop sp-allinone` 暂停平台，备份完再 `docker start sp-allinone`；暂停期间被测服务的录制会上报失败，Agent 会自动降速，平台恢复后自动恢复。

### 恢复数据库 {#restore-db}

恢复会**覆盖**当前数据库里的同名数据：

```bash
docker stop sp-allinone
docker exec -i sp-mongodb mongorestore --archive --gzip --drop < sp-backup-2026-09-29.archive.gz
docker start sp-allinone
```

恢复到另一台机器时，先在那台机器上装好同一版本的平台，并配置**与备份时相同的加密密钥**，再执行恢复。

## 升级 {#upgrade}

1. 按上文先备份数据库。
2. 升级平台：[单机部署 — 升级](/zh/testing/installation/all-in-one#upgrade)。
3. 升级后检查：容器都在运行，除 `sp-parquet-s3` 外都是 `(healthy)`；「设置 → 通用 → 关于」里的版本号已更新；「应用管理」里应用重新在线；手动发起一次小范围的回放，能正常出报告。

Agent 的版本和平台分别升级，见 [接入 Java Agent](/zh/testing/java-agent)。

## 故障排查 {#troubleshooting}

先看日志：

```bash
docker logs --tail 300 sp-allinone     # 后端、控制台和 AI 服务
docker logs --tail 300 sp-mongodb      # 数据库
```

后端的详细日志在容器里的 `/logs/storage.log`，保留 2 天。

| 现象 | 先查什么 |
|------|---------|
| 控制台打不开 | 办公电脑到平台服务器 8090 的网络策略；`docker ps` 里 `sp-allinone` 是否在运行 |
| 控制台显示没有应用，或者页面一直加载、查询超时 | 数据库是否正常：`docker logs sp-mongodb` 里有没有 `Too many open files` 或进程退出。数据库异常时，控制台的现象往往看不出是数据库的问题 |
| 应用一直不在线 | 被测应用服务器到平台 8090 的网络；Agent 的 `-Dsp.api.url` 地址是否正确；被测服务启动日志里 `[SoftProbe]` 开头的行。见 [接入 Java Agent](/zh/testing/java-agent) |
| 应用在线，但录制零星丢失 | 中间的防火墙、NAT 设备是否限制了会话数或空闲超时，见 [部署前准备](/zh/testing/installation/preparation#firewall)；Agent 的上报队列是否满过，见 [接入 Java Agent — 生产环境保护](/zh/testing/java-agent#queue-overflow) |
| 回放请求全部失败 | 平台服务器到被测服务业务端口的网络；回放计划里填的目标地址。见 [回放发送日志标记](/zh/testing/reference/replay-send-log-markers) |
| 回放中很多用例被判为无效 | 缓存是否在淘汰数据：见上文 [巡检](#health-check) 的 `evicted_keys` |
| 「查看用例日志」提示日志管道不可用 | `sp-vector`、`sp-parquet-s3` 两个容器是否在运行 |
| 报告里 AI 分析显示「分析服务未连接」 | 是否设置了 `SP_DISABLE_AI=1`；AI 服务是否因内存不足被终止：`docker logs sp-allinone` 里搜索 `opencode`，必要时调大 `SP_ALLINONE_MEM_LIMIT` |
| 升级后控制台里的模型配置没了 | 早期安装包的配置目录挂载有误，新版启动脚本会自动改正并提示。按提示重新填一次，之后不会再丢 |

## 联系 SoftProbe 时请提供 {#support}

- 安装包文件名（含打包时间），以及「设置 → 通用 → 关于」里的前端版本和后端版本
- `docker ps -a` 的输出
- 出问题前后的日志：`docker logs --since 2h sp-allinone > sp-allinone.log 2>&1`，数据库有问题时加上 `sp-mongodb` 的日志
- Agent 相关的问题：被测服务的启动参数（去掉密码等敏感信息），以及 Agent 的日志（在 `sp-agent.jar` 所在目录下的 `logs` 目录）
- 具体的应用 ID、Trace ID、回放计划 ID 和出问题的时间段，见 [应用、用例与回放编号](/zh/testing/agents/concepts#ids)

反馈问题时不要附上加密密钥和业务报文。确实需要报文时，先和 SoftProbe 约定传输方式。
