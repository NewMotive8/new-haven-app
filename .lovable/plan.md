# Phase 3 — Legacy Purge, Simulator Realignment, MultiJackpot Admin UI

Closes out the relational-groups migration: deletes the in-code
`MULTI_LEVEL` tier path, retargets the simulator and sandbox at
`/api/v1/event/bet` with `groupId`, and ships a new admin wizard
branded "MultiJackpot".

## 1. Legacy code purge

### `src/lib/jackpot/types.ts`
- Remove `"multi_level"` from `JackpotKind`.
- Remove `"MULTI_LEVEL"` from `JackpotStructuralType`.
- Delete the `TierDTO` interface (multiLevelTier/multiLevelWeight fields).
- Drop the `tiers?: TierDTO[]` field from `JackpotConfigDTO` and from the
  simulation result types; remove the "Per-tier roll-up" comment block.
- Keep `CLASSIC`, `MUST_DROP`, `FREQUENCY` — those are unrelated.

### `src/lib/jackpot/payload-to-config.ts`
- Remove the `multi_level | multilevel | multi-level → MULTI_LEVEL` branch
  in `mapStructural`.
- Delete the entire "build tier array" block (lines ~112–130) and the
  "Apply per-tier split / trigger odds" block (lines ~186–200).
- Remove `tiers` from the returned config object.

### `src/lib/jackpot/ledger.ts`
- Remove the `if (jp.structuralType === "MULTI_LEVEL" && Array.isArray(jp.tiers)…)`
  branch in `computeBetLedger` (lines ~71–84). The function keeps its CLASSIC
  single-slice behavior; relational fan-out is handled in the bet route via
  `computeMultiCampaignLedger`.
- Strip `tier`/`label` MULTI_LEVEL comments from the doc headers.

### `src/lib/jackpot/build-create-body.ts`
- Delete the `if (p.type === "multi_level" && Array.isArray(p.tiers))`
  validation block (lines ~24–35).
- Delete the trailing `…(p.type === "multi_level" … ? { tiers: p.tiers } : {})`
  spread (line ~109).
- Add an explicit guard at the top: if `p.type === "multi_level"` or
  `Array.isArray(p.tiers)`, throw
  `Error("Legacy multi_level jackpots are deprecated. Use POST /api/v1/jackpot-groups to create a MultiJackpot, then attach child tiers via /children.")`.

## 2. Simulator realignment

### `src/lib/jackpot/simulator.ts`
- Delete the `simulateMultiLevel` function and the
  `if (structuralType === "MULTI_LEVEL" && jackpot.tiers …)` dispatch in the
  top-level `simulate()` (lines ~58–60).
- Remove the `liveTiers`, `tierState`, `winningTier`, and per-tier audit
  paths. Keep CLASSIC + MUST_DROP/FREQUENCY paths intact.
- Add a new exported function:
  ```ts
  simulateGroup(groupId: number, brandId: number, opts: {
    iterations: number; wagerPerSpin: number;
    onProgress?: (done: number, total: number) => void;
  }): Promise<GroupSimResult>
  ```
  It loops `iterations` times, POSTs to `/api/v1/event/bet` with
  `{ transactionId: <uuid>, wager, gameId: "sim", groupId }`, and aggregates
  `perJackpot[]` slices into a per-tier roll-up:
  `{ tierRank, jackpotId, jackpotName, totalPool, totalSeed, totalHouse,
     wins, totalWinAmount }`.
- `GroupSimResult` shape mirrors today's `MultiLevelSimResult` so the
  existing chart components keep working with minimal prop changes.

### `src/routes/sandbox-demo.tsx`
- Replace the in-memory `inlineConfigFromDto`-style block (lines ~769–791)
  with a "Choose MultiJackpot group" selector that lists groups via
  `GET /api/v1/jackpot-groups` and lets the operator pick one.
- Wire the "Run simulation" button to `simulateGroup(...)`.
- Update the live telemetry table/chart to render the `perJackpot[]` array
  returned from each spin (one row per child tier, color-coded by
  `tierRank`). Replace any `multiLevelTier`/`tiers.map(x => x.multiLevelTier)`
  reads with `tierRank` / `jackpotId`.
- Keep the legacy single-jackpot simulation panel mounted but mark it
  "Legacy (read-only)" — useful for back-compat verification.

### `src/routes/admin.simulator.tsx`
- Replace the `result.tierResults` cards (lines ~357–460) with the new
  `perJackpot[]` shape from `simulateGroup`. Use `tierRank` for sort, drop
  `multiLevelTier` lookups against `config.tiers`.

## 3. "MultiJackpot" admin UI

User-facing strings throughout this section use **"MultiJackpot"** verbatim.
Internal code/types/routes keep the relational `jackpot_groups` naming.

### New: `src/components/jackpot/MultiJackpotWizard.tsx`
Three-step wizard, controlled by an internal `step` state:

1. **"MultiJackpot details"** — name, overlapping rule (`split`/`additive`),
   submits → `POST /api/v1/jackpot-groups`, stores returned `groupId`.
