# Fix: Simulator shows demo JSON + Back/Save buttons missing

## What you're seeing

After clicking "Test in Simulator" from the creation form:
- The JSON shows the built-in demo (`"contributionAmount": 2`,
  `"Demo Jackpot"`) instead of what you entered.
- The **Back to Editor** and **Save Jackpot** buttons no longer appear.

## Root cause (one bug, three symptoms)

The creation form hands the payload to the simulator through TanStack Router
navigation state:

```ts
// JackpotCreationForm.tsx
navigate({
  to: '/admin/simulator',
  state: { jackpotConfig: payload } as never,   // ← object form
});
```

The simulator reads it back with:

```ts
const incoming = useRouterState({
  select: (s) => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined,
});
```

In TanStack Router **v1.168+** (this project uses `^1.168.25`), the
`state` option on `navigate` is typed and processed as an **updater
function**, not a plain object. Passing a plain object silently drops the
custom keys and the simulator sees `state.jackpotConfig === undefined`.

When `incoming.jackpotConfig` is undefined:
1. `initialConfig` falls back to `DEFAULT_CONFIG` → the textarea shows
   `"Demo Jackpot"` with `contributionAmount: 2`.
2. `originalPayloadRef.current` is undefined → `cameFromCreationFlow` is
   `false` → "Back to Editor" and "Save Jackpot" buttons are hidden.

## Fix

Use the function form for `state` on both navigate calls.

**1. `src/components/jackpot/JackpotCreationForm.tsx` (line ~501)**

```ts
navigate({
  to: '/admin/simulator',
  state: (prev) => ({ ...prev, jackpotConfig: payload }),
});
```

**2. `src/routes/admin.simulator.tsx` (line ~287, "Back to Editor" button)**

```ts
navigate({
  to: '/admin/jackpots/new',
  state: (prev) => ({ ...prev, jackpotConfig: originalPayloadRef.current }),
});
```

That's the only change needed. Once the payload arrives:
- The textarea will render the mapped config derived from your real inputs
  (so `contributionAmount` will reflect the `0.15` you entered, allocated
  per pool/seed/house weights via the existing `splitAllocation` logic).
- `cameFromCreationFlow` becomes `true` → Back / Save buttons reappear.

## Out of scope

- Any change to `mapPayloadToConfig` or `splitAllocation` (already correct
  from the previous fix).
- Form UI, validation, or the DEFAULT_CONFIG sample (kept as the fallback
  when the simulator is opened directly from the sidebar).
