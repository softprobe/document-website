---
title: Replay report
---

# Replay report

Every replay produces a report. Read from top to bottom, it answers three questions: does this replay need attention (the first line is the conclusion); what needs attention, why, and what to do about it (the cards under **Problems**); and what happened to the remaining cases that did not pass (**Cause not established**, **Other results**, and **Replay settings & stats** at the bottom). This page follows the same order.

For the basics of recording, replay and comparison, see [How it works](/en/testing/how-it-works). For working through individual differences (ignoring fields, marking cases passed), see [Review differences](/en/testing/review-diffs-in-the-web-ui).

## Open the report {#open-report}

In the application workbench, open **Replay plans → Run records** on the left, click a run, then switch to the **Report** tab. The **Cases** tab next to it lists every case in this replay.

For a replay triggered from a pipeline (CI), open the report directly from the `reportUrl` returned by the API or from the button in the group notification. See [Replay after deployment](/en/testing/webhook-and-ci).

The page header summarizes the replay:

- **Result tag**: once the analysis is done it reads **Code changes · N problems**, **Cause not established · N cases** or **No problems caused by code changes**. Before there is an analysis result it follows the replay result: **Passed**, **Not passed · N**, **Replay did not complete**, and so on.
- **Duration**, **Pass rate** and the result bar. Pass rate = passed ÷ (passed + with differences + replay failed); in this example, 33 ÷ 50 = 66%. Every case ends in one of three results: **passed**, **with differences** (the replay ran, but the response or the calls differ from the recording), or **replay failed** (no comparable result was produced). The last two together are "not passed".
- **Replay parameters** and **Replay again**: **Replay parameters** shows, read-only, the parameters this replay was created with. **Replay again** runs it once more with the same parameters: it opens a new replay pre-filled with them, and after you confirm it creates a new replay with its own report. It is disabled while this replay is still running. Use it to rerun after a code fix.
- **Export** and **Ask AI**: for export, see [Export the report](#export-report). **Ask AI** opens the conversation for this replay; the AI can see the progress and conclusions of the replay and the analysis, and you can keep asking questions.

![The report header, the conclusion and the first problem](/img/docs/testing/en/report-overview.png)

## Conclusion {#verdict}

A report is produced in three steps: **Replay**, **AI noise reduction** and **AI cause analysis**. AI noise reduction looks for fields that change on every request, such as timestamps and random IDs. Fields it is sure about are ignored automatically; the ones it is less sure about are left as **Suspected noise** for a person to tick. AI cause analysis then examines the cases that still do not pass and judges whether the differences come from code changes. Replays triggered from a pipeline run both steps automatically by default. Manual replays only run noise reduction automatically; start the cause analysis from the report. Scheduled replays do not support automatic analysis yet; start it from the report as well. Change these defaults in [Flow settings](#flow-settings).

The first line of the report is the conclusion. It changes with the progress of the replay and the analysis:

| Situation | Example |
|---|---|
| Analysis finished, problems found | 2 problems caused by code changes; developers need to confirm whether they are expected; 1 not-passed with undetermined causes |
| Analysis finished, no problems from code | No problems caused by code changes were detected in this replay |
| Every problem confirmed by a person | 2 problems confirmed to be expected |
| Analysis running | AI is analyzing causes; the conclusion is still updating |
| Analysis did not finish | So far, 2 problems caused by code changes; developers need to confirm whether they are expected |
| Analysis not started | Cause analysis did not run: today's automatic analyses are used up / Causes not analyzed yet |
| No AI analysis (the Softprobe server is an older version) | 17 cases not passed, 5 kinds of differences to confirm |
| All passed | All 50 cases passed |
| Replay not finished or not completed | Replay in progress / Replay did not finish / Replay did not complete: the replay was interrupted / Replay did not complete: the replay was cancelled / No requests to replay |

**Replay did not finish** means part of the results came out, and what was replayed can be reviewed as usual. **Replay did not complete** means the whole replay was interrupted or cancelled, or there was nothing to replay.

The second line, under the conclusion, also depends on the situation:

- When the analysis is finished, it breaks the not-passed cases down by where they went, for example "50 cases: 33 passed · 17 not passed; of the not-passed, 13 are caused by code changes (see Problems) and 3 are in Other results". Add the 1 case with an undetermined cause from the conclusion and you get 17.
- Before there is an analysis result, it only gives totals, for example "50 cases: 33 passed, 17 not passed". If some cases passed only after noise was ignored, that is stated after the passed count, as in "33 passed (15 after ignoring noise)". While the analysis is running, the totals are followed by a note that causes found so far appear below and can be handled now, with the progress ("x/y cases checked.").
- If the analysis stopped partway, the line is an equation by tier, such as "50 cases: 33 passed, 17 not passed = 9 caused by code changes + 6 cause not established + 2 invalid". In this line the page still says "invalid" for the tier that is otherwise called Other results.
- After cases are marked passed, one more line shows the handling progress: how many problems are confirmed and how many are still waiting. The numbers in the conclusion do not change. They describe what the replay produced (including cases that passed after AI noise reduction) and are not affected by confirmation. Only the wording of the conclusion and this progress line change; the pass rate and the result bar in the header follow the same numbers.

If the analysis stopped partway, a yellow bar appears under the conclusion, for example "AI cause analysis did not finish (the analysis service stopped responding); 3 cases were not analyzed, so the conclusion is incomplete.", with **Analyze again** on the bar. When the conclusion reads "Causes not analyzed yet", **Analyze this replay** sits next to it. When the analysis was skipped for a stated reason, such as the daily limit being used up, start it from the three steps in [Replay settings & stats](#replay-info), which also show the status of each step. A case that has not been analyzed yet is not a case without problems.

The bottom of the report states "Causes and next steps are given by AI, checked by AI, and not manually confirmed." **Analyze again** at the end of that line runs the analysis once more.

::: warning The conclusion is not a release decision
"No problems caused by code changes were detected in this replay" does not mean there are no differences. Cases under **Cause not established** still need a person to investigate, and the AI can be wrong. Whether to release is always decided by people.
:::

## Problems {#problems}

When there is an analysis result, the not-passed cases are listed in three tiers: **Problems** (caused by code changes; developers to confirm), **Cause not established** and **Other results**. This section covers the first tier; for the other two, see [Cause not established and Other results](#other-tiers). In the header result tag, the case drawer title and the exported files, the Problems tier is written as "Code changes". For the **By cause / By difference** switch on the right of the title line, see [By difference](#by-diff).

Each problem is one card. From top to bottom:

- **Number and title**: one sentence that sums up the change, such as "Member price now rounds down; payable is 1 lower". Tags next to the title: **Verified by AI** means the conclusion was re-checked and the code change matches the differences. **AI inference, not verified** means the conclusion is the AI's inference and the code has not been checked yet, so treat it only as a lead. **Judged by AI as a code defect** means the AI considers this a defect that needs a code fix (without this tag, handle the problem as a change to confirm). **includes N merged problems** means N other problems were judged by the AI to have the same cause and were merged into this one.
- **Impact**: for example "Affects 11 cases (36 replayed)". The replayed count is the sum for the endpoints involved (22 for /order/price plus 14 for /order/detail), not the total of the whole replay. If some of the cases failed to replay, that is stated separately: "1 case failed to replay with no result to compare". The AI judges that these failures are also caused by this change.
- **Evidence**: the endpoints involved, the code location, the change commit, and how many fields and paths changed. Paths are counted per value change: each distinct value change of a field counts as one. In this example, `payable` is one field with 4 value changes, shown as "fields: 1 · paths: 4". Click **View code change** to expand the code before and after the change in place; click **View the AI analysis** to see how the AI reached this conclusion.
- **What to do**: "After developers confirm the differences are expected, a user with permission marks them as passed; otherwise developers fix the code and replay again". (For who counts as a user with permission, see [Handle a problem](#handle-a-problem).) If every case under the problem failed to replay, there is no result to confirm: the text becomes "Fix the code and replay again." and the card has no **Mark passed** button.
- **Actions**: **Mark passed (N cases)**, **Copy problem** and **View N cases**. On a card tagged **Judged by AI as a code defect**, **Mark passed** is still there but is no longer the highlighted primary button.

What the card shows as code evidence depends on what the analysis could read:

- The Agent uploaded the packages the application loaded at runtime: the code block is titled "Code running when recorded → code running when replayed", whether or not a code repository is bound. A note says the code is taken from those packages, has no comments, and may use variable names that differ from the source.
- No packages were uploaded, and the analysis read the bound code repository: the evidence line shows the code location and the change commit, and **View code change** expands the code before and after. The screenshots on this page show this form. If the location was found but the commit was not, the card says "The code location was found, but the commit that last changed this line could not be read."
- No code could be read: the card says "The analysis did not read a code repository, so the changed code and commit are not available; the cause was inferred from the response data.", followed by **Bind a code repository**. Bind one and analyze again; see [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis).
- The code was read but the change could not be located: the card says "The analysis did not locate the changed code; the cause was inferred from the response data."

### Handle a problem {#handle-a-problem}

Handling a problem comes down to one loop: a developer confirms whether the change is expected. If it is, mark it passed. If it is not, the developer fixes the code and replays again.

"A user with permission" is not a separate role. Anyone who can sign in and open this application can click **Mark passed**, including the developer. The only exception is anonymous read-only access without signing in, where the buttons that change something are locked.

**Mark passed**: click **Mark passed (N cases)**. The results of those cases change to passed right away, and the card shows "N marked passed" and **Undo**. Once every case is marked, the card collapses into one line. When every problem is confirmed and no case has an undetermined cause, the conclusion becomes "N problems confirmed to be expected". Marking only affects this replay and can be undone at any time.

**Mark passed (N cases)** marks all cases under the problem in one go, with one exception: cases that failed to replay and came in through a merged problem are left out. They have no comparable result and cannot be confirmed in bulk; look at each one in the drawer, then mark it. The card says "N more can be marked individually in the case list on the right". The "case list" here is the drawer opened by **View N cases**, not the **Cases** tab.

The fields under a problem may include noise that has nothing to do with the change and differs on every request. If AI noise reduction suggested ignoring one of those fields and it has not been ignored yet, the primary button becomes **Mark passed and ignore &lt;field&gt; (N)**, with **Mark passed only** next to it. It marks and ignores in one step. The confirmation asks for two things:

- **Duration**: **This replay only** or **Every future replay**.
- **Scope**: **All interfaces of this application**. When the problem involves a single endpoint, there is a second choice that limits the rule to that endpoint, shown as "Only" followed by its name. With **This replay only**, the scope is fixed to all interfaces in this replay, because a one-off ignore cannot be limited to one interface.

Ignoring only writes the rule. Differences on the same field in other cases stop being reported after a [recompare](/en/testing/review-diffs-in-the-web-ui#recompare).

**Copy problem**: copies a ready-made piece of text — title, attribution, endpoints, code location and commit, number of cases, value changes, what to do, and the report link — to paste into a ticket or a chat and hand over to the developer.

**View N cases**: opens a drawer on the right with every case under this problem, grouped by how the response changed (cases with the same value change are in one group). You can search by case ID or value, click a case to see the field-by-field comparison and the call chain, and mark single cases passed. The bottom of the drawer also has the group-level **Mark passed (N cases)** and **Copy problem**.

![The drawer opened by View N cases](/img/docs/testing/en/report-drawer.png)

With more than 3 problems, a checkbox appears on the left of each card so you can select several and copy or mark them in bulk. If those problems also involve more than one endpoint, an endpoint filter appears on the **Problems (N)** line.

### Problem details {#problem-detail}

**Problem details** at the bottom of the card is collapsed by default. Expanded, it contains:

- **Cause**: the AI explains, with one concrete set of data, how the difference came about.
- **How the response changed**: grouped by value change, with one row for each changed field in a group: the field, the recorded value, the replayed value and the number of cases. More than 6 groups are folded; expand to see all.
- **Replay result**: the cases under this problem that failed to replay, listed by error category.
- **Merged problems**: one row for each other conclusion the AI judged to have the same cause and merged into this problem, with the number of cases it originally affected and its check status (**Verified by AI** or **AI inference, not verified**). If both were verified by AI and it was originally classified differently from this problem, the row also says "originally classified as: …". **The AI's reason for merging** can be expanded. These cases are already counted in the card's impact.

![An expanded problem card: the code change and the problem details](/img/docs/testing/en/report-problem-detail.png)

## Cause not established and Other results {#other-tiers}

**Cause not established**: cases whose cause the AI could not confirm. The tier is listed only when it has cases and is expanded by default, because differences without an established cause may well include code problems. A title tagged **AI inference, not verified** is only the AI's guess; treat it as a lead. Expand an item to see the cause (for example "available for the same SKU changed from 12 to 11. No code change related to stock calculation was found in this release, and the data at hand is not enough to establish the cause."), the part that is **Not established**, the differences it produced (click **View difference** for details), how many cases the AI examined in detail, the **Evidence**, and **View the AI analysis**. Cases the analysis has not reached yet are also in this tier, labelled "N more queued", "N not analyzed yet", or "N ended without a conclusion" with the reason.

Once the investigation has an answer: if it is a code problem, fix the code and replay again; if the differences are acceptable, mark the cases passed in the **View N cases** drawer, one by one or all at once with **Mark passed (N cases)** at the bottom; or click **Analyze again** to run the analysis once more. For cases the analysis has not reached, or that ended without a conclusion, the link on that row goes to the **Cases** tab rather than the drawer.

**Other results**: cases where the AI has established that the difference was not caused by a code change (cases that are not established yet are under **Cause not established**). The page uses other names for the same tier: "No problems needing developer action" next to the section title, and "No problems found in the new version" in the endpoint table and the exported files. It is collapsed into one line ("Other results (N cases)") by default, and expanded by default when it contains noise fields waiting to be ticked. Opened, it has one section per conclusion, and a grey line in each states why it is not counted as a problem. The page does not show the category name; match the line against this table:

| Category | Why it is not a problem |
|---|---|
| Suspected noise | Difference from fields that change on every request, judged as noise |
| Configuration | Related to configuration; not counted as a code-change problem |
| Replay failed | Replay did not finish; no comparable result |
| Softprobe issues | Issue in the Softprobe tool, unrelated to the code under test |
| Recording does not fit the new version | The old recording does not apply to the new version; not compared this time |

"Recording does not fit the new version" deserves a note. The difference is caused by a code change, but the new code took a path the recording does not cover, so the comparison could not be completed and the behavior of these endpoints was not verified this time. It needs no manual action: the Agent records automatically, and once the new version is running and requests reach these endpoints, later replays use the new recordings.

For two of the other categories: with **Configuration**, adjust the configuration and replay again; with **Replay failed**, check the service under test first and replay again once it is back. Its note says these endpoints were not verified this time. A **Replay failed** section has a **View logs** link when it carries a representative case (one case picked as a sample). Every section ends with **View N cases**, and with **View the AI analysis** when the conclusion has an analysis session. This tier needs no action from developers and has no group-level **Mark passed**; single cases can still be marked in the drawer.

Suspected noise fields are ticked and ignored here, with the same controls as in [By difference](#by-diff).

![Cause not established and Other results](/img/docs/testing/en/report-other-tiers.png)

## By difference {#by-diff}

**By cause** is the main way to work through problems. Click **By difference** at the top right of the problems area for another angle: where the AI filed each kind of difference. The title of this area on the page changes to **Differences**. Differences on the same field, or with the same error, count as one kind, and the kinds are grouped by type: **Differences in detail** (field differences in the endpoint response), **Downstream call differences** (calls to the database, Redis or downstream services that differ from the recording; when every one of them is a call that was not made during replay, the group is named **Downstream calls not made**), **Replay failed** and **Suspected noise**. Empty groups are not shown. When there is no AI analysis result (nothing was analyzed, or the Softprobe server is an older version), this is the only listing the report has.

Rows in **Differences in detail** carry a tag showing where they went: "Problem 01", "Other results" or "Cause not yet determined", matching the problems under **By cause**. Fields in **Suspected noise** come from three sources: fields the AI cause analysis judged as noise; fields AI noise reduction considered noise-like but did not ignore automatically; and fields whose name or values look like common noise, such as timestamps, IDs and thread names (this applies to a field that has no verdict from AI noise reduction).

![By difference](/img/docs/testing/en/report-by-diff.png)

Field rows have checkboxes. After you select one or more fields, the action bar at the bottom offers two ways to ignore them:

- **Ignore for this replay**: applies to this replay only.
- **Ignore permanently (N)**: writes the fields into the application's [diff rules](/en/testing/compare-rules-web-ui), so they are no longer compared in any future replay.

Selecting a parent path also selects every child path under it, and the page lists what is included. Ignoring only writes the rule; the result of this replay does not change yet. Click **Recompare now** on the success message, and the related cases turn to passed after the recompare. The line on the page, "Once confirmed and ignored, the related cases pass", is shorthand for this.

## Replay settings & stats {#replay-info}

**Replay settings & stats** sits at the bottom of the report, collapsed by default. Expanded, it contains:

- **The settings of this replay**: the replay target (with who started it), the traffic source (recording time range; all endpoints or selected endpoints), downstream handling and duration. When **Downstream** shows "Responses fixed to the recorded values", the database, Redis, HTTP and system time all use the recorded values. When it shows "Real downstream calls", these dependencies are really called.
- **Endpoints with failures**: for each endpoint, the replayed, passed and not-passed counts. With an analysis result, the not-passed count is broken down by tier, as in "9 (code changes 9)". Click **View cases** to go to the case list. Endpoints where everything passed are folded into one line.
- **The three steps**: the status of Replay, AI noise reduction and AI cause analysis, with the duration of the replay and of the analysis, including how many kinds of noise were ignored and how many cases pass as a result. After the replay completes you can **Start noise reduction** or **Analyze this replay** here, or **Run noise reduction again** and **Analyze again**. For **Flow settings** at the bottom right, see [Flow settings](#flow-settings).
- **Ignored noise**: see below.
- **Code version**: the branch and commit the AI read during the analysis, as in "The analysis read release/2.4 · 7c1e2ab (2026-09-29 10:34)." Softprobe does not check that this version is the code the service under test actually runs; the page says "Whether the replayed service runs the same code was not checked". When the analysis read code restored from the uploaded packages, the line reads "Code running when replayed" instead, without that note. When no code version was recorded or there is no analysis, it shows "The code version used by the analysis was not recorded".

![Replay settings & stats, expanded](/img/docs/testing/en/report-info.png)

### Ignored noise {#ignored-noise}

When some differences were ignored in this replay, **Ignored noise** appears inside **Replay settings & stats**. Its title line is a summary: how many kinds of differences the AI ignored for this replay only, how many cases passed as a result, and how many kinds and differences the configured rules skipped. Expanded, it has two kinds of rows:

- **Fields ignored automatically by AI**: one row per field, with the reason the AI gave. They are ignored in this replay only. Each row ends with **Ignore permanently** and **Undo**. **Ignore permanently** writes the field into the application's [diff rules](/en/testing/compare-rules-web-ui) (for the whole application; or for one endpoint only, when the difference occurs on a single endpoint), so it is no longer compared in any future replay. **Undo** puts it back into the comparison. The AI never changes diff rules on its own; ignoring permanently is always done by a person.
- **Differences skipped by diff rules**: tagged **Configured rule**, with the number of times they were skipped. A field ignored automatically by AI also shows up here once more as a rule, so the same field can be listed in two rows, and the configured-rules figure in the summary includes it.

The **Overview** sheet of the export counts these differences in another way, as in "Differences ignored by configured rules (not counted) 2 kinds, at least 22 cases": it leaves out the fields ignored automatically by AI and counts cases rather than occurrences. It does not contradict the 3 kinds and 59 differences shown on the page.

![Ignored noise](/img/docs/testing/en/report-ignored-noise.png)

## Flow settings {#flow-settings}

Click **Flow settings** at the bottom right of the three steps in **Replay settings & stats**. The settings apply to the whole application and take effect from the next replay; replays that are already finished are not affected. To run a step for a finished replay, start it manually from the three steps.

![Flow settings](/img/docs/testing/en/report-flow-settings.png)

| Setting | Default | Notes |
|---|---|---|
| Reduce noise automatically after each replay | On | |
| Daily noise reduction limit | 50 | Set to 0 to stop automatic noise reduction |
| Model for noise reduction | Default model | Only lists models that are connected and available |
| Analyze causes automatically after noise reduction: Replays triggered by CI | On | |
| Analyze causes automatically after noise reduction: Manual replays | Off | When off, click **Analyze this replay** in the report |
| Automatic analyses per day | 10 | Analyses started manually do not count; set to 0 to stop automatic analysis |
| Model used for analysis | Default model | Only lists connected models that use your own credentials |

Also:

- The noise reduction settings and the analysis settings are saved separately.
- Noise reduction and analysis both run on the server with the models set here, regardless of the model chosen in the chat box.
- To connect a model or bind a code repository, see [Set up AI diagnosis and code repositories](/en/testing/installation/ai-diagnosis).

## Export the report {#export-report}

To archive the report, present it, or post it to a group, click **Export** in the page header.

![The export menu](/img/docs/testing/en/report-export-menu.png)

| Menu item | Contents | Good for |
|---|---|---|
| Download Excel | A filterable .xlsx; every row links back to the platform | Archiving, checking item by item |
| Print / Save as PDF | A fixed A4 layout; save it as a PDF from the browser's print dialog | Presenting |
| Copy summary | The conclusion and the 5 pending diffs with the largest impact, with a link to the full report; copied as both plain text and rich text | Chat, email |
| Copy Markdown | The report with tables: conclusion, problems, differences and endpoint statistics, without individual cases | Tickets, documents |
| Copy link | The address of the current page, including filters | Sending to a colleague |

While the replay is queued or running, **Download Excel** and **Print / Save as PDF** are unavailable ("Available after the replay finishes"). The three copy items work, with the progress at that moment.

### What's in the Excel file {#excel}

The Excel file has 5 sheets: Overview, Pending diffs, Ignored diffs, Endpoints and Case details. When there is an AI analysis record, a Problems sheet is added, for 6 in total.

| Sheet | Contents |
|---|---|
| Overview | The conclusion, the numbers, the settings of this replay and what this export covers. The conclusion is written by case count and worded differently from the page, as in "13 caused by code changes, to be confirmed or fixed by the developer, 3 found no problems in the new version, another 1 with cause not established" |
| Problems | The problems found by the AI analysis, matching the cards in the report. The Checked column reads "Verified by AI", "AI inference, not verified" or "From the error text". A merged problem follows the problem it was merged into, on the next row, and is not counted separately |
| Pending diffs | Sorted by the number of cases affected; every row links to the platform |
| Ignored diffs | Where the ignore came from (AI noise reduction or a rule), the reason, the scope, and whether it is still in effect |
| Endpoints | Passed, with-differences and replay-failed counts per endpoint |
| Case details | By default only cases with differences or replay failures. Tick **Excel includes passing cases** at the bottom of the menu to include every case, up to 20,000 |

::: tip Incomplete data is flagged
When there are too many differences and only the ones with the largest impact are listed, when some cases could not be fetched, or when the case count does not match the statistics, the **Overview** sheet says so. If some cases could not be fetched, the page also shows a notice with **Export again**.
:::

![The Overview sheet](/img/docs/testing/en/report-export-excel.png)

### The printed version {#print}

The printed version uses a fixed A4 layout. It contains the conclusion, the replay details, the problems (when there is an AI analysis; all three tiers are listed, each with its tier name, such as "Code changes:", "Cause not established:" and "Other results · Suspected noise:"), the pending diffs (only the first 20; the rest point to the platform), the ignored diffs, the endpoints with problems, and what this export covers. Individual case details are only in the Excel file.

![The first printed page](/img/docs/testing/en/report-export-print.png)

## Next steps

- [Review differences](/en/testing/review-diffs-in-the-web-ui): go through differences one by one, mark cases passed or ignore fields.
- [Diff rules](/en/testing/compare-rules-web-ui): turn fields that change on every request into ignore rules.
- [Replay after deployment](/en/testing/webhook-and-ci): replay automatically after a deployment and let the conclusion decide whether the pipeline continues.
