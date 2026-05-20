# Eligibility & Rules Engine — Casino + Sportsbook targeting

Add a new "Eligibility & Rules" section to `JackpotCreationForm.tsx`, persisted into the save payload as `eligibility.games` so the multi-campaign router can match spins to the right jackpots.

## UI layout

New section rendered right after the Contribution / Overlapping Rule block, matching the existing dark `Card` styling:

```text
[ Eligibility & Rules Engine ]
 ( Casino Games ) ( Sportsbook )      <- segmented toggle
 ──────────────────────────────────────
  <Casino panel>  OR  <Sportsbook panel>
```

### Casino panel (when `vertical === "casino"`)
- **Game Categories** — checkbox row: Slots, Live Casino, Table Games, Crash Games.
- **Providers / Game Studios** — multi-select chip list: Pragmatic Play, Evolution, Hacksaw, NetEnt, Play'n GO, Relax Gaming (toggle chips, no extra dep).
- **Specific Game IDs** — tag input: type + Enter adds a chip; backspace removes. Empty = "all games in selected categories".

### Sportsbook panel (when `vertical === "sportsbook"`)
- **Bet Type** — 3-way segmented switch: Live / In-Play Only · Prematch Only · All Bets.
- **Sport Type** — dropdown: Football, Basketball, Tennis, Hockey, Baseball, eSports, MMA.
- **League / Tournament Tags** — tag input (uppercase-normalised, e.g. `UEFA_CHAMPIONS_LEAGUE`).
- **Specific Match IDs** — `<textarea>` for comma-separated fixture IDs (parsed on save).

Layout uses the same `BrightLabel` + `bg-neutral-900` + `border-neutral-700` tokens already used elsewhere in the form. No new shadcn imports needed — chips/tags are built inline with Tailwind.

## State

Add to the form component:
```ts
const [vertical, setVertical] = useState<'casino' | 'sportsbook'>(initial?.eligibility?.vertical ?? 'casino');
// Casino
const [gameCategories, setGameCategories] = useState<string[]>(initial?.eligibility?.casino?.categories ?? []);
const [providers, setProviders] = useState<string[]>(initial?.eligibility?.casino?.providers ?? []);
const [gameIds, setGameIds] = useState<string[]>(initial?.eligibility?.casino?.gameIds ?? []);
// Sportsbook
const [betType, setBetType] = useState<'live' | 'prematch' | 'all'>(initial?.eligibility?.sportsbook?.betType ?? 'all');
const [sportType, setSportType] = useState<string>(initial?.eligibility?.sportsbook?.sportType ?? '');
const [leagueTags, setLeagueTags] = useState<string[]>(initial?.eligibility?.sportsbook?.leagues ?? []);
const [matchIdsRaw, setMatchIdsRaw] = useState<string>((initial?.eligibility?.sportsbook?.matchIds ?? []).join(', '));
```

## Payload contract

Extend `JackpotSavePayload` with an optional `eligibility` block:
```ts
eligibility?: {
  vertical: 'casino' | 'sportsbook';
  casino?: { categories: string[]; providers: string[]; gameIds: string[] };
  sportsbook?: {
    betType: 'live' | 'prematch' | 'all';
    sportType: string;
    leagues: string[];
    matchIds: string[];
  };
};
```

`buildPayload()` populates the active vertical's branch (the inactive branch is omitted to keep payloads small).

## Persistence + bet router alignment

- `build-create-body.ts` → `buildTriggerCondition()`: add `eligibility: { games: payload.eligibility }` so it lives under `config.eligibility.games` server-side (matches the structure the multi-campaign router already expects).
- `payload-to-config.ts`: read `config.eligibility?.games` back into `JackpotSavePayload.eligibility` so the form rehydrates correctly on edit, and so sessionStorage round-trips into the simulator.
- No backend router math changes required in this pass — the matching logic in `routes/api/v1/event/bet.ts` already scans all enabled jackpots; this PR only supplies the metadata it needs going forward.

## Files touched

- `src/components/jackpot/JackpotCreationForm.tsx` — new section, state, payload mapping, type extension.
- `src/lib/jackpot/build-create-body.ts` — pass `eligibility` into `config`.
- `src/lib/jackpot/payload-to-config.ts` — hydrate `eligibility` back from `config`.

## Out of scope (call out before building)

- No new dependencies (chips/tags built with Tailwind + small handlers).
- No changes to bet-routing math — only adds the metadata. Wiring the router to actually filter by `eligibility.games` is a separate follow-up.
