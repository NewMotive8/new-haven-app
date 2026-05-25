# Jackpot Engine — Compliance & Readiness Brief (for Product Managers)

Single deliverable, written in plain product-manager language. Every claim is paired with a concrete file or test that proves it. No application code will change.

## Deliverables (written to `/mnt/documents/`)

- `Jackpot_Engine_PM_Compliance_Brief.docx` — primary document, authored with the DOCX skill.
- `Jackpot_Engine_PM_Compliance_Brief.pdf` — LibreOffice render, surfaced as a `<presentation-artifact>`.
- Embedded architecture diagram of admin simulator ↔ live bet route parity.
- QA pass: every page converted to image and visually reviewed before handoff.

## Tone & format

- PM audience. Each section has "What it is", "Why it matters", and "Is it compliant? / Evidence".
- Evidence blocks cite exact file paths and test names an auditor can verify.
- Verdict box at the top: green / yellow / red per pillar.

## Document outline

1. **Executive summary** — verdict + traffic-light table across Math · Hit logic · Financial accounting · RNG · Concurrency & scale · Audit trail.

2. **The three jackpot types — math model & hit logic**
   CLASSIC, MUST_DROP, FREQUENCY: player experience · win decision · reseed · allowed vs forbidden config combinations.
   Evidence: `src/lib/jackpot/{math,simulator,live-engine,validate-payload}.ts`.

3. **Trigger Probability — why it cannot mix with Fixed/Average/Maximum**
   1-in-N Bernoulli; mixing with curve-based payouts drifts realised hit rate by `contribution × FAIRNESS_MULTIPLIER` (flagged as Variance by a math lab). Must-Drop / Frequency cannot declare N either. Ceiling `TRIGGER_ODDS_MAX = 10M`.

4. **Contribution distribution & the 3-way split (Pool / Seed / House)**
   Legacy vs split mode, operator-share vs wallet-share telemetry, exact 100.00% sum gate, overlapping rules.
   Evidence: `resolveContribution()`, `validateSplitWeights()`, `computeMultiCampaignLedger()`.

5. **Seed Overflow & Waterfall mechanics — and why this is the GLI-11 core test**

   **5.1 What it is (plain language).**
   - Every accepted wager is split into Pool, Seed, and (optionally) House slices by `resolveContributionSlice()` in `src/lib/jackpot/ledger.ts`.
   - The Pool is the player-facing prize. The Seed is a reserve tank that guarantees the next jackpot starts at a credible "minimum advertised" amount the moment a win clears the pool.
   - Reseed runs immediately after a win, inside `reseedAfterWin()` in `src/lib/jackpot/simulator.ts`. The waterfall reads the seed and refills the pool to its `minimumAmount` (the floor the player sees at game launch).

   **5.2 The waterfall, by payout model.**
   - **AVERAGE (reset-to-min reseed).** After a win, the pool is reset to `pool.minimumAmount` funded from the seed; the seed is then topped back up to `seed.targetAmount` from ongoing contributions. No money leaves the ecosystem — the pool reset is a *transfer* from seed → pool, not a write-off.
   - **MAXIMUM / Fixed (subtract-then-top-up).** After a win, the seed pays the difference between the new pool floor and what remained in the pool, then the seed itself is topped up from subsequent contributions until it reaches its target. Same invariant: every cent moved is an internal transfer between two tanks owned by the same jackpot ecosystem.
   - **Seed cap.** The seed never grows past `seed.targetAmount`; once full, additional seed-bucket contributions overflow into the Pool (documented overflow path). This is the "overflow" half of "seed overflow & waterfall" — it is **not** discarded revenue, it is rerouted to the player tank.
   - **Drain rule (liquidity gate).** If the pool ever falls below `pool.minimumAmount`, the safety gate (`performSafetyChecks`) drains from the seed *first* to restore the floor before a win can clear; if the seed cannot cover it, the spin is rejected with `rejectedByGate` telemetry rather than paying out from an empty tank.

   **5.3 Why this is the absolute core of GLI-11 compliance.**
   GLI-11 (Progressive Gaming Devices) — and every Tier-1 regulator that adopts it — does not care how aggressively the platform routes money between Pool, Seed, and overflow buffers. The lab cares about exactly one invariant:

   > **Conservation of Player Contributions (RTP Integrity).** Player contributions can never be removed from the progressive ecosystem except via a player payout.

   Concretely, that means:
   - Every cent contributed by a player wager must end its life in one of three places: (a) paid out to a player as a jackpot win, (b) still sitting in the Pool, or (c) still sitting in the Seed (which is owed to future players).
   - The House slice is **separate revenue**, only credited when the operator has explicitly declared a House weight in `contribution.split`. It is never sourced from player money already routed to Pool or Seed — `resolveContributionSlice()` derives all three slices from the same `totalForCalc` denominator, so House cannot cannibalise Pool or Seed retroactively.
   - Reseed, waterfall, overflow, and drain are all **internal transfers between tanks owned by the same jackpot**. No path in `reseedAfterWin()` or `performSafetyChecks()` writes player contribution out of the ecosystem.

   **5.4 Evidence (what an auditor will read).**
   - `src/lib/jackpot/ledger.ts` → `resolveContributionSlice()`, `computeBetLedger()` — single, deterministic split function used by both the simulator and the live bet route, so simulated RTP matches production RTP.
   - `src/lib/jackpot/simulator.ts` → `reseedAfterWin()` — the only place tanks are mutated post-win; reviewable in one screen.
   - `src/lib/jackpot/simulator.ts` → `performSafetyChecks()` — drain-from-seed and reject-with-telemetry behaviour.
   - `tests/audit/financial/conservation.test.ts` — the Conservation of Player Contributions test. Across mixed wagers, **Σ player wagers credited = Σ pool delta + Σ seed delta + Σ jackpot payouts to players**, verified to micro-cent precision. This is the test a GLI-11 lab will replicate verbatim.
   - `tests/audit/resiliency/immutability.test.ts` — proves prior pool/seed balances cannot be retroactively rewritten, so the conservation arithmetic above is auditable from history alone.

   **5.5 Bottom line.** The waterfall is implemented as a closed-loop transfer between Pool, Seed, and overflow back into Pool, with the House slice strictly additive on top of the player contribution split. That structure is what makes the engine GLI-11 ready — not the math curve, not the trigger model, but the fact that **player money never leaves the system except as a player win**.

