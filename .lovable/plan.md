## Scope

Frontend-only overhaul of the **results panel** on `/admin/simulator` (`src/routes/admin.simulator.tsx`). The left configuration panel, run logic, and backend stay untouched. Charts use **Recharts** (already imported in the file).

> Note: your message was truncated at *"the reset sequence: `Win Trigger"*. I'm planning the re-seed log block based on the obvious shape (Win Trigger → Payout → Pool reset → Seed reservoir drawn down to `minimumSeedAmount`). If you wanted a specific wording, paste the rest and I'll adjust before implementation.

---

## 1. New layout

Replace the current `<ResultsSummary>` block with a stacked dashboard:

```text
┌──────────────────────────────────────────────────────────┐
│  KPI ROW  (4 cards)                                      │
├──────────────────────────────┬───────────────────────────┤
│  Must-Drop Escalation        │  Seed Overflow Waterfall  │
│  (LineChart)                 │  (Stacked AreaChart)      │
├──────────────────────────────┴───────────────────────────┤
│  Proportional Fairness Ledger (Table — recent 25 spins)  │
├──────────────────────────────────────────────────────────┤
│  Event Log w/ highlighted Re-Seed Snap rows              │
└──────────────────────────────────────────────────────────┘
```

Keep existing `ResultsSummary` tier/RTP detail below as a collapsible "Raw engine output" section so nothing regresses.

---

## 2. KPI cards (top row)

Derived directly from `SimulatorResponseDTO` + `activeConfig`:

| Card | Source |
|---|---|
| **Total Wager Volume** | `result.totalWagered` |
| **Total Jackpot Payouts** | `result.winAmountCounter` |
| **Effective RTP Impact** | `result.rtp` (already a %) |
| **Total Overflow Diverted** | computed client-side: sum of per-spin `max(0, seedContribution − (maxSeed − seedCurrent))` reconstructed from `activeConfig.seed` + iteration count. Falls back to `0` (with "n/a — backend metric pending") when the config has no `maximumSeedAmount` so we don't fabricate numbers. |

Cards use existing `panel` style + a colored accent stripe per metric.

---

## 3. Charts

### a. Must-Drop Escalation (LineChart)
- X: spin index (sampled to ~200 points for perf)
- Y: instantaneous win probability
- Reconstructed client-side from `activeConfig` (Classic/AVERAGE/MAXIMUM/Must-Drop curve in `src/lib/jackpot/math.ts`). For Must-Drop, plot the escalation curve as pool approaches `maximumAmount`; for AVERAGE/MAXIMUM, plot the configured curve; for Classic, plot a flat baseline + a wager-scaled overlay.
- Reuse pure helpers from `math.ts` — no new math, no backend changes.

### b. Seed Overflow Waterfall (Stacked AreaChart)
- X: spin index
- Y: balance
- Two stacked series: **Seed Pool** (clamped at `maximumSeedAmount`) and **Main Pool** (absorbs overflow)
- Series are simulated locally with a lightweight forward replay using `activeConfig` contribution amounts and `result.iterations` — visually demonstrates the flat ceiling + steepened main-pool curve. Win events from `result.winEvents` punch the sawtooth resets.

---

## 4. Proportional Fairness Ledger (table)

`<Table>` from `@/components/ui/table` with last 25 spins (synthesized from `result.winEvents` plus an interleaved sample of non-winning spins for context):

| Spin ID | Wager | Base Probability | Effective Probability | Result |
|---|---|---|---|---|

- **Base** = configured Classic threshold from `activeConfig`
- **Effective** = `base × (wager / referenceWager)` clamped to 1.0 — same formula the backend now applies. Highlight rows where wager > reference wager so the proportional bump is visible.
- Win/Loss badge in the Result column.

---

## 5. Re-Seed Snap Event Log

Vertical event feed driven by `result.winEvents`. Each win renders an `Alert`-style block:

```text
🏆 WIN @ spin #12,481 — payout $4,820
   ├ Pool reset:  $4,820  →  $0
   ├ Seed draw:   reservoir $9,500  →  $8,500  (−$1,000 minimumSeedAmount)
   └ New pool:    $1,000 (reseed floor restored)
```

Non-win events (overflow openings) render as muted rows. Win rows get a highlighted border + subtle pulse animation.

---

## 6. Technical details

- **Files touched:** `src/routes/admin.simulator.tsx` only.
- **New imports:** `LineChart`, `Line`, `ReferenceLine` from `recharts` (other Recharts primitives already imported).
- **Helpers:** add three pure functions in the same file — `buildProbabilityCurve(config)`, `buildPoolReplay(config, iterations, winEvents)`, `buildFairnessRows(result, config)`. Keep them below the component to avoid churn elsewhere.
- **Styling:** continue with the existing inline-style `panel` pattern for consistency with the rest of the page; use shadcn `Table` + `Badge` for tabular content.
- **No backend / DTO / RNG / store changes.** If the backend later exposes a real `overflowDiverted` field, swap the derived KPI for the authoritative value.
- **Perf:** downsample chart series to 200 points using fixed stride; tables capped at 25 rows.

---

## Out of scope

- No new server function, migration, or `bet.ts` change.
- No change to the JSON config textarea or the simulate request flow.
- No new charting library — staying on Recharts.

Ready to implement on approval.