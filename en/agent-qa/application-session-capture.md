# Application session capture

**Status: Planned.** Softprobe OBI packages and generated Agent-key setup are not available yet. This page describes the experience we are designing.

The command examples below show what Explorer should give you. They are not runnable today: the download and Helm chart have not been released. When available, Explorer will fill in the real versioned URLs and values.

Softprobe application session capture connects a browser recording from your website with selected API activity from your backend. When someone reports a problem, you can open one Session (the browser recording and its matching backend activity) in Explorer and review what happened alongside the API requests and responses. You can use a non-secret session ID already managed by your app, or let the recorder create one for this capture.

The setup has two parts: add a recorder to your website, and install Softprobe OBI on the backend host or Kubernetes cluster. OBI is the collector that observes the API routes you choose and sends them to Explorer. Both parts use the existing Agent API key for write-only ingest. Explorer resolves that key to the Agent/App. The browser Session ID and request trace IDs connect the two telemetry streams.

## What you will set up

You will need:

- Access to the application's frontend so you can add the browser recorder and publish it.
- A supported Linux host or Kubernetes cluster where the backend runs. On Linux, you need `sudo`; in Kubernetes, you need permission to create a namespace, a Secret (Kubernetes' protected store for credentials), and a DaemonSet (a workload that runs on each cluster node).
- The website address where the browser recorder will run, such as `https://shop.example.com`.
- Every API address the browser calls. If any differ from the website address, add those exact addresses in Explorer (include `https://` and a port if you use a non-default port; do not include an API path such as `/orders`).
- The backend service and API paths you want to capture, such as `POST /api/orders`.
- A decision about whether to capture the data sent to and returned from those API paths. Review those paths before enabling body capture.
- Permission for the host or cluster to make HTTPS connections to the configuration and upload addresses Explorer shows. You do not need to open an inbound port for OBI.

You will install OBI where the backend runs, add the recorder to your frontend, and publish that frontend change. If the website and API use different addresses, you or your API/gateway owner must also connect them as described below. If your site has a Content Security Policy, you may need to update it too.

## If your API is hosted at a different web address

There are two separate browser connections: the recorder sends its recording to Softprobe, and your website calls your own API with standard trace context so the backend request can be matched to the browser request. Softprobe handles the first connection's allowed website origins. The instructions below cover the second connection.

For example, your website may be `https://shop.example.com` while its API is `https://api.example.com`. CORS is the browser rule that decides whether a page at one address can call an API at another. For each selected API request, the recorder adds `traceparent` to link the browser request span to the backend request span. `traceparent` contains a trace ID; it does not contain your app's Session ID. The browser span carries the Session ID separately to Softprobe. TheLake matches that browser span with the backend span by trace ID, then assigns the Session ID before saving the backend span. First, add the exact API address to the capture in Explorer. The recorder will send tracing headers only to the website address and API addresses you selected. Then choose one of these two ways to connect them:

1. **Recommended: ask your website gateway owner to add a route under the website address.** Configure `https://shop.example.com/api` to forward requests to `https://api.example.com`. Keep the browser's API URL under `/api` and use your website address as the API address in Explorer. The browser then uses the website address for both the page and API, so you do not need to change CORS on the API. Make sure the gateway preserves the tracing headers. Explorer should provide a configuration example for the gateway you select; apply it and publish the gateway change.
2. **If you cannot add that route, ask your API owner to update CORS.** They must allow your exact website address and the trace-context request headers (`traceparent` and `tracestate` when present). For example, if your API uses `POST`, its response to the browser's permission check must include:

   ```http
   Access-Control-Allow-Origin: https://shop.example.com
   Access-Control-Allow-Headers: Content-Type, traceparent, tracestate
   Access-Control-Allow-Methods: POST, OPTIONS
   ```

   Keep any headers and methods your API already allows (for example, keep `Authorization` if your API uses it), then add `traceparent`, `tracestate`, and `OPTIONS`. The Session ID is not sent in an API request header. Return `Access-Control-Allow-Origin` on both the browser's `OPTIONS` permission check and the API response. If your API uses browser cookies, also return `Access-Control-Allow-Credentials: true` and keep the exact website address above (never `*`). Apply the change in your API or gateway and deploy it. Explorer should show a copyable example for the server or gateway you selected. After deployment, open your site and confirm its API requests succeed. If they fail, ask the API owner to check the browser's permission check for the website address, request headers, and method.

For the travel-ota demo, the website and API share one address, so neither change is needed. The browser recorder sends its recording to Softprobe; Softprobe handles the allowed website address for that upload. If your Content Security Policy (the browser rules your site sends for security) blocks connections, ask the person who manages it to add the Softprobe upload address Explorer shows to `connect-src`, then publish the policy. A route under your website address can avoid that policy change.

OpenTelemetry standardizes these headers; it does not bypass browser CORS rules. If your API is cross-origin and does not already allow `traceparent`, the API owner must add it (and `tracestate` when present). The same-address gateway route avoids that API CORS change.

## The setup journey

### 1. Create a capture in Explorer

Choose an application and environment, add the website address and every API address the browser calls, select the backend service, and choose the API paths and methods to include (for example, `POST /api/orders`). If the browser calls the API under the website address (for example, `https://shop.example.com/api/orders`), add the address once. Decide whether to capture the data sent to and returned from those API calls. Review what browser content and API values will be hidden before creating the capture.

Explorer gives you setup instructions for your Linux host or Kubernetes cluster. The instructions use the Agent's existing ingest-only API key, select the right Softprobe OBI release, and configure where captured Sessions should be sent. You do not need to enter a telemetry server address or write an OBI configuration file.

The Agent API key will be included in your public website code, so anyone who can visit the site can see it. It can submit telemetry for its Agent, but it cannot read Sessions or administer your workspace. Keep the key scoped to the intended application. If it is exposed, rotate it in Explorer. Use this same key for OBI.

### 2. Install Softprobe OBI

Choose one install path below. Open a terminal on the host where your backend runs and run the Linux commands. The package, installer, and chart are planned and are not available yet, so these command examples cannot be run today.

Before either install, verify the Softprobe signing key once. GnuPG (`gpg`) checks that the package was signed by Softprobe; if it is not installed, install GnuPG with your Linux distribution's package manager. Explorer and the Softprobe release documentation will show the expected key fingerprint separately from the downloaded package. Compare the fingerprint before importing the key; stop if it does not match:

```sh
curl -fL "<release signing key URL in Softprobe documentation>" -o softprobe-release-key.asc
gpg --show-keys --with-fingerprint softprobe-release-key.asc
```

Compare the fingerprint shown by `gpg` with the one shown in Explorer and the official Softprobe release documentation. If they do not match, stop. Only after they match, import the key and create the keyring Helm will use:

```sh
gpg --import softprobe-release-key.asc
gpg --export "<fingerprint shown in Explorer>" > softprobe-release-keyring.gpg
```

#### Linux host or virtual machine

Explorer will show a versioned download URL for your CPU architecture and its detached signature. Verify the signature before unpacking the archive. If verification fails, stop and do not install it:

```sh
curl -fL "<download URL shown in Explorer>" -o softprobe-obi.tar.gz
curl -fL "<signature URL shown in Explorer>" -o softprobe-obi.tar.gz.sig
gpg --verify softprobe-obi.tar.gz.sig softprobe-obi.tar.gz || {
  echo "Signature verification failed. Stop; do not install." >&2
  exit 1
}
tar -xzf softprobe-obi.tar.gz
cd softprobe-obi
sudo ./install.sh
sudo softprobe-obi enroll
sudo systemctl status softprobe-obi
```

The signature check happens before extraction, so do not extract the archive if it fails. When `softprobe-obi enroll` prompts you, enter the Agent API key. The command saves the host's configuration and starts the service. Do not put the key after `--api-key` in the command; that can expose it in shell history and the process list. The Linux host needs a supported kernel and permission for OBI's low-level network monitoring; Explorer should check these requirements before offering the download.

#### Kubernetes

Explorer will show the Softprobe Helm repository and chart version. Run these commands in Bash from a machine that has `helm` and `kubectl` configured for the cluster where your backend runs. They create a namespace, store the Agent API key in a Kubernetes Secret, and install the chart:

```sh
helm repo add softprobe "<Helm repository shown in Explorer>"
helm repo update
kubectl create namespace softprobe-capture --dry-run=client -o yaml | kubectl apply -f -
read -rs -p "Agent API key: " AGENT_API_KEY; echo
printf '%s' "$AGENT_API_KEY" | kubectl -n softprobe-capture create secret generic agent-api-key \
  --from-file=api-key=/dev/stdin --dry-run=client -o yaml | kubectl apply -f -
unset AGENT_API_KEY
helm upgrade --install softprobe-obi softprobe/obi \
  --namespace softprobe-capture \
  --version "<chart version shown in Explorer>" \
  --verify \
  --keyring ./softprobe-release-keyring.gpg \
  --set enrollment.existingSecret=agent-api-key
kubectl -n softprobe-capture rollout status daemonset/softprobe-obi
```

The repository URL, chart version, and command values must come from Explorer. This chart and command contract have not been released yet. Helm checks the chart signature before installing it. The chart will run OBI with the node access it needs for network capture and register the cluster using the Secret. Your Kubernetes account must be allowed to create the namespace and Secret and install a DaemonSet.

OBI observes only the backend workload and API routes you selected. It sends matching backend activity to Explorer. It should not save or upload request or response bodies for routes outside your list.

### 3. Add the browser recorder

From your frontend project's folder (the one containing `package.json`), install the Softprobe web recorder. Add its setup to the shared page layout or app startup file, then publish the change. In a multi-page site, initialize it on each page. In a single-page app, initialize it once when the app starts. The recorder keeps the same Session ID as the user moves between pages in one tab.

```sh
npm install @softprobe/web-record
```

```ts
import { RecordSdk } from "@softprobe/web-record";

RecordSdk.init({ apiKey: "<Agent API key>", baseUrl: "<Softprobe ingest URL>" });
```

If your app already has a non-secret session ID available in frontend code, pass it so the recording and browser spans use the same ID:

```ts
RecordSdk.init({
  apiKey: "<Agent API key>",
  baseUrl: "<Softprobe ingest URL>",
  sessionId: getCurrentSessionId(),
});
```

Replace `getCurrentSessionId()` with the function your app uses to return its session ID. If you do not have an app session ID, use the first example and the recorder will create one for this browser session. Do not pass an authentication cookie, access token, or other credential as the session ID. If your app's ID changes during login or logout, tell the recorder about the new non-secret ID:

```ts
RecordSdk.setSessionId(getCurrentSessionId());
```

The recorder captures browser activity and labels its browser spans with `session.id`. For selected API calls, it adds `traceparent` so OBI can connect each backend request to its browser request. `traceparent` contains trace context only; it never contains the Session ID. TheLake matches the backend span to the browser span by the trusted workspace and Agent identity plus `trace_id`, then assigns the browser's Session ID before saving the backend span. This is planned behavior. TheLake temporarily holds a backend span when it arrives first. If you enabled body capture, that pending span may contain the selected request and response bodies. While waiting, it is encrypted, held in the same data region with the same access controls as saved traces, and not searchable in Explorer. Once matched and saved, TheLake deletes the pending copy. If the browser span arrives first, TheLake keeps only the trace-to-session link until its displayed time limit so it can match later backend spans, then deletes it. If no matching browser span arrives before the displayed time or storage limit, TheLake deletes the pending span and link, keeps only a health count, and does not add the backend span to your saved traces or Sessions. Explorer will show these limits before you enable body capture. OBI does not read the application Session ID. The recorder sends trace-context headers only to API addresses selected for this capture. When a page is leaving, it attempts to send its latest recording events. The final send is best effort: a browser can close before it finishes.

The generated setup still needs an Explorer-managed ingest URL. The SDK uses the Agent API key for ingest and does not require a separate capture ID or read/admin credential.

### 4. Confirm a Session

Open the website and complete a representative task. In Explorer, open the resulting Session and confirm that it contains both the browser recording and the API activity for that task. Review what was captured before enabling the same settings for more users.

## What is captured

The route list controls which backend API traffic is included. OBI may briefly inspect network data to identify a route, but for routes outside your list it should not save a full request or response body with a Session or send it to Softprobe. This feature captures selected HTTP API bodies; it does not turn on SQL or database request bodies.

The recorder masks browser input values by default. It can still record sensitive text that is displayed elsewhere on the page, such as an account number in a heading. Before enabling recording for users, mark sensitive page areas to hide or block, or turn recording off on pages that show sensitive information. Review a sample recording. API body filtering is separate: choose which routes can include bodies and which values in those bodies must be removed.

If your backend calls another service, select that service only if you also need to see its requests and responses. Explorer can show those calls alongside the browser session and the API request that triggered them. Before you enable a dependency, check whether your selected OBI release supports capturing its bodies; otherwise Explorer will show request details without the body.

## Agent-assisted setup

Agent-assisted installation may be added as an optional shortcut after the manual installation is supported. It should apply the same capture settings and show the same changes as the manual instructions. The manual flow is the primary setup and does not require an AI coding agent.
