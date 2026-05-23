import { describe, it, expect } from "vitest";
import {
  AUDIT_BRAND_ID,
  INTERNAL_SECRET,
  postBet,
  validBetPayload,
} from "../setup";

describe("Phase 1 / Brand header — case-insensitive resolution", () => {
  it("rejects with 400 when no brand header is supplied", async () => {
    const res = await postBet(validBetPayload(), {
      Authorization: `Bearer ${INTERNAL_SECRET}`,
    });
    expect(res.status).toBe(400);
    expect(String(res.body?.error ?? "")).toMatch(/brandId/i);
  });

  it("accepts lowercase 'x-brand-id'", async () => {
    const res = await postBet(validBetPayload(), {
      Authorization: `Bearer ${INTERNAL_SECRET}`,
      "x-brand-id": AUDIT_BRAND_ID,
    });
    // Not blocked by the brand gate (would be 400 'Missing required brandId').
    expect(res.status).not.toBe(400);
  });

  it("accepts camelCase 'brandId' header variant", async () => {
    const res = await postBet(validBetPayload(), {
      Authorization: `Bearer ${INTERNAL_SECRET}`,
      brandId: AUDIT_BRAND_ID,
    });
    // Either downstream returns 404 (unknown game) or 200; never the
    // brand-missing 400.
    if (res.status === 400) {
      expect(String(res.body?.error ?? "")).not.toMatch(/Missing required 'brandId'/);
    }
  });
});
