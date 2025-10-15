---
sidebar_position: 1
---

# 快速入门

在几分钟内使用本地的 Kind Kubernetes 集群开始使用 SP-Istio Agent。

## 先决条件

- **操作系统**: macOS (或带有 Docker 的 Linux)
- **所需工具**:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - [Kind](https://kind.sigs.k8s.io/) - `brew install kind`
  - [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/) - `brew install kubectl`
  - [Istio CLI](https://istio.io/latest/docs/setup/getting-started/#download) - `brew install istioctl`

### 一次性安装所有工具

```bash
brew install kind kubectl istioctl
```

## 第 1 步：设置带有 Istio 的 Kind 集群

创建一个 Kind 集群并安装带有 OpenTelemetry Operator 的 Istio：

```bash
curl -L https://raw.githubusercontent.com/softprobe/sp-istio-wasm/refs/heads/main/scripts/cluster-setup.sh | sh
```

该脚本将：
- 使用 Kind 创建一个本地 Kubernetes 集群
- 安装 Istio 服务网格
- 安装 OpenTelemetry Operator 用于遥测数据收集

## 第 2 步：安装 Travel 演示

部署带有 SP-Istio Agent 的演示应用程序：

```bash
# 安装 Softprobe Istio WASM 插件
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio-wasm/refs/heads/main/deploy/minimal.yaml

# 安装演示应用
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio-wasm/refs/heads/main/examples/travel/apps.yaml

# 暴露演示
sleep 10 && kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80
```

## 第 3 步：试用演示

1. 在浏览器中打开 [`http://localhost:8080/`](http://localhost:8080/)
2. 选择一 **对** 城市
3. 搜索航班
4. 使用任何测试信息完成预订
5. 使用虚假信息处理付款

## 第 4 步：在 Softprobe 仪表板中查看结果

在产生一些流量后：

1. 前往 [Softprobe 仪表板](https://dashboard.softprobe.ai)
2. 在左侧导航菜单中导航到 **Travel View**
3. 探索捕获的请求和业务级追踪

### 演示视频

https://github.com/user-attachments/assets/dc8c68db-dd8b-4da8-a6e2-346adf6ecffb

## 清理

完成演示后，清理 Kind 集群：

```bash
kind delete cluster --name sp-demo-cluster
```

## 下一步

- [生产安装](./installation) - 部署到您的生产集群
- [开发指南](../deployment/development) - 了解如何构建和修改代理
- [架构](../architecture) - 了解其内部工作原理