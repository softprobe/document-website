---
title: Attach to Your App
---

# Attach to Your App

Now that you have tried record-and-replay using our pre-built Travel OTA demo, you are ready to connect Softprobe to your own Java application. This guide walks you through the step-by-step process of onboarding any JVM service.

## Prerequisites

- **Java 8 or higher** (Java 17/21 recommended) on your application host.
- **sp CLI** installed (`curl -fsSL https://install.softprobe.ai | sh`).
- Your **Softprobe Helm chart** is deployed and running (with the Softprobe backend available, e.g. at `http://<your-backend-host>:8090`).

---

## 1. Register Your Application (App ID)
Every application in Softprobe needs to be registered so that it has a unique `appId` (a 16-character hex identifier).

- **Via the Web UI:**
  1. Open your Softprobe Dashboard.
  2. Navigate to **Apps** → click **Create App**.
  3. Enter your service name and click Save.
  4. Note down the generated **App ID**.

- **Via the `sp` CLI:**
  ```bash
  export SP_API_URL=http://<your-backend-host>:8090   # Point to your Helm backend
  sp app create <your-app-name>
  ```
  Save the `appId` returned in the JSON response.

## 2. Declare Your Policies (YAML)
Softprobe uses simple, declarative YAML configuration files to control what is recorded, mocked, and compared during replay.

Create the following files in your project directory:

- **`recording.yaml`** (Defines what entry points and outbound dependencies to capture):
  ```yaml
  # Recording scope configuration
  excludePaths:
    - /health
    - /metrics
  includePaths:
    - /api/**
  ```
- **`mock.yaml`** (Defines which downstream calls to mock):
  ```yaml
  # Mock behavior configuration
  mockCategories:
    - HttpClient
    - Database
    - Redis
  ```

Apply these policies using the `sp` CLI:
```bash
sp policy recording apply -f recording.yaml --json
sp policy mock apply -f mock.yaml --json
```

## 3. Attach the Softprobe Agent
To intercept traffic, you must attach the Softprobe Java Agent to your service on startup using the JVM `-javaagent` flag.

1. Download the `sp-agent.jar` if you have not already:
   ```bash
   sp agent download
   cp ~/.local/share/softprobe/agent/sp-agent.jar .
   ```
2. Start your application JVM with the following system properties:
   ```bash
   java -javaagent:sp-agent.jar \
        -Dsp.app.id=<your-app-id> \
        -Dsp.storage.service.host=http://<your-backend-host>:8090 \
        -Dsp.config.service.host=http://<your-backend-host>:8090 \
        -jar your-application.jar
   ```

Replace `<your-app-id>` with your 16-character App ID, and `<your-backend-host>:8090` with your deployed Helm backend URL.

## 4. Record Traffic
Once your application starts with the agent attached:
1. Verify the agent is online in your dashboard or via CLI:
   ```bash
   sp app status <your-app-id> --json
   # expected: "status": "online"
   ```
2. Send some test or production traffic to your application endpoints (e.g., `curl http://localhost:8080/api/users`).
3. Verify that recordings are successfully saved:
   ```bash
   sp record case list --app <your-app-id> --since -10m
   ```

## 5. Replay and Verify
To execute a regression check, send the recorded requests back to your test instance with automatic dependency mocking enabled:

```bash
sp replay run --app <your-app-id> --env http://localhost:8080
```
*(Replace `http://localhost:8080` with the actual address of your test/QA application instance).*

You can monitor the progress and view visual comparison diffs in the **Replays** section of your Web Dashboard or via the CLI:
```bash
sp replay status <replay-plan-id> --watch
```
