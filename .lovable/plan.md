# Compliance Brief v4 + Reply to Third-Party Platform

The response we received is a **third-party jackpot platform's self-assessment** against our brief — not an audit of our code. Their engine is Node + MongoDB; ours is Postgres/Supabase. Two things follow: our brief has a portability defect we should fix, and they deserve a substantive reply.

## What gets produced

Two documents in the project's generated files (`.docx` + `.pdf` each):

### 1. Jackpot Engine Compliance Brief v4 (stack-neutral)

Rewrite the brief so it works as a portable assessment instrument against any architecture.

- **Add a stack-translation table up front.** Map each required property to how it can be evidenced on Postgres, MongoDB, MySQL, or event-sourced stacks. Prevents an auditor reading "no PL/pgSQL function" as "no atomicity."
- **Convert implementation asks into property asks.** Every question that currently names a Postgres artifact (PL/pgSQL bet RPC, RLS policies, migration files, service-role client) becomes a neutral property: "demonstrate atomic single-writer commit," "demonstrate row-level access restriction," "demonstrate versioned reviewable schema change," "demonstrate privileged-credential scoping."
- **Fix the §3 scope clause.** Remove "multi-campaign contribution routing." Replace with conditional wording covering both models: single-jackpot tier splits with a per-jackpot denominator, and shared-denominator cross-campaign routing where present. Rewrite the "stability under campaign churn" question so it is answerable under either model, or explicitly marked N/A.
- **Accept integer numerator/denominator conservation as a first-class passing answer** in the money-conservation section, alongside the existing formulation.
- **Add a retention floor question** to §8 — explicitly ask for the retention period of *losing* spins, not just wins. Their F1 shows the current wording lets a 30-day purge slip through unasked.
- **Add explicit sections** for destructive-operation auditing, credential scoping/actor identity, and responsible-gambling controls (self-exclusion, age, geo, win cap) — currently under-specified, which is why F3/F4/F5 surfaced only through their volunteered candor rather than our questions.

### 2. Reply to the platform developer

A direct written response covering:

- **Accept both framing corrections.** Confirm the stack coupling was our defect and the scope clause was wrong; note v4 fixes both.
- **Credit the strong answers**: exact-money conservation by construction, no production re-roll path, DB-index idempotency, per-pair lock + FIFO drain answering §9, and the RNG service's own GLI-19 self-test.
- **Reorder their remediation.** Argue F1 + F3 + F4 form one compound risk — a single shared secret can silently destroy balances, with no actor recorded, and the evidence self-deletes in 30 days. Recommend the Tier 2 WORM export move **ahead of** parts of Tier 1, since it is the only change that makes the other failures survivable.
- **Escalate F5 separately** as a licensing gate rather than engineering debt — `is_blocked` alone, with no self-exclusion, age, or geo check, blocks go-live in most regulated markets regardless of the quality of the money math.
- **Acknowledge the two volunteered gaps** (no financial-summary endpoint for external-mode reconciliation; non-durable pre-commit debit with swallowed refund) and confirm both are in scope for their remediation.
- **Note the two disclose-don't-hide items** are acceptable when documented: BSON Double with `isSafeInteger` guards, and the unwired `contribution_flow_unavailable` kill switch — the latter should be wired or removed, not left advertised.

## Technical notes

- No application code changes. This is document generation only — the audited files (`jackpot_win_record.ts`, `pool_sync`, `errors.ts`) belong to the third party and are not in this repo.
- Source the v4 rewrite from the existing `Jackpot_Engine_PM_Compliance_Brief_v3` content, preserving its Classic-Progressive-only scope (no Must-Drop, no Frequency, no community payout).
- Keep the v3 GLI-11 framing and the resolved post-RNG suppression position from `Advisor_Handover_PostRNG_Suppression_v2` intact and consistent.
- Both documents delivered as `.docx` and `.pdf`, rendering verified before hand-off.
