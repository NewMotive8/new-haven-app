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

## 5. Trigger Probability — where it lives today (answer, no change)

- **Single Jackpot form**: I am not adding a separate "Trigger Probability" field. The user enters a denominator `N` in **"Trigger Probability Denominator (N)"** (`JackpotCreationForm.tsx` ~line 4990). That value is saved as `triggerOdds` in the payload, and the engine treats it as `p = 1/N` per spin. Nothing is being written twice.
- **MultiJackpot wizard**: Each tier dialog has its own "Trigger Denominator" input. On save (`MultiJackpotWizard.tsx` line 243–249) it converts the denominator to a probability via `denominatorToProbability(...)` and POSTs it as `triggerProbability` to `/api/v1/jackpot-groups/:id/children` — this is per-tier, not per-jackpot, and is unrelated to the Single Jackpot denominator field above.

If you want a single visible "Trigger Probability (1 in N)" preview next to the existing denominator input on the Single Jackpot form, say the word and I will add a read-only computed line — but I will not introduce a second writable field.

## Out of scope

- Multi-Jackpot wizard layout and its tier-level Trigger Denominator UI.
- Backend schema / API changes. `games` table, `assigned_categories`, `assigned_game_ids`, and `overlappingRule` columns stay in place; the Single Jackpot form just stops writing to them.
