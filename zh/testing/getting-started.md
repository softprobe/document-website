---
title: 快速开始
---

# SoftProbe 测试快速开始

欢迎使用 SoftProbe 测试！本指南将指导您在数分钟内运行预构建的 Travel OTA 演示项目以掌握录制与回放的完整流程，并在页面底部提供将您自己的 Java 服务接入 SoftProbe 的极简指南。

::: tip 选择你的操作界面
下方涉及注册应用、查看录制、回放的步骤，都可以在**网页控制台**或 **`sp` 命令**里完成。用每个卡片顶部的切换选一种——你的选择会记住，并在整个文档站点保持一致。
:::

---

## 前置条件

- 本地安装了 **Java 8 或更高版本**（推荐 Java 17/21）且已配置到 `PATH` 环境变量中。
- 已安装 **`sp` 命令** (`curl -fsSL https://install.softprobe.ai/install.sh | bash`)——详见 [安装 CLI](/zh/testing/installation/)。
- 您的 **SoftProbe Helm chart** 已安装并运行（SoftProbe 后端服务可用，例如：`http://<您的后端主机地址>:8090`）——还没部署的话按 [服务端（Helm）](/zh/testing/installation/server) 先装好。

---

## 1. 验证 Java 安装
确保本地 Java 已正确配置，并可在终端中使用：
```bash
java -version
```

## 2. 下载演示应用 JAR 包
下载预构建的 [Travel OTA](https://github.com/softprobe/demo-ota) 应用程序 JAR 包（您可以 [点击下载 travel-ota.jar](https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar) 直接通过浏览器下载，也可以运行下方命令）：
```bash
curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar
```

## 3. 下载 SoftProbe Agent 包
下载 SoftProbe Java Agent 软件包（您可以 [点击下载 sp-agent.jar](https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar) 直接通过浏览器下载，也可以运行下方命令）：
```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```
固定版本的下载地址见 [接入 Java Agent — 下载](/zh/testing/java-agent#download)。

## 4. 注册应用程序
在系统中注册该应用，以获取一个唯一的 `appId`（一个 16 位的十六进制标识符）：

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. 打开您的 SoftProbe Dashboard 控制台。
2. 导航至 **Apps** 并点击 **Create App**。
3. 输入 `travel-ota` 作为应用名称并点击 **Save**。
4. 复制自动生成的 **App ID**。

</Interface>
<Interface id="cli">

在终端中运行以下命令以注册应用：

```bash
export SP_API_URL=http://localhost:8090   # 指向您的 Helm/本地后端
sp app create travel-ota
```

保存 JSON 响应中返回的 `appId`。

</Interface>
</InterfaceTabs>

## 5. 启动附带 Agent 的应用
运行应用并加上 `-javaagent` 参数，并传入您的 `appId`：
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<您的应用ID> \
     -Dsp.api.url=http://localhost:8090 \
     -jar travel-ota.jar
```
*(如果您的 Helm 部署后端服务在其他地址，请将 `http://localhost:8090` 替换为实际的后端地址)*。

应用现在已经在本地运行，可通过浏览器访问：[http://localhost:8080](http://localhost:8080)。

## 6. 进行一笔交易 (产生录制流量)
在浏览器中打开 [http://localhost:8080](http://localhost:8080)：
1. 点击 **Search** 浏览可用航班。
2. 选择任意航班，点击 **Book**。
3. 完成支付与结算流程 (Checkout)。

SoftProbe Agent 会自动拦截并捕捉这一连串的调用流量。

## 7. 查看录制的数据

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. 登录 SoftProbe Dashboard 控制台。
2. 进入 **Workbench** (工作台) 或 **Recordings** 页面。
3. 从应用下拉菜单中选择 `travel-ota`。
4. 直观地浏览刚刚捕获的调用链 (Trace) 及深层依赖关系。

![查看录制数据操作演示](/img/docs/testing/zh/view-recorded-data.gif)

</Interface>
<Interface id="cli">

列出过去 10 分钟内为该应用录制的所有用例：

```bash
sp record case list --app <您的应用ID> --since -10m
```

</Interface>
</InterfaceTabs>

## 8. 回放录制数据
回放功能会将录制的请求发送到目标环境以检测代码变更是否引起回归，并且会自动 Mock 外部依赖，您无需配置数据库或外部第三方服务。

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. 进入 **Replays** 页面，点击 **New Replay Plan**。
2. 选择 `travel-ota` 应用。
3. 选择要回放的测试用例。
4. 设置目标环境为 `http://localhost:8080` 并点击 **Run**。

![回放录制数据操作演示](/img/docs/testing/zh/replay-recordings.gif)

</Interface>
<Interface id="cli">

在终端中发起回放计划指向您本地运行的实例：

```bash
sp replay run --app <您的应用ID> --env http://localhost:8080
```

实时监控并查看回放进度直到执行完毕：

```bash
sp replay status <回放计划ID> --watch
```

</Interface>
</InterfaceTabs>

---

## 接入您自己的应用

接入您自己的应用程序与运行 Travel OTA 演示项目**完全相同**！您的应用也只是另外一个由相同的 SoftProbe Java Agent 和您的自定义应用 ID 启动的 `.jar` 软件包。

接入步骤十分简单：

1. **注册应用**：在 Web 控制台的 **Apps** → **Create App** 中，或者在命令行中运行以下命令，注册您的服务以获取全新的 16 位 App ID：
   ```bash
   sp app create <您的应用名称>
   ```
2. **挂载 Agent**：使用相同的 `-javaagent` 参数启动您自己的 JVM 服务，传入新的 App ID 和 Helm 部署的后端地址：
   ```bash
   java -javaagent:sp-agent.jar \
        -Dsp.app.id=<您的应用ID> \
        -Dsp.api.url=http://<您的后端主机地址>:8090 \
        -jar your-own-application.jar
   ```
3. **录制与回放**：就像运行演示应用一样，正常发起测试流量，然后列出录制用例并随时发起回放。

## 下一步：核心流程

演示跑通后，按**核心流程**的 5 步接入你自己的应用：

1. **[录制流量](/zh/testing/recording)** — 在生产/预发采集真实用例，建起回归用例库
2. **[回放与对比](/zh/testing/replay-and-diff)** — 每次发版前跑一次回归
3. **[回放报告](/zh/testing/replay-report)** — 查看回放结论和差异原因
4. **[审查差异](/zh/testing/review-diffs-in-the-web-ui)** — 看懂失败用例，接受不是 bug 的差异
5. **[配置对比规则](/zh/testing/compare-rules-web-ui)** — 为每次都会变化的字段配置忽略规则，避免误报

更深入的配置见 [Java Agent 配置](/zh/testing/java-agent)（JVM 参数、Tomcat/Docker）与 [策略概览](/zh/testing/policies)（声明式 YAML，进 CI/GitOps）。
