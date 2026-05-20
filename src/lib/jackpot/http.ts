export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, brandId, x-brand-id, X-Requested-With",
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
  // Headers are case-insensitive; "brandId" works for fetch and most clients.
  const brandId = request.headers.get("brandId") ?? request.headers.get("brandid");
  if (!brandId) return errorJson("Missing required 'brandId' header", 400);
  return brandId;
}
