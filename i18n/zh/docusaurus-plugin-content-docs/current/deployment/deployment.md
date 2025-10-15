---
sidebar_position: 2
---

# 部署指南

将 SP-Istio Agent 部署到您的 Istio 服务网格的详细指南。

## 部署选项

SP-Istio Agent 可以在不同的范围内进行部署：

1.  **全局部署** - 应用于网格中的所有工作负载
2.  **命名空间范围** - 应用于特定的命名空间
3.  **工作负载范围** - 应用于特定的服务或部署

## 全局部署

对于生产环境，请在所有服务中全局部署代理：

```bash
kubectl apply -f deploy/sp-istio-agent.yaml
```

此清单包括：
- `istio-system` 命名空间中的 WasmPlugin 资源
- 用于 Softprobe 后端连接的 ServiceEntry
- 适当的 RBAC 配置

## 范围化部署

### 部署到特定命名空间

要将代理应用于特定命名空间，请在该命名空间中创建一个 WasmPlugin 资源：

```yaml
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: sp-istio-agent
  namespace: my-app-namespace
spec:
  selector:
    matchLabels:
      app: my-app
  url: oci://docker.io/softprobe/sp-istio-wasm:latest
  phase: AUTHN
```

### 使用 Bookinfo 进行测试 (范围化)

为了使用 Istio 的 Bookinfo 演示进行安全测试，请使用范围化的测试清单：

```bash
# 启用 Istio 注入
kubectl label namespace default istio-injection=enabled --overwrite

# 部署 Bookinfo
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/platform/kube/bookinfo.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.22/samples/bookinfo/networking/bookinfo-gateway.yaml

# 应用范围化的 SP-Istio Agent (仅针对 productpage)
kubectl apply -f deploy/test-bookinfo.yaml
```

生成流量并验证：

```bash
export GATEWAY_URL=$(kubectl -n istio-system get svc istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -sf "http://${GATEWAY_URL}/productpage" >/dev/null
kubectl get wasmplugin -A
```

## 配置文件

### deploy/sp-istio-agent.yaml

用于生产部署的全局 WasmPlugin 清单。包括：
- 全局范围 (应用于整个网格)
- OCI 镜像引用
- 用于 Softprobe 后端的 ServiceEntry
- 默认插件配置

### deploy/test-bookinfo.yaml

用于 Bookinfo 演示的范围化测试清单。包括：
- 特定于工作负载的选择器
- 用于外部连接的 ServiceEntry
- 特定于测试的配置

### test/envoy.yaml

用于开发测试的本地 Envoy 配置。与以下命令一起使用：
```bash
make integration-test
```

## 插件配置

WasmPlugin 资源接受以下配置参数：

```yaml
spec:
  phase: AUTHN              # 插件执行阶段
  priority: 10              # 执行优先级
  url: oci://...            # WASM 模块位置
  imagePullPolicy: Always   # 镜像拉取策略
  pluginConfig:             # 插件特定配置
    # 在此处添加自定义配置
```

## 网络要求

### 用于 Softprobe 的 ServiceEntry

代理需要连接到 Softprobe 后端：

```yaml
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: softprobe-external
  namespace: istio-system
spec:
  hosts:
    - o.softprobe.ai
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
```

确保您集群的出口策略允许连接到 `o.softprobe.ai`。

## 验证部署

### 检查 WasmPlugin 状态

```bash
kubectl get wasmplugin -A
```

### 检查 Envoy 配置

验证 WASM 模块是否已在 Envoy 中加载：

```bash
kubectl exec -n <namespace> <pod-name> -c istio-proxy -- curl localhost:15000/config_dump | grep sp-istio
```

### 查看日志

检查插件是否正在处理请求：

```bash
kubectl logs -n <namespace> <pod-name> -c istio-proxy | grep "SP"
```

## 回滚

要移除代理：

```bash
# 删除特定的 WasmPlugin
kubectl delete wasmplugin sp-istio-agent -n istio-system

# 或删除整个清单
kubectl delete -f deploy/sp-istio-agent.yaml
```

Envoy 将自动卸载 WASM 模块并恢复正常操作。

## 性能考虑

- **流式处理**：请求体以流式方式处理；响应在数据块到达时即被转发（无整体阻塞）
- **内存开销**：用于分析的可选缓冲会增加内存/CPU 使用率。对高流量服务应用大小上限和采样
- **异步存储**：异步存储可保持较低的尾部延迟；只有轻量级工作在热路径上进行
- **资源限制**：考虑为启用了代理的工作负载设置适当的资源限制

## 下一步

- [故障排除](./troubleshooting) - 常见的部署问题
- [架构](../architecture) - 了解请求流程
- [开发指南](./development) - 构建和自定义代理