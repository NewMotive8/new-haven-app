## Problem

On `/sandbox-demo`, when you spin:

- **Allocation Tracker** (Σ opted-in pools) updates — because it's a pure client-side cumulative counter (`bumpTracker`).
- **Jackpot tile balance** never moves — even though the server is actually contributing to a pool.

## Root cause

In `handleSpin` (multi-pool path) around line 827–832 of `src/routes/sandbox-demo.tsx`, the client filters the server's `perJackpot` response to **opted-in pools only** before updating both the tracker AND the tile displays:

```ts
for (const e of per) {
  if (!optIns[e.jackpotId]) continue;   // <-- filter
  aggPool += e.contribution.pool;
  ...
  poolDeltas[e.jackpotId] = ... ;       // tile display delta
}
```

The visible tile (`activeDisplay.balance`) reads from `poolDisplays[id]`. If the routed/fallback pool isn't in your opt-in set (or the visible tile shows a different pool than the one the server routed to), `poolDisplays` never changes for that tile, so the number stays frozen.

Meanwhile the 2s poll (`/api/v1/jackpots`) re-syncs `poolDisplays` from `jp.poolBalance` — but only if the server's canonical balance actually changed. If the bet endpoint contributes only to the routed pool (and the user is viewing a different one), the visible pool's server balance never moves either, so even the poll can't rescue the tile.

The Allocation Tracker keeps moving because at least one opted-in pool is in `perJackpot`, so `aggPool > 0` and `bumpTracker` increments.

## Fix

Two surgical changes in `src/routes/sandbox-demo.tsx`, both UI-layer only — no server logic touched:

1. **Always reflect server contributions on every tile.**
   Split the loop: build `poolDeltas` for **all** `perJackpot` entries (so every contributing tile animates), but keep the Σ-opted-in math (`aggPool`/`aggSeed`/`aggHouse` + `bumpTracker`) filtered to opted-in pools so the Allocation Tracker semantics stay intact.

2. **Snap the carousel to the routed tile when fallback fires.**
   When `routeState.willFallback` is true and `fallbackTarget` is used, set `activeIndex` to the `displayPools` entry matching that target after the spin resolves. This guarantees the user sees the tile that actually grew (covers the case where they're parked on a different pool).

## Verification

- Spin with no opt-ins → tile of routed/fallback pool ticks up, tracker stays at 0 (correct).
- Spin with one opt-in matching the visible tile → tile and tracker both tick up by the same `pool` amount.
- Spin with an opt-in on a different pool than the visible tile → both tiles update (visible one and the opted-in one), tracker reflects only the opted-in slice.
- 2s poll continues to reconcile to canonical server balances; no double-counting because `batchRunningRef` guard and existing `persistPoolGrowth` paths are unchanged.

## Files touched

- `src/routes/sandbox-demo.tsx` (handleSpin multi-pool branch around lines 820–855; small `useEffect` to retarget `activeIndex` after fallback)

No changes to server functions, bet endpoint, group resolver, or route tree.
