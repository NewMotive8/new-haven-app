# Phase 1 — Impact Analysis: Wager-Proportional Classic Jackpot Odds

This is a diagnostic report. No files will be modified. Below is the architectural impact assessment for scaling the per-spin trigger probability `p` linearly by `wager` for Classic/Fixed-Odds jackpots only.

---

## 1. Collision Check — Every `rng() < p` Site

All win evaluation in the bet engine lives in **`src/routes/api/v1/event/bet.ts`**. There are exactly **three** evaluation sites, all sharing the same shape:

| # | Path | Lines | Loop context | Source of `p` |
|---|------|-------|--------------|---------------|
| A | Group fan-out (primary live path) | **534–539** (`for (const child of ranked)` → `if (rng() < p)`) | Iterates hierarchical children of a `jackpot_group`, highest `tierRank` first | `child.triggerProbability` (column) **or** `readTriggerProbability(child)` fallback |
| B | Legacy single-jackpot path | **691–693** (`if (jpDto) { const p = readTriggerProbability(jpDto); if (rng() < p) ...}`) | Single DTO loaded by `jackpotId` | `readTriggerProbability(jpDto)` |
| C | Multi-config router (first-match) | **807–809** (`for (const jpDto of dtos)` → `if (rng() < p)`) | Iterates every enabled DTO for the brand | `readTriggerProbability(jpDto)` |

`readTriggerProbability()` itself lives at **lines 309–316** and resolves `p` from `cfg.triggerOdds` → `contributionRate` (capped at 0.05) → `0.001`.

### Classic vs. Must Drop today

**Today the engine does NOT branch on `jackpotType` at any of those three sites.** A `grep` confirms `bet.ts` contains zero references to `jackpotType`, `mustDrop`, `must_drop`, or `MUST_DROP`. The discriminator exists on the DTO:

- `src/lib/jackpot/types.ts:2` — `export type JackpotKind = "classic" | "frequency" | "must_drop"`
- `src/lib/jackpot/types.ts:17` — `jackpotType?: JackpotKind` on `JackpotDTO`
- `src/lib/jackpot/types.ts:135` — `timed?: TimedConfigDTO` (the Must-Drop time/value gate config)

So at present, all three branches treat every jackpot uniformly with a flat Bernoulli trial. The math curves for Must-Drop / Average / Maximum models live in `src/lib/jackpot/math.ts` (`calculateAverageHitChance`, `calculateMaximumHitChance`, `fixedOddsHitChance`) but are **not invoked from `bet.ts`** — the engine only consumes the `fixedOddsHitChance` semantics indirectly via `triggerProbability`.

### Isolation strategy (proposed, no code yet)

To guarantee Must-Drop logic is untouched, the scaling must be gated on the DTO's `jackpotType`. Concretely:

1. Centralize the scaling in a single helper in `bet.ts` (alongside `readTriggerProbability`), e.g. `effectiveTriggerProbability(jpDto, basePIn, wager)`, which:
   - Returns `basePIn` unchanged when `jpDto.jackpotType !== "classic"` (this covers `"frequency"`, `"must_drop"`, and any DTO that omits `jackpotType` — the safe default is "do not scale").
   - When `jpDto.jackpotType === "classic"`, returns `Math.min(1, basePIn * wager)`.
2. Replace the three `rng() < p` sites with `rng() < effectiveTriggerProbability(child|jpDto, p, wager)`.
3. **No edits to `src/lib/jackpot/math.ts`.** The Must-Drop/Average/Maximum curve functions remain byte-identical, so any future timed-branch caller is unaffected.
4. **No edits to `src/lib/jackpot/ledger.ts`** or `computeMultiCampaignLedger` — contribution math is orthogonal to win-trigger math.

This keeps the blast radius to ~3 single-line call-site edits + 1 new helper, all inside `bet.ts`.

---

## 2. Variable Verification — `wager` Availability and Type

