# Add "Overlapping Jackpot Rule" to the Jackpot Creator

Adds a per-campaign control that decides how a single wager is charged when several active jackpots match the same spin: divide the contribution between them (Split) or charge each pool independently (Additive / "double-dip").

## Where it lives in the UI

Inside `src/components/jackpot/JackpotCreationForm.tsx`, in the Engine v2 card, **directly below the Contribution Weight (Pool / Seed / House) table**, render a new field:

- Label: **Overlapping Jackpot Rule**
- Control: native `<select>` styled to match the surrounding inputs
- Options (label → stored value):
  - `Split Mode (Divide contribution equally among matching active pools)` → `"split"`
  - `Additive Mode (Charge independent contribution fee per active pool / Double-Dip)` → `"additive"`
- Default: `"split"`
- Short helper text underneath explaining what happens when multiple jackpots overlap on a single spin.

Disabled / hidden when `contributionMode !== 'split'` (the field only makes sense in Split mode, matching the surrounding section).

## State + payload wiring

Type and state changes in `JackpotCreationForm.tsx`:

- Extend `JackpotSavePayload` with `overlappingRule?: 'split' | 'additive'`.
- Add `const [overlappingRule, setOverlappingRule] = useState<'split'|'additive'>(initial?.overlappingRule ?? 'split')`.
- Include `overlappingRule` in the object returned by `buildPayload()` (the same object that's persisted via `sessionStorage.setItem('jackpot:pendingPayload', ...)` and forwarded to `/admin/simulator` via router state — so persistence and simulator hand-off come for free).

## Persisted config shape

In `src/lib/jackpot/payload-to-config.ts`, when building the Split-mode `contribution` block, add the new field:

```ts
contribution = {
  mode: 'split',
  totalContributionAmount,
  totalContributionType,
  poolWeight, seedWeight, houseWeight,
  overlappingRule: payload.overlappingRule ?? 'split',  // NEW
}
```

In `src/lib/jackpot/build-create-body.ts`, mirror it inside the saved `engineV2` block so the value lands in the DB `trigger_condition` JSON alongside the rest:

```ts
engineV2: {
  ...,
  overlappingRule: p.overlappingRule ?? 'split',
}
```

No other code paths need to react yet — the engine consumer for overlapping campaigns is out of scope for this pass. We're only persisting the per-campaign rule so it's ready when that runtime lands.

## Technical notes

- `JackpotConfigDTO.contribution` (in `src/lib/jackpot/types.ts`) needs an optional `overlappingRule?: 'split' | 'additive'` so TS accepts the new field downstream.
- No migration: the value lives inside the existing JSON `trigger_condition.engineV2` / `contribution` blocks. Old records without the field naturally fall back to `'split'`.
- Verification: open the creator → toggle the new dropdown → click Continue. Inspect `sessionStorage['jackpot:pendingPayload']` — it should include `"overlappingRule":"additive"` (or `"split"`). After saving, the row's `trigger_condition.engineV2.overlappingRule` carries the same value.

No, no further questions on my side — proceeding.