6. **Liquidity Safety Gate**
   `minimumWinAmount` rejection, `seedCurrent < poolMin` rejection, `rejectedByGate` telemetry, forced-hit pool-cap override for Must-Drop ceiling.

7. **RNG — is it certifiable?**
   Web Crypto `crypto.getRandomValues(new Uint32Array(1))` (CSPRNG, GLI-12 / GLI-19 compatible). `Math.random()` banned in live path. Client-supplied `rngSource` ignored. Verdict: **yes**, pending formal lab statistical battery (Diehard / NIST SP 800-22).
   Evidence: `tests/audit/resiliency/rng.test.ts`.

8. **Pool, Seed & House balance management — will it survive a regulator/operator financial audit?**

   8.1 **Three independently reconcilable ledgers.** `jackpot_pools.current_balance`, `jackpot_seeds.current_seed_amount`, and the House cut (per-request `contribution.house`, aggregated as `houseContributions` / `houseRatio`). Auditor reconciles Σ wagers vs Σ pool credits + Σ seed credits + Σ house take as four independent streams.

   8.2 **Per-bet exactness to micro-cent precision.** `end_balance − start_balance == Σ wagers` verified per-bet and at batch level. Evidence: `tests/audit/financial/conservation.test.ts` Pillar 1; `micro()` helper.

   8.3 **Atomic, append-only, tamper-evident writes.** `apply_group_bet` PL/pgSQL function gives Postgres-level atomicity; admin top-ups go through `apply_jackpot_topup` SECURITY DEFINER RPC, which writes before/after to `admin_audit_log` (append-only by RLS). Wins persisted with status lifecycle (`pending_ack` → settled).

   8.4 **Idempotency & double-spend protection.** `transactionId` replay returns the original response without re-crediting. HMAC + brand-header dual auth. Evidence: `tests/audit/idempotency/replay.test.ts`, `tests/audit/auth/{hmac,bearer,brand-header}.test.ts`, `tests/audit/resiliency/{race,immutability}.test.ts`.

   **Bottom line for finance:** signed inbound transaction → Postgres-atomic write to three reconcilable balances → append-only audit row → deterministic replay. Reconciliation provable from SQL alone.

9. **Built for T1 operator load?**
   ✅ Ready: in-DB pool conservation via `apply_group_bet`, append-only `admin_audit_log` + `jackpot_wins`, race + immutability coverage, wager-proportional scaling, RLS-protected sensitive ops.
   ⚠️ Gaps before T1 production: in-memory idempotency cache is per-Worker (promote to shared store); `jackpot_ledger_logs` in-memory buffer is debug-only; formal GLI-11 / GLI-12 / GLI-19 lab submission package not yet bundled; mid-RPC failure injection explicitly skipped.

10. **Standards mapping** — short table linking each control to GLI-11 (math fairness + progressives + conservation), GLI-12 (RNG), GLI-19 (system integrity), ISO/IEC 17025 (traceability).

11. **Certification verdict** — "Engineering-ready, paperwork-pending." Lab can begin GLI-11 testing today; remaining work is sample collection, statistical battery, and submission package — not code.

## Confirmation before I build

I'll proceed exactly as scoped above unless you want me to add, drop, or re-weight any section.
