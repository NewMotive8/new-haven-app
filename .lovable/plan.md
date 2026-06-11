# Compliance Brief v3 — Scope Reduction

Produce a new artifact `Jackpot_Engine_PM_Compliance_Brief_v3.docx` (plus PDF render) tailored to the target system's actual scope.

## Scope changes vs v2

**Remove entirely:**
- All references to **Frequency** jackpot type (time-driven / scheduled wins)
- All references to **Must-Drop** (already removed in v2 — confirm none reintroduced)
- All references to the **Community Payout** feature (shared/distributed wins across multiple players)

**Result:** the brief covers a single jackpot family — **Classic Progressive** (probability-driven, single-winner).

## Sections to update

1. **Executive summary** — traffic-light table: drop the Frequency column; drop Community Payout row from Player Protection.
2. **Jackpot types** — collapse to one section: "Classic Progressive — math model & hit logic" (Bernoulli trigger, RNG-driven, single winner).
3. **Trigger Probability** — keep; remove the "Frequency cannot declare N" caveat (no longer relevant).
4. **Contribution split (Pool / Seed / House)** — keep unchanged; this is type-agnostic.
5. **Seed Overflow & Waterfall** — keep; remove any Frequency-specific reseed wording.
6. **Liquidity Safety Gate** — keep; remove the Must-Drop forced-hit override note (already gone) and any Frequency scheduling references.
7. **RNG** — keep unchanged.
8. **Pool/Seed/House financial audit** — keep unchanged.
9. **Player Protection** — remove the Community Payout sub-section (server-side distribution fairness, per-player share calc, payout-list integrity). Keep wager limits, RG hooks, single-winner payout integrity.
10. **T1 operator load** — keep unchanged.
11. **Standards mapping** — keep; remove rows that only applied to Frequency/Community.
12. **Evidence checklist tables** — prune rows referencing `frequency`, `winFrequency`, `contributionFrequency`, scheduled-win cron, community-share distribution.
13. **Architectural questions** — drop questions about scheduled triggers and shared-pot distribution math.

## Build steps

1. Copy `Jackpot_Engine_PM_Compliance_Brief_v2.docx` generation script (from prior turn) as the base.
2. Apply the deletions above; renumber sections so output stays 1..N with no gaps.
3. Update cover page: title unchanged, version → **v3**, subtitle note: *"Scope: Classic Progressive jackpots only. Frequency/scheduled and Community/shared payouts are explicitly out of scope."*
4. Render via `docx` (Node), validate, convert to PDF via LibreOffice, rasterize each page and QA-review for layout/overflow.
5. Write final files to `/mnt/documents/`:
   - `Jackpot_Engine_PM_Compliance_Brief_v3.docx`
   - `Jackpot_Engine_PM_Compliance_Brief_v3.pdf`
6. Surface both as `<presentation-artifact>` tags.

No application code changes. Deliverable is the document only.
