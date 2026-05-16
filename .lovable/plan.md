# Fix simulator math: RTP + seed handling

Two bugs in `src/lib/jackpot/simulator.ts` (plus one mapping bug in `payload-to-config.ts`) produce impossible metrics like RTP 375.99% and a seed that only ever grows.

## Bug 1 — RTP denominator is wrong

```ts
const rtp = totalContributions > 0 ? (winAmountCounter / totalContributions) * 100 : 0;
```

`totalContributions` accumulates **only** the pool contribution per spin (e.g. 0.5 of a 10 wager → ~5%). Dividing total wins by that fraction inflates RTP by `1 / contribution%`. With a typical 0.5/10 split that's ~20×, which is exactly how a real ~94% RTP shows up as ~375%.

RTP must be `wins / totalWagered`:

```ts
const rtp = totalWagered > 0 ? (winAmountCounter / totalWagered) * 100 : 0;
```

## Bug 2 — Seed contributions are never counted

```ts
totalContributions += poolContribution;   // seedContribution missing
```

`seedContribution` is added to `seedCurrent` but never accumulated into the reported `totalContributions`. The output panel shows pool contributions only, hiding half the funding flow. Fix:

```ts
totalContributions += poolContribution + seedContribution;
```

(Keep the RTP fix above using `totalWagered`, not this corrected total — RTP is wins ÷ wager, not wins ÷ contributions.)

## Bug 3 — Seed is never paid out on win

```ts
const winAmount = fixedWinOverride !== null ? fixedWinOverride : poolCurrent;
...
const fromSeed = seedCurrent < reseedAmount ? seedCurrent : reseedAmount;
poolCurrent = reseedAmount;
seedCurrent -= fromSeed;
```

On a win the engine pays out `poolCurrent` only. `fromSeed` is **subtracted** from the seed but **never added** to the player's win and never used to top the pool. Net effect: the seed monotonically inflates over millions of iterations and disappears from the books. The Java reference flow is: pay the pool to the player, then refill the pool from the seed up to the reseed floor.

Fix: include the seed top-up in the payout (or, equivalently, transfer `fromSeed` into the pool before paying). Concretely:

```ts
const basePayout = fixedWinOverride !== null ? fixedWinOverride : poolCurrent;
const fromSeed = Math.min(seedCurrent, reseedAmount);
const winAmount = basePayout + fromSeed; // seed flows to the winner via the reseed top-up
...
poolCurrent = reseedAmount;
seedCurrent -= fromSeed;
```

This keeps the conservation identity `Σ payouts ≈ Σ contributions − ΔpoolRemaining − ΔseedRemaining`.

## Bug 4 (mapping) — `pool.minimumAmount` is mis-sourced

In `src/lib/jackpot/payload-to-config.ts`:

```ts
pool: {
  ...
  minimumAmount: minWin, // 0 is a valid user input
```

The engine treats `pool.minimumAmount` as the **reseed floor** (`reseedAmount = Math.max(0, poolMin)` in `simulator.ts`). Mapping the form's `minWinAmount` here means the pool resets to the minimum *win* threshold, not the operator's reseed level. With `minWinAmount = 0` the pool resets to 0 after every win, which makes the next win calculation start from an empty pool every time — combined with Bug 3, this is why the seed never drains.

Fix: source the reseed floor from `payload.reseedingAmount` (already pulled into `reseed`), not `minWin`:

```ts
minimumAmount: reseed,
```

`minWinAmount` is unrelated to pool reseeding and should not be wired here. If a min-win filter is needed later, it belongs on the win event, not on `pool.minimumAmount`.

## Files

- `src/lib/jackpot/simulator.ts` — fix RTP formula, include seed in `totalContributions`, add seed top-up into win amount.
- `src/lib/jackpot/payload-to-config.ts` — change `pool.minimumAmount` to use `reseed` instead of `minWin`.

## Verification

After the fix, on a config with wager=10, pool contribution=0.5 fixed, seed contribution=0.1 fixed, iterations=1e6:
- `totalContributions ≈ 0.6 × 1e6 = 600,000`
- `totalWagered = 10 × 1e6 = 10,000,000`
- RTP should land in a plausible band (typically 80–98%), not >100%.
- `finalSeed` should oscillate, not climb monotonically to ~`seedContribution × iterations`.
