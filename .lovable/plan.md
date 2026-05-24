## Findings

- `/demo` currently fetches `GET /api/v1/jackpots` with `x-brand-id: 1` and resolves a match from each jackpot row’s `assignedCategories` / `assignedGameIds`.
- I checked the live response and the current brand-1 rows:
  - the jackpot rows returned to `/demo` have `assignedCategories: []` and `assignedGameIds: []`
  - the enabled rows visible to `/demo` are child jackpots like `Minor`, `Major`, `Grand`, `Sandbox Pool`, `Sandbox Seed`, `Sandbox House`
- I also checked the backend group data for brand `1`:
  - `jackpot_groups` id `38` has `assigned_game_ids: [31]` and `assigned_categories: []`, but its status is `disabled`
  - `jackpot_groups` id `31` is also `disabled`
- So: I do **not** currently see an active backend row for brand `1` that targets `Table Games`.

## What exists in code today

- Yes, **game ID logic exists** in `/demo`:
  - `src/components/demo/QaOverlay.tsx` checks `assignedGameIds.includes(gameId)`
- Yes, **category logic exists** in `/demo`:
  - the same resolver lowercases `category` and compares it to `assignedCategories`
- Yes, the bet route also has **gameId-based backend routing**:
  - `src/routes/api/v1/event/bet.ts` calls `resolveGroupForBet(...)`
  - `src/lib/jackpot/store.server.ts` resolves active groups by `assigned_game_ids`
- Important mismatch:
  - `/demo` pre-checks against **jackpot rows** from `/api/v1/jackpots`
  - backend routing appears to live on **jackpot groups** (`jackpot_groups.assigned_*`), not on the child jackpot rows returned by that endpoint

## Plan to fix

1. Update `/demo` pre-routing to read active **group targeting** instead of only child jackpot targeting.
2. Keep the existing priority order: exact `gameId` match first, then category match.
3. If group targeting is present but no active group exists for the selected brand/time window, show the correct fallback state instead of “not assigned”.
4. Validate against brand `1` data so the overlay matches the same routing rules the bet endpoint uses.

## Technical details

- Files to inspect/change in implementation:
  - `src/components/demo/QaOverlay.tsx`
  - possibly add a frontend-only fetch for `/api/v1/jackpot-groups` or adapt the `/demo` resolver to use group-derived targeting data already available from backend endpoints
- No database/schema/server-route changes needed.
- Expected result:
  - `/demo` will stop treating child jackpots with empty `assignedCategories` / `assignedGameIds` as “unassigned” when routing is actually defined at the group level.

```text
Current:
/demo -> /api/v1/jackpots -> child rows only -> no assignedCategories -> no-match

Target:
/demo -> active routing source (group targeting) -> resolve by gameId/category -> pick child jackpot/group -> proceed
```