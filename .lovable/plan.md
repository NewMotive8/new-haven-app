## Goal

Remove the **"Percentage of Wager – Pool Contribution Amount"** UI input and excise the legacy `poolPercentageValue` field from the stack. The v2 Contribution Weight split (Total Contribution × Pool weight) becomes the sole source of the pool's contribution rate.

## The API-safety crux

Unlike the seed field we just removed, `poolPercentageValue` is the **only thing currently feeding `contributionRate`** — a real top-level API/DB column (`jackpots.contribution_percentage`). Removing it naively would zero out that column. Fix: re-derive `contributionRate` from the v2 split inside `build-create-body.ts`.

### Derivation rule (replacement for `build-create-body.ts` L88)

```text
if totalContributionType === 'percentage':
    contributionRate = (totalContributionAmount × poolWeight) / 10000
        // e.g. total 3% of wager, poolWeight 60 → 0.018 (1.8%)

if totalContributionType === 'fixed':
    contributionRate = 0
        // a fixed currency total has no meaningful per-wager rate;
        // the engine reads the fixed amount from config.engineV2 +
        // config.pool.contributionAmount, which already happens today.
```

The simulation/math engine path is unaffected: in split mode `payload-to-config.ts` already builds pool/seed contributions from `totalContributionAmount × weights`, never reading `poolPercentageValue`. The `contributionRate` column is essentially a reporting/summary value plus the legacy engine input used by `store.server.ts:415` for non-split jackpots.

## Files to edit

1. **`src/components/jackpot/JackpotCreationForm.tsx`**
   - Remove `poolPercentageValue: number;` from `JackpotSavePayload` (L193).
   - Remove `const [poolPercentageValue, setPoolPercentageValue]` state (L381).
   - Remove `poolPercentageValue: poolPercentageValue[0]` from payload object (L744).
   - Delete the 3 `<BrightLabel … Percentage of Wager Pool Contribution Amount>` blocks plus their `<PercentageInput value={poolPercentageValue[0]}>` siblings (Classic L2137‑2150, Must‑Drop L3069‑3082, Frequency L4147‑4160).

2. **`src/lib/jackpot/build-create-body.ts`**
   - Drop `poolPercentageValue: p.poolPercentageValue` from the `pool` block (L17).
   - Replace L88 with the derivation rule above.

3. **`src/lib/jackpot/payload-to-config.ts`**
   - L94: legacy branch becomes `const poolContributionAmount = jSplit ? jPoolAmt : 0;` (mirrors what we did for seed).

4. **`src/lib/jackpot/dto-to-payload.ts`**
   - Drop L56 (`poolPercentageValue: …`).

5. **`src/lib/jackpot/blueprints/templates.ts`** — strip all 9 `poolPercentageValue:` entries.

6. **`src/components/jackpot/BlueprintCenter.tsx`** — strip L67.

## Where the parameter now comes from

| Concern | Old source | New source |
|---|---|---|
| UI input for operator | Standalone "Percentage of Wager" field | Total Contribution input + Pool row in the Contribution Weight table |
| `contributionRate` (API/DB column) | `poolPercentageValue / 100` | Derived from `totalContributionAmount × poolWeight / 10000` (percentage mode) or `0` (fixed mode) |
| Math engine pool contribution | `poolPercentageValue` via legacy branch | Already sourced from split (`totalContributionAmount × poolWeight / 100`) |
| Re-opening saved jackpots | `dto.contributionRate × 100` rehydrated as legacy field | Saved `engineV2.totalContributionAmount` + `poolWeight` rehydrated into the split inputs (already wired) |

## API contract / DB

- `contributionRate` field on the API body: **still present**, derivation changed.
- `jackpots.contribution_percentage` column: **still populated** on insert/update.
- `config.engineV2.poolWeight` / `totalContributionAmount`: **already persisted today**.
- No migration needed. No endpoint signature change.

## Verification after the edit

1. TS strict build passes — every dangling reference is caught.
2. `rg poolPercentageValue src/` returns zero matches.
3. Open `/admin/jackpots/new` on Classic / Must‑Drop / Frequency — only the Contribution Weight table drives pool contribution. The standalone "Percentage of Wager Pool Contribution Amount" input is gone.
4. Open `/admin/jackpots/new?editId=11` — form hydrates from the v2 split without console errors.
5. Save a jackpot in split-percentage mode (e.g. total 3%, pool 60) — confirm payload sent to `POST /api/v1/jackpots` has `contributionRate: 0.018`.
6. Save one in split-fixed mode — confirm `contributionRate: 0` and `config.engineV2.totalContributionAmount` carries the fixed value.
