# Fix: Sandbox demo can't find any jackpot

## What's broken

The `/sandbox-demo` page polls `/api/v1/jackpots` every 2 seconds but every request comes back `400 Missing required 'brandId' header`. As a result the active jackpot stays `null` and the widget shows "Awaiting jackpot…" forever.

## Root cause

Header name mismatch:

- `src/routes/sandbox-demo.tsx` sends `x-brand-id` (the convention used elsewhere in the app).
- `src/lib/jackpot/http.ts` `requireBrandId()` only reads `brandId` / `brandid`.

The rest of the v1 jackpot API (`/api/v1/jackpots`, `/$id`, `/enable.$id`, `/disable.$id`, `/topup`, `/event/bet`, `/event/simulate-bet`) all funnel through `requireBrandId`, so the same demo page will also fail on Spin / Force Win.

## Fix (one small change)

Update `requireBrandId` in `src/lib/jackpot/http.ts` to also accept `x-brand-id`:

```ts
const brandId =
  request.headers.get("x-brand-id") ??
  request.headers.get("brandId") ??
  request.headers.get("brandid");
```

Also add `x-brand-id` to the `Access-Control-Allow-Headers` list in `CORS_HEADERS` so browsers don't strip it on preflight.

No client-side changes needed — the demo page already stores the brand id in `localStorage` and forwards it as `x-brand-id`, matching the rest of the app.

## Verification

1. On `/sandbox-demo`, enter the same brand id used when creating the jackpot.
2. Within ~2s the widget header should show the live pool amount and the panel should show the active jackpot's name/id.
3. Clicking "Trigger Game Spin" should return a 200 and populate the Ledger Split row.
4. Toggling "Force Jackpot Win" and spinning should trigger the celebration state with the confetti burst.
