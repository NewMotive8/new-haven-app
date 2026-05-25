## Scope

Frontend-only fixes in `src/routes/admin.simulator.tsx`. The keys you named (`config.splitShare.house`, `config.contributionRate`, `config.jackpotType`) don't exist on our typed `JackpotConfigDTO` — the persisted equivalents are `config.contribution.houseWeight`, the sum of pool+seed `contributionAmount`s, and `config.structuralType`. I'll resolve them via small adapters so the spec lands without DTO changes.

---

## 1. Operator Revenue & RTP cards

**Adapter helpers** (top of `ComplianceDashboard`):
```ts
const splitShare = {
  pool: getJackpotSplit(config).poolPct / 100,
  seed: getJackpotSplit(config).seedPct / 100,
  house: getJackpotSplit(config).housePct / 100,
};
const contributionRate =
  (Number(config?.contribution?.totalContributionAmount) ||
    (Number(config?.pool?.contributionAmount) || 0) +
      (Number(config?.seed?.contributionAmount) || 0)) / 100;
```

**Operator Net Revenue card**:
```ts
const operatorRevenue = totalWager * contributionRate * splitShare.house;
```
Drop the "No house split configured" badge when `operatorRevenue > 0`; show it only when the value is zero (so operators still get a hint on legacy configs).

**Effective Jackpot RTP card**:
```ts
const rtpPct = totalWager > 0 ? (totalPayout / totalWager) * 100 : 0;
```
Always client-computed, no backend fallback. Format `${rtpPct.toFixed(3)}%`.

---

## 2. Chart title + accumulation slopes

**Dynamic title** — map `config.jackpotType` to `config.structuralType`:
```ts
const jackpotType = String((config as any)?.jackpotType ?? config?.structuralType ?? "").toLowerCase();
const chartTitle =
  jackpotType === "must_drop" ? "Must-Drop Escalation"
  : jackpotType === "classic" ? "Classic Odds Escalation"
  : "Probability Escalation";
```
Pass the title down to `MustDropChart` via a new optional prop.

**`buildPoolReplay` step-by-step accumulation** — current bug: contribution lookup falls through `perSpinPoolContribution` which returns 0 when `contributionAmount` is FIXED at 0 or when only `totalContributionAmount` is set. Rewrite slope computation:

```ts
const perSpinTotal = wager * contributionRate;          // 1 × 0.02 = 0.02 per spin
const perSpinSeed  = perSpinTotal * splitShare.seed;
const perSpinPool  = perSpinTotal * splitShare.pool;
const seedCap      = Number(config.seed?.maximumSeedAmount) || Number(config.seed?.targetAmount) || 0;
```

Step loop (N≈200 sample points spanning the full iteration count):
```text
for each span of `span` spins between sample points:
  seedAdd    = perSpinSeed × span
  poolAdd    = perSpinPool × span
  headroom   = max(0, seedCap − seed)
  seedApply  = min(headroom, seedAdd)
  overflow   = seedAdd − seedApply
  seed += seedApply
  pool += poolAdd + overflow      // overflow re-routes into main pool
  replay any win events landing in this span: pool -= payout; seed -= floorDraw; pool += floorDraw
```

This is structurally what the helper already does, but the inputs are wrong — replacing the `perSpinPoolContribution(...)` call with the explicit `wager × contributionRate × splitShare` math produces the climbing slope. Result:
- Seed series ramps until it hits the cap, then renders as a flat ceiling.
- Pool series climbs at `perSpinPool` before overflow, then steepens to `perSpinPool + perSpinSeed` after the seed cap.
- Win events produce the sharp sawtooth drops.

`totalOverflow` and `overflowStart` already feed off this loop, so no other call sites need touching.

---

## 3. Blocked-by-Gate context sub-badge

When `blockedByGate > 0`, render a second line under the existing badge:

> *"Simulation loop running on zero-accumulation state — subsequent triggers blocked to protect re-seed floor."*

Extend `ComplianceKpi` with an optional `subNote?: string` prop that renders below the badge in a smaller muted style (12px, `#fca5a5` when `tone==="alert"`, otherwise `#7d8ba3`). Keep the rest of the card layout untouched.

---

## Technical notes

- Single file touched: `src/routes/admin.simulator.tsx`.
- No DTO/backend changes.
- `config.splitShare`, `config.contributionRate`, `config.jackpotType` are aliased to existing persisted fields (`contribution.houseWeight`, pool+seed `contributionAmount`, `structuralType`) — no schema migration needed.
- `getJackpotSplit` already returns the right percentages for both legacy (poolWeight = pool.contributionAmount %) and split-mode configs.
- Charts: no library swap, still Recharts.

## Out of scope

- Backend `simulate-bet` endpoint returning per-spin timeseries data.
- Adding typed `splitShare`/`jackpotType`/`contributionRate` fields to `JackpotConfigDTO`.

Ready to implement on approval.