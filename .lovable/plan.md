## Goal

Extend `POST /api/v1/event/bet` and the persisted ledger to accept an open-ended `attributes` object for **any vertical** — sportsbook (betType, sport, league, matchId, selections), casino (gameCategory, provider, gameSubtype, rtp), and channel/context (device, platform, clientType: native_app / desktop / mobile_web / tablet, geo, sessionId, VIP tier, etc.). One generic bag, no per-vertical hardcoding.

## 1. API contract — additive, fully back-compat

Extend `BetEventSchema` in `src/routes/api/v1/event/bet.ts` with one new optional field:

- `attributes`: `Record<string, JSON>` — arbitrary nested object of strings, numbers, booleans, arrays, or nested objects. Optional. Existing payloads remain valid.

Validation (defense-in-depth, not business rules):
- Must be a plain JSON object (reject arrays, primitives, `null`).
- Serialized size ≤ 8 KB.
- Max nesting depth 6, max 200 keys total (recursive count).
- Key regex: `^[A-Za-z0-9_.:-]{1,64}$`.
- Leaf scalars: string ≤ 1024 chars, finite numbers, booleans. Arrays ≤ 100 items.

Implemented as a `zJsonAttributes` Zod helper (`z.record(z.string(), z.unknown())` + `superRefine` walking depth/size/keys/leaves) so callers get precise field paths on rejection.

Existing first-class fields (`gameId`, `playerId`, `currency`, `playerSegments`, `timestamp`, routing hints) stay strict — they're indexed/queried. Everything else — sports tags, casino tags, device, platform — lives inside `attributes`.

Example payloads the gateway must accept:

```json
// Casino
{ "transactionId": "...", "wagerAmount": 1, "currency": "EUR", "gameId": "g-42",
  "attributes": { "vertical": "casino", "gameCategory": "Slots",
    "provider": "Pragmatic", "device": "mobile_web", "platform": "iOS",
    "vipTier": "GOLD" } }

// Sportsbook
{ "transactionId": "...", "wagerAmount": 5, "currency": "EUR", "gameId": "sb-soccer",
  "attributes": { "vertical": "sports", "betType": "LIVE", "sport": "SOCCER",
    "league": "UEFA_CL", "matchId": "m-9931",
    "selections": [{ "marketId": "1x2", "odds": 2.15, "pick": "HOME" }],
    "device": "native_app", "platform": "Android" } }
```

## 2. Persistence — JSONB column on the ledger

Migration adds a nullable `attributes JSONB` column to `public.jackpot_transactions`:

- `ALTER TABLE public.jackpot_transactions ADD COLUMN attributes JSONB;`
- Partial GIN index: `CREATE INDEX IF NOT EXISTS idx_jackpot_transactions_attributes ON public.jackpot_transactions USING GIN (attributes) WHERE attributes IS NOT NULL;`
- No backfill (column nullable, historical rows = NULL).

Update `apply_group_bet(p_payload jsonb)` to read `p_payload->'attributes'` and write it into the `INSERT INTO public.jackpot_transactions` row (one extra column). Everything else untouched. RLS unchanged.

## 3. Route plumbing

In `src/routes/api/v1/event/bet.ts`:
- After Zod parse, pass `attributes: body.attributes ?? null` into the RPC payload built by `recordGroupTransaction` / `apply_group_bet`.
- Echo `attributes` back in the response envelope (next to `currency`, `operatorTimestamp`).
- Append `attributes` to the in-memory `AuditEntry` shape so `/api/v1/event/bet/ledger` exposes it.

No changes to RNG, idempotency, routing resolution, HMAC, or `computeMultiCampaignLedger`. `attributes` is pure passthrough metadata — never influences math or jackpot selection.

## 4. Tests

Add `tests/audit/contract/attributes.test.ts`:

1. **Casino payload** — `gameCategory`, `provider`, `device: "mobile_web"`, `platform: "iOS"`, `vipTier` → 200, response echoes, ledger persists verbatim.
2. **Sportsbook payload** — `betType`, `sport`, `league`, `matchId`, nested `selections` array → 200, same round-trip check.
3. **Channel-only payload** — `attributes: { device: "native_app", platform: "Android", sessionId: "..." }` → 200.
4. **No attributes** — back-compat smoke test, response shows `attributes: null`.
5. **Oversized** (>8 KB) → 400, error path includes `attributes`.
6. **Wrong type** (`attributes: [1,2,3]`, `attributes: "foo"`) → 400.
7. **Forbidden key** (`"bad key!": 1`) → 400 with offending path.
8. **Idempotent replay** of an attributes-bearing tx returns the original `attributes` from the DB (proves persistence, not just echo).

Extend `validBetPayload()` in `tests/audit/setup.ts` to optionally take an `attributes` override.

## 5. Files touched

- `supabase/migrations/<new>.sql` — add JSONB column, GIN index, update `apply_group_bet` to persist `attributes`.
- `src/routes/api/v1/event/bet.ts` — schema extension, response echo, audit entry field.
- `src/lib/jackpot/store.server.ts` — pass `attributes` through `recordGroupTransaction` payload; include in `findExistingTransaction` return.
- `tests/audit/setup.ts` — payload helper.
- `tests/audit/contract/attributes.test.ts` — new suite.

## 6. Out of scope

- No per-vertical schemas, no enums for `betType` / `gameCategory` / `device` — that's the whole point of the generic bag.
- No changes to jackpot math, RNG, HMAC, or group routing.
- No new tables; no changes to `jackpot_wins`, `admin_audit_log`, or `jackpot_pools`.
- Admin UI querying/filtering by `attributes` is a follow-up (GIN index is in place to support it).

## Verification

- Existing `bun run test:audit` matrix stays green (37 tests).
- New `attributes.test.ts` adds 8 passing cases covering both casino and sportsbook payloads.
- `psql` spot-check: `SELECT transaction_id, attributes FROM jackpot_transactions ORDER BY processed_at DESC LIMIT 5;` shows JSONB round-tripped exactly.
