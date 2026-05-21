# Phase 1 — Headless S2S Microservice Engine

Transform `/api/v1/event/bet` from a loose wager intake into a structured server-to-server transaction endpoint with idempotency, external RNG passthrough, and community-payout-aware win evaluation. Surface the new fields in `/sandbox-demo` so testers can drive the engine the same way a real S2S caller will.

## Scope

1. **Ingestion schema** — `/api/v1/event/bet` accepts a typed S2S payload.
2. **Idempotency cache** — in-memory rolling cache of `transactionId`s with replayed result.
3. **External RNG abstraction** — `systemRngValue` (0..1) bypasses the local RNG when present.
4. **Community payout math** — win evaluation routes through `applyCommunityPayout` when the campaign has community mode enabled.
5. **Sandbox UI** — new tester inputs for `transactionId`, `gameId`, `playerSegments`, and `systemRngValue`.

## Files to touch

- `src/routes/api/v1/event/bet.ts` — schema, dedupe, RNG, community wiring.
- `src/lib/jackpot/ledger.ts` — add a thin `evaluateWin` helper that accepts an injected RNG and emits community breakdown via the existing `applyCommunityPayout`.
- `src/lib/jackpot/types.ts` — add `BetEventRequestDTO` / `BetEventResponseDTO` types so callers + sandbox share one contract.
- `src/routes/sandbox-demo.tsx` — add the four tester inputs and include them in the `/api/v1/event/bet` POST body.

No DB migration, no new dependencies, no changes to the simulator engine or creator form.

## Technical detail

### 1. Request schema

Validate with a small Zod schema inside `bet.ts` (Zod is already used elsewhere). Reject with `400` on shape errors.

```ts
const BetEventSchema = z.object({
  transactionId: z.string().min(1).max(128),
  wager: z.number().positive().finite(),
  gameId: z.string().min(1).max(128),
  playerSegments: z.array(z.string().min(1).max(64)).max(32).default([]),
  systemRngValue: z.number().min(0).max(1).optional(),
  // Back-compat optional fields preserved:
  jackpotId: z.number().int().optional(),
  playerId: z.string().optional(),
  eventId: z.string().optional(),
  config: JackpotConfigSchema.optional(),
  configs: z.array(JackpotConfigSchema).optional(),
});
```

`gameId` and `playerSegments` are accepted and echoed back on the response; eligibility filtering against campaign targets is left as a no-op stub for this phase (logged in response under `matchedBy`) — full segment/game matching lands in a later phase.

### 2. Idempotency filter

Module-scope state inside `bet.ts`:

```ts
const DEDUPE_MAX = 1000;
const processedTransactions = new Map<string, { at: number; response: unknown }>();
```

On each request:
- If `processedTransactions.has(transactionId)`: return the cached response body verbatim with header `X-Idempotent-Replay: true` and HTTP `200`.
- Else compute the response, `set()` it, and if `size > DEDUPE_MAX` evict the oldest insertion-order entry (Map preserves insertion order).

Note for the user: this is per-Worker-instance memory; it satisfies the "rolling cache" requirement for sandbox/S2S verification but is not a cluster-wide guarantee. Documented in a code comment.

### 3. External RNG abstraction

Add an optional `rng?: () => number` argument to the new `evaluateWin` helper. In `bet.ts`:

```ts
const rng = typeof body.systemRngValue === "number"
  ? () => body.systemRngValue!     // deterministic single-shot
  : Math.random;
```

The win-trigger comparison consumes one `rng()` call per evaluation. When `systemRngValue` is provided we mark `rngSource: "external"` in the response so the sandbox can show it; otherwise `rngSource: "local"`.

### 4. Community payout in the ledger

`evaluateWin(cfg, ledgerEntry, rng)` returns `{ triggered: boolean; winAmount: number; community?: CommunityPayoutBreakdown }`. When `triggered` and `cfg.config.community?.enabled`, call the existing `applyCommunityPayout(winAmount, cfg.config.community, rng)` and include `isCommunity`, `communitySize`, `communityMemberPayOut`, `triggeringPayout`, `communityPool`, `cappedDelta` in the response.

Per-member cap math is already handled inside `applyCommunityPayout` (no duplication).

### 5. Response shape

```ts
{
  transactionId,
  idempotentReplay: false,
  rngSource: "external" | "local",
  processedAt,
  wager,
  gameId,
  playerSegments,
  contribution: { pool, seed, house },
  totalContribution,
  perJackpot: [...],         // unchanged multi-campaign breakdown
  win: null | {
    jackpotId,
    amount,
    isCommunity,
    communitySize?,
    communityMemberPayOut?,
    triggeringPayout?,
    communityPool?,
    cappedDelta?,
  }
}
```

### 6. Sandbox UI

In `/sandbox-demo`, next to the existing wager controls add a collapsible "S2S Tester" panel with:
- `transactionId` text input + "Generate" button (uses `crypto.randomUUID()`).
- `gameId` text input (default `"sandbox-game"`).
- `playerSegments` comma-separated text input.
- `systemRngValue` numeric input (`step=0.000001`, optional, placeholder `auto`).

These values are sent on every POST to `/api/v1/event/bet`. Render a small badge when the response sets `idempotentReplay: true`, and surface `rngSource` + the community breakdown (reusing the existing community celebration component already added in the previous phase).

## Out of scope (deferred to later phases)

- Persisted dedupe (Durable Object / DB-backed).
- Real game/segment eligibility filtering against campaign targets.
- Cluster-aware RNG audit trail.
- Auth on the S2S endpoint (HMAC signature, etc.).
