import { describe, it, expect } from "vitest";
import {
  AUDIT_BRAND_ID,
  INTERNAL_SECRET,
  postBet,
  validBetPayload,
} from "../setup";

describe("Phase 1 / Bearer Auth — INTERNAL_SERVICE_SECRET gate", () => {
  it("rejects with 403 when no Authorization header is supplied", async () => {
    const res = await postBet(validBetPayload(), {
      "x-brand-id": AUDIT_BRAND_ID,
    });
    expect(res.status).toBe(403);
    expect(res.body?.code).toBe("INTERNAL_HANDSHAKE_MISSING");
  });

  it("rejects with 403 when a wrong bearer token is supplied", async () => {
    const res = await postBet(validBetPayload(), {
      Authorization: "Bearer not-the-real-secret",
      "x-brand-id": AUDIT_BRAND_ID,
    });
    expect(res.status).toBe(403);
    expect(res.body?.code).toBe("INTERNAL_HANDSHAKE_INVALID");
  });

  it("rejects with 403 when X-Internal-Service-Secret is wrong", async () => {
    const res = await postBet(validBetPayload(), {
      "X-Internal-Service-Secret": "still-not-the-secret",
      "x-brand-id": AUDIT_BRAND_ID,
    });
    expect(res.status).toBe(403);
    expect(res.body?.code).toBe("INTERNAL_HANDSHAKE_INVALID");
  });

  it("passes the bearer gate when a valid secret is supplied", async () => {
    // We expect to clear the auth layer; downstream logic may return 404 for
    // the unknown gameId. Anything other than 401/403 means auth accepted us.
    const res = await postBet(validBetPayload(), {
      Authorization: `Bearer ${INTERNAL_SECRET}`,
      "x-brand-id": AUDIT_BRAND_ID,
    });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
