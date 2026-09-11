---
title: Gym episodes and training rollouts
---

# Gym episodes and training rollouts

Softprobe can run the **same environment** two ways:

| Mode | Who drives actions | Who scores |
|------|--------------------|------------|
| **Eval** | Softprobe / your harness runs the agent, then **Promptfoo** grades the finished run | Promptfoo (after the episode) |
| **Training** | Your trainer calls `reset` / `step` (or `rollout`) and reads **reward** each step | Environment facts → reward numbers (Promptfoo stays out of the loop) |

This page walks through both the low-level Gym host API and a trainer-friendly session.

```text
seed workspace
      │
      ▼
 create episode → reset → step → step → … → finalize
      │                                      │
      │                                      ├── training: reward_components each step
      │                                      └── eval: Promptfoo on the finished rollout
```

## 1. Host episode API (manual control)

Use this when you want full control: create an episode, reset the world, apply one action at a time, then tear down.

```ts
import { createHostEnvironment } from "@softprobe/gym";
import { mkdirSync } from "node:fs";

// Seed = clean starting files for every episode (can be empty).
mkdirSync("/tmp/softprobe-gym/seed", { recursive: true });

const host = createHostEnvironment({
  runRoot: "/tmp/softprobe-gym/run",   // scratch space for this process
  seedRoot: "/tmp/softprobe-gym/seed", // copied into each episode on reset
});

// Allocate one isolated episode (its own workspace under runRoot).
const { episodeId } = await host.createEpisode({ episodeId: "ep-support-1" });

// Copy seed → working workspace; return the first observation.
const obs0 = await host.reset({ episodeId });

// Apply one agent action (here: a tool call). Your host `onStep` hook
// decides what that means for the workspace / observation.
const step1 = await host.step({
  episodeId,
  action: { type: "tool", name: "crm.get_account", args: { id: "A-42" } },
});

// Optional snapshot of environment state (if capabilities allow).
const ckpt = await host.checkpoint({ episodeId });

// Close the episode and collect terminal artifacts.
const done = await host.finalize({ episodeId });

// Delete episode files when you are finished.
await host.destroy({ episodeId, cleanup: true });
```

| Call | Meaning |
|------|---------|
| `createEpisode` | Reserve an episode id and workspace directory |
| `reset` | Restore the seed world; start (or restart) the episode |
| `step` | Apply one action; get next observation + diagnostics |
| `checkpoint` | Freeze environment state for a later fork (if supported) |
| `finalize` | Mark the episode complete and collect results |
| `destroy` | Release resources |

Capabilities (checkpoint/fork support) are declared up front. Softprobe never infers them from “we used a container.”

## 2. Forking mid-episode (optional)

Sometimes you want a second branch from a point in the episode (retry a bad tool choice, compare two models). Only two fork **paths** are legal:

| Fork path | What it does | Required capabilities |
|-----------|--------------|------------------------|
| `checkpoint_import` | Restore world + import subject state at a checkpoint (no re-run) | `environment_checkpoint` **and** `subject_state_import` |
| `prefix_reexecution` | New episode from seed; replay the first N actions once | `deterministic_prefix_reexecution` |

Anything else fails with `UnsupportedForkError`. Softprobe will **not** restore a mid-episode world and then replay mutating actions against it.

```ts
import { createHostEnvironment, UnsupportedForkError } from "@softprobe/gym";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/softprobe-gym/seed", { recursive: true });
const host = createHostEnvironment({
  runRoot: "/tmp/softprobe-gym/run",
  seedRoot: "/tmp/softprobe-gym/seed",
});

const { episodeId } = await host.createEpisode({ episodeId: "ep-support-1" });
await host.reset({ episodeId });
await host.step({
  episodeId,
  action: { type: "tool", name: "crm.get_account", args: { id: "A-42" } },
});
const ckpt = await host.checkpoint({ episodeId });

try {
  // Needs subject_state_import as well as the checkpoint id.
  await host.fork({
    episodeId,
    path: "checkpoint_import",
    checkpointId: ckpt.checkpointId,
  });
} catch (err) {
  if (err instanceof UnsupportedForkError) {
    // Typical when the subject cannot export/import conversation state yet.
    console.error(err.message);
  }
}

// Usually available without subject import: reset + replay the first action.
const child = await host.fork({
  episodeId,
  path: "prefix_reexecution",
  prefixLength: 1,
});
```

## 3. Training session (walkthrough)

The training session wraps the host for RL-style loops: you supply actions, Softprobe resets/steps for you, and each step can attach **reward components** from environment facts.

**Important:** Promptfoo is **not** called during `step`. Rewards come only from your `rewardFrom` facts. Promptfoo is optional **after** the rollout finishes.

### What the story is

Imagine a support agent that should:

1. Look up CRM account `A-42`
2. Write `refund-note.md`
3. Stop

For a demo/test you feed those three actions as a fixed list (no LLM). A real trainer would replace the list with model/tool outputs each step.

### Step A — create the world

```ts
import {
  createHostEnvironment,
  createTrainingSession,
  rolloutToPromptfooInput,
} from "@softprobe/gym";
import { executePromptfooEval } from "@softprobe/promptfoo-adapter";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/softprobe-gym/seed", { recursive: true });

const host = createHostEnvironment({
  runRoot: "/tmp/softprobe-gym/train",
  seedRoot: "/tmp/softprobe-gym/seed",
});
```

Same idea as section 1: seed = starting files, runRoot = per-episode scratch.

### Step B — open a session and define reward facts

