---
title: Demo quickstart (5 minutes)
---

# Travel OTA demo quickstart

Learn how Softprobe works in about five minutes using the pre-built **Travel OTA** demo app. This guide runs on your local machine using Java and connects directly to your private Softprobe cluster (installed via Helm).

## Prerequisites

- **Java 8 or higher** (Java 17/21 recommended) installed and configured on your `PATH`.
- **sp CLI** installed (`curl -fsSL https://install.softprobe.ai | sh`).
- Your **Softprobe Helm chart** is installed and running (`sp-boot` / backend is available, e.g. at `http://localhost:8090`).

---

## 1. Install Java
Ensure Java is configured correctly and available in your terminal:
```bash
java -version
```

## 2. Download the Demo Application
The Travel OTA (Online Travel Agency) demo is a lightweight Spring Boot application. Download the pre-built application JAR from the latest release on GitHub:
```bash
curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/travel-ota.jar
```

## 3. Download the Softprobe Agent
The Softprobe Java agent automatically intercepts and records database queries and HTTP downstream calls. Download it using the `sp` CLI:
```bash
sp agent download
```
This downloads `sp-agent.jar` to your local share directory. Copy it into your current working directory:
```bash
cp ~/.local/share/softprobe/agent/sp-agent.jar .
```
*(Alternatively, download it directly from GitHub: `curl -L -O https://github.com/softprobe/demo-ota/releases/download/v1.1.0/sp-agent.jar`)*

## 4. Create an Application in Softprobe
You need to register the application in Softprobe to receive an `appId` (a unique 16-character hex identifier).

- **Via the Web UI:**
  1. Open your Softprobe Dashboard.
  2. Navigate to **Apps** and click **Create App**.
  3. Enter `travel-ota` as the name and click Save.
  4. Copy the generated **App ID**.

- **Via the `sp` CLI:**
  ```bash
  export SP_API_URL=http://localhost:8090   # Point to your Helm/local sp-boot
  sp app create travel-ota
  ```
  Save the `appId` returned in the JSON response.

## 5. Start Travel OTA with the Agent
Start the application with the `-javaagent` flag, passing your `appId`:
```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.storage.service.host=http://localhost:8090 \
     -Dsp.config.service.host=http://localhost:8090 \
     -jar travel-ota.jar
```
*(If your Helm chart's backend is hosted at another address, replace `http://localhost:8090` with your actual backend URL).*

The application is now running locally at [http://localhost:8080](http://localhost:8080).

## 6. Perform a Booking (Shopping)
Open [http://localhost:8080](http://localhost:8080) in your browser:
1. Click **Search** to view available flights.
2. Select a flight and click **Book**.
3. Complete the checkout/payment process.

The Softprobe agent will intercept and capture this entire transaction automatically.

## 7. View Recorded Data
- **Via the Web UI**: Log in to your Softprobe Dashboard, go to the **Workbench** or **Recordings** tab, select `travel-ota`, and browse the recorded traces and deep dependency graphs.
- **Via the CLI**:
  ```bash
  sp record case list --app <your-app-id> --since -10m
  ```

## 8. Replay the Recordings
Replay executes recorded transactions against a target environment to test for regressions, utilizing automated dependency mocking so your database and third-party APIs do not need to be set up.

- **Via the CLI**:
  ```bash
  sp replay run --app <your-app-id> --env http://localhost:8080
  ```
- **Via the Web UI**: Navigate to the **Replays** tab, click **New Replay Plan**, select `travel-ota`, set the target environment to `http://localhost:8080`, and click **Run**.
