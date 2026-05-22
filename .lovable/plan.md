# MultiJackpot Creation Flow

A clearly-scoped, 3-step wizard for grouping multiple jackpots under one master campaign. Lives at `/admin/jackpots/new` → "MultiJackpot" tab.

## Concepts

- **Master (group)**: one campaign owning a single contribution stream (source + type + value) and one set of eligible games/categories. Total of all tier shares must equal 100.00%.
- **Tier (child jackpot)**: a slice of the master pool. Each tier sets its own name, rank (Bronze → Silver → Gold → Platinum), trigger model, seed, split share, and optional safeguards. Tiers inherit games and contribution from the master.

## Step 1 — Master Strategy

User defines the campaign once.

Fields:
- MultiJackpot name (required, unique per brand — server returns clean 409 on duplicate).
- Contribution source: `player` | `house`.
- Contribution type: `percentage` (of wager) | `fixed` (per spin).
- Master contribution value (1 input, formatted as % or currency based on type).
- Game assignment (categories + specific game IDs). **Master only — tiers inherit and cannot narrow.**

Action: **Continue to tier allocation** → POST `/api/v1/jackpot-groups`, persists draft group, advances to Step 2.

## Step 2 — Tier Allocation

User adds tiers until split shares total 100.00%.

UI:
- Shares progress bar (live total + valid/invalid state).
- Master recap (read-only summary of Step 1).
- Tier ladder (saved tiers sorted highest rank → lowest, with Bronze/Silver/Gold/Platinum theming).
- "Add New Tier" button opens an inline **Draft Tier Card**.

Draft Tier Card fields (curated subset of the standalone Jackpot form):
- Tier name (with Mini / Minor / Major / Grand presets).
- Tier rank (auto-suggested next rank; editable).
- Trigger model — single selector, one of:
  - **Must-Drop** — drop window (e.g. by amount or time) + target.
  - **Frequency** — Happy Hour schedule (reuses parsing already in `JackpotCreationForm`).
  - **Fixed probability** — 1-in-N denominator (today's default).
- Seed amount.
- Split share (% of master). Live "would push total to X%" guard prevents > 100%.
- Optional safeguards: Max Number of Wins, Max Total Payout.
- Derived rate preview (master value × share) shown read-only.

Per-tier games, contribution source/type, contribution value, wager eligibility limits, and brand are NOT shown — they are inherited from the master or not applicable to a tier.

Actions:
- **Save tier** → POST `/api/v1/jackpots` (child) then POST `/api/v1/jackpot-groups/:id/children` to attach with `tierRank`, `triggerProbability`, `splitShare`, plus the chosen trigger model + safeguards.
- **Cancel** → discard the draft.
- **Back** → Step 1 (draft group preserved).
- **Continue to launch gate** → Step 3 (enabled only when ≥ 1 tier saved AND shares == 100.00%).

## Step 3 — Launch Gate

Read-only review:
- Master summary + game list count.
- Tier ladder with rank, share, seed, trigger summary, derived rate.
- Total share badge (must be 100.00%).
- "Activate MultiJackpot" → POST `/api/v1/jackpot-groups/:id/status` `{ status: "active" }`. On success → `/admin/jackpot-groups`.
- "Back" returns to Step 2 (no data loss).

Group remains in `draft` status until activation. Drafts can be abandoned (group stays draft until cleaned up).

## Flow diagram

```text
[ /admin/jackpots/new → MultiJackpot tab ]
            │
            ▼
  Step 1 · Master Strategy
   name, contribution, games
            │  POST /jackpot-groups
            ▼
  Step 2 · Tier Allocation
   ┌───────────────────────────┐
   │ + Add New Tier            │ ← repeat until shares = 100%
   │   name / rank / trigger / │
   │   seed / share / safeguards
   │   POST /jackpots          │
   │   POST /groups/:id/children
   └───────────────────────────┘
            │  shares == 100.00%
            ▼
  Step 3 · Launch Gate
   review → Activate
            │  POST /groups/:id/status {active}
            ▼
   /admin/jackpot-groups
```

## Technical notes

- **Component**: keep `MultiJackpotWizard.tsx` as the single entry; expand `ChildDraft` to include `triggerModel`, `mustDropConfig`, `frequencyConfig`, `maxNumberOfWins`, `maxTotalPayout`. Reuse the trigger-config sub-renderers from `JackpotCreationForm` (extract them into shared components if not already shared).
- **Reverse hydration**: editing an existing tier in Step 2 must reuse the same Option A / Happy Hour reverse-parsing logic that already lives in `JackpotCreationForm`. Extract that logic into `src/lib/jackpot/hydrate-draft.ts` so both forms call the same helper.
- **API**: `POST /api/v1/jackpot-groups/:groupId/children` extends to accept `triggerCondition`, `maxNumberOfWins`, `maxTotalPayout` per child, persisted onto the child jackpot row (`jackpots.trigger_condition` already exists). No schema migration required.
- **Game assignment**: continues to live only on `jackpot_groups.assigned_*`; child jackpot game arrays are left empty for tiers belonging to a group.
- **Validation**: server still enforces sum of `split_share` ≤ 100; client mirrors that with the progress bar + per-save projection guard.
- **Auto-activation is out of scope** — explicit Step 3 stays.

## Out of scope

- Editing an already-activated group's tiers (separate edit flow).
- Per-tier game overrides.
- Bulk-import of tiers.
