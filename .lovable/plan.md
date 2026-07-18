# Redesign: Alternative Suggestions UX

## Problem with today's flow

The current `SuggestBar` + `SuggestionPreviewDialog` forces users to:
1. Click "Cycle strategy" blindly to swap between Balanced / Top-heavy / Flat-frequent.
2. Open a modal to see one strategy at a time.
3. Cycle again (re-render the same modal) to compare — no side-by-side view, no memory of what the other option looked like.
4. Read a 6-column table (Share%, 1-in-N, Reseed, Max pool, Avg prize) per tier before they can judge.

Users can't answer the only question that matters: *"Which shape fits the promo I'm running?"* They have to hold numbers in their head across modal opens.

## Design principle

Show all three strategies at once, at the level of abstraction a promo owner actually decides on: **top prize size, hit frequency, and prize shape**. Push the per-tier table to an on-demand "Details" reveal. Make switching a single click, not a modal round-trip.

## New UX: "Strategy Picker" card (inline, replaces both SuggestBar and dialog)

Rendered inline in Step 2 above the tier list, always visible while tiers are unset or drifted.

```text
┌─ Suggested allocation ────────────────────────────── [Dismiss] ┐
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ● Balanced   │  │   Top-heavy  │  │ Flat-frequent│          │
│  │              │  │              │  │              │          │
│  │  Top prize   │  │  Top prize   │  │  Top prize   │          │
│  │  ~€1,700     │  │  ~€8,400     │  │   ~€450      │          │
│  │              │  │              │  │              │          │
│  │  Any tier    │  │  Any tier    │  │  Any tier    │          │
│  │  hits every  │  │  hits every  │  │  hits every  │          │
│  │  1,200 spins │  │  2,000 spins │  │   600 spins  │          │
│  │              │  │              │  │              │          │
│  │  ▂▃▅  shape  │  │  ▁▁█  shape  │  │  ▄▄▄  shape  │          │
│  │  moderate    │  │  steep       │  │  shallow     │          │
│  │              │  │              │  │              │          │
│  │  [Selected]  │  │   [Pick]     │  │   [Pick]     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ▸ Show per-tier breakdown for Balanced                         │
│                                                                 │
│  [Simulate 10k spins]           [Apply Balanced to all tiers]   │
└─────────────────────────────────────────────────────────────────┘
```

### What each card shows (only what matters)

Three headline numbers + one visual — nothing else above the fold:

- **Top prize** — the top tier's `expectedAvgPrize` (rounded, currency-formatted). This is the single number promo managers pitch to marketing.
- **Aggregate hit cadence** — "any tier hits every ~N spins", from `strat.aggregateHitOne`. Answers "will players feel this is alive?".
- **Prize shape sparkline** — a 3-bar mini-bar chart of the tier prizes (bottom → top), showing steepness at a glance. Replaces the intuition users currently have to build from Share% columns.
- **One-line character** — "moderate ladder", "steep ladder", "shallow ladder". Straight from `strat.description`, trimmed.

Selected card is highlighted (violet ring + filled "Selected" pill). The other two show a subtle "Pick" ghost button — one click swaps selection with no modal.

### Progressive disclosure

- Under the cards: a collapsed `▸ Show per-tier breakdown for <selected>`. Expands into the existing 6-column table only when the user wants proof. Default state: collapsed. Most users apply without opening it.
- The "hasExisting → will overwrite N tiers" amber warning moves next to the Apply button (not hidden in a modal footer) so it's visible at decision time.

### Actions (right-aligned, in the footer of the picker card)

- **Simulate 10k spins** (secondary) — runs against the currently selected strategy, opens the existing simulator handshake in a new tab as today.
- **Apply <StrategyLabel> to all tiers** (primary) — label reflects selection so the user always knows what they're committing to.
- No "Cycle strategy" button anywhere. Selection is the cards themselves.
- Dismiss (×) in the top-right hides the picker for the session (returns to today's post-picker experience — tier list only). A small "Show suggestions" link appears in the SuggestionsPanel drift area to bring it back.

## Behavior changes

- Delete `SuggestionPreviewDialog` (the modal) and the `Dialog` open/close state around it.
- `SuggestBar` is replaced by the new inline `StrategyPicker` component. Same props surface (`onApply`, `onSimulate`, `strategyIndex`, `onCycle` becomes `onSelect(strategy)`).
- All three suggestions are computed up-front (three `computeSuggestion` calls memoized on group + tier count) so switching is instant with no loading state.
- "Simulate 10k spins" and "Apply" continue to call the existing handlers unchanged — only the shell around them changes.

## Copy tweaks (only what really matters)

- Card headline metric is currency-formatted (`formatMoney`), not raw `1743.94`.
- 1-in-N is written as prose ("every ~1,200 spins") not `1-in-N: 1,200`.
- Strategy `description` sentences are shortened to a single trailing phrase (e.g. "moderate ladder", "steep ladder", "shallow ladder") to fit the card.

## Out of scope

- No changes to `suggest-allocation.ts` math or `STRATEGIES` definitions.
- No changes to how "Apply" writes tiers, or to the simulator handshake payload.
- No changes to drift detection (`SuggestionsPanel`), rebalance, or edit-tier flows.

## Files touched

- `src/components/jackpot/MultiJackpotWizard.tsx`
  - Replace `SuggestBar` (~lines 3685–3731) with a new `StrategyPicker` component.
  - Delete `SuggestionPreviewDialog` (~lines 3736–3847) and its render site (~line 1481) and open/close state.
  - Precompute suggestions for all three strategies (memoized) and pass to the picker.
  - Add a `Collapsible` for the per-tier breakdown table (reusing the existing shadcn `Collapsible`).

No backend, no schema, no engine changes.
