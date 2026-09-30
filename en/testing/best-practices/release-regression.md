---
title: Regression testing on every release
---

# Regression testing on every release

On every release, the pipeline takes real requests recorded in production and replays them against the new version in the test environment. If the results match production, the release continues. If they don't, the pipeline stops, and the report and chat notification say which endpoint changed. With AI set up, they also say which commit changed it.

![The replay report from the example release](/img/docs/testing/en/cicd-report.png)

## An example release (demo environment) {#example}

The screenshot above comes from the release below. It was a real run, but on a demo environment: application ID `sp-diag-e2e-app` with 3 endpoints, production and test instances on one machine, production traffic simulated by a script, only the last hour of recordings replayed, and a Webhook as the notification channel. The AI wrote its analysis in Chinese. `openapi-sp-diag-e2e-app-128` at the top of the screenshot is the plan name, which includes the application ID and the pipeline run number. The **10 replays in a row** label next to the difference is there because the demo environment had run the same change many times before; in a real project it wouldn't say 10 the first time.

1. The pricing service in production had been recording requests all along.
2. A developer committed `0026097` ("调整会员价计算", adjust the member price calculation), which changed member-price rounding from half up to rounding down.
3. Once the new version was deployed to the test environment, the pipeline replayed the 237 requests recorded in production over the last hour (the report calls them "cases"). The replay took 1 min 39 s; with the wait for AI noise reduction, the pipeline stopped about 2 minutes in, with the result `NEEDS_ACTION`, meaning results changed and someone needs to check:

   ```text
   回放结论：NEEDS_ACTION
   ```

   (The Chinese version of the script was used; the English one prints `Replay findings: NEEDS_ACTION`.)

4. The report: of the 81 requests replayed on `/order/price`, 79 came back with `payable` 1 lower than in production. About 10 minutes after the pipeline stopped, the AI traced the difference to commit `0026097` changing the rounding, and to the changed line, `PricingService.java:12`; the notification channel then received the result and the analysis.
5. The change wasn't intended. The developer reverted it and released again; this time the result was `CLEAN` and the release continued.

Had the change been intended, clicking **Mark passed** in the report and approving the release in the pipeline would have been enough.

## Impact on production and data {#impact}

