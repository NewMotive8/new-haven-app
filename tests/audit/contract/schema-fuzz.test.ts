import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { postBet, basePayload, newTxId } from "../helpers/http";
import { seedFixture, teardownFixture } from "../helpers/fixtures";

describe("Schema + routing contract fuzzing", () => {
  beforeAll(async () => {
    await seedFixture();
  });
  afterAll(async () => {
    await teardownFixture();
  });

  it("empty body → 400", async () => {
    const res = await postBet({ body: {} });
    expect(res.status).toBe(400);
  });

  it("negative wagerAmount → 400", async () => {
    const res = await postBet({ body: basePayload({ wagerAmount: -5 }) });
    expect(res.status).toBe(400);
  });

  it("malformed currency → 400", async () => {
    const res = await postBet({ body: basePayload({ currency: "not!a$currency" }) });
    expect(res.status).toBe(400);
  });

  it("unknown gameId with no other routing → 404 NO_ACTIVE_GROUP_FOR_GAME", async () => {
    const res = await postBet({
      body: basePayload({
        transactionId: newTxId("fuzz-unknown-game"),
        gameId: "non-existent-game-xyz-no-route",
      }),
    });
    expect(res.status).toBe(404);
    expect(String(res.json?.error ?? "")).toMatch(/NO_ACTIVE_GROUP_FOR_GAME/);
  });

  it("conflicting routing (groupId + jackpotId) → 400", async () => {
    const res = await postBet({
      body: basePayload({ groupId: 1, jackpotId: 2 }),
    });
    expect(res.status).toBe(400);
    expect(String(res.json?.error ?? "")).toMatch(/ROUTING_CONFLICT/);
  });
});
