## Remove "Initial seed amount" from the Tier card

### Why

For operators, only two amounts matter per tier:

- **Initial pool amount** — what players see at launch of the very first cycle.
- **Re-seeding amount** — the starting pool for every subsequent cycle after a win.

"Initial seed amount" is an engine-internal concept (the seed bucket's starting balance) that, in operator terms, should always equal the Re-seeding amount. Exposing it as a third field is redundant and confusing.

### UI changes (`src/components/jackpot/MultiJackpotWizard.tsx`, `DraftTierCard`)

In the "Allocation & fuel" section (around lines 1242–1301):

- **Remove** the "Initial seed amount" input (the middle field bound to `draft.seedAmount`).
- Keep the grid as: **Initial pool amount · Re-seeding amount · Tier split share (%)** — three columns instead of four (still `md:grid-cols-2`, ordering: pool → reseed → split share, with split share on its own row or alongside reseed).
- Update the helper copy under "Re-seeding amount" to: *"Starting pool for each new cycle after a win. Also acts as the floor the pool can never fall below."*

### Wiring (no schema change)

`draft.seedAmount` is still used by the engine payload. Instead of removing it from `ChildDraft`, mirror it from the re-seeding value on save:

- In the tier-save handler (around line 578), set `seedAmount = reseedingAmount` before building the create body, so the engine receives a consistent seed/reseed pair.
- Keep `seedAmount` in the `ChildDraft` type for now (no risky type churn). Drop the field from initial state defaults or leave it as `"0"` — it will be overwritten on save.

### Out of scope

- Backend / API schema changes.
- The Single Jackpot form (separate flow, can be revisited later if the user wants the same simplification there).
- Renaming or restructuring `seedAmount` in the engine types.

Confirm and I'll implement.