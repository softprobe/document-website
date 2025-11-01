---
sidebar_position: 2
---

# 生产安装

将 SP-Istio Agent 部署到您的生产 Istio 服务网格中。

## 先决条件

在生产环境中安装 SP-Istio Agent 之前，请确保您拥有：

- 一个正在运行的 Kubernetes 集群
- 已安装并配置好 Istio
- 具有适当权限的 kubectl 访问权限
- 到 Softprobe 端点的网络连接

## 安装

使用生产就绪的清单文件安装 SP-Istio Agent：

```bash
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio/main/deploy/minimal.yaml
```

这将在您的 Istio 服务网格中全局部署 WasmPlugin。

## 验证安装

检查 WasmPlugin 是否已成功创建：

```bash
kubectl get wasmplugin -A
```

您应该会看到列出的 SP-Istio Agent 插件。

## 配置

默认配置会捕获网格中所有服务的 HTTP 流量。您可以通过修改 WasmPlugin 资源来自定义行为。

### 范围化部署

要仅将代理部署到特定的命名空间或工作负载，您可以创建一个范围化的 WasmPlugin 配置。请参阅 [部署指南](../deployment/deployment) 以获取详细的配置选项。

## 使用 Bookinfo 演示进行测试

要使用 Istio 的 Bookinfo 演示应用程序验证安装：

```bash
# 为默认命名空间启用 Istio 注入
kubectl label namespace default istio-injection=enabled --overwrite

# 部署 Bookinfo 应用程序
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/platform/kube/bookinfo.yaml

# 部署 Bookinfo 网关
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/networking/bookinfo-gateway.yaml

# 应用范围化的测试配置
kubectl apply -f https://raw.githubusercontent.com/softprobe/sp-istio-wasm/main/deploy/test-bookinfo.yaml
```

### 生成测试流量

```bash
# 获取入口网关 URL
export GATEWAY_URL=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# 生成一些流量
curl -sf "http://${GATEWAY_URL}/productpage" >/dev/null

# 验证插件是否正常工作
kubectl get wasmplugin -A
```

## 卸载

要从您的集群中移除 SP-Istio Agent：

```bash
kubectl delete wasmplugin -n istio-system sp-istio-agent
```

## 下一步

- [部署指南](./deployment) - 高级部署配置
- [故障排除](./troubleshooting) - 常见问题和解决方案
- [架构](./architecture) - 了解代理的工作原理
