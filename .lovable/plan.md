# Fix: ledger case-sensitivity drops the v2 split

## What's wrong

After the previous fix, `getJackpot` now carries the full v2 config to the
bet endpoint, but every spin still shows Pool €0 / Seed €0 / House €0.

The blumberg jackpot stores:

- `engineV2.totalContributionType: "fixed"` (lowercase)
- `engineV2.totalContributionAmount: 0.15`
- weights 60 / 30 / 10

`src/lib/jackpot/ledger.ts → resolveContributionSlice` compares the type to
the uppercase literal `"FIXED"`. Because `"fixed" !== "FIXED"`, it falls into
the percentage branch and computes
`totalForCalc = 1 × 0.15 / 100 = 0.0015`, then `pool = 0.0015 × 0.6 ≈ €0.001`.
That rounds to €0.00 in the UI, which is what the user sees.

The same case mismatch affects the legacy fallback (`pool.contributionType`,
`seed.contributionType`) and the per-tier path, because the admin form also
writes these lowercase.

## Fix

Normalize the contribution-type comparison in
`src/lib/jackpot/ledger.ts`:

- Introduce a small helper `isFixed(type)` that uppercases the value and
  returns `true` when it equals `"FIXED"`.
- Use it in all three places: split branch (`totalContributionType`),
  flat pool fallback, and flat seed fallback.

No change required in `bet.ts` or the admin write path — the helper just
makes the comparison case-insensitive so both `"fixed"` and `"FIXED"` work.

## Verification

On `/sandbox-demo`, brand 1, with the existing blumberg jackpot, a €1 spin
should produce: Pool €0.09, Seed €0.045, House €0.015. The pool balance
should grow by €0.09 per spin (topup already wired).

## Files

- `src/lib/jackpot/ledger.ts` — case-insensitive `FIXED` check in
  `resolveContributionSlice`.
