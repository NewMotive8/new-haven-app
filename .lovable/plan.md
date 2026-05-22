## Add diagnostic line to MathAudit

Show why a simulation flags **Variance Detected** by surfacing the three numbers that explain the gap: expected wins, actual wins, and triggers blocked by safety gates.

### Data already available
- `result.rejectedByGate` — wins that hit the RNG but were rejected by `performSafetyChecks` (pool below minimum, seed not filled, etc.).
- Per tier: `tierResults[i].rejectedByGate`.

### Changes to `src/routes/admin.simulator.tsx`

1. **Extend `MathAudit` props** with optional `rejectedByGate?: number`.

2. **Compute and render a diagnostic row** under the existing 3-column grid (only when `configuredProb > 0`):
   - Expected wins = `iterations × configuredProb` (rounded)
   - Actual wins = `wins`
   - Blocked by gate = `rejectedByGate ?? 0`
   - Triggers fired = `wins + rejectedByGate` (so user sees the RNG hit rate vs the awarded rate)
   - Layout: a compact stat strip (4 small cells) with muted labels, separated from the badge row by a thin divider.
   - If `rejectedByGate > 0` and roughly closes the gap (triggers fired ≈ expected), add a one-line hint: *"Gate rejections explain the gap — wins were suppressed because pool/seed conditions weren't met."* Otherwise: *"Variance is sample-size driven — increase iterations for a tighter rate."*

3. **Wire `rejectedByGate` through both call sites** in `ResultsSummary`:
   - Single jackpot: pass `result.rejectedByGate`.
   - Multi-level: pass `t.rejectedByGate` for each tier.

### Out of scope
- No change to tolerance thresholds (still ±25%).
- No new API fields, no engine changes.
- Multi-level summary card unchanged; diagnostic appears per-tier in each tier's MathAudit.

### Expected result
Below the **Variance Detected** badge you'll see something like:
```
Expected wins  200    Actual wins  8    Blocked by gate  192    Triggers fired  200
Gate rejections explain the gap — wins were suppressed because pool/seed conditions weren't met.
```
Making it obvious whether the variance is bad luck, too few iterations, or the pool/seed gating starving payouts.