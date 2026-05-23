import { createFileRoute } from "@tanstack/react-router";
import { errorJson, json, preflight, requireBrandId } from "@/lib/jackpot/http";
import { applyTopup, type AdminAuditContext } from "@/lib/jackpot/store.server";
import type { TopupDTO } from "@/lib/jackpot/types";

function extractAuditContext(request: Request, brandId: string): AdminAuditContext {
  // Optional headers — when present, the audit row is attributed; otherwise
  // it records a NULL actor (acceptable for S2S/automation).
  const rawActor = request.headers.get("x-actor-user-id");
  const actorUserId =
    rawActor && /^[0-9a-fA-F-]{36}$/.test(rawActor) ? rawActor : null;
  return {
    actorUserId,
    brandId: Number(brandId),
    requestId: request.headers.get("x-request-id"),
    ip: request.headers.get("x-forwarded-for"),
  };
}

export const Route = createFileRoute("/api/v1/jackpots/topup")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const brand = requireBrandId(request);
        if (brand instanceof Response) return brand;
        let body: TopupDTO;
        try {
          body = (await request.json()) as TopupDTO;
        } catch {
          return errorJson("Invalid JSON body", 400);
        }
        if (
          typeof body?.jackpotId !== "number" ||
          typeof body?.amount !== "number" ||
          typeof body?.backofficeUser !== "string" ||
          typeof body?.isSeed !== "boolean"
        ) {
          return errorJson(
            "Body must be { jackpotId: number, amount: number, backofficeUser: string, isSeed: boolean }",
            400,
          );
        }
        const updated = await applyTopup(brand, body, extractAuditContext(request, brand));
        if (!updated) return errorJson(`Jackpot ${body.jackpotId} not found`, 404);
        return json(updated);
      },
    },
  },
});
