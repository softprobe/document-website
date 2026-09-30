---
title: 接入 Java Agent
---

<script setup>
import { onMounted, ref } from 'vue'

const agentVersions = ref([])
const agentVersionError = ref('')

onMounted(async () => {
  try {
    const response = await fetch('https://install.softprobe.ai/artifacts/agent/versions.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = await response.json()
    agentVersions.value = Array.isArray(body.versions) ? body.versions : []
  } catch {
    agentVersionError.value = '版本列表暂时不可用。'
  }
})
</script>

# 接入 Java Agent

Softprobe Java Agent 是一个 jar 文件（`sp-agent.jar`），通过 `-javaagent` 参数随被测服务一起启动。录制时它记下入口请求和依赖调用，回放时它用录制结果应答依赖调用。接入不改业务代码，只改启动参数、重启一次服务。

::: info 不是网格 Agent
「业务观测」里基于 Istio/Envoy 的采集见 [平台 Agent 架构](/zh/platform/advanced-guides/agent-architecture)，与本页无关。
:::

## 前提 {#prerequisites}

- JDK 8、11、17 或 21。框架支持情况见 [支持的 Java 版本与框架](/zh/testing/supported-frameworks)。
- 被测服务所在机器能访问 Softprobe 后端（单机部署时是平台服务器的 `8090` 端口）。
- 为被测服务预留约 512 MB 内存，Agent 与服务共用 JVM 内存。
- 可以改启动参数、重启服务。生产环境请先按变更流程申请窗口。

## 获取 Agent {#download}

**私有化部署**：平台自带 Agent，在被测应用服务器上直接下载：

```bash
curl -fL -o sp-agent.jar http://<平台地址>:8090/api/agent/sp-agent.jar
```

也可以在控制台「应用管理 → 接入新应用」的向导里下载。

**能访问互联网时**，也可以从 Softprobe 官网下载：

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

`latest` 始终指向最新版本。在生产环境使用时，把 `latest` 换成具体版本号固定下来：

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

可用版本：

<ul v-if="agentVersions.length">
  <li v-for="version in agentVersions" :key="version">
    <a :href="`https://install.softprobe.ai/artifacts/agent/${version}/sp-agent.jar`">{{ version }}</a>
  </li>
</ul>
<p v-else-if="agentVersionError">{{ agentVersionError }}</p>
<p v-else>正在加载版本列表……</p>

脚本里获取同一份列表：`curl -fsSL https://install.softprobe.ai/artifacts/agent/versions.json`。

## 启动参数 {#startup-command}

在服务的启动命令里加上：

```bash
java \
  -javaagent:/opt/softprobe/sp-agent.jar \
  -Dsp.app.id=order-service \
  -Dsp.api.url=http://10.0.0.5:8090 \
  -jar order-service.jar
```

| 参数 | 说明 |
|------|------|
| `-javaagent` | `sp-agent.jar` 的路径 |
| `-Dsp.app.id` | 应用 ID。取一个固定的名字，同一个服务的所有实例、录制环境和回放环境都用同一个。后端没见过的 ID 会在 Agent 第一次拉取配置时自动注册，见 [应用、用例与回放编号](/zh/testing/agents/concepts#application-appid) |
| `-Dsp.api.url` | 后端地址，必须带 `http://` 或 `https://`。录制、回放、日志上报都用它 |

后端地址按这个顺序查找：`-Dsp.api.url`、环境变量 `SP_API_URL`、jar 包里内置的 `sp.api.url`。都找不到时，Agent 报告启动失败，不录制、不回放，服务照常运行。请始终显式设置 `-Dsp.api.url`。

::: details 旧参数 sp.api.service.host
Agent 源码里已经加入了旧参数兼容：没有设置 `-Dsp.api.url` 和 `SP_API_URL` 时，把旧的启动参数 `-Dsp.api.service.host` 转换成 `sp.api.url`。这项改动截至 4.3.36 还没有发布，请使用 `sp.api.url`。
:::

### JDK 17、21 {#jdk17}

JDK 16 起默认禁止反射访问 JDK 内部类，JDK 17、21 要再加下面这组参数。JDK 8 不需要；JDK 11 不加也能运行，只会打印告警。

```bash
--add-opens java.base/java.lang=ALL-UNNAMED
--add-opens java.base/java.lang.reflect=ALL-UNNAMED
--add-opens java.base/java.util=ALL-UNNAMED
--add-opens java.base/java.util.concurrent=ALL-UNNAMED
--add-opens java.base/java.math=ALL-UNNAMED
--add-opens java.base/java.net=ALL-UNNAMED
--add-opens java.base/java.time=ALL-UNNAMED
--add-opens java.base/sun.net.util=ALL-UNNAMED
--add-opens java.base/jdk.internal.loader=ALL-UNNAMED
--add-opens java.xml/com.sun.org.apache.xerces.internal.jaxp.datatype=ALL-UNNAMED
```

少了 `java.lang` 那一条，Agent 启动时会直接报错；少了其他几条，服务照常启动，但部分录制、回放能力会失效而且没有提示（例如回放时下游 HTTP 调用的状态码不对、部分集合类型序列化失败）。请整组加上。

### Tomcat 等应用服务器 {#app-server}

把上面的参数加到应用服务器的 JVM 参数里，例如 Tomcat 的 `bin/setenv.sh`：

```bash
CATALINA_OPTS="$CATALINA_OPTS -javaagent:/opt/softprobe/sp-agent.jar -Dsp.app.id=order-service -Dsp.api.url=http://10.0.0.5:8090"
```

WebLogic、东方通等按各自的方式配置 JVM 参数。也可以用环境变量 `JAVA_TOOL_OPTIONS`，但它会作用于这台机器上所有的 Java 进程，注意不要影响无关的程序。

### 容器与 Kubernetes {#container}

把 `sp-agent.jar` 放进镜像或挂载进容器，用 `JAVA_TOOL_OPTIONS` 或启动命令传参数：

```yaml
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-javaagent:/opt/softprobe/sp-agent.jar -Dsp.app.id=order-service -Dsp.api.url=http://10.0.0.5:8090"
```

## 确认接入成功 {#verify}

1. 服务启动日志里有 `[Softprobe]` 开头的行，没有报错。
2. 控制台「应用管理」里出现这个应用，状态为「Agent 在线」。也可以用命令行查：`sp app status order-service --json`，返回 `online`。
3. 给服务发几个请求。默认每个接口大约每分钟录 1 条，等一两分钟后打开「录制 → 滚动录制」，能看到对应接口的录制。
4. 打开一条录制，调用链里除了入口，还有数据库、缓存、下游接口等依赖调用。缺了某类调用，见 [查看录制 — 没录到？](/zh/testing/recording#troubleshooting)。

「应用管理」里的状态：

| 状态 | 含义 |
|------|------|
| Agent 在线 | 至少一个实例在 60 秒内发过心跳 |
| 限流中 | 实例在线，但至少一个实例处于限流或降级状态，见 [对线上服务的保护](#production-safety) |
| Agent 已离线 | 有实例记录，但都超过 60 秒没有心跳 |
| 未接入 | 当前没有实例记录。实例记录在最后一次心跳约 3 分钟后过期，Agent 停掉很久的应用也显示为未接入 |

## 环境标签 {#environment-tags}

多个环境共用一个应用 ID 时，给各环境的实例打上标签：

```bash
-Dsp.tags.env=prod
```

每个 `-Dsp.tags.<键>=<值>` 加一个标签，可以加多个（例如再加 `-Dsp.tags.region=east`）。录制会带上这些标签，在「录制配置」里可以按标签给不同环境设不同的采样规则，新建回放计划时可以按标签筛选用例。不要自己设置 `sp.mocker.tags`：Agent 根据 `sp.tags.*` 生成它，会覆盖你设的值。

## 回放环境的 Agent {#replay-side-agent}

接收回放请求的测试环境实例，也要挂同一个 Agent，使用相同的应用 ID：回放时由它用录制结果应答依赖调用。回放环境的录制请关掉或调到很低，避免把回放请求又录一遍。

## 移除 Agent {#remove}

1. 去掉启动参数里的 `-javaagent`、`-Dsp.*` 和为 Agent 加的 `--add-opens`，重启服务。服务回到接入前的状态。
2. 删除 `sp-agent.jar`、它所在目录下的 `logs` 目录，以及系统临时目录下的 `sp` 目录。

Agent 不修改服务的任何文件，也不在服务器上留下常驻进程。

## 对线上服务的保护 {#production-safety}

录制数据由后台线程上报，业务请求不等待网络。上报跟不上或后端出问题时，Agent 会少录、降速，而不是拖住请求。

### 录制队列满时 {#queue-overflow}

1. 录制数据先进入一个有上限的内存环形缓冲区：默认 2048 个槽位，最多放 2047 批数据（一批是交给上报线程的一组录制调用）。可以用 `-Dsp.buffer.size` 调大；设置值小于 2048 时，仍按 2048 分配。
2. 缓冲区满时，新的一批直接丢弃，对应的用例标记为无效，Agent 进入**快速拒绝**状态：新录制一律丢弃，只保留约每秒一次的探测。
3. 30 秒后退出快速拒绝状态，以较低的速率继续录制。
4. 5 分钟后检查一次，之后每 10 分钟检查一次：上报是否跟得上。这段时间里没有数据排队，或者被拒绝的批次少于 3 批、且至少 99% 的批次排队不超过 3 秒，就算跟得上，恢复配置的速率；否则再降一次。

每次降速：取每个接口当前的速率，超过每分钟 20 次的按 20 算，再乘以 80%，最低每分钟 0.03 次（约 33 分钟一次）。例如每分钟 100 次会降到 16 次。

队列满时，Agent 直接丢弃当前这一批，不等待队列腾出空间。

### 后端出问题时 {#storage-health}

1. 上报录制数据连续失败 10 次，或 10 秒内上报至少 30 次且其中超过 80% 失败，Agent 进入快速拒绝状态。
2. 5 秒后降低采样速率，3 分钟后检查一次，之后每 10 分钟检查一次，每次仍未恢复就再降一次，直到后端恢复。
3. Agent 从后端拉不到配置时，停止录制，直到配置重新拉取成功。

所在机器 CPU 或内存占用过高时，Agent 同样会进入快速拒绝状态并降低速率，直到占用回落。

## 高级参数 {#advanced}

### 与其他 Agent 共存 {#coexistence}

与 OpenTelemetry 等其他 `-javaagent` 冲突时，让 Softprobe 跳过它们的类：

```bash
-Dsp.ignore.type.prefixes=io.opentelemetry
-Dsp.ignore.classloader.prefixes=io.opentelemetry
```

多个前缀用英文逗号分隔。

### 调试日志 {#debug}

```bash
-Dsp.enable.debug=true
```

排查完请去掉，调试日志量很大。

### 日志直接发给 Vector {#vector}

默认情况下，Agent 的日志经后端（`{sp.api.url}/v1/logs`）转给日志管道，不需要单独配置。要绕过后端直接发给 Vector 时：

```bash
-Dsp.otel.exporter.otlp.log.endpoint=http://<vector-host>:4320/v1/logs
```

它不能代替 `-Dsp.api.url`：没有后端地址时 Agent 仍然不会启动。

### 按执行路径去重 {#execution-path-dedup}

默认情况下，同一接口的录制按采样保留，内容重复的请求也会各录一条。开启按执行路径去重后，Agent 记录每个请求在指定包范围内实际走过的方法和分支，后端在同一应用、同一接口下，每条不同的执行路径只保留一条用例：之后走相同路径的请求被丢弃，走了新路径的保留下来。

两个参数同时设置才会开启：

```bash
-Dsp.dedup.enabled=true
-Dsp.coverage.packages=com.example.orders,com.example.payments
```

- `sp.dedup.enabled`：开关，默认 `false`。
- `sp.coverage.packages`：要记录执行路径的业务代码包前缀，多个用英文逗号分隔。为空时不开启。

判断重复看的是执行路径，不是请求内容：输入不同但走了相同路径的请求会被当作重复；输入相同但走了不同分支的会分别保留。带 `sp-force-record` 的请求不参与去重。参数在 JVM 启动时读取，修改后要重启服务。

### jar 内置配置 {#agent-conf}

jar 包里的 `META-INF/sp/sp.agent.conf` 可以内置后端地址：

```properties
sp.api.url=http://10.0.0.5:8090
```

优先级低于 `-Dsp.api.url` 和环境变量 `SP_API_URL`。

## 下一步 {#next}

- [查看录制](/zh/testing/recording)
- [第一次录制回放](/zh/testing/getting-started)
