---
title: Review differences
---

# Review differences

After a replay, the [replay report](/en/testing/replay-report) gives the overall verdict and the causes of the differences. This page covers going through one case's differences, and what to do with differences that aren't bugs: ignore a field, or mark the case as passed.

Most differences aren't bugs. Timestamps, serial numbers and random IDs differ on every replay without anything being wrong. Deal with those and the real problems stand out.

## Open a case {#open-a-case}

In the replay report, switch to **Cases**. The left side lists cases by endpoint; show only those with differences, those whose replay failed, or those that passed, or search by endpoint, description or case ID. Click a case to see its details on the right.

![Case list and diff view](/img/docs/testing/en/case-diff.png)

At the top of a case:

- The endpoint and its result (such as a value difference). For cases the AI has analysed, the next line is its conclusion; **View in report** jumps back to that place in the report.
- Buttons on the right: **Mark as passed**, **Replay this one** (creates a new plan with just this recording; this plan is untouched), **Pin this case**, **View case logs**, view the full span tree and recorded data, and **Ask AI about this case**.

Below that, the entry and each dependency call of the request are listed in call order, each with:

- **Source**: whether this call was answered from the recording in this replay, or made for real.
- **Comparison**: a value difference, not compared, no conclusion, and so on.

**Differences only** hides calls without differences. The **N ignored** chip sums up the fields on this case that ignore rules held back.

## Read a difference {#read-a-diff}

Click a call with differences to open the diff view: **Recorded response · baseline** on the left, **Replayed response · this run** on the right. Values that differ are highlighted; fields held back by an ignore rule are struck through and don't count.

The top shows how many differences the call has; the up and down arrows move between them.

## Ignore a field {#ignore-a-field}

The most common action. A field such as a timestamp changes every time and shouldn't be compared at all.

1. Hover over the differing line and click the ignore icon that appears beside it, or select the line and click **Ignore rules** at the top right.
2. In **Ignore diff**, check which field you're ignoring: **By path** (for example the second element of `payable`), or **By field name** (every field with that name).
3. Pick a scope:

![Scopes for ignoring a difference](/img/docs/testing/en/ignore-menu.png)

| Scope | Ignored where | Takes effect |
|-------|---------------|--------------|
| Only this case | This case only | Now |
| This endpoint · downstream excluded | Every case of this endpoint, entry response only | Next replay |
| This SQL / Redis command / downstream endpoint … · any caller | This dependency call, whichever endpoint called it | Next replay |
| Whole app | Every case of the application | Next replay |

**Only this case** changes only this verdict. The other three write a [diff rule](/en/testing/compare-rules-web-ui) that applies to every future replay; to see it on a replay that has already finished, [recompare](#recompare).

## Mark a case as passed {#mark-passed}

Sometimes the difference is real but acceptable: an intended change, or a problem in SoftProbe's own recording or comparison. Instead of ignoring fields one by one, accept the whole case.

1. Click **Mark as passed** at the top of the case.
2. Pick a reason: **Difference is expected (by design)** or **SoftProbe recording/compare issue**.
3. Add a note if you like, and click **Confirm**.

Only this case's verdict changes; it counts towards the pass rate, and the reason and note are kept.

The **By cause** cards in the report can mark a group of cases at once; see [Replay report](/en/testing/replay-report).

## Ignore, or mark as passed? {#ignore-or-mark}

| | Mark as passed | Ignore a field (as a diff rule) |
|---|---|---|
| Covers | This case in this replay | The same kind of field in every future replay |
| Use for | A case you've looked at and accept | A field that changes every time by nature |

In short: to change this one verdict, mark it as passed; to never see it again, ignore the field.

## Recompare {#recompare}

A new diff rule applies from the next replay on; it doesn't change a replay that has already finished. To see its effect now without replaying:

After you add or remove a rule, **Rules changed · recompare** appears at the top of the replay. Click **Recompare now**: SoftProbe re-checks the results this replay already stored against the latest rules, then tells you how many cases turned into passes and failures, and updates the case list, counts and pass rate.

::: warning Recompare isn't replay
Recompare only re-judges the stored responses under the new rules. Nothing is sent to your service.
:::

## Stop ignoring {#unignore}

Changed your mind: on a struck-through field, click **Stop ignoring** and it's compared again. SoftProbe removes whatever held it back — the rule or the mark — and tells you what it removed. If the rule is one of the global defaults, you're pointed to the diff rules page.

## See what a case ignores {#ignored-summary}

Click the **N ignored** chip on a case: a panel lists every ignored field by call, and the rule that held it back. You can stop ignoring from there too.

## Next {#next}

Ignoring the same field on many cases? Make it a rule: [Diff rules](/en/testing/compare-rules-web-ui).
