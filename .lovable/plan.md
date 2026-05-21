# Phase 2 — Internal Zero-Trust Security Filter

Simulate a private-VPC handshake on transactional write endpoints while keeping public read endpoints (widget tickers, jackpot listings) open.

## Approach

Add a single shared middleware-style helper, `requireInternalSecret(request)`, in `src/lib/jackpot/http.ts`. It checks an `X-Internal-Token` header against `process.env.INTERNAL_VPC_SECRET` and returns a structured `403 Forbidden` response when it does not match. We reuse the existing `requireBrandId` pattern (call at the top of a handler, bail if a `Response` comes back) so no global middleware wiring is needed and public routes stay untouched.

The shared secret is stored as a Lovable Cloud runtime secret (`INTERNAL_VPC_SECRET`) — requested via `add_secret` before the code change ships.

## Files to touch

- `src/lib/jackpot/http.ts` — add `requireInternalSecret()` + extend `CORS_HEADERS` to allow the `X-Internal-Token` header on preflight.
- `src/routes/api/v1/event/bet.ts` — gate the `POST` handler (idempotency check runs only after the handshake passes).
- `src/routes/api/v1/event/simulate-bet.ts` — gate `POST` (forced-win / deterministic RNG drops).
- `src/routes/api/v1/jackpots/topup.ts` — gate `POST` (pool write).
- `src/routes/api/v1/jackpots/enable.$id.ts`, `disable.$id.ts` — gate `POST` (campaign state writes).
- `src/routes/sandbox-demo.tsx` — extend the S2S Tester panel with an Authorization toggle + token field; surface success/failure visually.

Public/read endpoints stay open and are explicitly **not** modified: `GET /api/v1/jackpots`, `GET /api/v1/jackpots/$id`, `GET /api/v2/jackpots`, `OPTIONS *`, and the public widget/ticker reads.

## Technical detail

### 1. Shared helper

```ts
// src/lib/jackpot/http.ts
export function requireInternalSecret(request: Request): Response | null {
  const expected = process.env.INTERNAL_VPC_SECRET;
  if (!expected) {
    return errorJson(
      "Internal VPC secret is not configured on this environment",
      503,
    );
  }
  const provided = request.headers.get("x-internal-token");
  if (!provided || provided !== expected) {
    return json(
      {
        error: "Forbidden",
        code: "INTERNAL_HANDSHAKE_FAILED",
        message:
          "This endpoint is restricted to internal VPC callers. " +
          "A valid X-Internal-Token header is required.",
        status: 403,
      },
      { status: 403 },
    );
  }
  return null;
}
```

Usage at the top of each protected handler, before any work:

```ts
const blocked = requireInternalSecret(request);
if (blocked) return blocked;
```

Order in `bet.ts`: brand check → internal secret check → JSON parse → idempotency cache → ledger. The idempotency cache is only touched on authorized calls, so unauthorized replays cannot poison it.

`CORS_HEADERS["Access-Control-Allow-Headers"]` gains `X-Internal-Token` so the sandbox preflight succeeds.

### 2. Sandbox S2S Tester additions

In `/sandbox-demo`, inside the existing S2S Tester `<details>` panel, add:

- `<Switch>` "Send internal VPC token" (default ON).
- Text input for the token value (default to a placeholder like `"set-in-cloud-secrets"`; remembered per session via `useState`).
- When the toggle is ON, the `fetch` call to `/api/v1/event/bet` sends `X-Internal-Token: <value>`. When OFF, the header is omitted so the operator can reproduce a real blocked call.

UI feedback on response:
- HTTP 403 with `code: "INTERNAL_HANDSHAKE_FAILED"` → red `<Badge variant="destructive">HANDSHAKE BLOCKED (403)</Badge>` next to the response panel + `toast.error("Internal handshake rejected — request blocked at the VPC boundary.")`.
- HTTP 200 with the token present → green badge `HANDSHAKE OK` + subtle `toast.success("Internal handshake verified.")` (only on the first authorized call per session to avoid noise).
- HTTP 503 (secret not configured) → amber badge `VPC SECRET NOT CONFIGURED` + actionable toast pointing the user to backend secrets.

The existing `idempotentReplay` / `rngSource` badges remain.

### 3. Secret provisioning

Before the implementation lands, request `INTERNAL_VPC_SECRET` via `add_secret`. The sandbox token field defaults to empty; the operator pastes the same value locally to exercise the authorized path. Documented inline in the S2S Tester panel with a one-liner help text.

## Out of scope

- Real mTLS / IP allow-listing (this is a simulated handshake for the sandbox).
- Per-caller key rotation, HMAC request signing, replay-window enforcement.
- Auth on `GET` read endpoints — intentionally public per the brief.
- Rate limiting (separate phase).
