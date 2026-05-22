# Relational Jackpot Groups — Architectural Migration Plan

Shift from the monolithic `MULTI_LEVEL` jackpot type to a relational **parent (group) → children (jackpots)** model. The group owns identity, brand scope, and a lifecycle state machine; children are individual jackpot rows linked by `group_id`, each with its own high-precision `trigger_probability`. The bet ingestion pipeline fans out one wager across all active children in a group inside a single atomic transaction, with strict 6-decimal floor scaling for GLI-12 accounting.

---

## 1. Legacy `MULTI_LEVEL` removal

### Where it lives today
- **Types** — `src/lib/jackpot/types.ts`: `JackpotKind = "multi_level"`, `JackpotStructuralType = "MULTI_LEVEL"`, `TierDTO`, `tiers?: TierDTO[]` on `JackpotConfigDTO`, `tierResults`, `tierCounts`.
- **Engine** — `src/lib/jackpot/ledger.ts` lines 18, 26–28, 71–80 (tier loop using `multiLevelWeight`); `src/lib/jackpot/simulator.ts` (MULTI_LEVEL branches and tier roll-up).
- **Mappers** — `src/lib/jackpot/payload-to-config.ts` lines 39, 112–188 (multi-level tier construction); `src/lib/jackpot/build-create-body.ts` lines 24–30, 109 (tier validation and serialization).
- **Persistence** — `src/lib/jackpot/store.server.ts` lines 156, 271: tiers packed/unpacked from `jackpots.trigger_condition` JSONB.
- **Ingestion** — `src/routes/api/v1/event/bet.ts` line 115: `structuralType: tiers?.length > 0 ? "MULTI_LEVEL" : "CLASSIC"`.
- **UI** — `src/routes/sandbox-demo.tsx`, `src/routes/admin.jackpots.new.tsx`, `src/routes/admin.simulator.tsx` (any "Multi-level" form/preset).

### Clean-up sequence
1. **Freeze writes first.** Make the create/update API reject `type: "multi_level"` with a `410 Gone` and pointer to `POST /api/v1/jackpot-groups`. Keep read paths tolerant during the migration window.
2. **Backfill migration.** For every existing jackpot row whose JSONB has `tiers[]`, synthesize one `jackpot_groups` row + N child rows (one per tier, weights → split contributions, `multiLevelTier` → `tier_rank` ordering column), then null out the legacy `tiers` array.
3. **Delete code paths** in this order, once the backfill is verified empty:
   - `ledger.ts` tier branch (71–80) → replaced by group fan-out (Section 4).
   - `payload-to-config.ts` MULTI_LEVEL block (112–188) and the kind alias on line 39.
   - `build-create-body.ts` tier validation (24–30) + the tiers passthrough (109).
   - `simulator.ts` MULTI_LEVEL branch, `tierResults`, `tierCounts`.
   - `types.ts`: drop `"multi_level"` from `JackpotKind`, drop `"MULTI_LEVEL"` from `JackpotStructuralType`, delete `TierDTO`, `tiers`, `tierResults`, `tierCounts`.
   - `bet.ts` line 115 collapses to `structuralType: "CLASSIC"`; `inlineConfigFromDto` loses its `tiers` plumbing.
4. **DB constraint cleanup.** Add a CHECK that forbids `trigger_condition ? 'tiers'` on `jackpots` once backfill completes.

This ordering prevents dual processing — fan-out (new) and tier loop (legacy) can never both run on the same wager because the tier loop is removed in the same commit that introduces `group_id`.

---

## 2. Relational schema changes

### New parent table `jackpot_groups`
```text
id              bigint  PK
brand_id        bigint  NOT NULL                -- multi-tenant scope
name            text    NOT NULL
status          text    NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','disabled'))
overlapping_rule text   NOT NULL DEFAULT 'split' -- mirrors current per-jackpot rule
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
activated_at    timestamptz                      -- set when status flips to 'active'

UNIQUE (brand_id, name)
INDEX  (brand_id, status)
```

### Child table — extend existing `jackpots`
```text
ALTER TABLE jackpots
  ADD COLUMN group_id           bigint REFERENCES jackpot_groups(id) ON DELETE RESTRICT,
  ADD COLUMN tier_rank          int,                                     -- ordering within group (1 = lowest)
  ADD COLUMN trigger_probability numeric(12,8) NOT NULL DEFAULT 0,       -- p per spin, 0.00000000–1.00000000
  ADD CONSTRAINT trigger_probability_range
      CHECK (trigger_probability >= 0 AND trigger_probability <= 1),
  ADD CONSTRAINT tier_rank_requires_group
      CHECK ((group_id IS NULL AND tier_rank IS NULL)
          OR (group_id IS NOT NULL AND tier_rank IS NOT NULL));

CREATE UNIQUE INDEX jackpots_group_tier_uniq
  ON jackpots (group_id, tier_rank) WHERE group_id IS NOT NULL;
CREATE INDEX jackpots_group_enabled_idx
  ON jackpots (group_id) WHERE enabled = true;
```

