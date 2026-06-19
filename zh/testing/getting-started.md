---
title: 接入您的应用
---

# 接入您的应用

在通过预构建的 Travel OTA 演示项目上手体验了录制回放之后，您已经做好了准备，可以将 Softprobe 接入您自己的 Java 应用程序中了。本指南将指导您将任何 JVM 服务接入 Softprobe。

## 前置条件

- 应用程序主机上安装了 **Java 8 或更高版本**（推荐 Java 17/21）。
- 已安装 **sp CLI** (`curl -fsSL https://install.softprobe.ai | sh`)。
- 您的 **Softprobe Helm chart** 已部署并运行（Softprobe 后端服务可用，例如：`http://<您的后端主机地址>:8090`）。

---

## 1. 注册您的应用 (获取应用 ID)
每个接入 Softprobe 的应用都需要在系统中注册，以生成一个唯一的 `appId`（16 位十六进制标识符）。

- **通过 Web 界面：**
  1. 打开您的 Softprobe 控制台。
  2. 导航至 **Apps** → 点击 **Create App**。
  3. 输入您的服务名称，然后点击保存。
  4. 记录生成的 **App ID**。

- **通过 `sp` CLI：**
  ```bash
  export SP_API_URL=http://<您的后端主机地址>:8090   # 指向您的 Helm 部署后端
  sp app create <您的应用名称>
  ```
  保存 JSON 响应中返回的 `appId`。

## 2. 声明您的策略 (YAML)
Softprobe 使用简单、声明式的 YAML 配置文件来控制在回放过程中需要录制、Mock 和对比的内容。

在您的项目目录下创建以下文件：

- **`recording.yaml`** (定义需要捕获的入口和外部依赖范围)：
  ```yaml
  # 录制范围配置
  excludePaths:
    - /health
    - /metrics
  includePaths:
    - /api/**
  ```
- **`mock.yaml`** (定义需要 Mock 的下游调用目录)：
  ```yaml
  # Mock 行为配置
  mockCategories:
    - HttpClient
    - Database
    - Redis
  ```

使用 `sp` CLI 应用这些策略：
```bash
sp policy recording apply -f recording.yaml --json
sp policy mock apply -f mock.yaml --json
```

## 3. 挂载 Softprobe Agent
为了能够拦截流量，您需要在应用启动时使用 JVM `-javaagent` 参数挂载 Softprobe Java Agent。

1. 如果本地还没有 `sp-agent.jar`，请执行以下命令下载：
   ```bash
   sp agent download
   cp ~/.local/share/softprobe/agent/sp-agent.jar .
   ```
2. 加上以下系统属性启动您的应用程序 JVM：
   ```bash
   java -javaagent:sp-agent.jar \
        -Dsp.app.id=<您的应用ID> \
        -Dsp.storage.service.host=http://<您的后端主机地址>:8090 \
        -Dsp.config.service.host=http://<您的后端主机地址>:8090 \
        -jar your-application.jar
   ```

请将 `<您的应用ID>` 替换为 16 位的 App ID，并将 `<您的后端主机地址>:8090` 替换为部署的 Helm 后端服务地址。

## 4. 开始录制流量
当您的应用程序挂载了 Agent 并成功启动后：
1. 在控制台或通过 CLI 验证 Agent 是否已上线：
   ```bash
   sp app status <您的应用ID> --json
   # 预期输出: "status": "online"
   ```
2. 向您的应用接口发送一些测试流量（例如：`curl http://localhost:8080/api/users`）。
3. 验证录制的用例是否已成功保存：
   ```bash
   sp record case list --app <您的应用ID> --since -10m
   ```

## 5. 执行回放与验证
要执行回归测试，只需将录制的入口请求发回至您的测试实例（会自动启用外部依赖的 Mock）：

```bash
sp replay run --app <您的应用ID> --env http://localhost:8080
```
*(请将 `http://localhost:8080` 替换为您的测试/QA 环境中运行的应用实例地址)*。

您可以在 Web 控制台的 **Replays** 页面实时监控回放进度并查看可视化的差异对比报告，或者通过 CLI 查看：
```bash
sp replay status <回放计划ID> --watch
```
