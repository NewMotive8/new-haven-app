# Remove Fixed Pool / Seed Contribution Amount fields

## Why these fields are redundant

Contribution is already fully defined at the **Jackpot level**:

1. **Contribution type** (Fixed or Percentage) — set once on the jackpot.
2. **Contribution amount** — the single source-of-truth value for that jackpot.
3. **Contribution Weight distribution table** — splits that jackpot-level amount across Pool and Seed (and any other destinations).

Given (1) + (2) + (3), the Pool and Seed cards don't need their own "Fixed … Contribution Amount" inputs. The amount is set at the jackpot level, and the per-destination share is derived from the Contribution Weight table — not from a second amount typed into each card. Keeping these fields would create two competing sources of truth for the same number.

## What to remove

In `src/components/jackpot/JackpotCreationForm.tsx`, delete the label + input (and surrounding field wrapper) at each occurrence:

1. ~L1249 — Classic: Fixed Pool Contribution Amount
2. ~L1492 — Classic: Fixed Seed Contribution Amount
3. ~L2269 — Must Drop: Fixed Pool Contribution Amount
4. ~L2510 — Must Drop: Fixed Seed Contribution Amount
5. ~L3721 — Frequency: Fixed Pool Contribution Amount
6. ~L3962 — Frequency: Fixed Seed Contribution Amount

Leave the Player/Operator % split UI and sliders untouched.

## Out of scope

- No changes to jackpot-level Contribution type/amount or the Contribution Weight table.
- No business-logic or backend changes. Unused state vars can be cleaned up in a follow-up if they're truly orphaned.
