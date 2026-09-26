---
title: 录制与回放 agent 环境
---

# 录制与回放 agent 环境

用 Softprobe 的 Node 语义 agent **录制**真实运行中的依赖交互，再 **回放**它们，让 agent 可以走不同的推理路径，而不再打到线上工具。

本指南用一个小型 CRM 风格工具。同一模式适用于 MCP、HTTP 客户端、文件系统与子进程。

## 前置条件

这些包随 Softprobe LLM 工作区（`sp-llm`）提供。尚未发布到公共 npm registry — 请对着工作区包开发：

```bash
cd sp-llm
pnpm install
# import from workspace packages, e.g. @softprobe/agent
```

预加载会注册类别模块（若只调用 API 则可选）：

```bash
node --import @softprobe/agent/register your-app.mjs
```

Softprobe 凭证（`SOFTPROBE_*`、OTLP）留在 `@softprobe/tracing` — agent 包 **不会** 解析它们。

## 步骤 1 — 录制一次工具调用

```ts
import {
  withEpisode,
  wrapToolCall,
  emptyTape,
  saveTape,
  buildClosureReport,
  saveClosureReport,
  getEpisodeContext,
} from "@softprobe/agent";
import path from "node:path";
import fs from "node:fs";

const episodeRoot = path.join("/tmp/softprobe-episodes", "crm-refund-001");
fs.mkdirSync(episodeRoot, { recursive: true });

async function getAccount(id: string) {
  // Real CRM in record mode
  return { id, plan: "pro", balance_cents: 4200 };
}

await withEpisode(
  {
    episodeId: "crm-refund-001",
    mode: "record",
    nextSequence: 0,
    tapeCursor: 0,
    tape: emptyTape(),
    timePolicy: "recorded",
    randomSeed: 42,
    usedEntryIndexes: new Set(),
    closureObservations: [],
  },
  async () => {
    const account = await wrapToolCall({
      operation: "crm.get_account",
      callSite: "agent#tools.get_account",
      args: [{ id: "A-42" }],
      fn: () => getAccount("A-42"),
      causalParent: "turn-1",
    });

    console.log(account);
    // → { id: "A-42", plan: "pro", balance_cents: 4200 }

    const ctx = getEpisodeContext()!;
    const tapeRoot = path.join(episodeRoot, "tape");
    fs.mkdirSync(tapeRoot, { recursive: true });
    saveTape(
      tapeRoot,
      ctx.tape,
      Object.fromEntries(ctx.payloadStore ?? []),
    );
    const closure = buildClosureReport(ctx);
    saveClosureReport(path.join(episodeRoot, "closure.json"), closure);
  },
);
```

发生了什么：

1. Softprobe 为 `crm.get_account` 构建了规范请求键。
2. 真实的 `getAccount` 只跑了一次。
3. 请求 + 响应被追加到 `softprobe.dependency-tape/v1` tape。
4. 闭合报告将该调用标记为 `recorded`。

## 步骤 2 — 回放且不调用 CRM

```ts
import {
  withEpisode,
  wrapToolCall,
  loadTape,
  ReplayMissError,
} from "@softprobe/agent";
import path from "node:path";

const episodeRoot = path.join("/tmp/softprobe-episodes", "crm-refund-001");
const { tape, payloadStore } = loadTape(path.join(episodeRoot, "tape"));

let crmHits = 0;

await withEpisode(
  {
    episodeId: "crm-refund-001-replay",
    mode: "replay",
    nextSequence: 0,
    tapeCursor: 0,
    tape,
    payloadStore,
    timePolicy: "recorded",
    randomSeed: 42,
    usedEntryIndexes: new Set(),
    closureObservations: [],
  },
  async () => {
    const account = await wrapToolCall({
      operation: "crm.get_account",
      callSite: "agent#tools.get_account",
      args: [{ id: "A-42" }],
      fn: async () => {
        crmHits += 1;
        throw new Error("must not run on replay");
      },
      causalParent: "turn-1",
    });

    console.log(account.plan); // "pro"
    console.log(crmHits); // 0 — side effect skipped
  },
);
```

回放会按正确形状注入成功、`null` 或已录制的异常。未命中则失败关闭：

```ts
try {
  await wrapToolCall({
    operation: "crm.get_account",
    callSite: "agent#tools.get_account",
    args: [{ id: "UNKNOWN" }], // different canonical request → miss
    fn: async () => ({ id: "UNKNOWN" }),
    causalParent: "turn-1",
  });
} catch (err) {
  if (err instanceof ReplayMissError) {
    console.error(err.diagnostic.category); // TOOL_CALL
    console.error(err.diagnostic.operation); // crm.get_account
    console.error(err.diagnostic.callSite);
    console.error(err.diagnostic.canonicalRequestDigest);
    console.error(err.diagnostic.canonicalRequest); // optional request payload
  }
}
```

