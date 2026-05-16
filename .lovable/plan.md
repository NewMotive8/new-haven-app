## Source of truth

Figma Make repo `NewMotive8/Redesignjackpotcreationflow` (parsed):
- `JackpotTypeSelection.tsx` — 4 types: **Classic**, **Frequency**, **Must Drop**, **Multi-Level**
- `JackpotCreationForm.tsx` (4029 lines) — split-column dark UI: top header, left sidebar nav, main form panel, sticky footer with Cancel / Back / Next / Save
- Dark theme tokens: `neutral-950` bg, `neutral-800` borders, `blue-500` accent

## What changes

Single file rewrite of `src/routes/backoffice.jackpots.new.tsx`. List page (`backoffice.jackpots.index.tsx`) unchanged. No new routes, no DB schema changes.

## Layout (matches Figma)

```text
┌──────────────────────────────────────────────────────────┐
│ Logo  MYBC Game                Clock UTC      [Logout]   │  header
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │  Create A Jackpot                             │
│ (nav     │  ┌─ Type ─ Basic ─ Model ─ Pool ─ Seed ─ … ─┐│  stepper
│  links)  │  │                                          ││
│          │  │  [4 type cards: Classic|Freq|MD|Multi]   ││  step 1
│          │  │  — or —                                  ││
│          │  │  Dynamic fields for selected type        ││  step 2+
│          │  │                                          ││
│          │  └──────────────────────────────────────────┘│
│          │  [Cancel]                  [Back] [Next/Save]│  footer
└──────────┴───────────────────────────────────────────────┘
```

Built with existing shadcn primitives (`Card`, `Button`, `Input`, `Label`, `Select`, `Tabs`, `Switch`). Dark surface via Tailwind `bg-neutral-950 / border-neutral-800` to match Figma; no new global tokens.

## Type → field map

Step 1 (always): **Name**, **Brand ID**, **Type selector** (4 cards).

Step 2 dynamic fields, by type:

| Type | Specific inputs (in addition to shared Pool + Seed) |
|---|---|
| `classic` | Contribution %, Volatility, Min/Max wager |
| `must_drop` | Min/Max win amount, Volatility, Min/Max wager, Frequency (daily/weekly/monthly), Start/End date, Community split toggle |
| `multi_level` | Tier table (level, min win, max win, contribution %) — variable rows |
| `frequency` | Fixed win amount OR Avg+Min/Max win, Volatility, Min/Max wager, Frequency cadence |

Shared across all types: **Initial pool balance**, **Base seed amount**, **Enabled** toggle.

Switching type instantly swaps the dynamic block (controlled by `useState<JackpotType>`); shared fields persist.

## DB mapping (no schema change)

Existing columns are sparse, so unmapped fields land in `jackpots.trigger_condition` jsonb:

- `jackpots`: `name`, `brand_id`, `enabled`, `contribution_percentage`, `volatility`, `trigger_condition = { type, min_win, max_win, min_wager, max_wager, frequency, start_at, end_at, tiers, community, ... }`
- `jackpot_pools`: `{ jackpot_id, current_balance }`
- `jackpot_seeds`: `{ jackpot_id, base_seed_amount }`

## Save flow

Client → `createServerFn` `createJackpotWithChildren` in `src/lib/jackpot/create.functions.ts`:
1. Insert into `jackpots`, return id
2. Insert into `jackpot_pools` with that id
3. Insert into `jackpot_seeds` with that id
4. On any failure: delete the parent `jackpots` row (compensating rollback — Supabase JS has no multi-statement tx, so this is the standard pattern)
5. Return `{ id }`

Validation via `zod` (already in deps): discriminated union keyed on `type`. Reject save until current step is valid.

On success: `toast.success("Jackpot created")` (sonner), `navigate({ to: "/backoffice/jackpots" })`. On failure: `toast.error(err.message)`, stay on form.

## Files

- **Rewrite** `src/routes/backoffice.jackpots.new.tsx` (~500 lines: layout + 4 dynamic sub-components inline)
- **New** `src/lib/jackpot/create.functions.ts` (server fn + zod schema)
- **No edits** to schema, list page, or `routeTree.gen.ts`

## Out of scope (call out)

The Figma form has ~12 conceptual tabs (Widget, Schedule, Recurrence, Events, Segments, Community, Simulator, Summary). This plan ships the **Type + Basic + Model + Pool + Seed** steps that map to current DB. The remaining tabs are stubbed as disabled placeholders so the visual layout matches Figma without persisting fields that have no column. Confirm if you want any of those wired now — each adds schema work.
