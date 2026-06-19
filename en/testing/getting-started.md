---
title: Getting Started
---

<script setup>
import { ref } from 'vue'
const dAppTab = ref('ui')
const dViewTab = ref('ui')
const dReplayTab = ref('cli')
</script>

# Getting Started with Softprobe Testing

Welcome to Softprobe Testing! This guide provides a single, cohesive path to get you started with record-and-replay in minutes using our pre-built Travel OTA demo application, followed by a quick wrapup on how to connect your own Java service.

---

## Prerequisites

- **Java 8 or higher** (Java 17/21 recommended) installed and on your `PATH`.
- **sp CLI** installed (`curl -fsSL https://install.softprobe.ai | sh`).
- Your **Softprobe Helm chart** is deployed and running (with the Softprobe backend available, e.g. at `http://<your-backend-host>:8090`).

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
Download the Softprobe Java agent JAR (either [click to download sp-agent.jar](https://github.com/softprobe/demo-ota/releases/download/v1.1.0/sp-agent.jar) directly via your browser, or use the `sp` CLI command below):
```bash
sp agent download
cp ~/.local/share/softprobe/agent/sp-agent.jar .
```
*(Alternatively, download it directly via curl: `curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/sp-agent.jar`)*

## 4. Register the Application
Register the demo application in Softprobe to receive a unique `appId` (a 16-character hex identifier):

<div class="tabs-container">
  <div class="tabs-nav">
    <button :class="{ active: dAppTab === 'ui' }" @click="dAppTab = 'ui'">Web UI</button>
    <button :class="{ active: dAppTab === 'cli' }" @click="dAppTab = 'cli'">sp CLI</button>
  </div>
  <div class="tabs-content">
    <div v-if="dAppTab === 'ui'">
      <ol>
        <li>Open your Softprobe Dashboard.</li>
        <li>Navigate to <strong>Apps</strong> and click <strong>Create App</strong>.</li>
        <li>Enter <code>travel-ota</code> as the name and click <strong>Save</strong>.</li>
        <li>Copy the generated <strong>App ID</strong>.</li>
      </ol>
    </div>
    <div v-if="dAppTab === 'cli'">
      <p>Run the following command to register the app via the CLI:</p>
      <pre><code>export SP_API_URL=http://localhost:8090   # Point to your Helm/local backend
sp app create travel-ota</code></pre>
      <p>Save the <code>appId</code> returned in the JSON response.</p>
    </div>
  </div>
</div>

## 5. Start the Application with the Agent
Start the demo app with the `-javaagent` flag, passing your `appId`:
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.storage.service.host=http://localhost:8090 \
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

<div class="tabs-container">
  <div class="tabs-nav">
    <button :class="{ active: dViewTab === 'ui' }" @click="dViewTab = 'ui'">Web UI</button>
    <button :class="{ active: dViewTab === 'cli' }" @click="dViewTab = 'cli'">sp CLI</button>
  </div>
  <div class="tabs-content">
    <div v-if="dViewTab === 'ui'">
      <ol>
        <li>Log in to your Softprobe Dashboard.</li>
        <li>Go to the <strong>Workbench</strong> or <strong>Recordings</strong> tab.</li>
        <li>Select <code>travel-ota</code> from the app dropdown.</li>
        <li>Browse the recorded traces and inspect the deep dependency graphs.</li>
      </ol>
    </div>
    <div v-if="dViewTab === 'cli'">
      <p>List cases recorded for the app in the last 10 minutes:</p>
      <pre><code>sp record case list --app &lt;your-app-id&gt; --since -10m</code></pre>
    </div>
  </div>
</div>

## 8. Replay the Recordings
Replay executes recorded transactions against a target environment with automated dependency mocking (your database and downstreams do not need to be set up).

<div class="tabs-container">
  <div class="tabs-nav">
    <button :class="{ active: dReplayTab === 'ui' }" @click="dReplayTab = 'ui'">Web UI</button>
    <button :class="{ active: dReplayTab === 'cli' }" @click="dReplayTab = 'cli'">sp CLI</button>
  </div>
  <div class="tabs-content">
    <div v-if="dReplayTab === 'ui'">
      <ol>
        <li>Navigate to the <strong>Replays</strong> tab and click <strong>New Replay Plan</strong>.</li>
        <li>Select <code>travel-ota</code>.</li>
        <li>Choose the cases to replay.</li>
        <li>Set the target environment to <code>http://localhost:8080</code> and click <strong>Run</strong>.</li>
      </ol>
    </div>
    <div v-if="dReplayTab === 'cli'">
      <p>Trigger the replay plan pointing to your local running instance:</p>
      <pre><code>sp replay run --app &lt;your-app-id&gt; --env http://localhost:8080</code></pre>
      <p>Watch the replay status until it reaches a terminal state:</p>
      <pre><code>sp replay status &lt;replay-plan-id&gt; --watch</code></pre>
    </div>
  </div>
</div>

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
        -Dsp.storage.service.host=http://<your-backend-host>:8090 \
        -jar your-own-application.jar
   ```
3. **Verify and Replay**: Record traffic, list cases, and trigger replays exactly as you did with the demo app.

For deeper configuration, policy YAML schema (recording, mocking, compare rules), and production deployment patterns, see our in-depth guides:
* [Java Agent Configuration](/en/testing/java-agent) — JVM properties and Tomcat/Docker setups
* [How to Record Traffic](/en/testing/recording) — Creating robust test case corpora
* [Replay and Diff](/en/testing/replay-and-diff) — Custom comparison rules and ignore parameters
* [Policies Overview](/en/testing/policies) — Declarative YAML policies for DevOps

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
