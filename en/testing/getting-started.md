---
title: Your first record and replay
---

# Your first record and replay

On a SoftProbe that's already deployed: attach a Java service, record a few requests, replay them once in a test environment, and read the report. Everything is done in the console; each step also shows the matching `sp` command.

::: tip Pick how you work
Each card below has a switch at the top between the console and the command line. The site remembers your choice.
:::

## Before you start {#prerequisites}

- The **console URL** and the **backend URL**. On a single-server (All-in-One) deployment both are port `8090` of the platform server, for example `http://10.0.0.5:8090`. No platform yet? See [Deploy the backend](/en/testing/installation/server).
- **A Java service you can restart**, on JDK 8, 11, 17 or 21, preferably in a test environment. Supported frameworks: [Supported frameworks](/en/testing/supported-frameworks).
- The service's host can reach the backend, and the backend can reach the service's business port (replay sends requests to it).

## 1. Attach the service {#attach}

First get `sp-agent.jar`:

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

In the console, open **Applications** (bottom left), click **Connect new application**, and download `sp-agent.jar` from the wizard. Or download it from the console on the service's host:

```bash
curl -fL -o sp-agent.jar http://<console-host>/api/agent/sp-agent.jar
```

</Interface>
<Interface id="cli">

```bash
sp agent download --out-dir ./ --json
```

Or get a fixed version as described in [Attach the Java agent — download](/en/testing/java-agent#download).

</Interface>
</InterfaceTabs>

Then add three flags to the service's start command and restart it:

```bash
java -javaagent:/path/to/sp-agent.jar \
     -Dsp.app.id=order-service \
     -Dsp.api.url=http://<backend-host>:8090 \
     -jar order-service.jar
```

- `sp.app.id` is the service's application ID in SoftProbe. Pick a stable name; it's registered on first start. All instances of one service use the same ID.
- `sp.api.url` is the backend URL and must include `http://` or `https://`.

Tomcat, Docker, Kubernetes and other setups: [Attach the Java agent](/en/testing/java-agent).

Once the service is up, go back to **Applications**. When `order-service` is listed as **Agent online**, it's attached.

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

![The attached application in Applications](/img/docs/testing/en/apps-connected.png)

</Interface>
<Interface id="cli">

```bash
sp app status order-service --json
```

`data.status` should be `online`.

</Interface>
</InterfaceTabs>

## 2. Record a few requests {#record}

Call the service's endpoints as you normally would; a few business requests are enough. By default each endpoint records about one request per minute, so send a few and wait a minute or two.

Select `order-service` at the top and open **Recordings → Rolling recordings**. The list sums recordings per endpoint; click an endpoint to see each recording, then **View trace recording** to see which databases, caches and downstream endpoints the request called.

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

![Rolling recordings, summed per endpoint](/img/docs/testing/en/recording-overview.png)

</Interface>
<Interface id="cli">

```bash
sp record case list --app order-service --since -1h --json
```

</Interface>
</InterfaceTabs>

Reading recordings, and what to check when nothing is recorded: [Recordings](/en/testing/recording).

## 3. Replay in a test environment {#replay}

Start the **changed version** in a test environment, also with the agent and the same `sp.app.id`. Note its address, for example `order-service.test:8080`.

::: warning Replay against test, not production
Replay really sends the recorded requests to the target service. Point it at a test environment.
:::

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Open **Replay plans → Run records** and click **Run replay now**.
2. Under **Target environment (targetEnv)**, pick `http://` and enter `order-service.test:8080`.
3. Leave **Replay scope** on **All endpoints**, and set **Recording from** to **Last 24 hours**.
4. Click **Create plan**. The run appears in Run records and goes from **Running** to its result.

![New replay plan](/img/docs/testing/en/new-plan.png)

</Interface>
<Interface id="cli">

```bash
sp replay run --app order-service --env http://order-service.test:8080 --from -24h --json
sp replay status <planId> --watch --json
```

</Interface>
</InterfaceTabs>

## 4. Read the replay report {#report}

Open the run from Run records. The first line of the report is the verdict; below it, cases that didn't pass are grouped by cause: differences caused by code changes, cause not established, and invalid. Start with the code-change group and confirm whether each change was intended.

How to read the report: [Replay report](/en/testing/replay-report). Going through differences one by one and removing noise: [Review differences](/en/testing/review-diffs-in-the-web-ui).

## Next {#next}

- [Recordings](/en/testing/recording): the recording list, call chains, and what to check when nothing is recorded
- [Pinned cases](/en/testing/pinned-cases): keep important recordings and replay them again and again
- [Run and schedule replays](/en/testing/replay-and-diff): replay scope, rate, and a nightly replay
- [Recording and replay settings](/en/testing/policies): sampling, and which dependencies are answered from the recording

::: details No service of your own? Try the demo app
With the [`sp` command line](/en/testing/installation/) installed, `sp demo` starts a demo app (Travel OTA) with the agent attached in Docker on your machine, sends it some traffic and replays it:

```bash
sp demo start --watch
sp demo traffic
sp demo replay --watch
```

If the backend is SoftProbe Cloud and the demo app runs on your machine, run [`sp tunnel`](/en/testing/commands/tunnel) in another terminal. Command reference: [sp demo](/en/testing/commands/demo).
:::
