---
title: 演示快速入门 (5分钟)
---

# Travel OTA 演示快速入门

通过预构建的 **Travel OTA** 演示应用，在 5 分钟内上手体验 Softprobe 录制与回放功能。本指南将指导您在本地使用 Java 运行该应用，并直接连接到您私有的 Softprobe 集群（通过 Helm 安装）。

## 前置条件

- 本地安装了 **Java 8 或更高版本**（推荐 Java 17/21）且在 `PATH` 中。
- 已安装 **sp CLI** (`curl -fsSL https://install.softprobe.ai | sh`)。
- 您的 **Softprobe Helm chart** 已安装并运行（`sp-boot` / 后端默认在端口 `8090` 或使用您配置的私有 URL）。

---

## 1. 安装 Java
确保本地 Java 已正确配置，并可在终端中使用：
```bash
java -version
```

## 2. 下载演示应用 JAR 包
Travel OTA (在线旅游代理) 演示项目是一个轻量级的 Spring Boot Web 应用。从 GitHub Release 下载预构建的 JAR 包：
```bash
curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar
```

## 3. 下载 Softprobe Agent 包
Java Agent 用于自动拦截并录制数据库和外部 HTTP 流量。您可以通过 `sp` CLI 快速下载：
```bash
sp agent download
```
这会将 `sp-agent.jar` 下载到本地共享目录。然后将其复制到您当前的工作目录中：
```bash
cp ~/.local/share/softprobe/agent/sp-agent.jar .
```
*(或者，您也可以直接从 GitHub 下载：`curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/sp-agent.jar`)*

## 4. 在 Softprobe 中创建应用
您需要在 Softprobe 中注册该应用，以获取一个唯一的 `appId`（一个 16 位的十六进制标识符）。

- **通过 Web 界面 (推荐)：**
  1. 打开您的 Softprobe Dashboard 控制台。
  2. 导航至 **Apps** 并点击 **Create App**。
  3. 输入 `travel-ota` 作为应用名称并点击保存。复制自动生成的 **App ID**。

- **通过 `sp` CLI：**
  ```bash
  export SP_API_URL=http://localhost:8090   # 指向您的 Helm/本地 sp-boot 服务
  sp app create travel-ota
  ```
  保存 JSON 响应中返回的 `appId`。

## 5. 启动附带 Agent 的 Travel OTA 应用
运行应用并加上 `-javaagent` 参数，并传入您的 `appId`：
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.storage.service.host=http://localhost:8090 \
     -Dsp.config.service.host=http://localhost:8090 \
     -jar travel-ota.jar
```
*(如果您的 Helm 部署后端服务在其他地址，请将 `http://localhost:8090` 替换为实际的后端地址)*。

应用现在已经在本地运行，可通过浏览器访问：[http://localhost:8080](http://localhost:8080)。

## 6. 进行一笔交易 (Shopping)
在浏览器中打开 [http://localhost:8080](http://localhost:8080)：
1. 点击 **Search** 浏览可用航班。
2. 选择任意航班，点击 **Book**。
3. 完成支付与结算流程 (Checkout)。

Softprobe Agent 会自动拦截并捕捉这一连串的调用流量。

## 7. 查看录制的数据
- **通过 Web 界面**：登录 Softprobe Dashboard 控制台，进入 **Workbench** (工作台) 或 **Recordings** 页面，选择 `travel-ota` 应用，即可直观地浏览刚刚捕获的调用链 (Trace) 及深层依赖。
- **通过 CLI**：
  ```bash
  sp record case list --app <your-app-id> --since -10m
  ```

## 8. 回放录制数据
回放功能会将录制的请求发送到目标环境以检测代码变更是否引起回归，并且会自动 Mock 外部依赖，您无需配置数据库或外部第三方服务。

- **通过 CLI**：
  ```bash
  sp replay run --app <your-app-id> --env http://localhost:8080
  ```
- **通过 Web 界面**：进入 **Replays** 页面，点击 **New Replay Plan**，选择 `travel-ota` 应用，设置目标环境为 `http://localhost:8080`，然后点击 **Run** 开始回放，并查看详细的比对报告。
