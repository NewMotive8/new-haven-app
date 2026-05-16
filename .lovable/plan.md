## Problem

When a Multi-Level jackpot is selected, the form silently sets `volatility = 2` but renders **no slider** for it. The other three structural types (Classic, Must-Drop, Frequency) all expose a volatility slider in their Win Logic & Model section, so operators have no way to inspect or tune the cascading-hit exponent for Multi-Level.

## Proposed change

Add a **"Global Parameters"** block at the top of the existing Multi-Level "Engine Configuration" card (`src/components/jackpot/JackpotCreationForm.tsx`, around line 4208, just above the Tiers header) containing:

1. **Volatility slider** — identical control to the one used in the other branches (`Slider` from `@/components/ui/slider`, range 0–10, step 0.5, default 2, wired to existing `volatility` / `setVolatility` state). Includes the live numeric readout and a one-line helper:
   *"Exponent applied to each tier's hit-chance curve. Lower = looser/more frequent wins, higher = tighter/rarer wins."*

2. **Jackpot Maximum Win Amount** — currency input wired to existing `maxWinAmount` / `setMaxWinAmount` state (currently only editable in the Classic/Frequency branches, also invisible for Multi-Level). Default 50000. Acts as the global cap referenced by the Mega tier.

Both fields use the same `BrightLabel` / `CurrencyInput` / `Slider` primitives already used elsewhere in the form, so they inherit the existing dark-mode styling and look native to the section.

## Why here

- The existing `useEffect` that resets defaults when switching to Multi-Level already initializes these two values (`setVolatility([2])`, `setMaxWinAmount(50000)`) — the slider/input just need to be rendered so the operator can see and edit them.
- Placing them inside the Multi-Level engine card (rather than the Win Logic section) keeps all multi-level-specific controls grouped, matching the visual structure operators already use for tier rows.
- No backend, payload, or mapper changes needed — `buildPayload()` and `payload-to-config.ts` already read from `volatility[0]` and `maxWinAmount`.

## Files touched

- `src/components/jackpot/JackpotCreationForm.tsx` — insert ~25 lines for the Global Parameters block inside the `selectedType === 'multi_level'` Card.

No type changes, no migration, no mapper changes.