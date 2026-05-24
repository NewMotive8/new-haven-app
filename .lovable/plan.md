## Problem

Tiles in `/demo` use short category strings (`"slots"`, `"table"`, `"live"`), but the backend jackpot `assignedCategories` uses the master taxonomy from `src/lib/jackpot/master-categories.ts` (`"Slots"`, `"Table Games"`, `"Live Casino"`, `"Crash Games"`, `"Sports"`). The resolver in `QaOverlay.tsx` lowercases both sides and compares — `"table"` never matches `"table games"`, so a Table Games jackpot is reported as "not assigned" for the blackjack/roulette/baccarat/poker tiles.

## Fix (frontend-only, `/demo` scope)

In `src/routes/demo.tsx`, change the `GAMES` tiles to carry the master category string directly:
- `slots` tiles → `"Slots"`
- `table` tiles → `"Table Games"`
- `live` tiles → `"Live Casino"`

The category label rendered on the tile already comes from `g.category`, so it will read "Table Games" / "Live Casino" / "Slots" — which is actually more accurate for an operator demo.

No changes to `QaOverlay.tsx` resolver, no changes to backend, schema, or `src/lib/jackpot/*`. Existing case-insensitive compare in the resolver keeps working.

## Files touched

- `src/routes/demo.tsx` — update `category` field on the 16 `GAMES` entries.
