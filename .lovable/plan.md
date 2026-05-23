## Goal
Make the visible jackpot tile respond correctly when a €50 spin contributes to it, without changing contribution math, opt-in defaults, or unrelated routing behavior.

## What I’ll change
1. Tighten the multi-pool spin response handling in `src/routes/sandbox-demo.tsx` so grouped tiles still get a visible pool update when the bet API returns only aggregate contribution data.
2. Keep the existing chip/tracker behavior intact while assigning the aggregate pool delta to the correct currently targeted tile when no `perJackpot` breakdown is returned.
3. Remove the duplicate persistence call path so pool top-ups are sent once per affected jackpot instead of twice.
4. Preserve the current anti-yank focus behavior and only let the carousel move when the currently watched tile did not receive the bump.

## Expected result
- Spinning €50 on the currently visible tile makes that tile’s displayed amount move immediately.
- Group tiles update their tier rows when the response is aggregate-only and routed to that group.
- The 2-second poll no longer masks the change or causes inconsistent double top-up behavior.

## Technical details
- File: `src/routes/sandbox-demo.tsx`
- Focus area: the multi-pool branch inside `handleSpin`, especially the `perJackpot` / aggregate fallback block and the subsequent persistence section.
- Surgical implementation:
  - If `json.perJackpot` is empty and the target is a grouped tile, distribute the aggregate pool bump to the active group’s visible tier(s) using the current visible routing target instead of dropping the delta.
  - Keep `lastSplit` and tracker totals based on the server response exactly as they are now.
  - Collapse the two `persistPoolGrowth` paths into a single post-update persistence pass.
  - Leave contribution chip calculations, fallback routing, and opt-in discovery logic untouched.

## Validation
- Spin €50 on a single tile: its displayed pool increases and stays increased across the next poll.
- Spin €50 while viewing a grouped tile: at least one visible tier amount changes immediately and remains stable.
- Confirm the carousel does not jump away from the tile being watched when that tile received the bump.