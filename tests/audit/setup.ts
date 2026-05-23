/**
 * Phase 1 Security Audit — shared test fixture.
 *
 * Targets the published custom domain by default. All probes operate strictly
 * against the isolated audit brand (brandId: 999999) and never write to any
 * real brand's tables.
 */
import { expect } from "vitest";

export const BASE_URL =
  process.env.AUDIT_BASE_URL ?? "https://sandbox-admin.incentiv8.co";

export const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET ?? "";
export const HMAC_SECRET = process.env.OPERATOR_HMAC_SECRET_DEFAULT ?? "";

export const AUDIT_BRAND_ID = "999999";
export const BET_PATH = "/api/v1/event/bet";

if (!INTERNAL_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("[audit] INTERNAL_SERVICE_SECRET missing from process.env");
}
if (!HMAC_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("[audit] OPERATOR_HMAC_SECRET_DEFAULT missing from process.env");
}

export type ProbeResponse = {
  status: number;
  body: any;
  headers: Headers;
};

export async function postBet(
  body: string | object,
  headers: Record<string, string> = {},
): Promise<ProbeResponse> {
  const rawBody = typeof body === "string" ? body : JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${BET_PATH}`, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: rawBody,
  });
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* leave as text */
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

export async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function authHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${INTERNAL_SECRET}`,
    "x-brand-id": AUDIT_BRAND_ID,
    ...extra,
  };
}

export function newTxId(prefix = "audit"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function validBetPayload(overrides: Record<string, unknown> = {}) {
  return {
    transactionId: newTxId(),
    wagerAmount: 1,
    currency: "EUR",
    gameId: "audit-nonexistent-game",
    playerId: "audit-player",
    ...overrides,
  };
}


// Re-export expect for convenience in test files.
export { expect };
