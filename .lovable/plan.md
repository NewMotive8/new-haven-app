# Parent-Governed Split Funding Model

Move funding rules from individual child jackpots up to the Multi-Jackpot **group**, and have each child store only its proportional share of the parent's master contribution.

## 1. Database

Migration on `public.jackpot_groups`:
- `contribution_source text NOT NULL DEFAULT 'player'` — `'player' | 'operator'`
- `contribution_type   text NOT NULL DEFAULT 'percentage'` — `'percentage' | 'fixed'`
- `master_contribution_value double precision NOT NULL DEFAULT 0` — fraction (e.g. `0.01` = 1%) when type=percentage, currency units when type=fixed
- CHECK constraints on the two enums and `>= 0` on the value
- `overlapping_rule` is retained but defaulted/locked to `'split'` (parent-governed split is the only supported model)

Migration on `public.jackpots`:
- `split_share numeric(7,4) NOT NULL DEFAULT 0` — percentage 0–100 with up to 4 decimals
- `contribution_percentage` stays as the **derived** absolute rate the transaction engine reads (unchanged hot path)
- Backfill: for existing grouped children, set `split_share = 100 / siblings_count` and recompute `contribution_percentage` from current parent values (or 0 / leave as-is for ungrouped rows)

The existing `jackpot_groups_guard` / `jackpots_group_guard` triggers already lock fields while parent is `active` — the new columns inherit that lock automatically.

## 2. Backend (`src/lib/jackpot/store.server.ts` + routes)

- Extend `JackpotGroupDTO` with `contributionSource`, `contributionType`, `masterContributionValue`; extend child DTO with `splitShare`.
- `createGroup` / `updateGroupProfile`: accept and persist the three new master fields.
- `addChildJackpot` / `updateChild`: accept `splitShare`, derive `contributionRate = masterValue * splitShare / 100` (works for both `percentage` and `fixed` storage — engine already treats the column as its absolute per-spin amount), write both `split_share` and `contribution_percentage` atomically.
- When a group's master settings change in `updateGroupProfile`, recompute and update every child's `contribution_percentage` in the same transaction.
- Zod schemas updated in:
  - `routes/api/v1/jackpot-groups/index.ts` (POST create)
  - `routes/api/v1/jackpot-groups/$id.ts` (PATCH group)
  - `routes/api/v1/jackpot-groups/$id/children.ts` (POST attach — replace `contributionRate` with `splitShare`, server derives the rate)
- Server-side validation: reject group activation (`/status.ts`) unless the sum of child `splitShare` values equals `100.00` (±0.01 tolerance).

## 3. Wizard (`src/components/jackpot/MultiJackpotWizard.tsx`)

- **Step 1 — Master Strategy:** replace the Overlapping Rule cards with three controls:
  - Contribution Source (select: Player / Operator)
  - Contribution Type (select: Percentage of Wager / Fixed Amount)
  - Master Contribution Value (numeric input; `%` suffix when percentage, currency suffix when fixed)
- **Step 2 — Tier Stack:** remove per-tier contribution-rate input from `DraftTierCard`; replace with **Group Split Share (%)** input (0–100, 2 decimals). Live-display the derived absolute rate (`masterValue × share/100`) underneath so operators see the actual engine value.
  - Sum bar at top of the tier list showing `Σ shares = X.XX% / 100.00%` with red/green state.
  - "Continue" / "Save Tier" disabled unless sum equals exactly 100.00 (with 0.01 tolerance).
- **Step 3 — Launch Gate:** total exposure calc rewritten to use parent `masterValue` × Σ shares; show parent funding block (source / type / value) and per-tier share + derived rate side-by-side.
- Submission flow:
  1. `POST /api/v1/jackpot-groups` with master funding fields
  2. For each tier: `POST /api/v1/jackpots` (name only — contribution comes from derivation)
  3. `POST /api/v1/jackpot-groups/$id/children` with `{ jackpotId, tierRank, triggerProbability, splitShare, name }`

## 4. Backoffice (`src/routes/admin.jackpot-groups.$id.tsx` + `index.tsx`)

- Detail page parent summary: new "Funding" card showing Source, Type, Master Value, and Σ shares health indicator. Inputs editable only when `status !== 'active'` (existing `<fieldset disabled>` wrapper).
- Children table: add **Split Share (%)** column and **Derived Rate** column next to Name and Probability. Inline edits update `splitShare`; server re-derives `contributionRate`.
- Group list page (`admin.jackpot-groups.index.tsx`): show Source + Master Value chip in each row.

## 5. Out of scope

- No changes to the runtime transaction engine, simulator, or ledger — they keep reading the already-derived `contribution_percentage`.
- `overlapping_rule` column stays in the DB for backward compatibility but is hidden from the UI and forced to `'split'`.

## Migration ordering note

The DB migration must land first (separate approval step). Then store + routes + wizard + detail page ship together in one code pass so types stay consistent.