## 步骤 3 — 跨 step 存活的文件系统

当 agent 写文件时，用工作区 overlay 做 seed，让后续 step 能看到先前写入，并在 episode 之间干净重置：

```ts
import {
  withEpisode,
  createWorkspace,
  wrapFs,
  emptyTape,
  resetEnvironment,
} from "@softprobe/agent";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const seedRoot = "/tmp/softprobe-seeds/crm-workspace";
const episodeRoot = "/tmp/softprobe-runs/crm-refund-001";
mkdirSync(seedRoot, { recursive: true });

const workspace = await createWorkspace({ seedRoot, episodeRoot });

await withEpisode(
  {
    episodeId: "crm-fs-1",
    mode: "record",
    nextSequence: 0,
    tapeCursor: 0,
    tape: emptyTape(),
    timePolicy: "recorded",
    randomSeed: 1,
    usedEntryIndexes: new Set(),
    closureObservations: [],
    workspaceRoot: workspace.root,
    seedRoot: workspace.seedRoot,
    seedDigest: workspace.seedDigest,
  },
  async () => {
    await wrapFs({
      operation: "writeFile",
      path: "refund-note.md",
      callSite: "agent#writeNote",
      args: { data: "Refund A-42 for $42" },
      fn: async () => {
        writeFileSync(
          join(workspace.root, "refund-note.md"),
          "Refund A-42 for $42",
          "utf8",
        );
      },
    });

    const note = await wrapFs({
      operation: "readFile",
      path: "refund-note.md",
      callSite: "agent#readNote",
      fn: async () =>
        readFileSync(join(workspace.root, "refund-note.md"), "utf8"),
    });
    console.log(note); // "Refund A-42 for $42"
  },
);

// Next episode: restore the seed tree
await resetEnvironment(workspace);
```

**Subject fork**（在 episode 中途复制 agent 内存中的对话）在 subject 适配器声明 import/export 之前仍不支持。工作区的环境 checkpoint/reset 是支持的。

## 步骤 4 — 未包装的 HTTP（protocol fabric）

当你拥有调用点时，优先用语义化的 `wrapHttpClient`。对于无法包装的环境 Node `fetch` / undici，在 episode **内部**用持久化 tape 捕获并回放：

```ts
import {
  withEpisode,
  emptyTape,
  saveTape,
  loadTape,
  getEpisodeContext,
} from "@softprobe/agent";
import {
  installHttpCapture,
  installHttpResponder,
} from "@softprobe/protocol-fabric";
import fs from "node:fs";
import path from "node:path";

const episodeRoot = "/tmp/softprobe-episodes/http-billing";
fs.mkdirSync(episodeRoot, { recursive: true });
const tapeRoot = path.join(episodeRoot, "tape");

// Record
await withEpisode(
  {
    episodeId: "http-1",
    mode: "record",
    nextSequence: 0,
    tapeCursor: 0,
    tape: emptyTape(),
    timePolicy: "recorded",
    randomSeed: 1,
    usedEntryIndexes: new Set(),
    closureObservations: [],
  },
  async () => {
    const capture = installHttpCapture();
    try {
      await fetch("https://billing.example.test/v1/invoices/A-42");
    } finally {
      capture.uninstall();
    }
    const ctx = getEpisodeContext()!;
    fs.mkdirSync(tapeRoot, { recursive: true });
    saveTape(tapeRoot, ctx.tape, Object.fromEntries(ctx.payloadStore ?? []));
  },
);

// Replay — responder needs the same episode context + loaded tape
const loaded = loadTape(tapeRoot);
await withEpisode(
  {
    episodeId: "http-1-replay",
    mode: "replay",
    nextSequence: 0,
    tapeCursor: 0,
    tape: loaded.tape,
    payloadStore: loaded.payloadStore,
    timePolicy: "recorded",
    randomSeed: 1,
    usedEntryIndexes: new Set(),
    closureObservations: [],
  },
  async () => {
    const responder = installHttpResponder();
    try {
      await fetch("https://billing.example.test/v1/invoices/A-42");
      // served from HTTP_CLIENT tape entries
    } finally {
      responder.uninstall();
    }
  },
);
```

**优先级：** 若代码在 `wrapHttpClient` 内，语义包装优先。Softprobe 绝不会对同一次调用双重执行真实 + mock。

## 换模型，保留世界

录制一次，然后改 agent prompt 或模型。Tool/MCP/HTTP/fs 仍从 tape 解析（或失败关闭）。这就是在 **固定环境** 下对比轨迹的方式。

## 相关

- [环境包与依赖 tape](/zh/evaluation/concepts/environment-bundles)
- [用 Promptfoo 给 episode 打分](/zh/evaluation/guides/score-episode-with-promptfoo)
- [Gym episode 与训练 rollout](/zh/evaluation/guides/gym-and-training-rollouts)
- [Node 包](/zh/evaluation/reference/node-packages)
