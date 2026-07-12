---
sidebar_label: Work through a failed run
sidebar_position: 2
title: Work Through a Failed Replay Run
description: Open a failed run, find the differences, and accept the ones that aren't real bugs.
---

# Work Through a Failed Replay Run

A run failed. Most of the differences are probably noise — timestamps, random tokens — and you want to clear them so the real problems stand out. This page shows you how, starting with the one thing you'll do most often.

You can:

- [Ignore a field that always differs](#ignore-a-field) — the common case
- [Accept a whole case that's fine](#mark-a-case-passed)
- [Apply a new rule to this run](#recompare-apply-rules-to-an-existing-run) without replaying
- [Undo an ignore](#un-ignore-a-field)
- [See everything already ignored](#reviewing-whats-ignored)

First, get to the differences.

## Open a case and read its differences

1. Open a **replay run** and pick a **failed case** — the left panel lists them with red dots.
2. **Click a span** in the call tree on the right.

The **diff drawer** opens: the recorded response on the left, the replayed response on the right. Fields that differ are highlighted; the header shows how many differences the case has.

<div className="sp-img">
  <img src="/img/docs/replay/trace-diff-open.png" alt="The diff drawer open next to the call tree" />
  <p className="sp-caption">Click a span to open the diff — recorded response (left) next to the replayed response (right).</p>
</div>

## Ignore a field {#ignore-a-field}

**This is the one you'll reach for most.** A field like a timestamp differs on every replay and you never want to compare it.

1. In the diff, **hover the line** that differs. An **eye-off icon** appears at the left edge — click it. (Or right-click the line, or use the **Ignore rules** button at the top.)
2. Choose **Ignore this field's differences**.
3. Pick **This case only**.

The field is struck through, the difference is gone, and the case's pass rate updates. That's it.

<div className="sp-img">
  <img src="/img/docs/replay/ignore-menu.png" alt="The ignore menu" />
  <p className="sp-caption">Hover a differing line, click the eye-off icon, and choose what to ignore and how widely.</p>
</div>

### Ignore it more widely

**This case only** fixes just the case in front of you — good when you've reviewed it and it's fine. But a timestamp will differ on *every* case, so ignoring it one case at a time is tedious. To stop comparing a field everywhere, pick a wider scope in the same menu:

| Pick | Ignores the field for | Takes effect |
| --- | --- | --- |
| **This case only** | Just this one case | Now |
| **This endpoint only** | Every case of this endpoint | Next replay |
| **All endpoints** | The whole application | Next replay |

The two wider scopes write a **compare rule** (see [Fix a verdict vs write a rule](/replay/overview#fix-a-verdict-or-write-a-rule)). A rule takes effect on the *next* replay, so the run you're looking at doesn't change yet — Softprobe shows a **Recompare** button so you can apply it now. See [Recompare](#recompare-apply-rules-to-an-existing-run).

:::tip Ignore every field with the same name
The menu also offers **Ignore all "…" fields** — handy when the same field name (say, `updatedAt`) appears in several places and you want them all gone at once.
:::

## Mark a case passed {#mark-a-case-passed}

Sometimes a difference is real but you're OK with it — an intentional change, or a Softprobe artifact. Instead of ignoring fields one by one, accept the **whole case**.

1. On the failed case, click **Mark as passed**.
2. Pick a reason: **Difference is expected (by design)**, or **Softprobe collection/comparison issue**.
3. Optionally add a note, then confirm.

The case moves to passed and the pass rate updates. Your reason and note are kept for later review.

<div className="sp-img">
  <img src="/img/docs/replay/mark-passed.png" alt="The mark-as-passed form" />
  <p className="sp-caption">Pick a reason and add an optional note.</p>
</div>

## Recompare: apply rules to this run {#recompare-apply-rules-to-an-existing-run}

A rule you just wrote only kicks in on the **next** replay — it doesn't change a run that already finished. **Recompare** applies your latest rules to the run you're looking at now, re-checking its stored responses. It does **not** replay any traffic.

When you add or remove a rule from the diff, a **Recompare** button appears in the run header. Click it. Softprobe re-checks the run and updates the case list, counts, and pass rate together.

<div className="sp-img">
  <img src="/img/docs/replay/recompare-done.png" alt="Recompare done, showing how many cases changed" />
  <p className="sp-caption">After recompare: how many cases turned passing or failing, and the updated pass rate.</p>
</div>

:::note Recompare is not replay
Replay re-sends traffic to your service. Recompare only re-judges responses that are already stored, against your current rules — nothing hits your service.
:::

## Un-ignore a field {#un-ignore-a-field}

Changed your mind? **Right-click the struck-through line** and choose **Un-ignore (restore comparison)**. The field goes back to being compared.

You don't need to remember how you ignored it — Softprobe removes whatever is hiding the difference (the case fix, or the rule), and tells you what it removed. If the rule lives in your global defaults, it points you to the [Compare Rules](/replay/compare-rules) page instead of leaving you stuck.

## See what's already ignored {#reviewing-whats-ignored}

To see everything ignored on a case without opening each span, click the **"N ignored"** chip at the top of the case. A panel lists every ignored field, grouped by call, with the rule that caught it. Hover any row to **Un-ignore** it right there.

<div className="sp-img">
  <img src="/img/docs/replay/ignored-summary.png" alt="The ignored-summary panel" />
  <p className="sp-caption">Every ignored field on the case, with an Un-ignore action on each row.</p>
</div>
