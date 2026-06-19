---
title: 快速开始
---

# Softprobe 测试快速开始

欢迎使用 Softprobe 测试！本指南将指导您通过以下两个阶段，在一篇文档中快速掌握录制与回放的完整流程：

1. **阶段 1：运行 5 分钟演示** — 在本地运行预构建的 Travel OTA 演示应用，体验极速上手。
2. **阶段 2：接入您自己的应用** — 按照标准清单，逐步将您自己的 Java 服务接入 Softprobe。

---

## 前置条件

- 本地安装了 **Java 8 或更高版本**（推荐 Java 17/21）且已配置到 `PATH` 环境变量中。
- 已安装 **sp CLI** (`curl -fsSL https://install.softprobe.ai | sh`)。
- 您的 **Softprobe Helm chart** 已安装并运行（Softprobe 后端服务可用，例如：`http://<您的后端主机地址>:8090`）。

---

## 阶段 1：运行 5 分钟演示

通过在本地运行预构建的 **Travel OTA**（在线旅游代理）演示应用并捕获真实流量，快速体验 Softprobe 录制与回放功能。

### 1. 验证 Java 安装
确保本地 Java 已正确配置，并可在终端中使用：
```bash
java -version
```

### 2. 下载演示应用 JAR 包
从 GitHub Release 下载预构建的 Travel OTA 应用程序 JAR 包：
```bash
curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar
```

### 3. 下载 Softprobe Agent 包
通过 CLI 快速下载 Java Agent 包，并将其复制到您当前的工作目录中：
```bash
sp agent download
cp ~/.local/share/softprobe/agent/sp-agent.jar .
```
*(或者，您也可以直接从 GitHub 下载：`curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/sp-agent.jar`)*

### 4. 在 Softprobe 中创建应用
在系统中注册该应用，以获取一个唯一的 `appId`（一个 16 位的十六进制标识符）。

- **通过 Web 界面：**
  1. 打开您的 Softprobe Dashboard 控制台。
  2. 导航至 **Apps** 并点击 **Create App**。
  3. 输入 `travel-ota` 作为应用名称并点击保存。复制自动生成的 **App ID**。

- **通过 `sp` CLI：**
  ```bash
  export SP_API_URL=http://localhost:8090   # 指向您的 Helm/本地后端
  sp app create travel-ota
  ```
  保存 JSON 响应中返回的 `appId`。

### 5. 启动附带 Agent 的 Travel OTA 应用
运行应用并加上 `-javaagent` 参数，并传入您的 `appId`：
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<您的应用ID> \
     -Dsp.storage.service.host=http://localhost:8090 \
     -Dsp.config.service.host=http://localhost:8090 \
     -jar travel-ota.jar
```
*(如果您的 Helm 部署后端服务在其他地址，请将 `http://localhost:8090` 替换为实际的后端地址)*。

应用现在已经在本地运行，可通过浏览器访问：[http://localhost:8080](http://localhost:8080)。

### 6. 进行一笔交易 (产生录制流量)
在浏览器中打开 [http://localhost:8080](http://localhost:8080)：
1. 点击 **Search** 浏览可用航班。
2. 选择任意航班，点击 **Book**。
3. 完成支付与结算流程 (Checkout)。

Softprobe Agent 会自动拦截并捕捉这一连串的调用流量。

### 7. 查看录制的数据
- **通过 Web 界面**：登录 Softprobe Dashboard 控制台，进入 **Workbench** (工作台) 或 **Recordings** 页面，选择 `travel-ota` 应用，即可直观地浏览刚刚捕获的调用链 (Trace) 及深层依赖。
- **通过 CLI**：
  ```bash
  sp record case list --app <您的应用ID> --since -10m
  ```

### 8. 回放录制数据
回放功能会将录制的请求发送到目标环境以检测代码变更是否引起回归，并且会自动 Mock 外部依赖，您无需配置数据库或外部第三方服务。

- **通过 CLI**：
  ```bash
  sp replay run --app <您的应用ID> --env http://localhost:8080
  ```
- **通过 Web 界面**：进入 **Replays** 页面，点击 **New Replay Plan**，选择 `travel-ota` 应用，设置目标环境为 `http://localhost:8080`，然后点击 **Run** 开始回放。

---

## 阶段 2：接入您自己的应用

既然您已经亲自上手并体验了录制与回放的完整闭环，接下来只需按照以下步骤将您自己的 Java 服务接入 Softprobe 即可。

### 1. 注册您的应用程序
在控制台或通过 CLI 注册您的应用，以生成其唯一的 `appId`：
```bash
sp app create <您的应用名称>
```

### 2. 声明您的策略 (YAML)
Softprobe 使用简单、声明式的 YAML 配置文件来控制在回放过程中需要录制、Mock 和对比的内容。在您的项目目录下创建以下两个文件：

- **`recording.yaml`** (定义需要捕获的入口和外部依赖范围)：
  ```yaml
  excludePaths:
    - /health
    - /metrics
  includePaths:
    - /api/**
  ```
- **`mock.yaml`** (定义需要 Mock 的下游调用目录)：
  ```yaml
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

### 3. 将 Agent 挂载至您的服务
加上系统属性启动您的应用程序 JVM：
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<您的应用ID> \
     -Dsp.storage.service.host=http://<您的后端主机地址>:8090 \
     -Dsp.config.service.host=http://<您的后端主机地址>:8090 \
     -jar your-application.jar
```

请将 `<您的应用ID>` 替换为 16 位的 App ID，并将 `<您的后端主机地址>:8090` 替换为部署的 Helm 后端服务地址。

### 4. 验证并产生录制流量
1. 验证 Agent 是否已上线：
   ```bash
   sp app status <您的应用ID> --json
   # 预期输出: "status": "online"
   ```
2. 向您的应用接口发送一些测试或生产流量。
3. 验证录制的用例是否已成功保存：
   ```bash
   sp record case list --app <您的应用ID> --since -10m
   ```

### 5. 执行回放与验证
运行回归测试，将录制的入口请求发回至您的测试实例：
```bash
sp replay run --app <您的应用ID> --env http://localhost:8080
```
您可以在 Web 控制台的 **Replays** 页面实时监控回放进度并查看差异报告，或者通过 CLI 查看：
```bash
sp replay status <回放计划ID> --watch
```
