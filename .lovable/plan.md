# Phase 1 — Impact Analysis: Seed Overflow Valve & `minimumSeedAmount` / `maximumSeedAmount`

Diagnostic only — no files will be modified. The findings below show today's behaviour end-to-end and flag the gaps that the future implementation will have to bridge.

---

## 1. UI & Schema Mapping

### Form state (already present)
`src/components/jackpot/JackpotCreationForm.tsx`

- `JackpotSavePayload` (line 227–228) already declares **both** `reseedingAmount: number` and `maximumSeedAmount: number`.
- State hooks: `useState<number>(initial?.maximumSeedAmount ?? 0)` at **line 410**; `reseedingAmount` is handled analogously.
- Both fields are emitted into the save payload at **lines 779–780**.
- Two `Maximum Seed Amount` inputs already exist in the UI (lines **2440–2448** and **2525–2533**) — one per contribution-mode branch.

**So `maximumSeedAmount` is captured but `minimumSeedAmount` does NOT exist yet.** Today the "minimum / reseed floor" is conflated with `reseedingAmount`:
- `src/lib/jackpot/build-create-body.ts:83–87` → `const reseed = Number(payload.reseedingAmount) || 0; const seedAmount = reseed > 0 ? reseed : initialPool;`
- `src/lib/jackpot/payload-to-config.ts:102, 120` → `pool.minimumAmount = reseed` (this is the simulator's reseed floor).

Implementation will need to:
1. Add `minimumSeedAmount?: number` to `JackpotSavePayload`, a state hook, and a labeled input next to `maximumSeedAmount` in both branches of the form.
2. Decide the relationship between `reseedingAmount` and the new `minimumSeedAmount`. Recommendation: **alias** them (keep `reseedingAmount` as the canonical wire field and expose `minimumSeedAmount` as the user-facing label), or introduce `minimumSeedAmount` as a distinct field that defaults to `reseedingAmount` for backward compat. The form already has one or the other under different labels in different places — worth aligning.

### Persistence layer (DB) — gap analysis

Today's `public.jackpots` table columns (verified via the live schema):

```
id, name, brand_id, enabled, contribution_percentage, volatility,
trigger_condition (jsonb), trigger_probability, group_id, tier_rank,
split_share, assigned_categories, assigned_game_ids, created_at, updated_at
```

Sibling tables:
- `public.jackpot_pools` → `{ jackpot_id, current_balance }`
- `public.jackpot_seeds` → `{ jackpot_id, base_seed_amount }`

**No dedicated columns exist for `minimum_seed_amount` or `maximum_seed_amount`.** Two viable storage strategies:

| Option | Where it lives | Trade-offs |
|---|---|---|
| **A. JSONB in `jackpots.trigger_condition`** (already used for `engineV2`, `pool`, `seed`, `widget`, …) | Add `trigger_condition.seed.minimumSeedAmount` and `trigger_condition.seed.maximumSeedAmount` | Zero migration; read path is already `JackpotDTO.config.seed.*` (DTO already exposes `jp.config` via `readTriggerProbability` pattern). Cheapest, recommended. |
| **B. New columns on `jackpot_seeds`** | `ALTER TABLE jackpot_seeds ADD COLUMN minimum_seed_amount double precision NOT NULL DEFAULT 0, maximum_seed_amount double precision NOT NULL DEFAULT 0` | Stronger typing + cleaner SQL aggregations. Requires migration + edits in `inflateDto` (`store.server.ts:65–80`), `createJackpot` (line 240), `updateJackpot` (line 285) + `inlineConfigFromDto` (`bet.ts:269–303`). |

Option **A** keeps the change surface tight to the form + ledger; option **B** is needed if compliance ever wants SQL-level queries on the cap.

### Round-trip read
- `dto-to-payload.ts:79` already references `maximumSeedAmount: 0` (stub) when re-hydrating a DTO into the editor. The future change should populate it from wherever the value is stored (option A: `dto.config.seed.maximumSeedAmount`; option B: a new column).

---

## 2. Data Flow Mapping — Pool Delta Calculation & Commit

### Computation (pure, in-process)
- `src/lib/jackpot/ledger.ts` is the single source of truth for the 3-way slice.
  - `resolveContributionSlice` (lines 34–51) computes `{ pool, seed, house }` for a single jackpot config.
  - `computeBetLedger(jp, wager)` (lines 54–81) wraps the slice into a `BetLedger`.
  - `computeMultiCampaignLedger(configs, wager)` (lines 139–182) fans out across all enabled tiers and divides by the split denominator.

### Live commit (DB write) — the critical gap
- `src/routes/api/v1/event/bet.ts` builds the group response (lines **591–615**) and constructs `poolDeltas` at **lines 621–624**:
  ```ts
  const poolDeltas = perJackpot.map((e) => ({
    jackpotId: e.jackpotId,
    delta: e.contribution.pool,   // ← only the .pool slice ships to the DB
  }));
  ```
- That payload is handed to `recordGroupTransaction` (`store.server.ts:953–1005`), which calls the Postgres function `apply_group_bet(p_payload jsonb)`.
- Inside the SQL function (see `<db-functions>`):
  ```sql
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_deltas)
  LOOP
    UPDATE public.jackpot_pools
       SET current_balance = current_balance + v_delta
     WHERE jackpot_id = v_jp_id;
  ...
  ```
  → **Only `jackpot_pools.current_balance` is mutated per bet.** The function never reads, writes, or even sees the `seed` slice — `totals.seed` exists only in the JSON response envelope (`totals` argument) for audit echoing.

**Implication for the overflow valve:** today's commit path has nothing to overflow. The seed slice is computed, echoed in the API response, persisted into `jackpot_transactions.totals` for the ledger trail, but **never accumulates anywhere durable**. To implement Phase 2 we will need to:
1. Persist the seed slice as a real delta against `jackpot_seeds.base_seed_amount` (or a new `current_seed_amount` column — see §3), AND
2. Compare the post-update value against `maximumSeedAmount`, AND
3. Redirect the overflow back into `jackpot_pools.current_balance` in the same atomic SQL transaction.

The cleanest seam for the redirect is **inside `apply_group_bet`** (so the cap check, seed update, and pool top-up all happen under the same row-lock and cannot race). Per-jackpot `maximum_seed_amount` and `minimum_seed_amount` would be passed in `p_payload.poolDeltas[*]` alongside `jackpotId` + `delta`, OR read in the function via a join. Passing in the payload keeps the SQL function dumb and avoids a schema migration if we pick storage option A.

---

## 3. State Evaluation — How the Engine Reads "Current Seed Balance" Today

**Short answer: it doesn't.** The live transaction never queries the current accumulated seed pool.

- `jackpot_seeds.base_seed_amount` is treated as a *static reseed floor*, not a running accumulator. It is set at jackpot creation (`store.server.ts:240–241`) and only mutated via:
  - `apply_jackpot_topup(...)` — an admin tool (`src/routes/api/v1/jackpots/topup.ts` calls it).
  - `updateJackpot` when the admin edits the seed amount (`store.server.ts:285–290`).
- During a live bet, `inlineConfigFromDto` (`bet.ts:269–303`) maps `jp.seedAmount` → `seed.currentAmount` AND `seed.targetAmount` AND `pool.minimumAmount` (i.e. treats the configured seed as both the floor and the target).
- `inflateDto` (`store.server.ts:65–80`) reads `base_seed_amount` from the DB into `JackpotDTO.seedAmount` — again, used as static config, not as a live accumulator.

The **simulator** (`src/lib/jackpot/simulator.ts`) does maintain a running `seedCurrent` clamped by `seedCap` (lines 131, 151, 245, 491). But that lives entirely in in-process simulation state — never touches Postgres. It demonstrates the *math we will need to port*, but production has no equivalent yet.

**Implementation prerequisite for Phase 2:** the schema needs a real per-jackpot "accumulated seed balance" column to compare against the cap. Options:
- **B1.** Repurpose `jackpot_seeds.base_seed_amount` as the accumulator (semantically dangerous — would break `apply_jackpot_topup` and `updateJackpot` semantics).
- **B2.** Add `current_seed_amount double precision NOT NULL DEFAULT 0` to `jackpot_seeds` (keeps `base_seed_amount` as the immutable reseed floor configured by ops; adds a runtime counter). **Recommended.**

`apply_group_bet` would then `UPDATE jackpot_seeds SET current_seed_amount = LEAST(maximum, current_seed_amount + seed_delta) RETURNING (seed_delta - applied_delta) AS overflow`, then add the `overflow` to `jackpot_pools.current_balance` in the same statement.

---

## 4. The Reset Sequence — What Happens After a Win Today

**Short answer: there is no production reseed.** The win settlement in `apply_group_bet` is:

```sql
SELECT current_balance INTO v_balance FROM jackpot_pools WHERE jackpot_id = v_win_jp FOR UPDATE;
...
v_payout := LEAST(v_win_amount, v_balance);
IF v_payout > 0 THEN
  UPDATE jackpot_pools SET current_balance = current_balance - v_payout WHERE jackpot_id = v_win_jp;
END IF;
INSERT INTO jackpot_wins (...) ON CONFLICT (transaction_id) DO NOTHING;
```

After a win the pool is **decremented to `current_balance - payout`** (often 0). It is **not** topped up from `jackpot_seeds.base_seed_amount`. The only "reseed" in the codebase is the **simulator-only** function `reseedAfterWin` in `simulator.ts:166–190`:

```ts
rt.poolCurrent = rt.reseedAmount;             // AVERAGE
if (hasFixedOrMaxOverride)
  rt.seedCurrent = Math.max(0, rt.seedCurrent - rt.reseedAmount);  // MAXIMUM
```

In other words, today's "reset to baseline" is purely in-memory simulator behaviour for forecasting — the live engine leaves the pool decremented and never auto-tops it up from the seed reservoir.

**Implications for Phase 2:**
- We must add a production reseed step inside `apply_group_bet`, immediately after the win decrement, that:
  1. Reads `jackpot_seeds.{current_seed_amount, minimum_seed_amount, base_seed_amount}` for the winning jackpot.
  2. Top-up amount = `min(minimumSeedAmount, current_seed_amount)`.
  3. `UPDATE jackpot_pools SET current_balance = current_balance + topup` AND `UPDATE jackpot_seeds SET current_seed_amount = current_seed_amount - topup`.
- **Starvation guard:** if `current_seed_amount < minimumSeedAmount`, top up by whatever is available (no overdraw); the next cycle re-fills it via the standard seed contributions until it hits `maximumSeedAmount` again. This guarantees the overflow valve cannot accidentally drain the floor — the cap and the floor are independent dials.
- **Compliance guarantee:** because overflow money is moved *into the same player-facing pool* (and never into `house`), the player ecosystem invariant is preserved by construction. The `house` column in `apply_group_bet` payloads remains untouched by the new logic.

---

## Summary of Today's Behaviour vs. The Requirement

| Concern | Today | Required for Phase 2 |
|---|---|---|
| `maximumSeedAmount` form field | ✅ exists | Reuse |
| `minimumSeedAmount` form field | ❌ absent (conflated with `reseedingAmount`) | Add, or alias `reseedingAmount` |
| Persisted storage | Only in `trigger_condition` JSONB (and `base_seed_amount` for the legacy reseed floor) | Either JSONB (`config.seed.{minimum,maximum}SeedAmount`) or new columns on `jackpot_seeds` |
| Live seed accumulator | ❌ none — `base_seed_amount` is static | Add `jackpot_seeds.current_seed_amount` (recommended) |
| Per-bet seed delta commit | ❌ ignored — only `pool` delta written | Extend `poolDeltas` payload + `apply_group_bet` to apply seed delta with cap check |
| Overflow redirect to main pool | ❌ N/A — money currently evaporates into the response envelope | Implement inside `apply_group_bet` so it's atomic with the cap check |
| Reset after win | ❌ pool decremented, never topped up | Add reseed step inside `apply_group_bet` reading `minimum_seed_amount` |
| House safety (compliance) | ✅ `house` is computed but the SQL function never writes a house ledger | Preserved — overflow goes pool↔seed only, never to house |

### Isolation guarantees for the eventual implementation
- Math curves for AVERAGE / MAXIMUM / Must-Drop in `src/lib/jackpot/math.ts` are **not touched**.
- The Classic wager-proportional trigger probability shipped previously is **not touched**.
- The single-jackpot legacy path (`bet.ts:695–759`) and the multi-config router (`bet.ts:761–855`) do not call `apply_group_bet`; they currently have no DB-level pool commit at all (they only persist via `processedTransactions` cache + `appendAudit`). The overflow valve only needs to ship in the group fan-out path for Phase 2; the other two paths are sandbox-only and can be addressed in a follow-up if compliance asks.

Awaiting approval before moving to Phase 2 (implementation: schema migration + SQL function update + form field + DTO wiring).
