---
title: Run and schedule replays
---

# Run and schedule replays

A replay sends recorded entry requests to a service in a test environment. The service runs its real business code; when it calls a dependency, the recorded result answers; finally the recorded and replayed results are compared. One replay run is a **replay plan**.

Start a replay by hand, or create a **scheduled task** to replay automatically every day. To replay after each deployment from your pipeline, see [Replay after deployment](/en/testing/webhook-and-ci).

## Prepare the test instance {#prepare}

Start the version you want to check in a test environment, with the agent attached and **the same application ID as when recording** (`-Dsp.app.id`). Note its address, for example `order-service.test:8080`: that's the replay's **target environment**.

::: warning Replay really calls the target service
Entry requests really reach the target service and its business code really runs. Whether dependency calls are answered from the recording depends on **Config → Replay** (see [Recording and replay settings](/en/testing/policies#replay)). So:

- Use a test environment as the target, never production.
- Turn recording off, or very low, on the replay target, so replayed requests aren't recorded again.
:::

The backend that runs the replay must be able to reach the target. If you use SoftProbe Cloud and the target only runs on your machine, use [`sp tunnel`](/en/testing/commands/tunnel).

## Replay now {#run}

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

Open **Replay plans → Run records**, click **Run replay now**, and fill in **New replay plan**:

![New replay plan](/img/docs/testing/en/new-plan.png)

| Field | Meaning |
|-------|---------|
| Plan name | Optional; helps you find it in Run records |
| Target environment (targetEnv) | Pick the protocol on the left (`http://`, `https://`, `dubbo://` …) and enter `host:port` on the right |
| Replay scope | **All endpoints**, **Pick endpoints** or **Pinned cases**. When picking endpoints you can search by name, description or tag, or **Select by tag** |
| Recording from / Recording to | Replays the cases recorded in this period; presets for the last hour, 24 hours or 7 days. Ignored when replaying pinned cases |
| Case limit per interface | Counted per endpoint; leave empty to replay all |
| Filter by case tags | Only replays cases with the given tags, such as `env:prod` |

**Advanced options** add:

| Option | Meaning |
|--------|---------|
| Pressure and rate | **Standard (adaptive)** slows down on errors, suited to daily regression; **Serial** sends the next case only after the previous one finishes; **Fixed total RPS (load test)** keeps a constant rate. Standard mode takes a speed multiplier from 0.25× to 4× |
| Per-case timeout | How long to wait for one case's response (milliseconds); empty uses the default |
| Dependency calls | **Force all dependencies to make real calls for this run** stops this run from answering any dependency from the recording. Only in an isolated test environment |
| Agent version | Only replay cases recorded by the given agent versions. After an agent upgrade, cases from older versions sometimes have compatibility problems; use this to leave them out |
| Traffic coloring | Adds custom request headers to every replayed request so the service can recognize replay traffic |

Click **Create plan**. The plan starts sending requests right away and doesn't wait for the agent to reconnect, so check that the test instance is running and the agent is online before you create it. The console warns you when the agent is offline, but still lets you create the plan.

</Interface>
<Interface id="cli">

```bash
sp replay run --app <appId> --env http://order-service.test:8080 --from -24h --json
sp replay status <planId> --watch --json
```

Common flags: `--suite Pinned` (pinned cases only), `--operation <endpoint>` (repeatable), `--limit <cases per endpoint>`, `--no-mock` (all dependencies make real calls). All flags: [sp replay](/en/testing/commands/replay).

</Interface>
</InterfaceTabs>

The most requests per second are set by **Per-instance QPS cap** under **Config → Replay**: one target address counts as one instance, 5 per second by default. **Standard (adaptive)** mode starts lower and climbs to that cap. You can change it for a single run under **Advanced options**.

## Run records {#records}

**Replay plans → Run records** lists every replay plan. Filter by status (running, all passed, differences, run error), by trigger (one-off replay, scheduled, CI, API) and by time.

![Run records](/img/docs/testing/en/replay-records.png)

Each row shows the number of cases, passed, failed (with differences) and **Replay failed** (the request couldn't complete, for example the target was unreachable), plus the report's verdict. Click the plan name to open the [replay report](/en/testing/replay-report). A running plan can be stopped with **Stop plan**; **Delete plan** removes the plan together with its results, comparisons and logs.

## Scheduled replay {#scheduled}

Replay automatically at a fixed time every day or every workday, for example as a nightly regression run.

Open **Replay plans → Scheduled tasks** and click **New scheduled task**:

![New scheduled task](/img/docs/testing/en/new-task.png)

| Field | Meaning |
|-------|---------|
| Task name | Required |
| Target environment, Replay scope | As for Replay now. The scope can be **Pinned cases** too |
| Recurrence Days | Pick weekdays, or **Workdays** / **Every day** |
| Daily Start Time | When to run each day; the next run time and time zone are shown below |
| Start before each run, Window length | Which recordings to replay: a window that starts "Start before each run" before the trigger and lasts "Window length". For example, starting 10 hours before and lasting 8 hours, a 02:00 run replays what was recorded between 16:00 and 24:00 the day before. The window must be at least one minute and no longer than "Start before each run" |
| Case limit, case tags, advanced options | As for Replay now |

Click **Save task**, or **Save and run now** to try it once.

The task list shows each task's trigger rule, next run and an **Auto-schedule** switch: turning it off pauses the task without deleting it. Each task can be **Run** once right away, **Edit**ed or deleted. Replays started by a task appear in Run records with the trigger "Scheduled task".

If creating the plan fails when the time comes — for example there are no recordings in the window, or another replay is being created for the same application — that scheduled run doesn't start, and the reason shows in Run records.

::: info SoftProbe Cloud
Scheduled replays on SoftProbe Cloud are started from the cloud, so the target must be reachable from the internet. For a target on an internal network, use **Run replay now** in the desktop client.
:::

## During a replay {#during}

The backend sends the recorded entry requests to the target one by one:

1. The target runs its real business code.
2. When it calls a dependency, the agent follows **Config → Replay**: answer from the recording, or make the real call.
3. The replayed response and dependency calls are recorded and compared with the recording.

Before and after sending each request the backend logs `Replay send start` / `Replay send done` / `Replay send failed`, which tells you whether a request reached the service: see [Replay send log markers](/en/testing/reference/replay-send-log-markers).

## After a replay {#after}

1. Read the [replay report](/en/testing/replay-report) first: the verdict, and failed cases grouped by cause.
2. For differences, go through them with [Review differences](/en/testing/review-diffs-in-the-web-ui); fields that change every time, such as timestamps and random IDs, become [diff rules](/en/testing/compare-rules-web-ui).

Most differences aren't bugs: timestamps, serial numbers and random IDs differ on every replay without anything being wrong. Ignore them and the real problems stand out.
