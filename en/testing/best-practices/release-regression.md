---
title: CI/CD release regression
---

# CI/CD release regression

Before every release, the new version needs a regression run to confirm the change didn't break existing behavior. This page covers two things: how to use replay for that regression, and how to use its result to decide whether to release. The recommended setup is to run it automatically in your CI/CD pipeline; the scripts for common CI systems are ready to use (see [Replay after deployment](/en/testing/webhook-and-ci)).

The service in production runs with the SoftProbe agent (a probe that starts along with the service), which records real production requests and their results. On each release, the new version is first deployed to the test environment, and the pipeline sends the recorded requests to it again. The new version runs its business code as usual; when it queries a database or calls a downstream service, the recorded results answer. Finally the new version's results are compared with production's, a result is produced, and the pipeline uses it to continue the release or stop. For how it works, see [Replay Testing](/en/testing/).

## A regression goes wrong in only two ways {#two-failures}

- **Real problems slip through**: a real problem isn't caught and ships with the release.
- **So many false alarms that nobody looks**: irrelevant differences get reported so often that people let them through out of habit. The regression still runs, but nobody reads it anymore.

The second is more common and harder to notice: a regression rarely gets switched off; it usually just gets ignored. Each practice below targets one of the two.

## Make the regression catch real problems {#catch}

### Use only production recordings as the reference {#prod-baseline}

**What to do**: when recording, tag production requests with an environment tag (such as `env=prod`), and replay only those. The service in the test environment also runs the agent with the same application ID, but it doesn't record; it only receives replays.

**Why**: replay answers "has the new version changed compared with production?", so the reference can only be how production actually behaves. If requests recorded in the test environment get mixed in, the reference is no longer clean; if replayed requests get recorded again, the next run ends up comparing against itself.

**Otherwise**: the report mixes in differences that come from the test environment, and every release starts with sorting out which ones count.

