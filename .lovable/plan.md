# Player Targeting & Restrictions Panel

Add a new "Player Targeting & Restrictions" block in `JackpotCreationForm.tsx`, rendered directly below the existing game `eligibilitySection`, at all three render sites (lines ~1578, ~2559, ~3972).

## UI

- **Target Audience toggle** (segmented control): `All Public Players` (default) | `Custom Target Segments & Restrictions`.
- When set to "All Public Players", sub-panels stay collapsed and no targeting payload is emitted.
- When set to "Custom...", expand into a 2-column responsive grid (stacked on mobile):

**Left column — Inclusions (white-list)**
- Target VIP Tiers — multi-select chips: Bronze, Silver, Gold, Platinum.
- Target CRM Segments — tag-input (comma/enter to add, chip remove).

**Right column — Exclusions & Restrictions (black-list)**
- Exclude CRM Segments — multi-select chips from a preset list (Bonus Abusers, High-Risk Flags, Self-Excluded, Chargeback History).
- Restricted Countries (GEO) — searchable multi-select of ISO-3166 alpha-2 codes (filterable text input + chip list of selections).
- Blacklisted Player IDs — `<textarea>` for comma-separated tokens.

Reuses existing `BrightLabel`, `bg-neutral-900`, `border-neutral-700` styling tokens for consistency with the eligibility section.

## State

New local state inside the form component:
- `audienceMode: 'all' | 'custom'` (default `'all'`)
- `vipTiers: string[]`
- `crmSegmentsInclude: string[]`
- `crmSegmentsExclude: string[]`
- `restrictedCountries: string[]`
- `blacklistedIdsRaw: string` (parsed on save)

All initialized from `initial?.eligibility?.players` when editing.

## Payload Contract

Extend `JackpotSavePayload['eligibility']` with a sibling `players` block:

```ts
eligibility?: {
  vertical: 'casino' | 'sportsbook';
  casino?: { ... };
  sportsbook?: { ... };
  players?: {
    audienceMode: 'all' | 'custom';
    vipTiers: string[];
    crmSegmentsInclude: string[];
    crmSegmentsExclude: string[];
    restrictedCountries: string[];
    blacklistedPlayerIds: string[];
  };
};
```

`buildEligibility()` returns the `players` branch only when `audienceMode === 'custom'`; otherwise `{ audienceMode: 'all' }` so the backend router can short-circuit.

## Persistence

- `buildPayload()` already serializes `eligibility` into the payload that's saved to `sessionStorage` for the simulator handoff — the new `players` field rides along automatically.
- `build-create-body.ts → buildTriggerCondition()` already maps `payload.eligibility` into `config.eligibility.games`; no change needed (the block contains both `games` metadata and `players` metadata under one umbrella). If a clearer split is preferred, we can rename to `config.eligibility` carrying the full object — flagged for confirmation.

## Out of Scope

- No backend router math changes — this is metadata-only.
- No new dependencies; country list ships as an inline constant of ISO codes + display names.
- No CRM/VIP data fetch — preset values are hard-coded for now and can be wired to live sources later.