```ts
const session = await createTrainingSession(host, {
  episodeId: "train-A-42",
  rewardFrom: ({ stepResult }) => ({
    checks: [
      {
        name: "note_written",
        passed: Boolean(stepResult.diagnostics?.workspaceHadNote),
      },
    ],
    workspaceDigest: stepResult.diagnostics?.workspaceDigest,
  }),
});
```

| Piece | Role |
|-------|------|
| `episodeId` | Name for this training episode |
| `rewardFrom` | After **each** step, return what the **world** looks like — not a Promptfoo score |

Your callback returns **facts**:

- `checks`: named pass/fail signals (here: “did the refund note exist?”)
- `workspaceDigest`: optional fingerprint of the workspace

Softprobe maps those facts to numeric `reward_components` inside the session (via `mapRewardComponents`). You only call `mapRewardComponents` yourself if you drive `host.step` without `createTrainingSession`.

In production, `workspaceHadNote` would come from your host `onStep` / filesystem adapter (for example: after a write, set a diagnostic when `refund-note.md` exists). The snippet assumes diagnostics already expose that field.

### Step C — run the rollout

```ts
for await (const ev of session.rollout([
  { type: "tool", name: "crm.get_account", args: { id: "A-42" } },
  { type: "tool", name: "fs.write", args: { path: "refund-note.md" } },
  { type: "terminate" },
])) {
  if (ev.type === "step") {
    console.log(ev.stepResult.reward_components);
    // e.g. [{ kind: "check", name: "note_written", value: 1 }]
  }
}
```

`rollout` is an async iterator. Under the hood it:

1. **`reset`** — copy seed into this episode’s workspace  
2. **`step`** action 1 — lookup account → attach rewards → yield `{ type: "step", … }`  
3. **`step`** action 2 — write note → attach rewards → yield  
4. **`step`** terminate — end the episode  

Event types you may see: `reset`, `step`, `terminated`.

This example uses a **scripted** action list so the flow is easy to read. In an RL loop you would yield the next action from your policy instead of hard-coding the array.

### Step D — finalize, then optionally score with Promptfoo

```ts
const result = await session.finalize();

// Post-rollout only — not inside step/rewardFrom
const pfInput = rolloutToPromptfooInput(result);
await executePromptfooEval({
  attemptId: "fatt_train_A-42",
  finalOutput: pfInput.finalOutput,
  trajectoryDigest: pfInput.trajectoryDigest,
  sourceTraceId: pfInput.sourceTraceId,
  assertions: [{ type: "contains", value: "A-42" }],
});
```

| Call | When | Purpose |
|------|------|---------|
| `finalize` | End of training episode | Seal artifacts / terminal state |
| `rolloutToPromptfooInput` | After finalize | Turn the finished rollout into Promptfoo inputs |
| `executePromptfooEval` | After finalize | Benchmark-style grading (separate from step rewards) |

So you get two layers on purpose:

- **During training:** dense rewards from environment checks  
- **After training (optional):** Promptfoo assertions for eval/benchmark comparison  

Softprobe does **not** invent a second assertion DSL for rewards.

### Full example (assembled)

```ts
import {
  createHostEnvironment,
  createTrainingSession,
  rolloutToPromptfooInput,
} from "@softprobe/gym";
import { executePromptfooEval } from "@softprobe/promptfoo-adapter";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/softprobe-gym/seed", { recursive: true });

const host = createHostEnvironment({
  runRoot: "/tmp/softprobe-gym/train",
  seedRoot: "/tmp/softprobe-gym/seed",
});

const session = await createTrainingSession(host, {
  episodeId: "train-A-42",
  rewardFrom: ({ stepResult }) => ({
    checks: [
      {
        name: "note_written",
        passed: Boolean(stepResult.diagnostics?.workspaceHadNote),
      },
    ],
    workspaceDigest: stepResult.diagnostics?.workspaceDigest,
  }),
});

for await (const ev of session.rollout([
  { type: "tool", name: "crm.get_account", args: { id: "A-42" } },
  { type: "tool", name: "fs.write", args: { path: "refund-note.md" } },
  { type: "terminate" },
])) {
  if (ev.type === "step") {
    console.log(ev.stepResult.reward_components);
  }
}

const result = await session.finalize();

const pfInput = rolloutToPromptfooInput(result);
await executePromptfooEval({
  attemptId: "fatt_train_A-42",
  finalOutput: pfInput.finalOutput,
  trajectoryDigest: pfInput.trajectoryDigest,
  sourceTraceId: pfInput.sourceTraceId,
  assertions: [{ type: "contains", value: "A-42" }],
});
```

## 4. Train / eval splits without leakage

When you have many episode ids, split them so training never sees eval ids:

```ts
import { partitionTrainEval, assertNoLeakage } from "@softprobe/gym";

const { train, eval: evalIds } = partitionTrainEval(
  ["ep-1", "ep-2", "ep-3", "ep-4"],
  { trainRatio: 0.75, seed: 7 },
);

assertNoLeakage(train, evalIds); // throws LeakageError if any id appears in both
```

`trainRatio: 0.75` puts about 75% of ids in `train` and the rest in `eval`, using `seed` for a stable shuffle.

## Related

- [Environment bundles and dependency tapes](/en/evaluation/concepts/environment-bundles)
- [Score an episode with Promptfoo](/en/evaluation/guides/score-episode-with-promptfoo)
- [Record and replay an agent environment](/en/evaluation/guides/record-replay-agent-environment)
- [Node packages](/en/evaluation/reference/node-packages)
