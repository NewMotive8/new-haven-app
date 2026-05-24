## Goal

On `/demo`, remove the manual "Jackpot Campaign" dropdown. When a tile is clicked, the overlay automatically resolves which active jackpot (if any) applies to that tile's Game ID + Category, then either renders the live widget or shows one of three fallback messages based on the campaign timeline (evaluated against the Time Machine timestamp).

## Resolution logic (in order)

For the clicked tile, scan `/api/v1/jackpots` (filtered to `enabled: true`) and find the first jackpot whose targeting matches:

- match if `assignedGameIds` contains the tile's game id, OR
- match if `assignedCategories` contains the tile's category
- (a jackpot with neither array populated is treated as untargeted → no match)

Then evaluate the campaign window using `jackpot.config.timed.startDate` / `endDate` (ISO UTC) against the effective timestamp (`buildIsoTimestamp(tm)` from the Time Machine, or "now" when TM is default):

| Condition | UI |
|---|---|
| No targeting match | Hide widget. Message: "This game is not assigned to a Jackpot" |
| Match + `now < startDate` | Hide widget. Message: "The Jackpot for this game will start later" |
| Match + `now > endDate` | Hide widget. Message: "This Jackpot campaign has ended" |
| Match + inside window (or no start/end set) | Render full widget + QA controls |

The resolution re-runs whenever the jackpots poll refreshes (2s interval already in place) or the Time Machine value changes, so flipping the TM into the past/future updates the fallback live.

## Overlay behavior when active

When a valid jackpot is resolved, keep the existing QA controls but drop the Jackpot Campaign dropdown:
- Widget Style selector
- Win Animation selector
- Game ID + Category (editable; edits re-trigger resolution)
- Bet Size (default 1.00)
- Time Machine (date/time/timezone → ISO on spin payload)
- 3D Spin button (disabled while spinning)

Spin still calls `placeDemoBet` server proxy with `{ transactionId, wager, gameId, category, jackpotId: <resolved id>, clientTimestamp, clientTimezone, brandId, playerSegments: [] }`. On success the displayed pool balance animates upward by the contribution slice (already wired via `displayFloorRef` + `setDisplayBalance`); on `json.win` the selected `WinCelebration` variant fires.

## Fallback UI

Inside the overlay where the widget panel currently lives, when there's no resolved jackpot render a centered card with:
- A muted icon/badge
- The status message text (one of the three above)
- A small caption showing the matched jackpot name + window (when the issue is time-based) so QA can see *why* it's gated
- The right-hand QA controls panel is hidden in this state — only the message + "Close" remain, since there's nothing to spin against.

## Files

- `src/components/demo/QaOverlay.tsx` — remove jackpot select, add `resolveJackpot(tile, jackpots, tmIso)` helper, derive `{ status, jackpot }` via `useMemo`, branch render between fallback card and current operational layout. Keep `placeDemoBet` call unchanged except `jackpotId` comes from the resolved jackpot.
- No backend/API/schema changes. No edits to `src/lib/jackpot/*`, server routes, or `sandbox-demo.tsx`.

## Technical notes

- Tile `gameId` is a string (e.g. `"stellar-rush"`) while `assignedGameIds` is `number[]`. Match by coercing both to string before `includes` so either shape works without touching the backend.
- Effective timestamp: if `tm` equals `defaultTimeMachine()` use `Date.now()`, otherwise parse `buildIsoTimestamp(tm)`. Compare numerically via `Date.parse`.
- `startDate`/`endDate` may be absent → treat missing start as `-Infinity` and missing end as `+Infinity` (campaign always active).
- If multiple jackpots match, prefer one with `assignedGameIds` hit over a category-only hit; otherwise take the first.
