---
title: Gym episode 与训练 rollout
---

# Gym episode 与训练 rollout

Softprobe 可以用 **同一套环境** 跑两种模式：

| 模式 | 谁驱动动作 | 谁打分 |
|------|------------|--------|
| **Eval** | Softprobe / 你的 harness 跑 agent，然后 **Promptfoo** 对完成的运行打分 | Promptfoo（episode 结束后） |
| **Training** | 你的 trainer 调用 `reset` / `step`（或 `rollout`），每步读取 **reward** | 环境事实 → reward 数值（Promptfoo 不参与循环） |

本页同时介绍底层 Gym host API，以及面向 trainer 的会话用法。

```text
seed workspace
      │
      ▼
 create episode → reset → step → step → … → finalize
      │                                      │
      │                                      ├── training: 每步 reward_components
      │                                      └── eval: 对完成的 rollout 跑 Promptfoo
```

## 1. Host episode API（手动控制）

当你需要完整控制时使用：创建 episode、重置世界、一次应用一个动作，然后拆除。

```ts
import { createHostEnvironment } from "@softprobe/gym";
import { mkdirSync } from "node:fs";

// Seed = 每个 episode 的干净起始文件（可以为空）。
mkdirSync("/tmp/softprobe-gym/seed", { recursive: true });

const host = createHostEnvironment({
  runRoot: "/tmp/softprobe-gym/run",   // 本进程的临时空间
  seedRoot: "/tmp/softprobe-gym/seed", // reset 时复制进每个 episode
});

// 分配一个隔离的 episode（在 runRoot 下有自己的工作区）。
const { episodeId } = await host.createEpisode({ episodeId: "ep-support-1" });

// 复制 seed → 工作区；返回首次 observation。
const obs0 = await host.reset({ episodeId });

// 应用一次 agent 动作（此处：工具调用）。你的 host `onStep` hook
// 决定这对工作区 / observation 意味着什么。
const step1 = await host.step({
  episodeId,
  action: { type: "tool", name: "crm.get_account", args: { id: "A-42" } },
});

// 可选：环境状态快照（若能力允许）。
const ckpt = await host.checkpoint({ episodeId });

// 关闭 episode 并收集终端产物。
const done = await host.finalize({ episodeId });

// 结束后删除 episode 文件。
await host.destroy({ episodeId, cleanup: true });
```

| 调用 | 含义 |
|------|------|
| `createEpisode` | 预留 episode id 与工作区目录 |
| `reset` | 恢复 seed 世界；开始（或重启）episode |
| `step` | 应用一次动作；得到下一次 observation + 诊断 |
| `checkpoint` | 冻结环境状态以便稍后 fork（若支持） |
| `finalize` | 标记 episode 完成并收集结果 |
| `destroy` | 释放资源 |

能力（checkpoint/fork 支持）需事先声明。Softprobe 绝不会从「我们用了容器」之类事实推断能力。

## 2. 中途 fork（可选）

有时你想从 episode 某一点分出第二条分支（重试糟糕的工具选择、对比两个模型）。只有两条 fork **路径** 合法：

| Fork 路径 | 做什么 | 所需能力 |
|-----------|--------|----------|
| `checkpoint_import` | 在 checkpoint 恢复世界并导入 subject 状态（不重跑） | `environment_checkpoint` **且** `subject_state_import` |
| `prefix_reexecution` | 从 seed 新建 episode；一次性回放前 N 个动作 | `deterministic_prefix_reexecution` |

其他路径一律以 `UnsupportedForkError` 失败。Softprobe **不会**恢复中途世界后再对其重放会变异的动作。

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
  // 除 checkpoint id 外，还需要 subject_state_import。
  await host.fork({
    episodeId,
    path: "checkpoint_import",
    checkpointId: ckpt.checkpointId,
  });
} catch (err) {
  if (err instanceof UnsupportedForkError) {
    // 典型情况：subject 尚不能导出/导入对话状态。
    console.error(err.message);
  }
}

