
# Option A — Strict Mutually Exclusive Jackpot Modes

Goal: make Single Jackpot mode + Contribution Type drive what fields exist, both visually and in the payload that hits the API. Forbidden combinations get rejected before they reach the engine.

## 1. Mode matrix (new contract)

| Mode | Trigger Probability (N) | Min/Max Win | Max # Wins | Max Total Payout | Scheduling (start/end + recurrence) | Min/Max Wager |
|---|---|---|---|---|---|---|
| **Classic Progressive** (fixed-odds) | required | hidden + nulled | hidden + nulled | hidden + nulled | start/end only | per Contribution Type (rule 2) |
| **Must-Drop** (value-driven) | hidden + nulled | shown | shown | shown | start/end + must-drop recurrence | per Contribution Type (rule 2) |
| **Frequency** (time-driven) | hidden + nulled | hidden + nulled | hidden + nulled | hidden + nulled | full frequency schedule | per Contribution Type (rule 2) |

`payoutModel` (fixed / average / maximum) is removed from Classic (it only made sense alongside a target win amount, which is gone). It stays inside Must-Drop and Frequency.

## 2. Contribution Type matrix

| Contribution Type | Min Wager | Max Wager |
|---|---|---|
| `percentage` | shown | shown |
| `fixed` (side bet) | hidden + nulled | hidden + nulled |

Applies in all three modes, everywhere wager limits currently render (classic payoutModel branches, must-drop section, frequency section).

## 3. Frontend changes — `src/components/jackpot/JackpotCreationForm.tsx`

### 3a. State + lift the missing caps
- Promote currently-uncontrolled inputs to state: `maxNumberOfWins: number`, `maxTotalPayout: number`. Add to `JackpotSavePayload` and to the `onSave` payload assembly (~line 590).
- Wire the existing `triggerOdds` state to be **set to 0** whenever `selectedType` is `must_drop` or `frequency` (via a `useEffect` on `selectedType`).
- On mode change, also reset: `minWinAmount`, `maxWinAmount`, `maxNumberOfWins`, `maxTotalPayout` when leaving Must-Drop; reset `triggerOdds` when leaving Classic.
- On `contributionType` change to `fixed`, reset `minWagerAmount` and `maxWagerAmount` to 0.

### 3b. Classic Progressive section (lines ~1628–2710)
- Remove the `payoutModel` RadioGroup and all three `payoutModel === 'fixed' | 'average' | 'maximum'` blocks — they carry Min/Max Win and target-amount inputs that no longer belong to Classic.
- Remove the Scheduling sub-card holding `max-wins` (line 2483) and `max-payout` (line 2499) inputs from the Classic section.
- Keep: name/description, contribution setup, eligibility, community, **triggerProbabilitySection**, player targeting, widget, start/end dates (only).
- Add a prominent `Alert` / callout above `triggerProbabilitySection` (or as its lead-in card):
  > **Fixed-odds mode pays the full pool balance on each trigger. Win amount caps and lifetime budget limits are completely disabled to guarantee math alignment, prevent silent engine rejections, and meet regulatory compliance standards.**

### 3c. Must-Drop section (lines ~2711–3739)
- Remove `{triggerProbabilitySection}` from this branch (line ~3550).
- Move the **Maximum Number of Wins** and **Maximum Total Payout Amount** inputs into Must-Drop's scheduling/budget card, bound to the new state.
- Keep `payoutModel` + Min/Max Win here.

### 3d. Frequency section (lines ~3772+)
- Remove `{triggerProbabilitySection}` from this branch (line ~4723).
- Remove any Min/Max Win, Max #Wins, Max Total Payout inputs that exist in the frequency tree (audit and strip — they're forbidden in this mode).
- Keep target deadline / recurrence scheduling.

### 3e. Wager visibility (rule 2)
- In every place a `Minimum Wager Amount` / `Maximum Wager Amount` input renders (Classic payoutModel branches were removed, but the Must-Drop and Frequency renders at lines ~1775, 1873, 3912, 3924, etc. still exist), wrap with `{contributionType === 'percentage' && (...)}`. The existing `contributionType === 'percentage' ? ... : ...` ternaries (lines 1992, 2838) need their `:fixed` branch to not render wager inputs.

### 3f. Payload assembly (~line 590)
Strip forbidden fields before calling `onSave` so the backend receives a clean payload:
```ts
const payload: JackpotSavePayload = {
  ...base,
  // Mode-gated nulling
  triggerOdds: selectedType === 'classic' ? triggerOdds : 0,
  minWinAmount: selectedType === 'must_drop' ? minWinAmount : 0,
  maxWinAmount: selectedType === 'must_drop' ? maxWinAmount : 0,
  maxNumberOfWins: selectedType === 'must_drop' ? maxNumberOfWins : 0,
  maxTotalPayout: selectedType === 'must_drop' ? maxTotalPayout : 0,
  // Contribution-type-gated nulling
  minWagerAmount: contributionType === 'percentage' ? minWagerAmount : 0,
  maxWagerAmount: contributionType === 'percentage' ? maxWagerAmount : 0,
  payoutModel: selectedType === 'classic' ? undefined : payoutModel,
};
```

## 4. Backend payload validation — `src/lib/jackpot/build-create-body.ts`

Add `validateModeExclusivity(p)` called from `buildCreateBody` alongside `validateSplitWeights`. Throws `Error` (caller surfaces via toast) when any of:

- `type === 'classic'` AND any of `minWinAmount > 0`, `maxWinAmount > 0`, `maxNumberOfWins > 0`, `maxTotalPayout > 0`, `payoutModel != null`.
- `type === 'must_drop'` AND `triggerOdds > 0`.
- `type === 'frequency'` AND any of `triggerOdds > 0`, `minWinAmount > 0`, `maxWinAmount > 0`, `maxNumberOfWins > 0`, `maxTotalPayout > 0`.
- `contributionType === 'fixed'` AND any of `minWagerAmount > 0`, `maxWagerAmount > 0`.
- `type === 'classic'` AND `(triggerOdds ?? 0) <= 0` → require a positive denominator.

Error messages name the offending field + mode, e.g. `"Classic Progressive jackpots cannot define maxWinAmount — fixed-odds mode pays the full pool."`

Mirror the same checks in `src/lib/jackpot/payload-to-config.ts` (the inverse mapper) so reloading a draft can't smuggle forbidden combos back into state.

## 5. Type updates — `JackpotSavePayload`

Add to the exported type in `JackpotCreationForm.tsx`:
```ts
maxNumberOfWins?: number;
maxTotalPayout?: number;
payoutModel?: PayoutModel;  // already there — make optional
triggerOdds?: number;        // already optional
```

## 6. Files touched

- `src/components/jackpot/JackpotCreationForm.tsx` — state, conditional rendering, callout, payload assembly, wager guards.
- `src/lib/jackpot/build-create-body.ts` — `validateModeExclusivity`.
- `src/lib/jackpot/payload-to-config.ts` — symmetric guard on inbound config.
- No DB migration; `jackpots.trigger_condition` is `jsonb` and the engine already reads `engineV2.triggerOdds`.

## 7. Out of scope

- MultiJackpot wizard (`MultiJackpotWizard.tsx`) — unchanged; its tier-level triggerProbability is independent.
- The legacy multi-level branch inside `JackpotCreationForm.tsx` — already gated by `selectedType === 'multi_level'` and not part of the three Single modes.
- No styling refactor beyond adding the compliance callout (uses existing `Alert` component / neutral card styling).

