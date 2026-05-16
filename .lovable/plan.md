## Goal

Remove hardcoded fallbacks from `mapPayloadToConfig` so the simulator's `pool.maximumAmount` and `seed.targetAmount` reflect the user's actual form inputs. Wire the currently-stub form fields that should drive them.

## Diagnosis

In `src/lib/jackpot/payload-to-config.ts`:
- `pool.maximumAmount` is `num(payload.maxWinAmount, 10000)` — already maps to the wired **Max Win Amount** input, but silently substitutes `10000` if blank.
- `seed.targetAmount` is the literal `1000` — never reads the form.
- `pool.currentAmount` and `seed.currentAmount` are derived from `seedPercentageValue` (the contribution %), which conflates two unrelated concepts.

The form has the right inputs but they're visual stubs (no `value` / `onChange` / not in `JackpotSavePayload`):
- **Re-Seeding Amount** (`#reseed-amount`, Classic ~line 1162) — semantically the seed refill target.
- **Maximum Seed Amount** (`#max-seed-percentage` ~1291 / `#max-seed` ~1396) — the seed cap; both inputs live in the same Seed card under the percentage vs fixed branches and represent the same logical field.

## Changes

### `src/components/jackpot/JackpotCreationForm.tsx` (Classic jackpot only)

1. Add two new state fields, initialized from `initial?.*` so the Back-from-Simulator round-trip restores them:
   - `reseedingAmount: number` (default `0`)
   - `maximumSeedAmount: number` (default `0`)
2. Wire `#reseed-amount` (~line 1162) with `value={reseedingAmount}` + `onChange`. Remove the bogus `defaultValue="03"`.
3. Wire both `#max-seed-percentage` (~1291) and `#max-seed` (~1396) to the **same** `maximumSeedAmount` state.
4. Add `reseedingAmount` and `maximumSeedAmount` to the exported `JackpotSavePayload` type AND the inner re-declaration; include them in `buildPayload()`.

### `src/lib/jackpot/payload-to-config.ts`

Replace the hardcoded mapping block with dynamic, fallback-only-when-blank logic:

```ts
// Pool current = user's reseed (re-seed is where the pool restarts after a win)
const reseed = num(payload.reseedingAmount, 0);
const minWin = num(payload.minWinAmount, 0);
const maxWin = num(payload.maxWinAmount, 0);
const maxSeed = num(payload.maximumSeedAmount, 0);
const baseSeed = num(payload.seedPercentageValue, 0); // contribution % proxy
const seedTarget = maxSeed > 0
  ? maxSeed
  : reseed > 0
    ? reseed * 5            // operational threshold = 5× reseed
    : baseSeed > 0
      ? baseSeed * 2        // fallback: 2× base seed
      : 1000;               // last-resort floor so math doesn't divide by 0

return {
  ...
  pool: {
    currentAmount: reseed > 0 ? reseed : (baseSeed > 0 ? baseSeed * 2 : 1000),
    minimumAmount: minWin,                // 0 is a valid user value
    maximumAmount: maxWin,                // 0 = uncapped; engine already treats <=0 as Infinity
    contributionAmount: poolContributionAmount,
    contributionType: poolContributionType,
  },
  seed: {
    currentAmount: baseSeed > 0 ? baseSeed : (reseed > 0 ? reseed : 500),
    targetAmount: seedTarget,
    contributionAmount: seedContributionAmount,
    contributionType: seedContributionType,
  },
  ...(payload.payoutModel === "fixed"
    ? { fixedWinAmount: num(payload.fixedWinAmount, 0) }
    : {}),
  ...(payload.payoutModel === "maximum"
    ? { maximumWinAmount: maxWin }
    : {}),
};
```

Key points:
- `pool.maximumAmount` is taken verbatim from **Max Win Amount**. The Java-ported engine already treats `<= 0` as `Number.POSITIVE_INFINITY` (`simulator.ts` line 23), so `0` correctly means "uncapped" — no skew.
- `seed.targetAmount` is **never** the silent `1000` anymore. Priority: explicit Maximum Seed Amount → derived from Re-Seeding Amount (×5) → derived from base seed (×2) → last-resort `1000` floor only when *every* input is blank (prevents division by 0 in `customLog`).
- `pool.currentAmount` now comes from Re-Seeding Amount when present (matches engine semantics — after each win the pool resets to `poolMinimum`, but the *starting* pool should reflect what the user typed).

### Verification

After implementing:
1. Open Classic jackpot creation, set Re-Seeding Amount = 50, Maximum Seed Amount = 5000, Min/Max Win = 100/8000, click **Continue**.
2. On Simulator page, the JSON textarea must show `pool.maximumAmount: 8000`, `seed.targetAmount: 5000`, `pool.currentAmount: 50` — no `1000` / `10000` ghost values.
3. Run a 1,000,000-iteration simulation and confirm RTP is finite and win count is bounded (no runaway payouts).

## Out of scope

- Frequency jackpot duplicates of these inputs (`#frequency-reseed-amount`, `#frequency-max-seed*`) — same pattern, deferred until the Frequency flow is needed.
- Must-Drop, Multi-Level — not touched.
- Adding a dedicated "Starting Pool Amount" input — using Re-Seeding Amount as the proxy matches the engine's reseed semantics.
