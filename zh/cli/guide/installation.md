# 安装

## 一行安装（`sp`、Java Agent 与 `spcode`）

```bash
curl -fsSL https://install.softprobe.ai | bash
```

安装脚本会将 `sp` 和 `spcode` 放到 `~/.local/share/softprobe/bin`，将 `sp-agent.jar` 放到 `~/.local/share/softprobe/agent`，并在 `~/.local/bin` 创建二进制符号链接；同时写入 `~/.config/softprobe/config.jsonc`，默认 `api_url` 为 `https://api.softprobe.ai`。

可选参数（写在 `bash -s --` 之后）：

```bash
curl -fsSL https://install.softprobe.ai | bash -s -- --version latest --api-url https://api.softprobe.ai
curl -fsSL https://install.softprobe.ai | bash -s -- --product sp      # 仅安装 sp CLI
curl -fsSL https://install.softprobe.ai | bash -s -- --product agent   # 仅安装 Java Agent
```

`install.softprobe.ai` 由 `deployment-k8s` 仓库中的 Cloudflare Worker（`cloudflare/install-worker/`）提供，反向代理公开安装产物，避免浏览器或 `curl | bash` 被重定向到 GCS 裸链。

### 验证

```bash
sp version
sp health --json    # 需要 sp-boot 已运行（若已实现）
```

## 仅安装 `sp` 二进制

按版本发布的独立包路径：

```text
https://install.softprobe.ai/artifacts/sp/<version>/sp-{os}-{arch}
```

支持平台：`linux/amd64`、`linux/arm64`、`darwin/amd64`、`darwin/arm64`、`windows/amd64`。

手动安装示例（Linux amd64）：

```bash
curl -fsSL -o sp "https://install.softprobe.ai/artifacts/sp/<version>/sp-linux-amd64"
chmod +x sp
sudo mv sp /usr/local/bin/
sp version
```

将 `<version>` 替换为实际发布版本；企业内网可能使用相同目录结构的镜像地址。

## 后端与配置

支持 **Softprobe 云（SaaS）** 与 **自建 / 企业版** 两种模式。

### Softprobe 云（SaaS）

- 无需本地后端，API 默认指向 `https://api.softprobe.ai`。
- 执行 `sp auth login` 即可初始化配置目录并保存令牌。

### 自建 / 企业版

- 确保 **sp-boot** 可达（常见为同网 `http://127.0.0.1:8090`）。
- 执行 `sp auth login` 并选择 **Self-Hosted** 配置 API 地址；内网环境可能无需令牌。

```bash
curl -s http://127.0.0.1:8090/vi/health
```

### 手动初始化配置

```bash
sp config init
# 创建 ~/.config/softprobe/config.jsonc 与 ~/.config/softprobe/sp.jsonc
```

详见 [配置](./configuration.md)。

## Spcode Service（Linux，可选）

在 Linux 上，`sp setup` 可可选安装 **Spcode Service** — systemd 单元，以 root 运行团队 Web UI（`spcode serve --hostname 0.0.0.0`）。详见 [sp setup](/zh/cli/commands/setup.md)。

```bash
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
systemctl status spcode-web.service
```

默认端口 **4096**。服务配置位于 `/root/.config/softprobe/`，与个人配置独立。升级 `sp`/`spcode` 后若服务异常，请执行 `systemctl restart spcode-web.service` 并查看 `journalctl -u spcode-web`。

## `spcode` AI 引擎 CLI

已包含在上方 [一行安装](#一行安装sp--spcode) 中。若对接 **自建** SoftProbe Web UI 的本地 AI，请使用对应主机上的安装脚本（`curl <host>/spcode/install | bash`）。

命令与配置见 [spcode CLI 指南](./spcode.md)。

## 维护者

在 `backend` 仓库发布更多平台：

```bash
./scripts/manual-publish-install.sh latest darwin-arm64 linux-arm64 linux-x64
```

产物上传到 `gs://softprobe-published-files/artifacts/<product>/<version>/`。仅当修改 `cloudflare/install-worker/` 时需重新部署 Worker：

```bash
cd deployment-k8s/cloudflare/install-worker && wrangler deploy
```
