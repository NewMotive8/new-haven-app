## Scope

Single file: `src/routes/admin.simulator.tsx`. Pure frontend, no DTO/backend/migration changes. Targets the `ComplianceDashboard` block (KPI row, replay helpers, fairness ledger) and removes the `<details>Raw engine output</details>` collapsible.

---

## 1. Fix nested DTO field resolution

Update `buildPoolReplay`, `buildProbabilityCurve`, and the `ReSeedEventLog` helpers to read the schema using the names the user specified, with fallbacks so legacy configs still render.

- **Seed cap** — read `config.seed?.maximumSeedAmount` first, fall back to `config.seed?.targetAmount` (current behaviour). `supported` becomes `seedCap > 0`.
- **Seed floor** — read `config.seed?.minimumSeedAmount` first, fall back to `config.seed?.currentAmount`.
- **Pool cap** — read `config.pool?.maximumAmount` first, fall back to `config.pool?.targetAmount`.
- **Pool start** — `config.pool?.currentAmount` (already correct).

Cast through `as any` only where the DTO type does not declare `minimumSeedAmount` / `maximumSeedAmount` — these fields are already persisted into the JSONB config and the helper extends without modifying `types.ts`.

`buildPoolReplay` already does the overflow waterfall correctly (cap headroom → seed, remainder + poolAdd → main pool, win events drain pool then re-seed from floor). After the field swap, verify the in-loop math reads the new variables (`seedCap`, `floor`) and that the sawtooth still uses `result.winEvents` ordered by iteration. No structural change to the algorithm.

---

## 2. Dual-row KPI grid (replaces single row + raw-output accordion)

Delete the `<details>…<ResultsSummary/></details>` block from `SimulatorPage` (lines ~449–456) and remove the legacy ResultsSummary/MathAudit usage **only from the dashboard render path** — keep the helper functions in the file untouched to avoid unrelated churn (they're inert once unreferenced; tree-shaking handles them in prod).

Replace the current 4-card `<ComplianceKpi>` row with two semantic rows wrapped in titled bands:

```text
┌─ Financial Performance ─────────────────────────────────────────┐
│  Total Wager Volume │ Total Jackpot Payouts │ Effective RTP │ Operator Net Revenue │
├─ Simulation Health & Gate Integrity ────────────────────────────┤
│  Expected Wins │ Triggers Fired │ Actual Wins Approved │ Blocked by Gate │
└─────────────────────────────────────────────────────────────────┘
```

Each row: `display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px`. Section header is a small uppercase label above each row to keep the layout tight.

### Row 1 — Financial Performance
| Card | Source |
|---|---|
| Total Wager Volume | `result.totalWagered` |
| Total Jackpot Payouts | `result.winAmountCounter` |
| Effective Jackpot RTP | `result.rtp` (already %) |
| Operator Net Revenue | `result.houseContributions` if present and > 0; otherwise computed fallback `totalWagered × (poolContributionAmount + seedContributionAmount)/100 × housePct/100` using `getJackpotSplit(config).housePct` (re-uses the helper already in this file). Badge text states the % share. |

### Row 2 — Simulation Health & Gate Integrity
| Card | Source / formula |
|---|---|
| Expected Wins | `Math.round(result.iterations × configuredProbability(config, "jackpot"))` — uses the existing helper, so it works for both fixed-odds and curve-mode configs. |
| Triggers Fired | `(result.winCounter ?? 0) + (result.rejectedByGate ?? 0)` — the RNG firings before gate evaluation. |
| Actual Wins Approved | `result.winCounter` |
| Blocked by Gate | `result.rejectedByGate ?? 0`. When `> 0`, set `accent="#ef4444"` and add a destructive-tinted border `border: 1px solid rgba(239, 68, 68, 0.5)` plus a "Liquidity gate triggered — review funding" sub-badge. When `0`, render neutral accent (`#10b981`) with "Healthy" badge. |

The existing `ComplianceKpi` component already accepts `accent` + `badge`; extend it with an optional `tone?: "alert"` prop that, when set, swaps the panel border and value text colour to the destructive token. Keep it inline-styled — no new CSS file.

---

## 3. Fairness-ledger fallbacks for must-drop

`buildFairnessRows` currently uses `configuredProbability(config, "jackpot")`, which returns `0` for must-drop configs (no fixed odds, no `triggerOdds`) — that's why columns render as `—`.

For `structuralType === "MUST_DROP"`, synthesize a baseline by sampling the escalation curve produced by `buildProbabilityCurve`:
- **Base probability** = the curve's first point (early-fill baseline, e.g. `0.0001`).
- **Effective probability** at a given wager = base × `(wager / referenceWager)`, clamped to 1.
- For each row, instead of a flat number, pick the curve probability at the row's `spinId` so the table shows escalation across the simulation (`baseProb` column = first-point baseline, `effectiveProb` column = curve-at-spin × wager scaler).

Result: must-drop rows show real ascending probabilities instead of `—`. Loss rows still vary wager values to demonstrate the ticket-scaling effect.

`formatProb` already handles `p <= 0 → "—"`, so curve-mode configs with no target cap still degrade gracefully.

---

## 4. Layout polish (tight & professional)

- KPI panels: reduce `padding` from 18 to 14, value font from 26 to 22 so two rows fit without overflow on the current 1290px viewport.
- Add `gap: 8` between the section header label and the card grid; `gap: 16` between row 1 and row 2.
- Remove the legacy accordion entirely — no toggle, no "Raw engine output" copy.
- Charts/table/event-log below stay unchanged.

---

## Technical notes

- File touched: `src/routes/admin.simulator.tsx` only.
- No new imports, no new dependencies.
- `JackpotConfigDTO` is **not** modified — `minimumSeedAmount` / `maximumSeedAmount` are accessed via `(config.seed as any)` since they live in the persisted JSONB and aren't in the TS type yet. This matches the existing pattern in `ReSeedEventLog` (line 1831).
- `ResultsSummary`, `LedgerCard`, `LedgerTable`, `MathAudit`, `KpiCard` definitions remain in the file but become unreferenced from the dashboard path. Leaving them in place avoids deleting code that the user did not explicitly ask to remove.
- No backend or DTO change requested or made.

---

## Out of scope

- Backend exposing an authoritative `overflowDiverted` or `expectedWins` field.
- Extending `JackpotConfigDTO` with typed `minimumSeedAmount` / `maximumSeedAmount`.
- Restyling the left-hand config panel or charts.

Ready to implement on approval.