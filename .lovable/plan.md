# Master Contribution — align with Single Jackpot pattern

## Why

The Multi-Jackpot **Master Strategy** step currently uses three plain selects (Source, Type, Value). The Single Jackpot flow has a much richer, already-loved pattern in its **Jackpot Contribution** card. Operators want one mental model, not two.

## What to change (UI only, MultiJackpotWizard Step 1)

Replace the current `<select>` block (`MultiJackpotWizard.tsx` ~lines 583–658) with the exact pattern from `JackpotCreationForm.tsx` lines 817–960:

1. **Header** — "Jackpot Contribution" card.
2. **Fixed / Percent toggle** — two segmented buttons (same styling as Single).
3. **Wager Eligibility Limits** (Min / Max Qualifying Wager) — visible only when Percent is selected. Identical to Single.
4. **Amount field** — single input with `€` or `%` suffix depending on toggle. Reuses `AmountDraftInput`.
5. **Contribution Weight grid** — three rows (Pool / Seed / House), each with a `WeightDraftInput` (%) and a read-only Amount column using the same largest-remainder rounding helper from Single. Validates sum = 100.

The legacy Player / Operator dropdown disappears entirely — that distinction is already encoded by Pool vs House in the weight grid (House = operator-funded portion).

## State changes (MasterDraft)

Drop:
- `contributionSource`
- `contributionType`
- `masterContributionValue`

Add (mirroring Single):
- `contributionType: 'fixed' | 'percentage'`  *(kept, just narrower meaning)*
- `totalContributionAmount: number`
- `poolWeight`, `seedWeight`, `houseWeight: number`  (sum to 100)
- `minWagerAmount`, `maxWagerAmount: number`  (percent mode only)

Derived helpers (`pickWeight`, `setSingleWeight`, allocated rounding) are lifted out of `JackpotCreationForm.tsx` into a new shared file `src/lib/jackpot/contribution-weights.ts` so both forms import the same logic instead of forking it.

## Payload wiring (Step 1 save)

`POST /api/v1/jackpot-groups` body gains:

```text
contributionType, totalContributionAmount,
poolWeight, seedWeight, houseWeight,
minWagerAmount, maxWagerAmount
```

The existing `contributionSource` / `masterContributionValue` keys are removed from the request schema (`src/routes/api/v1/jackpot-groups/index.ts`) and the store layer (`src/lib/jackpot/store.server.ts`). Recap chips on Step 2 / Step 3 are updated to render `Fixed 0.50 € · Pool 60% / Seed 30% / House 10%` instead of the old `Player · Percentage · 1%` triplet.

## Tier inheritance (unchanged, but clarified)

Tiers continue to inherit the master's contribution config — they do not re-render the weight grid. The derived per-tier rate preview in the Draft Tier Card now reads `(totalContributionAmount × splitShare%)` of the **pool** weight only (since Seed and House never flow into tier pools).

## Out of scope

- Per-tier overrides of weights or wager limits.
- Backend math beyond passing the new fields through `createGroup`.
- Any change to the Single Jackpot form (it stays the source of truth — we are only adopting its pattern in Multi).

## Files touched

- **Edit:** `src/components/jackpot/MultiJackpotWizard.tsx` — replace the contribution block in Step 1; update recap chips in Steps 2 & 3.
- **New:** `src/lib/jackpot/contribution-weights.ts` — extracted weight helpers + allocator.
- **Edit:** `src/components/jackpot/JackpotCreationForm.tsx` — import helpers from the new shared file (behavior unchanged).
- **Edit:** `src/routes/api/v1/jackpot-groups/index.ts` — Zod schema swap.
- **Edit:** `src/lib/jackpot/store.server.ts` — persist the new fields on the group row.
