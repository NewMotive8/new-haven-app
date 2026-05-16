## Scope

Frontend-only changes to `src/routes/backoffice.jackpots.new.tsx`. No DB schema migration, no `store.server.ts` changes — the existing `createJackpot` already forwards `dto.config` into `jackpots.trigger_condition` and writes `jackpot_pools` / `jackpot_seeds`.

## Right-column field schema (replaces current Model section per type)

**Classic**
- Base Seed Amount — currency input (replaces shared Pool/Seed block)
- Contribution Percentage — percent input + range slider (0–100)
- Volatility Score — slider 1–10 with numeric display
- Maximum Cap Limit — toggle; when on, reveal currency input

**Frequency**
- Base Seed Amount — currency input
- Contribution Percentage — percent input
- Target Hit Interval (Spins) — integer input with "spins" suffix, e.g. 50,000
- Fairness Multiplier Curve — dropdown: Linear / Exponential / Smooth

**Must Drop**
- Base Seed Amount — currency input
- Contribution Percentage — percent input
- Threshold Type — segmented toggle: Value-Bound | Time-Bound
  - Value-Bound → Must Drop By Amount (currency input)
  - Time-Bound → Must Drop By Date/Time (shadcn Popover + Calendar date picker, with time input)

**Multi-Level**
- Global Base Seed Amount — currency input
- Global Contribution Percentage — percent input
- Levels Grid Manager — table with columns: Level Name, Allocation Share %, Trigger Odds/Weight; `+ Add Level Tier` button appends a row; per-row delete; minimum 1 row

The shared "Pool & Seed" subsection is removed from the right column — Base Seed is now part of each type's spec, and `poolBalance` is set server-side to equal `seedAmount` when not supplied.

## Persistence shape (trigger_condition JSONB)

`buildConfig()` is rewritten to emit a discriminated payload, sent under `config` to `POST /api/v1/jackpots`. The store merges it into `trigger_condition` alongside the existing `threshold` and `type` keys.

```text
classic     → { type, contributionPct, volatility, capEnabled, capAmount? }
frequency   → { type, contributionPct, targetIntervalSpins, fairnessCurve }
must_drop   → { type, contributionPct, thresholdMode:"value"|"time",
                mustDropByAmount? , mustDropByAt? (ISO) }
multi_level → { type, contributionPct,
                tiers:[{ name, allocationPct, triggerWeight }] }
```

Top-level request fields stay the same: `name`, `enabled`, `contributionRate` (= contributionPct / 100), `seedAmount`, `poolBalance` (defaults to seedAmount), `volatility`, `jackpotType`, `config`. No store/server changes needed — `createJackpot` already inserts `jackpots` + `jackpot_pools` + `jackpot_seeds` in sequence and rolls forward on success.

## Validation (client-side, blocking Save)

- Name required, ≤100 chars
- Type selected
- contributionPct: 0–100
- seedAmount: ≥ 0
- Classic: if cap toggle on → capAmount > seedAmount
- Frequency: targetIntervalSpins ≥ 1
- Must Drop: value-mode → mustDropByAmount > 0; time-mode → mustDropByAt in future
- Multi-Level: ≥1 tier; allocation shares sum to 100 (warn, don't block); per-row name + numeric inputs

## UX details

- Date picker uses shadcn `Popover` + `Calendar` with `pointer-events-auto` (per project convention)
- Sliders use native `<input type="range">` styled to match existing dark theme — no new dependency
- "Save Jackpot" stays disabled until type + name are valid; on success → `toast.success("Jackpot created")` → navigate to `/backoffice/jackpots`
- On failure → `toast.error(serverMessage)`, stay on form

## Files touched

- `src/routes/backoffice.jackpots.new.tsx` — extend `FormState`, replace `ClassicFields` / `FrequencyFields` / `MustDropFields` / `MultiLevelFields`, rewrite `buildConfig()`, remove the right-column Pool & Seed subsection, add `MaxCapField` / `LevelsGrid` / `DateTimePicker` helpers.

No other files change. No migrations. No new packages (date-fns and shadcn Calendar/Popover are already available).
