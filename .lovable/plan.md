# Phase 2 — Internal Zero-Trust Security Filter

Add a simulated private-VPC handshake to the S2S ingestion endpoint while leaving public read paths (widget tickers, jackpot listings) untouched. Scope is intentionally narrow: only the two files called out in the brief change.

## Approach

Introduce a small `requireInternalSecret(request)` helper in `src/lib/jackpot/http.ts` (same pattern as the existing `requireBrandId` — call at the top of a handler, bail if it returns a `Response`). It validates either:

- `Authorization: Bearer <secret>`, or
- `X-Internal-Service-Secret: <secret>`

…against `process.env.INTERNAL_SERVICE_SECRET`. Mismatch / missing / malformed → structured `403 Forbidden` JSON. No global middleware, no changes to public routes, no changes to the simulator or creator form.

The shared secret is stored as a Lovable Cloud runtime secret (`INTERNAL_SERVICE_SECRET`). Requested via `add_secret` before the code change ships.

## Files to touch

- `src/lib/jackpot/http.ts` — add `requireInternalSecret()`; extend `CORS_HEADERS["Access-Control-Allow-Headers"]` with `X-Internal-Service-Secret` so sandbox preflights pass.
- `src/routes/api/v1/event/bet.ts` — call the helper at the top of `POST`, before brand check / JSON parse / idempotency cache.
- `src/routes/sandbox-demo.tsx` — extend the existing S2S Tester panel with the authorization mode toggle and surface the handshake outcome visually.

Explicitly **not** touched: `simulate.ts`, `simulate-bet.ts`, `/jackpots/*`, the widget ticker reads, the creator form, the ledger, the simulator engine.

## Technical detail

### 1. Shared helper (`src/lib/jackpot/http.ts`)

```ts
export function requireInternalSecret(request: Request): Response | null {
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  if (!expected) {
    return json(
      {
        error: "Service misconfigured",
        code: "INTERNAL_SECRET_NOT_SET",
        message: "INTERNAL_SERVICE_SECRET is not configured on this environment.",
        status: 503,
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const direct = request.headers.get("x-internal-service-secret") ?? "";
  const provided = bearer || direct;

  if (!provided) {
    return json(
      {
        error: "Forbidden",
        code: "INTERNAL_HANDSHAKE_MISSING",
        message:
          "Internal VPC handshake required. Provide Authorization: Bearer <secret> " +
          "or X-Internal-Service-Secret.",
        status: 403,
      },
      { status: 403 },
    );
  }
  if (provided !== expected) {
    return json(
      {
        error: "Forbidden",
        code: "INTERNAL_HANDSHAKE_INVALID",
        message: "Internal service secret did not match the expected VPC credential.",
        status: 403,
      },
      { status: 403 },
    );
  }
  return null;
}
```

### 2. Wire into `bet.ts`

At the top of the `POST` handler, before `requireBrandId`:

```ts
const blocked = requireInternalSecret(request);
if (blocked) return blocked;
```

Idempotency cache is only touched after the handshake passes, so unauthorized replays cannot poison it.

### 3. Sandbox S2S Tester additions (`sandbox-demo.tsx`)

Inside the existing S2S Tester `<details>` panel, add a "VPC Handshake" subsection:

- `<RadioGroup>` with three modes, default `"authorized"`:
  - `"authorized"` — "Authorized (send valid internal secret)"
  - `"rogue"` — "Unauthorized (send rogue / corrupted token)"
  - `"omitted"` — "Unauthorized (omit token entirely)"
- Text input for the valid secret value (operator pastes the same string that's stored in Cloud secrets; persisted via `useState` per session, never logged).
- Help text linking the operator to the backend secrets panel.

Outgoing `fetch` for `/api/v1/event/bet`:
- `authorized` → `Authorization: Bearer <pasted value>`
- `rogue` → `Authorization: Bearer rogue-${crypto.randomUUID()}`
- `omitted` → no auth header

### 4. Telemetry visuals

Render a handshake status block in the response preview, driven off `response.status` + `response.code`:

| Outcome | Badge | Toast |
|---|---|---|
| 200 (authorized) | green `🔒 SECURE VPC PASSTHROUGH` | `toast.success("Internal handshake verified.")` once per session |
| 403 `INTERNAL_HANDSHAKE_MISSING` / `INVALID` | red, pulsing `⚠️ ACCESS BLOCKED (403)` + sub-line with the returned `code` | `toast.error("VPC handshake rejected — request blocked.")` |
| 503 `INTERNAL_SECRET_NOT_SET` | amber `VPC SECRET NOT CONFIGURED` | `toast.error` pointing to backend secrets |

Existing `idempotentReplay` and `rngSource` badges remain.

## Secret provisioning

Before code lands, request `INTERNAL_SERVICE_SECRET` via `add_secret`. The sandbox token input starts empty; the operator pastes the same value to exercise the authorized path.

## Out of scope

- Real mTLS / IP allow-listing (this is a simulated handshake).
- Per-caller key rotation, HMAC request signing, replay-window enforcement.
- Auth on `GET` read endpoints — intentionally public per the brief.
- Rate limiting (separate phase).
