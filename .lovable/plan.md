# Fix Contribution Amount rounding (0.251 vs 0.250)

## Problem

In the Contribution Weight table, each row's Amount is computed as
`base * (weight / 100)` and displayed via `.toFixed(3)`. With weights like
34 / 33 / 33 and base 0.25, the true amounts are 0.0850 / 0.0825 / 0.0825
(sum 0.25), but `toFixed(3)` rounds each independently to 0.085 / 0.083 / 0.083,
which visually adds up to 0.251.

Each row is mathematically correct on its own — the issue is that independent
per-row rounding doesn't preserve the total.

## Fix

Use largest-remainder rounding so the three displayed Amounts always sum
exactly to the base contribution amount.

Scope: presentation only — `src/components/jackpot/JackpotCreationForm.tsx`,
the `computed` helper inside the `jackpotContributionSection` IIFE
(around lines 496–542). Same fix applied to the per-tier split block
(around line 4349) where the same `toFixed(3)` pattern is used.

Algorithm (3 decimals):
1. For each row compute `exact = base * weight / 100`.
2. Floor each to 3 decimals (`floor(exact * 1000) / 1000`) and track the remainder.
3. Distribute the rounding gap (`round(base*1000) - sum(floors*1000)`) one
   unit at a time to the rows with the largest remainders.
4. Render each row's allocated value with `.toFixed(3)`.

Out of scope: the underlying numeric state, save payload, weight inputs,
warning banner, styling.