// 通常无需 subject import：reset + 回放第一个动作。
const child = await host.fork({
  episodeId,
  path: "prefix_reexecution",
  prefixLength: 1,
});
```

## 3. 训练会话（演练）

训练会话为 RL 风格循环封装 host：你提供动作，Softprobe 替你 reset/step，每步可从环境事实挂上 **reward components**。

**重要：** `step` 期间 **不会** 调用 Promptfoo。Reward 只来自你的 `rewardFrom` 事实。Promptfoo 是 rollout **结束后** 的可选项。

### 故事是什么

设想一个客服 agent，应当：

1. 查询 CRM 账户 `A-42`
2. 写入 `refund-note.md`
3. 停止

演示/测试时你可以把这三个动作当成固定列表喂入（无 LLM）。真实 trainer 会在每步用模型/工具输出替换该列表。

### 步骤 A — 创建世界

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

与第 1 节相同：seed = 起始文件，runRoot = 每 episode 的临时空间。

### 步骤 B — 打开会话并定义 reward 事实

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

| 片段 | 作用 |
|------|------|
| `episodeId` | 本次训练 episode 的名称 |
| `rewardFrom` | **每** 步之后，返回 **世界** 长什么样 — 不是 Promptfoo 分数 |

你的回调返回 **事实**：

- `checks`：具名 pass/fail 信号（此处：「退款备注是否存在？」）
- `workspaceDigest`：可选的工作区指纹

Softprobe 在会话内把这些事实映射为数值 `reward_components`（经 `mapRewardComponents`）。只有在不用 `createTrainingSession`、直接驱动 `host.step` 时，才需要自己调用 `mapRewardComponents`。

生产中，`workspaceHadNote` 应来自你的 host `onStep` / 文件系统适配器（例如：写入后，当 `refund-note.md` 存在时设置诊断字段）。本片段假定诊断已暴露该字段。

### 步骤 C — 跑 rollout

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

`rollout` 是异步迭代器。底层会：

1. **`reset`** — 把 seed 复制进本 episode 工作区  
2. **`step`** 动作 1 — 查询账户 → 挂上 reward → yield `{ type: "step", … }`  
3. **`step`** 动作 2 — 写备注 → 挂上 reward → yield  
4. **`step`** terminate — 结束 episode  

你可能看到的事件类型：`reset`、`step`、`terminated`。

本例用 **脚本化** 动作列表，便于阅读流程。在 RL 循环中，你会从策略产出下一步动作，而不是硬编码数组。

### 步骤 D — finalize，然后可选地用 Promptfoo 打分

```ts
const result = await session.finalize();

// 仅在 rollout 之后 — 不在 step/rewardFrom 内部
const pfInput = rolloutToPromptfooInput(result);
await executePromptfooEval({
  attemptId: "fatt_train_A-42",
  finalOutput: pfInput.finalOutput,
  trajectoryDigest: pfInput.trajectoryDigest,
  sourceTraceId: pfInput.sourceTraceId,
  assertions: [{ type: "contains", value: "A-42" }],
});
```

| 调用 | 时机 | 目的 |
|------|------|------|
| `finalize` | 训练 episode 结束 | 封存产物 / 终端状态 |
| `rolloutToPromptfooInput` | finalize 之后 | 把完成的 rollout 变成 Promptfoo 输入 |
| `executePromptfooEval` | finalize 之后 | 基准式打分（与逐步 reward 分离） |

因此你有意得到两层：

- **训练期间：** 来自环境检查的稠密 reward  
- **训练之后（可选）：** 用于 eval/基准对比的 Promptfoo 断言  

Softprobe **不会** 为 reward 再发明第二套断言 DSL。

### 完整示例（拼装）

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

## 4. 防止泄漏的 train / eval 划分

当有很多 episode id 时，划分它们，使训练永远看不到 eval id：

```ts
import { partitionTrainEval, assertNoLeakage } from "@softprobe/gym";

const { train, eval: evalIds } = partitionTrainEval(
  ["ep-1", "ep-2", "ep-3", "ep-4"],
  { trainRatio: 0.75, seed: 7 },
);

assertNoLeakage(train, evalIds); // 任一 id 同时出现在两边时抛出 LeakageError
```

`trainRatio: 0.75` 把大约 75% 的 id 放入 `train`，其余放入 `eval`，并用 `seed` 做稳定洗牌。

## 相关

- [环境包与依赖 tape](/zh/evaluation/concepts/environment-bundles)
- [用 Promptfoo 给 episode 打分](/zh/evaluation/guides/score-episode-with-promptfoo)
- [录制与回放 agent 环境](/zh/evaluation/guides/record-replay-agent-environment)
- [Node 包](/zh/evaluation/reference/node-packages)
