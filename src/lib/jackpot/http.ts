export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, brandId, x-brand-id, X-Requested-With, X-Internal-Service-Secret, X-Operator-Signature",
  "Access-Control-Max-Age": "86400",
} as const;


export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export function errorJson(message: string, status = 400): Response {
  return json({ error: message, status }, { status });
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function requireBrandId(request: Request): string | Response {
  // Headers are case-insensitive. Accept the canonical `brandId` plus the
  // `x-brand-id` variant used by the sandbox demo and other internal callers.
  const brandId =
    request.headers.get("x-brand-id") ??
    request.headers.get("brandId") ??
    request.headers.get("brandid");
  if (!brandId) return errorJson("Missing required 'brandId' header", 400);
  return brandId;
}

/**
 * Phase 2 — Zero-Trust internal handshake. Validates a shared secret on
 * `Authorization: Bearer <secret>` or `X-Internal-Service-Secret: <secret>`
 * against `process.env.INTERNAL_SERVICE_SECRET`. Returns a structured
 * 403 (or 503 if the secret isn't configured) on failure, or `null` to
 * indicate the caller should proceed.
 */
export function requireInternalSecret(request: Request): Response | null {
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  if (!expected) {
    return json(
      {
        error: "Service misconfigured",
        code: "INTERNAL_SECRET_NOT_SET",
        message:
          "INTERNAL_SERVICE_SECRET is not configured on this environment.",
        status: 503,
      },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const direct = request.headers.get("x-internal-service-secret") ?? "";
  const provided = bearer || direct;

  if (!provided) {
    return json(
      {
        error: "Forbidden",
        code: "INTERNAL_HANDSHAKE_MISSING",
        message:
          "Internal VPC handshake required. Provide Authorization: Bearer <secret> or X-Internal-Service-Secret.",
        status: 403,
      },
      { status: 403 },
    );
  }
  if (provided !== expected) {
    return json(
      {
        error: "Forbidden",
        code: "INTERNAL_HANDSHAKE_INVALID",
        message:
          "Internal service secret did not match the expected VPC credential.",
        status: 403,
      },
      { status: 403 },
    );
  }
  return null;
}

