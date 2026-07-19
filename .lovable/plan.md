## Goal
Make `/admin/jackpot-groups/$id` reuse the full **MultiJackpotWizard** (same UI as the create flow at `/admin/jackpots/new?tab=multi`), pre-hydrated with the saved group + tiers. The current compact editor is replaced.

## Changes

### 1. `src/components/jackpot/MultiJackpotWizard.tsx` — accept initial data
Add optional props:
```ts
type Props = {
  initialGroup?: JackpotGroupWithChildrenDTO;
  startAtStep?: 1 | 2 | 3;   // defaults to 1
  onExit?: () => void;       // for a "back to list" affordance in edit mode
};
```

On mount when `initialGroup` is present:
- Hydrate step‑1 state (`name`, `contributionType`, `totalContributionAmount` — invert the `/100` for percent, `playerSharePct` from `contributionSource`, `prizeEconomy` from `walletType`/`currencyId`, `assignment` from `assignedCategories`/`assignedGameIds`).
- Set `group` to the loaded DTO (skip `handleCreateGroup`).
- Map `initialGroup.children` → `SavedChild[]` (already have `poolWeight`, `seedWeight`, `houseWeight`, `splitShare`, `triggerProbability`, seed/reseed amounts on the DTO) and set `savedChildren`.
- Jump to `startAtStep ?? 2`.

Keep every other behaviour identical — tier CRUD uses the existing endpoints, activate/save flows are unchanged.

### 2. `src/routes/admin.jackpot-groups.$id.tsx` — swap body for wizard
Replace the entire editor body (`<Card>` header + Master Funding + tier table) with:
- Keep the top back‑link, `<StatusPill>`, active‑lock banner, and the Activate / Disable / Clone / Delete buttons (they're group‑level actions, not tier config).
- Below that render `<MultiJackpotWizard initialGroup={group} startAtStep={2} />` inside a `fieldset disabled={isActive}` so the whole surface locks while the group is active.
- Drop `saveProfile`, the local draft state (`draftName`, `draftSource`, etc.), and the shares/tier UI — the wizard now owns them.

### 3. Route in `admin.jackpots.new.tsx`
No change — it already renders `<MultiJackpotWizard />` without props, so the new-create path stays step‑1‑first.

## Notes
- No API changes. `/api/v1/jackpot-groups/$id` (GET) already returns `children` with the fields the wizard needs.
- Tier edits inside the wizard hit the same PUT `/api/v1/jackpots/$id` + POST `/api/v1/jackpot-groups/$id/children` routes used today.
- The compact editor code is removed; the wizard becomes the single source of truth for MultiJackpot editing.

## Files touched
- `src/components/jackpot/MultiJackpotWizard.tsx` (add props + hydration effect, ~40 lines)
- `src/routes/admin.jackpot-groups.$id.tsx` (rewrite the body around the wizard, net simpler)