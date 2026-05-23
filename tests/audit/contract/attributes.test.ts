/**
 * Open-ended `attributes` metadata bag — verticals-agnostic.
 * Covers casino, sportsbook, and channel/device payloads, plus validation
 * guards and round-trip persistence.
 */
import { describe, it, expect } from "vitest";
import { authHeaders, newTxId, postBet, validBetPayload } from "../setup";

const ROUTABLE_GAME = "audit-game-999999";

describe("Phase 4 / Open-ended attributes metadata", () => {
  it("accepts a casino payload with gameCategory + device + vipTier", async () => {
    const attributes = {
      vertical: "casino",
      gameCategory: "Slots",
      provider: "Pragmatic",
      device: "mobile_web",
      platform: "iOS",
      vipTier: "GOLD",
    };
    const res = await postBet(
      validBetPayload({ gameId: ROUTABLE_GAME, attributes }),
      authHeaders(),
    );
    expect(res.status).toBe(200);
    expect(res.body?.attributes).toEqual(attributes);
  });

  it("accepts a sportsbook payload with nested selections", async () => {
    const attributes = {
      vertical: "sports",
      betType: "LIVE",
      sport: "SOCCER",
      league: "UEFA_CL",
      matchId: "m-9931",
      selections: [
        { marketId: "1x2", odds: 2.15, pick: "HOME" },
        { marketId: "btts", odds: 1.85, pick: "YES" },
      ],
      device: "native_app",
      platform: "Android",
    };
    const res = await postBet(
      validBetPayload({ gameId: ROUTABLE_GAME, wagerAmount: 5, attributes }),
      authHeaders(),
    );
    expect(res.status).toBe(200);
    expect(res.body?.attributes).toEqual(attributes);
  });

  it("accepts a channel-only payload (device + platform + sessionId)", async () => {
    const attributes = {
      device: "desktop",
      platform: "Windows",
      sessionId: "sess-abc-123",
    };
    const res = await postBet(
      validBetPayload({ gameId: ROUTABLE_GAME, attributes }),
      authHeaders(),
    );
    expect(res.status).toBe(200);
    expect(res.body?.attributes).toEqual(attributes);
  });

  it("returns attributes: null when omitted (back-compat)", async () => {
    const res = await postBet(
      validBetPayload({ gameId: ROUTABLE_GAME }),
      authHeaders(),
    );
    expect(res.status).toBe(200);
    expect(res.body?.attributes).toBeNull();
  });

  it("rejects oversized attributes (>8KB) with 400", async () => {
    const big = "x".repeat(900);
    const attributes: Record<string, string> = {};
    for (let i = 0; i < 12; i++) attributes[`field_${i}`] = big;
    const res = await postBet(
      validBetPayload({ gameId: ROUTABLE_GAME, attributes }),
      authHeaders(),
    );
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/attributes/i);
  });

  it("rejects non-object attributes shapes with 400", async () => {
    for (const bad of [[1, 2, 3], "foo", 42, true]) {
      const res = await postBet(
        validBetPayload({ gameId: ROUTABLE_GAME, attributes: bad as any }),
        authHeaders(),
      );
      expect(res.status).toBe(400);
      expect(String(res.body?.error ?? "")).toMatch(/attributes/i);
    }
  });

  it("rejects forbidden key characters with 400 and reports the path", async () => {
    const res = await postBet(
      validBetPayload({
        gameId: ROUTABLE_GAME,
        attributes: { "bad key!": 1 } as any,
      }),
      authHeaders(),
    );
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/attributes.*bad key/i);
  });

  it("idempotent replay returns the same attributes from the ledger", async () => {
    const transactionId = newTxId("attrs-replay");
    const attributes = {
      vertical: "casino",
      gameCategory: "Live Casino",
      device: "tablet",
      platform: "iPadOS",
    };
    const first = await postBet(
      validBetPayload({ transactionId, gameId: ROUTABLE_GAME, attributes }),
      authHeaders(),
    );
    expect(first.status).toBe(200);
    expect(first.body?.attributes).toEqual(attributes);

    const replay = await postBet(
      validBetPayload({ transactionId, gameId: ROUTABLE_GAME, attributes }),
      authHeaders(),
    );
    expect(replay.status).toBe(200);
    expect(replay.body?.idempotentReplay).toBe(true);
    expect(replay.body?.attributes).toEqual(attributes);
  });
});
