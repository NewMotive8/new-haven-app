## Goal

Build the backend endpoints the React frontend expects, replacing the original Spring Boot service. Use TanStack Start **server routes** (file-based, under `src/routes/api/v1/...`) with an in-memory mock store keyed by `brandId` for multi-tenancy. No database yet — this is a mock layer so the frontend tables can fetch data immediately.

## Types (src/lib/jackpot/types.ts)

```ts
export interface JackpotDTO {
  id: number;
  name: string;
  enabled: boolean;
  poolBalance: number;       // was BigDecimal
  seedAmount: number;        // was BigDecimal
  contributionRate: number;  // was BigDecimal (0..1)
  triggerThreshold: number;  // was BigDecimal
  brandId: string;
  createdAt: string;         // ISO-8601 (was Instant)
  updatedAt: string;         // ISO-8601 (was ZonedDateTime)
}

export interface TopupDTO {
  jackpotId: number;
  amount: number;
  backofficeUser: string;
  isSeed: boolean;
}

export interface SimulatorDTO {
  jackpotId: number;
  iterations: number;
  wager: number;
  rngSeed?: number;
}
```

## Mock store (src/lib/jackpot/store.server.ts)

- Module-level `Map<brandId, Map<id, JackpotDTO>>` seeded with ~3 sample jackpots per brand on first access.
- Helpers: `list(brandId, filterExp?)`, `get(brandId, id)`, `create(brandId, dto)`, `update(brandId, id, dto)`, `remove(brandId, id)`, `setEnabled(brandId, id, enabled)`, `topup(brandId, dto)`.
- `filterExp`: simple `field=value` substring match across `name`/`enabled`; safe fallback when empty.
- All numeric fields stored/returned as `number`; all timestamps as ISO strings via `new Date().toISOString()`.

## Shared route helpers (src/lib/jackpot/http.ts)

- `requireBrandId(request) -> string` (reads `brandId` header, 400 if missing).
- `CORS_HEADERS` + `json(data, init?)` wrapping responses with CORS + `Content-Type: application/json`.
- `OPTIONS` handler factory for preflight.

## Routes

All under `src/routes/api/v1/`. Each file exports `Route = createFileRoute(...)({ server: { handlers: { ... } } })` with `OPTIONS` + the listed verbs. Every handler reads `brandId` via `requireBrandId`.

### Group 1 — `src/routes/api/v1/jackpots/`
- `index.ts` → `GET /api/v1/jackpots?filterExp=` (list) and `POST /api/v1/jackpots` (create).
- `$id.ts` → `GET`, `PUT`, `DELETE` for `/api/v1/jackpots/:id`.

### Group 2 — state management
- `enable.$id.ts` → `GET /api/v1/jackpots/enable/:id` → sets `enabled=true`, returns DTO.
- `disable.$id.ts` → `GET /api/v1/jackpots/disable/:id` → sets `enabled=false`, returns DTO.
- `topup.ts` → `POST /api/v1/jackpots/topup` with `TopupDTO` body. If `isSeed=true` adds to `seedAmount`; always adds to `poolBalance`. Returns updated DTO.

### Group 3 — simulation engine, `src/routes/api/v1/event/`
- `simulate.ts` → `POST /api/v1/event/simulate` with `SimulatorDTO` body. Runs a deterministic mock loop returning `{ iterations, totalWagered, totalContributed, hits, finalPool }`.
- `simulate-bet.ts` → `POST /api/v1/event/simulate-bet?iterations=&wager=` with `JackpotDTO` body. Returns per-iteration summary `{ contributions, hits, finalPool, sample: [...] }`.

Simulation math (mock): per iteration, `contribution = wager * contributionRate`; random hit when `poolBalance + contribution >= triggerThreshold` and `Math.random() < 0.01`; on hit, reset pool to `seedAmount`.

## Conventions enforced
- `brandId` header required on every route (400 otherwise).
- All response numbers are plain JS `number`; all timestamps ISO-8601 strings.
- CORS headers included on every response (incl. errors) and an `OPTIONS` handler on every file.
- No `createServerFn` used here — these are external-style REST endpoints, so file-based server routes are the right shape.

## Out of scope (this round)
- Persistence (Lovable Cloud / Supabase) — can be layered in later by swapping the store module.
- Auth — endpoints are open; add later if needed.
- Frontend wiring — no React/UI changes; ready for the existing tables to fetch.

## After implementation
I'll invoke `GET /api/v1/jackpots` with a sample `brandId` header to confirm the routes respond before handing back for frontend testing.
