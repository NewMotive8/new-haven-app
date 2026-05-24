## Goal
When the jackpot is won, the widget counter should drop and animate back up from the new seed instead of being held at the pre-win value by the local "no backward movement" guard.

## Where the bug lives
The floor logic only exists in `src/components/demo/QaOverlay.tsx` (`displayFloorRef` + `displayBalance`). `src/routes/demo.tsx` doesn't have its own widget display state, so no change is needed there — the request to edit `demo.tsx` is a no-op in this codebase.

The bet response (`src/lib/demo/bet.functions.ts`) does not include a `reseed_amount` field. After a win, the backend resets the jackpot and the existing 2-second poll of `/api/v1/jackpots` returns the new seeded `poolBalance`. Today, the floor is set to the previous pool + contribution on every spin (including the winning one), so even when the poll returns the lower reseed value, the existing effect clamps `displayBalance` up to the stale floor.

## Change (single file: `src/components/demo/QaOverlay.tsx`)

In `handleSpin`, inside the existing `if (json.win) { ... }` branch:

1. Clear `displayFloorRef.current = null` so subsequent polls are not clamped.
2. Immediately set `displayBalance` to the reseed baseline. Source of the baseline, in order of preference:
   - the resolved jackpot's `seedAmount` (already on `selectedJp`), since the server reseeds to that on a win.
3. Do not apply the existing "pool += contribution" bump for the winning spin — skip the `setDisplayBalance(prev => base + poolAdd)` block when `json.win` is present, so the counter doesn't briefly tick up before resetting.

The floor-clamping `useEffect` keyed on `selectedJp` already handles the case where the next poll's `poolBalance` is below the (now-null) floor: with the floor cleared, it will accept the lower value directly and the widget will visibly drop to the seed. Any "animate up from seed" behavior is just the natural effect of contributions accumulating on subsequent spins / polls — no new animation code is added.

## Out of scope
- No change to `src/lib/demo/bet.functions.ts`, `src/routes/demo.tsx`, `src/lib/jackpot/*`, or any API contract.
- No change to backend reseed logic; we rely on the existing poll to surface the new pool balance.
- Win celebration UI (`WinCelebration`) is unchanged.

## Technical detail
Replace the current post-bet block:
- Keep `setLastSplit(...)`.
- Branch on `json.win`:
  - Win path: `displayFloorRef.current = null;` then `setDisplayBalance(selectedJp.seedAmount);` then set `win` state as today.
  - Non-win path: existing `if (poolAdd > 0) { ... }` floor-raising logic unchanged, plus existing toast.
