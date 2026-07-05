---
title: 快速开始
---

<script setup>
import { ref } from 'vue'
const dAppTab = ref('ui')
const dViewTab = ref('ui')
const dReplayTab = ref('cli')
</script>

# Softprobe 测试快速开始

欢迎使用 Softprobe 测试！本指南将指导您在数分钟内运行预构建的 Travel OTA 演示项目以掌握录制与回放的完整流程，并在页面底部提供将您自己的 Java 服务接入 Softprobe 的极简指南。

---

## 前置条件

- 本地安装了 **Java 8 或更高版本**（推荐 Java 17/21）且已配置到 `PATH` 环境变量中。
- 已安装 **`sp` 命令** (`curl -fsSL https://install.softprobe.ai/install.sh | bash`)。
- 您的 **Softprobe Helm chart** 已安装并运行（Softprobe 后端服务可用，例如：`http://<您的后端主机地址>:8090`）。

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

## 3. 下载 Softprobe Agent 包
下载 Softprobe Java Agent 软件包（您可以 [点击下载 sp-agent.jar](https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar) 直接通过浏览器下载，也可以运行下方命令）：
```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```
更多不可变发布版本见 [下载 Java Agent](/zh/testing/download-java-agent)。

## 4. 注册应用程序
在系统中注册该应用，以获取一个唯一的 `appId`（一个 16 位的十六进制标识符）：

<div class="tabs-container">
  <div class="tabs-nav">
    <button :class="{ active: dAppTab === 'ui' }" @click="dAppTab = 'ui'">网页控制台 (Web UI)</button>
    <button :class="{ active: dAppTab === 'cli' }" @click="dAppTab = 'cli'">sp 命令</button>
  </div>
  <div class="tabs-content">
    <div v-if="dAppTab === 'ui'">
      <ol>
        <li>打开您的 Softprobe Dashboard 控制台。</li>
        <li>导航至 <strong>Apps</strong> 并点击 <strong>Create App</strong>。</li>
        <li>输入 <code>travel-ota</code> 作为应用名称并点击 <strong>Save</strong>。</li>
        <li>复制自动生成的 <strong>App ID</strong>。</li>
      </ol>
    </div>
    <div v-if="dAppTab === 'cli'">
      <p>在终端中运行以下命令以注册应用：</p>
      <pre><code>export SP_API_URL=http://localhost:8090   # 指向您的 Helm/本地后端
sp app create travel-ota</code></pre>
      <p>保存 JSON 响应中返回的 <code>appId</code>。</p>
    </div>
  </div>
</div>

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

Softprobe Agent 会自动拦截并捕捉这一连串的调用流量。

## 7. 查看录制的数据

<div class="tabs-container">
  <div class="tabs-nav">
    <button :class="{ active: dViewTab === 'ui' }" @click="dViewTab = 'ui'">网页控制台 (Web UI)</button>
    <button :class="{ active: dViewTab === 'cli' }" @click="dViewTab = 'cli'">sp 命令</button>
  </div>
  <div class="tabs-content">
    <div v-if="dViewTab === 'ui'">
      <ol>
        <li>登录 Softprobe Dashboard 控制台。</li>
        <li>进入 <strong>Workbench</strong> (工作台) 或 <strong>Recordings</strong> 页面。</li>
        <li>从应用下拉菜单中选择 <code>travel-ota</code>。</li>
        <li>直观地浏览刚刚捕获的调用链 (Trace) 及深层依赖关系。</li>
      </ol>
    </div>
    <div v-if="dViewTab === 'cli'">
      <p>列出过去 10 分钟内为该应用录制的所有用例：</p>
      <pre><code>sp record case list --app &lt;您的应用ID&gt; --since -10m</code></pre>
    </div>
  </div>
</div>

## 8. 回放录制数据
回放功能会将录制的请求发送到目标环境以检测代码变更是否引起回归，并且会自动 Mock 外部依赖，您无需配置数据库或外部第三方服务。

<div class="tabs-container">
  <div class="tabs-nav">
    <button :class="{ active: dReplayTab === 'ui' }" @click="dReplayTab = 'ui'">网页控制台 (Web UI)</button>
    <button :class="{ active: dReplayTab === 'cli' }" @click="dReplayTab = 'cli'">sp 命令</button>
  </div>
  <div class="tabs-content">
    <div v-if="dReplayTab === 'ui'">
      <ol>
        <li>进入 <strong>Replays</strong> 页面，点击 <strong>New Replay Plan</strong>。</li>
        <li>选择 <code>travel-ota</code> 应用。</li>
        <li>选择要回放的测试用例。</li>
        <li>设置目标环境为 <code>http://localhost:8080</code> 并点击 <strong>Run</strong>。</li>
      </ol>
    </div>
    <div v-if="dReplayTab === 'cli'">
      <p>在终端中发起回放计划指向您本地运行的实例：</p>
      <pre><code>sp replay run --app &lt;您的应用ID&gt; --env http://localhost:8080</code></pre>
      <p>实时监控并查看回放进度直到执行完毕：</p>
      <pre><code>sp replay status &lt;回放计划ID&gt; --watch</code></pre>
    </div>
  </div>
</div>

---

## 接入您自己的应用

接入您自己的应用程序与运行 Travel OTA 演示项目**完全相同**！您的应用也只是另外一个由相同的 Softprobe Java Agent 和您的自定义应用 ID 启动的 `.jar` 软件包。

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

如果您需要更高级的配置（如环境标识 tags）、策略 YAML 定义（录制、Mock 和对比规则）或生产部署拓扑等，请参阅我们为您准备的深度指南：
* [Java Agent 配置](/zh/testing/java-agent) — JVM 参数及 Tomcat/Docker 配置
* [如何录制流量](/zh/testing/recording) — 构建高覆盖率的回归测试用例库
* [回放与对比](/zh/testing/replay-and-diff) — 自定义差异比对、排除噪声字段等参数
* [策略概览](/zh/testing/policies) — 用于流水线的声明式 YAML 策略配置

<style scoped>
.tabs-container {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.tabs-nav {
  display: flex;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 0 4px;
}
.tabs-nav button {
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  outline: none;
}
.tabs-nav button:hover {
  color: var(--vp-c-text-1);
}
.tabs-nav button.active {
  color: var(--sp-brand);
  border-bottom-color: var(--sp-brand);
}
.tabs-content {
  padding: 20px;
  background: var(--vp-c-bg);
}
.tabs-content ol, .tabs-content ul {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-left: 20px;
}
.tabs-content p {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}
.tabs-content pre {
  margin-top: 4px !important;
  margin-bottom: 12px !important;
}
</style>
