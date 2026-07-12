---
sidebar_label: Overview
sidebar_position: 1
title: Replay Comparison Overview
description: Understand how SoftProbe compares replay responses against recorded baselines, and the difference between fixing a single case's verdict and writing a compare rule.
---

# Replay Comparison Overview

When you replay recorded traffic, SoftProbe compares each replayed response against the recorded baseline field by field. Every field that differs becomes a **difference**, and a case is marked **failed** if it has any difference left after the compare rules run.

Most differences are not real regressions — timestamps, random tokens, trace IDs, and other volatile fields change on every call. This section explains how to tell SoftProbe which differences to ignore, and the one distinction that governs everything: **fixing a verdict** versus **writing a compare rule**.

## The two things you can do with a difference {#the-two-things-you-can-do-with-a-difference}

There are exactly two ways to make a difference stop counting. They look similar in the UI but behave very differently — knowing which is which is the key to using replay comparison well.

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Fix a verdict</h3></div>
      <div className="card__body">
        Accept a difference on <strong>one specific case</strong>. Applies immediately, and expires the next time you replay that case. Does not touch any configuration.
        <br /><br />
        <em>"This one case is fine — I've looked at it."</em>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Write a compare rule</h3></div>
      <div className="card__body">
        Configure the comparison for <strong>an endpoint or the whole application</strong>. Takes effect on the <strong>next replay</strong>, and persists in your configuration.
        <br /><br />
        <em>"This field always changes — never compare it."</em>
      </div>
    </div>
  </div>
</div>

### Side by side

| | Fix a verdict | Write a compare rule |
| --- | --- | --- |
| **Scope** | This case only | This endpoint, or the whole application |
| **In the ignore menu** | "This case only" (under **Applies now**) | "This endpoint only" / "All endpoints" (under **Compare rule · next replay**) |
| **When it takes effect** | Immediately | Next replay |
| **After you replay again** | Expires — the fresh result is judged from scratch | Persists — the rule keeps applying |
| **Affects other cases in this run** | No | Not until you re-run or **recompare** |
| **Where it lives** | On the compare result row | In the application's compare-rule policy |

:::info Why the split matters
A verdict fix changes one case's result the moment you click. A compare rule changes *configuration* — it does not touch the current run at all, so the run stays internally consistent (the list, the pass rate, and the drawer never disagree). If you want the current run to reflect a new rule right away, use **[Recompare](/replay/trace-view#recompare-apply-rules-to-an-existing-run)** — it re-judges the run's stored responses against the current rules without replaying any traffic.
:::

## Recompare is not replay

Two operations re-evaluate a run, and they are easy to confuse:

- **Replay** re-sends recorded traffic to the target environment and records fresh responses. It exercises your service.
- **Recompare** re-judges the responses **already stored** from a previous replay, against the **current** compare rules. It never contacts the target environment — it only recomputes which stored differences still count.

You reach for recompare after adding or removing a compare rule, when you want to see its effect on a run that has already finished. See [Recompare](/replay/trace-view#recompare-apply-rules-to-an-existing-run).

## Where to go next

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Trace view</h3></div>
      <div className="card__body">
        Read differences in the diff drawer, ignore fields, mark a case passed, recompare a run, and review what's already ignored.
        <br /><br />
        <a href="/replay/trace-view">Open the trace view guide →</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Compare rules reference</h3></div>
      <div className="card__body">
        Every rule type — exclude paths, ignore categories, CEL rules, arrays, transforms, and more — documented down to each field, for both the visual and YAML editors.
        <br /><br />
        <a href="/replay/compare-rules">Open the compare rules reference →</a>
      </div>
    </div>
  </div>
</div>
