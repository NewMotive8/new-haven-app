## Bug

On the jackpot editor, the **Re-Seeding Amount** input shown for **Must-Drop** and **Frequency** jackpots is broken. Only the **Classic** variant is correctly bound to the wizard's `reseedingAmount` state.

In `src/components/jackpot/JackpotCreationForm.tsx`:

- Line 2364 (Classic) — correct: `value={reseedingAmount}` + `onChange={...setReseedingAmount(...)}`
- Line 3291 (Must-Drop) — broken: `defaultValue="03"`, `placeholder="03"`, no `value`, no `onChange`
- Line 4344 (Frequency) — broken: same as Must-Drop

Consequences for any Must-Drop or Frequency jackpot (e.g. "Erez test 6"):

1. The input is uncontrolled, so opening the editor always shows the literal placeholder `03` regardless of what's stored.
2. Anything the operator types into that box is never written back to the `reseedingAmount` state, so on Save the wizard sends whatever the state still holds (often `0` for a freshly hydrated Must-Drop, or the last value typed into the Classic variant before switching tabs).
3. Result: the saved re-seed value drifts away from what the operator entered, breaking the min-seed floor used by `apply_group_bet` and by `dto-to-payload`.

Database for jackpot 19 confirms the round-trip is *storing* `1` correctly, but the Must-Drop view never displays or accepts edits to that value.

## Fix

Replace the two broken `CurrencyInput` instances with the same controlled pattern used by the Classic variant.

### File: `src/components/jackpot/JackpotCreationForm.tsx`

**Must-Drop block (around line 3291):**

```tsx
<CurrencyInput
  id="reseed-amount"
  type="number"
  placeholder="0"
  value={reseedingAmount}
  onChange={(e) => setReseedingAmount(parseFloat(e.target.value) || 0)}
  className="bg-neutral-800 border-neutral-700 w-full"
/>
```

**Frequency block (around line 4344):**

```tsx
<CurrencyInput
  id="frequency-reseed-amount"
  type="number"
  placeholder="0"
  value={reseedingAmount}
  onChange={(e) => setReseedingAmount(parseFloat(e.target.value) || 0)}
  className="bg-neutral-800 border-neutral-700 w-full"
/>
```

No other state, persistence, or engine changes are needed — `reseedingAmount` is already serialized by `buildTriggerCondition` (into `seed.minimumSeedAmount`) and rehydrated by `dtoToPayload`. The Classic path already proves the wiring works end-to-end.

## Verification

1. Open "Erez test 6" (Must-Drop, editId=19) — Re-Seeding Amount should display `1` (the stored value), not `03`.
2. Change it to e.g. `5`, click Save, reopen — should display `5`.
3. Repeat for a Frequency-type jackpot.
4. Confirm Classic still works (regression check).
5. `bunx tsc --noEmit` for a clean compile.
