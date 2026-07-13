---
title: Replay Comparison Overview
description: What to do when a replay run reports differences — and how to tell a one-off fix from a permanent rule.
---

# Replay Comparison Overview

When you replay recorded traffic, Softprobe compares each response against what was recorded, field by field. Any field that doesn't match is a **difference**, and a case with differences is marked **failed**.

Most differences aren't real bugs. Timestamps, random tokens, and IDs change on every call — they'll always "differ" without anything being wrong. Your job is to tell Softprobe which differences to ignore. There are two ways to do that, and picking the right one is the whole game.

## Fix a verdict, or write a rule {#fix-a-verdict-or-write-a-rule}

Say a field differs but you've decided it's fine. You can accept it in one of two ways:

- **Fix the verdict** — *"In this run, this difference is actually fine."* It applies right now and only to this run. Use it when you've looked at a case and decided it isn't a real bug.
- **Write a compare rule** — *"From now on, never compare this field."* It's permanent and applies to every future replay. Use it for fields that are different by nature — timestamps, random IDs — that should never be compared.

One line to choose: **just changing this run's result → fix the verdict; want it to stick forever → write a rule.**

| | Fix the verdict | Write a compare rule |
| --- | --- | --- |
| **Scope** | Just this run | Every replay, from now on |
| **Lifespan** | One-off — gone on the next replay | Permanent — saved in your config |
| **Use it for** | A case you've reviewed and accepted | A field that always changes |
| **Where you do it** |  On the difference, while reading a run |  While reading a run, or on the Compare Rules page |

::: tip They work together
A compare rule doesn't touch runs that already finished — it only kicks in on the next replay. If you write a rule and want to see its effect on the run you're looking at now, use **[Recompare](/en/testing/replay/handle-failed-run#recompare-apply-rules-to-an-existing-run)**: it re-checks the current run against your latest rules, without replaying anything.
:::

## Where to go next

- **[Work through a failed run](/en/testing/replay/handle-failed-run)** — open a run, read the differences, and accept the ones that are fine.
- **[Compare rules reference](/en/testing/replay/compare-rules)** — every kind of rule you can set, and how to set it.
