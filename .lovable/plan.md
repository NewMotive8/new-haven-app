# Remove Fixed Pool/Seed Contribution Amount fields

## Why these fields are no longer needed

In the previous step we removed the per-card **Fixed / Percentage** toggle from both Pool Setup and Seed Setup. With that toggle gone, contributions are always expressed as a **percentage of the wager**, split between Player and Operator via the sliders / % inputs.

A "Fixed … Contribution Amount" input only makes sense when the user can switch the card into **Fixed** mode. With no way to choose Fixed anymore, those inputs:

- have no UI path that activates them,
- can never affect the resulting jackpot math,
- contradict the new design (Pool/Seed are percentage-only),
- and would confuse operators by suggesting a configuration mode that no longer exists.

So they're dead UI — safe and correct to delete.

## What to remove

In `src/components/jackpot/JackpotCreationForm.tsx`, delete the label + input block for each of these occurrences (label + its associated numeric input, plus any wrapping field container):

1. Line ~1249 — Classic: Fixed Pool Contribution Amount
2. Line ~1492 — Classic: Fixed Seed Contribution Amount
3. Line ~2269 — Must Drop: Fixed Pool Contribution Amount
4. Line ~2510 — Must Drop: Fixed Seed Contribution Amount
5. Line ~3721 — Frequency: Fixed Pool Contribution Amount
6. Line ~3962 — Frequency: Fixed Seed Contribution Amount

Keep the surrounding Pool / Seed sliders and Player/Operator % logic untouched.

## Out of scope

- No state/business-logic changes. Underlying `poolContribution` / `seedContribution` state can stay for now (used elsewhere or harmless); we only remove the UI fields.
- No backend changes.
