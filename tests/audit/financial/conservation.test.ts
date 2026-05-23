/**
 * Phase 2 — Financial Accounting & Balance Conservation Invariants.
 *
 * All tests target the live database via the brand 999999 audit fixture
 * (seeded by the idempotent migration). We never touch a real brand row.
 *
 * Pillar 1: Micro-cent pool conservation across 100 mixed-wager bets.
 * Pillar 2: Per-bet contribution exactness + apply_jackpot_topup audit log.
 * Pillar 3: Atomicity at the gateway boundary — failed requests write nothing.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AUDIT_BRAND_ID,
  authHeaders,
  hmacHex,
  HMAC_SECRET,
  newTxId,
  postBet,
} from "../setup";
import {
  auditFixtureIds,
  countAuditLog,
  countTx,
  countWins,
  micro,
  poolBalance,
  psql,
} from "./helpers";

const brand = Number(AUDIT_BRAND_ID);
let fx: { gameId: number; groupId: number; jackpotId: number };

beforeAll(() => {
  fx = auditFixtureIds();
});

// Run the rest of the audit suite without leaving stray rows behind: we
// keep pool balance + audit-log entries (they're scoped to brand 999999),
// but make sure we don't accumulate jackpot_transactions across runs that
// poison other tests via the unique-tx-id index.
afterAll(() => {
  psql(
    `DELETE FROM public.jackpot_transactions WHERE brand_id = 999999 AND transaction_id LIKE 'audit-fin-%'`,
  );
});

async function signedBet(payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  const sig = HMAC_SECRET ? await hmacHex(HMAC_SECRET, raw) : "";
  const headers = HMAC_SECRET
    ? authHeaders({ "X-Operator-Signature": sig })
    : authHeaders();
  return postBet(raw, headers);
}

describe("Phase 2 / Pillar 1 — Micro-cent pool conservation across 100 bets", () => {
  it("end_balance - start_balance == Σ wagers (exact, in micro-cents)", async () => {
    const startBalance = poolBalance(fx.jackpotId);
    const startWins = countWins(fx.jackpotId);

    const wagerPattern = [0.25, 1.0, 2.33];
    const wagers: number[] = [];
    for (let i = 0; i < 100; i++) wagers.push(wagerPattern[i % wagerPattern.length]);

    let perBetMismatch: { i: number; want: number; got: number } | null = null;

    for (let i = 0; i < wagers.length; i++) {
      const w = wagers[i];
      const res = await signedBet({
        transactionId: newTxId("audit-fin-conservation"),
        wagerAmount: w,
        currency: "EUR",
        gameId: "audit-game-999999",
        playerId: "audit-player-conservation",
      });
      expect(res.status, `bet #${i} HTTP status`).toBe(200);
      expect(res.body?.status, `bet #${i} body.status`).toBe("ok");

      // Pillar 2 (per-bet exactness) — checked inline so we fail fast at
      // the first divergence with the offending index.
      const credited = res.body?.contribution?.pool;
      if (typeof credited !== "number" || micro(credited) !== micro(w)) {
        perBetMismatch = { i, want: w, got: credited };
        break;
      }
    }

    expect(perBetMismatch, "every bet credits pool == wager exactly").toBeNull();

    const endBalance = poolBalance(fx.jackpotId);
    const endWins = countWins(fx.jackpotId);

    // Trigger probability = 0 → no wins should have been written.
    expect(endWins - startWins).toBe(0);

    const sumWagersMicro = wagers.reduce((a, b) => a + micro(b), 0n);
    const observedDeltaMicro = micro(endBalance) - micro(startBalance);

    expect(observedDeltaMicro.toString()).toBe(sumWagersMicro.toString());
  }, 120_000);
});

describe("Phase 2 / Pillar 2 — apply_jackpot_topup audit-log delta", () => {
  it("scales the balance and writes a before/after snapshot row", () => {
    const before = poolBalance(fx.jackpotId);
    const beforeLogs = countAuditLog("jackpot_topup", String(fx.jackpotId));

    const amount = 12.34;
    const requestId = `audit-topup-${Date.now()}`;

    // SECURITY DEFINER RPC — call directly; not exposed over HTTP.
    psql(
      `SELECT public.apply_jackpot_topup(
         ${fx.jackpotId}::bigint,
         ${amount}::double precision,
         false,
         NULL,
         999999::bigint,
         '${requestId}'
       )`,
    );

    const after = poolBalance(fx.jackpotId);
    const afterLogs = countAuditLog("jackpot_topup", String(fx.jackpotId));

    expect((micro(after) - micro(before)).toString()).toBe(micro(amount).toString());
    expect(afterLogs - beforeLogs).toBe(1);

    // Verify the most-recent log row carries the precise snapshot delta.
    const row = psql(
      `SELECT jsonb_build_object(
         'before', before_state,
         'after',  after_state,
         'delta',  delta,
         'req',    request_id
       )::text
       FROM public.admin_audit_log
       WHERE action = 'jackpot_topup'
         AND target_id = '${fx.jackpotId}'
       ORDER BY occurred_at DESC
       LIMIT 1`,
    );
    const parsed = JSON.parse(row);
    expect(parsed.req).toBe(requestId);
    expect(micro(parsed.before.poolBalance).toString()).toBe(micro(before).toString());
    expect(micro(parsed.after.poolBalance).toString()).toBe(micro(after).toString());
    expect(micro(parsed.delta.amount).toString()).toBe(micro(amount).toString());
  });
});

describe("Phase 2 / Pillar 3 — Atomicity at the gateway boundary", () => {
  it("a request that fails validation writes ZERO rows to pools / tx / wins", async () => {
    const startBalance = poolBalance(fx.jackpotId);
    const startTx = countTx(brand, fx.groupId);
    const startWins = countWins(fx.jackpotId);

    // Negative wager → Zod rejects with 400 before any DB write path runs.
    const res = await signedBet({
      transactionId: newTxId("audit-fin-atomicity"),
      wagerAmount: -1.0,
      currency: "EUR",
      gameId: "audit-game-999999",
    });
    expect(res.status).toBe(400);

    expect(poolBalance(fx.jackpotId)).toBe(startBalance);
    expect(countTx(brand, fx.groupId)).toBe(startTx);
    expect(countWins(fx.jackpotId)).toBe(startWins);
  });

  it("a request that fails routing (unknown game) writes ZERO rows", async () => {
    const startBalance = poolBalance(fx.jackpotId);
    const startTx = countTx(brand, fx.groupId);

    const res = await signedBet({
      transactionId: newTxId("audit-fin-atomicity-route"),
      wagerAmount: 1.0,
      currency: "EUR",
      gameId: "audit-nonexistent-game-zzz",
    });
    expect(res.status).toBe(404);

    expect(poolBalance(fx.jackpotId)).toBe(startBalance);
    expect(countTx(brand, fx.groupId)).toBe(startTx);
  });

  // Honest limitation: we cannot inject a mid-RPC failure from outside the
  // HTTP gateway. `apply_group_bet` commits pool deltas, jackpot_wins, and
  // jackpot_transactions inside a single PL/pgSQL function — its atomicity
  // is enforced by Postgres itself, not testable via a black-box probe.
  // The two specs above verify the boundary we CAN observe: that any
  // request which does not reach the RPC leaves persistent state untouched.
  it.skip("forced mid-RPC failure rolls back pool + win + tx (NOT EXERCISABLE via HTTP)", () => {
    // Would require: a kill-switch flag inside apply_group_bet OR a
    // chaos-mode env var consulted by the route handler. Neither exists,
    // and adding one purely for testing would weaken the production
    // perimeter. Flagging as a Phase-2 follow-up.
  });
});
