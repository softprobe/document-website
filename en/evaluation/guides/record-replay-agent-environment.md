---
title: Record and replay an agent environment
---

# Record and replay an agent environment

Use Softprobe’s Node semantic agent to **record** dependency interactions from a real run, then **replay** them so the agent can take a different reasoning path without hitting live tools again.

This guide uses a small CRM-style tool. The same pattern applies to MCP, HTTP clients, filesystem, and child processes.

## Prerequisites

These packages ship in the Softprobe LLM workspace (`sp-llm`). They are not published to the public npm registry yet — develop against the workspace packages:

```bash
cd sp-llm
pnpm install
# import from workspace packages, e.g. @softprobe/agent
```

Preload registers category modules (optional if you only call the API):

```bash
node --import @softprobe/agent/register your-app.mjs
```

Softprobe credentials (`SOFTPROBE_*`, OTLP) stay in `@softprobe/tracing` — the agent package does **not** parse them.

## Step 1 — record a tool call

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

What happened:

1. Softprobe built a canonical request key for `crm.get_account`.
2. The real `getAccount` ran once.
3. Request + response were appended to a `softprobe.dependency-tape/v1` tape.
4. The closure report marked the call as `recorded`.

## Step 2 — replay without calling CRM

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

Replay injects success, `null`, or a recorded exception with the correct shape. A miss fails closed:

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

## Step 3 — filesystem that survives across steps

When the agent writes files, seed a workspace overlay so later steps see prior writes, and reset cleanly between episodes:

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

**Subject fork** (copy the agent’s in-memory conversation mid-episode) stays unsupported until the subject adapter declares import/export. Environment checkpoint/reset of the workspace is supported.

## Step 4 — unwrapped HTTP (protocol fabric)

Prefer semantic `wrapHttpClient` when you own the call site. For ambient Node `fetch` / undici that you cannot wrap, capture and replay **inside** an episode with a persisted tape:

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

**Precedence:** if code is inside `wrapHttpClient`, the semantic wrap wins. Softprobe never dual-executes real + mock for the same call.

## Change the model, keep the world

Record once, then change the agent prompt or model. Tool/MCP/HTTP/fs still resolve from the tape (or fail closed). That is how you compare trajectories under a **fixed environment**.

## Related

- [Environment bundles and dependency tapes](/en/evaluation/concepts/environment-bundles)
- [Score an episode with Promptfoo](/en/evaluation/guides/score-episode-with-promptfoo)
- [Gym episodes and training rollouts](/en/evaluation/guides/gym-and-training-rollouts)
- [Node packages](/en/evaluation/reference/node-packages)
