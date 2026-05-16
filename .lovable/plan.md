The simulator JSON shows hardcoded `pool.minimumAmount: 500` and `pool.maximumAmount: 10000` because the **Min Win Amount / Max Win Amount / Fixed Win Amount / Average Win Amount / Min Wager / Max Wager** inputs in the Jackpot creation form have no `value` or `onChange` — they're visual stubs not wired to state. The payload-to-config mapper then falls back to baked-in numbers.

## Fix: wire the win-amount fields end-to-end

### `src/components/jackpot/JackpotCreationForm.tsx` (Classic jackpot only)
Add state and bind inputs for:
- `fixedWinAmount` (Fixed model — line ~638)
- `averageWinAmount` (Average model — line ~702)
- `minWinAmount` (used by Average & Maximum — lines ~715, 790)
- `maxWinAmount` (used by Average & Maximum — lines ~727, 802)
- `minWagerAmount` (Fixed & Average — lines ~673, 761)
- `maxWagerAmount` (Fixed & Average — lines ~685, 773)

Each input gets `value={state}` and `onChange={(e) => setState(parseFloat(e.target.value) || 0)}`. Initialize from `initial?.fieldName` so the Back-from-Simulator round-trip restores them.

### `JackpotSavePayload` type (same file)
Add the six new numeric fields. Update `buildPayload()` to include them.

### `src/lib/jackpot/payload-to-config.ts`
Replace the hardcoded `minimumAmount: 500` / `maximumAmount: 10000` with values from the payload:

```
pool: {
  currentAmount: poolCurrent,
  minimumAmount: num(payload.minWinAmount, 500),
  maximumAmount: num(payload.maxWinAmount, 10000),
  contributionAmount: poolContributionAmount,
  contributionType: poolContributionType,
}
```

For the engine win-amount overrides:
- `payoutModel === 'fixed'` → `fixedWinAmount: num(payload.fixedWinAmount, 100)`
- `payoutModel === 'maximum'` → `maximumWinAmount: num(payload.maxWinAmount, 10000)`
- `payoutModel === 'average'` → no override (engine pays current pool; min/max constrain the pool)

## Out of scope
- The **Frequency** jackpot type has the same duplicate field set (lines ~3181-3347); leaving them visual-only for now since the bug report and current JSON are Classic. Can wire them in a follow-up if needed.
- Must-Drop and Multi-Level use different fields and aren't affected by this report.