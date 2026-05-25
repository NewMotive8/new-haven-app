
## Goal

Make every player-funded preset demonstrate a non-zero fixed House rake per spin, and surface that rake in the Corporate P&L summary stacked with the base-game hold.

## Heads-up before we touch code

Two facts from the codebase that shape this plan:

1. The `contribution.houseWeight` field in `src/routes/admin.simulator.tsx` presets is already non-zero (`0.3`–`0.5`), but it's only read when `contribution.mode === "split"`. Today none of the presets set `mode: "split"`, so the simulator engine ignores it. We need to add a proper split block (or a dedicated `houseFixed` field) — not just bump numbers.
2. I could not find an existing "Casino Corporate P&L Summary" card in `admin.simulator.tsx` (only the `BASE_GAME_HOUSE_HOLD = 0.04` calculation feeding the House Revenue badge note). Either it was removed, lives in a component I haven't located, or it was never actually committed despite the summary saying so. **The plan assumes we are building it** — if it already exists somewhere, point me at the file and I'll update in place instead.

## Changes

### 1. `src/routes/admin.simulator.tsx` — single-jackpot presets

For the three player-funded single presets (`incentiv8-small-loyalty`, `incentiv8-medium-mustdrop`, `incentiv8-enterprise-mega`) and the FREQUENCY preset (`incentiv8-friday-rush`), replace the loose `contribution: { houseWeight: 0.x }` with a real split that produces a flat **€0.15 per spin** to the house regardless of wager:

```ts
contribution: {
  mode: "split",
  totalContributionType: "FIXED",
  totalContributionAmount: <existing pool.contributionAmount + seed.contributionAmount + 0.15>,
  poolWeight:   <pool share %>,
  seedWeight:   <seed share %>,
  houseWeight:  <0.15 / total * 100>,
}
```

Weights are derived so the absolute house cut per spin lands on **€0.15**. Pool and seed `contributionAmount` are left intact so the legacy UI bindings keep rendering.

### 2. `src/lib/jackpot/blueprints/templates.ts` — single + multi blueprints

- **Player-funded singles** (`classicHigh`, `classicMid`, `mustDropHigh`, `mustDropMid`, `happyHigh`, `happyMid`): switch to `contributionMode: "split"` with `totalContributionType: "fixed"` and a `houseWeight` calibrated to emit **€0.15/spin**. Leave `MARKETING_FUNDED` blueprints (`classicSmall`, `mustDropSmall`, `happySmall`) untouched (player contribution is 0 by design).
- **Multi blueprints** (`multiHigh`, `multiMid`): on the `group` object, add a fixed €0.25/spin house rake. Mechanically: set `group.contributionType: "fixed"`, raise `masterPlayerPercent` → `masterPlayerAmount` (or whichever field carries the fixed amount in the multi shape — verify in `JackpotSavePayload`), and route €0.25 of the total into `operatorShare`-equivalent via the existing `group.operatorShare` knob, but **expressed as an absolute amount, not a percent**. If the schema can't express absolute house amounts at the group level, we fall back to setting `operatorShare` to whatever percentage yields €0.25 of the current per-spin total (documented inline). `multiSmall` stays at 0.
- All edits keep `validate-payload.ts` happy (no zeroed-out caps, weights sum to 100).

### 3. Casino Corporate P&L card (in `ResultsSummary`)

Add a new green-accent panel directly below the existing KPI row, sourced from `result` + the active `config`:

| Line | Formula |
|------|---------|
| Jackpot Rake Yield | `iterations × houseRakePerSpin` (read `houseRakePerSpin` from the materialised config: split block's fixed house amount, else 0) |
| Base Game Underlying Hold | `totalWager × BASE_GAME_HOUSE_HOLD` (slider-controlled, defaulting to 4%) |
| **Combined Net Operator Margin** | sum of the two, rendered in success-green |

The card also shows the per-spin rake (€0.15 / €0.25 / €0.00) and the iteration count it was multiplied by, so audit reviewers can reconstruct the number by hand. The existing House Revenue KPI (which reads `result.houseContributions` from the engine) stays as-is — the new card is the executive roll-up, not a replacement.

Add a small slider (4%–15%) bound to a local `baseHoldPct` state so the user can flex the base-game hold assumption without editing code.

### 4. Verification

- `bunx tsc --noEmit`
- Load each preset in `/admin/simulator`, run a 1M-spin simulation, confirm:
  - House Revenue KPI ≈ `iterations × €0.15` for singles, `€0.25` for multis
  - Combined Net Operator Margin = Jackpot Rake Yield + Base Game Hold
  - `classicSmall` / `mustDropSmall` / `happySmall` still report €0 jackpot rake

## Out of scope

- Wizard UI changes (`JackpotCreationForm` inputs for fixed house rake) — only presets and the simulator P&L view.
- Backend `validate-payload.ts` rule changes (we'll work within current constraints).
