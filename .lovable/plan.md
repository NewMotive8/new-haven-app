# Phase 2 — Group Fan-Out Ingestion & Management API

Adds relational group routing to the bet ingestion pipeline and exposes the
CRUD/lifecycle endpoints for the new `jackpot_groups` parent entity.

## 1. Bet route fan-out (`src/routes/api/v1/event/bet.ts`)

### Schema additions
- Extend `BetEventSchema` with `groupId: z.number().int().positive().optional()`.
- Add a superRefine: reject (400 `ROUTING_CONFLICT`) when more than one of
  `groupId`, `jackpotId`, `config`, `configs` is supplied. Exactly zero or one
  routing token is allowed.

### New `groupId` branch (inserted before the legacy multi-campaign router)
1. Load the parent group via a new `getGroupForBet(groupId, brandId)` helper
   in `store.server.ts`. Reject 404 if missing, 409 if `status !== 'active'`,
   403 if `brand_id` mismatches the request brand.
2. Load enabled children: `jackpots` where `group_id = $1 AND enabled = true`
   ordered by `tier_rank ASC`. Empty set → return the same empty-shape
   response the multi-campaign branch returns today, with `groupId` echoed.
3. **Fan-out splits**: build a `JackpotConfigDTO[]` from the children via the
   existing `inlineConfigFromDto`, then reuse `computeMultiCampaignLedger`
   (already does per-tier pool/seed/house splits in a single pass) — no
   duplicate math.
4. **Precision**: introduce `truncate6(n) = Math.trunc(n * 1e6) / 1e6`; apply
   to every numeric field in `totals`, `totalContribution`, and each entry's
   pool/seed/house before persisting or responding.
5. **Hierarchical win evaluation**: iterate `children` from highest
   `tier_rank` down to lowest, drawing one RNG sample per tier and comparing
   against `trigger_probability` (column, fallback to existing
   `readTriggerProbability`). First match wins, breaks loop, runs
   community-payout branch if configured.
6. **Atomicity**: add a Postgres RPC `apply_group_bet(p_payload jsonb)` via
   migration that, inside a single `BEGIN/COMMIT`, (a) upserts each
   `jackpot_pools.current_balance` with the truncated pool delta, (b) inserts
   the `jackpot_transactions` row keyed by `transaction_id` (unique → natural
   idempotency at the DB layer), and (c) returns the persisted row. The
   server route calls `supabaseAdmin.rpc('apply_group_bet', { p_payload })`.
   If the RPC raises (constraint, trigger, FK), the route returns 409/500 and
   no partial state is committed — Postgres rolls back the whole block.
7. **Response shape**: mirror today's multi-campaign payload exactly
   (`matched`, `splitDenominator`, `contribution`, `house`, `totalContribution`,
   `perJackpot[]`, `win`) so `/sandbox-demo` and dashboards keep working. Add
   two additive fields: `groupId` and `routingMode: "group"`.
8. Persist to in-memory `appendAudit` and `rememberTransaction` as today, plus
   the new DB-level `jackpot_transactions` row written by the RPC.

### Idempotency
- Keep the in-memory `processedTransactions` cache.
- Add a DB-level `UNIQUE (brand_id, transaction_id)` on `jackpot_transactions`
  via migration. On unique-violation from the RPC, re-select the existing row
  and return its stored `response` jsonb with `idempotentReplay: true`.

## 2. New management routes

All routes use `requireInternalSecret` + `requireBrandId`, return `preflight()`
on OPTIONS, and JSON via the existing `json`/`errorJson` helpers. All store
calls already exist (`createGroup`, `listGroups`, `getGroup`, `setGroupStatus`,
`addChildJackpot`) — only one new helper (`updateGroupProfile`) is needed.

### `src/routes/api/v1/jackpot-groups/index.ts`
- `GET` → `listGroups(brand)`.
- `POST` → validates `{ name: string, overlappingRule?: "split"|"additive" }`
  with Zod, calls `createGroup(brand, name, overlappingRule)`. Returns 201.

### `src/routes/api/v1/jackpot-groups/$id.ts`
- `GET` → `getGroup(params.id)`; 404 if missing; 403 if brand mismatch.
- `PATCH` → validates `{ name?, overlappingRule? }`. Calls new
  `updateGroupProfile(id, patch)` in store; that helper first reads status and
  throws `GroupConflictError` (mapped to 409) when status === `active`. The DB
  trigger `jackpot_groups_guard` is the backstop.

### `src/routes/api/v1/jackpot-groups/$id/status.ts`
- `POST` → body `{ status: "draft"|"active"|"disabled" }`. Calls
  `setGroupStatus(id, status)`. `GroupConflictError` → 409. 404 if missing.
  Trigger enforces the legal transition matrix; route just surfaces errors.

### `src/routes/api/v1/jackpot-groups/$id/children.ts`
- `GET` → returns `getGroup(id).children` (404 if group missing).
- `POST` → body `{ jackpotId: number, tierRank: number }`. Calls
  `addChildJackpot(id, jackpotId, tierRank)`. `GroupConflictError` → 409.

## 3. Store additions (`src/lib/jackpot/store.server.ts`)

- `getGroupForBet(groupId, brandId)` — joins group + enabled children + brand
  check in one call, returns `{ group, children[] }` or throws.
- `updateGroupProfile(id, { name?, overlappingRule? })` — status-gated edit
  helper for the PATCH route.
- `recordGroupTransaction(...)` — thin wrapper around the RPC for the bet
  route; on `23505` unique violation, re-reads and returns the existing row.

## 4. Database migration

Single migration adds:
- `CREATE UNIQUE INDEX jackpot_transactions_brand_tx_uq ON jackpot_transactions (brand_id, transaction_id);`
- `apply_group_bet(p_payload jsonb)` PL/pgSQL function (`SECURITY DEFINER`,
  `search_path = public`) that performs the atomic pool updates + transaction
  insert + returns the row. All work inside the function body runs in a single
  implicit transaction.

## Out of scope

- Frontend admin UI for groups (separate phase).
- Migrating the existing `MULTI_LEVEL` single-jackpot legacy branch into the
  group model — kept untouched for backward compatibility.
- Cross-Worker idempotency beyond what the DB unique index now provides.

## Technical notes

- The Supabase JS client has no client-side `BEGIN/COMMIT`; atomicity is
  achieved by pushing all writes into the `apply_group_bet` RPC. This is the
  standard pattern on this stack.
- `truncate6` is floor-based (truncate, not round) to match the user's
  "truncate down to 6 decimals" requirement and prevent any rounding-up drift
  that could over-credit pools.
- Response contract: the only additive fields on the response are `groupId`
  and `routingMode`. All existing keys (`perJackpot`, `contribution`, `win`,
  `tierBreakdown`) keep their shape so downstream consumers don't break.
