---
sidebar_position: 1
---

# 开发指南

了解如何构建、测试和开发 SP-Istio Agent WASM 扩展。

## 先决条件

确保您已安装以下工具：

- **Rust 工具链** 及 `wasm32-unknown-unknown` 目标
- **Protocol Buffers 编译器** (`protobuf-compiler`)
- **kubectl** 和 **Istio** (用于部署测试)

### 安装开发工具

#### 安装 Rust WASM 目标

```bash
rustup target add wasm32-unknown-unknown
```

#### 安装 Protocol Buffers 编译器

在 Debian/Ubuntu 上：
```bash
sudo apt-get install protobuf-compiler
```

在 macOS 上：
```bash
brew install protobuf
```

## 构建 WASM 扩展

为生产构建 WASM 二进制文件：

```bash
make build
```

此命令将：
- 为 `wasm32-unknown-unknown` 目标构建 WASM 二进制文件
- 计算 SHA256 哈希
- 显示更新 Istio 配置的命令

## 本地测试

### 使用 Envoy 和 Docker 进行测试

使用本地 Envoy 实例运行集成测试：

```bash
make integration-test
```

这将：
- 验证 WASM 二进制文件
- 启动本地 Envoy 代理实例
- 测试扩展功能
- 显示相关日志以进行调试

## 在 Istio 中测试 (Kind 集群)

### 设置测试集群

使用 Makefile 创建一个完整的测试环境：

```bash
# 创建集群，构建并加载本地镜像，部署插件和演示应用
make dev-quickstart

# 在单独的终端中，将演示暴露在 http://localhost:8080
make forward

# 检查状态
make status
kubectl get wasmplugin -n istio-system
```

此设置：
- 在本地创建 Kind 集群
- 构建 WASM 模块
- 将 Docker 镜像直接加载到 Kind 中（无需注册表）
- 部署插件和演示应用程序

### 清理测试集群

```bash
make cluster-down
```

## 热重载开发工作流

为了在不重新创建集群的情况下进行快速迭代：

```bash
make dev-reload
```

`dev-reload` 命令：
1. 构建 `target/wasm32-unknown-unknown/release/sp_istio_agent.wasm`
2. 将其复制到 `istio-system` 命名空间中的 `sp-wasm-http` pod
3. 使用缓存清除查询参数修补 WasmPlugin `spec.url`
4. 强制 Envoy 在不重启 pod 的情况下重新获取模块

此工作流通过让您在几秒钟内测试更改，显著加快了开发速度。

## 项目结构

```
.
├── src/                    # Rust 源代码
├── deploy/                 # Kubernetes 清单
│   ├── sp-istio-agent.yaml    # 全局 WasmPlugin 清单
│   └── test-bookinfo.yaml     # 范围化测试清单
├── test/                   # 测试配置
│   └── envoy.yaml             # 本地 Envoy 测试配置
├── examples/               # 演示应用程序
├── scripts/                # 辅助脚本
└── Makefile               # 构建和部署自动化
```

## 构建自定义功能

SP-Istio Agent 是用 Rust 构建的，并使用 Proxy-Wasm SDK。要修改的关键文件：

- `src/lib.rs` - 主要插件逻辑
- `src/http.rs` - HTTP 请求/响应处理
- `src/config.rs` - 插件配置

进行更改后，使用 `make build` 重新构建，并使用热重载工作流进行测试。

## 调试

### 启用调试日志

要查看来自 WASM 扩展的详细日志，请将注解添加到您的 pod：

```yaml
annotations:
  sidecar.istio.io/componentLogLevel: "wasm:debug"
```

### 查看扩展日志

检查 Envoy 代理日志中是否有 SP-Istio Agent 的消息：

```bash
kubectl logs <pod-name> -c istio-proxy | grep "SP"
```

## 下一步

- [架构](../architecture) - 了解内部工作原理
- [CI/CD 流水线](../cicd/) - 自动化测试和发布