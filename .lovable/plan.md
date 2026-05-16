
# Wire pool & seed contributions independently end-to-end

The mapper falls back to a hardcoded `3` and stuffs the pool contribution into a top-level `contributionAmount`, so the form's actual values are dropped on the floor. Engine then reads the top-level field for pool and ignores `seed.contributionAmount`. Fix: drop the top-level field, push each input straight into `pool.contributionAmount` / `seed.contributionAmount`, and have the engine read those.

## Changes

### 1. `src/lib/jackpot/types.ts`
- Add `contributionAmount: number` and `contributionType: ContributionType` to `PoolDTO`.
- Remove `contributionAmount` and `contributionType` from `JackpotConfigDTO` (no more top-level).
- `SeedDTO` already has both fields — leave as-is.

### 2. `src/lib/jackpot/payload-to-config.ts`
- Use the form's `poolPercentageValue` (Pool Contribution input) **as-is** via `Number(parseFloat(...))` — no `numOr(..., 3)` fallback. `0` and `0.5` are valid user values; only `NaN/undefined` falls back to `0`.
- Same for `seedPercentageValue` → `seed.contributionAmount`.
- Build the output as:
  ```ts
  pool: {
    currentAmount, minimumAmount: 500, maximumAmount: 10000,
    contributionAmount: num(payload.poolPercentageValue, 0),
    contributionType: payload.contributionType === "fixed" ? "FIXED" : "PERCENTAGE",
  },
  seed: {
    currentAmount, targetAmount: 1000,
    contributionAmount: num(payload.seedPercentageValue, 0),
    contributionType: payload.seedContributionType === "fixed" ? "FIXED" : "PERCENTAGE",
  },
  ```
- Drop the `contributionAmount` / `contributionType` properties from the returned object.

### 3. `src/lib/jackpot/simulator.ts`
- Replace `jackpot.contributionAmount` / `jackpot.contributionType` reads with `jackpot.pool.contributionAmount` / `jackpot.pool.contributionType`.
- Loop math stays:
  - PERCENTAGE → `wager * (amount / 100)` per spin
  - FIXED → flat `amount` per spin (the previous "FIXED is cents" fix from the prior turn stays in place — divide by 100, cap at wager)
- Volatility / win-evaluation calls already use `poolContribution`; they keep working — they just pull the per-leg value from the new location.

### 4. `src/routes/api/v1/event/simulate.ts` (`toConfig` adapter)
- Move `contributionAmount` + `contributionType` from top level into `pool`.
- Add a sane default `seed.contributionAmount` of `0` (legacy `JackpotDTO` has no seed-contribution field).

### 5. `src/routes/backoffice.simulator.tsx`
- The hardcoded `DEFAULT_CONFIG` needs the same shape change (move the two fields into `pool`). Pure type alignment, no behavior change.

## Verification

1. From the creation form: set Pool Contribution = `0.5`, Seed Contribution = `0.5`, FIXED type. Continue → Simulator.
2. Inspect the prefilled JSON textarea: `pool.contributionAmount = 0.5`, `seed.contributionAmount = 0.5`, no top-level `contributionAmount`.
3. Run 100,000 spins at €1 wager. Expect `totalContributions ≈ 500` (0.5/100 × 1 × 100k under cents-conversion, capped at wager), not 300,000.
4. Switch to PERCENTAGE 0.5%: expect `totalContributions ≈ 500` (0.005 × 1 × 100k).
5. Set Pool = `0`, Seed = `0.5` → confirm pool stops growing, seed grows. (Proves fields are independent and zero is honored.)
