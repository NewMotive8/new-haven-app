# Fix Contribution Weight table editing

## Issues observed

1. **Can't type into the % fields** — only the spinner arrows work.
2. **Editing one weight changes the other two** — user wants free editing, just capped so the total can't exceed 100%.

## Root causes

In `src/components/jackpot/JackpotCreationForm.tsx`:

1. The `Row` component is defined **inside the render IIFE** (~L452). Every keystroke triggers a parent re-render, which creates a brand-new `Row` component identity, which unmounts and remounts the `<Input>` — so it loses focus after a single character. Spinner arrow clicks happen to "work" because each click is a single committed event that doesn't depend on retained focus across keystrokes. On top of that, `parseFloat(e.target.value) || 0` turns an empty string into `0`, so the field can never be cleared while typing.
2. `rebalanceWeights` (~L197) deliberately redistributes the other two values to force the trio to sum to 100. That's the auto-rebalance the user is rejecting.

The same pattern is duplicated inside each multi-level tier (~L4290–4360) via `setTierWeight`.

## Changes

### 1. Top-level Contribution Weight table (~L445–480)

- Move `Row` out of the render IIFE — either lift it to a stable component above the JSX, or inline the three rows directly. Either way, the input keeps its identity across renders and focus is preserved while typing.
- Replace `rebalanceWeights` with `setSingleWeight(key, val)` that only updates the one field the user is editing.
- Cap the typed value so the total can't exceed 100: clamp `val` to `[0, 100 - sumOfOtherTwo]`. The other two weights are never touched.
- Keep the existing amber "Sum: X% — must equal 100 to save" warning when the total isn't exactly 100. The save-side validator in `buildCreateBody` already blocks save until the sum is exactly 100, so this is the only gate needed.
- Allow empty / in-progress input: store the raw string in local state (or accept `e.target.value === '' ? 0 : parseFloat(...)`) so backspacing to empty doesn't snap to 0.

### 2. Per-tier weight controls in Multi-Level (~L4290–4360)

Apply the same two fixes to `setTierWeight`:
- Only patch the edited key (`poolWeight` / `seedWeight` / `houseWeight`) on the tier.
- Clamp to `[0, 100 - other two]` so the tier's total can't exceed 100.
- Keep the existing "Sum: X% — must equal 100 to save" indicator.

## Out of scope

- No changes to the save-time validation in `src/lib/jackpot/build-create-body.ts` (the "exactly 100" gate stays — it just runs at save instead of fighting the user mid-edit).
- No styling / layout changes to the table itself.
- No changes to the jackpot-level Contribution type/amount inputs above the table.
