/**
 * Phase 3 / Pillar 3 — Parallel bet race condition.
 *
 * Dispatches N concurrent signed bets against the same brand-999999 pool
 * row and asserts perfect serialization: every wager is accepted exactly
 * once, every contribution lands in the pool, and the pool's end-balance
 * delta equals the exact sum of contributions in micro-cents.
 */
import { describe, expect, it, beforeAll } from "vitest";
import {
  AUDIT_BRAND_ID,
  authHeaders,
  HMAC_SECRET,
  hmacHex,
  newTxId,
  postBet,
} from "../setup";
import { auditFixtureIds, micro, poolBalance } from "../financial/helpers";

const N = 20;
const WAGER = 1.0;

let fx: { gameId: number; groupId: number; jackpotId: number };
beforeAll(() => { fx = auditFixtureIds(); });

async function signedBet(payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  const headers = HMAC_SECRET
    ? authHeaders({ "X-Operator-Signature": await hmacHex(HMAC_SECRET, raw) })
    : authHeaders();
  return postBet(raw, headers);
}

describe("Phase 3 / Pillar 3 — Parallel bet race condition (N=20)", () => {
  it("N concurrent bets all succeed and conserve pool balance exactly", async () => {
    const startBalance = poolBalance(fx.jackpotId);

    // Build all signed requests up-front, then fire them in a single
    // Promise.all so they hit the gateway as close to simultaneously as
    // the event loop allows. Each tx has a unique id, so the only shared
    // contention point is the jackpot_pools row UPDATE.
    const txIds = Array.from({ length: N }, (_, i) =>
      newTxId(`audit-race-${i}`),
    );
    const results = await Promise.all(
      txIds.map((tx) =>
        signedBet({
          transactionId: tx,
          wagerAmount: WAGER,
          currency: "EUR",
          gameId: "audit-game-999999",
          playerId: "audit-player-race",
        }),
      ),
    );

    // Every request must be a clean 200 ok (no lost updates, no 5xx).
    const failures = results
      .map((r, i) => ({ i, status: r.status, body: r.body }))
      .filter((r) => r.status !== 200 || r.body?.status !== "ok");
    expect(failures, `expected all 200/ok, got: ${JSON.stringify(failures)}`).toEqual([]);

    // No duplicate-ignored shortcuts: every tx id was unique.
    const replays = results.filter((r) => r.body?.idempotentReplay === true);
    expect(replays.length, "no request should be flagged as idempotent replay").toBe(0);

    // Conservation: Σ contributions == end - start, exact in micro-cents.
    const contributions = results.map((r) => Number(r.body?.contribution?.pool ?? 0));
    const sumMicros = contributions.reduce((a, c) => a + micro(c), 0n);
    const endBalance = poolBalance(fx.jackpotId);
    const observedDelta = micro(endBalance) - micro(startBalance);

    expect(sumMicros).toBe(BigInt(N) * micro(WAGER));
    expect(observedDelta).toBe(sumMicros);
  }, 60_000);

  it(`brand confirmation: race ran under brandId=${AUDIT_BRAND_ID}`, () => {
    expect(AUDIT_BRAND_ID).toBe("999999");
  });
});
