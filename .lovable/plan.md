## Goal

Make the simulator inputs fully reactive, eliminate the crash on large iteration counts, and let it run up to 10,000,000 spins against the JSON config passed in from the creation flow.

## Root cause of the current crash

The console shows `RangeError: Maximum call stack size exceeded` inside a `useMemo` on `/backoffice/simulator`. The culprit is:

```ts
Math.max(...result.winEvents.map((w) => w.amount))
```

Spreading a large array into `Math.max(...)` blows the JS argument stack as soon as `winEvents` grows into the tens of thousands. As soon as a simulation returns more than ~10k win events, the page crashes into the error boundary — which is exactly what the user sees as "ignored my changes / stuck on old values". The inputs are actually bound correctly; they just never survive the re-render after a heavy run.

Secondary issues:

- `src/lib/jackpot/simulator.ts` hard-caps iterations at `1_000_000` (`Math.min(..., 1_000_000)`), so 10M is silently truncated.
- `simulateEngine` pushes every win into a single `winEvents` array. At 10M iterations this can easily be hundreds of thousands of objects — wasted memory and serialization cost, since the UI only ever shows the first 50.
- The `<input type="number" max={1000000}>` on the iterations field caps the spinner at 1M.
- `tierWins` and the win-events table re-render the entire result on every keystroke in the JSON textarea (cheap now, but worth memoizing on `result` only — already is, just keep it that way).

## Changes

### 1. `src/routes/backoffice.simulator.tsx` — fix the crash and lift the UI cap

- Replace the spread-based `maxWin` memo with a plain `for` loop reduction so it scales to millions of entries:
  ```ts
  const maxWin = React.useMemo(() => {
    if (!result?.winEvents?.length) return 0;
    let m = 0;
    for (const w of result.winEvents) if (w.amount > m) m = w.amount;
    return m;
  }, [result]);
  ```
- Raise the iterations input cap to `10_000_000` and clamp `onChange` to that range so the controlled state can't exceed it.
- Keep `wager` and `iterations` exactly as already wired — they're already controlled state and already passed as query params; no change needed beyond confirming.
- Add a tiny "Running N iterations…" hint while `loading` so the user sees the request is in flight on large runs.

### 2. `src/lib/jackpot/simulator.ts` — support 10M and stop hoarding win events

- Raise the safety clamp from `1_000_000` to `10_000_000`.
- Cap the returned `winEvents` array at the most recent ~500 entries (the UI only renders 50, and tier bucketing only needs counts). Track `winCounter` and tier buckets in-loop so we don't have to keep every event:
  - keep counters (`winCounter`, `winAmountCounter`, `maxWinAmount`, `tierCounts: Record<string, number>`) updated inside the existing `for` loop
  - push to `winEvents` only if `winEvents.length < 500` (or use a ring buffer)
- Extend `SimulatorResponseDTO` with optional `maxWinAmount` and `tierCounts` so the UI can read them directly and skip the client-side spread/reduce entirely. Update the page to prefer those when present and fall back to the existing client computation for backward compatibility.
- Micro-optimize the hot loop: hoist `winType`, `volatility`, `poolCap`, `seedCap`, `jackpot.contributionType`, `jackpot.contributionAmount`, `seed.contributionType`, `seed.contributionAmount`, and the reseed amount into locals outside the loop. The current code re-reads them every iteration.
- No batching/`setImmediate` is needed — this is a pure arithmetic loop, ~10M simple ops runs well under the Worker CPU budget once we stop allocating an object per win.

### 3. `src/lib/jackpot/types.ts` — add the two optional response fields

Add `maxWinAmount?: number` and `tierCounts?: Record<string, number>` to `SimulatorResponseDTO`.

### 4. Confirm dynamic config wiring (no code change expected)

The page already does:

```ts
const incoming = useRouterState({ select: (s) => s.location.state as ... });
const initialConfig = React.useMemo(() => incoming?.jackpotConfig ? mapPayloadToConfig(incoming.jackpotConfig) : DEFAULT_CONFIG, []);
const [configText, setConfigText] = useState(JSON.stringify(initialConfig, null, 2));
```

and posts `JSON.parse(configText)` as the body. That is already "exact fields of the custom Jackpot config" — the simulator engine reads `pool`, `seed`, `contributionType`, `contributionAmount`, `volatility`, `type` from that body, not from a hardcoded template. I'll re-verify `mapPayloadToConfig` covers all four payout models (Classic / Frequency / Must Drop / Multi-Level) and note any missing field mapping, but no rewrite is planned unless something is actually dropped.

## Out of scope

- No DB writes, no schema changes, no auth changes.
- No visual redesign of the simulator panel.
- No new charting — existing `StatCard` / tier grid / recent-wins table stay as-is.

## Verification

1. Open `/backoffice/jackpots/new`, fill a Classic jackpot, hit Continue.
2. On the simulator, change wager to `1` and iterations to `10000000`.
3. Click Run — page should not crash, RTP / win count / max win / final pool should populate, recent-wins table shows up to 50 rows.
4. Change wager/iterations again and re-run — values update, no stale results.
5. Check `code--read_console_logs` for absence of `Maximum call stack size exceeded`.