# Community Payout / Shared Win — End-to-End

Reuse the existing Community panel UI (toggle → Community Split slider with Winner/Community labels → Payout Interval segmented options → Maximum Win Amount → Maximum Number Of Players) as-is. Lift it out of the Widget Configuration panel into a dedicated "Community Win Mechanics" section directly below the asset eligibility panel, then wire persistence, the ledger split math, and the sandbox win UI on top of it.

## 1. Creator Form — relocate the existing Community panel

In `src/components/jackpot/JackpotCreationForm.tsx`:

- Extract the existing Community block (currently nested inside Widget Configuration around lines ~2480–2620 for classic / ~3650–3790 for must-drop) into a shared `communityWinSection` JSX const, keeping all current controls, classes, and state bindings (`isCommunity`, `communitySplit`, `payoutInterval`, plus the existing Maximum Win Amount and Maximum Number Of Players inputs).
- Render `{communityWinSection}` immediately after `{eligibilitySection}` and before `{overlappingSection}` in all three render paths (classic, must-drop, frequency).
- Remove the now-duplicated copies from inside the Widget Configuration panels so it appears in exactly one place.
- Header label for the new section wrapper: "Community Win Mechanics" (uses the same panel chrome as the neighbouring eligibility/overlapping sections).

No new UI controls are introduced; the existing Community panel from the screenshot is the canonical UI.

## 2. Payload + sessionStorage

Extend `JackpotSavePayload` with an explicit `community` block sourced from the existing state:

```ts
community: {
  enabled: boolean;              // isCommunity
  split: number;                 // communitySplit[0]
  payoutInterval: string;        // existing value (logged_in | contributed_once | contributed_within_time)
  payoutIntervalSeconds?: number;// existing time-window input when payoutInterval === 'contributed_within_time'
  maximumWinAmount: number;      // existing Maximum Win Amount input
  maximumNumberOfPlayers: number;// existing Maximum Number Of Players input
}
```

In `src/lib/jackpot/build-create-body.ts`, attach this block as `config.community` inside `buildTriggerCondition`. Rehydrate the same fields from `sessionStorage` (`jackpot:pendingPayload`) alongside the ledger / weight / eligibility blocks already persisted.

## 3. Engine — community distribution on win

Add a pure helper in `src/lib/jackpot/ledger.ts`:

```ts
export interface CommunityPayoutBreakdown {
  isCommunity: true;
  triggeringPayout: number;
  communityPool: number;
  communitySize: number;
  communityMemberPayOut: number;
  cappedDelta: number;
}

export function applyCommunityPayout(
  winAmount: number,
  cfg: { split: number; maximumWinAmount: number; maximumNumberOfPlayers: number },
  rng?: () => number,
): CommunityPayoutBreakdown
```

Math:
- `communityPool = winAmount * split / 100`
- `triggeringPayout = winAmount - communityPool`
- `communitySize = max(1, floor(rng() * maximumNumberOfPlayers) + 1)`
- `rawShare = communityPool / communitySize`
- If `maximumWinAmount > 0` and `rawShare > maximumWinAmount`: cap `communityMemberPayOut = maximumWinAmount`, `cappedDelta = (rawShare - maximumWinAmount) * communitySize`.

Hook this helper into the win path used by the sandbox/forced-drop flow (the `forceWin` branch in `src/routes/sandbox-demo.tsx`) so the resulting ledger entry carries `isCommunity`, `communitySize`, `communityMemberPayOut`, `triggeringPayout`. Non-community wins are untouched.

## 4. Win schema alignment

`WinEventDTO` (and the response from `/simulate-bet` force-win path) gain optional fields mirroring `Win.java`: `isCommunity`, `communitySize`, `communityMemberPayOut`. Existing consumers ignore them when absent.

## 5. Sandbox win UI

In `src/routes/sandbox-demo.tsx`, inside the celebration overlay (around `jooba-celebration`), when the latest win carries `isCommunity`, render:
- Badge: `COMMUNITY PAYOUT TRIGGERED`
- Lines:
  - `Triggering Winner Payout: €X.XX`
  - `Community Split: €Y.YY distributed among Z active community players (€W.WW each)`

Uses existing token classes; no new design tokens.

## Technical details

- Files touched:
  - `src/components/jackpot/JackpotCreationForm.tsx` — extract & relocate the existing Community panel, extend save payload.
  - `src/lib/jackpot/build-create-body.ts` — surface `config.community`.
  - `src/lib/jackpot/types.ts` — `CommunityConfigDTO` + optional fields on `WinEventDTO`.
  - `src/lib/jackpot/ledger.ts` — `applyCommunityPayout` helper.
  - `src/routes/sandbox-demo.tsx` — wire forced-win community branch + celebration UI.
- No DB migration: data lives in the JSONB `config` blob on `jackpots.trigger_condition`.
- No new dependencies.
