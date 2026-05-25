## Goal
Fix the bug where "Erez test 6" (and other jackpots) lose their Slots/Game targeting after an edit, causing `/demo` to throw "This game is not assigned to a Jackpot." The root cause: `assignedCategories` and `assignedGameIds` are collected by the wizard but never persisted to the dedicated `jackpots.assigned_categories` / `assigned_game_ids` columns on create/update.

## Changes

### 1. `src/lib/jackpot/build-create-body.ts`
Surface eligibility selections at the top level of the body sent to `POST/PUT /api/v1/jackpots`:
- Derive `assignedCategories` from `payload.eligibility?.casino?.categories ?? []`.
- Derive `assignedGameIds` from `payload.eligibility?.casino?.gameIds`, coerced to numbers (filter out non-numeric).
- Return these alongside the existing fields (they already exist in `JackpotDTO`, just weren't being sent).
- Leave sportsbook / players targeting inside `config.eligibility` as today.

### 2. `src/lib/jackpot/store.server.ts` — `updateJackpot`
Today only `name`, `enabled`, `contribution_percentage`, `trigger_condition`, `trigger_probability`, pool balance, seed amounts, and seed caps are persisted. Add:
- `if (dto.assignedCategories !== undefined) patch.assigned_categories = dto.assignedCategories;`
- `if (dto.assignedGameIds !== undefined) patch.assigned_game_ids = dto.assignedGameIds;`
This fixes the regression for any future edit and recovers targeting next time the user saves "Erez test 6".

### 3. `createJackpot` — no code change required
It already writes `assigned_categories` / `assigned_game_ids` from the DTO, so once step 1 sends them, new jackpots are correct.

### 4. One-off data repair for "Erez test 6"
Run a single SQL update through the migration tool to restore the live row's targeting from the latest `admin_audit_log` entry that contains a non-empty `after_state.assignedCategories` / `assignedGameIds`. Concretely:
```
UPDATE jackpots
SET assigned_categories = ARRAY['Slots']::text[],
    assigned_game_ids   = '{}'::bigint[]   -- or the IDs the user actually wants
WHERE id = <erez_test_6_id> AND brand_id = <brand>;
```
Before running, confirm with the user which categories/games "Erez test 6" should target (Slots only? specific game IDs?). If the audit log still holds the original payload, I'll propose the exact values for approval.

## Verification
1. Edit "Erez test 6" in the admin form, save → reload `/demo` and launch a Slots game → no error, jackpot resolves.
2. Create a new jackpot targeting Slots → row in DB has `assigned_categories = {Slots}` immediately.
3. `bunx tsc --noEmit` passes.

## Out of scope
- Sportsbook/league targeting persistence (still inside JSONB; not the source of the current bug).
- Multi-tier (group) jackpot assignment columns — separate code path.
