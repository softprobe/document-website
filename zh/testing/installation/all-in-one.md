---
title: 单机部署（All-in-One）
---

# 单机部署（All-in-One）

把整个 Softprobe 平台装在一台 Linux 虚拟机上：后端、控制台、数据库、缓存、日志组件都在这台机器上，用 Docker 运行。安装包是离线的，装在不能访问互联网的内网里也可以。

开始前，先按 [部署前准备](/zh/testing/installation/preparation) 准备好机器和网络策略。

## 安装包 {#package}

安装包是一个自解压的 shell 脚本，由 Softprobe 按 CPU 架构提供，文件名形如 `softprobe-linux-amd64-<打包时间>.sh`，约 1.1 GB。里面包括：

- Softprobe 平台镜像，以及 MongoDB、Redis、日志组件的镜像
- 离线版 Docker 和 Docker Compose（机器上没有 Docker 时自动安装）
- 启动、停止脚本
- 免 root 部署需要的程序

用 `uname -m` 确认平台服务器的架构：`x86_64` 用 amd64 包，`aarch64` 用 arm64 包。

**传输时用二进制方式**，例如 `scp`。不要用 Xshell 的 `rz`、FTP 的文本模式或网页中转：这些方式容易损坏大文件。安装时会先校验文件大小和 SHA256，损坏的包会直接报错退出，重新传一次即可。

## 安装 {#install}

1. 把安装包放到一个长期保留的目录，例如 `/opt/softprobe`。安装包会在**它所在的目录**下解压出 `softprobe/` 目录，以后启动、停止、升级都在这个目录里操作。不要放在 `/tmp`：很多系统的 `/tmp` 重启后会清空。

2. 用 root 执行安装包，并传入平台服务器的地址：

   ```bash
   cd /opt/softprobe
   sudo env PUBLIC_BACKEND_HOST=10.0.0.5 bash softprobe-linux-amd64-<打包时间>.sh
   ```

   `PUBLIC_BACKEND_HOST` 是被测服务和浏览器访问平台时用的地址（IP 或域名）。一定要显式传入：不传时脚本会自己猜，多网卡、有 NAT 的机器上容易猜错，结果是控制台一切正常，但被测服务的录制一条都传不上来。传过一次后会保存在 `softprobe/.env` 里，以后不用再传。

3. 安装脚本依次完成：校验安装包、解压、没有 Docker 时离线安装 Docker、加载镜像、启动服务，最后等所有服务通过健康检查（最长 7 分钟）。成功时输出：

   ```text
   =========================================
    All services are up and healthy.
   =========================================

     Frontend (UI + agent download): http://10.0.0.5:8090
   ```

