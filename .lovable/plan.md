# Community Payout / Shared Win — End-to-End

Wire a Community Win Mechanics block in the creator form, persist it through the master payload + sessionStorage, apply community-split math when a win drops, and surface the split in the sandbox win UI.

## 1. Creator Form — new "Community Win Mechanics" section

In `src/components/jackpot/JackpotCreationForm.tsx`, add a new `communityWinSection` rendered immediately below the asset eligibility panel (i.e. directly after `{eligibilitySection}` and before `{overlappingSection}` in all three render paths: classic, must-drop, frequency).

Controls inside the section:
- Toggle: **Enable Community Payout Split** (reuses existing `isCommunity` state).
- Conditionally revealed when ON:
  - **Community Split Percentage** — slider 1–100, bound to existing `communitySplit` state (maps to schema `split`).
  - **Activity Lookback Window (Seconds)** — number input, new state `communityLookbackSeconds` (maps to `payoutInterval`).
  - **Maximum Payout Cap Per Member** — currency number, new state `communityMaxWinAmount` (maps to `maximumWinAmount`).
  - **Maximum Qualified Players** — number, new state `communityMaxPlayers` (maps to `maximumNumberOfPlayers`).

Note: the existing duplicate community fields buried inside the Widget Configuration panel (around lines 2480–2620 and 3650–3790) are removed so this new section is the single source of truth.

## 2. Payload + sessionStorage

Extend `JackpotSavePayload` with a `community` block and serialize it in the save handler:

```ts
community: {
  enabled: boolean;
  split: number;                  // %
  payoutInterval: number;         // seconds
  maximumWinAmount: number;       // per-member cap
  maximumNumberOfPlayers: number; // dilution cap
}
```

In `src/lib/jackpot/build-create-body.ts`, attach the block under `config.community` inside `buildTriggerCondition`. Rehydrate the same fields from `sessionStorage` (`jackpot:pendingPayload`) alongside the ledger / weight / eligibility blocks already persisted.

## 3. Engine — community distribution on win

Add a pure helper in `src/lib/jackpot/ledger.ts`:

```ts
export interface CommunityPayoutBreakdown {
  isCommunity: true;
  triggeringPayout: number;
  communityPool: number;
  communitySize: number;
  communityMemberPayOut: number;
  cappedDelta: number; // sum clipped by per-member cap
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
- If `rawShare > maximumWinAmount`: `communityMemberPayOut = maximumWinAmount`, `cappedDelta = (rawShare - maximumWinAmount) * communitySize` (logged, returned to house).

Hook this helper into the win path used by the sandbox/forced-drop flow (the `forceWin` branch in `src/routes/sandbox-demo.tsx` and any shared win-evaluation step in the simulator's per-iteration win record) so the resulting ledger entry carries:
- `isCommunity: true`
- `communitySize`
- `communityMemberPayOut`
- `triggeringPayout`

Non-community wins are untouched.

## 4. Win schema alignment

The ledger entry/`WinEventDTO` returned by the engine and the response shape from `/simulate-bet` (force-win) gain optional fields mirroring `Win.java`: `isCommunity`, `communitySize`, `communityMemberPayOut`. Existing consumers ignore them when absent.

## 5. Sandbox win UI

In `src/routes/sandbox-demo.tsx`, inside the celebration overlay (around `jooba-celebration`), when the most recent win carries `isCommunity`, render:
- Badge: `COMMUNITY PAYOUT TRIGGERED`
- Lines:
  - `Triggering Winner Payout: €X.XX`
  - `Community Split: €Y.YY distributed among Z active community players (€W.WW each)`

Use existing token classes for styling; no new design system tokens.

## Technical details

- Files touched:
  - `src/components/jackpot/JackpotCreationForm.tsx` — new section, new state, remove duplicate Widget-Config community fields, extend save payload.
  - `src/lib/jackpot/build-create-body.ts` — surface `config.community`.
  - `src/lib/jackpot/types.ts` — add `CommunityConfigDTO` + optional fields on `WinEventDTO`.
  - `src/lib/jackpot/ledger.ts` — `applyCommunityPayout` helper.
  - `src/routes/sandbox-demo.tsx` — wire forced-win community branch + celebration UI.
- No DB migration: this lives entirely in the JSONB `config` blob already persisted on `jackpots.trigger_condition`.
- No new dependencies.
