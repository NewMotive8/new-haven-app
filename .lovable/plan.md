Add a round-trip "Back to Editor" button on the Simulator page so users can return to the Create Jackpot form with every field preserved exactly as they left it.

## How it works

- When the user leaves the creation form for the simulator, the payload is already passed via TanStack Router location state.
- We keep that original payload alive in the simulator component.
- A new **"Back to Editor"** button navigates back to `/admin/jackpots/new`, passing the same payload back through router state.
- The creation form reads that incoming state on mount and uses it as the initial value for every field instead of hard-coded defaults.

## Files to change

### `src/routes/admin.simulator.tsx`
- Store the original `JackpotSavePayload` from `useRouterState` in component state.
- Add a **"Back to Editor"** button below the *Run simulation* button.
- On click, `navigate({ to: '/admin/jackpots/new', state: { jackpotConfig: originalPayload } })`.

### `src/components/jackpot/JackpotCreationForm.tsx`
- Import `useRouterState` from `@tanstack/react-router`.
- Read incoming `jackpotConfig` from router location state.
- Initialize every `useState` field from the incoming payload when present, falling back to existing defaults when absent (so direct navigation to `/admin/jackpots/new` still works normally).
- Fields covered: `selectedType`, `name`, `description`, `payoutModel`, `contributionType`, `seedContributionType`, `volatility`, `playerContribution`, `operatorContribution`, `seedPlayerContribution`, `seedOperatorContribution`, `poolPercentageValue`, `seedPercentageValue`, `isTemplate`, `selectedWidget`, `isSegmented`, `segments`, `isCommunity`, `communitySplit`, `payoutInterval`, `recurrenceType`, `weeklyDay`, `monthlyDay`, `displayFrequency`, `weeklyFrequencyDay`, `monthlyFrequencyDay`, `separateContributionFrequency`.

## No database or backend changes required
This is purely a client-side state round-trip via TanStack Router location state.