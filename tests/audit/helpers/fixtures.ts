import { postAuditAdmin } from "./http";

export type SeededFixture = {
  groupId: number;
  jackpotId: number;
  gameId: string;
};

export async function seedFixture(): Promise<SeededFixture> {
  const res = await postAuditAdmin("/api/public/_audit/seed");
  if (res.status !== 200) {
    throw new Error(
      `Audit seed failed (${res.status}): ${JSON.stringify(res.json)}`,
    );
  }
  return res.json as SeededFixture;
}

export async function teardownFixture(): Promise<void> {
  const res = await postAuditAdmin("/api/public/_audit/teardown");
  if (res.status !== 200) {
    // Teardown failures should not mask test results, but log loudly.
    // eslint-disable-next-line no-console
    console.warn(
      `[audit] teardown returned ${res.status}: ${JSON.stringify(res.json)}`,
    );
  }
}
