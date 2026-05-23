import { describe, it, expect } from "vitest";
import { authHeaders, hmacHex, HMAC_SECRET, postBet, validBetPayload } from "../setup";

describe("Phase 1 / HMAC — X-Operator-Signature verification", () => {
  it("accepts a request with a correct HMAC-SHA256 signature", async () => {
    const payload = validBetPayload();
    const raw = JSON.stringify(payload);
    const sig = await hmacHex(HMAC_SECRET, raw);
    const res = await postBet(raw, authHeaders({ "X-Operator-Signature": sig }));
    // Auth + signature cleared. Downstream may 404 on unknown gameId; we only
    // assert we got past the HMAC gate (not 403 OPERATOR_SIGNATURE_INVALID).
    expect(res.body?.code).not.toBe("OPERATOR_SIGNATURE_INVALID");
    expect(res.body?.code).not.toBe("OPERATOR_HMAC_SECRET_NOT_CONFIGURED");
  });

  it("rejects with 403 when the body has been tampered after signing", async () => {
    const payload = validBetPayload();
    const raw = JSON.stringify(payload);
    const sig = await hmacHex(HMAC_SECRET, raw);
    const tamperedBody = raw.replace('"wagerAmount":1', '"wagerAmount":9999');
    const res = await postBet(tamperedBody, authHeaders({ "X-Operator-Signature": sig }));
    expect(res.status).toBe(403);
    expect(res.body?.code).toBe("OPERATOR_SIGNATURE_INVALID");
  });

  it("rejects with 403 when an obviously bad signature is supplied", async () => {
    const payload = validBetPayload();
    const raw = JSON.stringify(payload);
    const res = await postBet(raw, authHeaders({ "X-Operator-Signature": "deadbeef".repeat(8) }));
    expect(res.status).toBe(403);
    expect(res.body?.code).toBe("OPERATOR_SIGNATURE_INVALID");
  });

  it("accepts when the header is omitted (HMAC is optional, back-compat)", async () => {
    const res = await postBet(validBetPayload(), authHeaders());
    expect(res.body?.code).not.toBe("OPERATOR_SIGNATURE_INVALID");
  });
});
