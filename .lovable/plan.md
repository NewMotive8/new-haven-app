## Diagnosis

The numbers do briefly update — but a 2-second background poll (`tick` at line 444) re-fetches `/api/v1/jackpots` and overwrites `poolDisplays[id]` with the server's canonical `poolBalance` (line 421). On the multi-pool spin path, **we never tell the server about the bump**, so the next poll snaps every tile back to its pre-spin value. End result: visually nothing changes.

Evidence:
- Ledger network response confirms `perJackpot` deltas are arriving correctly (e.g. €50 spin → 2.50 / 1.75 / 0.75 across jackpots 15/16/17).
- The single-pool branch (line 710) already calls `persistPoolGrowth(activePool.id, poolAdd)` for exactly this reason.
- The multi-pool branch (lines 870–933) updates `poolDisplays` locally but never persists, so polling silently rolls it back.

## Fix (one surgical change, frontend only)

In `src/routes/sandbox-demo.tsx`, right after the `setPoolDisplays(...)` call inside the multi-pool branch (around line 933), mirror what the single-pool path does — fire `persistPoolGrowth` for every bumped jackpot id:

```text
for (const [id, add] of Object.entries(poolDeltas)) {
  if (add > 0) void persistPoolGrowth(Number(id), add);
}
```

`persistPoolGrowth` is already defined (line 624) as a fire-and-forget POST to `/api/v1/jackpots/topup`. Failures are swallowed so the spin UX is unaffected.

## Out of scope
- No change to the auto-focus priority chain.
- No change to the contribution chip / tracker math.
- No change to auto opt-in.
- No backend / migration changes.

## Verification
1. Opt into Sandbox Pool, spin €50 → tile balance increases by €2.50 and **stays** at the new value across the next 2-second poll cycle.
2. Spin again → balance keeps climbing instead of snapping back.
3. Group tile ("Sandbox 50/35/15") shows all three tier rows incrementing per spin.
