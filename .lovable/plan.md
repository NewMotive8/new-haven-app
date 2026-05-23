## Fix Visual Fallback Math in Sandbox Demo

### Context
The `hasNoEnabledPools` branch in `src/routes/sandbox-demo.tsx` (lines 662–664) contains visual-only fallback multipliers that are 100× too small. A €10 wager currently yields only €0.005 to the pool, causing imperceptible tile updates.

### Change
Replace the three constants in the fallback block so they correctly model a 10% total wager contribution split 50/35/15:

```ts
const poolAdd  = Math.trunc(w * 0.05  * 1_000_000) / 1_000_000; // 50% of 10%
const seedAdd  = Math.trunc(w * 0.035 * 1_000_000) / 1_000_000; // 35% of 10%
const houseAdd = Math.trunc(w * 0.015 * 1_000_000) / 1_000_000; // 15% of 10%
```

This keeps the change strictly inside the `hasNoEnabledPools` branch and does not touch any active jackpot/pool configuration paths.

### Impact
After this fix, a €10 wager in the fallback mode will contribute €0.50 pool, €0.35 seed, €0.15 house (total €1.00 = 10% of wager), making tile animations clearly visible and mathematically aligned with the intended brand split.