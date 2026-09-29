---
title: 第一次录制回放
---

# 第一次录制回放

在已经部署好的 SoftProbe 上，把一个 Java 服务接进来，录几条请求，在测试环境回放一次，看懂报告。全程在控制台操作，每一步也给出了对应的 `sp` 命令。

::: tip 选择操作方式
下面每张卡片顶部可以切换「控制台」和「命令行」。站点会记住你的选择。
:::

## 准备 {#prerequisites}

- **SoftProbe 控制台地址**和**后端地址**。单机部署（All-in-One）时两者都是平台服务器的 `8090` 端口，例如 `http://10.0.0.5:8090`。还没有部署平台，先看 [部署后端](/zh/testing/installation/server)。
- **一个可以重启的 Java 服务**，JDK 8、11、17 或 21，最好在测试环境。支持的框架见 [支持的 Java 版本与框架](/zh/testing/supported-frameworks)。
- 服务所在机器能访问后端地址；后端能访问这个服务的业务端口（回放时要把请求发给它）。

## 1. 接入服务 {#attach}

先拿到 `sp-agent.jar`：

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

在控制台左下角打开「应用管理」，点「接入新应用」，在向导里下载 `sp-agent.jar`。也可以在服务所在的机器上直接从控制台下载：

```bash
curl -fL -o sp-agent.jar http://<控制台地址>/api/agent/sp-agent.jar
```

</Interface>
<Interface id="cli">

```bash
sp agent download --out-dir ./ --json
```

或按 [接入 Java Agent — 下载](/zh/testing/java-agent#download) 获取固定版本。

</Interface>
</InterfaceTabs>

然后在服务的启动命令里加上三个参数，重启服务：

```bash
java -javaagent:/path/to/sp-agent.jar \
     -Dsp.app.id=order-service \
     -Dsp.api.url=http://<后端地址>:8090 \
     -jar order-service.jar
```

- `sp.app.id` 是这个服务在 SoftProbe 里的应用 ID，取一个固定的名字即可；第一次启动时会自动注册。同一个服务的所有实例用同一个 ID。
- `sp.api.url` 是后端地址，必须带 `http://` 或 `https://`。

Tomcat、Docker、Kubernetes 等部署方式的写法见 [接入 Java Agent](/zh/testing/java-agent)。

服务启动后，回到「应用管理」，列表里出现 `order-service`，状态为「Agent 在线」，就接好了。

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

![应用管理里出现已接入的应用](/img/docs/testing/zh/apps-connected.png)

</Interface>
<Interface id="cli">

```bash
sp app status order-service --json
```

`data.status` 为 `online` 即可。

</Interface>
</InterfaceTabs>

## 2. 录几条请求 {#record}

照常调用这个服务的接口，发几笔业务请求就行。默认每个接口大约每分钟录 1 条，所以多发几次、等一两分钟。

在顶部选中 `order-service`，打开左侧「录制 → 滚动录制」。列表按接口汇总录制条数；点一个接口，可以看到每一条录制；再点「查看 trace 录制详情」，能看到这次请求调用了哪些数据库、缓存和下游接口。

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

![滚动录制：按接口汇总的录制](/img/docs/testing/zh/recording-overview.png)

</Interface>
<Interface id="cli">

```bash
sp record case list --app order-service --since -1h --json
```

</Interface>
</InterfaceTabs>

录制怎么看、为什么没录到，见 [查看录制](/zh/testing/recording)。

## 3. 在测试环境回放 {#replay}

在测试环境启动**改过代码的新版本**，同样挂上 Agent、用同一个 `sp.app.id`。记下它的地址，例如 `order-service.test:8080`。

::: warning 回放目标用测试环境
回放会把录下的请求真实发给目标服务。请指向测试环境，不要指向生产。
:::

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. 打开「回放 → 执行记录」，点「立即回放」。
2. 「目标环境（targetEnv）」选 `http://`，填 `order-service.test:8080`。
3. 「回放范围」保持「全量接口」，「录制起始时间」选「近 24 小时」。
4. 点「创建计划」。执行记录里会出现这次回放，状态从「执行中」变为结果。

![新建回放计划](/img/docs/testing/zh/new-plan.png)

</Interface>
<Interface id="cli">

```bash
sp replay run --app order-service --env http://order-service.test:8080 --from -24h --json
sp replay status <planId> --watch --json
```

</Interface>
</InterfaceTabs>

## 4. 看回放报告 {#report}

在「执行记录」里点开这次回放。报告第一行给出结论，下面把没通过的用例按原因分成「代码改动引起的差异」「原因未查明」「无效」三类。先处理「代码改动引起的差异」：确认改动是不是预期的。

报告怎么读，见 [回放报告](/zh/testing/replay-report)；逐条看差异、排除噪音，见 [审查差异](/zh/testing/review-diffs-in-the-web-ui)。

## 接下来 {#next}

- [查看录制](/zh/testing/recording)：录制列表、调用链，以及没录到时怎么查
- [固化用例](/zh/testing/pinned-cases)：把重要的录制长期保留下来，反复回放
- [发起回放与定时回放](/zh/testing/replay-and-diff)：回放范围、速率，以及每天自动回放
- [录制配置与回放配置](/zh/testing/policies)：调采样率、决定哪些依赖用录制结果应答

::: details 没有自己的服务？用演示应用试一试
装好 [`sp` 命令行](/zh/testing/installation/) 后，`sp demo` 会在本机用 Docker 启动一个挂好 Agent 的演示应用（Travel OTA），发一些请求并回放：

```bash
sp demo start --watch
sp demo traffic
sp demo replay --watch
```

后端是 SoftProbe Cloud、演示应用跑在本机时，另开一个终端运行 [`sp tunnel`](/zh/testing/commands/tunnel)。命令说明见 [sp demo](/zh/testing/commands/demo)。
:::
