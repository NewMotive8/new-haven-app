## Plan

Cross-cutting fix — no jackpot-specific patching. Same code path used by every brand, every jackpot, every save.

1. Fix the save round-trip so configured fields stop getting lost (all jackpots)
- On every create and update, persist the full wizard payload into `trigger_condition`: `_draft`, `type`, `payoutModel`, `pool`, `seed` (including min/max caps), `engineV2` (split + triggerOdds), `prizeEconomy`, `eligibility`, `community`, `recurrence`, `widget`, win caps/floors (`maxWinAmount`, `minWinAmount`, `fixedWinAmount`), `volatility`, `description`.
- On update, deep-merge into the existing JSONB blob — never replace it with a partial object. A PUT that only carries `threshold` or only carries `engineV2` must keep all other config keys intact.
- Make `dto-to-payload` hydrate every wizard field from persisted config (prefer `_draft`, then structured config, then sane defaults) so reopening any saved jackpot shows exactly what was saved — no spurious zeros on `maxWinAmount`, `minWinAmount`, weights, payoutModel, type, etc.
- Confirm the wizard PUT sends the full payload on edit (not a partial diff) and that `buildCreateBody` includes all evaluation-relevant fields in the body.

2. Fix the DTO-to-engine mapping used by live `/demo` bets (all jackpots)
- Update `inlineConfigFromDto` to stop hardcoding `CLASSIC + AVERAGE`. Map persisted config into real engine fields for every jackpot:
  - structural type (`classic` / `must_drop` / `frequency`)
  - payout model (`maximum` / `average`)
  - `maximumWinAmount` / `minimumWinAmount` / `fixedWinAmount`
  - timed config for must-drop / frequency
  - 3-way contribution split + `triggerOdds`
- Source these from the stable persisted config, with `_draft` only as a fallback.

3. Make live `/api/v1/event/bet` use the same engine rules as the simulator (all jackpots)
- Replace the `readTriggerProbability` + random compare shortcut with the shared engine evaluation used by the simulator, so live bets respect max-win caps, must-drop behavior, payout gates, and trigger odds the same way the simulator does.
- Apply consistently to the single-jackpot path and the grouped-jackpot path so `/demo` and admin simulation always agree, for every jackpot.

4. Backfill: one-time, generic rehydration of already-saved rows
- For every existing `jackpots` row whose `trigger_condition` is missing `_draft` but whose audit log contains a prior full payload, replay the most recent good audit `after_state` / `delta.config` to repopulate the JSONB. Same rule for every row — no name-based special cases.
- Rows that have never had a full payload are left as-is; the new save path will fill them on the next edit.

5. Verify end-to-end (sampled across several jackpots, not only "Erez test 6")
- Edit + save several jackpots of different types (classic, must-drop, with/without community, with/without eligibility). Re-open each → all fields show the configured value.
- Re-query each DB row → `trigger_condition` contains the full config blob.
- Spin in `/demo` for each → outcomes match configured rules (caps, must-drop, trigger odds).
- Run a deterministic test against `/api/v1/event/bet` for a few configs and confirm contributions + win evaluation match the simulator.

## Technical details
Files in scope (single shared code path for every jackpot):
- `src/lib/jackpot/store.server.ts` — `updateJackpot`, `createJackpot` (deep-merge persistence, no partial overwrites).
- `src/lib/jackpot/build-create-body.ts` — `buildCreateBody` / `buildTriggerCondition` (ensure all evaluation-relevant fields are emitted).
- `src/lib/jackpot/dto-to-payload.ts` — hydration defaults aligned with the full saved shape.
- `src/routes/api/v1/event/bet.ts` — `inlineConfigFromDto` + win evaluation share the simulator engine.
- Wizard PUT call site — confirm full payload on edit.

Backfill is a generic SQL pass over `jackpots` + `admin_audit_log`, applied to every row that qualifies. No hardcoded ids or names anywhere in code or migration.