import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { postBet, basePayload, hmacHex } from "../helpers/http";
import { seedFixture, teardownFixture } from "../helpers/fixtures";

describe("HMAC operator signature (X-Operator-Signature)", () => {
  beforeAll(async () => {
    await seedFixture();
  });
  afterAll(async () => {
    await teardownFixture();
  });

  it("accepts a valid signature computed over the raw body", async () => {
    const raw = JSON.stringify(basePayload());
    const res = await postBet({ rawBody: raw, signature: hmacHex(raw) });
    expect(res.status).toBe(200);
  });

  it("rejects when body is tampered after signing → 403 OPERATOR_SIGNATURE_INVALID", async () => {
    const original = JSON.stringify(basePayload());
    const goodSig = hmacHex(original);
    // Mutate the wager value to invalidate the signature.
    const tampered = original.replace('"wagerAmount":1', '"wagerAmount":9999');
    expect(tampered).not.toBe(original);
    const res = await postBet({ rawBody: tampered, signature: goodSig });
    expect(res.status).toBe(403);
    expect(res.json?.code).toBe("OPERATOR_SIGNATURE_INVALID");
  });

  it("rejects garbage signature → 403 OPERATOR_SIGNATURE_INVALID", async () => {
    const res = await postBet({
      body: basePayload(),
      signature: "sha256=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    });
    expect(res.status).toBe(403);
    expect(res.json?.code).toBe("OPERATOR_SIGNATURE_INVALID");
  });

  it("accepts requests with no signature header (header is optional)", async () => {
    const res = await postBet({ body: basePayload() });
    expect(res.status).toBe(200);
  });
});
