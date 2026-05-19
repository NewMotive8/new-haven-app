# Jackpot Engine v2 — House Split, Fixed-Odds Trigger, External RNG

Three additive, opt-in features. When the new fields are unset, behavior is byte-identical to today, so existing jackpots and stored configs need no migration.

## Concept clarification

Today the form already exposes a *funding-source* split per pool/seed (player % vs operator %, `operatorShare` on `PoolDTO`/`SeedDTO`). That answers "who paid this contribution." The new **House Weight** is different: it answers "where does the wager fraction go" — Pool / Seed / House. The two stack; we do not replace `operatorShare`. The House cut is treated as 100% wallet-funded (player money kept by operator).

---

## Feature 1 — Three-Way Contribution Split (Pool / Seed / House)

### Data model (`src/lib/jackpot/types.ts`)

Add to `JackpotConfigDTO` and `TierDTO`:

```ts
contributionMode?: "legacy" | "split";    // default "legacy"
totalContributionAmount?: number;         // used when mode === "split"
totalContributionType?: ContributionType; // FIXED | PERCENTAGE
poolWeight?: number;                      // 0..100
seedWeight?: number;                      // 0..100
houseWeight?: number;                     // 0..100, sum must === 100
```

Add to `SimulatorResponseDTO` + `TierResultDTO`:

```ts
houseContributions: number;   // total House margin accumulated
houseRatio?: number;          // houseContributions / totalWagered
```

### Persistence (`src/lib/jackpot/store.server.ts`)

Pack the new fields inside the existing `jackpots.trigger_condition` JSONB column under a `contribution` sub-key (and per-tier under `tiers[i].contribution`). No SQL migration. `payload-to-config.ts` and `build-create-body.ts` get pass-through + defaulting (`legacy` when absent).

### Form (`src/components/jackpot/JackpotCreationForm.tsx`)

Contribution section (jackpot-level for Classic/MustDrop/Frequency, per-tier for Multi-Level):

- Mode toggle pill: **Legacy (Pool + Seed)** | **Split (Pool + Seed + House)**.
- Split mode renders:
  - One `Total Contribution` input + Fixed/Percentage toggle (reuse existing amount UI).
  - Three sliders (`Pool %`, `Seed %`, `House %`). Auto-rebalance the other two proportionally over the remaining budget when one moves; allow manual override and show a red validation chip when sum ≠ 100.
  - Live projection beside each slider: e.g. `0.10 EUR` at 50/35/15 → `Pool 0.0500 · Seed 0.0350 · House 0.0150`, formatted in the brand's currency. For PERCENTAGE-of-wager configs, project against a "Preview Wager" input (default 1.0) that sits above the row.
  - Defaults when switching to Split: `60 / 30 / 10`.
- Per-tier mode for Multi-Level: each tier (Mini/Major/Mega) has its own mode toggle + sliders + preview row, so tiers can mix legacy and split.

Validation: `poolWeight + seedWeight + houseWeight === 100` enforced client-side (Save disabled, clear inline error) and re-checked in `build-create-body.ts` before persistence.

### Simulator (`src/lib/jackpot/simulator.ts`)

Per spin, before existing wallet/operator share split:

```text
if (contributionMode === "split") {
  total = totalContributionType === "FIXED"
    ? totalContributionAmount
    : wager * totalContributionAmount / 100
  poolContrib  = total * poolWeight  / 100
  seedContrib  = total * seedWeight  / 100
  houseContrib = total * houseWeight / 100
  houseContributionCounter += houseContrib   // never enters pool/seed balances
} else {
  // current pool/seed amounts; houseContrib = 0
}
```

`operatorShare` continues to apply to the derived `poolContrib`/`seedContrib`. Apply in all three branches:
- CLASSIC (~`simulator.ts:92-97`)
- MULTI_LEVEL per-tier loop (~`simulator.ts:307-331`)
- MUST_DROP/FREQUENCY (~`simulator.ts:568-578`)

RTP stays `winAmount / totalWagered`. House margin reported separately.

### Results dashboard (`src/routes/admin.simulator.tsx`)

- Two new KPI cards beside Total Contributions / Wallet / Operator:
  - **House Margin** — `houseContributions`, currency-formatted.
  - **House %** — `houseRatio * 100`, 2 decimals + caption "of total wagered".
- Multi-Level results table gets a `House` column.
- Wire House totals into the existing `summary` memo from `.lovable/plan.md` so MULTI_LEVEL aggregates correctly across tiers.

---

## Feature 2 — Fixed-Odds Trigger Probability

### Data model

Add to `JackpotConfigDTO` and `TierDTO`:

```ts
triggerOdds?: number;   // denominator N → baseline p = 1/N per spin; 0/undefined = disabled
```

Persisted in `trigger_condition` JSONB next to the contribution block.

### Form

New collapsible "Trigger Probability" subsection (jackpot-level + per-tier for Multi-Level):

- Numeric input `Trigger Probability Denominator` (positive integer).
- Helper text under: `Computed Odds: 1 in {N.toLocaleString()} spins · p = {(1/N).toExponential(2)}`.
- For MUST_DROP/FREQUENCY: label appends "Used as baseline hit chance; the time-decay curve still applies."