2. **"Attach child tiers"** — dynamic list (add/remove/reorder via
   drag-handle). Each row collects: existing jackpot picker
   (`GET /api/v1/jackpots`) **or** "create new", `tierRank`,
   `triggerProbability`, `contributionRate`, `seedAmount`. On "Save tier",
   creates the jackpot if needed (`POST /api/v1/jackpots`), then attaches it
   (`POST /api/v1/jackpot-groups/$id/children`).
3. **"Activate"** — review summary, button calls
   `POST /api/v1/jackpot-groups/$id/status` with `{ status: "active" }`.
   Shows a warning that activation locks all child config.

All numeric inputs use `step="0.000001"` and store values as plain strings
internally, converting via `Number(...)` only at submit, to preserve the
6-decimal contract used by the backend.

### `src/routes/admin.jackpots.new.tsx`
- Replace the body with a tabbed view: **"Single Jackpot"** (existing
  `JackpotCreationForm`) and **"MultiJackpot"** (new wizard above).
- Header: "Create MultiJackpot" when the MultiJackpot tab is active.

### New: `src/routes/admin.jackpot-groups.index.tsx`
- Table of MultiJackpots: name, status badge, child count, activated_at.
- Row actions: View, Edit (disabled when active), Set status, Delete (later).
- `GET /api/v1/jackpot-groups` for the list.

### New: `src/routes/admin.jackpot-groups.$id.tsx`
- Detail page: header card with group fields, status pill, lifecycle action
  bar ("Activate" / "Disable" / "Move to Draft" — buttons hidden based on
  legal transitions), and a children table sorted by `tierRank`.
- When `status === "active"`:
  - All inputs in the group profile section + every child row render
    `readOnly` and `disabled`, wrapped in a `<fieldset disabled>`.
  - A persistent yellow banner: *"MultiJackpot is active — disable it
    before editing configuration."*
  - "Disable" button calls `POST .../status` with `{ status: "disabled" }`
    → on success, the page re-fetches and inputs unlock.
- When `status !== "active"`: inputs are editable; "Save" calls
  `PATCH /api/v1/jackpot-groups/$id` for group fields.
- "Add child tier" button reuses the wizard's step-2 row component.

### `src/routes/admin.jackpots.index.tsx`
- Remove `multi_level: "Multi-Level"` from the type label map (line 44).
- Add a "MultiJackpot" tab/link in the page header that routes to
  `/admin/jackpot-groups`.

### `src/components/jackpot/JackpotCreationForm.tsx` (touch-minimal)
- This file is ~5,000 lines and high-risk to rewrite. Scope of edits:
  - Remove `'multi_level'` from `JackpotType` union.
  - Remove the multi_level type-picker card, the tier editor section, and
    every `selectedType === 'multi_level'` conditional.
  - Drop the `tiers` field from `JackpotSavePayload`, the `defaultTiers`
    array, `addTier`/`removeTier`/`updateTier`, and `tierWeightTotal`.
  - Leave Classic / Must-Drop / Frequency UI untouched.

## 4. File checklist & verification

### Files touched
- Backend purge: `types.ts`, `payload-to-config.ts`, `ledger.ts`,
  `build-create-body.ts`, `simulator.ts`.
- Sandbox/simulator: `routes/sandbox-demo.tsx`, `routes/admin.simulator.tsx`.
- Admin UI: `routes/admin.jackpots.new.tsx`,
  `routes/admin.jackpots.index.tsx`,
  `routes/admin.jackpot-groups.index.tsx` (new),
  `routes/admin.jackpot-groups.$id.tsx` (new),
  `components/jackpot/MultiJackpotWizard.tsx` (new),
  `components/jackpot/JackpotCreationForm.tsx` (multi_level removal only).

### Verification scenarios
1. **Purge build check** — `tsc` shows zero references to `MULTI_LEVEL`,
   `multi_level`, `multiLevelTier`, `multiLevelWeight`, or `TierDTO` in the
   `src/lib/jackpot/` tree after the purge.
2. **Legacy rejection** — `POST /api/v1/jackpots` with `{type:"multi_level",
   tiers:[…]}` returns 400 with the new error message.
3. **Group CRUD round-trip** — create via wizard, GET detail, verify
   `overlapping_rule` and child `trigger_probability` persist as the exact
   strings entered (e.g. `0.000125` → DB shows `0.00012500`).
4. **Activation lock** — set group to active in DB or via wizard step 3, then
   confirm: (a) UI inputs are disabled, (b) PATCH on group returns 409,
   (c) attach child returns 409.
5. **Simulator parity** — run 10,000-spin `simulateGroup` against a group
   with 3 tiers; sum of `perJackpot[i].contribution.pool` across spins
   matches the delta in `jackpot_pools.current_balance` for each child
   (within 6-decimal truncation tolerance).
6. **Sandbox telemetry** — concurrent spin chart renders one series per
   `tierRank`, win events flag the correct `jackpotId`.

## Out of scope
- Rewriting `JackpotCreationForm.tsx` end-to-end (only the multi_level
  branches are removed).
- Server-side delete of jackpot groups (no migration needed yet).
- Bulk import / CSV of MultiJackpot configurations.
