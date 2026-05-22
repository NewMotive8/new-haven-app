
# Why Edit is broken today

`/admin/jackpots` builds two row kinds:
- `kind: "single"` — from `/api/v2/jackpots` (excluding tier children with `groupId != null`)
- `kind: "group"` — from `/api/v1/jackpot-groups`

`goEdit(row)` already branches on `row.kind`:
- group → `/admin/jackpot-groups/$id` ✅
- single → `/admin/jackpots/new?editId=<id>` ❌

But `/admin/jackpots/new`:
1. has no `validateSearch`, so `editId` is silently dropped
2. always mounts `<JackpotCreationForm />` with no `initialDraft` prop (the form doesn't even accept one)
3. always POSTs a new record on save — there is no PUT path

`/admin/jackpot-groups/$id` loads the group fine but the user reports landing on the **single** page when editing a MultiJackpot. That means the row they clicked was `kind: "single"` (id 9 is a tier child whose `groupId` filter didn't apply, OR groups list failed to load and the tier child was shown as a standalone). Either way the root cause is the same: **edit was never implemented for singles, and tier-child rows must never be editable as standalones.**

# Fix plan

## 1. Route plumbing — make `?editId` / `?cloneFrom` first-class

`src/routes/admin.jackpots.new.tsx`:
- Add `validateSearch` with zod adapter: `{ editId?: number; cloneFrom?: number; readonly?: boolean }`.
- Read search via `Route.useSearch()`.
- When `editId` is set: `GET /api/v1/jackpots/{editId}` on mount → hydrate the form.
  - If the response has `groupId != null` → **redirect** to `/admin/jackpot-groups/$id` (params.id = groupId). Tier children must be edited via their parent group.
- When `cloneFrom` is set: same GET, suffix name with " (Copy)", strip id, force POST.
- Force the tab to "single" while editing (hide the Multi tab) so users can't accidentally switch context.

## 2. Hydration — feed real data into the form

`JackpotCreationForm` currently has no `initialDraft` prop. Add one:
- `initialDraft?: JackpotSavePayload` — when present, seed all state from it (run through existing `sanitizeIncomingDraft`).
- New helper `src/lib/jackpot/dto-to-payload.ts` (mirror of `build-create-body.ts` in reverse): convert `JackpotDTO` (+ `config`, `pool`, `seed`, `timed`, `contribution`, `assignedCategories`, `assignedGameIds`) back into `JackpotSavePayload`.
- Reuse `sanitizeIncomingDraft` to lock down Must-Drop, decode Frequency Happy-Hour JSON, etc.

## 3. Save path — PUT when editing, POST when creating/cloning

`admin.jackpots.new.tsx#handleSave`:
- If `editId` and not `cloneFrom`: `PUT /api/v1/jackpots/{editId}` with `buildCreateBody(payload)` (server already supports PUT and returns 409 on group conflicts).
- Else: existing POST.
- Toast "Jackpot updated" / "Jackpot created" accordingly, then navigate back to `/admin/jackpots`.

## 4. Group edit — verify the existing path actually hydrates

`admin.jackpot-groups.$id.tsx` already loads the group; confirm it also:
- Loads tier children via `/api/v1/jackpot-groups/$id/children`
- Mounts `MultiJackpotWizard` with those children as initial state (add `initialDraft` support if missing)
- PUTs on save instead of POSTing a new group

If the wizard doesn't accept an initial state, add `initialGroup` / `initialTiers` props and seed its reducers from them.

## 5. List page — make sure groups always render and tier children never appear as singles

In `admin.jackpots.index.tsx`:
- If `groupsQuery.isError`, show an inline banner (not silent) — today the tier-child filter still hides children, so a failed groups fetch makes a MultiJackpot vanish from the UI entirely.
- Defensive: also hide rows where `j.groupId != null` even if the v2 endpoint forgets to set it, by cross-referencing the groups' children list when available.
- Add a small "Multi" badge column for `kind: "group"` rows (already partially done with the Layers icon) — confirm it's visible at this viewport.

## 6. Server hardening (small, defensive)

- `GET /api/v1/jackpots/{id}` already returns the DTO — confirm `config`, `assignedCategories`, `assignedGameIds`, and `groupId` are populated (add to the SELECT if missing).
- `PUT /api/v1/jackpots/{id}` — return 409 with a clear message if `groupId != null` (cannot edit tier child directly; edit the parent group). Already throws `GroupConflictError`; verify the message text.

## 7. Verification matrix (run in preview, record HTTP + UI for each)

| Row kind | Status | Action | Expected |
|---|---|---|---|
| single | draft | View | wizard opens hydrated, read-only banner |
| single | draft | Edit | wizard opens hydrated, Save → PUT 200 |
| single | draft | Clone | new "(Copy)" row in list as draft |
| single | draft | Delete | row gone, no crash |
| single | active | Disable / Enable | status flips, toast |
| single | any | Edit on a **tier child** | redirects to group editor |
| group  | draft / disabled | View / Edit | `/admin/jackpot-groups/$id` opens hydrated |
| group  | draft / disabled | Clone | new draft group with tiers |
| group  | draft / disabled | Delete | row gone |
| group  | active | Disable | flips to disabled |
| group  | active | Delete / Clone | 409 surfaced as toast |

For each row I record HTTP status, response body, toast text, and final list state. Any red → fix → re-run.

# Files touched

- `src/routes/admin.jackpots.new.tsx` — `validateSearch`, hydrate via GET, redirect tier children, PUT vs POST
- `src/components/jackpot/JackpotCreationForm.tsx` — accept `initialDraft`, seed state from it
- `src/components/jackpot/MultiJackpotWizard.tsx` — accept `initialGroup` / `initialTiers`, PUT on save when editing
- `src/routes/admin.jackpot-groups.$id.tsx` — pass loaded group + children into the wizard, ensure save uses PUT
- `src/lib/jackpot/dto-to-payload.ts` — new reverse mapper (DTO → `JackpotSavePayload`)
- `src/routes/api/v1/jackpots/$id.ts` — confirm GET returns full config + `groupId`; PUT 409 message on tier children
- `src/routes/admin.jackpots.index.tsx` — surface groups-query errors, defensive tier-child hiding

# Out of scope

- A dedicated read-only single-jackpot detail page (View reuses the wizard with `readonly=1`).
- Audit log / soft delete (still deferred).