Why `numeric(12,8)`: 8 decimal places is the explicit precision floor (avoids binary float underflow at probabilities like 1e-7). 12 total digits leaves headroom for the integer side without ever crossing 1.0.

### RLS
`jackpot_groups` gets the same brand-scoped RLS we use on `jackpots`. Children inherit access through `group_id → jackpot_groups.brand_id` (or, simpler: keep `brand_id` denormalized on `jackpots` and add a trigger that asserts `child.brand_id = parent.brand_id`).

---

## 3. State machine immutability

### Status transitions
```text
draft  ──activate──▶  active
active ──disable──▶  disabled
disabled ──reactivate──▶ active     (allowed; re-opens edits via 'draft' detour only)
disabled ──edit──▶ draft (allowed)
active   ──edit──▶  REJECTED        (must disable first)
```

Implement as a single SQL trigger on `jackpot_groups`:
- `BEFORE UPDATE`: if `OLD.status = 'active'` and any column other than `status`/`updated_at` changed → `RAISE EXCEPTION 'group is active; move to disabled or draft before editing'`.
- Transition matrix enforced by a `CHECK`-style trigger validating `(OLD.status, NEW.status)` pair.

### Child immutability
A second trigger `jackpots_block_writes_when_group_active` runs `BEFORE INSERT OR UPDATE OR DELETE` on `jackpots`:
```text
IF NEW.group_id IS NOT NULL THEN
  SELECT status INTO parent_status FROM jackpot_groups WHERE id = NEW.group_id;
  IF parent_status = 'active' THEN
    RAISE EXCEPTION 'parent group % is active; child jackpot is read-only', NEW.group_id;
  END IF;
END IF;
```

This guarantees: **no parameter, weight, probability, pool seed, or contribution rate can mutate while a group is live**. The only write permitted on an active group is the win/contribution ledger append (different table, see Section 4).

API-level guard in `store.server.ts` mirrors the DB rule for friendlier errors, but the DB is the source of truth.

---

## 4. Fan-out ingestion in `bet.ts`

### Payload addition
Extend `BetEventSchema`:
```ts
groupId: z.number().int().positive().optional(),
```
Mutually exclusive with `jackpotId` / `config` / `configs` — reject with 400 if more than one routing hint is present.

### Single-pass loop
```text
1. Verify brand + internal secret + idempotency (unchanged).
2. If groupId present:
     a. SELECT g.status, c.* FROM jackpot_groups g
        JOIN jackpots c ON c.group_id = g.id
        WHERE g.id = $1 AND g.brand_id = $brand AND g.status = 'active'
          AND c.enabled = true
        ORDER BY c.tier_rank ASC;
     b. If empty → 404 "group not active or has no children".
3. For each child, compute slice = floor6(applyContributionSplit(child, wager)).
4. Aggregate group totals = sum(slice.pool/seed/house).
5. Win evaluation: walk children high-rank → low-rank, compare rng() vs child.trigger_probability;
   first hit wins (mirrors current first-match semantics).
```

### Floor scaling to 6 decimals
Single helper used everywhere money moves:
```ts
// 1e6 chosen so 6 decimal places of EUR/USD survive a Math.floor without bias.
const SCALE = 1_000_000;
const floor6 = (n: number) => Math.floor(n * SCALE) / SCALE;
```
Apply at three checkpoints:
1. After each child contribution computation (pool/seed/house).
2. After community-payout split, if applicable.
3. Before persisting any ledger entry.

The truncation (not rounding) bias is into the house's favor by ≤ 0.000001 per child per spin — operator-safe and GLI-12 acceptable.

### Atomic transaction
Wrap the fan-out write in a single SQL transaction (server fn via `supabaseAdmin`):
```text
BEGIN;
  INSERT INTO jackpot_ledger_entries (...) -- one row per child
    VALUES (...), (...), (...);            -- multi-row insert OR
                                           -- per-child INSERT in a loop;
                                           -- both abort the whole TX on any FK,
                                           -- CHECK, or unique violation.
  UPDATE jackpot_pools SET current_balance = current_balance + $delta
    WHERE jackpot_id = ANY($child_ids);
  INSERT INTO jackpot_transactions (transaction_id, group_id, totals, ...)
    VALUES (...);                          -- idempotency anchor (UNIQUE on transaction_id)
COMMIT;
```
The `jackpot_transactions.transaction_id UNIQUE` constraint replaces the in-memory `processedTransactions` map for durable, cluster-wide idempotency. Replay returns the persisted row.

If any child append throws (e.g. CHECK violation, race with group disable), the entire wager rolls back — no partial pool credit, no orphan ledger entry.

---

## 5. File modification list & verification

