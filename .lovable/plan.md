## Goal

Reorganize the Multi-Jackpot wizard so Step 1 reads like the Single Jackpot creation flow (without the per-tier weight grid at the top), and move per-tier mechanics into a richer Step 2 Draft Tier Card.

## Step 1 — Master Strategy (reordered)

Remove the **Contribution Weight grid** from the top of Step 1. The master only declares group-wide funding and targeting, not the Pool/Seed/House split (that belongs to each tier).

New section order, top → bottom (mirroring `JackpotCreationForm.tsx`):

1. MultiJackpot name
2. **Jackpot Contribution** — Fixed/Percent toggle + amount + (Percent only) Wager Eligibility Limits (min/max qualifying wager). No weight grid here.
3. **Game Assignment** (existing `GameAssignmentStep`)
4. **Eligibility & Rules Engine** — port the section at `JackpotCreationForm.tsx` line 1216 (casino vs sportsbook vertical targeting, event/market rules).
5. **Player Targeting & Restrictions** — port section at line 1637 (segments, exclusions / black-list).
6. **Community Win Mechanics** — port section at line 1480 (enabled toggle, split %, payout interval, max win, max players).
7. Parent-governed split callout (existing).
8. `Continue to tier allocation` button.

State on the master gains: `eligibility`, `playerTargeting`, `community` blocks (shape = same as Single form). Master `poolWeight / seedWeight / houseWeight` are removed from `GroupDTO`.

## Step 2 — Tier Allocation (richer Draft Tier Card)

Replace the current Draft Tier Card body with the full per-tier definition. Fields, top → bottom:

1. **Tier Name**
2. **Tier Rank** (number, auto-suggest next)
3. **Tier Type** — segmented control: `Classic` · `Must Drop` · `Happy Hour`, each revealing its own field group:
   - Classic → Trigger Probability card (spins-interval / pure-chance), Volatility (optional)
   - Must Drop → min/max boundary, drop pacing, period (single/daily/weekly/monthly), start/end (when single)
   - Happy Hour → freq interval (DAILY/WEEKLY/MONTHLY), freq day, contribution window, win window, clone-contrib-to-win
4. **Split share of master contribution (%)** — with live "remaining" indicator and derived absolute amount preview (`master × share%`).
5. **Contribution Weight** grid (Pool / Seed / House, must sum to 100) — this is the per-tier split that was incorrectly placed at the master level.
6. **Initial Pool amount** (seed/starting balance)
7. **Re-seeding amount** (post-win reseed floor)
8. **Tier Safeguards** — max number of wins, max total payout (existing).
9. Save tier · Cancel.

After Save: tier appears in the Tier Ladder above, share total updates, and the "Add New Tier" CTA returns. Repeat until shares = 100%, then `Continue to launch gate` unlocks (existing Step 3).

## Data / payload changes

- `GroupDTO`: drop `poolWeight / seedWeight / houseWeight`. Add optional `eligibility`, `playerTargeting`, `community` (same shapes as Single). `POST /api/v1/jackpot-groups` Zod schema in `src/routes/api/v1/jackpot-groups/index.ts` updated accordingly; persisted via `store.server.ts` (JSON columns or columns mirroring Single).
- `ChildDraft`: add `tierType: 'classic' | 'must_drop' | 'happy_hour'`, `poolWeight`, `seedWeight`, `houseWeight`. Keep existing trigger-model sub-fields, gated by `tierType`.
- Per-child POST already supports trigger config and safeguards; extend with weights and tier type.

## Out of scope

- Single Jackpot form (unchanged — source of truth).
- Backend engine math beyond passing new fields through.
- Per-tier override of master eligibility/targeting/community (tiers inherit; can be added later).

## Files touched

- `src/components/jackpot/MultiJackpotWizard.tsx` — Step 1 reorder + remove master weight grid; rebuild `DraftTierCard` with tier type + per-tier weights + pool/reseed.
- `src/lib/jackpot/master-sections.tsx` *(new, optional)* — extract the three ported cards (Eligibility, Targeting, Community) from `JackpotCreationForm.tsx` so both forms share them.
- `src/routes/api/v1/jackpot-groups/index.ts` — schema swap.
- `src/lib/jackpot/store.server.ts` — persist new master fields; drop master weights.
- `src/lib/jackpot/contribution-weights.ts` *(reuse if it already exists from the prior step)* — used inside the Tier Card now instead of Step 1.

## Anything missing? (your question)

A few things worth nailing before I build:

1. **Per-tier overrides** of Eligibility / Player Targeting / Community — assume **inherit-from-master only** for v1?
2. **Trigger probability** in Classic tier — keep the `Pure Chance / Hype Curve` two-mode selector from today, or simplify to just spins-interval?
3. **Volatility** per tier — include the slider, or master-only?
4. **Maximum Win Amount / Fixed Win Amount** per tier — Single has both; should Must Drop / Classic tiers expose them, or rely solely on Pool boundaries?
5. **Tier Rank** — auto-assign (1, 2, 3…) and lock, or let operators set it freely (and validate uniqueness)?

Confirm these and I'll implement.