### Math helper (`src/lib/jackpot/math.ts`)

Add — keeps the FAIRNESS_MULTIPLIER shape so contribution scaling stays consistent with `calculateMaximumHitChance`:

```ts
export function fixedOddsHitChance(
  triggerOdds: number,
  contributionAmount: number,
): number {
  return (1 / triggerOdds) * contributionAmount * FAIRNESS_MULTIPLIER;
}
```

### Routing in `simulator.ts`

- CLASSIC + MULTI_LEVEL: if `triggerOdds > 0`, replace the AVERAGE/MAXIMUM curve compare with `randomUnit < fixedOddsHitChance(...)`. Still gated by `performSafetyChecks` (rejection counter still ticks).
- MUST_DROP/FREQUENCY: if `triggerOdds > 0`, replace `maximumHitChance`:
  `hitChance = totalTimedChance + fixedOddsHitChance(triggerOdds, mathContribution)` — wall-clock decay scales on top.

---

## Feature 3 — External RNG Injection

### Math engine (`src/lib/jackpot/math.ts`)

Currently `calculateMaximumWin` and `calculateAverageWin` call `Math.random()` internally. Split each into:

- A pure threshold function returning `{ hitChance, denominator }` deterministically from inputs (`calculateMaximumHitChance` already exists in this shape — add the AVERAGE twin).
- A thin caller that compares against a `randomUnit ∈ [0, 1)`.

Add a single shared type:

```ts
export type RngSource = () => number; // returns uniform value in [0, 1)
```

All call sites accept an optional `rng: RngSource`. Default = `Math.random`. Existing parity holds because thresholds are unchanged.

### Simulator (`src/lib/jackpot/simulator.ts`)

- Replace every `Math.random()` call (classic, multi-level cascade, timed RNG roll) with `rng()`.
- Top-level `simulateClassic` / `simulateMultiLevel` / `simulateTimed` accept optional `rng?: RngSource`.
- **MULTI_LEVEL cascade uses one `rng()` call per spin frame** (industry-standard reverse-rank cascade with a single uniform roll), already the structural intent — codify it explicitly.

### RNG helpers (`src/lib/jackpot/rng.ts` — new, ~10 lines)

Mulberry32 seeded PRNG, no dependency. Used by the simulator dashboard when an optional seed is supplied for reproducible runs.

### Event payload + server routes

- `SimulatorDTO` already has `rngSeed?: number`. Plumb it into `src/routes/api/v1/event/simulate.ts` → build mulberry32 → pass as `rng`.
- Extend single-bet payload at `src/routes/api/v1/event/simulate-bet.ts`:

```ts
externalRoll?: number;       // integer in [0, externalRollMax)
externalRollMax?: number;    // denominator for normalization
```

Server route normalizes once: `randomUnit = externalRoll / externalRollMax` and constructs `rng: () => randomUnit` (single-shot is correct for a single bet event — the spin needs exactly one roll). Returns `400` when one of the pair is set without the other or when `externalRoll >= externalRollMax`.

### Composition with Trigger Probability

`fixedOddsHitChance` is pure — the external `randomUnit` is compared against it identically to the curve thresholds. The two features compose with no special branch.

---

## Files touched

```text
src/lib/jackpot/types.ts                       — new fields on config, tier, response
src/lib/jackpot/math.ts                        — fixedOddsHitChance + pure AVERAGE threshold + RngSource
src/lib/jackpot/rng.ts                         — NEW: mulberry32 seeded PRNG
src/lib/jackpot/simulator.ts                   — split contrib, odds override, House counter,
                                                  rng plumbing through all 3 branches
src/lib/jackpot/build-create-body.ts           — pass-through + weight-sum validation
src/lib/jackpot/payload-to-config.ts           — pass-through + safe defaults
src/lib/jackpot/store.server.ts                — pack/unpack new fields in trigger_condition
src/components/jackpot/JackpotCreationForm.tsx — mode toggle, weight sliders w/ projection,
                                                  Preview Wager input, trigger-odds input
                                                  (jackpot + per-tier)
src/routes/admin.simulator.tsx                 — House KPI cards + per-tier House column +
                                                  optional seed input + summary memo
src/routes/api/v1/event/simulate-bet.ts        — accept externalRoll/externalRollMax
src/routes/api/v1/event/simulate.ts            — wire rngSeed → mulberry32
```

## Verification plan

1. Default Classic template, Legacy mode, no odds, no external RNG → counters identical to current run.
2. Split mode `50/35/15` with FIXED `0.10 EUR` over 1M spins → `houseContributions ≈ 15,000`; pool/seed accrual scaled accordingly.
3. `triggerOdds = 1_000_000` over 5M spins → ~5 wins (gated by `performSafetyChecks`).
4. MUST_DROP, `triggerOdds = 100_000` + 1h window → win density elevated vs. control (`triggerOdds = 0`), still drops by end-of-window.
5. Multi-Level with per-tier weights + per-tier odds → distinct House totals per tier; sum matches top-level KPI.
6. External RNG: same `rngSeed` + same config → byte-identical win events across two runs; different seed → different events.
7. Single-bet route with `externalRoll = 0` vs `externalRoll = externalRollMax - 1` exercises both ends of the threshold cleanly.
