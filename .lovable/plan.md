# MultiJackpot "Suggest" auto-allocator + ladder presets + simulator handshake

Give the admin one-click ways to configure a multi-level jackpot without hand-calculating shares, probabilities, seeds and pool caps.

## UX

Three cooperating features on the MultiJackpot creation flow.

### A. Ladder Presets (Step 1 → Step 2 handoff)

At the top of **Step 2 (Tier Allocation)**, when no tiers exist yet, show a "Quick start" strip with 3 preset cards:
- **Bronze / Silver / Gold** — 3 tiers, balanced ladder.
- **4-tier Mega Ladder** — Bronze / Silver / Gold / Platinum, top-heavy.
- **Twin Tier** — 2 tiers, flat-frequent.

Clicking a preset creates and saves all tiers in one shot with sensible defaults (names, ranks, shares, seeds, weights). Admin lands in Step 2 with a fully filled ladder they can tune. The Suggest button (below) then just re-tunes.

Manual "Add tier" remains available for admins who want full control.

### B. "Suggest allocation" button

Sits in the Step 2 header next to the SharesBar. Enabled when ≥ 2 saved tiers exist.

- Each click cycles through **3 strategies** in a loop; badge shows which is active:
  1. **Balanced** — geometric ladder, moderate spread.
  2. **Top-heavy** — steeper; top prize much larger and rarer.
  3. **Flat-frequent** — shallow; tiers hit at closer frequencies.
- Opens a **preview dialog** with a table: Tier · Share % · Derived rate · Suggested reseed · Suggested pool cap · Expected hit frequency · Expected avg prize.
- Buttons: **Apply to all tiers** / **Cancel** / **Simulate this suggestion** (see C).
- Applying rewrites `splitShare`, `initialPoolAmount`, `reseedingAmount`, `poolWeight/seedWeight/houseWeight`, and trigger probability of every saved tier (and the open draft) via the existing PATCH endpoint. If tiers were customised, a "This will overwrite N tiers" confirmation appears first.
- Toast: "Suggestion applied — you can still tweak any tier manually."

### C. Simulator handshake

Inside the Suggest preview dialog, a **"Simulate 10k spins"** button opens `/admin/simulator` in a new tab with the suggested config pre-loaded, so the admin can see the expected hit distribution before applying.

Wire-up: serialize the suggested config into the same JSON shape the simulator's textarea already accepts, base64-encode it, and pass via `?preset=<b64>` query param. The simulator route reads the param on mount and hydrates the textarea + runs once. No change to how the simulator engine works — only its bootstrap.

## Math model (`src/lib/jackpot/suggest-allocation.ts`, new)

Inputs: number of tiers `N`, master contribution (fixed amount or %), strategy id.

Geometric ladder parameterised by spread factor `r`:
- Balanced: `r = 4`
- Top-heavy: `r = 10`
- Flat-frequent: `r = 2`

For tier rank `k` (1 = bottom, N = top):
- Relative weight `w_k = r^(k-1)`.
- **Split share %** = `w_k / Σw · 100`, **inverted** so the top tier gets the smallest ongoing share (rarely explodes; accrues over many spins). Bottom tier gets the largest share (frequent small hits).
- **Trigger probability** ∝ `1 / r^(k-1)`; base tuned so aggregate hit rate stays ~1 per 500–2000 spins.
- **Reseed amount** ∝ `r^(k-1)` — top tier has the largest floor.
- **Initial pool** = reseed × 1.5.
- **Pool / Seed / House weights** default 70 / 25 / 5 uniformly (GLI-friendly baseline).

Preset ladders (feature A) call this same function with the strategy that matches their character (Bronze/Silver/Gold → Balanced, Mega Ladder → Top-heavy, Twin Tier → Flat-frequent).

Module exports:
```ts
suggestTierAllocation({ tierCount, masterValue, masterType, strategyIndex }): SuggestedTier[]
buildLadderPreset(preset: "bronze-silver-gold" | "mega-ladder" | "twin-tier", masterValue, masterType): SuggestedTier[]
```

## Files touched

- `src/lib/jackpot/suggest-allocation.ts` — new pure module + colocated unit test.
- `src/components/jackpot/MultiJackpotWizard.tsx`:
  - `suggestionIndex` state, `SuggestButton` + preview dialog.
  - Quick-start preset strip when `savedChildren.length === 0`.
  - Handler mapping `SuggestedTier[]` → sequential PATCH calls on `/api/v1/jackpots/:id`, then refetch group.
- `src/routes/admin.simulator.tsx` — read `?preset=<b64>` on mount, decode, hydrate textarea, auto-run once.
- No changes to `build-create-body.ts`, `dto-to-payload.ts`, `live-engine.ts`, or DB schema — only fields that already round-trip.

## Out of scope

- No auto-recalculation on every contribution edit (opt-in via button only).
- No changes to Classic/single wizard.
- Must-Drop and Community payout remain out of scope.
