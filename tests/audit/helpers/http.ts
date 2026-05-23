import { createHmac } from "crypto";
import {
  BASE_URL,
  HMAC_SECRET,
  INTERNAL_SECRET,
  TEST_BRAND_ID,
  TEST_GAME_ID,
} from "../setup";

export const BET_PATH = "/api/v1/event/bet";

export function hmacHex(body: string, secret = HMAC_SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function newTxId(prefix = "audit"): string {
  return `${prefix}-${TEST_BRAND_ID}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function basePayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    transactionId: newTxId(),
    wagerAmount: 1.0,
    currency: "EUR",
    timestamp: new Date().toISOString(),
    gameId: TEST_GAME_ID,
    playerId: `audit-player-${TEST_BRAND_ID}`,
    playerSegments: [],
    ...overrides,
  };
}

export type PostInit = {
  body?: unknown;
  rawBody?: string;
  bearer?: string | null; // null → omit
  brandHeader?: string | null; // null → omit
  brandHeaderName?: "x-brand-id" | "brandId" | "BRANDID";
  signature?: string | null; // explicit hex; null → omit
  signWithSecret?: string; // if set, compute hmac with this secret
  extraHeaders?: Record<string, string>;
};

export async function postBet(init: PostInit = {}): Promise<{
  status: number;
  text: string;
  json: any | null;
}> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.extraHeaders ?? {}),
  };

  const bearer = init.bearer === undefined ? INTERNAL_SECRET : init.bearer;
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

  const brand =
    init.brandHeader === undefined ? TEST_BRAND_ID : init.brandHeader;
  if (brand !== null) {
    const name = init.brandHeaderName ?? "x-brand-id";
    headers[name] = brand;
  }

  const rawBody =
    init.rawBody ?? JSON.stringify(init.body ?? basePayload());

  if (init.signature !== undefined && init.signature !== null) {
    headers["X-Operator-Signature"] = init.signature;
  } else if (init.signWithSecret) {
    headers["X-Operator-Signature"] = hmacHex(rawBody, init.signWithSecret);
  }

  const res = await fetch(`${BASE_URL}${BET_PATH}`, {
    method: "POST",
    headers,
    body: rawBody,
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON response is fine */
  }
  return { status: res.status, text, json: parsed };
}

export async function postAuditAdmin(
  path: "/api/public/_audit/seed" | "/api/public/_audit/teardown",
  body: Record<string, unknown> = {},
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INTERNAL_SECRET}`,
    },
    body: JSON.stringify({ brandId: Number(TEST_BRAND_ID), gameId: TEST_GAME_ID, ...body }),
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { status: res.status, json: parsed };
}
