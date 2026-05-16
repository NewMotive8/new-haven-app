# Plan: Multi-Level + Timed Jackpot Support

Mirror the attached `JackpotEngineMaths.java` and `JackpotEngineSimulator.java` in the TS engine. Keep the existing AVERAGE/MAXIMUM Classic path, `minimumWinAmount` rejection gate, isolated seed payouts, and wallet/operator telemetry unchanged for single-pool jackpots.

## 1. Types (`src/lib/jackpot/types.ts`)

- Extend `JackpotWinType` to `"AVERAGE" | "MAXIMUM"` (unchanged) and add `JackpotKind` already covers `classic|frequency|must_drop|multi_level`. Add a new top-level field on `JackpotConfigDTO`:
  - `structuralType: "CLASSIC" | "MULTI_LEVEL" | "MUST_DROP" | "FREQUENCY"` (selects the engine branch; orthogonal to AVERAGE/MAXIMUM math).
  - `tiers?: TierDTO[]` — up to 4 entries (Mini/Minor/Major/Mega). Each `TierDTO` carries its own `PoolDTO`, `SeedDTO`, `multiLevelTier: 1..4`, `multiLevelWeight: number` (0–1, sum should be ≤ 1), and label.
  - `timed?: { lifespanMinutes: number; mustDropPeriod?: 1|2|3|4 }` for MUST_DROP / FREQUENCY. Java's wall-clock is replaced by a virtual clock derived from iteration index (per the user spec).
- Extend `SimulatorResponseDTO`:
  - `tierResults?: TierResultDTO[]` — `{ tier, label, winCounter, winAmountCounter, finalPool, finalSeed, maxWinAmount, rejectedByGate }`.
  - Keep top-level aggregate counters as today (sum across tiers when MULTI_LEVEL).

## 2. Payload → Config (`src/lib/jackpot/payload-to-config.ts`)

- Read the form's `type` (CLASSIC/MULTI_LEVEL/MUST_DROP/FREQUENCY) and set `structuralType`.
- CLASSIC / MUST_DROP / FREQUENCY: keep existing single pool/seed mapping. For timed types, map the new "Lifespan" field (`durationInMinutes`) and `mustDropPeriod` into `timed`.
- MULTI_LEVEL: build `tiers[]` from the form's tier rows (1..4). Each tier maps to its own pool + seed using the same field conventions as the single-tier path. Validate weights sum to ≤ 1; default to even split if blank.
- Backward compatibility: when no tiers/timed are present, the DTO is shape-identical to today.

## 3. Engine (`src/lib/jackpot/simulator.ts`)

Refactor `simulateEngine` to dispatch on `structuralType`:

- **CLASSIC** — current loop, unchanged. Single-pool rejection gate + isolated seed payout + telemetry stay as-is.
- **MULTI_LEVEL** — per Java `calculateWin` + simulator loop:
  - Build a tier array sorted by `multiLevelTier` DESC (Mega → Mini).
  - Per iteration: for **every** tier, add `poolContribForCalc * weight` (capped at `poolCap`) and `seedContribForCalc * weight` (capped at `seedCap`). Wallet/operator telemetry sums across tiers.
  - Build `mathContribution = poolContribForCalc + (hasSeedConfig ? seedContribForCalc : 0)` (global, matches Java line 169).
  - Walk tiers in reverse order. For each: `weightedContribution = mathContribution * weight`, then run `calculateAverageWin`/`calculateMaximumWin` against that tier's pool. First tier whose RNG fires AND passes `performSafetyChecks` wins; remaining tiers are skipped for this iteration (Java early-return).
  - On win: payout = tier pool (with fixed/max overrides), `rejectedByGate++` if safety check fails (counted per tier), reseed only that tier with the same AVERAGE-reset vs MAXIMUM-subtract branches as today.
- **MUST_DROP / FREQUENCY** — virtual clock:
  - `totalMinutes = jackpot.timed.lifespanMinutes`, `currentMinute = floor(i / iterations * totalMinutes)` per iteration.
  - `percentageIntoGame = currentMinute / totalMinutes` (clamped 0..1).
  - `totalTimedChance = Math.pow(percentageIntoGame, volatility * AVERAGE_VOLATILITY_MULTIPLIER) * mathContribution`.
  - `maximumHitChance` computed exactly as today's MAXIMUM path against the single pool.
  - Final `hitChance = totalTimedChance + maximumHitChance`. Compare to `random/target` where `target = jackpot.maximumWinAmount` (per Java line 365). On hit → existing safety gate + payout + reseed.
- Per-tier counters (`winCounter`, `winAmountCounter`, `maxWinAmount`, `rejectedByGate`, `finalPool`, `finalSeed`) accumulate independently in MULTI_LEVEL; the top-level aggregate fields are summed for backward compat.

`math.ts` needs no changes — `calculateAverageWin` / `calculateMaximumWin` already take `currentAmount` + `targetAmount` + `contributionAmount` + `volatility`. We'll expose a small helper `calculateMaximumHitChance` to support the timed branch's additive math without duplicating it.

## 4. Creation Form (`src/routes/admin.jackpots.new.tsx`)

- Type selector: add `MUST_DROP`, `FREQUENCY`, `MULTI_LEVEL` to the existing CLASSIC switch.
- **Timed types** — show a "Lifespan" field (presets: Hourly 60, Daily 1440, Weekly 10080, Monthly 43200; plus custom minutes) plus the existing pool/seed/wager rows.
- **Multi-Level** — replace single pool/seed editor with a tier list (1–4 rows). Each row: label (defaults Mini/Minor/Major/Mega), weight slider, pool min/max/current/contribution, seed current/target/contribution, optional `minimumWinAmount`. Add/Remove tier buttons (min 2, max 4). Live weight-sum indicator.
- All other fields (volatility, operator share, AVERAGE/MAXIMUM toggle, fixed/max win) stay shared at the jackpot level.

## 5. Dashboard (`src/routes/admin.simulator.tsx`)

- When `tierResults` is present: render a "Tiers" section with one card per tier showing label, wins, total paid, max win, final pool, final seed, rejected-by-gate. Color-code by tier rank.
- Keep all existing aggregate metric cards (RTP, total wins, rejected by gate, wallet/operator contributions) — they remain accurate as cross-tier sums.

## 6. Constraints kept intact

- `minimumWinAmount` rejection gate, isolated seed payouts (seed never added to win), wallet vs operator telemetry, AVERAGE reset-to-min reseed, MAXIMUM subtract-then-top-up reseed — applied per-pool in all branches.
- No DB / backend changes; everything is client-side simulator state.

## 7. Files touched

```
src/lib/jackpot/types.ts            — DTO additions
src/lib/jackpot/math.ts             — export calculateMaximumHitChance
src/lib/jackpot/simulator.ts        — dispatch + 3 new branches
src/lib/jackpot/payload-to-config.ts — map tiers + timed lifespan
src/routes/admin.jackpots.new.tsx   — tier list + lifespan UI
src/routes/admin.simulator.tsx      — per-tier results panel
```

No migrations, no new packages.