- **Production**: the agent runs in the same JVM as the service; reserve about 512 MB of extra memory for the service. When CPU or memory runs high, or the SoftProbe platform has a fault, the agent automatically records less and drops pending data that doesn't fit, so it doesn't hold up the business. See [Capabilities, scope and resources](/en/testing/core-features-and-performance).
- **Recorded data**: it stays on the platform the customer deploys; payloads are encrypted before they're written to the database (AES-256-GCM, or SM4 instead); fields can be masked when shown in the console; recordings are kept for 2 days by default, which can be changed. See [Data protection and retention](/en/testing/installation/data-protection).
- **Downstream calls during replay**: pipeline-triggered replays mock dependencies by default. Database, cache and downstream API calls taken over by the agent are answered from the recording; a call with no matching recording is marked failed by default. But an application can set individual dependencies to make real calls, and a few instrumentations let the real call through when no recording matches, so keep the test environment isolated from production — don't connect it to production databases or downstream services. For which frameworks are taken over, see [Supported Java versions and frameworks](/en/testing/supported-frameworks#dependencies); for the settings, see [Dependency mock](/en/testing/policies#mock).
- **AI and code**: the AI sends replay differences, the related recorded payloads and code snippets to the model service you connect. With a model deployed inside your network, none of this leaves the network. See [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis#network).
- **Keep the trigger endpoint internal**: the endpoint that triggers replays has no authentication, so restrict it at the network level (a firewall or gateway, for example) to CI machines on the internal network. See [Before you start](/en/testing/webhook-and-ci#before-you-start).

## What to set up {#setup}

Prerequisite: SoftProbe is self-hosted. The SaaS edition can't yet trigger replays from a pipeline.

All of this is done once; after that, every release is tested automatically.

1. **Record in production**: attach the agent to the service in production and add `-Dsp.tags.env=prod` to its startup arguments, marking these as production recordings. See [Attach the Java agent](/en/testing/java-agent).
2. **Test environment**: attach the agent to the service in test as well, with the same application ID and `-Dsp.tags.env=test`. The test environment shouldn't record, or replayed requests get recorded all over again: under **Config → Recording**, add a rule for `env=test` with the sample rate (requests recorded per minute) set to 0. See [Recording settings](/en/testing/policies#recording).
3. **List the endpoints that must be tested**: the product calls them "main endpoints". Without this list, SoftProbe can only judge coverage by numbers: if a replay actually covers fewer than 10 endpoints or fewer than 30 requests, even an all-passing run ends up "coverage too low". So when few endpoints get replayed, the list is needed; once it exists, the check becomes whether every endpoint on it was tested. See [Main endpoints](/en/testing/webhook-and-ci#main-operations).
4. **Set up AI (recommended)**: connect a model and bind the application's code repository. The report then automatically ignores fields that change on every run, such as timestamps and random IDs (AI noise reduction), and says whether a difference came from a code change. See [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis).
5. **Get one clean run first**: deploy the version currently running in production to the test environment and run the script from the next section once. Go through the differences in the report: once a field such as a timestamp or random ID is confirmed to be noise that doesn't affect business behavior, add a [diff rule](/en/testing/compare-rules-web-ui) to ignore it; run again until the result is `CLEAN`. With this done, later releases won't keep getting stopped by the same noise.
6. **Chat notifications**: add a Feishu or DingTalk bot in the **Notifications** tab of settings. See [Replay notifications](/en/testing/notifications).

## Add it to the pipeline {#pipeline}

After "deploy to the test environment" and before "release to the next environment", add a step that runs [this script](/en/testing/webhook-and-ci#script):

```bash
export SP_BACKEND=http://sp-backend.internal:8090   # SoftProbe backend address
export SP_APP_ID=order-service                      # Application ID
export SP_TARGET=http://order-service.test:8080     # The new version in the test environment
export SP_CASE_TAGS='{"env":"prod"}'                # Replay only production recordings
bash ci/softprobe-replay.sh
```

The script waits for the replay to finish, then lets the pipeline continue or stops it based on the result:

| Result | Pipeline |
|---|---|
| `CLEAN`: no problems found | Continue the release |
| `NEEDS_ACTION`, `REVIEW_ONLY`: results changed | Stop and read the report |
| Anything else: this release wasn't tested | Stop and find out why |

For the script's other settings (commit, branch, pipeline link, timeout) and how to write the step in Jenkins, GitLab CI and GitHub Actions, see [Replay after deployment](/en/testing/webhook-and-ci). Read its [Before you start](/en/testing/webhook-and-ci#before-you-start) first: an All-in-One deployment needs `SP_REPLAY_OPENAPI=true` and a restart, and the machine running the script needs bash, curl and jq.

## When the pipeline stops {#when-stopped}

- **Results changed** (`NEEDS_ACTION`, `REVIEW_ONLY`): open the report and see what changed. If the change is intended, click **Mark passed**, then approve the release in the pipeline; if not, fix it and release again.
- **Too little tested** (`LOW_COVERAGE`, `NO_CASES`): too few requests were recorded in production, or main endpoints weren't replayed. Check that production is recording, that `SP_CASE_TAGS` is right, and that the main endpoints are registered correctly.
- **Test environment problem** (`ENVIRONMENT_FAILURE`, `INTERRUPTED`): many endpoints failed the same way, or the replay didn't finish. First make sure the service in the test environment is up and reachable; when many endpoints all return 500, the new version itself may be failing. Rerun the pipeline once it's fixed.

How to read the report: [Replay report](/en/testing/replay-report).

## FAQ {#faq}

**How does this relate to existing API automation tests?**

They complement each other. API automation checks whether results are *right*, against assertions someone wrote; replay needs no test cases and checks whether the new version *changed* compared with production, using real production requests, so it covers parameter combinations the automation never spelled out. The baseline is how production behaves: if production has a bug and the new version fixes it, the replay reports a difference too — confirm it and mark it passed.

**How long does the pipeline step take?**

The replay itself, plus waiting for AI noise reduction. In the example above, the first run took about 2 minutes; the run after the fix passed completely, yet took about 8 minutes: 1 min 36 s of replay, and the rest waiting for AI noise reduction — when no case fails, AI noise reduction waits a few extra minutes to make sure the replay statistics are fully written before it finishes. By default the script waits at most 30 minutes.

**Why does the chat notification arrive later than the pipeline result?**

The pipeline waits only for the replay and AI noise reduction, not for the AI to find the cause. When results changed and AI is set up, the notification waits for the AI analysis to finish (it is sent even if no cause is found), for up to 20 minutes, so it usually arrives a few to a dozen or so minutes after the pipeline result.

**Does the AI always find the cause?**

No. Differences whose cause isn't found are listed separately in the report as **Cause not established**. Also, the AI reads the code on the bound branch, so bind the branch that gets deployed to test. By default at most 10 analyses run automatically per day; if you release often, raise it in the report's [flow settings](/en/testing/replay-report#flow-settings).

**After an intended change ships, will the next release report the same difference?**

Yes, until the requests recorded from the old version in production fall out of the replay range (by default, recordings from the last 24 hours are replayed). **Mark passed** applies only to that one replay; the report labels the difference with how many runs in a row it has appeared, so it's easy to recognize.

**Only want chat notifications when something is wrong?**

Turn on **Only on failure** on the notification channel.
