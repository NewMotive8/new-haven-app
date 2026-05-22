# Clean up Single Jackpot form + add CSV upload

UI-only changes inside `src/components/jackpot/JackpotCreationForm.tsx` plus
removal of dead plumbing. No DB / API changes.

## 1. Fully remove the Game Assignment block

Drop everything tied to the new bottom-of-page `<GameAssignmentStep />` in the Single Jackpot form:

- Remove the `<section>` rendering `<GameAssignmentStep />` (~lines 5083–5096).
- Remove `assignedCategories` / `assignedGameIds` state, the `initial?.assignedCategories` / `initial?.assignedGameIds` reads, and the `assignedCategories` / `assignedGameIds` fields from `JackpotSavePayload` and from the object returned by `handleContinue`/save.
- Remove the `GameAssignmentStep` + `MasterCategory` + `GameAssignmentValue` imports.
- In `src/lib/jackpot/build-create-body.ts`, drop the `assignedCategories` / `assignedGameIds` fields from the POST body.
- Leave `src/components/jackpot/GameAssignmentStep.tsx`, `src/lib/games.functions.ts`, the `games` table, and the Multi-Jackpot wizard untouched — that is where the new picker still belongs.

## 2. Remove "Overlapping Jackpot Rule"

- Delete the `overlappingSection` block (~lines 798–823) and the line that renders it.
- Remove the `overlappingRule` state + `setOverlappingRule`, the field on `JackpotSavePayload`, and the `overlappingRule` entry in the saved payload.
- In `build-create-body.ts`, drop `overlappingRule` from `engineV2`.

## 3. Add a CSV upload control to "Eligibility & Rules Engine"

Inside the Casino branch of the Eligibility card, add a small "Bulk upload from CSV" row at the top of the card:

- A `Bulk Game IDs (CSV)` file input (`accept=".csv,text/csv"`) + tiny help text: "Upload a CSV with a single `game_id` column. Rows are merged into Specific Game IDs."
- On change, parse client-side (split lines, ignore header `game_id`, trim, dedupe against `eligGameIds`), then `setEligGameIds([...existing, ...parsed])`.
- Show a toast with how many IDs were imported / skipped. Reset the input value so the same file can be re-uploaded.
- Existing manual Game Categories / Providers / Specific Game IDs inputs stay as they are.

## 4. CSV upload in "Custom Target Segments & Restrictions"

Add a CSV upload to both columns (only visible when `audienceMode === 'custom'`):

- **Inclusions column (left, after the Target CRM Segments input)**: "Bulk upload included Player IDs (CSV)" → file input that parses a single-column `player_id` CSV and pushes unique IDs into a new state list `includedPlayerIds` rendered as emerald chips just below. Add a small helper text + per-import toast.
- **Exclusions column (right, after the existing Blacklisted Player IDs textarea)**: "Bulk upload blacklisted Player IDs (CSV)" → file input that appends parsed IDs into the existing `blacklistedIdsRaw` textarea (one per line, deduped), so it keeps the existing payload shape.

Shared CSV helper (local `parseCsvIds(file)` in this file): read as text, split on `\r?\n`, drop the optional header row if it starts with the column name, trim, filter empties, dedupe. Cap at 10 000 rows with a toast warning if exceeded. No new npm dependency.

Add `includedPlayerIds` to the audience payload (alongside the existing `blacklistedPlayerIds`) so the new field flows through `buildAudience()` / saved payload.

## 5. Trigger Probability — fix the missing field on Single Jackpot

You're right: there is no Trigger Probability input on the Single Jackpot
form today. The existing "Trigger Probability Denominator (N)" block
(`JackpotCreationForm.tsx` ~line 4990) lives inside a per-tier loop
(`t.triggerOdds`, `updateTier(idx, ...)`) and only renders for the legacy
multi-level path. For Classic / Must-Drop / Frequency it never appears, and
`triggerOdds` is never written to the payload.

Fix:

- Promote a single top-level `triggerOdds` state on `JackpotCreationForm`
  (default `0` = disabled) and a `setTriggerOdds`.
- Add a "Trigger Probability" card to the Single Jackpot form, placed
  right after **Jackpot Contribution** (and visible for all three Single
  types — Classic, Must-Drop, Frequency). It mirrors the per-tier UI:
  - Numeric input "Trigger Probability Denominator (N)" capped at
    10,000,000.
  - Live read-only badge "1 in N spins" / "disabled".
  - "RNG Boundary Limit: Max 10,000,000" amber chip and the
    `p = 1/N per spin` helper line.
- Wire `triggerOdds` into `JackpotSavePayload` and the object returned by
  save. `buildCreateBody` already forwards `payload.triggerOdds` to
  `engineV2.triggerOdds` and validates the ceiling, so no backend change.
- The per-tier denominator inside the legacy multi-level block stays as-is.

For context: the MultiJackpot wizard's tier dialog has its own
"Trigger Denominator" that gets converted by `denominatorToProbability(...)`
and POSTed as `triggerProbability` to `/api/v1/jackpot-groups/:id/children`
(`MultiJackpotWizard.tsx` ~line 243). That is per-tier on a group and is
unrelated to the new Single Jackpot field above.

## Out of scope

- Multi-Jackpot wizard layout and its tier-level Trigger Denominator UI.
- Backend schema / API changes. `games` table, `assigned_categories`, `assigned_game_ids`, and `overlappingRule` columns stay in place; the Single Jackpot form just stops writing to them.
