
## Problem

In `src/routes/admin.simulator.tsx`, the summary cards (RTP, Win count, Total win amount) read top-level fields directly off the server response (`result.rtp`, `result.winCounter`, `result.winAmountCounter`). For MULTI_LEVEL runs, those top-level counters from the engine are not reflecting per-spin variance — only `rejectedByGate` and the per-tier `tierResults[]` change between runs. So the top KPIs look frozen even though the engine is alive.

The fix is purely in the dashboard rendering: when `tierResults[]` is present, compute the grand totals by summing across tiers and derive RTP from those sums plus `totalWagered`. No backend changes.

## Plan

1. In `src/routes/admin.simulator.tsx`, add a derived `summary` memo computed from `result`:
   - If `result.tierResults?.length`, sum:
     - `totalWins = Σ t.winCounter`
     - `totalPaid = Σ t.winAmountCounter`
     - `totalRejected = Σ t.rejectedByGate` (use this for the "Rejected by gate" card so it also reflects tier aggregation)
     - `maxWin = max(t.maxWinAmount)` (fallback to existing `maxWin` logic)
   - Else fall back to the top-level fields (`result.winCounter`, `result.winAmountCounter`, `result.rejectedByGate`, existing `maxWin`).
   - `rtp = totalWagered > 0 ? (totalPaid / totalWagered) * 100 : 0`.

2. Wire the three "frozen" StatCards to the derived values:
   - **RTP** → `summary.rtp.toFixed(2) + "%"`
   - **Win count** → `summary.totalWins`
   - **Total win amount** → `summary.totalPaid.toLocaleString(...)`
   - Also update **Rejected by gate** and **Max win** to use the aggregated values for consistency.

3. Remove the `maxWin` IIFE and `tierWins` fallback hardcoding only where it overlaps with the new memo; keep the `tierWins` bucket logic for the existing "Tier wins" panel.

4. Leave all other cards (totals already coming from server scalars: `totalWagered`, `walletContributions`, `operatorContributions`, `finalPool`, `finalSeed`) untouched — they are not the reported frozen ones.

No changes to `simulator.ts`, server routes, types, or DEFAULT_CONFIG. The DEFAULT_CONFIG is only the textarea seed, not a result fallback, so it isn't masking anything.

## Files changed

- `src/routes/admin.simulator.tsx` — add `summary` memo, rewire 5 StatCards to it.
