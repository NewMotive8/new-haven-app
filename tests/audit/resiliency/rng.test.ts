/**
 * Phase 3 / Pillar 1 — Cryptographic RNG verification.
 *
 * Black-box: every bet response under brand 999999 reports rngSource="local"
 *            and a client-supplied "rngSource" hint cannot influence it.
 * White-box: the bet engine source uses crypto.getRandomValues and contains
 *            no Math.random() call paths.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it, beforeAll } from "vitest";
import {
  AUDIT_BRAND_ID,
  authHeaders,
  HMAC_SECRET,
  hmacHex,
  newTxId,
  postBet,
} from "../setup";
import { auditFixtureIds } from "../financial/helpers";

let fx: { gameId: number; groupId: number; jackpotId: number };
beforeAll(() => { fx = auditFixtureIds(); });

async function signedBet(payload: Record<string, unknown>) {
  const raw = JSON.stringify(payload);
  const headers = HMAC_SECRET
    ? authHeaders({ "X-Operator-Signature": await hmacHex(HMAC_SECRET, raw) })
    : authHeaders();
  return postBet(raw, headers);
}

describe("Phase 3 / Pillar 1 — Cryptographic RNG verification", () => {
  it("source: bet engine uses crypto.getRandomValues and no Math.random()", () => {
    const src = readFileSync("src/routes/api/v1/event/bet.ts", "utf8");
    expect(src).toMatch(/crypto\.getRandomValues\(new Uint32Array\(1\)\)/);
    // No Math.random() anywhere in the engine path.
    expect(/\bMath\.random\s*\(/.test(src)).toBe(false);
    // rngSource is pinned to a const literal "local"; no branching on input.
    expect(src).toMatch(/const\s+rngSource:\s*"local"\s*=\s*"local"/);
  });

  it("response: every bet evaluation reports rngSource='local' (sampled x32)", async () => {
    const N = 32;
    const sources = new Set<string>();
    for (let i = 0; i < N; i++) {
      const res = await signedBet({
        transactionId: newTxId("audit-rng"),
        wagerAmount: 0.5,
        currency: "EUR",
        gameId: "audit-game-999999",
        playerId: "audit-player-rng",
      });
      expect(res.status, `bet #${i}`).toBe(200);
      expect(res.body?.status).toBe("ok");
      sources.add(String(res.body?.rngSource));
      // Sanity: tier breakdown populated (no logical drops in fan-out).
      expect(Array.isArray(res.body?.perJackpot)).toBe(true);
    }
    expect([...sources]).toEqual(["local"]);
  });

  it("response: a client-supplied rngSource hint cannot override the engine", async () => {
    const res = await signedBet({
      transactionId: newTxId("audit-rng-hint"),
      wagerAmount: 0.5,
      currency: "EUR",
      gameId: "audit-game-999999",
      playerId: "audit-player-rng",
      rngSource: "external",        // attacker hint
      seed: "deadbeefdeadbeef",     // attacker seed
    } as any);
    expect(res.status).toBe(200);
    expect(res.body?.rngSource).toBe("local");
  });

  it(`brand confirmation: probes ran under brandId=${AUDIT_BRAND_ID}`, () => {
    expect(AUDIT_BRAND_ID).toBe("999999");
    expect(fx.jackpotId).toBeGreaterThan(0);
  });
});
