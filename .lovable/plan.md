# Phase C — Multi-Pool Widget on `/sandbox-demo`

Wire the player widget on `src/routes/sandbox-demo.tsx` to the new `perJackpot[]` response shape from `/api/v1/event/bet`, add a pool carousel, a live cumulative fee label, and a double-contribution compliance modal for additive opt-ins.

## What changes

### 1. Fetch & state
- Stop locking on a single `active` jackpot. Replace `active` with `pools: Jackpot[]` (all enabled jackpots for the brand) and `poolDisplay: Record<jackpotId, number>` so each pool tracks its own running balance.
- New state:
  - `activeIndex: number` — which pool the carousel shows.
  - `optIns: Record<jackpotId, boolean>` — per-pool opt-in. Defaults: split pools opted in, additive pools opted out (so the user has to consent).
  - `pendingOptIn: Jackpot | null` — the additive pool waiting for compliance modal confirmation.
- On every spin, POST `{ wager }` (no `jackpotId`) so the backend runs the multi-campaign router. Iterate `response.perJackpot[]` and, for each entry, only credit pools the user is opted into. Aggregate `lastSplit` from the opted-in slice.

### 2. Widget shell — carousel layout
- Inside `#jooba-widget`, when `pools.length > 1`, render the header amount + media area as a horizontal carousel:
  - Track translates `-activeIndex * 100%`; one slide per pool showing its current balance, name, and a small badge (`SPLIT` or `ADDITIVE`).
  - Left/right chevron buttons (`‹` / `›`) overlaid on the header; disabled at ends.
  - Dot pagination row beneath the media area; clicking a dot jumps to that pool.
  - Single-pool mode renders the existing layout unchanged (no chevrons, no dots).

### 3. Footer — per-pool opt toggle + cumulative fee label
- The footer opt-in/out button now toggles the **currently visible** pool's entry in `optIns`.
- Add a persistent fee label inside `#jooba-widget-footer`:
  - Compute `feePerSpin = sum(pool.contributionRate * wager for pool in opted-in pools)` (skip pools that aren't `enabled`).
  - 1 pool opted in: `Jackpot Fee: €0.05 / spin` (single value, formatted via existing `fmt`).
  - 2+ pools opted in: `Jackpot Fee: €0.08 / spin (Multi-Pool active)` with a brief CSS pulse animation on value change.

### 4. Compliance interceptor for additive opt-in
- When the user clicks Opt-In on a pool whose persisted `overlappingRule === "additive"` AND at least one other pool is currently opted in, intercept:
  - Set `pendingOptIn = pool` instead of flipping the toggle.
  - Render a modal overlay (fixed, dimmed backdrop, focus-trapped) with:
    - Title: **Double-Contribution Notice**
    - Body: "Enrolling in this additional promotional jackpot will add an independent contribution fee per bet to fund this secondary prize pool. Your new total jackpot cost will be updated to **€X.XX per spin**." — X computed live as `currentFee + pool.contributionRate * wager`.
    - Buttons: `Cancel` (clears `pendingOptIn`) and `Agree & Join Both` (commits the opt-in, clears `pendingOptIn`).
- Opting out, or opting into split pools, or being the first pool, never triggers the modal.

### 5. Reading `overlappingRule` on the client
- `/api/v1/jackpots` already returns each jackpot's `config` blob. Read `config.engineV2.overlappingRule` (default `"split"`) when classifying a pool for the badge + interceptor.

## Technical notes
- Pool carousel: pure CSS transform on a flex track, no extra deps. Animation `transition: transform 280ms ease`.
- Fee pulse: short `@keyframes` adding a 1.05 scale + accent color flash on label change (use a key on the value to remount).
- Modal: lightweight inline component in the same file (consistent with the existing widget code style); ESC + backdrop click cancel.
- Backend stays as-is — this is a pure consumer update of the response shape shipped in the previous turn.

## Out of scope
- No changes to admin form, ledger math, or DB schema.
- No persistence of opt-in state across reloads (kept session-local for the sandbox).
