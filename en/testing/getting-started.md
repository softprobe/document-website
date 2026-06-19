---
title: Getting Started
---

# Getting Started with Softprobe Testing

Welcome to Softprobe Testing! This guide provides a single, cohesive path to get you started with record-and-replay in two progressive phases:

1. **Phase 1: Try the 5-Minute Demo** — Hands-on experience using our pre-built Travel OTA demo application.
2. **Phase 2: Onboard Your Own Application** — Step-by-step checklist to connect your own Java services.

---

## Prerequisites

- **Java 8 or higher** (Java 17/21 recommended) installed and on your `PATH`.
- **sp CLI** installed (`curl -fsSL https://install.softprobe.ai | sh`).
- Your **Softprobe Helm chart** is deployed and running (with the Softprobe backend available, e.g. at `http://<your-backend-host>:8090`).

---

## Phase 1: Try the 5-Minute Demo

Experience Softprobe in action by running our pre-built **Travel OTA** (Online Travel Agency) demo app on your local machine and capturing real traffic.

### 1. Verify Java Installation
Ensure Java is configured correctly and available in your terminal:
```bash
java -version
```

### 2. Download the Demo Application
Download the pre-built Travel OTA application JAR from the latest release on GitHub:
```bash
curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar
```

### 3. Download the Softprobe Agent
Download the Softprobe Java agent JAR using the CLI, then copy it to your current working directory:
```bash
sp agent download
cp ~/.local/share/softprobe/agent/sp-agent.jar .
```
*(Alternatively, download it directly: `curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/sp-agent.jar`)*

### 4. Create an Application in Softprobe
Register the demo application to receive a unique `appId` (a 16-character hex identifier):

- **Via the Web UI:**
  1. Open your Softprobe Dashboard.
  2. Navigate to **Apps** and click **Create App**.
  3. Enter `travel-ota` as the name and click Save. Copy the generated **App ID**.

- **Via the `sp` CLI:**
  ```bash
  export SP_API_URL=http://localhost:8090   # Point to your Helm/local backend
  sp app create travel-ota
  ```
  Save the `appId` returned in the JSON response.

### 5. Start Travel OTA with the Agent
Start the demo app with the `-javaagent` flag, passing your `appId`:
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.storage.service.host=http://localhost:8090 \
     -Dsp.config.service.host=http://localhost:8090 \
     -jar travel-ota.jar
```
*(If your Helm backend is hosted at another address, replace `http://localhost:8090` with your actual backend URL).*

The application is now running locally at [http://localhost:8080](http://localhost:8080).

### 6. Perform a Booking (Generate Traffic)
Open [http://localhost:8080](http://localhost:8080) in your browser:
1. Click **Search** to view available flights.
2. Select a flight and click **Book**.
3. Complete the checkout/payment process.

The Softprobe agent automatically intercepts and captures this entire transaction.

### 7. View Recorded Data
- **Via the Web UI**: Log in to your Softprobe Dashboard, go to the **Workbench** or **Recordings** tab, select `travel-ota`, and browse the recorded traces and deep dependency graphs.
- **Via the CLI**:
  ```bash
  sp record case list --app <your-app-id> --since -10m
  ```

### 8. Replay the Recordings
Replay executes recorded transactions against a target environment with automated dependency mocking (your database and downstreams do not need to be set up).

- **Via the CLI**:
  ```bash
  sp replay run --app <your-app-id> --env http://localhost:8080
  ```
- **Via the Web UI**: Navigate to the **Replays** tab, click **New Replay Plan**, select `travel-ota`, set the target environment to `http://localhost:8080`, and click **Run**.

---

## Phase 2: Onboard Your Own Application

Now that you have seen record-and-replay in action, follow these steps to connect your own Java services.

### 1. Register Your Application
Register your service via the Dashboard or the CLI to get its unique `appId`:
```bash
sp app create <your-app-name>
```

### 2. Set Up Policies (YAML)
Softprobe uses simple, declarative YAML configuration files to control what is recorded, mocked, and compared. Create these files in your project directory:

- **`recording.yaml`** (Defines entry points and dependencies to capture):
  ```yaml
  excludePaths:
    - /health
    - /metrics
  includePaths:
    - /api/**
  ```
- **`mock.yaml`** (Defines which downstreams to mock):
  ```yaml
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

### 3. Attach the Agent to Your Service
Start your application JVM with the following system properties:
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.storage.service.host=http://<your-backend-host>:8090 \
     -Dsp.config.service.host=http://<your-backend-host>:8090 \
     -jar your-application.jar
```

Replace `<your-app-id>` with your 16-character App ID, and `<your-backend-host>:8090` with your deployed Helm backend address.

### 4. Verify and Record Traffic
1. Verify the agent is online:
   ```bash
   sp app status <your-app-id> --json
   # expected: "status": "online"
   ```
2. Send test or production traffic to your service endpoints.
3. Confirm cases are successfully recorded:
   ```bash
   sp record case list --app <your-app-id> --since -10m
   ```

### 5. Replay and Verify
Run a regression check by sending recorded requests back to your test instance:
```bash
sp replay run --app <your-app-id> --env http://localhost:8080
```
Monitor progress and view visual comparison diffs in the **Replays** section of your Web Dashboard or via the CLI:
```bash
sp replay status <replay-plan-id> --watch
```
