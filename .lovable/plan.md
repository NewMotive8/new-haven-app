# Fix: `contributionAmount` in saved JSON ignores Split-mode inputs

## What you're seeing

In the saved jackpot JSON, `pool.contributionAmount` is `3` (and seed has a
similar stale value) even though in the form you used **Split** mode and
entered, for example, a Fixed Contribution Amount of `0.25` with weights
60 / 30 / 10.

## Why

`src/lib/jackpot/payload-to-config.ts` maps the JSON like this today:

```
pool.contributionAmount = payload.poolPercentageValue   // legacy field
seed.contributionAmount = payload.seedPercentageValue   // legacy field
```

`poolPercentageValue` is initialized to `3` in the form
(`JackpotCreationForm.tsx`, line 272). When you're in **Split** mode you never
touch that legacy slider, so it stays at its default and that default is what
gets written to the JSON. The v2 split inputs
(`totalContributionAmount`, `poolWeight`, `seedWeight`, `houseWeight`) are
saved separately under `contribution.*` but are never used to derive
`pool.contributionAmount` / `seed.contributionAmount`.

Same problem on multi-level tiers: tier `pool.contributionAmount` falls back
to the global legacy value when the tier was configured via Split.

## Fix

In `src/lib/jackpot/payload-to-config.ts`, when `contributionMode === "split"`,
derive the per-bucket amounts from the split inputs instead of the legacy
percentage fields:

- `pool.contributionAmount  = totalContributionAmount * poolWeight / 100`
- `seed.contributionAmount  = totalContributionAmount * seedWeight / 100`
- `pool.contributionType = seed.contributionType = totalContributionType`
  (`FIXED` or `PERCENTAGE`)

Use largest-remainder rounding (same approach already used in the form's
Amount table) so pool + seed + house sum exactly to
`totalContributionAmount` at the displayed precision — no 0.251-style drift.

Apply the same rule per tier: when a tier's `contributionMode === "split"`,
derive `tier.pool.contributionAmount` / `tier.seed.contributionAmount` from
that tier's split inputs; otherwise keep the current legacy behavior.

Leave `contribution.*` (the v2 block) as-is — it's still the source of truth
and useful for round-tripping.

## Out of scope

- Form UI, validation, weight inputs.
- `buildCreateBody` / `buildTriggerCondition` shape (only the
  `payload-to-config.ts` mapping changes).
- Legacy mode behavior — unchanged.
