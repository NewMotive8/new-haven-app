## Problem

`/demo` → QA Overlay → SPIN calls `POST /api/v1/event/bet` directly from the browser. That route is gated by `requireInternalSecret` (`src/lib/jackpot/http.ts`), which requires `Authorization: Bearer <INTERNAL_SERVICE_SECRET>` or `X-Internal-Service-Secret`. The browser sends no header → 403 `INTERNAL_HANDSHAKE_MISSING`.

`INTERNAL_SERVICE_SECRET` is configured as a server-side runtime secret. **It must never be shipped to the client bundle** — that defeats the zero-trust gate and exposes the secret on the public preview/published URL. So "hard-code it in the page" is off the table.

## Recommendation: Option A — Server-side proxy via `createServerFn`

Create a TanStack server function `placeDemoBet` that runs in the worker, reads `process.env.INTERNAL_SERVICE_SECRET`, and forwards the payload to the existing bet route with the Bearer header attached. The `/demo` overlay calls the server fn instead of `fetch("/api/v1/event/bet")`.

**Files:**
- New: `src/lib/demo/bet.functions.ts`
  - `placeDemoBet = createServerFn({ method: "POST" }).inputValidator(z.object({...bet payload...})).handler(async ({ data }) => { ... })`
  - Handler builds an absolute URL via `getRequestHost()` + protocol, POSTs to `/api/v1/event/bet` with `Authorization: Bearer ${process.env.INTERNAL_SERVICE_SECRET}`, returns parsed JSON (or rethrows status/code/message so the UI keeps showing the same error envelope).
- Edit: `src/components/demo/QaOverlay.tsx`
  - Replace the `fetch("/api/v1/event/bet", ...)` block with `await placeDemoBet({ data: payload })` via `useServerFn`. Keep the existing response/error handling shape (`contribution`, `perJackpot`, `win`, `code`, `message`).
- No edits to `src/lib/jackpot/*`, `src/routes/api/v1/event/bet.ts`, `src/routes/sandbox-demo.tsx`, or DB.

**Why this is correct here:**
- Secret stays on the server.
- `/demo` keeps simulating a "real operator site" — the operator's backend (here: the server fn) holds the credential.
- Zero impact on the engineering sandbox.

## Option B — Secret input in the overlay (mirror sandbox-demo)

Add a small "Internal Secret" text input + Auth Mode toggle to `QaOverlay`, persist to `sessionStorage`, and send it as `Authorization: Bearer …` from the browser on every spin. Same UX as `/sandbox-demo`.

Trade-off: secret lives in the operator's browser session. Fine for an internal-only QA harness behind login; **not** appropriate if `/demo` is publicly reachable.

## Option C — NOT recommended

Hard-coding `INTERNAL_SERVICE_SECRET` in `QaOverlay.tsx` or wiring it via `VITE_*`. Vite inlines it into the public JS bundle → any visitor of the preview/published URL can read it and bypass the VPC gate from anywhere. Do not do this.

## Question for you

Pick A or B and I'll implement it in build mode. Default if you don't say: **A**.