::: warning Keep the test environment isolated from production
During replay, database, cache and downstream API calls are answered from the recording by default, and a call with no matching recording is marked failed. But an application can set individual dependencies to make real calls, and a few kinds of calls (UMQ message sends, for example) really go out when no recording matches. So the test environment must not be connected to production databases or downstream services. Also, the endpoint that triggers replays has no authentication; only CI machines on the internal network should be able to reach it. See [Dependency mock](/en/testing/policies#mock) and [Before you start](/en/testing/webhook-and-ci#before-you-start).
:::

### Define "tested enough" with a must-test list {#must-test}

**What to do**: list the endpoints that must be tested on every release; the product calls them "main endpoints". Base the list on business risk, and don't drop a key endpoint just because it wasn't tested and the check would otherwise pass. Key requests that only happen at month end or at night may not be in the last day of recordings; save them as "pinned cases" (which don't expire with the recordings), and on each release replay them and the recent recordings separately and check each result separately.

**Why**: whether something is "tested enough" is a business judgment only people can make. Without a list, the system can only fall back on numbers: if a replay covers fewer than 10 endpoints or fewer than 30 requests, the result is "coverage too low" even when everything passes. With the list, the check becomes whether every endpoint on it was tested.

**Otherwise**: a key endpoint happens not to be recorded this time, every other endpoint passes, and the regression passes anyway. Nothing failed to catch it; it was never tested.

To register main endpoints, see [Main endpoints](/en/testing/webhook-and-ci#main-operations); to pin cases, see [Pinned cases](/en/testing/pinned-cases).

### Go by the result, not the pass rate, and stop when nothing was really tested {#only-clean}

**What to do**: when a replay finishes, the system produces one result (the `findings.state` field of the status endpoint), and the pipeline decides by that alone:

| Result | Meaning | Pipeline |
|---|---|---|
| `CLEAN` | Tested, no problems found | The only case that continues the release automatically |
| `NEEDS_ACTION`, `REVIEW_ONLY` | Results changed, e.g. an endpoint returned errors, a field value changed, a field was added | Stop; someone reads the report and confirms |
| `LOW_COVERAGE`, `NO_CASES`, `INTERRUPTED`, `ENVIRONMENT_FAILURE` | Nothing was really tested this time: coverage too low, no requests to replay, the replay didn't finish, many endpoints failing the same way | Stop, find out why, and run again |

**Why**: a 95% pass rate may mean the order endpoint is the one that broke; a 100% pass rate may mean only three endpoints were tested. "Nothing was really tested" is the easiest to mistake for "nothing is wrong", yet it's exactly when the regression saw nothing at all. The cost is stopping a little more often.

Chat notifications only let people know the result early; they can arrive late or fail to send, so they can't be what lets a release through. For the script, see [The complete script](/en/testing/webhook-and-ci#script); for how each result is determined, see [Decide whether to continue](/en/testing/webhook-and-ci#decide).

## Keep the regression free of false alarms and hard to bypass {#trust}

### Before letting the result stop releases, make sure the regression itself is reliable {#before-gating}

**What to do**: before the result is allowed to stop releases, do three things:

1. **Get the same version clean first**: deploy the version currently running in production to the test environment and replay it once. The code hasn't changed, so every difference reported is noise. Fields that change on every run, such as timestamps and random IDs, go into diff rules once confirmed to have no business impact, so later comparisons skip them; differences caused by test-environment configuration get fixed in the environment. Repeat until the result is `CLEAN`.
2. **Break something on purpose once**: change code that affects a returned result, and confirm the pipeline really stops.
3. **When unsure, observe first**: let the replay produce results without stopping releases, follow a few real releases, and switch it on once the results are stable.

**Why**: step 1 shows it doesn't raise false alarms when the code hasn't changed, which is what makes later differences worth opening; step 2 shows the pipeline really stops when the code has changed, ruling out a script that's wired up wrong and lets the release continue even when problems were reported.

**Otherwise**: go live with noise, every release gets stopped by the same differences, and after a few rounds nobody reads the report anymore.

For how to set up diff rules, see [Diff rules](/en/testing/compare-rules-web-ui).

### When results change, a person confirms; business fields never go into ignore rules {#human-decides}

**What to do**: when the pipeline stops because results changed, a developer or tester opens the report and goes through each difference:

- Not an expected change: fix it and release again.
- An intended change in this release: click **Mark passed** in the report, then approve the release manually in the pipeline. **Mark passed** applies to this one replay only.
- A field that genuinely doesn't affect the business: put it in a diff rule so it isn't compared again.

**Why**: replay compares "same as production or not", not "right or wrong". If production has a bug and the new version fixes it, replay reports a difference too. The system reports whether something changed; only a person can judge whether it should have.

**Otherwise**: to get the pipeline through, someone adds a business field such as an amount or a status to the ignore rules. From then on, the regression can't see that field change at all, while the pipeline looks perfectly fine.

For going through differences, see [Review differences](/en/testing/review-diffs-in-the-web-ui).

### Let the AI find causes, not decide releases {#ai}

**What to do**: with AI set up, two things happen automatically. First, noise reduction: fields that change on every run, such as timestamps and random IDs, are recognized and not compared in this replay; business fields such as amounts and statuses are never ignored automatically. Second, cause analysis: failed cases are sorted into **Differences caused by code changes**, **Cause not established** and **Invalid**; for those caused by code changes, the analysis explains the change and gives the file and line when it finds them. The pipeline waits for noise reduction before producing the result, but not for cause analysis, and the analysis doesn't change the result.

**Why**: the AI can be wrong, so whether to release is always a person's decision; what it saves is going through cases one by one to find the cause. Also, the AI reads the code on the branch bound in the code repository and doesn't check that it's the version being released. Bind the branch you release from, and before relying on an attribution, check the branch and commit noted in the report.

For setup, see [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis).

### Look back regularly {#review-regularly}

**What to do**: regularly check two things: differences marked "N replays in a row" in reports, and which fields the diff rules ignore.

**Why**: after an intended change ships, while requests recorded from the old version in production are still within the replay range (by default, recordings from the last 24 hours are replayed), later releases keep reporting the same difference, and each time someone has to confirm it's still the same change. Ignore rules only ever grow, and over time business fields tend to slip in.

**Otherwise**: the regression stays green, and nobody can tell whether things are truly stable or the problems are being filtered out by rules.

## A run following these practices (demo environment) {#example}

Below is a real run on a demo environment: a Java pricing service with 3 endpoints, all registered as main endpoints; production and test instances on the same machine, with production traffic simulated by a script; diff rules already exclude `quoteId` and `quotedAt`, which change on every call.

1. A developer committed `0026097` ("调整会员价计算", adjust the member price calculation), which changed member-price rounding from half up to rounding down.
2. The new version was deployed to the test environment; the pipeline replayed the 237 requests recorded in production over the last hour, got the result `NEEDS_ACTION` about 2 minutes later, and stopped.
3. The report: of the 81 requests replayed on `/order/price`, 79 came back with the payable amount `payable` 1 lower than production. All 79 differences came from the same change; there was no noise to sort out.
4. About 10 minutes after the pipeline stopped, the AI finished the cause analysis: all 79 were caused by a code change, traced to commit `0026097` and line 12 of `PricingService.java`, and the notification went out right after.
5. The developer confirmed the change wasn't intended, restored half-up rounding and released again. The code now matched production, the result was `CLEAN`, and the release continued.

![The demo environment's replay report: 79 differences caused by a code change, traced to the commit and line](/img/docs/testing/en/cicd-report.png)

About the screenshot: `openapi-sp-diag-e2e-app-128` at the top is the plan name for this replay, which includes the demo application's ID and the pipeline run number; the "10 replays in a row" label next to the difference is there because the demo environment had run the same change many times before. In this run the AI wrote its analysis in Chinese.

This regression caught the problem because of the practices above: the amount field wasn't ignored, so the change was found; only the result counted, so the pipeline stopped as soon as it saw `NEEDS_ACTION`; the AI found the cause, and a person decided whether to release.

## Self-check {#checklist}

| Check | Passes when | Where |
|---|---|---|
| Production recordings are tagged | Production requests carry a tag such as `env=prod` | [Attach the Java agent](/en/testing/java-agent) |
| Test environment doesn't record | The test environment's sample rate is 0 | [Recording settings](/en/testing/policies#recording) |
| Replay uses only production requests | Replays are triggered with a tag filter | [Trigger the replay](/en/testing/webhook-and-ci#trigger) |
| Test environment isolated from production | Not connected to production databases or downstream services; the trigger endpoint is open only to internal CI | [Before you start](/en/testing/webhook-and-ci#before-you-start) |
| Must-test list | Must-test endpoints are all registered; rare but key requests are pinned | [Main endpoints](/en/testing/webhook-and-ci#main-operations), [Pinned cases](/en/testing/pinned-cases) |
| Regression proven reliable | The same version replays to `CLEAN`; a deliberately broken change stops the pipeline | [Diff rules](/en/testing/compare-rules-web-ui) |
| Pipeline goes by the result only | Only `CLEAN` continues automatically; it also stops when nothing was really tested | [The complete script](/en/testing/webhook-and-ci#script) |
| Someone owns the confirmation | Who reads reports and who can approve releases manually is agreed in advance | [Review differences](/en/testing/review-diffs-in-the-web-ui) |
| AI (recommended) | A model is connected and the bound branch is the release branch | [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis) |
| Notifications | A test message from the chat bot arrives | [Replay notifications](/en/testing/notifications) |