### Files to edit
| File | Change |
| --- | --- |
| `src/lib/jackpot/types.ts` | Add `JackpotGroupDTO`, `GroupStatus`; remove `tiers`, `TierDTO`, MULTI_LEVEL enum values; add `groupId`, `tierRank`, `triggerProbability` to `JackpotDTO`. |
| `src/lib/jackpot/store.server.ts` | New `createGroup`, `listGroups`, `getGroup`, `setGroupStatus`, `addChildJackpot`. Remove tier pack/unpack on lines 156/271. Add API-level guard rejecting child mutation when parent is `active`. |
| `src/lib/jackpot/ledger.ts` | Delete tier branch (71–80). Add `computeGroupFanOutLedger(children, wager)` returning `{ perChild: [...], totals, totalContribution }` using `floor6`. |
| `src/lib/jackpot/payload-to-config.ts` | Drop MULTI_LEVEL alias + tier block. |
| `src/lib/jackpot/build-create-body.ts` | Drop tier validation; reject `type: "multi_level"` with deprecation error. |
| `src/lib/jackpot/simulator.ts` | Replace MULTI_LEVEL branch with group fan-out simulator; keep `SimulatorResponseDTO` shape compatible (see payload contract below). |
| `src/routes/api/v1/event/bet.ts` | Add `groupId` to schema; new fan-out branch (Section 4); wrap writes in atomic TX; replace in-memory dedupe with DB-backed `jackpot_transactions`. |
| `src/routes/api/v1/jackpots/index.ts`, `$id.ts`, `enable.$id.ts`, `disable.$id.ts` | Honor parent-group lock; reject mutations with `409 Conflict` when group is active. |
| **NEW** `src/routes/api/v1/jackpot-groups/index.ts` | `GET` list, `POST` create (draft only). |
| **NEW** `src/routes/api/v1/jackpot-groups/$id.ts` | `GET`, `PATCH` (allowed only in draft/disabled). |
| **NEW** `src/routes/api/v1/jackpot-groups/$id/status.ts` | `POST { status }` — state machine endpoint. |
| **NEW** `src/routes/api/v1/jackpot-groups/$id/children.ts` | `GET` list, `POST` attach child (draft only). |
| `src/routes/admin.jackpots.new.tsx`, `admin.jackpots.tsx` | Group selector + child editor UX. |
| `src/routes/sandbox-demo.tsx` | Group picker in S2S Tester; render `perChild` array. |

### Database migrations
1. `create_jackpot_groups` table + status CHECK + RLS.
2. `alter_jackpots_add_group_link` (`group_id`, `tier_rank`, `trigger_probability` + constraints + indexes).
3. `create_jackpot_transactions` (transaction_id UNIQUE, group_id FK, totals JSONB, processed_at).
4. `create_immutability_triggers` (group status transition + child write-lock).
5. `backfill_multi_level_to_groups` (data-only; idempotent; logged).
6. `forbid_legacy_tiers_jsonb` CHECK on `jackpots.trigger_condition`.

### Response contract (non-breaking)
Current `perJackpot[i].tierBreakdown` is already an array. The new fan-out response keeps the same outer shape:
```jsonc
{
  "groupId": 42,
  "matched": 4,
  "contribution": { "pool": 0.05, "seed": 0.02, "house": 0.03 },
  "perJackpot": [
    {
      "jackpotId": 101,
      "jackpotName": "Mini",
      "tierRank": 1,
      "triggerProbability": 0.00012500,
      "contribution": { "pool": 0.0125, "seed": 0.005, "house": 0.0075 },
      "totalContribution": 0.025
    },
    /* one entry per child, ordered by tier_rank */
  ],
  "win": { /* unchanged */ }
}
```
Downstream consumers (`sandbox-demo`, widgets, simulator) already iterate `perJackpot[]` — the only new fields (`groupId`, `tierRank`, `triggerProbability`) are additive.

### Verification checks
1. **Backfill diff**: row-count and sum-of-weights parity between legacy `tiers[]` JSONB and the new child rows.
2. **State machine**: integration test attempts UPDATE on every child column while parent is `active` → expect raise. Same UPDATE after disable → succeeds.
3. **Atomicity**: forced failure on the second child insert leaves zero rows for that `transaction_id` (verify `SELECT count(*) WHERE transaction_id = ...` = 0).
4. **Precision**: property test — for 10k random wagers and split weights, `Σ children.totalContribution ≤ wager` (never exceeds, may underflow by ≤ N × 1e-6).
5. **Idempotency**: same `transaction_id` replayed returns the persisted response with `idempotentReplay: true` and produces zero new ledger rows.
6. **Contract**: snapshot-test the bet response shape against the sandbox grid parser.

---

## Open questions before execution
1. Should `trigger_probability` live on the child (per-jackpot) **only**, or also be expressible as a group-level cap that sums children?
2. Keep `brand_id` denormalized on `jackpots` for RLS speed, or pivot all child policies through `jackpot_groups`?
3. Backfill: one-shot migration commit, or dual-write window where both paths run for a release before legacy code deletion?
