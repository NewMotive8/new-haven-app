# Advisor Handover + Pre-Approved Implementation Plan

Two short documents, both saved to `/mnt/documents/` in DOCX **and** PDF. No code changes in this task.

## Deliverable 1 — Advisor Handover

**File:** `Advisor_Handover_PreRNG_Gate.docx` / `.pdf`
**Length:** 1 page (~450 words)

Sections:
1. **Header** — Project (Incentiv8 Jackpot Engine), scope (Classic Progressive only), date, prepared-by.
2. **The specific question** (1 sentence)
   *"Is it compliant to skip the RNG draw on wagers where the seed reservoir is below its minimum funded floor, while still collecting the pool contribution?"*
3. **Current implementation** (5 factual bullets — RNG source, contribution timing, gate location in `live-engine.ts`, no suppression log, no disclosure).
4. **Why it was built this way** (2 sentences — GLI-12 liquidity safety; auditability implication not evaluated at build time).
5. **The concern to rule on** (3 bullets — player fairness, audit trail, RTP model alignment).
6. **Three remediation options** (A: disclose only, B: RNG-always + log, C: full state machine).
7. **Follow-up questions for the advisor** (5 bullets — which option satisfies GLI-11 §2.11, refund mechanism needed, RTP re-submission, log retention, jurisdictional deltas).
8. **Reference files** (4 file paths, so the advisor's technical reviewer can inspect source directly).

## Deliverable 2 — Pre-Approved Implementation Plan

**File:** `PreRNG_Gate_Remediation_Plan.docx` / `.pdf`
**Length:** 1–2 pages
**Purpose:** Ready to execute the moment the advisor picks Option B. Nothing implemented until greenlit.

Sections:
1. **Chosen approach** — Option B (RNG-always + suppression logging). Rationale: smallest surface, closes audit gap without changing player-visible behavior or RTP math.
2. **Scope: what changes**
   - `src/lib/jackpot/live-engine.ts` — `evaluateLiveSpin`: always call `rng()`, always compute `hitChance`, then set `suppressionReason` when min-win/min-seed gate would have blocked. Return shape adds `rngConsulted: true` and `suppressionReason?: "seed_below_floor" | "pool_below_min_win"`.
   - `src/routes/api/v1/event/bet.ts` — surface `suppressionReason` in the bet response `perJackpot[]` entries.
   - `src/routes/api/v1/event/bet.ledger.ts` — persist `suppression_reason` (nullable text) alongside the existing bet record.
3. **Scope: what does NOT change** (explicit, to bound risk)
   - Templates (`blueprints/templates.ts`) — unchanged.
   - Simulator (`simulator.ts`) — unchanged for compliance. Optional mirror-fix noted separately.
   - RNG source, forced-hit ceiling, wager scaling, financial conservation — unchanged.
   - UI, wizard, KPI dashboard — unchanged (optional "suppressed spins" KPI called out as future work).
   - Database schema — one nullable column, no data migration.
4. **Database change** — single SQL migration adding `suppression_reason text null` to the bet events table. Grants unchanged (column inherits table grants). RLS unchanged.
5. **Test additions**
   - New audit test: every wager response reports `rngConsulted: true`, even when `suppressionReason` is set.
   - New audit test: contributions collected during suppression are counted and reportable.
   - Existing tests (`tests/audit/resiliency/rng.test.ts`, `tests/audit/financial/conservation.test.ts`) re-run untouched.
6. **Non-code obligations for the advisor / math owner** (bulleted checklist so nothing falls through the seam that caused this issue):
   - Disclosure line added to public game rules text.
   - RTP filing cross-checked against "p on every spin" vs "p when seed ≥ floor" assumption.
   - Suppression log retention window confirmed per jurisdiction.
7. **Estimated effort** — ~3 files, ~40 lines of code, ~1 migration, ~2 tests. Half a day of engineering + review.
8. **Rollback plan** — feature flag `SUPPRESSION_LOGGING_ENABLED`; falling back is a single env-var flip that restores the current gate behavior without redeploy.

## Production notes

- Use docx-js (same styling as prior `Jackpot_Engine_PM_Compliance_Brief_v3.docx` — Arial, US Letter, 1" margins) for visual continuity.
- Convert to PDF via LibreOffice.
- QA each page as image before delivering (per docs artifact skill).
- Emit `<presentation-artifact>` tags for all 4 files (2 docs × 2 formats).

No code, no schema, no tests written in this task. Advisor decision gates everything downstream.
