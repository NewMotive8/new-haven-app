# Speed up the Batch Velocity Runner

## Why it's slow today

In `src/routes/sandbox-demo.tsx`, `runBatch` sends every spin one-at-a-time:

```text
for i in 0..size:
  await fetch('/api/v1/event/bet', …)   <-- next request waits for previous
```

For a 1,000-spin batch that's 1,000 sequential network round-trips to the bet endpoint. Even at ~50 ms per round-trip, that's ~50 seconds of pure waiting — the endpoint itself is not the bottleneck, the serial `await` in the client loop is.

## The fix: bounded concurrency

Send N requests in flight at once (a "worker pool"), keep results ordered into the same `stats` accumulator, and keep the existing cancel + progress UX intact.

Default concurrency: **16** in-flight requests. Tunable constant at the top of `runBatch`. Empirically this is the sweet spot for a single Worker — beyond ~32 you start fighting HTTP/1.1 connection limits in the browser without meaningful gains.

Expected speedup for 1,000 spins: roughly 10–15× (seconds instead of tens of seconds), bounded by the slowest in-flight request rather than the sum.

## Scope of change

Single file: `src/routes/sandbox-demo.tsx`, function `runBatch` only.

- Replace the serial `for await` loop with a pool of `CONCURRENCY` async workers all draining a shared counter `next`.
- Each worker builds its own payload (txn id, auth headers, sysRng) exactly as today — no payload-shape changes.
- `stats` updates stay synchronous inside each worker; `setBatchProgress` / `setBatchStats({...stats})` still flushes every 25 completions.
- `cancelRef.current` is still checked at the top of each worker iteration, so Cancel works the same.
- `performance.now()` timing, `emptyBatchStats`, `finishedAt`, `durationMs`, and the `setBatchRunning(false)` finalizer all stay identical.

## Explicitly NOT touching

- The `/api/v1/event/bet` endpoint, its Zod schemas, idempotency cache, audit ledger, RNG, or community payout logic.
- The S2S Tester panel, the QA Compliance Test Suite overlay, the Statistical Analysis card, or any other UI.
- Header auth modes (`safe` / `authorized` / `rogue`) — each spin still picks up `authMode` / `internalSecret` exactly once at batch start, same as today.

## Technical detail

```ts
const CONCURRENCY = 16;
let next = 0;
const worker = async () => {
  while (true) {
    if (cancelRef.current) return;
    const i = next++;
    if (i >= size) return;
    // …existing per-spin body: build txn, payload, fetch, accumulate stats…
    if ((stats.completed % FLUSH === 0) || stats.completed === size) {
      setBatchProgress(stats.completed);
      setBatchStats({ ...stats });
    }
  }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
```

Result ordering doesn't matter — `stats` is a commutative accumulator (counts and sums), so concurrent updates from workers are safe in JS's single-threaded event loop.
