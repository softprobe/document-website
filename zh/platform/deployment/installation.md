
# Istio WASM 插件安装

将 SP-Istio Agent 部署到您的生产 Istio 服务网格中。

::: tip 查找用户安装？
Softprobe 服务端安装（Helm sp-backend）、客户端安装（`sp setup`、Spcode Service）、`sp code`、`sp doctor` 与 `sp upgrade` 位于 [测试安装](/zh/testing/installation/)。本平台页面仅面向 Istio 网格 / SESSIFY 部署。
:::

::: tip 下一步：在 Dashboard 查看 Context View
部署 SP‑Istio Agent 并初始化 SESSIFY 后，先在应用中产生一些流量，然后：

1. 打开 Softprobe 仪表盘 → Context View
2. 选择与部署相匹配的时间范围与环境（env）
3. 如有需要可按 serviceName 过滤；也可用 userId/sessionId/request_body_hash 搜索定位会话
4. 点击会话查看端到端图谱、span、客户端指标与交互事件

无需改动服务端代码即可获得完整上下文可视化。
:::

<div class="sp-hero-buttons">
  <a class="button button--primary" href="/zh/platform/production/dashboard-user-guide">仪表盘指南</a>
  <a class="button button--secondary" href="/zh/platform/getting-started/account-setup">账号设置</a>
  <a class="button button--secondary" href="/zh/platform/support/faq">常见问题</a>
</div>

<div class="sp-img">
  <img src="/img/docs/context-view.png" alt="Context View 会话图谱" />
  <p class="sp-caption">安装完成后即可在 Context View 中探索端到端会话图谱。</p>
</div>

## 先决条件

在生产环境中安装 SP-Istio Agent 之前，请确保您拥有：

- 一个正在运行的 Kubernetes 集群
- 已安装并配置好 Istio
- 具有适当权限的 kubectl 访问权限
- 到 Softprobe 端点的网络连接

## 安装

使用您在 [账户设置](../getting-started/account-setup) 阶段下载的个性化 `minimal.yaml` 文件安装 SP-Istio Agent。此文件包含您唯一的 API 密钥和预配置设置。

```bash
# 确保您使用的是从 Softprobe 控制台下载的 minimal.yaml 文件
kubectl apply -f minimal.yaml
```

这将在您的 Istio 服务网格中全局部署 WasmPlugin。

::: tip 前端 SESSIFY（可选但推荐）
若要在浏览器侧采集性能与用户行为数据，请在应用前端安装 Softprobe SESSIFY。详见 [前端插件安装](/zh/platform/sessify)。
:::

## 验证安装

检查 WasmPlugin 是否已成功创建：

```bash
kubectl get wasmplugin -A
```

您应该会看到列出的 SP-Istio Agent 插件。

## 配置

默认配置会捕获网格中所有服务的 HTTP 流量。您可以通过修改 WasmPlugin 资源来自定义行为。

## 前端可观测性与会话关联（sessionId）

若要实现从浏览器到后端的全链路追踪，请在应用前端集成 Softprobe SESSIFY。SDK 会在每个浏览器标签页初始化时自动生成并复用唯一的 sessionId：

- 同一标签页内的页面跳转与交互会复用同一个 sessionId，使一次用户访问能够完整串联。
- 打开新的标签页或窗口会生成新的 sessionId；关闭标签页或重新初始化后，会话也会随之重置。
- 所有上报的前端事件、性能指标与网络请求都会携带该 sessionId，便于与后端链路数据进行关联，形成端到端视图。

安装并在应用入口初始化：

```bash
npm install @softprobe/sessify
```

```jsx
// app/layout.tsx 或你的应用入口文件
'use client'
import { useEffect } from 'react';
import { initSessify } from '@softprobe/sessify';

export default function RootLayout({ children }) {
  useEffect(() => {
    // 使用默认配置初始化会话管理
    initSessify({});
  }, []);

  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
```

框架专属示例（React/Vue/Next.js）与进阶用法见完整的 [SESSIFY 集成](/zh/platform/sessify)。

最佳实践：
- 在前端将 sessionId 通过请求头（例如 `X-Session-Id`）或 Tracing Context 传递到后端；
- 在后端采集与日志中记录该标识，或在可观测性系统中进行关联，以提升排障与定位效率。

参考文档：
- [前端插件安装](/zh/platform/sessify)
- [配置指南](/zh/platform/configuration/config)

### 范围化部署

要仅将代理部署到特定的命名空间或工作负载，您可以创建一个范围化的 WasmPlugin 配置。请参阅 [配置指南](/zh/platform/configuration/config) 以获取详细的配置选项。

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
kubectl apply -f https://raw.githubusercontent.com/softprobe/softprobe/main/deploy/test-bookinfo.yaml
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
