
# Goal

Make every action on `/admin/jackpots` and `/admin/jackpot-groups` — **View, Edit, Enable, Disable, Clone, Delete** — work reliably for both single jackpots and MultiJackpots, with no "This page didn't load" crash, and verify each one.

---

# What's actually broken (root cause of "This page didn't load")

The browser console shows a **React render crash** (`Element type is invalid… got undefined`) caught by the root `errorComponent` — not a network failure. The Network panel shows no DELETE call ever fires. So the crash happens on **client render**, the moment the AlertDialog action runs, before the request leaves the browser. The dev-server / DB layer for `DELETE /api/v1/jackpots/$id` is actually fine (FKs on `jackpot_pools` / `jackpot_seeds` already `ON DELETE CASCADE`).

Suspected triggers we'll confirm and fix during step 1 below:
1. `admin.jackpots.index.tsx` mixes `toast` from `react-toastify` while the rest of the app uses `sonner` — `react-toastify`'s `<ToastContainer />` is only mounted in the legacy `backoffice/app` shell, so calling `toast.error()` from this route can throw mid-render in some paths.
2. The `<AlertDialog>` close + immediate `runAction` re-render races with the dropdown's portal teardown, and a stale `row` reference (`row.kind` becomes undefined after invalidate) can render an icon as `undefined`.
3. `View` / `Edit` navigate to `/admin/jackpots/new?editId=…` but that route has **no `validateSearch`** and never loads the record — so post-delete navigation feels broken too.

---

# Plan — six tight phases, each ends with a verification step

### 1. Reproduce & pinpoint the crash (no fix yet)
- Open `/admin/jackpots` in the preview browser, click Delete on a draft jackpot, capture the React stack from console + network tab.
- Confirm whether the crash is from `react-toastify`, the stale row in the dialog, or the dropdown portal.

### 2. Unify the toast layer
- Replace `import { toast } from "react-toastify"` with `import { toast } from "sonner"` in:
  - `src/routes/admin.jackpots.index.tsx`
  - `src/routes/admin.jackpot-groups.$id.tsx`
  - `src/routes/admin.simulator.tsx`
- Ensure `<Toaster />` (sonner) is mounted once at the root (`__root.tsx`); remove duplicate mounts if found.

### 3. Make the confirm dialog crash-proof
- Snapshot the row **before** closing the dialog: capture `const row = confirm` into a local ref, then close, then await.
- Wrap the whole action in `try / catch / finally` that always clears `busyId` and never lets a thrown error bubble into React render.
- Render the dialog body from the snapshot (`row?.name`, `row?.kind`) — never from a value that can flip to `undefined` mid-await.
- Guard `KIND_LABEL[j.jackpotType]` with a fallback so an unknown legacy `jackpotType` renders `"Jackpot"` instead of `undefined`.

### 4. Harden the server side (defensive, even though FKs cascade)
- `DELETE /api/v1/jackpots/$id`: return `409` (not 500) when `assertJackpotEditable` throws `GroupConflictError` — already covered for groups, mirror it for singles.
- `DELETE /api/v1/jackpot-groups/$id`: confirm it 409s when `status === 'active'` and 200s otherwise; today it already detaches children first.
- All five endpoints (`enable.$id`, `disable.$id`, `clone.$id`, `$id` DELETE, `jackpot-groups/$id` DELETE + `…/status` + `…/clone`) return JSON `{ error }` on any thrown path — never a raw 500 HTML page (prevents the "didn't load" symptom on real backend failures too).

### 5. Fix Edit / View navigation so post-CRUD flows complete
- Add `validateSearch` to `/admin/jackpots/new` accepting `{ editId?: number; cloneFrom?: number }`.
- When `editId` is present, hydrate the wizard from `GET /api/v1/jackpots/{id}` (or the group endpoint when the row is `kind: "group"`) and switch to PATCH on save.
- When `cloneFrom` is present, hydrate and POST as a new draft suffixed `(Copy)`.
- For single-jackpot **View** (no detail page exists yet), route to a read-only wizard view (`editId` + `?readonly=1` flag) instead of the editor — keeps the action working without a new page.

### 6. Verification matrix (run in the preview browser, document each)

| Entity | Status | Action | Expected outcome |
|---|---|---|---|
| Single jackpot | draft | Enable | row flips to Active, toast success |
| Single jackpot | draft | Clone | new "(Copy)" row appears as draft |
| Single jackpot | draft | Delete | confirm → row gone, no crash |
| Single jackpot | active | Disable | row flips to Disabled |
| Single jackpot | active | Delete | menu hidden — not offered |
| Single jackpot | disabled | Enable / Clone / Delete | all succeed |
| Single jackpot | any | View / Edit | wizard opens hydrated |
| MultiJackpot | draft / disabled | Enable / Clone / Delete | same as singles |
| MultiJackpot | active | Disable only, no Delete / Clone | enforced 409 if attempted via API |
| MultiJackpot detail page | any | Back button | returns to list |

For every row I'll record: HTTP status, JSON body, toast, and final list state. Anything red → fix, re-run.

---

# Files touched

- `src/routes/admin.jackpots.index.tsx` — toast swap, snapshot row, label fallback
- `src/routes/admin.jackpot-groups.index.tsx` — toast swap (consistency)
- `src/routes/admin.jackpot-groups.$id.tsx` — toast swap
- `src/routes/admin.jackpots.new.tsx` — `validateSearch`, hydrate-from-editId, clone, readonly
- `src/routes/api/v1/jackpots/$id.ts` — error containment (no 500), 409 mapping
- `src/routes/api/v1/jackpot-groups/$id.ts` — confirm 409 path on active
- `src/lib/jackpot/store.server.ts` — small wrap so `deleteJackpot` surfaces a typed conflict instead of a generic Error

# Out of scope

- Audit log / soft-delete (already deferred per previous decision).
- A dedicated single-jackpot detail page (View reuses the wizard in read-only mode for now).
