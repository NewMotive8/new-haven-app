# Verify contribution → pool allocation on `/sandbox-demo`

The sandbox already shows the **last** spin's Pool / Seed / House split, but there's no way to check that those splits are actually landing in the live pool balance. We'll add a small reconciliation panel so you can watch every contribution flow into the pot and confirm it matches the DB.

## What you'll see after this change

A new **Allocation Tracker** card under "Last Ledger Split", showing:

- **Spins** — number of spins since the tracker was opened/reset
- **Total wagered** — sum of all wagers
- **Cumulative split** — running totals for Pool / Seed / House contributed
- **Reconciliation** row:
  - `Pool start` — pool balance when tracking started
  - `+ Cumulative pool` — what we credited via spins
  - `= Expected` — start + cumulative
  - `Live pool` — the value coming back from `/api/v1/jackpots` (DB truth)
  - `Δ` — difference, green if 0, red if drifted
- A **Reset tracker** button to re-baseline

So per €1 spin on blumberg (fixed €0.15, 60/30/10), every spin should add `Pool +€0.09`, `Seed +€0.045`, `House +€0.015`, and the Live pool from the DB should track Expected exactly.

## Technical notes

In `src/routes/sandbox-demo.tsx`:

- Add state: `tracker = { startedAt, startPool, spins, totalWager, cumPool, cumSeed, cumHouse }`.
- Initialize `startPool` from the first poll that returns `active` (lazy init when `tracker === null`).
- In `handleSpin`, after computing `lastSplit`, also `setTracker(t => ({ ...t, spins+1, totalWager+w, cumPool+pool, cumSeed+seed, cumHouse+house }))`.
- Render the panel using the current `poolDisplay` (already polled every 2s) as "Live pool".
- `Reset tracker` button: re-baseline `startPool` to current `poolDisplay`, zero the counters.

No backend changes. Ledger math and the topup call already work — this just exposes the running totals so the allocation is auditable from the UI.
