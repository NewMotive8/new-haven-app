# Fix Simulator: Lost Payload + JSON Mapping Drift

## What you're seeing

The JSON in the textarea is **literally `DEFAULT_CONFIG`** from `src/routes/admin.simulator.tsx` (lines 11–29). Same id, same "Demo Jackpot" name, same hardcoded 1000/500/2/1. That means `incoming?.jackpotConfig` was `undefined` on mount — your editor inputs never reached the simulator.

That **also** explains the missing buttons: `cameFromCreationFlow = Boolean(originalPayloadRef.current)` evaluated to `false`, so **Save Jackpot** and **← Back to Editor** are hidden (they only render when a payload was handed in).

## Root cause

The editor navigates with TanStack Router history state:

```ts
navigate({ to: '/admin/simulator', state: (prev) => ({ ...prev, jackpotConfig: payload }) })
```

History state is held in `window.history.state` and is lost on:
- a hard refresh of `/admin/simulator`
- opening the route in a new tab
- any navigation that doesn't go through the editor's "Continue" button

When that happens the simulator falls back to `DEFAULT_CONFIG`, the buttons vanish, and the JSON looks unrelated to your inputs.

## The fix — two parts

### Part A — Persist the payload so it survives refresh

In `JackpotCreationForm.tsx` (~line 504), right before `navigate(...)`:

```ts
sessionStorage.setItem('jackpot:pendingPayload', JSON.stringify(payload));
```

In `src/routes/admin.simulator.tsx`, hydrate `originalPayloadRef` from both sources:

```ts
const stored = typeof window !== 'undefined'
  ? sessionStorage.getItem('jackpot:pendingPayload')
  : null;
const hydrated = incoming?.jackpotConfig
  ?? (stored ? JSON.parse(stored) as JackpotSavePayload : undefined);
const originalPayloadRef = React.useRef<JackpotSavePayload | undefined>(hydrated);
```

Clear it after a successful save (inside `handleSave` on success):

```ts
sessionStorage.removeItem('jackpot:pendingPayload');
```

Result: refresh-safe payload, **Save Jackpot** and **← Back to Editor** buttons stay visible across reloads.

### Part B — Fix `payload-to-config.ts` mapping bugs

Reviewing `mapPayloadToConfig` against the JSON shape you'd expect, two real bugs and one omission:

1. **`baseSeed.currentAmount` is wrong.** Line 103 currently sets it to `seedContributionAmount` — i.e. the *per-bet contribution rate* (e.g. `1`). It should be the seed pot's **initial balance**. Map it from `payload.seedInitialAmount` (or fall back to `reseed` so the seed pot starts funded), not from the contribution rate.

2. **`basePool.maximumAmount` is hardcoded to `0`.** Map it from `payload.maximumPoolAmount` (or whichever cap field the form exposes) so the JSON reflects the editor's max-pool input instead of always reading `0`.

3. **`baseSeed.targetAmount` is `avgWin`.** That's the *jackpot win target*, not the seed-refill target. Map it from `payload.seedTargetAmount` (with `avgWin` as the fallback only).

After Part B, the JSON for a Classic jackpot will read like:

```json
"pool":  { "currentAmount": <initialPoolAmount>, "minimumAmount": <reseed>, "maximumAmount": <maxPool>, ... },
"seed":  { "currentAmount": <seedInitial ?? reseed>, "targetAmount": <seedTarget ?? avgWin>, "contributionAmount": <seedContribRate>, ... }
```

— a true round-trip of what you typed in the editor, not the demo placeholder.

## Files touched

- `src/components/jackpot/JackpotCreationForm.tsx` — write `sessionStorage` before `navigate(...)`.
- `src/routes/admin.simulator.tsx` — hydrate from `sessionStorage` fallback; clear on save.
- `src/lib/jackpot/payload-to-config.ts` — fix `baseSeed.currentAmount`, `baseSeed.targetAmount`, `basePool.maximumAmount`.

## Open questions before I build

1. Do you want me to verify the **exact field names** on `JackpotSavePayload` for `seedInitialAmount`, `seedTargetAmount`, and `maximumPoolAmount` before mapping? (If they're named differently in your form state I'll wire whatever the editor actually writes.)
2. Should the `sessionStorage` payload be cleared when you click **← Back to Editor** as well, or only after a successful Save?
