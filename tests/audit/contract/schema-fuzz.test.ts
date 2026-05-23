import { describe, it, expect } from "vitest";
import { authHeaders, newTxId, postBet, validBetPayload } from "../setup";

describe("Phase 1 / Schema fuzzing — Zod field validation", () => {
  it("rejects an empty body with 400", async () => {
    const res = await postBet({}, authHeaders());
    expect(res.status).toBe(400);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await postBet("not-json{", authHeaders());
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/Invalid JSON/i);
  });

  it("rejects negative wagerAmount with 400", async () => {
    const res = await postBet(validBetPayload({ wagerAmount: -5 }), authHeaders());
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/wagerAmount/);
  });

  it("rejects malformed currency code with 400", async () => {
    const res = await postBet(
      validBetPayload({ currency: "not a currency!" }),
      authHeaders(),
    );
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/currency/);
  });

  it("rejects when wagerAmount and legacy wager are both missing", async () => {
    const res = await postBet(
      {
        transactionId: newTxId(),
        gameId: "audit-nonexistent-game",
      },
      authHeaders(),
    );
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/wagerAmount/);
  });

  it("rejects conflicting routing hints (groupId + jackpotId) with 400", async () => {
    const res = await postBet(
      validBetPayload({ groupId: 1, jackpotId: 1 }),
      authHeaders(),
    );
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/ROUTING_CONFLICT/);
  });

  it("returns 404 NO_ACTIVE_GROUP_FOR_GAME for an unknown gameId", async () => {
    const res = await postBet(
      validBetPayload({ gameId: `nope-${Date.now()}` }),
      authHeaders(),
    );
    expect(res.status).toBe(404);
    expect(String(res.body?.error ?? "")).toMatch(/NO_ACTIVE_GROUP_FOR_GAME/);
  });
});
