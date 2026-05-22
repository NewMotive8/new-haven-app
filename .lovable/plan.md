## Problem

The dashboard's **Draft** tab always shows `0` for single jackpots because:

- The schema rule we agreed on is: single drafts are stored with `enabled: false` (no DB migration).
- The dashboard (`src/routes/admin.jackpots.index.tsx`, line 162) maps every `enabled: false` single into the `disabled` bucket. There's no signal saying "this was saved as a draft."
- The Blueprint Center's **Clone as Campaign Draft** does write `enabled: false` correctly, but the row then shows up under **Disabled (3)**, not **Draft (0)**.
- The simulator's only save button is **Save Jackpot**, which forces `enabled: true`. There is no actual "Save as Draft" affordance for the user-built form flow yet.

## Fix

Use a lightweight marker inside the jackpot's `config` JSON — `config.isDraft = true` — to distinguish a draft from a paused/disabled jackpot. No DB migration required.

### 1. Carry `isDraft` through the payload pipeline

- `src/lib/jackpot/types.ts` — add optional `isDraft?: boolean` to `JackpotSavePayload`.
- `src/lib/jackpot/build-create-body.ts`:
  - When `payload.isDraft === true`, set `enabled: false` and merge `isDraft: true` into the returned `config` object.
  - Otherwise leave behavior unchanged (`enabled: true`).
- `src/lib/jackpot/dto-to-payload.ts` — read `cfg.isDraft` back into the rehydrated payload so re-opening a draft from the dashboard keeps the draft flag.
- `src/lib/jackpot/types.ts` `JackpotDTO` already exposes `config`; no change needed there.

### 2. Surface drafts in the dashboard

- `src/routes/admin.jackpots.index.tsx`:
  - In the `rows` `useMemo` (around line 153), change the single-jackpot status derivation:

    ```
    const cfgIsDraft = (j.config as any)?.isDraft === true;
    status: cfgIsDraft ? "draft" : (j.enabled ? "active" : "disabled")
    ```

  - No changes to the tab list, counters, filter logic, or `StatusBadge` — they already understand `"draft"`.
  - Result: the existing Blueprint-cloned draft moves out of **Disabled** into **Draft**.

### 3. Make Blueprint clones explicitly drafts

- `src/components/jackpot/BlueprintCenter.tsx`, `cloneSingleDraft`:
  - Pass `isDraft: true` on the payload before calling `buildCreateBody`. Drop the ad-hoc `{ ...buildCreateBody(payload), enabled: false }` override — the builder now handles it.

### 4. Add a "Save as Draft" button on the simulator

- `src/routes/admin.simulator.tsx`:
  - Add a second button next to **Save Jackpot** labeled **Save as Draft** (neutral/outline styling vs. the green primary).
  - New `handleSaveDraft` mirrors `handleSave` but calls `buildCreateBody({ ...payload, isDraft: true })` and toasts `"Draft saved"`.
  - Both buttons navigate back to `/admin/jackpots`; the dashboard's Draft tab will now reflect the new row.

### 5. (Optional, same edit) Edit-mode hint

- In `src/routes/admin.jackpots.new.tsx`, when `draftId` is present, the page title already reads "Edit Jackpot." No change needed — the draft flag is preserved by step 1's round-trip.

## Out of scope

- No migration, no new status enum, no changes to `jackpot_groups` (multi drafts already use `status: "draft"`).
- No change to the wizard's `Continue` button — drafts continue to be produced via the simulator step or Blueprint clone.

## What you'll see after the fix

- The row you just cloned will move from **Disabled** into **Draft (1)**.
- The 3 existing **Disabled** rows stay where they are (they have no `config.isDraft`).
- The simulator now has both **Save Jackpot** (live) and **Save as Draft** (parked under Draft tab).
