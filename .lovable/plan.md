
## Goal

Bring `src/lib/jackpot/payload-to-config.ts`, `src/lib/jackpot/simulator.ts`, and `src/lib/jackpot/types.ts` into parity with the new Option A creation-form rules and the Happy Hour data contract introduced for Frequency. The sandbox simulator at `/admin/simulator` must refuse contaminated configs before running and must mirror runtime gatekeepers during the loop.

## Scope (files to edit)

- `src/lib/jackpot/types.ts` — extend `TimedConfigDTO` with Happy Hour window fields.
- `src/lib/jackpot/payload-to-config.ts` — Must-Drop hard-mapping, Frequency Happy Hour passthrough, Option A validation gate, drop legacy payout fields.
- `src/lib/jackpot/simulator.ts` — Happy Hour window gate inside the Frequency loop; Must-Drop forced to MAXIMUM.
- `src/lib/jackpot/build-create-body.ts` — reuse the same validation helper so the sandbox and creation form share one gate.

No UI changes; `JackpotCreationForm.tsx` keeps its current Happy Hour state and payload exactly as is.

## 1. Must-Drop alignment in mapping

In `mapPayloadToConfig`:
- When `structuralType === "MUST_DROP"`, force `type: "MAXIMUM"` regardless of `payload.payoutModel`.
- Force `maximumWinAmount = num(payload.maxWinAmount)` as the curve target; ignore `fixedWinAmount`, `averageWinAmount`, `payoutModel`.
- Stop emitting the `fixedWinAmount` config branch when type is MUST_DROP.
- Pass `pool.maximumWinAmount = maxWin` so the timed branch uses it as the acceleration ceiling (already partially wired via `rt.pool.targetAmount` fallback).

## 2. Frequency Happy Hour contract

Extend `TimedConfigDTO` with optional fields:

```ts
freqInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
freqDay?: string;            // '' for DAILY, '0'..'6' weekly, '1'..'31' monthly
contribStartTime?: string;   // 'HH:MM' UTC
contribEndTime?: string;
winStartTime?: string;
winEndTime?: string;
```

In `mapPayloadToConfig`, when `structuralType === "FREQUENCY"`:
- Populate `timed` with the six fields above directly from the payload (no JSON re-parsing — the raw values live on `JackpotSavePayload`).
- Map `freqInterval → mustDropPeriod` (DAILY=2, WEEKLY=3, MONTHLY=4) so the existing `resolveTimedWindow` keeps working for the outer lifespan, but the new window fields drive the in-loop gate.
- Keep `maxNumberOfWins` / `maxTotalPayout` as optional caps surfaced to the engine via two new fields on `JackpotConfigDTO` (`maxNumberOfWins?`, `maxTotalPayout?`).

## 3. Engine gate inside `simulateTimed`

Add a Happy Hour gate at the top of the per-iteration loop for `FREQUENCY`:

1. Compute the spin's wall-clock minute-of-day from `nowMs` (or the simulator's virtual clock — see "Virtual clock" below).
2. If the spin falls outside `[contribStartTime, contribEndTime]` for the active `freqInterval` / `freqDay`:
   - Record zero contributions (skip the `walletContributions += …` / `houseContributions += …` block).
   - Skip the RNG roll entirely (`continue`).
3. If the spin falls inside the contribution window but outside `[winStartTime, winEndTime]`:
   - Still accrue contributions.
   - Force `hitChance = 0` so no win is triggered (mirrors runtime: pool grows but no payouts).
4. Apply `maxNumberOfWins` / `maxTotalPayout` caps: once exceeded, break out of the loop.

### Virtual clock

Today `simulateTimed` calls `Date.now()` each iteration, so all `iterations` share the same minute and the window check would be all-in or all-out. Distribute spins across the configured window: derive a per-iteration timestamp as `start + (i / iterations) * (end - start)` where `[start, end]` comes from `resolveTimedWindow` for the active period. This is the same total-duration boundary the user spec calls out and makes the inside/outside-window assertion meaningful.

## 4. Symmetrical validation gates

Extract the `validateSplitWeights` + `validateModeExclusivity` checks from `build-create-body.ts` into a shared helper (e.g. `src/lib/jackpot/validate-payload.ts`) and call it from:

- `buildCreateBody` (already covered).
- `mapPayloadToConfig` — throw before returning, so the sandbox refuses to simulate:
  - Classic Progressive carrying any `minWinAmount` / `maxWinAmount`.
  - Classic Progressive without `triggerOdds`.
  - Must-Drop or Frequency carrying `triggerOdds`.
  - Frequency carrying `minWinAmount` / `maxWinAmount`.
  - Fixed contribution carrying `minWagerAmount` / `maxWagerAmount`.
  - Split-mode weights not summing to exactly 100.

`/admin/simulator` catches the thrown error in the existing `try`/`catch` around `handleSimulate` and `mapPayloadToConfig` (the latter runs at mount via `useMemo`; wrap that in a try/catch and surface the message into the existing `error` state instead of crashing the page).

## 5. Verification

- Read back `simulator.ts` and `payload-to-config.ts` after edits to confirm the new branches compile.
- Manually invoke `/api/v1/event/simulate-bet` via `stack_modern--invoke-server-function` with:
  - A Must-Drop config whose `payoutModel` is set to `average` → engine still runs as MAXIMUM, no validation failure.
  - A Frequency config with a 1-hour contribution window over a daily period and `iterations=100` → returned `walletContributions` ≈ proportional to (window/day), `winCounter=0` outside the win window.
  - A Classic config with `maxWinAmount > 0` → request rejected with the Option A error.

## Out of scope

- No edits to `JackpotCreationForm.tsx`, `admin.simulator.tsx` UI layout, or DB schema.
- Multi-level (`tiers`) path is untouched.
