import { describe, it, expect } from "vitest";
import { postBet, basePayload } from "../helpers/http";
import { INTERNAL_SECRET } from "../setup";

describe("Bearer auth (INTERNAL_SERVICE_SECRET)", () => {
  it("rejects request with no Authorization header → 403 INTERNAL_HANDSHAKE_MISSING", async () => {
    const res = await postBet({ bearer: null });
    expect(res.status).toBe(403);
    expect(res.json?.code).toBe("INTERNAL_HANDSHAKE_MISSING");
  });

  it("rejects wrong bearer secret → 403 INTERNAL_HANDSHAKE_INVALID", async () => {
    const res = await postBet({ bearer: "definitely-not-the-real-secret" });
    expect(res.status).toBe(403);
    expect(res.json?.code).toBe("INTERNAL_HANDSHAKE_INVALID");
  });

  it("accepts X-Internal-Service-Secret header variant", async () => {
    const res = await postBet({
      bearer: null,
      extraHeaders: { "X-Internal-Service-Secret": INTERNAL_SECRET },
      body: basePayload(),
    });
    // 200 (success) or 404 (no group for gameId) — either proves auth passed.
    expect([200, 404]).toContain(res.status);
    expect(res.json?.code).not.toBe("INTERNAL_HANDSHAKE_MISSING");
    expect(res.json?.code).not.toBe("INTERNAL_HANDSHAKE_INVALID");
  });
});
