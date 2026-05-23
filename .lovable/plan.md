## Goal

After a spin, the sandbox should give immediate, unambiguous visual feedback: the Pool/Seed/House chip animates with the real contribution, newly discovered jackpots are opted in by default, and the carousel snaps to the tile that just received the bump.

## Changes (all in `src/routes/sandbox-demo.tsx`)

### 1. Default new jackpots to opted-in
- In the polling effect (~line 426–435) flip the default so any jackpot discovered for the first time has `optIns[jp.id] = true`.
- Existing entries are untouched, so users can still toggle a pool off and the choice persists across polls.

### 2. Always-show contribution chip
- In the multi-pool branch of `handleSpin` (~line 858–871), drop the `if (!optIns[e.jackpotId]) continue` guard for the `lastSplit` aggregation. Sum `aggPool/aggSeed/aggHouse` across **every** `perJackpot` entry the server returned.
- Keep the opt-in filter only for the **Allocation Tracker** (`bumpTracker` call) so the cumulative tracker still respects opt-in semantics.
- Mirror the same change in the aggregate-only fallback (~line 877–899): write the full aggregate into `lastSplit` regardless of opt-in.

### 3. Auto-focus carousel on the routed pool
- After computing `poolDeltas` in `handleSpin`, pick the jackpot with the largest non-zero delta (tie-break: first one in `perJackpot`).
- Find the matching index in `displayPools`:
  - `kind: "single"` → match by `jackpot.id`.
  - `kind: "group"` → match if any `tiers[i].id` equals the bumped jackpot id.
- If found and different from current `activeIndex`, call `setActiveIndex(found)` so the carousel slides to that tile.

### 4. (Small) Fallback branch
- The `hasNoEnabledPools` visual fallback already writes a non-zero `lastSplit`, so no change needed there.

## Out of scope

- No backend / migration changes.
- No styling or animation tweaks beyond what's already wired to `lastSplit` / `poolDisplays` / `activeIndex`.
- No changes to force-win flow (single-pool path already works against the visible tile).

## Verification

1. Spin €50 on `gameId="sandbox-game"` (brand 1).
2. Expect: chip shows `Pool €2.50 / Seed €1.75 / House €0.75` (total €5.00), carousel snaps to Sandbox Pool tile, tile balance bumps +€2.50.
3. Toggle one jackpot's opt-in off → chip still shows full contribution, but Allocation Tracker stops accumulating that pool.
