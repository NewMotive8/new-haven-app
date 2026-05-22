# Game Assignment Step — Plan

Add a self-contained Game Assignment step to both jackpot creation flows. The UI works against a fixed master-category list and a clean internal `games` table — no operator-specific logic.

## 1. Database — `games` table

New migration creating `public.games`:

| Column            | Type                           | Notes                                            |
| ----------------- | ------------------------------ | ------------------------------------------------ |
| `id`              | `bigint` identity PK           |                                                  |
| `name`            | `text` not null                | Search target (trigram index)                    |
| `master_category` | `text` not null, CHECK in enum | Slots / Table Games / Live Casino / Crash / Sports |
| `provider`        | `text` not null                |                                                  |
| `operator_game_id`| `text` not null                | Stable external identifier                       |
| `enabled`         | `boolean` default true         |                                                  |
| `created_at`/`updated_at` | `timestamptz`          | Standard                                         |

- Unique index on `(provider, operator_game_id)`.
- `pg_trgm` extension + GIN index on `lower(name)` for fast `ILIKE` search.
- RLS: enabled, admins-only via `has_role(auth.uid(),'admin')` (read + manage).
- Seed ~25 sample rows across all 5 categories so the picker works out of the box.

Jackpot payload storage (`jackpots` and `jackpot_groups`):
- Add `assigned_categories text[] not null default '{}'`
- Add `assigned_game_ids  bigint[] not null default '{}'`
- CHECK: every entry of `assigned_categories` must be in the master enum.

## 2. Master Categories — hardcoded constant

New module `src/lib/jackpot/master-categories.ts`:

```ts
export const MASTER_CATEGORIES = [
  "Slots", "Table Games", "Live Casino", "Crash Games", "Sports",
] as const;
export type MasterCategory = (typeof MASTER_CATEGORIES)[number];
```

Used by the UI for the toggle row, and by the server validator to reject anything not in the set. Not loaded from the DB.

## 3. Server function — game search

`src/lib/games.functions.ts`:

- `searchGames` — `createServerFn({ method: "GET" })` + `requireSupabaseAuth`, input `{ q: string (≤80), categories?: MasterCategory[], limit?: 1..25 }`, returns `[{ id, name, master_category, provider, operator_game_id }]`. Implementation: `select … from games where enabled and name ilike '%' || q || '%' [and master_category = any(categories)] order by name limit N`.
- `listGamesByIds` — same shape but `where id = any(ids)` — used to hydrate already-selected games on edit.

Both use the user-scoped supabase client (RLS-respecting).

## 4. UI — `<GameAssignmentStep />`

New component `src/components/jackpot/GameAssignmentStep.tsx`. Pure presentational; takes `{ value, onChange, disabled }` where value is:

```ts
{ assignedCategories: MasterCategory[]; assignedGameIds: number[] }
```

Layout:

```text
+--------------------------------------------------------+
| Master Categories                                       |
|  [ Slots ] [ Table Games ] [ Live Casino ]              |
|  [ Crash Games ] [ Sports ]      (multi-select toggles) |
+--------------------------------------------------------+
| Specific Games (optional)                               |
|  [ search games by name...        ]  debounced 250ms    |
|    > Book of Ra        | Slots | NetEnt                 |
|    > Mega Moolah       | Slots | Microgaming            |
|                                                         |
|  Selected (3):  [Book of Ra ×] [Mega Moolah ×] [...]    |
+--------------------------------------------------------+
```

Behaviour:
- Category toggles read from `MASTER_CATEGORIES`.
- Search uses `useQuery({ queryKey: ['games-search', q, cats], queryFn: () => searchGames(...) })` with `enabled: q.length >= 2`. Results render in a shadcn `Command` popover; clicking adds the id to `assignedGameIds` (de-duped). Already-selected rows show a checkmark.
- Selected chips hydrate via `listGamesByIds` once on mount.
- `disabled` prop hides the toggles/inputs behind the same read-only treatment used elsewhere when the parent is active.
- Emits only category strings + internal game IDs. No provider / operator-game-id leaves the component.

## 5. Wire into both flows

**Single jackpot** (`JackpotCreationForm.tsx` → `admin.jackpots.new.tsx`):
- Add a new section "Game Assignment" between the existing config and submit area.
- Extend form state with `assignedCategories` / `assignedGameIds`; include them in the create/update payload sent to `POST /api/v1/jackpots`.

**Multi-jackpot wizard** (`MultiJackpotWizard.tsx`):
- Add the step at the group level (Step 1 — Campaign Strategy) so all tiers inherit it, matching the existing parent-governed funding pattern.
- Persist via `POST/PATCH /api/v1/jackpot-groups` payload.

## 6. Backend payload plumbing

- Extend Zod input schemas in `src/routes/api/v1/jackpots/*` and `src/routes/api/v1/jackpot-groups/*` with the two new fields (categories validated against `MASTER_CATEGORIES`, game IDs as `z.array(z.number().int().positive()).max(500)`).
- Extend `store.server.ts` DTOs + insert/update SQL so the columns round-trip.
- No changes to the transaction engine, ledger, or simulator — those are out of scope for this step.

## Out of scope (explicit)

- CSV bulk upload, player segmentation, category-lock UI, transaction-engine eligibility checks. Those are separate follow-ups; this step only delivers the picker + storage.
