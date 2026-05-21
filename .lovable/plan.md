Phase 3 — Immutable Audit Ledger

Append every successful S2S bet transaction to an in-memory, capped, read-only audit log and expose it as a live compliance grid in the sandbox dashboard.

## Approach

A single ring-buffer `jackpot_ledger_logs: AuditEntry[]` lives at module scope in `src/routes/api/v1/event/bet.ts`. It is only mutated by the `POST /api/v1/event/bet` handler, only on a successful run (after the Phase 2 handshake passes, the body validates, and a non-replay response is produced). A new `GET /api/v1/event/bet/ledger` handler on the same file route exposes the most recent entries to the sandbox (public read, no internal-secret gate, consistent with the "public widget read paths stay unauthenticated" decision from Phase 2). The sandbox polls it every 2s and pins newest rows to the top.

The append is a single push + slice — never an in-place edit of prior entries — so the log behaves as append-only from the caller's perspective.

## Files to touch

- `src/routes/api/v1/event/bet.ts` — define `AuditEntry`, the capped buffer, an `appendAudit()` helper, the `GET .../ledger` handler, and wire `appendAudit` into both success branches (single-jackpot + multi-campaign router) right before each `rememberTransaction(...)` / `return json(response)`. Idempotent replays are NOT re-logged (the original entry is the canonical record).
- `src/routes/sandbox-demo.tsx` — add a "Compliance Audit Ledger (GLI-12 Log)" section under the existing tester output, polling `/api/v1/event/bet/ledger` every 2s, rendering a scannable table with newest-first ordering.

Out of scope: `simulate.ts`, `simulate-bet.ts`, `/jackpots/*`, the ledger module, the creator form, persistence (DB-backed audit trail is a later phase).

## Technical detail

### 1. Audit entry shape

```ts
type AuditSlice = { pool: number; seed: number; house: number };

type AuditEntry = {
  loggedAt: string;            // ISO timestamp, server-side
  transactionId: string;
  brandId: string;
  gameId: string;
  playerSegments: string[];
  playerId: string | null;
  wager: number;
  rngSource: "external" | "local";
  // Aggregated contribution slice (sum across all matched campaigns
  // for the multi-router; the single-campaign slice for the legacy path).
  contribution: AuditSlice;
  totalContribution: number;
  // Per-jackpot breakdown when the multi-campaign router ran; null for
  // the legacy single-config path so the auditor can see routing detail.
  perJackpot:
    | Array<{
        jackpotId: number;
        jackpotName: string;
        routing: "split" | "additive";
        contribution: AuditSlice;
        totalContribution: number;
      }>
    | null;
  // Inline win object when a drop triggered; null otherwise.
  win: Record<string, unknown> | null;
};
```

### 2. Capped append-only buffer

```ts
const AUDIT_MAX = 200;
const jackpot_ledger_logs: AuditEntry[] = [];

function appendAudit(entry: AuditEntry) {
  jackpot_ledger_logs.push(entry);
  if (jackpot_ledger_logs.length > AUDIT_MAX) {
    jackpot_ledger_logs.splice(0, jackpot_ledger_logs.length - AUDIT_MAX);
  }
}
```

Module-scope, per-Worker-instance. Same caveat as the dedupe cache: not cluster-wide. Acceptable for the sandbox; flagged for a future DB-backed phase.

### 3. Wiring into `bet.ts`

In each of the two success branches, immediately before `rememberTransaction(body.transactionId, response)` and the final `return json(response)`:

```ts
appendAudit({
  loggedAt: new Date().toISOString(),
  transactionId: body.transactionId,
  brandId: brand,
  gameId: body.gameId,
  playerSegments: body.playerSegments,
  playerId: body.playerId ?? null,
  wager,
  rngSource,
  contribution: {
    pool: /* response.contribution.pool */,
    seed: /* response.contribution.seed */,
    house: /* response.contribution.house ?? response.house */,
  },
  totalContribution: /* response.totalContribution */,
  perJackpot: /* multi-path: mapped slim view; single-path: null */,
  win: response.win,
});
```

The empty-multi response (no matched campaigns) is NOT logged — there is no pool movement to audit.

Idempotent replays return early without calling `appendAudit`, so the log stays append-only and free of duplicate rows.

### 4. Read endpoint

```ts
GET: async ({ request }) => {
  const blockedBrand = requireBrandId(request);
  if (blockedBrand instanceof Response) return blockedBrand;
  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 1),
    AUDIT_MAX,
  );
  const entries = jackpot_ledger_logs
    .filter((e) => e.brandId === blockedBrand)
    .slice(-limit)
    .reverse(); // newest first
  return json({ entries, total: entries.length, cap: AUDIT_MAX });
},
```

Brand-scoped read (re-uses `requireBrandId`) so a sandbox running brand "1" can't see other brands' rows. No internal-secret gate — matches the "public ticker / widget reads stay unauthenticated" rule.

Mounted as a sibling file route `src/routes/api/v1/event/bet.ledger.ts` (TanStack flat dot routing → `/api/v1/event/bet/ledger`). Keeping it in its own file avoids tangling GET/POST handlers on the same route file and keeps the buffer importable from one place: the new file imports `jackpot_ledger_logs` and `AUDIT_MAX` exported from `bet.ts`.

### 5. Sandbox UI

New section under the existing Tester output, above or beside the response preview:

- Heading: "Compliance Audit Ledger (GLI-12 Log)"
- Sub-line: live count vs cap, e.g. `27 / 200 entries · newest first`
- Table columns: Time (HH:MM:SS.mmm) · Txn ID (mono, truncated middle, full on hover) · Game · Segments · Wager · Pool Δ · Seed Δ · House Δ · Total · Win
- Currency formatting uses `Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 6 })` so a 0.0245 slice renders as `€0.0245`, not `€0.02`. No rounding for display.
- Win column shows `—` when null, otherwise a small badge with the amount + a `community` chip when `isCommunity`. Hover/expand reveals the per-jackpot breakdown for that row.
- Polling: `useEffect` interval at 2000ms hitting `/api/v1/event/bet/ledger?limit=200` with the existing `headers()` helper. Cleared on unmount and brand-id change.
- Newest row gets a one-second `bg-emerald-500/10` flash class via `useRef` + comparing the most recent `transactionId` across polls — purely visual, no business logic.

## Out of scope

- DB-backed durable audit storage (separate phase).
- Cryptographic chaining / hash-linked rows (a real GLI-12 implementation would; flagged for future work).
- CSV / JSON export from the UI.
- Filtering or full-text search in the grid (basic chronological view only).
- Auth on the ledger read endpoint beyond brand scoping.