只有普通账号、没有 root 时，看 [免 root 部署](#rootless)。

## 验证 {#verify}

1. 在办公电脑的浏览器打开 `http://<平台服务器地址>:8090`，能看到控制台。
2. 在平台服务器上查看容器状态：

   ```bash
   docker ps --format 'table {{.Names}}\t{{.Status}}'
   ```

   `sp-allinone`、`sp-mongodb`、`sp-redis`、`sp-vector`、`sp-parquet-s3` 都在运行，除 `sp-parquet-s3` 外都显示 `(healthy)`。

3. 在被测应用服务器上确认能访问平台：

   ```bash
   curl -fsS -o /dev/null -w '%{http_code}\n' http://<平台服务器地址>:8090/api/agent/sp-agent.jar
   ```

   输出 `200` 说明网络策略第 1 条已经通了。

接下来 [接入 Java Agent](/zh/testing/java-agent)。

## 启动与停止 {#start-stop}

在 `softprobe/` 目录里：

```bash
COMPOSE_PROFILES=bundled docker compose -f docker-compose.yml down   # 停止全部服务，数据保留
./start.sh                                                           # 启动服务
```

::: warning 不要用 `./stop.sh` 停止
当前安装包里的 `./stop.sh` 只停得掉平台容器，数据库、缓存和日志组件会继续运行。请用上面的命令停止。
:::

安装包自带的 Docker 设置了开机自启，平台的容器也会随 Docker 自动重启：服务器重启后平台会自己起来，不需要手动执行 `./start.sh`。用上面的命令停掉的服务除外。

## 修改配置 {#configure}

配置写在 `softprobe/.env` 里，改完执行一次 `./start.sh` 生效。常用的几项：

| 配置 | 作用 |
|------|------|
| `PUBLIC_BACKEND_HOST` | 平台对外地址。平台服务器换了 IP 时改这里 |
| `SP_DISABLE_AI=1` | 不启动 AI 服务，节省内存。没有大模型服务的环境可以设置；控制台里的 AI 入口仍然显示，但用不了 |
| `SP_REPLAY_OPENAPI=true` | 打开回放触发接口，供流水线调用，见 [发版后自动回放](/zh/testing/webhook-and-ci)。这组接口不做身份校验，只在 8090 端口仅内网可达时打开 |
| `SP_MONGO_CACHE_GB`、`SP_MONGO_MEM_LIMIT` | 数据库缓存和内存上限，默认 2 GB 和 4 GB |
| `SP_REDIS_MAXMEMORY`、`SP_REDIS_MEM_LIMIT` | 缓存服务的数据上限和内存上限，默认 2 GB 和 3 GB。回放时用到的录制数据暂存在这里，回放量很大时要调大 |
| `SP_ALLINONE_MEM_LIMIT` | 平台容器（后端、控制台、AI 服务）的内存上限，默认 8 GB |

各项内存上限加起来超过物理内存时，上限就起不到隔离作用。机器内存小于 16 GB 时，按比例调小，或者关掉 AI 服务。

## 升级 {#upgrade}

1. 把新安装包放到**原安装包所在的目录**，也就是 `softprobe/` 的上一级目录。
2. 用同样的方式执行新安装包：

   ```bash
   cd /opt/softprobe
   sudo bash softprobe-linux-amd64-<新的打包时间>.sh
   ```

安装脚本发现已有 `softprobe/` 目录时按升级处理：镜像和脚本换成新版本；`docker-compose.yml`、`.env` 和证书目录 `ssl/` 保留原样；录制数据、控制台里的模型和 Git 账号配置都在 Docker 数据卷里，不受影响。升级后按 [验证](#verify) 检查一遍。

升级前建议先备份，见 [平台维护 — 备份与恢复](/zh/testing/installation/operations#backup)。

## 免 root 部署 {#rootless}

只有普通账号时，同样执行安装包，不用 `sudo`：

```bash
PUBLIC_BACKEND_HOST=10.0.0.5 bash softprobe-linux-amd64-<打包时间>.sh
```

没有 root、也用不了 Docker 时，安装脚本会自动改用免 root 部署：Docker 以当前账号的身份运行，不写 `/usr`、`/etc`，不注册系统服务，程序和数据都在这个账号的 home 目录下。这是 Docker 官方支持的 rootless 模式，整套平台只拥有这个账号的权限。

### 先自检 {#rootless-check}

免 root 部署对系统有几项要求，不满足时调整需要 root。安装前先自检，自检只读不改：

```bash
softprobe/rootless/sp-rootless-up.sh --check
```

安装包还没传到服务器时，可以先向 Softprobe 要单独的自检脚本 `sp-rootless-precheck-<架构>-<打包时间>.sh`（十几 KB），用 `bash sp-rootless-precheck-*.sh --check` 运行。

自检逐条输出 PASS 或 FAIL。主要检查：

| 要求 | 不满足时 |
|------|---------|
| 内核允许普通用户创建 user namespace（`max_user_namespaces` 大于 0） | 内核层面禁用时无法免 root 部署 |
| Ubuntu 23.10 及以上、Debian 12 及以上：AppArmor 没有限制非特权 user namespace | 需要 root 执行 `sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` |
| 已安装 `uidmap`（`newuidmap`、`newgidmap` 带 setuid） | 需要 root 安装 |
| `/etc/subuid`、`/etc/subgid` 给这个账号分配了至少 65536 个 ID | 需要 root 添加 |
| 最大打开文件数的硬上限不低于 64000 | 需要 root 修改 `/etc/security/limits.conf` |
| home 目录所在分区没有 `noexec` | 用 `SP_ROOTLESS_ROOT=/var/tmp/sp-rootless` 换一个目录 |
| 可用磁盘不少于 10 GB（`/dev/fuse` 不可用时 18 GB） | 清理或换盘 |
| 8090、8443 端口空闲 | 改端口映射，或释放端口 |

### 日常操作 {#rootless-ops}

免 root 部署的运行目录是 `~/.sp-rootless`，日常操作用这里的脚本：

```bash
source ~/.sp-rootless/sp-rootless-env.sh    # 让当前终端的 docker 命令连到这套 Docker
docker ps

~/.sp-rootless/sp-rootless-down.sh          # 停止服务，数据保留
~/.sp-rootless/sp-rootless-up.sh            # 启动服务
```

首次启动成功后，所需文件都已复制到 `~/.sp-rootless`，安装包和解压出的 `softprobe/` 目录可以删除。录制数据在 `~/.sp-rootless/data` 下，不要删。

配置文件是 `~/.sp-rootless/deploy/.env`，可配置项与 [修改配置](#configure) 相同（内存上限除外），改完执行一次 `~/.sp-rootless/sp-rootless-up.sh` 生效。

升级时先完全停止，再用同一个账号执行新安装包：

```bash
~/.sp-rootless/sp-rootless-down.sh --all    # 连 Docker 一起停
PUBLIC_BACKEND_HOST=10.0.0.5 bash softprobe-linux-amd64-<新的打包时间>.sh
```

录制数据和已导入的镜像都会保留。

### 退出登录与重启 {#rootless-linger}

免 root 部署没有系统服务，要注意两点：

- **退出登录**：账号的最后一个会话结束时，系统可能回收这个账号的运行目录，之后 `docker` 命令连不上。启动脚本会尝试为账号开启 linger（`loginctl enable-linger`）；开不了时会提示，这时请运维执行 `sudo loginctl enable-linger <账号>`，或保持一个 `tmux`、`screen` 会话。
- **服务器重启**：不会自动启动。开启 linger 后，加一条定时任务：

  ```bash
  (crontab -l 2>/dev/null; echo "@reboot $HOME/.sp-rootless/sp-rootless-up.sh >> $HOME/.sp-rootless/boot.log 2>&1") | crontab -
  ```

### 与 root 部署的区别 {#rootless-limits}

- 没有内存上限：`.env` 里的各项内存上限不生效。
- 网络经过用户态转发，性能低于 root 部署，不适合作为压测基准。
- 容器里的 AI 服务只能看到 `/home`，而且受这个账号的权限限制。

### 卸载 {#rootless-uninstall}

```bash
~/.sp-rootless/sp-rootless-down.sh --purge
```

按顺序删除数据卷、镜像、停止 Docker，再删除运行目录。**录制数据会一起删除，无法恢复。**

不要直接 `rm -rf ~/.sp-rootless`：容器里生成的部分文件属于映射出去的用户 ID，这个账号删不掉，而且会先删掉清理需要的程序。已经删了一半的，请运维用 `sudo rm -rf ~/.sp-rootless` 清理。

## 卸载 {#uninstall}

root 部署的卸载，在 `softprobe/` 目录里执行：

```bash
COMPOSE_PROFILES=bundled docker compose -f docker-compose.yml down -v   # 删除容器和数据卷
docker image rm sp-allinone:1.0 mongo:7.0 redis:7-alpine timberio/vector:0.56.0-debian rclone/rclone:1.68
```

**`down -v` 会删除全部录制数据，无法恢复。** 之后删除 `softprobe/` 目录和安装包。安装时自动装的 Docker 不会被卸载，不再需要时按你们的规范处理。

被测服务上的 Agent 要单独移除，见 [接入 Java Agent — 移除](/zh/testing/java-agent#remove)。
