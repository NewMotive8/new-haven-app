## Problem

Two related bugs in `/sandbox-demo` when running the Batch Velocity Runner against the Dalia MultiJackpot:

1. **Tile balances don't change during/after a batch run.**
   - `runBatch` (in `src/routes/sandbox-demo.tsx`) only updates the aggregate `BatchStats`. It never updates `poolDisplays`, so the tile keeps showing the seeded balance.
   - The 2s polling tick in the same file guards with `if (next[jp.id] == null) next[jp.id] = jp.poolBalance`, which means once a balance is seeded locally it is **never refreshed from the server**, even though `/api/v1/event/bet` (via `apply_group_bet`) has already written the deltas to `jackpot_pools`.
   - Net result: the server-side balances grow, the UI doesn't.

2. **GLI Audit View has no per-tier breakdown.**
   - `BatchStats` is a flat aggregate (`poolTotal / seedTotal / houseTotal / hits` across the whole batch).
   - `/api/v1/event/bet` already returns a rich `perJackpot[]` array (`jackpotId`, `jackpotName`, `routing`, `contribution { pool, seed, house }`, `totalContribution`) plus a top-level `win.jackpotId` indicating which tier hit — but `runBatch` discards all of it.

## Fix

### 1. `src/routes/sandbox-demo.tsx` — `runBatch`

- Capture `j.perJackpot` from each bet response.
- Maintain a per-jackpot accumulator `Record<number, { name, poolTotal, seedTotal, houseTotal, totalContribution, hits, spins }>` inside the batch run.
- When a spin's `j.win` is present, increment `perJackpot[j.win.jackpotId].hits`.
- Flush the per-jackpot map into `BatchStats.perJackpot` alongside the existing aggregate values.
- Also update `poolDisplays` per jackpot from the `perJackpot` slices (mirrors what `handleSpin` already does), so the tile balances climb live as the batch progresses.

### 2. `src/routes/sandbox-demo.tsx` — polling tick

- Stop guarding the balance assignment behind `next[jp.id] == null`. Always overwrite with the freshest server value, **except** when a batch is currently running (`batchRunning === true`) — in that case keep the locally-driven value to avoid flicker/race with the in-flight deltas.
- After the batch finishes, the next poll syncs the UI back to the canonical server balance.

### 3. `BatchStats` type

Extend it with:

```ts
perJackpot: Record<number, {
  jackpotId: number;
  jackpotName: string;
  poolTotal: number;
  seedTotal: number;
  houseTotal: number;
  totalContribution: number;
  hits: number;
  spins: number;
}>;
```

`emptyBatchStats` returns `{}` for that field.

### 4. GLI Audit View — per-tier table

Below the existing aggregate tiles in the "Last Batch Run — Statistical Analysis (GLI Audit View)" section, add a new sub-section "Per-Tier Breakdown" that renders only when `Object.keys(batchStats.perJackpot).length > 0`:

```text
| Tier            | Spins | Σ Pool | Σ Seed | Σ House | Σ Total | Hits | Hit Freq    |
| Dalia · Minor   |  ...  |  ...   |  ...   |  ...    |  ...    |  ... | 1 in N      |
| Dalia · Major   |       |        |        |         |         |      |             |
| Dalia · Grand   |       |        |        |         |         |      |             |
```

Styled to match the existing `StatTile` aesthetic (semantic tokens, slate borders, tabular nums). Rows sorted by tier name (or by `tierRank` when available via the `pools` lookup). Use `fmtPrecise` for currency cells and existing color palette (`text-emerald-300` for pool, `text-sky-300` for seed, `text-amber-300` for house) for consistency.

No backend or schema changes are required — `/api/v1/event/bet` already returns everything we need.
