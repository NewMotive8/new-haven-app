# Phase C — `/sandbox-demo` Widget Proof Page

A hidden TanStack route that embeds a faithful re-creation of the native player widget, polls the live jackpot pool, and wires real `/api/v1/event/bet` and `/api/v1/event/simulate-bet` calls into a "Casino Simulator Panel".

## What you'll see on the page

```text
┌─────────────────────────────────────────────────────────────┐
│  Sandbox Demo — Live Widget Proof              [hidden URL] │
├──────────────────────────────────┬──────────────────────────┤
│  #jooba-container-root           │  Casino Simulator Panel  │
│  ┌────────────────────────────┐  │  ────────────────────    │
│  │  jooba-widget              │  │  Active jackpot: …       │
│  │   header • current amount  │  │  Pool balance: € 12,345  │
│  │   body   • lottie media    │  │                          │
│  │   footer • Opt In / Out    │  │  [ Trigger Spin €1.00 ]  │
│  └────────────────────────────┘  │  [ ⚙ Force Jackpot Win ] │
│                                  │                          │
│                                  │  Last ledger split:      │
│                                  │  pool / seed / house     │
└──────────────────────────────────┴──────────────────────────┘
```

When a spin returns a win (or Force is on), the widget swaps into a celebration
state showing the exact `winMessage` from `texts.ts` and a confetti/lottie burst.

## Route

- New file: `src/routes/sandbox-demo.tsx`
- Path: `/sandbox-demo` (not linked from anywhere — "hidden" = unlisted, not auth-gated).
- No nav entry added; nothing changes in `__root.tsx` or admin layout.

## Widget embedding approach

The native widget under `src/Widget/` is a standalone rollup bundle with deep
runtime deps (`lottie`, `sockjs-client`, `StompJs`, CDN-loaded stylesheets,
`window.jooba`). Importing it into the TanStack SSR bundle would require
significant wiring and break in the Worker runtime.

Instead: a faithful **port** living entirely inside the route file (or a small
`src/components/sandbox/` folder) that reuses the exact DOM ids, class
structure, and `texts.ts` dictionary from the uploaded files. Same look, same
text, same `#jooba-container-root` host — but mounted client-side via
`useEffect` so there is one source of truth (this page) and no bundler risk.

The `texts` dictionary is copied verbatim so `winMessage`,
`optInButton`, `optOutButton`, etc. stay identical to the native widget.

## Data flow

1. **Pool polling** — every 2s: `GET /api/v1/jackpots` (with `brandId` header),
   pick the active jackpot, write `poolBalance` into `#jooba-widget-current-amount`.
   *Note:* the brief mentions `/api/v1/pools` — that endpoint does not exist in
   this project; `/api/v1/jackpots` is the live source for pool values. If you
   want a literal `/api/v1/pools` route added, say so and I'll add it.
2. **Trigger Spin €1.00** — `POST /api/v1/event/bet` with
   `{ jackpotId, wager: 1 }`. Response includes `contribution.{pool,seed,house}`
   and `tierBreakdown` — rendered under "Last ledger split".
3. **Force Jackpot Win toggle** — when on, the spin button instead hits
   `POST /api/v1/event/simulate-bet?externalRoll=1&wager=1&iterations=1` with
   the active jackpot's full `JackpotConfigDTO` in the body (built the same way
   `bet.ts` builds it via `inlineConfigFromDto`). `externalRoll=1` against the
   10M keyspace guarantees a hit.
4. **Win celebration** — when the response indicates a jackpot drop (bet route:
   future flag; simulate-bet: any `winners`/drop entry > 0), the widget body is
   replaced with a centered banner showing `texts.winMessage` plus a confetti
   burst (CSS-only, no extra deps).

## Brand / auth

`requireBrandId` rejects requests without an `x-brand-id` header. The page will
read the brand id from `localStorage` (same key the admin uses) with a
fallback input field at the top so a tester can paste one in. No new auth.

## Files touched

- `src/routes/sandbox-demo.tsx` — new route, component, polling + spin handlers.
- `src/components/sandbox/JoobaWidget.tsx` — ported DOM/text scaffold.
- `src/components/sandbox/texts.ts` — copy of the native dictionary.

No edits to existing routes, no edits to `src/Widget/`, no DB changes,
no new dependencies.

## Open questions

1. Confirm `/api/v1/jackpots` is the right source for the live pool value (vs.
   adding a literal `/api/v1/pools` endpoint).
2. Which jackpot should the demo target — the first enabled one, or a hardcoded
   id? Default: first `enabled === true` from the list.
3. OK to skip wiring real `lottie`/`sockjs` and use a lightweight CSS confetti
   for the win animation? (Keeps the page Worker-safe and dependency-free.)
