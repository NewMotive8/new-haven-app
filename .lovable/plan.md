# Fix: "Continue to tier allocation" appears broken

## What's actually happening

The button is wired correctly and the click does fire a request to
`POST /api/v1/jackpot-groups`. Dev-server logs show the request reaches the
server every time, but it always fails with the same Postgres error:

```
Error: duplicate key value violates unique constraint "jackpot_groups_brand_name_uniq"
    at async POST (src/routes/api/v1/jackpot-groups/index.ts:52:21)
```

The name the user is typing (or its default) was already saved to the
database in an earlier attempt, so the unique `(brand_id, name)` constraint
rejects every retry. Because the route handler doesn't catch this error, it
bubbles up as an unhandled 500 with no JSON body. The client `toast.error`
falls back to a generic message and the wizard stays on step 1 — making the
button look dead.

The earlier "crash" was the same root cause (uncaught 500 from the DB), plus
one dev-server exit (`code 143`) during HMR.

## Fix

Two small, surgical changes — no business logic touched.

### 1. Return a friendly 409 on duplicate name

`src/routes/api/v1/jackpot-groups/index.ts` — wrap the `createGroup` call in
the POST handler in a try/catch. When the Postgres error code is `23505`
(unique violation) or the message includes
`jackpot_groups_brand_name_uniq`, return:

```
409 { "error": "A MultiJackpot named \"<name>\" already exists for this brand. Pick a different name." }
```

Re-throw anything else so it still hits the global error handler.

### 2. Surface the server message in the wizard

`src/components/jackpot/MultiJackpotWizard.tsx` — `handleCreateGroup`
already reads `err.response.data.error`, so once (1) lands the toast will
show the duplicate-name message. No extra client work needed beyond
confirming the toast appears (the project already uses `sonner` here).

## Out of scope

- No schema change. The unique constraint is correct.
- No change to step 2 / tier allocation logic.
- No change to `createGroup` itself; only the route adapter translates the
  DB error into a clean HTTP response.

## Verification

1. On `/admin/jackpots/new` → MultiJackpot tab, enter a name that already
   exists → click "Continue to tier allocation" → toast shows the
   duplicate-name message, button is enabled again.
2. Enter a fresh name → click the button → wizard advances to step 2.
