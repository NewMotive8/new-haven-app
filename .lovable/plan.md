## Goal

Replace "Save Jackpot" actions with a single bottom-right "Continue" button that validates, then navigates to `/backoffice/simulator` carrying the jackpot configuration. The simulator pre-populates its JSON config editor from that incoming state.

## 1. Form: swap action bars

File: `src/components/jackpot/JackpotCreationForm.tsx`

a. **Remove the universal Save bar** at the bottom (lines ~4071–4082, the block starting with the `Universal Save Bar` comment that renders `<Button>Cancel</Button>` + `Save Jackpot`).

b. **Update the per-type action bar** (currently the Classic-type bar at lines ~1762–1772 with Back + "Save Jackpot"). Keep the "Back" button on the left, replace "Save Jackpot" on the right with a "Continue" button that calls `handleContinue`. If other type branches (Must Drop, Multi-Level, Frequency) don't have their own action bar, add the same `Back` + `Continue` row at the end of each branch so every flow ends bottom-right with Continue.

c. **Replace `triggerSave` with `handleContinue`**:
   - Build the same payload `triggerSave` already constructs (the full `JackpotSavePayload`).
   - Validate: `name.trim()` required; for `multi_level` ensure at least one tier; for `frequency`/`must_drop` ensure a recurrence/payout interval is set. Show inline error via existing toast or a simple `setError` state next to the Continue button.
   - On success, call `navigate({ to: '/backoffice/simulator', state: { jackpotConfig: payload } })` (TanStack Router `useNavigate` supports `state`). No DB write here.
   - Drop the `onSave` / `submitting` props from the call site since they're no longer used in this flow (keep the props on the component for now to avoid touching the route wrapper unless needed; just stop invoking them).

## 2. Simulator: read incoming state and pre-populate JSON

File: `src/routes/backoffice.simulator.tsx`

a. Read incoming router state:
```ts
import { useRouterState } from '@tanstack/react-router';
const incoming = useRouterState({ select: s => s.location.state as { jackpotConfig?: JackpotSavePayload } | undefined });
```

b. Add a mapper `mapPayloadToConfig(payload): JackpotConfigDTO` in a new helper file `src/lib/jackpot/payload-to-config.ts`:
   - `type`: `payoutModel === 'maximum' ? 'MAXIMUM' : 'AVERAGE'` (the engine only supports those two; `fixed` falls back to AVERAGE).
   - `contributionAmount`: `payload.contributionType === 'fixed' ? payload.poolPercentageValue : payload.playerContribution + payload.operatorContribution`.
   - `contributionType`: `payload.contributionType === 'fixed' ? 'FIXED' : 'PERCENTAGE'`.
   - `volatility`: `payload.volatility`.
   - `pool`: sensible defaults `{ currentAmount: 0, minimumAmount: 0, maximumAmount: 0 }` (extend later when the form exposes those fields).
   - `seed`: `{ currentAmount: 0, targetAmount: 0, contributionAmount: payload.seedPercentageValue, contributionType: payload.seedContributionType === 'fixed' ? 'FIXED' : 'PERCENTAGE' }`.
   - `name`: `payload.name`.
   - `id`: `0` (not yet persisted).

c. Initialize `configText` from the mapped config when `incoming?.jackpotConfig` is present; fall back to `DEFAULT_CONFIG` otherwise:
```ts
const initialConfig = React.useMemo(() => (
  incoming?.jackpotConfig ? mapPayloadToConfig(incoming.jackpotConfig) : DEFAULT_CONFIG
), []);
const [configText, setConfigText] = React.useState(JSON.stringify(initialConfig, null, 2));
```
Use empty dependency array so a later state change doesn't clobber user edits in the textarea.

d. Optionally show a small "Loaded from creation flow" hint above the JSON textarea when `incoming?.jackpotConfig` exists.

## 3. Export `JackpotSavePayload`

It's already exported from `JackpotCreationForm.tsx` (line 24). Import it in the simulator from `@/components/jackpot/JackpotCreationForm` to type the router state.

## Out of scope

- No DB write on Continue. The existing `createJackpot` server function and the parent route's `onSave` handler stay untouched; they can be wired to a future "Save" action from the simulator screen.
- No layout/style changes beyond the bottom action bar.
- No new validation framework; basic checks only.

## Verification

1. Open `/backoffice/jackpots/new`, fill Internal Name, pick any type, set contribution sliders.
2. Confirm only one button bar at the bottom: `Back` (left) + `Continue` (bottom-right). No "Save Jackpot" anywhere.
3. Click Continue with empty name → inline error, no navigation.
4. Click Continue with valid form → URL changes to `/backoffice/simulator`, JSON textarea is pre-filled with the mapped config (name, type, contributionAmount, volatility, seed.contributionType match selections).
5. Click "Run simulation" — request fires with the mapped JSON.