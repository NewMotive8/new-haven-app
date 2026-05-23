
## Goal

Build a vitest-based security and contract audit suite for `src/routes/api/v1/event/bet.ts` that exercises the real Lovable Cloud (Supabase) dev backend. All probes target an isolated namespace (`brandId: 999999`) so production data is never touched, and every test cleans up after itself.

## 1. Phase 0 — Tooling and layout

Install dev dependencies (no runtime impact):

```
bun add -d vitest @vitest/ui tsx dotenv
```

Add `vitest.config.ts` at project root:
- `test.include = ["tests/audit/**/*.test.ts"]`
- `test.environment = "node"`
- `test.fileParallelism = false` and `poolOptions.threads.singleThread = true` — serial execution so DB locks and `FOR UPDATE` semantics are observable
- `test.hookTimeout = 30_000`, `test.testTimeout = 30_000`
- `test.setupFiles = ["tests/audit/setup.ts"]`

Add scripts to `package.json`:
- `"test:audit": "vitest run --config vitest.config.ts"`
- `"test:audit:watch": "vitest --config vitest.config.ts"`

Directory tree:

```text
tests/
  audit/
    setup.ts                  # loads .env, exports BASE_URL + secrets, sanity-checks them
    helpers/
      http.ts                 # signed/unsigned POST helpers, HMAC computer
      cleanup.ts              # purges TEST_BRAND_ID rows across all jackpot tables
      fixtures.ts             # seeds a draft group + jackpot for TEST_BRAND_ID, activates it
    auth/
      bearer.test.ts          # Bearer probes
      hmac.test.ts            # HMAC signature probes
      brand-header.test.ts    # brandId header probes
    contract/
      schema-fuzz.test.ts     # malformed body, unknown gameId
    idempotency/
      replay.test.ts          # duplicate transactionId → duplicate_ignored
```

## 2. Target environment

- Base URL: dev preview host (`https://id-preview--<project-id>.lovable.app`) read from env `AUDIT_BASE_URL`, with a `tests/audit/setup.ts` fallback to the known preview URL.
- `INTERNAL_SERVICE_SECRET` and `OPERATOR_HMAC_SECRET_DEFAULT` are pulled from `process.env` (already configured in Lovable Cloud secrets — confirmed present).
- `TEST_BRAND_ID = 999999` is hardcoded as the isolation namespace. No probe ever sends a different brandId.

## 3. Fixture lifecycle (setup / teardown)

Run as `beforeAll` / `afterAll` at the suite root via `tests/audit/helpers/fixtures.ts`. Uses a thin admin-only server route added under `src/routes/api/public/_audit/` that is gated by the `INTERNAL_SERVICE_SECRET` bearer (no public exposure):

- `POST /api/public/_audit/seed` — creates a `jackpot_groups` row (status `draft` → flipped to `active`), one `jackpots` row linked to it, plus `jackpot_pools` and `jackpot_seeds` entries. All rows tagged `brand_id = 999999`. Returns `{ groupId, jackpotId, gameId }`.
- `POST /api/public/_audit/teardown` — deletes (in FK-safe order) `jackpot_wins`, `jackpot_transactions`, `jackpot_pools`, `jackpot_seeds`, `jackpots`, `jackpot_groups` and any `admin_audit_log` rows where `brand_id = 999999`. Append-only trigger on `admin_audit_log` blocks DELETE; teardown will `INSERT` a compensating "audit_reset" row instead and leave historical rows in place (test asserts the trigger fired).

Both routes use `supabaseAdmin` and require `Authorization: Bearer ${INTERNAL_SERVICE_SECRET}` — same secret the production route enforces. They live under `/api/public/_audit/` only so they bypass page-auth; the bearer is the actual gate.

## 4. Probe matrix (acceptance criteria)

All probes POST to `/api/v1/event/bet`. Each spec includes setup that ensures the isolated brand fixture exists.

### 4.1 Bearer auth (`auth/bearer.test.ts`)
- No `Authorization` header → **403 `INTERNAL_HANDSHAKE_MISSING`**.
- `Authorization: Bearer wrong-secret` → **403 `INTERNAL_HANDSHAKE_INVALID`**.
- `X-Internal-Service-Secret: <correct>` (header variant) + valid body → **200**.

### 4.2 HMAC signatures (`auth/hmac.test.ts`)
- Valid bearer + `X-Operator-Signature` correctly computed over raw body → **200**.
- Valid bearer + signature computed over a tampered body (mutate one byte after signing) → **403 `OPERATOR_SIGNATURE_INVALID`**.
- Valid bearer + `X-Operator-Signature: sha256=deadbeef...` → **403 `OPERATOR_SIGNATURE_INVALID`**.
- Valid bearer, no signature header → **200** (header is optional, back-compat preserved).

### 4.3 Brand header (`auth/brand-header.test.ts`)
- Missing `x-brand-id` and missing `brandId` → **400** "Missing required 'brandId' header".
- `x-brand-id: 999999` accepted; `brandId: 999999` accepted; case-insensitive variant accepted (covered by parametrized cases).

### 4.4 Schema fuzzing (`contract/schema-fuzz.test.ts`)
- Empty body `{}` → **400** with Zod field paths.
- `wagerAmount: -5` → **400**.
- `currency: "not-a-currency!"` → **400**.
- `gameId: "non-existent-game-xyz"` (no other routing fields) → **404 `NO_ACTIVE_GROUP_FOR_GAME`**.
- Conflicting routing (`groupId` AND `jackpotId`) → **400** (existing superRefine).

### 4.5 Idempotency (`idempotency/replay.test.ts`)
- POST a valid payload with `transactionId: "audit-${uuid}"` → **200**, capture response.
- Immediately replay the identical payload → **200** with `status: "duplicate_ignored"` and `idempotentReplay: true`.
- Assert: only one row in `jackpot_transactions` for that `transaction_id`, and `jackpot_pools.current_balance` reflects exactly one application of the delta (verified via `supabase--read_query` from inside the cleanup helper).

## 5. Reporting

Vitest's default reporter is sufficient. Add `--reporter=verbose` in CI invocation so each probe's pass/fail is visible. Final test summary maps directly to the five categories above and is what gets reported back per the user's "pass/fail results" request.

## 6. Files touched

- `package.json` — add 2 scripts, 4 devDependencies.
- `vitest.config.ts` — new.
- `tests/audit/**` — new (setup, helpers, 5 spec files).
- `src/routes/api/public/_audit/seed.ts` — new, bearer-gated fixture seeder.
- `src/routes/api/public/_audit/teardown.ts` — new, bearer-gated fixture purger.

No changes to `src/routes/api/v1/event/bet.ts`, `src/lib/jackpot/*`, or any database schema. The audit route is read/write only against `brand_id = 999999`.

## 7. Out of scope

- No edits to production probe target (`bet.ts`) or RPCs (`apply_group_bet`).
- No load/perf testing — functional + security only.
- No CI workflow file — `bun run test:audit` is the entry point; CI wiring is a follow-up.

## 8. Verification after build

1. `bun run test:audit` from project root.
2. Expect: 5 spec files, ~15 assertions, all green.
3. Inspect `jackpot_transactions` and `admin_audit_log` via `supabase--read_query` filtered to `brand_id = 999999` to confirm only audit-tagged rows exist and that the append-only trigger blocked any DELETE attempt during teardown.
