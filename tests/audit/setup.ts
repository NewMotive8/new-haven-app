import "dotenv/config";

// Audit suite globals. Probes target the live dev preview backend with a
// dedicated isolated brandId namespace (999999) so production data is never
// touched. Setup/teardown is enforced by tests/audit/helpers/fixtures.ts.

const DEFAULT_BASE =
  "https://id-preview--c6d44db0-ad0f-450f-a01f-bbf63483fab8.lovable.app";

export const BASE_URL = (process.env.AUDIT_BASE_URL ?? DEFAULT_BASE).replace(
  /\/$/,
  "",
);
export const TEST_BRAND_ID = "999999";
export const TEST_GAME_ID = `audit-game-${TEST_BRAND_ID}`;
export const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET ?? "";
export const HMAC_SECRET = process.env.OPERATOR_HMAC_SECRET_DEFAULT ?? "";

if (!INTERNAL_SECRET) {
  throw new Error(
    "Audit setup: INTERNAL_SERVICE_SECRET is not available in the test process env.",
  );
}
if (!HMAC_SECRET) {
  throw new Error(
    "Audit setup: OPERATOR_HMAC_SECRET_DEFAULT is not available in the test process env.",
  );
}

// eslint-disable-next-line no-console
console.log(
  `[audit] BASE_URL=${BASE_URL} brandId=${TEST_BRAND_ID} gameId=${TEST_GAME_ID}`,
);
