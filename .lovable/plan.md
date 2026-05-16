## Goal

Add a **Save** button next to the **← Back to Editor** button on the Simulator page (`/admin/simulator`) so users can persist the jackpot without round-tripping through the creation form.

## Scope

Only shows when the simulator was opened from the Jackpot Creation / Edit flow (i.e. `originalPayloadRef.current` exists). Same visibility rule as the existing Back button.

## Changes

### `src/routes/admin.simulator.tsx`

1. Add `saving` state and `handleSave` that mirrors `admin.jackpots.new.tsx`:
   - Validate `payload.name` and `brandId` (toast errors).
   - Build the same body shape (`buildTriggerCondition`, `contributionRate`, `seedAmount`, etc.) — extract `buildTriggerCondition` into a shared helper at `src/lib/jackpot/build-create-body.ts` and import it from both the simulator route and `admin.jackpots.new.tsx` to avoid duplication.
   - `POST /api/v1/jackpots` with `brandId` header.
   - On success: toast "Jackpot created" and `navigate({ to: "/admin/jackpots" })`.
   - On error: toast the message.

2. Render a new primary-styled **Save Jackpot** button immediately before the existing Back button inside the `cameFromCreationFlow` block (so they sit side by side). Disable while `saving` or `loading`. Keep the inline-style aesthetic of the surrounding buttons.

3. Source of truth for save = `originalPayloadRef.current` (the form payload), **not** the editable JSON textarea — the create API consumes the form payload shape, not `JackpotConfigDTO`.

### `src/lib/jackpot/build-create-body.ts` (new)

Export `buildTriggerCondition(payload)` and a `buildCreateBody(payload)` helper returning `{ name, enabled, contributionRate, seedAmount, poolBalance, triggerThreshold, volatility, jackpotType, config }`. Update `admin.jackpots.new.tsx` to import from it.

## Out of scope

- Editing the JSON in the simulator does not affect what gets saved (the JSON is a simulation-only override).
- No edit/update endpoint — only create, matching current behavior.
