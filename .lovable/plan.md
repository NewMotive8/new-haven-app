# Fix duplicated Game Assignment in Single Jackpot form

## Problem

The Single Jackpot form now shows two game-targeting blocks:

1. The original **Eligibility & Rules Engine → Casino** card with hardcoded Game Categories, Providers, and a free-text Specific Game IDs input.
2. A new **Game Assignment** card appended at the bottom of the page (the `<GameAssignmentStep />` I added in the last pass).

These overlap conceptually. The latest requirement was to **replace / upgrade** the existing eligibility game pickers — not to add a parallel section.

## Fix (UI only, single file)

In `src/components/jackpot/JackpotCreationForm.tsx`:

1. **Remove** the bottom `<section>` that renders `<GameAssignmentStep />` (around lines 5083–5096).
2. Inside the existing **Eligibility & Rules Engine → Casino** branch (lines ~860–955), **replace** the two hardcoded blocks:
   - "Game Categories" (hardcoded `CASINO_CATEGORIES`)
   - "Specific Game IDs" (free-text chips)
   with a single embedded `<GameAssignmentStep />` wired to `assignedCategories` / `assignedGameIds` state (the same wiring used today). Keep the "Providers / Game Studios" block as-is — it is unrelated to the master-categories/games-catalog requirement.
3. Drop the now-unused `CASINO_CATEGORIES` constant and the `eligCategories` / `eligGameIds` / `eligGameIdDraft` state + their references in `buildEligibility()` (replace with `assignedCategories` and `assignedGameIds` so the payload stays correct).
4. Sportsbook branch is untouched.

No backend, schema, or payload changes — `assignedCategories` and `assignedGameIds` are already plumbed through `buildPayload` and the API.

## Out of scope

- Multi-Jackpot wizard (already renders `<GameAssignmentStep />` exactly once in Step 1).
- Master category list, search server fn, DB schema.
