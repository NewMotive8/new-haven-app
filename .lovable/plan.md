# Fix: bet endpoint ignores engine-v2 split

## What's wrong

The blumberg jackpot is saved with the v2 split contract:

- `contributionMode: "split"`
- `totalContributionAmount: 0.15` fixed
- weights pool 60 / seed 30 / house 10

Expected per €1 spin: Pool €0.09, Seed €0.045, House €0.015.
Observed per €1 spin: Pool €0.03, Seed €0, House €0.

The split is correctly persisted in the database — the bug is on the read path.

## Root cause

`src/lib/jackpot/store.server.ts → rowToDTO` returns a `JackpotDTO` that does
**not** include the `config` blob (the row's `trigger_condition` JSONB, which
holds `engineV2`, `tiers`, `pool`, `seed`, etc.).

`src/routes/api/v1/event/bet.ts → inlineConfigFromDto(jp)` then reads
`jp.config` to build the ledger input. Because `config` is `undefined`, it
falls back to the classic shape with only `contribution_percentage` (0.03)
mapped to pool. The v2 split and tiers are silently dropped.

The same gap affects `listJackpots`, so `/api/v1/jackpots` also returns rows
without `config`, which is why the sandbox-demo widget can't show v2 info.

## Fix

In `src/lib/jackpot/store.server.ts`:

- Extend `rowToDTO` to attach `config: row.trigger_condition` on the DTO
  (typed as `Record<string, unknown> | undefined`).
- No SQL change needed — `trigger_condition` is already in `SELECT`.

That single change makes `getJackpot` / `listJackpots` carry the v2 contract
through to the bet endpoint and the sandbox UI, so the ledger split lines up
with what was saved in the admin form.

## Verification

After the fix, on `/sandbox-demo` with brand 1, a €1 spin against the
blumberg jackpot should produce Pool €0.09, Seed €0.045, House €0.015, and
the pool balance should grow by €0.09 per spin (still persisted via topup).

## Files

- `src/lib/jackpot/store.server.ts` — include `config` in the DTO.
