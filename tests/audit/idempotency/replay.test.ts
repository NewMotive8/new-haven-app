import { describe, it, expect } from "vitest";
import { authHeaders, newTxId, postBet, validBetPayload } from "../setup";

describe("Phase 1 / Idempotency — duplicate transactionId short-circuit", () => {
  it("returns identical 404 envelope when an unknown-game tx is replayed", async () => {
    const txId = newTxId("replay-unknown");
    const payload = validBetPayload({ transactionId: txId, gameId: `nope-${txId}` });

    const first = await postBet(payload, authHeaders());
    const second = await postBet(payload, authHeaders());

    expect(first.status).toBe(404);
    expect(second.status).toBe(404);
    expect(String(first.body?.error ?? "")).toMatch(/NO_ACTIVE_GROUP_FOR_GAME/);
    expect(String(second.body?.error ?? "")).toMatch(/NO_ACTIVE_GROUP_FOR_GAME/);
  });

  it("returns status=duplicate_ignored on replay of a successful tx", async () => {
    // Routes to the seeded brand-999999 active group via the audit-game-999999
    // operator_game_id. Child jackpot has trigger_probability=0 so no win fires.
    const payload = validBetPayload({
      gameId: "audit-game-999999",
      wagerAmount: 1,
    });

    const first = await postBet(payload, authHeaders());
    expect(first.status).toBe(200);
    expect(first.body?.status).toBe("ok");
    expect(first.body?.idempotentReplay).toBe(false);

    const second = await postBet(payload, authHeaders());
    expect(second.status).toBe(200);
    expect(second.body?.status).toBe("duplicate_ignored");
    expect(second.body?.idempotentReplay).toBe(true);
    expect(second.headers.get("x-idempotent-replay")).toBe("true");
  });
});

