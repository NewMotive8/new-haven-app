import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { postBet, basePayload, newTxId } from "../helpers/http";
import { seedFixture, teardownFixture } from "../helpers/fixtures";

describe("Idempotent transactionId replay", () => {
  beforeAll(async () => {
    await seedFixture();
  });
  afterAll(async () => {
    await teardownFixture();
  });

  it("replaying the same transactionId returns status=duplicate_ignored", async () => {
    const payload = basePayload({ transactionId: newTxId("idem") });
    const raw = JSON.stringify(payload);

    const first = await postBet({ rawBody: raw });
    expect(first.status).toBe(200);
    expect(first.json?.status).toBe("ok");
    expect(first.json?.idempotentReplay).toBe(false);

    const second = await postBet({ rawBody: raw });
    expect(second.status).toBe(200);
    expect(second.json?.status).toBe("duplicate_ignored");
    expect(second.json?.idempotentReplay).toBe(true);
    expect(second.json?.transactionId).toBe(payload.transactionId);
  });
});
