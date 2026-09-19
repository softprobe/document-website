---
title: Pin cases and build test sets
---

# Pin cases and build test sets

Default recordings are kept only for their configured retention period. If a recording is useful for a regression test, pin it before it expires. Pinning copies the complete recorded trace—including the entry request and its recorded dependency calls—into the pinned-case library. The pinned copy is retained until you delete it.

A test set is the group of pinned cases that you select when creating a replay plan. You do not need to keep the original recording inside its time window to replay a pinned case.

## When to pin a case

Pin cases that you want to reuse, for example:

- a checkout or booking path that must stay working;
- a production regression that you want to reproduce in a test environment;
- a representative case for an API that is difficult to exercise by hand.

Pinning is currently a Workbench action. The `sp` CLI can start and inspect replay plans, but it does not create or manage pinned-case sets.

![The Workbench recordings list](/img/docs/testing/pinned-cases-recordings.png)

The recordings list shows the endpoint-level recording inventory before you open a trace and pin a case.

## Pin a recording

1. Open the application in **Workbench**.
2. Open a case from a replay result or from the recording trace details.
3. Select **Pin**.
4. Optionally enter a name and note, then select **Pin** again.
5. Select **View case**, or open **Recording → Pinned cases** later.

![Pinning a recording walk-through](/img/docs/testing/pinned-cases.gif)

The name and note help you identify the case when you build a test set. If the case is already pinned, the operation is idempotent: it remains one pinned case rather than creating a duplicate.

::: warning Pin before the recording expires
If the source recording has already expired, Workbench shows **Recording past retention** and cannot copy it. Pinning does not restore an expired recording.
:::

## Review your pinned cases

Open **Recording → Pinned cases** to review the permanent library. You can:

- search by case name or API;
- open the case details;
- replay one pinned case; and
- delete a pinned case you no longer need.

The list can contain cases pinned by you and cases automatically pinned by the system. Review the list before using it as a curated regression set. Deleting a pinned case removes it from the library.

![The pinned-case library](/img/docs/testing/pinned-cases-library.png)

The pinned-case library keeps the saved trace available after the rolling recording window ends.

## Create and run a test set

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Open the **Replay** tab and select **New plan**.
2. Choose the replay target environment. This is the test service that receives the recorded entry requests.
3. For replay scope, choose **Pinned cases**.
4. Select the cases for this test set. All eligible pinned cases are selected initially; search, select all, or deselect individual cases as needed.
5. Click **Create plan**, wait for it to finish, and review the results and diffs.

![Selecting Pinned cases for a replay plan walk-through](/img/docs/testing/replay-pinned-scope.gif)

The selected pinned cases are the test set for that replay plan. You can create another plan later with a different selection without changing the pinned library.

</Interface>
<Interface id="cli">

Trigger a regression test run directly for your pinned suite using `--suite Pinned`:

```bash
sp replay run \
  --app <your appId> \
  --env http://order-service.test:8080 \
  --suite Pinned \
  --watch \
  --json
```

If the manual pinned set is empty, the command returns `NO_PINNED_CASES`.

</Interface>
</InterfaceTabs>

::: warning Replay only against a non-production target
Replay sends real entry requests to the target environment. Recorded downstream calls are mocked, but the application under test still executes its entry path. Use a test or staging target and turn recording off, or set it to a minimal level, on the replay host. See [Replay and diff](/en/testing/replay-and-diff#step-1-prepare-the-test-instance).
:::

## Important lifecycle details

### A pinned case is independent of the source recording

Pinning makes a permanent copy of the full trace. It does not extend the source recording's retention period and does not modify the original recording. The pinned copy remains available until it is deleted.

### API changes can make a case unavailable

Pinned cases are replayed through the current application configuration. If an API is deleted or renamed after a case is pinned, Workbench marks the case **API gone** and skips it from the plan. Restore the API configuration if the case is still needed, or remove the unavailable case from the set.

### One trace produces one pinned case

A recording can contain an entry request and multiple downstream interactions. Pinning preserves that complete trace as one case; it does not create one test case per dependency call. Pinning the same trace again does not add another copy.

## Related workflow pages

- [Record traffic](/en/testing/recording) — capture cases from real requests.
- [Replay and diff](/en/testing/replay-and-diff) — run cases against a test service.
- [Review diffs](/en/testing/review-diffs-in-the-web-ui) — investigate replay differences.
