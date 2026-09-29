---
title: Review replay diffs
---

# Review replay diffs

After a replay run from [Replay](/en/testing/replay-and-diff), the workbench shows which cases failed and why. This page covers the human review workflow in the **Web console** — reading a diff, and accepting the differences that aren't real bugs. Prefer the command line? `sp replay case list --plan <planId>` and `sp diagnose replay <planId>` yield the same failure data (see [Replay and diff](/en/testing/replay-and-diff)).

For the replay's overall conclusion and causes, and for exporting the report, see [Replay report](/en/testing/replay-report).

Most differences aren't bugs. Timestamps, random tokens, and IDs change on every call — they'll always "differ" without anything being wrong. Your job is to accept those, so the real failures stand out.

## Accept a difference: one-off, or permanent

There are two ways to make a difference stop counting, and picking the right one is the whole game:

- **Mark it passed on this case** — *"In this run, this difference is fine."* Applies now, only to this run. Use it after you've reviewed a case and decided it isn't a real bug.
- **Write a compare rule** — *"From now on, never compare this field."* Permanent, applies to every future replay. Use it for fields that are different by nature (timestamps, random IDs) that should never be compared.

One line to choose: **just changing this run's result → mark it passed; want it to stick forever → write a rule.**

| | Mark passed | Compare rule |
|---|---|---|
| Scope | Just this run | Every replay, from now on |
| Lifespan | One-off — gone on the next replay | Permanent — saved in your policy |
| Use it for | A case you've reviewed and accepted | A field that always changes |

::: tip A rule only applies on the next replay
A compare rule doesn't touch a run that already finished. To apply a new rule to the run you're looking at without replaying, use [Recompare](#recompare-apply-rules-to-this-run).
:::

## Open a case and read its differences

1. Open a **replay run** and pick a **failed case** — the left panel lists them with red dots.
2. **Click a span** in the call tree on the right.

The diff opens: the recorded response on the left, the replayed response on the right. Fields that differ are highlighted; the header shows how many differences the case has.

![Opening a case and inspecting differences walk-through](/img/docs/testing/en/trace-diff-open.gif)

## Ignore a field

**This is the one you'll reach for most.** A field like a timestamp differs on every replay and you never want to compare it.

1. In the diff, **hover the line** that differs. An **eye-off icon** appears at the left edge — click it. (Or right-click the line, or use the **Ignore rules** button at the top.)
2. Choose **Ignore this field's differences**.
3. Pick **This case only**.

The field is struck through, the difference is gone, and the case's pass rate updates.

![Ignoring a field for this case walk-through](/img/docs/testing/en/review-diffs.gif)

### Ignore it more widely

**This case only** fixes just the case in front of you. But a timestamp differs on *every* case, so ignoring it one case at a time is tedious. To stop comparing a field more widely, pick a bigger scope in the same menu:

| Pick | Ignores the field for | Takes effect |
|---|---|---|
| **This case only** | Just this one case | Now |
| **This endpoint only** | Every case of this endpoint | Next replay |
| **All endpoints** | The whole application | Next replay |

The two wider scopes write a **compare rule**, which takes effect on the *next* replay — so the run you're looking at doesn't change yet. Softprobe shows a **Recompare** button to apply it now; see [Recompare](#recompare-apply-rules-to-this-run).

::: tip Ignore every field with the same name
The menu also offers **Ignore all "…" fields** — handy when the same field name (say `updatedAt`) appears in several places and you want them all gone at once.
:::

## Mark a case passed

Sometimes a difference is real but you're OK with it — an intentional change, or a Softprobe artifact. Instead of ignoring fields one by one, accept the **whole case**.

1. On the failed case, click **Mark as passed**.
2. Pick a reason: **Difference is expected (by design)**, or **Softprobe collection/comparison issue**.
3. Optionally add a note, then confirm.

The case moves to passed and the pass rate updates. Your reason and note are kept for later review.

![Marking a case as passed walk-through](/img/docs/testing/en/mark-passed.gif)

## Recompare: apply rules to this run {#recompare-apply-rules-to-this-run}

A rule you just wrote only kicks in on the **next** replay — it doesn't change a run that already finished. **Recompare** applies your latest rules to the run you're looking at now, re-checking its stored responses. It does **not** replay any traffic.

When you add or remove a rule from the diff, a **Recompare** button appears in the run header. Click it. Softprobe re-checks the run and updates the case list, counts, and pass rate together.

![Recompare run walk-through](/img/docs/testing/en/recompare.gif)

::: warning Recompare is not replay
Replay re-sends traffic to your service. Recompare only re-judges responses that are already stored, against your current rules — nothing hits your service.
:::

## Un-ignore a field

Changed your mind? **Right-click the struck-through line** and choose **Un-ignore (restore comparison)**. The field goes back to being compared.

You don't need to remember how you ignored it — Softprobe removes whatever is hiding the difference (the case mark, or the rule) and tells you what it removed. If the rule lives in your global defaults, it points you to the compare-rules page instead of leaving you stuck.

## See what's already ignored

To see everything ignored on a case without opening each span, click the **"N ignored"** chip at the top of the case. A panel lists every ignored field, grouped by call, with the rule that caught it. Hover any row to un-ignore it right there.

![Viewing ignored summary panel walk-through](/img/docs/testing/en/ignored-summary.gif)

## Next

Ignoring the same field on every single case? Time to turn it into a rule → **[Configure compare rules](/en/testing/compare-rules-web-ui)**: configure once, and every future replay stops false-alarming.
