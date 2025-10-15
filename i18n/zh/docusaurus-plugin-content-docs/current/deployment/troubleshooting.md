---
sidebar_position: 3
---

# 故障排除

SP-Istio Agent 的常见问题和解决方案。

## WASM 加载问题

### 问题：WASM 模块未加载

**症状：**
- WasmPlugin 资源存在但未生效
- 没有来自 SP-Istio Agent 的日志
- 请求未被捕获

**解决方案：**

1. 检查 Envoy 日志中与 WASM 相关的错误：
```bash
kubectl logs <pod-name> -c istio-proxy | grep -i wasm
```

2. 验证 WasmPlugin 资源是否已创建：
```bash
kubectl get wasmplugin -A
kubectl describe wasmplugin sp-istio-agent -n istio-system
```

3. 检查 Envoy 是否可以拉取 WASM 模块：
```bash
kubectl logs <pod-name> -c istio-proxy | grep -i "wasm.*download"
```

### 问题：SHA256 哈希不匹配

**症状：**
- Envoy 日志显示哈希验证失败
- WASM 模块重复重新下载

**解决方案：**

验证二进制文件和配置之间的 SHA256 哈希是否匹配：

```bash
# 计算本地哈希
shasum -a 256 target/wasm32-unknown-unknown/release/sp_istio_agent.wasm

# 与配置进行比较
kubectl get wasmplugin sp-istio-agent -n istio-system -o yaml | grep sha256
```

如果哈希不匹配，请更新 WasmPlugin 清单。

## 代理未捕获流量

### 问题：Softprobe 仪表板中没有数据

**症状：**
- 代理似乎正在运行
- Softprobe 仪表板中没有追踪或会话
- Envoy 日志没有显示错误

**解决方案：**

1.  **启用调试日志**，通过向您的工作负载添加注解：

```yaml
annotations:
  # 取消注释以启用 WASM 调试日志
  sidecar.istio.io/componentLogLevel: "wasm:debug"
```

2.  **重新启动 pod** 以应用注解：
```bash
kubectl rollout restart deployment/<your-deployment>
```

3.  **检查扩展日志** 中是否有 SP 特定的消息：
```bash
kubectl logs <pod-name> -c istio-proxy | grep "SP"
```

4.  **验证 Softprobe 端点连接性**：
```bash
kubectl exec <pod-name> -c istio-proxy -- curl -v https://o.softprobe.ai
```

5.  **检查 ServiceEntry 配置**：
```bash
kubectl get serviceentry -A
```

确保存在 `o.softprobe.ai` 的 ServiceEntry。

## 网络连接问题

### 问题：无法访问 Softprobe 后端

**症状：**
- 日志显示连接超时或连接被拒绝
- 提及 `o.softprobe.ai` 的错误消息

**解决方案：**

1.  **验证 DNS 解析**：
```bash
kubectl exec <pod-name> -c istio-proxy -- nslookup o.softprobe.ai
```

2.  **检查出口策略**：
```bash
kubectl get serviceentry -A
kubectl get virtualservice -A | grep softprobe
```

3.  **测试连接性**：
```bash
kubectl exec <pod-name> -c istio-proxy -- curl -v https://o.softprobe.ai/health
```

4.  **审查网络策略**：
```bash
kubectl get networkpolicy -A
```

确保策略允许出口到外部 HTTPS 端点。

## 性能问题

### 问题：安装代理后延迟增加

**症状：**
- 响应时间增加
- Envoy sidecar 中的 CPU 使用率高

**解决方案：**

1.  **检查资源限制**：
```bash
kubectl top pod <pod-name>
```

2.  **审查缓冲配置** - 大的响应体可能会导致内存压力。考虑：
    -   为高流量端点实施采样
    -   为请求体捕获设置大小上限
    -   使用无缓冲的流模式

3.  **启用性能分析** 以识别瓶颈：
```bash
kubectl exec <pod-name> -c istio-proxy -- curl localhost:15000/stats/prometheus | grep wasm
```

4.  **调整 sidecar 的资源限制**：
```yaml
annotations:
  sidecar.istio.io/proxyCPU: "500m"
  sidecar.istio.io/proxyMemory: "512Mi"
```

## 配置问题

### 问题：插件未应用于特定工作负载

**症状：**
- 全局插件对某些服务有效，但对其他服务无效
- 网格中行为不一致

**解决方案：**

1.  **验证选择器匹配**：
```bash
kubectl get wasmplugin sp-istio-agent -o yaml
```

检查选择器是否与您的工作负载标签匹配。

2.  **检查 Istio 注入**：
```bash
kubectl get namespace <namespace> -o yaml | grep istio-injection
```

确保命名空间已启用 Istio 注入。

3.  **验证 pod 是否有 sidecar**：
```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].name}'
```

应包含 `istio-proxy`。

4.  **检查 Envoy 配置**：
```bash
kubectl exec <pod-name> -c istio-proxy -- pilot-agent request GET config_dump | grep wasm
```

## 调试技巧

### 启用详细日志

将此注解添加到您的部署以获取详细日志：

```yaml
metadata:
  annotations:
    sidecar.istio.io/componentLogLevel: "wasm:debug,http:debug"
```

### 查看实时日志

使用过滤跟踪日志：

```bash
kubectl logs -f <pod-name> -c istio-proxy | grep -E "SP|wasm|error"
```

### 检查请求/响应流

使用 Envoy 管理界面：

```bash
kubectl exec <pod-name> -c istio-proxy -- curl localhost:15000/stats | grep sp_istio
```

### 验证 WASM 二进制文件

确保二进制文件有效：

```bash
wasm-validate target/wasm32-unknown-unknown/release/sp_istio_agent.wasm
```

## 获取帮助

如果您仍然遇到问题：

1. 收集诊断信息：
   - WasmPlugin YAML: `kubectl get wasmplugin -A -o yaml`
   - Envoy 日志: `kubectl logs <pod-name> -c istio-proxy`
   - Pod 描述: `kubectl describe pod <pod-name>`

2. 查看 [GitHub Issues](https://github.com/softprobe/sp-istio-wasm/issues)

3. 联系 Softprobe 支持并提供您的诊断信息

## 下一步

- [架构](../architecture) - 了解代理的工作原理
- [开发指南](./development) - 调试和自定义代理