`wager` is declared once at **`bet.ts:381`**:

```ts
const wager: number = (body.wagerAmount ?? body.wager) as number;
```

`BetEventSchema` (Zod) requires at least one of `wagerAmount` / `wager` and validates each as `z.number().positive()` (confirmed in `tests/audit/contract/schema-fuzz.test.ts`: negative `wagerAmount` → 400). By the time control reaches any of the three `rng() < p` sites, `wager` is **already in scope, already a `number`, and already validated as > 0**. No additional lookups, no destructuring, no async resolution required.

The same `wager` value is already passed into `computeBetLedger(cfg, wager)` (line 687) and `computeMultiCampaignLedger(configs, wager)` (lines 504, 803), so threading it into the new helper is a trivial in-scope reference at every site.

---

## 3. Edge-Case Risks & Defensive Handling

Even though Zod rejects bad inputs upstream, the helper should be self-defensive (the multi-config and legacy paths can in principle be re-entered with hand-crafted configs that bypass parts of the schema; defense-in-depth is cheap):

| Input | Current behavior (unscaled) | Proposed scaled behavior |
|-------|-----------------------------|--------------------------|
| `wager = 0` | Schema rejects (positive only). If somehow reached: `rng() < p` still fires with base odds. | `Math.min(1, p * 0) = 0` → guaranteed no-win. Safe, no NaN. |
| `wager < 0` | Schema rejects. | Treat as invalid → coerce to `0` via `Math.max(0, Number(wager) || 0)` before multiply → no-win. Never returns a negative threshold (which would silently disable wins without crashing). |
| `wager = NaN` / non-numeric | `Number()` coercion above turns to `NaN`; `NaN < p` is `false` → silent no-win, no crash. | `Number(wager) || 0` collapses NaN to 0 → no-win. Explicit and auditable. |
| `wager = Infinity` | Would make `p * wager = Infinity`. `rng() < Infinity` is always true → 100% win — but `Math.min(1, Infinity) = 1`, which is the intended cap. | Cap with `Math.min(1, ...)` handles it cleanly. |
| Very large finite wager (e.g. `1e9` against `p = 1e-3`) | Unscaled: still `p = 0.001`. | Scaled: `min(1, 1_000_000)` → `1.0`. Cap holds. |
| `p` already invalid (NaN/negative from a corrupt config) | `rng() < NaN` → false; `rng() < negative` → false. | Pre-clamp `p` with `Math.max(0, Number(p) || 0)` before scaling so a corrupt config can never produce `NaN * wager`. |
| `jackpotType` missing on a legacy DTO | N/A | Default branch = "do not scale" — preserves today's behavior for any DTO without an explicit `"classic"` tag. |

**Crash surface:** none. All operations are pure arithmetic on coerced numbers, wrapped by `Math.min(1, …)` and `Math.max(0, …)`. The bet stream cannot throw from this helper under any input shape.

**Audit/observability note (not in scope to implement now, but worth flagging):** the response envelope currently echoes `wager` but not the effective `p` used. If compliance later wants per-spin auditability of the scaled odds, the response would need a new field (e.g. `perJackpot[].effectiveTriggerProbability`). Out of scope for Phase 1, but mentioned because regulators sometimes ask.

---

## Confirmation

Yes — the change can be **completely isolated to Classic campaigns**:

- Single discriminator: `jpDto.jackpotType === "classic"`.
- Single file touched: `src/routes/api/v1/event/bet.ts` (3 call sites + 1 new helper).
- Zero edits to `math.ts`, `ledger.ts`, `store.server.ts`, the DB schema, the Zod schema, the response envelope, or any Must-Drop/Frequency/timed code path.
- Default-safe: any jackpot whose `jackpotType` is `"must_drop"`, `"frequency"`, or `undefined` continues to use the existing flat-odds Bernoulli trial — bit-for-bit identical to today.

Awaiting approval before moving to Phase 2 (implementation).
