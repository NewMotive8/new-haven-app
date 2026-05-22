## Add Contribution Weight grid to the Tier card

You're right — `DraftTierCard` already carries `poolWeight / seedWeight / houseWeight` in state, validates that they sum to 100 on save, and submits them with the child jackpot, but there is no UI to edit them. Today they are stuck at the defaults (60 / 30 / 10) for every tier.

### What to add

A new "Contribution Weight" section inside `DraftTierCard` in `src/components/jackpot/MultiJackpotWizard.tsx`, placed **right after the "Allocation & fuel" group** (after the Initial pool / Seed / Reseed / Split share grid, around line 1302) and **before "Drop style"**.

The section will contain:

1. **Three % input boxes** in a 3-column grid:
   - **Pool %** — share of the tier's contribution that feeds the live pool
   - **Seed %** — share that refills the seed/reseed floor
   - **House %** — operator margin retained outside the prize pools
2. **Live sum indicator** showing `Total: NN.NN%` with a green check when it equals 100, red when it doesn't (mirrors the existing `shareInvalid` styling used for split share).
3. **Helper copy** under the grid: "Pool / Seed / House must sum to 100%. Applied to this tier's slice of the master contribution."
4. **Quick presets** (optional, small text buttons): `60 / 30 / 10`, `70 / 20 / 10`, `100 / 0 / 0` — one click to fill.

No changes to validation, submission payload, or `ChildDraft` shape — those are already wired. No changes to the master-level Contribution Source split (that stays as the Player/Operator slider).

### Files touched

- `src/components/jackpot/MultiJackpotWizard.tsx` — add the UI block inside `DraftTierCard`, reusing `Input`, `Label`, and the existing styling tokens.

### Out of scope

- Backend / API / Zod schema changes (already accept these fields).
- Per-tier override of the master Player/Operator contribution source.
- Editing the master weight grid (it was intentionally removed from Step 1 per `.lovable/plan.md`).

Confirm and I'll implement.