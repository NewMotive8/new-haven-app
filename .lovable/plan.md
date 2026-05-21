Phase 4 — High-Velocity Compliance Testing & Monte Carlo Verification

Add a headless batch runner to the S2S Tester that fires N bets back-to-back through the existing `POST /api/v1/event/bet` endpoint, then renders a GLI-style statistical roll-up of the run.

## Approach

This is a frontend-only phase. The backend is untouched: every batch spin uses the same authenticated S2S route added in Phase 2 and naturally streams into the Phase 3 ring buffer. We extract the existing single-bet POST logic into a reusable helper inside `sandbox-demo.tsx`, then drive it from a batch controller that owns its own React state (size, progress, totals, cancel flag).

## Files to touch

- `src/routes/sandbox-demo.tsx` — only file. Add batch state, extract `fireOneBet()` from `handleFireBet()`, add the "Batch Velocity Runner" controls inside the S2S Tester card, and add the "Statistical Analysis (GLI Audit View)" summary card below it.

Out of scope: backend routes, ledger schema, simulator, creator form, persistence.

## Technical detail

### 1. Extracted single-bet helper

Pull the body construction + `fetch("/api/v1/event/bet", …)` + response parsing out of `handleFireBet()`'s multi-pool branch into:

```ts
async function fireOneBet(opts: {
  wager: number;
  gameId: string;
  segments: string[];
  systemRngValue?: number;
}): Promise<{
  ok: boolean;
  httpStatus: number;
  idempotentReplay: boolean;
  totals: { pool: number; seed: number; house: number };
  totalContribution: number;
  win: { jackpotId: number; amount: number; isCommunity: boolean } | null;
  error?: { code?: string; message?: string };
}>
```

It generates a fresh `transactionId` per call (crypto.randomUUID with fallback), respects the existing `authMode` + `internalSecret` selection (so a tester can intentionally batch-fire unauthorized loads and watch every row 403), and returns a normalised summary the batch loop can aggregate. The existing `handleFireBet()` keeps its single-spin UI side effects (celebration, `lastHandshake`, `lastReplay`, pool deltas) by calling `fireOneBet` and then doing the same post-processing it does today.

### 2. Batch state

New module-local state inside the component:

```ts
const [batchSize, setBatchSize] = useState<100 | 500 | 1000>(100);
const [batchRunning, setBatchRunning] = useState(false);
const [batchProgress, setBatchProgress] = useState(0);
const cancelRef = useRef(false);
const [batchStats, setBatchStats] = useState<BatchStats | null>(null);

type BatchStats = {
  size: number;
  completed: number;
  ok: number;
  blocked: number;          // 403 / 503 / other non-2xx
  idempotentReplays: number;
  turnover: number;         // Σ wager (only counted on ok responses)
  poolTotal: number;        // Σ contribution.pool
  seedTotal: number;        // Σ contribution.seed
  houseTotal: number;       // Σ contribution.house
  totalContribution: number;
  hits: number;             // win !== null count
  communityHits: number;
  hitFrequency: number;     // hits / ok  (guard divide-by-zero)
  rtpPoolPlusSeed: number;  // (poolTotal + seedTotal) / turnover
  rakePct: number;          // houseTotal / turnover
  startedAt: string;
  finishedAt: string | null;
  durationMs: number;
};
```

### 3. Execution loop

A single async `runBatch()` function:

```text
1. Validate wager + gameId; bail with a toast if invalid.
2. Reset batchStats to a zeroed object, set batchRunning=true, cancelRef=false.
3. for (i = 0; i < batchSize; i++):
     if (cancelRef.current) break;
     const res = await fireOneBet({ wager, gameId, segments, systemRngValue });
     accumulate into a local stats object;
     setBatchProgress(i + 1) and setBatchStats(snapshot) every BATCH_FLUSH (e.g. 25 spins)
       so React doesn't re-render 1,000 times.
4. Finalise stats (finishedAt, durationMs, derived ratios), setBatchRunning(false).
```

Spins run sequentially (await per spin) so each transaction respects idempotency, the ring buffer ordering stays deterministic, and we never thunder the Worker with 1,000 in-flight requests. A 1,000-spin batch at ~5-20ms/spin completes in a few seconds — acceptable for the sandbox.

A "Cancel" button flips `cancelRef.current = true` and the loop exits at the next iteration; partial stats remain visible.

### 4. UI — Batch Velocity Runner (inside the S2S Tester card)

Sits below the existing single-spin controls, separated by a divider:

- Segmented control: `100 · 500 · 1,000` (disabled while running).
- Primary button: "Execute Batch" → green `Running… 347 / 1000` while active.
- Secondary button: "Cancel" (only while running).
- Progress bar: `<progress value={batchProgress} max={batchSize}>` styled with the existing token palette.
- Inline meta: "Auth mode: Authorized · RNG: local" so the tester knows what regime the batch ran under.

The same `authMode` selector already in the card governs the batch — a tester can flip to "Rogue" and watch every row 403 to verify Phase 2 holds under load.

### 5. UI — "Statistical Analysis (GLI Audit View)"

New card directly below the Compliance Audit Ledger section (or beside it on wide screens), only rendered when `batchStats` is non-null.

Layout: a 4-column grid of stat tiles on top, a secondary "Hit Frequency Checklist" row below.

Tile group A — Financial Totals (uses `fmtPrecise` so micro-fractions are visible):

- Total Simulated Turnover — `Σ wager`
- Total Pool Captured — `Σ contribution.pool`
- Total Seed Captured — `Σ contribution.seed`
- Total House Rake — `Σ contribution.house`

Tile group B — Derived Ratios:

- Pool+Seed Return % — `(pool+seed) / turnover * 100`
- House Edge % — `house / turnover * 100`
- Total Contribution — `Σ totalContribution` (sanity-check: must equal pool+seed+house within float epsilon)

Hit Frequency Checklist row (always rendered, even if 0 hits):

- Jackpot Drops Triggered: `hits`
- Community Drops: `communityHits`
- Hit Frequency: `hits / ok` rendered as `1 in N` (e.g. "1 in 487") plus the raw percentage
- Idempotent Replays: `idempotentReplays` (expected to be 0 — flagged red if not)
- Blocked Responses: `blocked` (expected 0 in Authorized mode; expected = size in Rogue mode)

Footer line: `Run: 1,000 spins · 4.2s · started 13:42:08 · finished 13:42:12 · auth=Authorized`.

A small "Clear" button resets `batchStats` to null and hides the card.

### 6. Interaction with Phase 3 ledger

No special wiring needed. Every successful spin is a fresh `transactionId`, so each row is appended to `jackpot_ledger_logs` and the 2s poll naturally fills the grid. The 200-row cap means a 1,000-spin batch shows only the last 200 rows in the grid — that is the correct behaviour for a ring buffer, and the batch summary card is exactly what compensates for it by holding the run's full aggregates client-side.

## Out of scope

- Server-side batch endpoint (would skip per-request HTTP overhead but defeats the point of exercising the real S2S path).
- Concurrent / parallel spin dispatch (would break ledger ordering determinism).
- CSV/JSON export of batch results.
- Persistence of past batch runs.
- Chi-square / variance / confidence-interval analysis (a full GLI-19 report would; flagged for a later phase).
