## Root cause

When you click "Edit" on an existing jackpot, the editor opens at `/admin/jackpots/new?editId=123`. The form (`JackpotCreationForm`) loads the existing config correctly, but its bottom **"Continue"** button does NOT call the parent's `onSave` (PUT) handler in `admin.jackpots.new.tsx`. Instead it:

1. Serializes the payload to `sessionStorage` under `jackpot:pendingPayload`
2. Navigates to `/admin/simulator` (carrying the payload, but **not the editId**)

The simulator page's "Save" button then unconditionally calls:

```ts
await axios.post("/api/v1/jackpots", body, …)   // src/routes/admin.simulator.tsx:129
```

So every save from the edit flow creates a brand-new record with the same name — the duplicate the user is seeing. The actual `PUT /api/v1/jackpots/:id` endpoint and the parent route's `handleSave` are correct; they're simply never invoked because the form short-circuits to the simulator.

Groups (`admin.jackpot-groups.$id.tsx`) already PATCH correctly and are unaffected, but we'll audit the user-visible "Save" flows in that page once more to confirm.

## Fix (scope: form submission handlers + UI state only)

### 1. `src/components/jackpot/JackpotCreationForm.tsx`
- Accept an optional `editId?: number` prop.
- In `handleContinue`, include `editId` (when present) in:
  - the `sessionStorage` payload (`jackpot:pendingPayload`)
  - the router `state.jackpotConfig` carried into `/admin/simulator`
- No other behavioral changes; "Continue" still goes to the simulator preview.

### 2. `src/routes/admin.jackpots.new.tsx`
- Pass `editId={isEditing ? editId : undefined}` to `<JackpotCreationForm>`.

### 3. `src/routes/admin.simulator.tsx` — the real fix
- Read `editId` from the hydrated payload (state first, then sessionStorage fallback).
- Keep it in a ref alongside `originalPayloadRef` so user edits in the JSON textarea don't lose it.
- In `persistJackpot(asDraft)`:
  - If `editId` is present → `axios.put('/api/v1/jackpots/{editId}', body, …)` and toast `"Jackpot updated"`.
  - Else → existing `axios.post('/api/v1/jackpots', body, …)` for create / clone.
- Always clear `sessionStorage['jackpot:pendingPayload']` after success so a subsequent "Create new" doesn't inherit the stale `editId`.
- Update button labels: when editing, show "Save changes" / "Save changes as draft" instead of "Create" / "Save draft".

### 4. `src/routes/admin.jackpots.index.tsx`
- No code change needed — already navigates with `{ search: { editId: row.id } }`. After fix it will round-trip cleanly through the simulator.

### 5. Quick verification (no changes expected)
- Re-read `admin.jackpot-groups.$id.tsx` `saveProfile()` → already PATCH on `group.id`. Confirm no other "Save" button on that page POSTs.
- `updateJackpot` in `src/lib/jackpot/store.server.ts` does accept the partial DTO and patches in place — out of scope here (some fields are not yet persisted on update, but that's a separate "edits don't stick" issue, not the duplication bug).

## Expected result

Editing an existing jackpot → Continue → Simulator → Save now issues `PUT /api/v1/jackpots/:editId` and the dashboard refreshes the same row instead of spawning a duplicate. Creating a brand-new jackpot is unchanged. Group editing is unchanged (already correct).
