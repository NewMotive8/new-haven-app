# MultiJackpot Wizard — 3-Step Build + Hydration Extraction

## Scope

Rebuild `src/components/jackpot/MultiJackpotWizard.tsx` around a clean 3-step state machine (Master → Tiers → Launch), extract shared draft-hydration logic into `src/lib/jackpot/hydrate-draft.ts`, and add a 3-way drop style selector that lives inside the tier card only.

---

## 1. Shared utility — `src/lib/jackpot/hydrate-draft.ts`

Move the existing `sanitizeIncomingDraft` function out of `JackpotCreationForm.tsx` (currently lines 306–394) into the new file. It will export:

- `sanitizeIncomingDraft(raw)` — full Option A + Must-Drop + Frequency Happy-Hour reverse-parse, exactly as today.
- `parseFrequencyJSON(s)` — small named helper (extracted from the inline `tryParse` + `pickInterval` + `pickTime` block) so the tier card can decode a Happy-Hour window without depending on the whole sanitizer.

`JackpotCreationForm.tsx` imports `sanitizeIncomingDraft` from the new path; behavior is byte-identical. The wizard imports `parseFrequencyJSON` for tier hydration.

---

## 2. Step 1 — Master Strategy

Fields collected into `MasterDraft` state:

- `name` (required text, unique per brand — 409 surfaces inline)
- `contributionSource`: `player | house`
- `contributionType`: `percentage | fixed`
- `masterContributionValue` (single input; `%` suffix when percentage, currency prefix when fixed)
- Game assignment via the existing `GameAssignmentStep` component (categories + game IDs).

**Save action:** `POST /api/v1/jackpot-groups` with the master draft and `status: "draft"`. On success, store returned `groupId` in wizard state and advance to Step 2. On 409, show inline duplicate-name error and stay on Step 1.

---

## 3. Step 2 — Tier Allocation Ladder

### Layout

- Sticky top: horizontal progress bar showing `Σ splitShare`. Green at exactly `100.00%`, red otherwise, with the live numeric delta (e.g. `87.50% / 100.00% — 12.50% remaining`).
- Read-only master recap chip row (name, source, type, value, game count).
- Sorted vertical list of saved tiers themed by rank: Bronze / Silver / Gold / Platinum (rank 1 → 4+). Each row shows name, rank badge, split %, seed, trigger summary, edit/delete.
- "Add New Tier" button reveals an inline **Draft Tier Card**.

### Draft Tier Card — curated fields only

Group A — Identity
- Tier Name (text + preset chips: Mini / Minor / Major / Grand)
- Rank (numeric)

Group B — Allocation & Fuel
- Initial Seed Amount
- Re-seeding Amount  *(new on `ChildDraft`)*
- Tier Split Share `%`
- Derived rate preview (read-only): `master.value × splitShare / 100`

Group C — Drop Style (3-way card selector, tier-card-local component)
- **Pure Chance Roll** → logarithmic interval slider + pacing badges (reuse the helpers already in `JackpotCreationForm`).
- **Hype Curve Engine** → win boundary + drop pacing inputs.
- **Happy Hour** → calendar window (interval, day, contrib/win start+end times), decoded via `parseFrequencyJSON` when editing.

Group D — Tier Safeguards (optional)
- Max Number of Wins
- Max Total Payout

Master-inherited fields (games, contribution source/type/value, wager eligibility) are NOT rendered.

### Tier save

Two-call sequence on Save Tier:
1. `POST /api/v1/jackpots` with the child payload (name, seedAmount, reseedingAmount, triggerCondition derived from the selected drop style, maxNumberOfWins, maxTotalPayout, splitShare, tierRank, empty game arrays — they inherit from group).
2. `POST /api/v1/jackpot-groups/:groupId/children` mapping the returned child id under the group.

Validation: tier saves skip the single-jackpot form's strict `recurrenceType` / Happy-Hour cross-field loops — the curated subset is the source of truth and is persisted directly into `trigger_condition`.

### Step gate

"Continue to Launch" enables only when `tiers.length ≥ 1` AND `Σ splitShare === 100.00` (compared on integer cents to avoid float drift).

---

## 4. Step 3 — Launch Gate

Read-only review:
- Master Strategy panel (name, source, type, value, assigned game count).
- Sorted tier ladder (rank, name, split%, seed, reseed, trigger mechanic summary, safeguards, derived rate).
- Prominent green confirmation badge: `Splits aligned — 100.00%`.

**Activate MultiJackpot** button → `POST /api/v1/jackpot-groups/:id/status` with `{ status: "active" }` → navigate to `/admin/jackpot-groups` on success. Toast + stay on Step 3 on failure.

---

## Technical notes

### Wizard state shape

```text
WizardState
├── step: 1 | 2 | 3
├── groupId: number | null
├── master: MasterDraft
└── tiers: ChildDraft[]      // sorted by rank for display

ChildDraft (curated)
├── id, name, rank, splitShare, seedAmount, reseedingAmount
├── triggerModel: 'pure_chance' | 'hype_curve' | 'happy_hour'
├── pureChance:  { spinsInterval }
├── hypeCurve:   { minBoundary, maxBoundary, dropPacing }
├── happyHour:   { interval, day, contribStart, contribEnd, winStart, winEnd, cloneContribToWin }
├── maxNumberOfWins?: number
└── maxTotalPayout?: number
```

### Files touched

- **New:** `src/lib/jackpot/hydrate-draft.ts` (extracted sanitizer + `parseFrequencyJSON`).
- **Edit:** `src/components/jackpot/JackpotCreationForm.tsx` — remove local `sanitizeIncomingDraft`, import from new path. No other behavior change. Drop style selector stays 2-way here.
- **Rewrite:** `src/components/jackpot/MultiJackpotWizard.tsx` — replace current implementation with the 3-step machine + tier-card-local 3-way drop style selector built inline (no shared selector component, per your choice).
- **Edit:** `src/routes/api/v1/jackpot-groups/index.ts` and `src/routes/api/v1/jackpot-groups/$id.children.ts` — verify they accept the per-child `triggerCondition`, `maxNumberOfWins`, `maxTotalPayout`, `reseedingAmount`. Patch only if a field is missing.

### Out of scope (this turn)

- Editing already-activated groups.
- Per-tier game overrides.
- Bulk tier import.
- Lifting the 3-way selector into a shared component (explicitly declined — tier-card-local only).
