---
title: Getting Started
---

# Getting Started with Softprobe Testing

Welcome to Softprobe Testing! This guide provides a single, cohesive path to get you started with record-and-replay in minutes using our pre-built Travel OTA demo application, followed by a quick wrapup on how to connect your own Java service.

::: tip Pick your interface
The steps below for registering an app, viewing recordings, and replaying can all be done in the **Web console** or with the **`sp` command**. Use the switch at the top of each card to choose one — your choice is remembered and stays consistent across the whole docs site.
:::

---

## Prerequisites

- **Java 8 or higher** (Java 17/21 recommended) installed and on your `PATH`.
- **`sp` command** installed (`curl -fsSL https://install.softprobe.ai/install.sh | bash`) — see [Install the CLI](/en/testing/installation/).
- Your **Softprobe Helm chart** is deployed and running (with the Softprobe backend available, e.g. at `http://<your-backend-host>:8090`) — not deployed yet? Follow [Server (Helm)](/en/testing/installation/server) first.

---

## 1. Verify Java Installation
Ensure Java is configured correctly and available in your terminal:
```bash
java -version
```

## 2. Download the Demo Application
Download the pre-built [Travel OTA](https://github.com/softprobe/demo-ota) application JAR (either [click to download travel-ota.jar](https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar) directly via your browser, or run the command below):
```bash
curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar
```

## 3. Download the Softprobe Agent
Download the Softprobe Java agent JAR (either [click to download sp-agent.jar](https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar) directly via your browser, or run the command below):
```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```
See [Download Java agent](/en/testing/download-java-agent) for immutable release versions.

## 4. Register the Application
Register the demo application in Softprobe to receive a unique `appId` (a 16-character hex identifier):

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Open your Softprobe Dashboard.
2. Navigate to **Apps** and click **Create App**.
3. Enter `travel-ota` as the name and click **Save**.
4. Copy the generated **App ID**.

</Interface>
<Interface id="cli">

Run the following command to register the app with `sp`:

```bash
export SP_API_URL=http://localhost:8090   # Point to your Helm/local backend
sp app create travel-ota
```

Save the `appId` returned in the JSON response.

</Interface>
</InterfaceTabs>

## 5. Start the Application with the Agent
Start the demo app with the `-javaagent` flag, passing your `appId`:
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.api.url=http://localhost:8090 \
     -jar travel-ota.jar
```
*(If your Helm backend is hosted at another address, replace `http://localhost:8090` with your actual backend URL).*

The application is now running locally at [http://localhost:8080](http://localhost:8080).

## 6. Perform a Booking (Generate Traffic)
Open [http://localhost:8080](http://localhost:8080) in your browser:
1. Click **Search** to view available flights.
2. Select a flight and click **Book**.
3. Complete the checkout/payment process.

The Softprobe agent automatically intercepts and captures this entire transaction.

## 7. View Recorded Data

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Log in to your Softprobe Dashboard.
2. Go to the **Workbench** or **Recordings** tab.
3. Select `travel-ota` from the app dropdown.
4. Browse the recorded traces and inspect the deep dependency graphs.

</Interface>
<Interface id="cli">

List cases recorded for the app in the last 10 minutes:

```bash
sp record case list --app <your-app-id> --since -10m
```

</Interface>
</InterfaceTabs>

## 8. Replay the Recordings
Replay executes recorded transactions against a target environment with automated dependency mocking (your database and downstreams do not need to be set up).

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Navigate to the **Replays** tab and click **New Replay Plan**.
2. Select `travel-ota`.
3. Choose the cases to replay.
4. Set the target environment to `http://localhost:8080` and click **Run**.

</Interface>
<Interface id="cli">

Trigger the replay plan pointing to your local running instance:

```bash
sp replay run --app <your-app-id> --env http://localhost:8080
```

Watch the replay status until it reaches a terminal state:

```bash
sp replay status <replay-plan-id> --watch
```

</Interface>
</InterfaceTabs>

---

## Onboard Your Own Application

Onboarding your own service is **exactly the same** as running the Travel OTA demo! Your application is just another `.jar` file started with the same Softprobe Java Agent and your custom App ID.

To connect your own application:

1. **Register Your App**: Create a new 16-character App ID either via **Apps** → **Create App** in the Web UI, or run:
   ```bash
   sp app create <your-app-name>
   ```
2. **Attach the Agent**: Start your own JVM service with the same `-javaagent` flag, passing your new App ID and Helm backend address:
   ```bash
   java -javaagent:sp-agent.jar \
        -Dsp.app.id=<your-new-app-id> \
        -Dsp.api.url=http://<your-backend-host>:8090 \
        -jar your-own-application.jar
   ```
3. **Verify and Replay**: Record traffic, list cases, and trigger replays exactly as you did with the demo app.

## Next: the core workflow

The demo is just the start. Take your own application through the **core workflow**:

1. **[Record traffic](/en/testing/recording)** — capture real cases from production/staging and build your regression corpus
2. **[Replay & diff](/en/testing/replay-and-diff)** — run a regression before every release
3. **[Review diffs](/en/testing/review-diffs-in-the-web-ui)** — understand failing cases and accept the differences that aren't bugs
4. **[Configure compare rules](/en/testing/compare-rules-web-ui)** — turn always-changing fields into rules so they stop false-alarming

For deeper configuration, see [Java Agent Configuration](/en/testing/java-agent) (JVM properties, Tomcat/Docker) and the [Policies Overview](/en/testing/policies) (declarative YAML for CI/GitOps).
