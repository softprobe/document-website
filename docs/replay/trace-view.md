---
sidebar_label: Trace View Guide
sidebar_position: 2
title: Reading and Resolving Differences in the Trace View
description: A complete walkthrough of the replay trace view — reading the diff, ignoring fields, fixing a case verdict, recomparing a run, cancelling an ignore, and reviewing what's already ignored.
---

# Reading and Resolving Differences in the Trace View

Open a replay run, click a failed case, and you land in the trace view: a call tree on the left and, when you select a span, a **diff drawer** on the right showing the recorded response (baseline) next to the replayed response (this run). This guide covers everything you can do there.

If you have not yet read the difference between **fixing a verdict** and **writing a compare rule**, start with the [Overview](/replay/overview#the-two-things-you-can-do-with-a-difference) — the rest of this page assumes it.

## Getting to a difference

1. Open a **replay run** from the Replay list.
2. Pick a **failed case**. The left panel filters by **Failed / Invalid / Passed** — the failed cases are listed with red dots.
3. The **call tree** appears on the right: the entry span plus its downstream calls (database, HTTP client, and so on).

<div className="sp-img">
  <img src="/img/docs/replay/trace-caselist.png" alt="The failed case list and the call tree" />
  <p className="sp-caption">Step 1–3: the failed case list (left, filterable) and the call tree of the selected case (right).</p>
</div>

4. **Click a span** in the tree. The **diff drawer** opens on the right, showing the recorded response next to the replayed response.

<div className="sp-img">
  <img src="/img/docs/replay/trace-diff-open.png" alt="The diff drawer open next to the call tree" />
  <p className="sp-caption">Step 4: clicking a span opens the diff drawer — recorded response (baseline) on the left, replayed response (this run) on the right.</p>
</div>

From here you read the diff and decide what to do with each difference. The rest of this guide covers each action.

## Reading the diff

Each selected span opens a two-pane diff:

- **Left — Recorded response (baseline)**: what was captured during recording.
- **Right — Replayed response (this run)**: what the service returned during replay.

The header on the right pane summarizes the comparison:

- **`N differences`** — fields whose values differ and still count. Click the **↑ / ↓** arrows next to it to jump between differences one at a time.
- **`N ignored`** — fields that differ but matched an ignore rule, so they do not count. Click it to open a small panel listing each ignored field and the rule that caught it. See [Reviewing what's ignored](#reviewing-whats-ignored).

Ignored fields are shown **struck through on both panes** — recorded and replayed — with a grey strikethrough. Both sides are struck so it is clear the field is fully out of the comparison, not just on one side. Hovering a struck-through line shows **"Ignored by rule: `{rule name}`"**.

<div className="sp-img">
  <img src="/img/docs/replay/diff-ignored.png" alt="Diff with an ignored field struck through on both panes" />
  <p className="sp-caption">An ignored field is struck through on both the recorded and replayed panes, and the header shows both the difference count and the ignored count.</p>
</div>


:::note Category-ignored calls
If an entire downstream dependency type is ignored (for example all Redis or all Database calls, via an [ignore category](/replay/compare-rules#ignore-categories-by-dependency-type)), the drawer shows a grey chip **"Entire category ignored"** instead of per-field strikethroughs. Category ignores are resolved whole, so there are no individual field differences to strike through.
:::

## Ignoring a field {#ignoring-a-field}

You ignore a field's difference from inside the diff. There are two ways to open the ignore menu:

1. **Hover the differing line.** An **eye-off icon** appears in the gutter. Click it.
2. **Right-click the line**, or click the **Ignore rules** button at the top of the right pane (it acts on the line your cursor is on — if you have not clicked a field line yet, it prompts *"Click the field line you want to ignore in the diff first"*).

The menu shows the field's path at the top, then two ignore actions:

- **Ignore this field's differences** — ignores exactly this path (for example `/data/downstreamToken`).
- **Ignore all "`{name}`" fields** — ignores every field with that leaf name anywhere in the response (there may be several).

<div className="sp-img">
  <img src="/img/docs/replay/ignore-menu.png" alt="Ignore menu with scope submenu" />
  <p className="sp-caption">The ignore menu, with the scope submenu grouped into "Applies now" (This case only) and "Compare rule · next replay" (This endpoint only / All endpoints).</p>
</div>


Each action opens a **scope submenu** grouped into two sections that spell out when the ignore takes effect:

| Group | Scope | What it does |
| --- | --- | --- |
| **Applies now** | **This case only** | Fixes this one case's verdict immediately. Expires when you replay the case again. Does not touch configuration. |
| **Compare rule · next replay** | **This endpoint only** | Writes a rule scoped to this endpoint. Takes effect on the next replay. |
| | **All endpoints** | Writes a rule scoped to the whole application. Takes effect on the next replay. |

### What happens after you pick a scope

- **This case only** — the field is accepted on this case right away: it is struck through, the difference count drops, and the case's status and the run's pass rate update. A toast confirms *"Ignored field `{path}` (This case only)"* with an **Undo** action for 8 seconds.
- **This endpoint only / All endpoints** — a rule is written to your configuration, but **the current run is not changed** — the field is *not* struck through here, because the rule only takes effect on the next replay. A toast confirms *"Rule added: ignore `{path}` (`{scope}`) · takes effect next replay"* with a **Recompare now** action. Click it (or the header button) to apply the rule to this run — see [Recompare](#recompare-apply-rules-to-an-existing-run).

<div className="sp-img">
  <img src="/img/docs/replay/rule-added-toast.png" alt="Rule-added toast and the Recompare button in the header" />
  <p className="sp-caption">After an endpoint/application ignore: the toast confirms the rule takes effect next replay (with a Recompare now shortcut), the run's pass rate is unchanged, and a "Rules changed · recompare" button appears in the header.</p>
</div>

:::tip Why the endpoint/app ignore doesn't change what you're looking at
This is intentional. A compare rule is configuration for the *next* replay, so it leaves the current run untouched and internally consistent. To see its effect on the current run, recompare.
:::

## Marking a whole case as passed

Sometimes a case's difference is real but acceptable — a deliberate behavior change, or a SoftProbe collection artifact. Rather than ignore individual fields, you can accept the **entire case**.

On a failed case, click **Mark as passed**. A small form asks for:

- **Reason** (required, pick one):
  - **Difference is expected (by design)** — the change is intentional.
  - **SoftProbe collection/comparison issue** — the difference is a tooling artifact, not a real change.
- **Note** (optional) — free text, kept on the record for audit.

Confirm, and the case moves from the failed bucket into the passed bucket; the pass rate updates immediately. This is a per-case verdict (it does not write any rule and does not affect other cases), and the reason and note are stored for later review.

<div className="sp-img">
  <img src="/img/docs/replay/mark-passed.png" alt="The mark-as-passed form" />
  <p className="sp-caption">The Mark as passed form: pick a reason (by design, or a SoftProbe issue) and add an optional note.</p>
</div>


## Recompare — apply rules to an existing run {#recompare-apply-rules-to-an-existing-run}

A run's results are computed and stored when the replay finishes. Endpoint and application compare rules take effect on the **next** replay — they do not retroactively change a finished run. **Recompare** bridges that gap: it re-judges the run's already-stored responses against the **current** rules and rewrites the run's statistics. It does **not** replay any traffic.

When you add or remove an endpoint/application rule from the diff, a **Recompare** control appears in the run header. It has four states:

| State | Appearance | Meaning |
| --- | --- | --- |
| Rules changed | **Rules changed · recompare** (clickable) | You changed a rule; click to apply it to this run. |
| In progress | **Recomparing `{done}` / `{total}`** (spinner) | Re-judging the run's rows. |
| Done | **Recompare done: `{passed}` now passing, `{failed}` now failing** | Finished; the list, counts, and pass rate have synced. |
| Failed | **Recompare failed, click to retry** | Something went wrong; hover for details, click to retry. |

When there is nothing to recompare, the control is hidden — it never nags you while you are just reading results.

Clicking it re-judges every non-exception row in the run against the current rules, then rewrites the per-endpoint pass/fail counts. When it finishes, the case list, counts, and pass rate all update together, and any diff drawer you have open re-draws its strikethroughs to match.

<div className="sp-img">
  <img src="/img/docs/replay/recompare-done.png" alt="Recompare done state in the run header" />
  <p className="sp-caption">When recompare finishes, the header shows how many cases turned passing or failing, and the pass rate updates.</p>
</div>


:::info The Recompare now shortcut
Every "rule added / removed" toast includes a **Recompare now** action — a shortcut to the same operation, so you can apply a rule immediately without hunting for the header button.
:::

## Cancelling an ignore

To restore comparison for a field you previously ignored, right-click its struck-through line and pick **Un-ignore (restore comparison)** — the rule name that caught it is shown as a subtitle.

You do not need to remember how the field was ignored. SoftProbe tries the narrowest scope first and widens automatically:

1. **This case** — if the field was fixed on this case, that mark is removed and the difference returns immediately.
2. **The rule** — otherwise the quick rule that caught it is deleted (by path first, then by field name). The narrowest matching rule (endpoint before application) is removed, and a toast tells you which scope was affected: *"Rule removed: `{target}` (`{scope}`) · takes effect next replay"*, again with a **Recompare now** action.

If no quick rule is found (it may have been removed elsewhere, or it lives in the global default policy), SoftProbe tells you so and points you to the **[Compare rules](/replay/compare-rules)** page — it never leaves you stuck clicking a strikethrough that will not clear.

:::note Un-ignore deletes the original rule
Cancelling an ignore removes the rule that created it — it does not stack a counter-rule on top. This keeps your configuration clean and reversible.
:::

## Reviewing what's ignored {#reviewing-whats-ignored}

You do not have to open every span to find out what has been ignored on a case. The trace header shows a **"N ignored"** chip whenever the case has any ignored fields. Click it to open a summary panel titled **"N ignored in this case"** that lists, grouped by call, every ignored field with:

- the field **path**,
- the **rule** that caught it — shown as **"This case only"** for a per-case verdict fix, or the rule name (falling back to "compare rule") for a configured rule.

<div className="sp-img">
  <img src="/img/docs/replay/ignored-summary.png" alt="The case-level ignored summary panel" />
  <p className="sp-caption">The ignored summary panel: every ignored field on the case, grouped by call, with the rule that caught it and a per-row Un-ignore action.</p>
</div>


Hover any row and a **Un-ignore** action appears, so you can restore a field to comparison straight from the summary — without opening its span's diff. Because that span's drawer is usually closed, cancelling from here recomputes that row on the spot so the summary stays accurate.

## Quick reference — every action

| Action | Where | What it changes | When it applies |
| --- | --- | --- | --- |
| Ignore this field's differences → This case only | Diff line menu | This case's verdict | Immediately (expires on re-replay) |
| Ignore this field's differences → This endpoint / All endpoints | Diff line menu | A compare rule | Next replay (or recompare) |
| Ignore all "`{name}`" fields → *(any scope)* | Diff line menu | Same as above, for every same-named field | Same as above |
| Mark as passed | Case header (failed cases) | The whole case's verdict | Immediately |
| Recompare | Run header | Re-judges the run vs current rules | Immediately (no replay) |
| Un-ignore | Struck-through line / summary panel | Removes the case mark or the rule | Immediately (case) / next replay (rule) |
