## Root cause

`/demo` spins go through `/api/v1/event/bet`, which calls `inlineConfigFromDto()` to build the contribution math from `jp.contributionRate` and `config.engineV2`. For jackpot 19 ("Erez test 6"), the DB row currently has:

- `contribution_percentage = 0`
- `trigger_condition = {"threshold": 2}` (no `engineV2`, no `pool`, no `seed`, no `eligibility`)

So the bet routes correctly (we fixed `assigned_categories` last turn), but every slice is 0 → green "Spin processed · Pool +€0 · Seed +€0 · House +€0".

The audit log shows the regression clearly:

```
09:12:00  engineV2 = {split 50/35/15, fixed 1}, rate = 0.03   ← good
09:12:33  engineV2 = NULL,                       rate = 0     ← wiped
... all subsequent updates: same wiped state
```

Every subsequent admin save replaced the full JSONB config with `{threshold: N}` and zeroed the contribution rate.

### Why it happens

In `src/lib/jackpot/store.server.ts` → `updateJackpot()`:

```ts
if (dto.triggerThreshold !== undefined)
  patch.trigger_condition = { threshold: Number(dto.triggerThreshold) };
```

Two problems:

1. **`dto.config` is never persisted on update.** `buildCreateBody()` produces a rich `config` (engineV2, pool, seed, eligibility, prizeEconomy, community, _draft…) and PUTs it. `updateJackpot` ignores `dto.config` entirely.
2. **`triggerThreshold` overwrites the entire JSONB column** with `{threshold: N}` instead of merging into the existing blob. Since `trigger_condition` is the same column that holds the config payload, every threshold-bearing PUT erases everything else in it.

The contribution rate also resets to 0 on those PUTs because the wizard re-derives `contributionRate` from `totalContributionAmount × poolWeight` — and on a re-save where the form hasn't fully hydrated those v2 fields from `_draft`, it computes 0.

## Plan

### 1. Fix `updateJackpot` to preserve / persist the full config (`src/lib/jackpot/store.server.ts`, ~line 271–290)

- Read `existing.config` (already loaded via `getJackpot`) as the base JSONB.
- If `dto.config` is provided, use it as the new base (this is the normal wizard PUT path — full blob from `buildCreateBody`).
- If `dto.triggerThreshold` is provided, set `threshold` on the base via shallow merge, never as a full replacement: `{ ...base, threshold: Number(dto.triggerThreshold) }`.
- Only write `patch.trigger_condition` when at least one of `dto.config` or `dto.triggerThreshold` was supplied.

Result: PUTs from the wizard carry the full engineV2 + eligibility + pool/seed blob into the DB; threshold-only callers no longer nuke siblings.

### 2. Defensive: don't zero `contributionRate` when the wizard sends 0 but a meaningful v2 split exists

In `updateJackpot`, if `dto.contributionRate === 0` AND the incoming `dto.config?.engineV2` describes a non-empty contribution (any of `totalContributionAmount`, `poolWeight`, `seedWeight`, `houseWeight` > 0), recompute it the same way `buildCreateBody` does and write the recomputed value. This stops a half-hydrated edit from silently disabling contributions. (No code change to `buildCreateBody` — single source of truth stays there; we just don't accept a regression to 0 when v2 fields are present.)

### 3. One-off DB repair for jackpot 19 ("Erez test 6")

Restore the last-known-good engineV2 + rate from the 09:12:00 audit snapshot, preserving the `assigned_categories = {Slots}` we already restored:

```sql
UPDATE jackpots
SET contribution_percentage = 0.03,
    trigger_condition = jsonb_build_object(
      'threshold', 2,
      'engineV2', jsonb_build_object(
        'contributionMode', 'split',
        'totalContributionType', 'fixed',
        'totalContributionAmount', 1,
        'poolWeight', 50,
        'seedWeight', 35,
        'houseWeight', 15,
        'triggerOdds', 0
      )
    )
WHERE id = 19 AND brand_id = '<brand>';
```

### 4. Verify

- Reload `/demo`, launch a Slots game on "Erez test 6" → green notification now shows non-zero Pool/Seed/House slices (with totalAmount=1 fixed and 50/35/15 split, a €10 spin → Pool +€0.50, Seed +€0.35, House +€0.15).
- Open "Erez test 6" in the admin wizard, save without changes → re-query `trigger_condition`; engineV2 must still be present and `contribution_percentage` must remain 0.03.
- Create a fresh jackpot, save, edit, save again → engineV2 + weights survive across PUTs.
- `bunx tsc --noEmit` passes.

## Out of scope

- Wizard hydration of all engineV2 fields from `_draft` on edit (separate hardening pass — current fix prevents the regression even if hydration is partial).
- Per-jackpot trigger probability changes.
- Multi-tier (group) child config persistence.

## Technical detail

Files touched:
- `src/lib/jackpot/store.server.ts` — `updateJackpot()` patch-building block (~lines 271–283).
- DB: `UPDATE jackpots WHERE id=19` migration (one-off repair).

No changes to `bet.ts`, `inlineConfigFromDto`, `buildCreateBody`, or the wizard. `createJackpot` already persists `trigger_condition` from `buildCreateBody`'s `config`, so no change there.
