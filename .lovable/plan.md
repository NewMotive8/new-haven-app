## Goal

Refactor `src/routes/api/v1/event/bet.ts` into a production-grade B2B webhook gateway. Keep all jackpot math out of the route — it only authenticates, validates, deduplicates, resolves routing, and hands off to the atomic `apply_group_bet` RPC already in Postgres.

## 1. Dual-layer authentication

Run before reading the body:

1. **Bearer token** — reuse `requireInternalSecret(request)` (already checks `Authorization: Bearer <INTERNAL_SERVICE_SECRET>`). Return 401 on miss/mismatch.
2. **Brand header** — reuse `requireBrandId(request)`.
3. **Optional HMAC-SHA256** — only if `X-Operator-Signature` header is present:
   - Read raw body as text (must precede `JSON.parse`).
   - Compute `HMAC-SHA256(rawBody, OPERATOR_HMAC_SECRET_<brandId>)` using Web Crypto `crypto.subtle.importKey` + `sign`.
   - Compare hex digest with `timingSafeEqual`-style constant-time check.
   - Return 403 on mismatch or missing per-brand secret env var.
   - If header absent → skip (back-compat).

Add a new secret request via `add_secret` for `OPERATOR_HMAC_SECRET_DEFAULT` (single fallback) plus instructions for per-brand `OPERATOR_HMAC_SECRET_<BRAND_ID>`.

## 2. Schema (Zod) — back-compat preserving

Extend `BetEventSchema` with the new B2B fields as optional aliases, then normalize in a `transform`:

| New field | Type | Maps to internal |
|---|---|---|
| `transactionId` | string 1–128 | unchanged |
| `playerId` | string ≤128 | unchanged |
| `gameId` | string 1–128 | unchanged |
| `wagerAmount` | positive finite number | falls back to legacy `wager` |
| `currency` | string regex `/^[A-Z0-9_-]{3,16}$/` (ISO-3 + virtual tokens) | new, persisted in response |
| `timestamp` | ISO-8601 datetime string | new, persisted in response |

Legacy fields kept optional: `wager`, `groupId`, `jackpotId`, `config`, `configs`, `playerSegments`, `eventId`. `superRefine` continues to forbid multi-route conflicts. Return 400 with field paths on parse failure.

## 3. Idempotency — promote to DB-backed

Current in-memory Map is per-Worker and loses state on restart. Replace with a **two-tier** check:
1. Fast-path: in-memory `processedTransactions` Map (kept as best-effort cache).
2. Authoritative: `SELECT response FROM jackpot_transactions WHERE transaction_id = $1 AND brand_id = $2` via a new server-side helper in `store.server.ts`. If a row exists, short-circuit with HTTP 200 and `{ status: "duplicate_ignored", idempotentReplay: true, ...cachedResponse }`.

The existing `apply_group_bet` already inserts into `jackpot_transactions` with a unique `(brand_id, transaction_id)` constraint — the explicit pre-check just lets us return the original response without re-running win evaluation.

## 4. gameId → group resolution

New helper `resolveGroupForBet(brand, body)` in `store.server.ts`:

```
if body.groupId   → getGroupForBet(body.groupId, brand)           // sandbox/simulator path
elif body.jackpotId → lookup jackpot → use its group_id           // legacy path
elif body.gameId  → SELECT id FROM jackpot_groups
                    WHERE brand_id = $brand AND status = 'active'
                      AND $gameId = ANY(assigned_game_ids)
                    ORDER BY activated_at DESC LIMIT 1
else → 400 ROUTING_REQUIRED
```

Returns 404 `NO_ACTIVE_GROUP_FOR_GAME` when gameId lookup yields nothing. Multiple matches → take most recently activated (deterministic).

## 5. Architectural decoupling

Once group resolved, the existing branch is reused unchanged: build `configs` via `inlineConfigFromDto`, compute ledger via `computeMultiCampaignLedger`, evaluate wins via `secureRandomFloat` (RNG already GLI-12 compliant — no change), and hand off to `recordGroupTransaction` → `apply_group_bet` RPC. The route never touches `jackpot_pools` or `jackpot_wins` directly.

Response envelope adds `currency` and `operatorTimestamp` (echoed back) and standardizes status: `{ status: "ok" | "duplicate_ignored", ... }`.

## 6. Files touched

- `src/routes/api/v1/event/bet.ts` — auth layer, schema extension, idempotency pre-check, gameId routing, response envelope.
- `src/lib/jackpot/store.server.ts` — add `resolveGroupForBet(brand, body)` and `findExistingTransaction(brandId, transactionId)`.
- `src/lib/jackpot/http.ts` — add `verifyOperatorSignature(request, rawBody, brandId)` helper (Web Crypto, constant-time compare).
- `add_secret` request: `OPERATOR_HMAC_SECRET_DEFAULT` (single shared) + doc note for per-brand `OPERATOR_HMAC_SECRET_<id>`.

## 7. Out of scope (explicit)

- No changes to `apply_group_bet`, `jackpot_wins`, or `admin_audit_log` — they already satisfy GLI-12.
- Legacy single-jackpot path below the group branch is left intact (sandbox use).
- No new tables; idempotency leverages existing `jackpot_transactions` unique constraint.

## Verification

After build: hit the endpoint via curl with (a) missing bearer → 401, (b) bad HMAC → 403, (c) malformed body → 400, (d) duplicate `transactionId` → 200 + `duplicate_ignored`, (e) unknown `gameId` → 404, (f) valid payload → 200 + atomic commit visible in `jackpot_transactions`.
