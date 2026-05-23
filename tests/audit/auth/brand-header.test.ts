import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { postBet, basePayload } from "../helpers/http";
import { seedFixture, teardownFixture } from "../helpers/fixtures";

describe("brandId header", () => {
  beforeAll(async () => {
    await seedFixture();
  });
  afterAll(async () => {
    await teardownFixture();
  });

  it("rejects when brand header is missing → 400", async () => {
    const res = await postBet({ brandHeader: null, body: basePayload() });
    expect(res.status).toBe(400);
    expect(String(res.json?.error ?? "")).toMatch(/brandId/i);
  });

  it.each([
    ["x-brand-id"] as const,
    ["brandId"] as const,
    ["BRANDID"] as const,
  ])("accepts %s header (case-insensitive)", async (name) => {
    const res = await postBet({
      brandHeaderName: name as "x-brand-id" | "brandId" | "BRANDID",
      body: basePayload(),
    });
    expect(res.status).toBe(200);
  });
});
